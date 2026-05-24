"use client"

import { useEffect, useRef } from 'react'
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase'
import { doc } from 'firebase/firestore'

/**
 * DynamicFavicon - Aggressively synchronizes the browser tab icon.
 * Pauses MutationObserver updates during internal writes to prevent infinite CPU loops.
 */
export default function DynamicFavicon() {
  const db = useFirestore()
  const settingsRef = useMemoFirebase(() => (db ? doc(db, 'settings', 'site-config') : null), [db])
  const { data: settings } = useDoc(settingsRef)
  const observerRef = useRef<MutationObserver | null>(null)

  useEffect(() => {
    // The primary default icon URL
    const primaryIconUrl = 'https://i.postimg.cc/MZg1CbGc/1441541546-(1)-Photoroom.png';
    
    // Use admin override if present, otherwise fall back to primary
    const targetUrl = settings?.faviconUrl || settings?.logoUrl || primaryIconUrl;

    const applyIcon = () => {
      // Temporarily disconnect observer to prevent infinite loops during our own updates
      if (observerRef.current) {
        observerRef.current.disconnect();
      }

      try {
        // Selectors for all common favicon and touch icon variants
        const selectors = [
          'link[rel*="icon"]',
          'link[rel="apple-touch-icon"]',
          'link[rel="shortcut icon"]'
        ];
        
        const existingLinks = document.querySelectorAll(selectors.join(','));
        // Resolve relative targetUrl to absolute URL to match what the browser returns in l.href
        const absoluteTargetUrl = new URL(targetUrl, window.location.href).href;

        if (existingLinks.length > 0) {
          // Claim every existing tag to prevent default icons from showing
          existingLinks.forEach(link => {
            const l = link as HTMLLinkElement;
            if (l.href !== absoluteTargetUrl) {
              l.href = absoluteTargetUrl;
            }
          });
        } else {
          // Create a new primary icon if none exist
          const newLink = document.createElement('link');
          newLink.rel = 'icon';
          newLink.href = absoluteTargetUrl;
          document.head.appendChild(newLink);
        }
      } catch (err) {
        console.error("DynamicFavicon: applyIcon error:", err);
      }

      // Reconnect observer after updates are applied
      if (observerRef.current) {
        observerRef.current.observe(document.head, { 
          childList: true, 
          subtree: true, 
          attributes: true,
          attributeFilter: ['href', 'rel'] 
        });
      }
    };

    // Execute immediately on mount/update
    applyIcon();

    // 1. Polling fallback: Check every 3 seconds to ensure icon persistence
    const pollingInterval = setInterval(applyIcon, 3000);

    // 2. MutationObserver: Watch the <head> for any external attempts to modify icons
    const observer = new MutationObserver((mutations) => {
      let hasExternalMutation = false;
      for (const mutation of mutations) {
        if (mutation.type === 'childList' || mutation.type === 'attributes') {
          hasExternalMutation = true;
          break;
        }
      }
      if (hasExternalMutation) {
        applyIcon();
      }
    });

    observerRef.current = observer;

    observer.observe(document.head, { 
      childList: true, 
      subtree: true, 
      attributes: true,
      attributeFilter: ['href', 'rel'] 
    });
    
    return () => {
      clearInterval(pollingInterval);
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };

  }, [settings?.faviconUrl, settings?.logoUrl])

  return null
}


"use client"

import { useEffect } from 'react'
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase'
import { doc } from 'firebase/firestore'

/**
 * DynamicFavicon - Force-synchronizes the browser tab icon with settings from Firestore.
 * This component aggressively finds all existing icon links and replaces them to ensure
 * custom branding overrides any default framework or host icons.
 */
export default function DynamicFavicon() {
  const db = useFirestore()
  const settingsRef = useMemoFirebase(() => (db ? doc(db, 'settings', 'site-config') : null), [db])
  const { data: settings } = useDoc(settingsRef)

  useEffect(() => {
    // The specific primary icon provided by the user
    const primaryIconUrl = 'https://i.postimg.cc/MZg1CbGc/1441541546-(1)-Photoroom.png';
    // Use admin override if present, otherwise fall back to primary
    const targetUrl = settings?.faviconUrl || settings?.logoUrl || primaryIconUrl;

    const applyIcon = () => {
      // Selectors for all common favicon and touch icon variants
      const selectors = [
        'link[rel*="icon"]',
        'link[rel="apple-touch-icon"]',
        'link[rel="shortcut icon"]'
      ];
      
      const existingLinks = document.querySelectorAll(selectors.join(','));
      
      // Use cache-busting timestamp to force immediate browser refresh
      const dynamicHref = `${targetUrl}${targetUrl.includes('?') ? '&' : '?'}cache=${Date.now()}`;

      if (existingLinks.length > 0) {
        // Claim every existing tag to prevent default icons from showing
        existingLinks.forEach(link => {
          (link as HTMLLinkElement).href = dynamicHref;
        });
      } else {
        // Create a new primary icon if none exist
        const newLink = document.createElement('link');
        newLink.rel = 'icon';
        newLink.href = dynamicHref;
        document.head.appendChild(newLink);
      }
    };

    // Execute immediately on mount/update
    applyIcon();

    // Redundancy check: Some frameworks re-inject icons after the initial render.
    // We do a delayed check to ensure our custom icon stays at the top.
    const timer = setTimeout(applyIcon, 1500);
    
    return () => clearTimeout(timer);

  }, [settings?.faviconUrl, settings?.logoUrl])

  return null
}

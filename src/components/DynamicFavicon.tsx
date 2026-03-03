
"use client"

import { useEffect } from 'react'
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase'
import { doc } from 'firebase/firestore'

/**
 * DynamicFavicon - Synchronizes the browser tab icon with settings from Firestore.
 * This component finds all existing icon links and replaces them to ensure
 * dynamic branding works instantly without browser cache issues.
 */
export default function DynamicFavicon() {
  const db = useFirestore()
  const settingsRef = useMemoFirebase(() => (db ? doc(db, 'settings', 'site-config') : null), [db])
  const { data: settings } = useDoc(settingsRef)

  useEffect(() => {
    // Only proceed if a dynamic override exists in the database
    const iconUrl = settings?.faviconUrl || settings?.logoUrl;
    if (!iconUrl) return;

    /**
     * Finds and replaces all instances of a specific relation link.
     */
    const updateIconTags = (rel: string) => {
      const selector = `link[rel*="${rel}"]`;
      const existingLinks = document.querySelectorAll(selector);
      
      // Use cache-busting timestamp to force immediate refresh
      const dynamicHref = `${iconUrl}${iconUrl.includes('?') ? '&' : '?'}t=${Date.now()}`;

      if (existingLinks.length > 0) {
        existingLinks.forEach(link => {
          (link as HTMLLinkElement).href = dynamicHref;
        });
      } else {
        const newLink = document.createElement('link');
        newLink.rel = rel;
        newLink.href = dynamicHref;
        document.head.appendChild(newLink);
      }
    };

    // Synchronize all standard icon types
    updateIconTags('icon');
    updateIconTags('apple-touch-icon');
    updateIconTags('shortcut icon');

  }, [settings?.faviconUrl, settings?.logoUrl])

  return null
}

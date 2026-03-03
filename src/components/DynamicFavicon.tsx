
"use client"

import { useEffect } from 'react'
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase'
import { doc } from 'firebase/firestore'

/**
 * DynamicFavicon - Synchronizes the browser tab icon with settings from Firestore.
 * This component removes any static/hardcoded favicons and ensures only the user-defined
 * logo or favicon URL is displayed in the web tab.
 */
export default function DynamicFavicon() {
  const db = useFirestore()
  const settingsRef = useMemoFirebase(() => (db ? doc(db, 'settings', 'site-config') : null), [db])
  const { data: settings } = useDoc(settingsRef)

  useEffect(() => {
    // Priority: faviconUrl, fallback to logoUrl, fallback to null
    const iconUrl = settings?.faviconUrl || settings?.logoUrl;

    const updateFaviconTags = (url: string | null) => {
      // 1. Remove all existing favicon and icon tags to ensure no conflicts
      const selectors = [
        "link[rel*='icon']",
        "link[rel='apple-touch-icon']",
        "link[rel='shortcut icon']"
      ];
      
      selectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => el.remove());
      });

      if (url) {
        // 2. Inject the dynamic icon provided in the Admin panel
        const link = document.createElement('link');
        link.rel = 'icon';
        link.href = url;
        document.head.appendChild(link);
        
        // Ensure high-resolution icon for mobile bookmarks
        const appleLink = document.createElement('link');
        appleLink.rel = 'apple-touch-icon';
        appleLink.href = url;
        document.head.appendChild(appleLink);
        
        const shortcutLink = document.createElement('link');
        shortcutLink.rel = 'shortcut icon';
        shortcutLink.href = url;
        document.head.appendChild(shortcutLink);
      }
    };

    updateFaviconTags(iconUrl || null);
  }, [settings?.faviconUrl, settings?.logoUrl])

  return null
}

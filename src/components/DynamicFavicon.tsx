
"use client"

import { useEffect } from 'react'
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase'
import { doc } from 'firebase/firestore'

/**
 * DynamicFavicon - Synchronizes the browser tab icon with the favicon URL defined in site settings.
 */
export default function DynamicFavicon() {
  const db = useFirestore()
  const settingsRef = useMemoFirebase(() => (db ? doc(db, 'settings', 'site-config') : null), [db])
  const { data: settings } = useDoc(settingsRef)

  useEffect(() => {
    // Priority: faviconUrl, fallback to logoUrl, fallback to nothing
    const iconUrl = settings?.faviconUrl || settings?.logoUrl;

    if (iconUrl) {
      const updateFavicon = (url: string) => {
        // Remove all existing icon links to prevent conflicts
        const existingIcons = document.querySelectorAll("link[rel*='icon']");
        existingIcons.forEach(el => el.parentNode?.removeChild(el));

        // Create new link for the favicon
        const link = document.createElement('link');
        link.type = 'image/x-icon';
        link.rel = 'icon';
        link.href = url;

        // Also add a shortcut icon for better compatibility
        const shortcutLink = document.createElement('link');
        shortcutLink.rel = 'shortcut icon';
        shortcutLink.href = url;

        const head = document.getElementsByTagName('head')[0];
        if (head) {
          head.appendChild(link);
          head.appendChild(shortcutLink);
        }
      };

      updateFavicon(iconUrl);
    }
  }, [settings?.faviconUrl, settings?.logoUrl])

  return null
}

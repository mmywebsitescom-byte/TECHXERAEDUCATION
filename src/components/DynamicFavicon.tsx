
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
        // Find existing icon links
        const existingIcons = document.querySelectorAll("link[rel*='icon']");
        
        if (existingIcons.length > 0) {
          // Update existing ones instead of removing them to avoid hydration/Next.js metadata conflicts
          existingIcons.forEach((el) => {
            (el as HTMLLinkElement).href = url;
          });
        } else {
          // Create new link for the favicon if none exist
          const link = document.createElement('link');
          link.rel = 'icon';
          link.href = url;
          document.head.appendChild(link);
          
          const shortcutLink = document.createElement('link');
          shortcutLink.rel = 'shortcut icon';
          shortcutLink.href = url;
          document.head.appendChild(shortcutLink);
        }
      };

      updateFavicon(iconUrl);
    }
  }, [settings?.faviconUrl, settings?.logoUrl])

  return null
}

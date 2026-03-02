
"use client"

import { useEffect } from 'react'
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase'
import { doc } from 'firebase/firestore'

/**
 * DynamicFavicon - Synchronizes the browser tab icon with the logo URL defined in site settings.
 * It removes existing static icons to ensure the custom logo is prioritized.
 */
export default function DynamicFavicon() {
  const db = useFirestore()
  const settingsRef = useMemoFirebase(() => (db ? doc(db, 'settings', 'site-config') : null), [db])
  const { data: settings } = useDoc(settingsRef)

  useEffect(() => {
    if (settings?.logoUrl) {
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

        document.getElementsByTagName('head')[0].appendChild(link);
        document.getElementsByTagName('head')[0].appendChild(shortcutLink);
        
        // Force refresh for certain browsers by appending a timestamp if needed
        // but usually just replacing the elements is enough.
      };

      updateFavicon(settings.logoUrl);
    }
  }, [settings?.logoUrl])

  return null
}

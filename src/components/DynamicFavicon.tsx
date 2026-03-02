
"use client"

import { useEffect } from 'react'
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase'
import { doc } from 'firebase/firestore'

/**
 * DynamicFavicon - Synchronizes the browser tab icon with the logo URL defined in site settings.
 */
export default function DynamicFavicon() {
  const db = useFirestore()
  const settingsRef = useMemoFirebase(() => (db ? doc(db, 'settings', 'site-config') : null), [db])
  const { data: settings } = useDoc(settingsRef)

  useEffect(() => {
    if (settings?.logoUrl) {
      // Find existing favicon or create a new one
      let link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
      
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.getElementsByTagName('head')[0].appendChild(link);
      }

      // Update the favicon URL
      link.href = settings.logoUrl;
      
      // Update shortcut icon for older browsers
      let shortcutLink: HTMLLinkElement | null = document.querySelector("link[rel='shortcut icon']");
      if (shortcutLink) {
        shortcutLink.href = settings.logoUrl;
      }
    }
  }, [settings?.logoUrl])

  return null
}

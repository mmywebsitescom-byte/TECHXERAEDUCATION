
"use client"

import { useEffect } from 'react'
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase'
import { doc } from 'firebase/firestore'

/**
 * DynamicFavicon - Synchronizes the browser tab icon with settings from Firestore.
 * Uses cache-busting and tag-claiming to ensure instant updates.
 */
export default function DynamicFavicon() {
  const db = useFirestore()
  const settingsRef = useMemoFirebase(() => (db ? doc(db, 'settings', 'site-config') : null), [db])
  const { data: settings } = useDoc(settingsRef)

  useEffect(() => {
    // Priority: Explicit faviconUrl > Logo URL
    const iconUrl = settings?.faviconUrl || settings?.logoUrl;
    if (!iconUrl) return;

    /**
     * Updates or creates a link tag in the document head.
     */
    const updateIcon = (id: string, rel: string, href: string) => {
      let link = document.getElementById(id) as HTMLLinkElement;
      
      // If not found by ID, try to find an existing standard tag to reuse
      if (!link) {
        const existing = document.querySelector(`link[rel*="icon"]`) as HTMLLinkElement;
        if (existing) {
          link = existing;
          link.id = id;
        } else {
          link = document.createElement('link');
          link.id = id;
          link.rel = rel;
          document.head.appendChild(link);
        }
      }

      // Apply the new URL with a timestamp to bypass browser icon caching
      const separator = href.includes('?') ? '&' : '?';
      link.href = `${href}${separator}t=${Date.now()}`;
    };

    // Update standard icon
    updateIcon('techxera-dynamic-icon', 'icon', iconUrl);
    // Update Apple touch icon (for mobile bookmarks)
    updateIcon('techxera-dynamic-apple', 'apple-touch-icon', iconUrl);

  }, [settings?.faviconUrl, settings?.logoUrl])

  return null
}


"use client"

import { useEffect } from 'react'
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase'
import { doc } from 'firebase/firestore'

/**
 * DynamicFavicon - Synchronizes the browser tab icon with settings from Firestore.
 * This version uses a robust "claim and update" strategy to avoid conflicts
 * with framework-managed tags and aggressive browser icon caching.
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
     * Updates or creates a link tag.
     * We try to find existing tags injected by the system and "claim" them by adding our ID.
     * This prevents browser confusion and React hydration errors.
     */
    const updateIcon = (id: string, rel: string, href: string) => {
      // 1. Try to find by our specific ID
      let link = document.getElementById(id) as HTMLLinkElement;
      
      // 2. If not found, look for any existing tag with this rel that hasn't been claimed yet
      if (!link) {
        const untagged = document.querySelector(`link[rel="${rel}"]:not([id^="techxera-dynamic-"])`) as HTMLLinkElement;
        if (untagged) {
          link = untagged;
          link.id = id;
        }
      }

      // 3. If still not found, create a new one
      if (!link) {
        link = document.createElement('link');
        link.id = id;
        link.rel = rel;
        document.head.appendChild(link);
      }

      // 4. Apply the new URL with a timestamp to bypass browser favicon caching
      const separator = href.includes('?') ? '&' : '?';
      link.href = `${href}${separator}t=${Date.now()}`;
    };

    // Update standard icon
    updateIcon('techxera-dynamic-icon', 'icon', iconUrl);
    // Update shortcut icon (legacy support)
    updateIcon('techxera-dynamic-shortcut', 'shortcut icon', iconUrl);
    // Update Apple touch icon (iOS/Mobile bookmarks)
    updateIcon('techxera-dynamic-apple', 'apple-touch-icon', iconUrl);

  }, [settings?.faviconUrl, settings?.logoUrl])

  return null
}

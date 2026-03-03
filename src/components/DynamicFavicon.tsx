
"use client"

import { useEffect } from 'react'
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase'
import { doc } from 'firebase/firestore'

/**
 * DynamicFavicon - Synchronizes the browser tab icon with settings from Firestore.
 * This version uses specific IDs to manage its own link tags, avoiding destructive
 * removal of tags managed by Next.js metadata which causes 'removeChild' crashes.
 */
export default function DynamicFavicon() {
  const db = useFirestore()
  const settingsRef = useMemoFirebase(() => (db ? doc(db, 'settings', 'site-config') : null), [db])
  const { data: settings } = useDoc(settingsRef)

  useEffect(() => {
    const iconUrl = settings?.faviconUrl || settings?.logoUrl;
    if (!iconUrl) return;

    /**
     * Helper to update or create a head link tag.
     * We use IDs to ensure we only touch tags we created.
     */
    const setLink = (id: string, rel: string, href: string) => {
      let link = document.getElementById(id) as HTMLLinkElement;
      if (!link) {
        link = document.createElement('link');
        link.id = id;
        link.rel = rel;
        document.head.appendChild(link);
      }
      link.href = href;
    };

    // Safely update icons using dedicated IDs
    setLink('techxera-dynamic-icon', 'icon', iconUrl);
    setLink('techxera-dynamic-apple', 'apple-touch-icon', iconUrl);
    setLink('techxera-dynamic-shortcut', 'shortcut icon', iconUrl);

  }, [settings?.faviconUrl, settings?.logoUrl])

  return null
}

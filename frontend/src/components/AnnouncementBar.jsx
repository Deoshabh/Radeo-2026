'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { FiX } from 'react-icons/fi';
import { useSiteSettings } from '@/context/SiteSettingsContext';

export default function AnnouncementBar() {
  const { settings } = useSiteSettings();
  const announcement = settings.announcementBar || {};
  const [dismissed, setDismissed] = useState(false);

  const storageKey = useMemo(() => {
    const seed = `${announcement.text || ''}::${announcement.link || ''}`;
    return `announcement-dismissed-${seed}`;
  }, [announcement.text, announcement.link]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    setDismissed(Boolean(sessionStorage.getItem(storageKey)));
  }, [storageKey]);

  // Auto-dismiss after 5 seconds
  useEffect(() => {
    if (!announcement.enabled || dismissed) return;
    const timer = setTimeout(() => {
      setDismissed(true);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(storageKey, '1');
      }
    }, 5000);
    return () => clearTimeout(timer);
  }, [announcement.enabled, dismissed, storageKey]);

  if (!announcement.enabled) {
    return null;
  }

  if (announcement.dismissible && dismissed) {
    return null;
  }

  const handleDismiss = () => {
    setDismissed(true);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(storageKey, '1');
    }
  };

  return (
    <div
      className="relative px-4 py-2 text-center text-sm font-medium transition-colors duration-300"
      style={{
        backgroundColor: announcement.backgroundColor,
        color: announcement.textColor,
      }}
    >
      {announcement.link ? (
        <Link href={announcement.link} className="hover:underline">
          {announcement.text}
        </Link>
      ) : (
        <span>{announcement.text}</span>
      )}

      {announcement.dismissible !== false && (
        <button
          onClick={handleDismiss}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-black/10 rounded-full transition-colors"
          aria-label="Dismiss"
        >
          <FiX className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

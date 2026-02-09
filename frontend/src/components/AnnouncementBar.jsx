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

  if (!announcement.enabled) {
    return null;
  }

  if (announcement.dismissible && dismissed) {
    return null;
  }

  const content = (
    <span className="font-medium">
      {announcement.text}
    </span>
  );

  const handleDismiss = () => {
    setDismissed(true);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(storageKey, '1');
    }
  };

  return (
    <div
      style={{
        backgroundColor: announcement.backgroundColor || '#10b981',
        color: announcement.textColor || '#ffffff',
      }}
      className="w-full"
    >
      <div className="container-custom py-2 flex items-center justify-center gap-3 text-sm text-center">
        {announcement.link ? (
          <Link href={announcement.link} className="hover:underline">
            {content}
          </Link>
        ) : (
          content
        )}
        {announcement.dismissible && (
          <button
            type="button"
            onClick={handleDismiss}
            className="p-1 rounded hover:bg-black/10"
            aria-label="Dismiss announcement"
          >
            <FiX className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

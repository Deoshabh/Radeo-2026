'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function VisualEditorPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/cms');
  }, [router]);

  return null;
}

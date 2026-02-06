'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function CategoryDetailPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug;

  useEffect(() => {
    if (slug) {
      // Redirect to products page with category filter (URL-encoded)
      router.replace(`/products?category=${encodeURIComponent(slug)}`);
    }
  }, [slug, router]);

  // Show fallback if no slug
  if (!slug) {
    return (
      <div className="min-h-screen bg-primary-50 pt-24 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Invalid category</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary-50 pt-24 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-900"></div>
    </div>
  );
}

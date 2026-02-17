import { notFound } from 'next/navigation';
import CmsPageRenderer from '@/components/storefront/CmsPageRenderer';
import { generateMetadata as generateSEOMetadata } from '@/utils/seo';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getCmsPage(slug) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/cms/pages/${slug}`, {
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) return null;
    const data = await response.json();
    return data?.page || null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }) {
  const page = await getCmsPage(params.slug);

  if (!page) {
    return { title: 'Page Not Found | Radeo', robots: { index: false } };
  }

  return generateSEOMetadata({
    title: page.title || page.name,
    description: page.metaDescription || page.description || `${page.title || page.name} - Radeo`,
    url: `https://radeo.in/pages/${params.slug}`,
    keywords: page.metaKeywords || [],
  });
}

export default async function CmsDynamicPage({ params }) {
  const page = await getCmsPage(params.slug);

  if (!page) {
    notFound();
  }

  return (
    <>
      <CmsPageRenderer blocks={page.blocks || []} />
    </>
  );
}

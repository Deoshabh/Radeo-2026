import { generateCategoryMetadata } from '@/utils/seo';
import getApiUrl from '@/utils/getApiUrl';
import CategoriesClient from './CategoriesClient';

async function fetchCategories() {
  try {
    const apiUrl = getApiUrl();
    const res = await fetch(`${apiUrl}/categories`, {
      next: { revalidate: 300 }, // Cache for 5 minutes
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.categories || [];
  } catch {
    return [];
  }
}

export async function generateMetadata() {
  const categories = await fetchCategories();
  const categoryNames = categories.map((c) => c.name).join(', ');
  return generateCategoryMetadata({
    name: 'All Categories',
    slug: 'categories',
    description: `Browse our complete collection of handcrafted shoes. Categories: ${categoryNames || 'Premium footwear'}`,
    keywords: [
      'shoe categories',
      'footwear collection',
      'handcrafted shoes',
      ...categories.map((c) => c.name.toLowerCase()),
    ],
  });
}

export default async function AllCategoriesPage() {
  const categories = await fetchCategories();

  return (
    <div className="min-h-screen" style={{ background: '#F7F5F1' }}>
      <div className="max-w-[1200px] mx-auto px-6 lg:px-10 py-20">

        {/* Header */}
        <div className="mb-16">
          <p
            className="mb-3 uppercase"
            style={{
              fontFamily: "var(--font-dm-mono, 'Space Mono', monospace)",
              fontSize: '10px',
              letterSpacing: '0.35em',
              color: '#B8973A',
              display: 'flex',
              alignItems: 'center',
              gap: '0.8rem',
            }}
          >
            <span style={{ display: 'inline-block', width: '24px', height: '1px', background: '#B8973A' }} />
            Browse
          </p>
          <h1
            style={{
              fontFamily: "var(--font-playfair, 'Cormorant Garamond', serif)",
              fontSize: 'clamp(2.4rem, 5vw, 3.2rem)',
              fontWeight: 400,
              lineHeight: 1.1,
              color: '#1A1714',
              marginBottom: '12px',
            }}
          >
            Our Categories
          </h1>
          <p
            style={{
              fontFamily: "var(--font-cormorant, 'Libre Baskerville', serif)",
              fontSize: '1.1rem',
              lineHeight: 1.7,
              color: '#5A5047',
              maxWidth: '480px',
            }}
          >
            Explore our complete collection of handcrafted shoes organized by category
          </p>
          <div className="mt-10" style={{ width: '40px', height: '1px', background: '#B8973A' }} />
        </div>

        <CategoriesClient categories={categories} />
      </div>
    </div>
  );
}
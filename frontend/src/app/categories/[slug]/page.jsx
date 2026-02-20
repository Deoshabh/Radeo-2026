import { notFound } from 'next/navigation';
import { getApiUrl } from '@/utils/getApiUrl';
import { generateCategoryMetadata } from '@/utils/seo';
import CategoryProducts from './CategoryProducts';

export const revalidate = 60;

async function fetchCategory(slug) {
  const apiUrl = getApiUrl();
  try {
    const res = await fetch(`${apiUrl}/categories/${slug}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.category || null;
  } catch {
    return null;
  }
}

async function fetchCategoryProducts(slug, page = 1, limit = 24) {
  const apiUrl = getApiUrl();
  try {
    const res = await fetch(`${apiUrl}/products?category=${slug}&page=${page}&limit=${limit}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return { products: [], pagination: null };
    const data = await res.json();
    return {
      products: data.products || (Array.isArray(data) ? data : []),
      pagination: data.pagination || null,
    };
  } catch {
    return { products: [], pagination: null };
  }
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const category = await fetchCategory(slug);
  if (!category) {
    return { title: 'Category Not Found | RADEO' };
  }
  return generateCategoryMetadata(category);
}

export default async function CategoryPage({ params }) {
  const { slug } = await params;
  const category = await fetchCategory(slug);

  if (!category) {
    notFound();
  }

  const { products, pagination } = await fetchCategoryProducts(slug);

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
            Category
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
            {category.name}
          </h1>
          {category.description && (
            <p
              style={{
                fontFamily: "var(--font-cormorant, 'Libre Baskerville', serif)",
                fontSize: '1.1rem',
                lineHeight: 1.7,
                color: '#5A5047',
                maxWidth: '480px',
              }}
            >
              {category.description}
            </p>
          )}
          <div className="mt-10" style={{ width: '40px', height: '1px', background: '#B8973A' }} />
        </div>

        {/* Products */}
        <CategoryProducts
          initialProducts={products}
          initialPagination={pagination}
          categorySlug={slug}
          categoryName={category.name}
        />
      </div>
    </div>
  );
}

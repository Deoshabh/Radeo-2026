import { Suspense } from 'react';
import { getApiUrl } from '@/utils/getApiUrl';
import ProductsContent from './ProductsContent';

export const revalidate = 60; // ISR: regenerate every 60 seconds

export const metadata = {
  title: 'Our Collection | RADEO',
  description: 'Browse our curated collection of premium shoes. Filter by category, price, material, color, and size.',
};

const ITEMS_PER_PAGE = 24;

async function fetchFromAPI(endpoint) {
  const baseUrl = getApiUrl();
  try {
    const res = await fetch(`${baseUrl}${endpoint}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch (error) {
    console.error(`Failed to fetch ${endpoint}:`, error.message);
    return null;
  }
}

async function getInitialData() {
  const [productsData, categoriesData, materialsData, colorsData, sizesData, priceRangeData] = await Promise.all([
    fetchFromAPI(`/products?page=1&limit=${ITEMS_PER_PAGE}`),
    fetchFromAPI('/categories'),
    fetchFromAPI('/products/materials'),
    fetchFromAPI('/products/colors'),
    fetchFromAPI('/products/sizes'),
    fetchFromAPI('/products/price-range'),
  ]);

  // Parse products — support both { products, pagination } and array
  let products = [];
  let pagination = null;
  if (productsData) {
    if (productsData.pagination) {
      products = productsData.products || [];
      pagination = productsData.pagination;
    } else {
      products = Array.isArray(productsData) ? productsData : (productsData.products || []);
    }
  }

  const categories = Array.isArray(categoriesData) ? categoriesData : (categoriesData?.categories || []);
  const materials = Array.isArray(materialsData) ? materialsData : [];
  const colors = Array.isArray(colorsData) ? colorsData : [];
  const sizes = Array.isArray(sizesData) ? sizesData : [];
  const priceRange = priceRangeData || { min: 0, max: 100000 };

  return { products, pagination, categories, materials, colors, sizes, priceRange };
}

export default async function ProductsPage() {
  const data = await getInitialData();

  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[color:var(--color-page-bg)] pt-8">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
          <div className="w-48 h-8 bg-[#e8e0d0] animate-pulse mb-8"></div>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="hidden lg:block h-96 bg-[color:var(--color-subtle-bg)] animate-pulse"></div>
            <div className="lg:col-span-3 grid grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="aspect-[4/5] bg-[color:var(--color-subtle-bg)] animate-pulse"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    }>
      <ProductsContent
        initialProducts={data.products}
        initialPagination={data.pagination}
        initialCategories={data.categories}
        initialMaterials={data.materials}
        initialColors={data.colors}
        initialSizes={data.sizes}
        initialPriceRange={data.priceRange}
      />
    </Suspense>
  );
}

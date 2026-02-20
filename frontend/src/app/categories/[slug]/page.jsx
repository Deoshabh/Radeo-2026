import { redirect } from 'next/navigation';

// Redirect /categories/:slug to /products?category=:slug
// The products page handles category filtering natively
export default function CategoryPage({ params }) {
  const { slug } = params;
  redirect(`/products?category=${slug}`);
}

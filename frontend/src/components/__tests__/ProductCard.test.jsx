import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProductCard from '@/components/ProductCard';

// Mock contexts
jest.mock('@/context/CartContext', () => ({
  useCart: () => ({
    addToCart: jest.fn(),
  }),
}));

jest.mock('@/context/WishlistContext', () => ({
  useWishlist: () => ({
    toggleWishlist: jest.fn(),
    isInWishlist: jest.fn(() => false),
  }),
}));

jest.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    isAuthenticated: true,
  }),
}));

describe('ProductCard Component', () => {
  const mockProduct = {
    _id: '123',
    name: 'Test Shoe',
    slug: 'test-shoe',
    price: 2500,
    description: 'A test shoe description',
    images: [{ url: '/test-image.jpg' }],
    category: { name: 'Formal' },
    sizes: ['7', '8', '9'],
    inStock: true,
  };

  it('renders product information correctly', () => {
    render(<ProductCard product={mockProduct} />);

    expect(screen.getByText('Test Shoe')).toBeInTheDocument();
    expect(screen.getByText('₹2,500')).toBeInTheDocument();
    expect(screen.getByText('Formal')).toBeInTheDocument();
    expect(screen.getByText('3 sizes')).toBeInTheDocument();
  });

  it('displays unavailable badge when out of stock', () => {
    const outOfStockProduct = { ...mockProduct, inStock: false };
    render(<ProductCard product={outOfStockProduct} />);

    expect(screen.getByText('Unavailable')).toBeInTheDocument();
    expect(screen.getByText('Out of Stock')).toBeInTheDocument();
  });

  it('shows hover buttons when in stock', () => {
    render(<ProductCard product={mockProduct} />);

    expect(screen.getByText('Buy Now')).toBeInTheDocument();
    expect(screen.getByText('Add to Cart')).toBeInTheDocument();
  });
});

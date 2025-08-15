import React from 'react';
import { render, screen } from '@testing-library/react';
import Navbar from '../Navbar';
import { BRAND_TITLE, NAV_LINKS, LOGIN, SEARCH_PLACEHOLDER } from '@/constants';

// Mock NextAuth's useSession hook
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(() => ({ data: null, status: 'unauthenticated' })),
  signIn: jest.fn(),
  signOut: jest.fn(),
}));

// Mock the Zustand store
jest.mock('@/store/cart', () => ({
  useCartStore: jest.fn(() => 0),
}));

describe('Navbar', () => {
  beforeEach(() => {
    render(<Navbar />);
  });

  it('renders the brand title', () => {
    expect(screen.getByText(BRAND_TITLE)).toBeInTheDocument();
  });

  it('renders all navigation links', () => {
    NAV_LINKS.forEach(link => {
      // The NavLinks are hidden on mobile, so the test needs to account for that.
      // For this test, we assume a desktop view where they are visible.
      // If tests were running in a JSDOM env that simulated mobile, this might fail.
      // A better approach would be to check for the link's existence regardless of visibility,
      // or to set the viewport in the test setup.
      expect(screen.getByText(link.label)).toBeInTheDocument();
    });
  });

  it('renders the search input', () => {
    expect(screen.getByPlaceholderText(SEARCH_PLACEHOLDER)).toBeInTheDocument();
  });

  it('renders the login button when not authenticated', () => {
    expect(screen.getByRole('button', { name: LOGIN })).toBeInTheDocument();
  });

  it('renders the cart button', () => {
    expect(screen.getByTestId('cart-button')).toBeInTheDocument();
  });
});

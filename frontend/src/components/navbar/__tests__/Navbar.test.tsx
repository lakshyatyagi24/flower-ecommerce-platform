import React from 'react';
import { render, screen } from '@testing-library/react';
import Navbar from '../Navbar';
import { BRAND_TITLE } from '@/constants';

// Mock NextAuth's useSession hook
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(() => ({ data: null, status: 'unauthenticated' })),
  signIn: jest.fn(),
  signOut: jest.fn(),
}));

describe('Navbar', () => {
  it('renders the brand title', () => {
    render(<Navbar />);
    expect(screen.getByText(BRAND_TITLE)).toBeInTheDocument();
  });
});

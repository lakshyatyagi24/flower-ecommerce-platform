import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { vi, describe, it, expect } from 'vitest'
import CheckoutPage from '../page'

// Stable references: a fresh object per render would retrigger the page's effects forever.
const router = { push: () => {}, replace: () => {} }
const cart = {
  items: [{ productId: 1, slug: 'rose', name: 'Rose', price: 100, quantity: 1, image: null, gstRate: 0 }],
  count: 1,
  clear: () => {},
}
const auth = { user: { id: 1, email: 'a@b.co', name: 'A', phone: '' }, loading: false }

vi.mock('next/navigation', () => ({ useRouter: () => router }))
vi.mock('@/lib/cart-context', () => ({
  formatINR: (n: number) => `₹${n}`,
  useCart: () => cart,
}))
vi.mock('@/lib/auth-context', () => ({ useAuth: () => auth }))
vi.mock('@/lib/api', () => {
  class ApiError extends Error {
    status: number
    constructor(m: string, s: number) {
      super(m)
      this.status = s
    }
  }
  return {
    ApiError,
    api: {
      getSettings: vi.fn().mockRejectedValue(new Error('settings down')),
      getProductBySlug: vi.fn().mockResolvedValue({ id: 1, price: 100, gstRate: 0 }),
      createOrder: vi.fn(),
    },
  }
})

describe('Checkout prerequisites', () => {
  it('shows an error and does NOT render the order form when settings fail to load', async () => {
    const { container } = render(<CheckoutPage />)
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument())
    expect(screen.getByRole('alert').textContent).toMatch(/couldn't load delivery charges/i)
    expect(container.querySelector('form')).toBeNull()
    expect(screen.queryByRole('button', { name: /place order/i })).toBeNull()
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
  })
})

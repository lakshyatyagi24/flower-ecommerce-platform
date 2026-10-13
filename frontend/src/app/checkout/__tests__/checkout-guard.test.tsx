import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import CheckoutPage from '../page'
import { api, ApiError } from '@/lib/api'

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
      getPaymentConfig: vi.fn().mockResolvedValue({ enabled: true }),
      getDeliveryOptions: vi.fn(async () => ({ earliest: '2026-10-14', latest: '2026-10-28', blackoutDates: [] })),
      getProductBySlug: vi.fn().mockResolvedValue({ id: 1, price: 100, gstRate: 0 }),
      createOrder: vi.fn(),
      checkPincode: vi.fn(async () => ({ serviceable: true, message: '' })),
    },
  }
})

const getSettings = api.getSettings as unknown as ReturnType<typeof vi.fn>
const getProductBySlug = api.getProductBySlug as unknown as ReturnType<typeof vi.fn>

beforeEach(() => {
  getSettings.mockReset().mockResolvedValue({ 'shipping.flatRate': '50' })
  getProductBySlug.mockReset().mockResolvedValue({ id: 1, price: 100, gstRate: 0 })
})

describe('Checkout prerequisites', () => {
  it('shows an error and does NOT render the order form when settings fail to load', async () => {
    getSettings.mockRejectedValue(new Error('settings down'))
    const { container } = render(<CheckoutPage />)
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument())
    expect(screen.getByRole('alert').textContent).toMatch(/couldn't load delivery charges/i)
    expect(container.querySelector('form')).toBeNull()
    expect(screen.queryByRole('button', { name: /place order/i })).toBeNull()
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
  })

  it('shows an error and no form when the price refresh fails with a non-404 error', async () => {
    getProductBySlug.mockRejectedValue(new ApiError('boom', 500, null))
    const { container } = render(<CheckoutPage />)
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument())
    expect(screen.getByRole('alert').textContent).toMatch(/couldn't load delivery charges/i)
    expect(container.querySelector('form')).toBeNull()
    expect(screen.queryByRole('button', { name: /place order/i })).toBeNull()
  })

  it('skips a 404 product and still renders the form without an error state', async () => {
    getProductBySlug.mockRejectedValue(new ApiError('not found', 404, null))
    const { container } = render(<CheckoutPage />)
    await waitFor(() => expect(container.querySelector('form')).not.toBeNull())
    expect(screen.queryByText(/couldn't load delivery charges/i)).toBeNull()
    expect(screen.getByRole('button', { name: /place order/i })).toBeInTheDocument()
  })

  it('renders the form and no error when settings and prices both load', async () => {
    const { container } = render(<CheckoutPage />)
    await waitFor(() => expect(container.querySelector('form')).not.toBeNull())
    expect(screen.getByPlaceholderText('+91 99999 11111')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /place order/i })).toBeInTheDocument()
    expect(screen.queryByText(/couldn't load delivery charges/i)).toBeNull()
  })
})

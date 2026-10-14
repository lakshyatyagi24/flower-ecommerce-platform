import React from 'react'
import { render, screen } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import CheckoutSuccessPage from '../page'
import { api } from '@/lib/api'
import { paymentLine } from '@/lib/order-labels'

const router = { push: vi.fn(), replace: vi.fn() }
const auth = { user: { id: 1, email: 'a@b.co', name: 'A', phone: '' }, loading: false }
const params = new URLSearchParams('orderId=9')

vi.mock('next/navigation', () => ({ useRouter: () => router, useSearchParams: () => params }))
vi.mock('@/lib/cart-context', () => ({ formatINR: (n: number) => `Rs${n}`, useCart: () => ({ clear: vi.fn() }) }))
vi.mock('@/lib/auth-context', () => ({ useAuth: () => auth }))
vi.mock('@/lib/api', () => ({
  ApiError: class extends Error {},
  api: { getMyOrder: vi.fn(), setOrderPaymentMethod: vi.fn(), getPaymentConfig: vi.fn() },
}))
vi.mock('@/lib/razorpay-flow', () => ({ payForOrder: vi.fn() }))

const getMyOrder = api.getMyOrder as unknown as ReturnType<typeof vi.fn>
const getPaymentConfig = api.getPaymentConfig as unknown as ReturnType<typeof vi.fn>

const order = {
  id: 9, total: 250, status: 'PAID', paymentMethod: 'RAZORPAY', paymentStatus: 'PAID',
  customerName: 'Asha Rao', shippingAddress: '12 Rose Street', city: 'Pune', postalCode: '411001',
  items: [{ id: 1, productName: 'Rose', quantity: 2, unitPrice: 100 }],
}

beforeEach(() => {
  window.sessionStorage.clear()
  getMyOrder.mockReset().mockResolvedValue(order)
  getPaymentConfig.mockReset().mockResolvedValue({ enabled: true })
})

describe('Checkout success details', () => {
  it('shows order number, payment line, delivery address, line totals and next-step links', async () => {
    render(<CheckoutSuccessPage />)
    await screen.findByText(/payment received/i)
    expect(screen.getByText('Order number').nextSibling).toHaveTextContent('#9')
    expect(screen.getByText('Payment').nextSibling).toHaveTextContent('Paid online')
    const address = screen.getByText('Delivering to').nextSibling as HTMLElement
    expect(address).toHaveTextContent('Asha Rao')
    expect(address).toHaveTextContent('12 Rose Street')
    expect(address).toHaveTextContent('Pune, 411001')
    expect(screen.getByText('Rose × 2')).toBeInTheDocument()
    expect(screen.getByText('Rs200')).toBeInTheDocument()
    expect(screen.getByText('Rs250')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'View my orders' })).toHaveAttribute('href', '/account/orders')
    expect(screen.getByRole('link', { name: 'Continue shopping' })).toHaveAttribute('href', '/products')
  })

  it('omits the address block when the order has none', async () => {
    getMyOrder.mockResolvedValue({ ...order, shippingAddress: null, city: null, postalCode: null })
    render(<CheckoutSuccessPage />)
    await screen.findByText(/payment received/i)
    expect(screen.queryByText('Delivering to')).toBeNull()
  })
})

describe('paymentLine', () => {
  it.each([
    [{ paymentMethod: 'RAZORPAY', paymentStatus: 'PAID', status: 'PAID' }, 'Paid online'],
    [{ paymentMethod: 'RAZORPAY', paymentStatus: 'PAID', status: 'CANCELLED' }, 'Paid online — refund due'],
    [{ paymentMethod: 'RAZORPAY', paymentStatus: 'REFUNDED', status: 'CANCELLED' }, 'Refunded'],
    [{ paymentMethod: 'COD', paymentStatus: 'UNPAID', status: 'PENDING' }, 'Cash on delivery'],
    [{ paymentMethod: 'RAZORPAY', paymentStatus: 'UNPAID', status: 'CANCELLED' }, 'Not paid'],
    [{ paymentMethod: 'RAZORPAY', paymentStatus: 'UNPAID', status: 'PENDING' }, 'Awaiting payment'],
  ] as const)('%j -> %s', (o, label) => {
    expect(paymentLine(o as never)).toBe(label)
  })
})

describe('Checkout success delivery date', () => {
  it('shows the chosen delivery date as a long date', async () => {
    getMyOrder.mockResolvedValue({ ...order, deliveryDate: '2026-10-14T00:00:00.000Z' })
    render(<CheckoutSuccessPage />)
    await screen.findByText(/payment received/i)
    expect(screen.getByText('Delivery date').nextSibling).toHaveTextContent('Wednesday, 14 October 2026')
  })

  it('omits the row for older orders without a delivery date', async () => {
    getMyOrder.mockResolvedValue({ ...order, deliveryDate: null })
    render(<CheckoutSuccessPage />)
    await screen.findByText(/payment received/i)
    expect(screen.queryByText('Delivery date')).toBeNull()
  })

  it('shows the coupon and discount line only when a discount was applied', async () => {
    getMyOrder.mockResolvedValue({ ...order, couponCode: 'SAVE10', discount: 25, total: 125 })
    render(<CheckoutSuccessPage />)
    await screen.findByText(/payment received/i)
    expect(screen.getByTestId('order-discount')).toHaveTextContent('Discount (SAVE10)')
    expect(screen.getByTestId('order-discount')).toHaveTextContent('-Rs25')
  })

  it('shows no discount line for orders without a coupon', async () => {
    getMyOrder.mockResolvedValue({ ...order, couponCode: null, discount: 0 })
    render(<CheckoutSuccessPage />)
    await screen.findByText(/payment received/i)
    expect(screen.queryByTestId('order-discount')).toBeNull()
  })
})

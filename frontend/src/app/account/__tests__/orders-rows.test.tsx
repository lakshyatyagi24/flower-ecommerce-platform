import React from 'react'
import { render, screen, within, fireEvent } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import MyOrdersPage from '../orders/page'
import { api } from '@/lib/api'
import { getTrackEmail } from '@/lib/track-order-session'

const router = { push: vi.fn(), replace: vi.fn() }
const auth = { user: { id: 1, email: 'a@b.co', name: 'A', phone: '' }, loading: false }

vi.mock('next/navigation', () => ({ useRouter: () => router }))
vi.mock('@/lib/cart-context', () => ({ formatINR: (n: number) => `Rs${n}`, useCart: () => ({ clear: vi.fn() }) }))
vi.mock('@/lib/auth-context', () => ({ useAuth: () => auth }))
vi.mock('@/lib/api', () => ({ api: { listMyOrders: vi.fn(), getMyOrder: vi.fn() }, ApiError: class extends Error {} }))
vi.mock('@/lib/razorpay-flow', () => ({ payForOrder: vi.fn() }))

const list = api.listMyOrders as unknown as ReturnType<typeof vi.fn>

beforeEach(() => {
  window.sessionStorage.clear()
  list.mockReset()
})

describe('My orders rows', () => {
  it('shows order number, item count, status, total and a details link that hands the email over', async () => {
    list.mockResolvedValue([
      {
        id: 7, subtotal: 300, shipping: 50, gst: 18, total: 368, createdAt: '2026-10-01T10:00:00Z',
        customerEmail: 'a@b.co', status: 'SHIPPED', paymentMethod: 'COD', paymentStatus: 'UNPAID',
        items: [
          { id: 1, productName: 'Rose', quantity: 2, unitPrice: 100 },
          { id: 2, productName: 'Lily', quantity: 1, unitPrice: 100 },
        ],
      },
    ])
    render(<MyOrdersPage />)
    const row = (await screen.findByRole('heading', { name: 'Order #7' })).closest('article') as HTMLElement
    expect(row).toHaveTextContent('3 items')
    expect(within(row).getByText('SHIPPED')).toBeInTheDocument()
    expect(within(row).getByText('Cash on delivery')).toBeInTheDocument()
    expect(within(row).getByText('Total').nextSibling).toHaveTextContent('Rs368')
    expect(within(row).getByText('Shipping').nextSibling).toHaveTextContent('Rs50')
    const link = within(row).getByRole('link', { name: /view details/i })
    expect(link).toHaveAttribute('href', '/track-order/results?orderId=7')
    fireEvent.click(link)
    expect(getTrackEmail()).toBe('a@b.co')
  })

  it('shows the empty state with a way to start shopping', async () => {
    list.mockResolvedValue([])
    render(<MyOrdersPage />)
    await screen.findByText(/don't have any orders yet/i)
    expect(screen.getByRole('link', { name: /start shopping/i })).toHaveAttribute('href', '/products')
  })

  it('shows an error state with a retry that reloads', async () => {
    list.mockRejectedValueOnce(new Error('Network down')).mockResolvedValue([])
    render(<MyOrdersPage />)
    await screen.findByText('Network down')
    fireEvent.click(screen.getByRole('button', { name: /try again/i }))
    await screen.findByText(/don't have any orders yet/i)
    expect(list).toHaveBeenCalledTimes(2)
  })
})

describe('My orders delivery date', () => {
  const base = {
    subtotal: 100, shipping: 0, total: 100, createdAt: '2026-10-01T10:00:00Z', customerEmail: 'a@b.co',
    status: 'PAID', paymentMethod: 'COD', paymentStatus: 'UNPAID', items: [{ id: 1, productName: 'Rose', quantity: 1, unitPrice: 100 }],
  }
  it('shows the delivery date on rows that have one and nothing on older rows', async () => {
    list.mockResolvedValue([
      { ...base, id: 8, deliveryDate: '2026-10-14T00:00:00.000Z' },
      { ...base, id: 9, deliveryDate: null },
    ])
    render(<MyOrdersPage />)
    const withDate = (await screen.findByRole('heading', { name: 'Order #8' })).closest('article') as HTMLElement
    const without = screen.getByRole('heading', { name: 'Order #9' }).closest('article') as HTMLElement
    expect(withDate).toHaveTextContent('Delivery date: Wednesday, 14 October 2026')
    expect(without).not.toHaveTextContent('Delivery date')
  })

  it('shows the coupon discount on an order that used one, not on one that did not', async () => {
    const base = {
      subtotal: 300, shipping: 50, gst: 0, createdAt: '2026-10-01T10:00:00Z', customerEmail: 'a@b.co', status: 'PENDING',
      paymentMethod: 'COD', paymentStatus: 'UNPAID', items: [{ id: 1, productName: 'Rose', quantity: 1, unitPrice: 300 }],
    }
    list.mockResolvedValue([
      { ...base, id: 7, total: 320, couponCode: 'SAVE10', discount: 30 },
      { ...base, id: 8, total: 350, couponCode: null, discount: 0 },
    ])
    render(<MyOrdersPage />)
    const used = (await screen.findByRole('heading', { name: 'Order #7' })).closest('article') as HTMLElement
    const plain = screen.getByRole('heading', { name: 'Order #8' }).closest('article') as HTMLElement
    expect(within(used).getByTestId('order-discount')).toHaveTextContent('Discount (SAVE10)')
    expect(within(used).getByTestId('order-discount')).toHaveTextContent('-Rs30')
    expect(within(plain).queryByTestId('order-discount')).toBeNull()
  })
})

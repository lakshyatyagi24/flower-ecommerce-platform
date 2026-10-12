import React from 'react'
import { render, screen, within, fireEvent, act } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import MyOrdersPage from '../orders/page'
import { api } from '@/lib/api'
import { payForOrder } from '@/lib/razorpay-flow'

const router = { push: vi.fn(), replace: vi.fn() }
const auth = { user: { id: 1, email: 'a@b.co', name: 'A', phone: '' }, loading: false }

vi.mock('next/navigation', () => ({ useRouter: () => router }))
vi.mock('@/lib/cart-context', () => ({ formatINR: (n: number) => `Rs${n}` }))
vi.mock('@/lib/auth-context', () => ({ useAuth: () => auth }))
vi.mock('@/lib/api', () => ({ api: { listMyOrders: vi.fn() } }))
vi.mock('@/lib/razorpay-flow', () => ({ payForOrder: vi.fn() }))

const list = api.listMyOrders as unknown as ReturnType<typeof vi.fn>
const pay = payForOrder as unknown as ReturnType<typeof vi.fn>

function order(id: number, over: Record<string, unknown>) {
  return {
    id, subtotal: 100, shipping: 0, total: 100, createdAt: '2026-10-01T10:00:00Z',
    customerEmail: 'a@b.co', status: 'PENDING', paymentMethod: 'RAZORPAY', paymentStatus: 'UNPAID',
    items: [{ id: id * 10, productName: 'Rose', quantity: 1, unitPrice: 100 }], ...over,
  }
}

beforeEach(() => {
  list.mockReset()
  pay.mockReset()
})

const card = (id: number) => screen.getByRole('heading', { name: `Order #${id}` }).closest('article') as HTMLElement

describe('My orders payment state', () => {
  beforeEach(() => {
    list.mockResolvedValue([
      order(1, {}),
      order(2, { status: 'PAID', paymentStatus: 'PAID' }),
      order(3, { paymentMethod: 'COD' }),
      order(4, { status: 'CANCELLED' }),
      order(5, { status: 'CANCELLED', paymentStatus: 'REFUNDED' }),
      order(6, { paymentStatus: 'FAILED' }),
    ])
  })

  it('shows Pay now only for pending online unpaid/failed orders', async () => {
    render(<MyOrdersPage />)
    await screen.findByRole('heading', { name: 'Order #1' })
    expect(within(card(1)).getByRole('button', { name: /pay now/i })).toBeInTheDocument()
    expect(within(card(6)).getByRole('button', { name: /pay now/i })).toBeInTheDocument()
    for (const id of [2, 3, 4, 5]) {
      expect(within(card(id)).queryByRole('button', { name: /pay now/i })).toBeNull()
    }
  })

  it('shows payment status text per order', async () => {
    render(<MyOrdersPage />)
    await screen.findByRole('heading', { name: 'Order #1' })
    expect(within(card(1)).getByText('Payment pending')).toBeInTheDocument()
    expect(within(card(2)).getByText('Paid')).toBeInTheDocument()
    expect(within(card(3)).getByText('Cash on delivery')).toBeInTheDocument()
    expect(within(card(5)).getByText('Refunded')).toBeInTheDocument()
    expect(within(card(4)).getByText('CANCELLED')).toBeInTheDocument()
  })

  it('Pay now calls payForOrder and refreshes the list on paid', async () => {
    render(<MyOrdersPage />)
    await screen.findByRole('heading', { name: 'Order #1' })
    fireEvent.click(within(card(1)).getByRole('button', { name: /pay now/i }))
    expect(pay).toHaveBeenCalledTimes(1)
    expect(pay.mock.calls[0][0]).toBe(1)
    expect(list).toHaveBeenCalledTimes(1)
    list.mockResolvedValue([order(1, { status: 'PAID', paymentStatus: 'PAID' })])
    await act(async () => pay.mock.calls[0][1].onPaid())
    expect(list).toHaveBeenCalledTimes(2)
    await screen.findByText('Paid')
    expect(screen.queryByRole('button', { name: /pay now/i })).toBeNull()
  })

  it('shows a payment error message on the order', async () => {
    render(<MyOrdersPage />)
    await screen.findByRole('heading', { name: 'Order #1' })
    fireEvent.click(within(card(1)).getByRole('button', { name: /pay now/i }))
    act(() => pay.mock.calls[0][1].onError('Online payment is temporarily unavailable.'))
    expect(within(card(1)).getByText(/temporarily unavailable/i)).toBeInTheDocument()
  })
})

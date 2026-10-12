import React from 'react'
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import CheckoutSuccessPage from '../page'
import { api, ApiError } from '@/lib/api'
import { payForOrder } from '@/lib/razorpay-flow'

const router = { push: vi.fn(), replace: vi.fn() }
const auth = { user: { id: 1, email: 'a@b.co', name: 'A', phone: '' }, loading: false }
const params = new URLSearchParams('orderId=9&paid=1')

vi.mock('next/navigation', () => ({
  useRouter: () => router,
  useSearchParams: () => params,
}))
vi.mock('@/lib/cart-context', () => ({ formatINR: (n: number) => `Rs${n}` }))
vi.mock('@/lib/auth-context', () => ({ useAuth: () => auth }))
vi.mock('@/lib/api', () => {
  class ApiError extends Error {
    status: number
    constructor(m: string, s: number, _p?: unknown) {
      super(m)
      this.status = s
    }
  }
  return { ApiError, api: { getMyOrder: vi.fn(), setOrderPaymentMethod: vi.fn() } }
})
vi.mock('@/lib/razorpay-flow', () => ({ payForOrder: vi.fn() }))

const getMyOrder = api.getMyOrder as unknown as ReturnType<typeof vi.fn>
const setMethod = api.setOrderPaymentMethod as unknown as ReturnType<typeof vi.fn>
const pay = payForOrder as unknown as ReturnType<typeof vi.fn>

const base = {
  id: 9, total: 150, items: [{ id: 1, productName: 'Rose', quantity: 1, unitPrice: 100 }],
  status: 'PENDING', paymentMethod: 'RAZORPAY', paymentStatus: 'UNPAID',
}

beforeEach(() => {
  getMyOrder.mockReset()
  setMethod.mockReset()
  pay.mockReset()
})

describe('Checkout success page states', () => {
  it('COD: order placed, pay on delivery', async () => {
    getMyOrder.mockResolvedValue({ ...base, paymentMethod: 'COD' })
    render(<CheckoutSuccessPage />)
    await screen.findByText(/pay on delivery/i)
    expect(screen.getByText(/order placed/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /pay now/i })).toBeNull()
  })

  it('RAZORPAY + PAID: payment received (ignores URL params)', async () => {
    getMyOrder.mockResolvedValue({ ...base, status: 'PAID', paymentStatus: 'PAID' })
    render(<CheckoutSuccessPage />)
    await screen.findByText(/payment received/i)
    expect(screen.queryByRole('button', { name: /pay now/i })).toBeNull()
  })

  it('RAZORPAY + PENDING + UNPAID: payment pending with Pay now and Switch to COD', async () => {
    getMyOrder.mockResolvedValue(base)
    render(<CheckoutSuccessPage />)
    await screen.findByRole('heading', { name: /payment pending/i })
    expect(screen.getByText(/30 minutes/i)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /pay now/i }))
    expect(pay).toHaveBeenCalledTimes(1)
    expect(pay.mock.calls[0][0]).toBe(9)
    expect(screen.getByRole('button', { name: /switch to cash on delivery/i })).toBeInTheDocument()
  })

  it('FAILED payment status also shows the pending state', async () => {
    getMyOrder.mockResolvedValue({ ...base, paymentStatus: 'FAILED' })
    render(<CheckoutSuccessPage />)
    await screen.findByRole('button', { name: /pay now/i })
  })

  it('onPaid reloads the order and shows payment received', async () => {
    getMyOrder.mockResolvedValueOnce(base)
    render(<CheckoutSuccessPage />)
    await screen.findByRole('button', { name: /pay now/i })
    fireEvent.click(screen.getByRole('button', { name: /pay now/i }))
    getMyOrder.mockResolvedValue({ ...base, status: 'PAID', paymentStatus: 'PAID' })
    act(() => pay.mock.calls[0][1].onPaid())
    await screen.findByText(/payment received/i)
  })

  it('Switch to COD calls the API then shows the COD state', async () => {
    getMyOrder.mockResolvedValueOnce(base)
    setMethod.mockResolvedValue({ ...base, paymentMethod: 'COD' })
    render(<CheckoutSuccessPage />)
    fireEvent.click(await screen.findByRole('button', { name: /switch to cash on delivery/i }))
    getMyOrder.mockResolvedValue({ ...base, paymentMethod: 'COD' })
    await screen.findByText(/pay on delivery/i)
    expect(setMethod).toHaveBeenCalledWith(9, 'a@b.co')
  })

  it('CANCELLED + payment PAID: refund notice', async () => {
    getMyOrder.mockResolvedValue({ ...base, status: 'CANCELLED', paymentStatus: 'PAID' })
    render(<CheckoutSuccessPage />)
    await screen.findByText(/payment was received after the order expired/i)
    expect(screen.getByText(/refund it/i)).toBeInTheDocument()
    expect(screen.getByText(/3 working days/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /contact/i })).toHaveAttribute('href', '/contact')
    expect(screen.queryByRole('button', { name: /pay now/i })).toBeNull()
  })

  it('CANCELLED + unpaid: expired notice with link to products', async () => {
    getMyOrder.mockResolvedValue({ ...base, status: 'CANCELLED', paymentStatus: 'UNPAID' })
    render(<CheckoutSuccessPage />)
    await screen.findByText(/this order expired because payment was not completed/i)
    expect(screen.getByRole('link', { name: /browse products/i })).toHaveAttribute('href', '/products')
    expect(screen.queryByRole('button', { name: /pay now/i })).toBeNull()
  })

  it('shows ErrorState when the order fails to load', async () => {
    getMyOrder.mockRejectedValue(new ApiError('boom', 500, null))
    render(<CheckoutSuccessPage />)
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument())
    expect(screen.getByText(/couldn't load your order details/i)).toBeInTheDocument()
  })
})

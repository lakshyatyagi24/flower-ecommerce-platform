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
const cart = { clear: vi.fn() }
vi.mock('@/lib/cart-context', () => ({ formatINR: (n: number) => `Rs${n}`, useCart: () => cart }))
vi.mock('@/lib/auth-context', () => ({ useAuth: () => auth }))
vi.mock('@/lib/api', () => {
  class ApiError extends Error {
    status: number
    constructor(m: string, s: number, _p?: unknown) {
      super(m)
      this.status = s
    }
  }
  return { ApiError, api: { getMyOrder: vi.fn(), setOrderPaymentMethod: vi.fn(), getPaymentConfig: vi.fn() } }
})
vi.mock('@/lib/razorpay-flow', () => ({ payForOrder: vi.fn() }))

const getMyOrder = api.getMyOrder as unknown as ReturnType<typeof vi.fn>
const setMethod = api.setOrderPaymentMethod as unknown as ReturnType<typeof vi.fn>
const getPaymentConfig = api.getPaymentConfig as unknown as ReturnType<typeof vi.fn>
const pay = payForOrder as unknown as ReturnType<typeof vi.fn>

const base = {
  id: 9, total: 150, items: [{ id: 1, productName: 'Rose', quantity: 1, unitPrice: 100 }],
  status: 'PENDING', paymentMethod: 'RAZORPAY', paymentStatus: 'UNPAID',
}

beforeEach(() => {
  window.sessionStorage.clear()
  cart.clear.mockReset()
  getMyOrder.mockReset()
  setMethod.mockReset()
  pay.mockReset()
  getPaymentConfig.mockReset().mockResolvedValue({ enabled: true })
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

  it('online payments disabled: Pay now is hidden but Switch to cash on delivery stays', async () => {
    getPaymentConfig.mockResolvedValue({ enabled: false })
    getMyOrder.mockResolvedValue(base)
    render(<CheckoutSuccessPage />)
    await screen.findByText('Payment pending')
    await waitFor(() => expect(getPaymentConfig).toHaveBeenCalled())
    await waitFor(() => expect(screen.queryByRole('button', { name: /pay now/i })).toBeNull())
    expect(screen.getByRole('button', { name: /switch to cash on delivery/i })).toBeInTheDocument()
  })

  it('a failed config request keeps Pay now (the order already exists)', async () => {
    getPaymentConfig.mockRejectedValue(new Error('down'))
    getMyOrder.mockResolvedValue(base)
    render(<CheckoutSuccessPage />)
    await screen.findByText('Payment pending')
    await waitFor(() => expect(getPaymentConfig).toHaveBeenCalled())
    expect(screen.getByRole('button', { name: /pay now/i })).toBeInTheDocument()
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

  it('paying from the success page clears the cart and the matching pending key, then shows payment received', async () => {
    window.sessionStorage.setItem('fp_pending_order', JSON.stringify({ id: 9, createdAt: Date.now() }))
    getMyOrder.mockResolvedValueOnce(base)
    render(<CheckoutSuccessPage />)
    await screen.findByRole('button', { name: /pay now/i })
    fireEvent.click(screen.getByRole('button', { name: /pay now/i }))
    getMyOrder.mockResolvedValue({ ...base, status: 'PAID', paymentStatus: 'PAID' })
    act(() => pay.mock.calls[0][1].onPaid())
    await screen.findByText(/payment received/i)
    expect(cart.clear).toHaveBeenCalled()
    expect(window.sessionStorage.getItem('fp_pending_order')).toBeNull()
  })

  it('refund-due from the success page also clears cart + key', async () => {
    window.sessionStorage.setItem('fp_pending_order', JSON.stringify({ id: 9, createdAt: Date.now() }))
    getMyOrder.mockResolvedValueOnce(base)
    render(<CheckoutSuccessPage />)
    fireEvent.click(await screen.findByRole('button', { name: /pay now/i }))
    getMyOrder.mockResolvedValue({ ...base, status: 'CANCELLED', paymentStatus: 'PAID' })
    act(() => pay.mock.calls[0][1].onRefundDue())
    await screen.findByText(/payment was received after the order expired/i)
    expect(cart.clear).toHaveBeenCalled()
    expect(window.sessionStorage.getItem('fp_pending_order')).toBeNull()
  })

  it('a pending key for a DIFFERENT order is left alone', async () => {
    const other = JSON.stringify({ id: 77, createdAt: Date.now() })
    window.sessionStorage.setItem('fp_pending_order', other)
    getMyOrder.mockResolvedValueOnce(base)
    render(<CheckoutSuccessPage />)
    fireEvent.click(await screen.findByRole('button', { name: /pay now/i }))
    getMyOrder.mockResolvedValue({ ...base, status: 'PAID', paymentStatus: 'PAID' })
    act(() => pay.mock.calls[0][1].onPaid())
    await screen.findByText(/payment received/i)
    expect(window.sessionStorage.getItem('fp_pending_order')).toBe(other)
  })

  it('Switch to COD confirms, re-checks, calls the API, clears cart + key and shows the COD state', async () => {
    window.sessionStorage.setItem('fp_pending_order', JSON.stringify({ id: 9, createdAt: Date.now() }))
    getMyOrder.mockResolvedValueOnce(base)
    getMyOrder.mockResolvedValueOnce(base) // pre-switch re-check
    setMethod.mockResolvedValue({ ...base, paymentMethod: 'COD' })
    render(<CheckoutSuccessPage />)
    fireEvent.click(await screen.findByRole('button', { name: /switch to cash on delivery/i }))
    expect(screen.getByText(/Only do this if you have not paid/i)).toBeInTheDocument()
    expect(setMethod).not.toHaveBeenCalled()
    getMyOrder.mockResolvedValue({ ...base, paymentMethod: 'COD' })
    fireEvent.click(screen.getByRole('button', { name: /yes, switch/i }))
    await screen.findByText(/pay on delivery/i)
    expect(setMethod).toHaveBeenCalledWith(9, 'a@b.co')
    expect(cart.clear).toHaveBeenCalled()
    expect(window.sessionStorage.getItem('fp_pending_order')).toBeNull()
  })

  it('Switch finds the order already PAID and never calls the switch API', async () => {
    getMyOrder.mockResolvedValueOnce(base)
    render(<CheckoutSuccessPage />)
    fireEvent.click(await screen.findByRole('button', { name: /switch to cash on delivery/i }))
    getMyOrder.mockResolvedValue({ ...base, status: 'PAID', paymentStatus: 'PAID' })
    fireEvent.click(screen.getByRole('button', { name: /yes, switch/i }))
    await screen.findByText(/payment received/i)
    expect(setMethod).not.toHaveBeenCalled()
    expect(cart.clear).toHaveBeenCalled()
  })

  it('payment errors use role=alert and offer Check status', async () => {
    getMyOrder.mockResolvedValueOnce(base)
    render(<CheckoutSuccessPage />)
    fireEvent.click(await screen.findByRole('button', { name: /pay now/i }))
    act(() => pay.mock.calls[0][1].onError('Order is cancelled'))
    expect(screen.getByRole('alert').textContent).toMatch(/Order is cancelled/)
    getMyOrder.mockResolvedValue({ ...base, status: 'CANCELLED' })
    fireEvent.click(screen.getByRole('button', { name: /check status/i }))
    await screen.findByText(/this order expired because payment was not completed/i)
  })

  it.each([
    ['REFUNDED', { paymentStatus: 'REFUNDED' }, /your payment was refunded/i],
    ['COD', { paymentMethod: 'COD' }, /this order was cancelled/i],
  ])('cancelled %s order uses accurate copy', async (_n, over, re) => {
    getMyOrder.mockResolvedValue({ ...base, status: 'CANCELLED', ...over })
    render(<CheckoutSuccessPage />)
    await screen.findByText(re)
    expect(screen.queryByText(/nothing was charged/i)).toBeNull()
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

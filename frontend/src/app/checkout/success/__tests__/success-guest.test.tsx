import React from 'react'
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import CheckoutSuccessPage from '../page'
import { api, ApiError } from '@/lib/api'
import { payForOrder } from '@/lib/razorpay-flow'

const router = { push: vi.fn(), replace: vi.fn() }
const auth: { user: null | { id: number; email: string; name: string; phone: string }; loading: boolean } = {
  user: null,
  loading: false,
}
let params = new URLSearchParams('orderId=9')

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
  return {
    ApiError,
    api: { getMyOrder: vi.fn(), trackOrder: vi.fn(), setOrderPaymentMethod: vi.fn(), getPaymentConfig: vi.fn() },
  }
})
vi.mock('@/lib/razorpay-flow', () => ({ payForOrder: vi.fn() }))

const fn = (f: unknown) => f as ReturnType<typeof vi.fn>
const getMyOrder = fn(api.getMyOrder)
const trackOrder = fn(api.trackOrder)
const setMethod = fn(api.setOrderPaymentMethod)
const getPaymentConfig = fn(api.getPaymentConfig)
const pay = fn(payForOrder)

const EMAIL_KEY = 'fp_last_order_email'
const GUEST = 'guest@example.com'
const base = {
  id: 9, total: 150, items: [{ id: 1, productName: 'Rose', quantity: 1, unitPrice: 100 }],
  status: 'PENDING', paymentMethod: 'COD', paymentStatus: 'UNPAID', customerName: 'Guest Buyer', shippingAddress: '12 Rose Street',
}
const online = { ...base, paymentMethod: 'RAZORPAY' }

beforeEach(() => {
  window.sessionStorage.clear()
  window.sessionStorage.setItem(EMAIL_KEY, GUEST)
  auth.user = null
  auth.loading = false
  params = new URLSearchParams('orderId=9')
  router.push.mockReset()
  router.replace.mockReset()
  cart.clear.mockReset()
  getMyOrder.mockReset()
  trackOrder.mockReset()
  setMethod.mockReset()
  pay.mockReset()
  getPaymentConfig.mockReset().mockResolvedValue({ enabled: true })
})

describe('success page: guest', () => {
  it('shows a guest COD order read with id + email, with no login redirect and no account endpoint', async () => {
    trackOrder.mockResolvedValue(base)
    render(<CheckoutSuccessPage />)
    await screen.findByText(/pay on delivery/i)
    expect(trackOrder).toHaveBeenCalledWith(9, GUEST)
    expect(getMyOrder).not.toHaveBeenCalled()
    expect(router.replace).not.toHaveBeenCalled()
    expect(router.push).not.toHaveBeenCalled()
    expect(screen.getByText('Guest Buyer')).toBeInTheDocument()
  })

  it('clears the email once the order is displayed in a final state', async () => {
    trackOrder.mockResolvedValue(base)
    render(<CheckoutSuccessPage />)
    await screen.findByText(/pay on delivery/i)
    await waitFor(() => expect(window.sessionStorage.getItem(EMAIL_KEY)).toBeNull())
  })

  it('does not look the order up before it knows whether the visitor is a guest (no flash of the fallback)', async () => {
    auth.loading = true
    const { container } = render(<CheckoutSuccessPage />)
    expect(container.querySelector('[aria-busy="true"]')).not.toBeNull()
    expect(trackOrder).not.toHaveBeenCalled()
    expect(window.sessionStorage.getItem(EMAIL_KEY)).toBe(GUEST)
  })

  it('offers "Track an order" instead of "View my orders" to a guest', async () => {
    trackOrder.mockResolvedValue(base)
    render(<CheckoutSuccessPage />)
    await screen.findByText(/pay on delivery/i)
    expect(screen.getByRole('link', { name: /track an order/i })).toHaveAttribute('href', '/track-order')
    expect(screen.queryByRole('link', { name: /view my orders/i })).toBeNull()
    expect(screen.getByRole('link', { name: /continue shopping/i })).toBeInTheDocument()
  })

  it('keeps the email while an online order still has to be paid, and Pay now uses it', async () => {
    trackOrder.mockResolvedValue(online)
    render(<CheckoutSuccessPage />)
    fireEvent.click(await screen.findByRole('button', { name: /pay now/i }))
    expect(pay).toHaveBeenCalledTimes(1)
    expect(pay.mock.calls[0][0]).toBe(9)
    expect(pay.mock.calls[0][2]).toBe(GUEST)
    expect(window.sessionStorage.getItem(EMAIL_KEY)).toBe(GUEST)
  })

  it('after the guest pays, the order is reloaded with the same email and the email is then cleared', async () => {
    window.sessionStorage.setItem('fp_pending_order', JSON.stringify({ id: 9, createdAt: Date.now() }))
    trackOrder.mockResolvedValueOnce(online)
    render(<CheckoutSuccessPage />)
    fireEvent.click(await screen.findByRole('button', { name: /pay now/i }))
    trackOrder.mockResolvedValue({ ...online, status: 'PAID', paymentStatus: 'PAID' })
    act(() => pay.mock.calls[0][1].onPaid())
    await screen.findByText(/payment received/i)
    expect(trackOrder).toHaveBeenLastCalledWith(9, GUEST)
    expect(cart.clear).toHaveBeenCalled()
    expect(window.sessionStorage.getItem('fp_pending_order')).toBeNull()
    await waitFor(() => expect(window.sessionStorage.getItem(EMAIL_KEY)).toBeNull())
  })

  it('Switch to COD works for a guest: re-check by email, switch with the email, then the COD state', async () => {
    trackOrder.mockResolvedValueOnce(online)
    trackOrder.mockResolvedValueOnce(online) // pre-switch re-check
    setMethod.mockResolvedValue({ ...online, paymentMethod: 'COD' })
    render(<CheckoutSuccessPage />)
    fireEvent.click(await screen.findByRole('button', { name: /switch to cash on delivery/i }))
    trackOrder.mockResolvedValue(base)
    fireEvent.click(screen.getByRole('button', { name: /yes, switch/i }))
    await screen.findByText(/pay on delivery/i)
    expect(setMethod).toHaveBeenCalledWith(9, GUEST)
    expect(getMyOrder).not.toHaveBeenCalled()
    await waitFor(() => expect(window.sessionStorage.getItem(EMAIL_KEY)).toBeNull())
  })

  it('a cancelled (stale) guest order is explained and the email is cleared', async () => {
    trackOrder.mockResolvedValue({ ...online, status: 'CANCELLED' })
    render(<CheckoutSuccessPage />)
    await screen.findByText(/this order expired because payment was not completed/i)
    await waitFor(() => expect(window.sessionStorage.getItem(EMAIL_KEY)).toBeNull())
  })

  it('without the email (a reload after it was shown) says so and points to Track order, never to login', async () => {
    window.sessionStorage.removeItem(EMAIL_KEY)
    render(<CheckoutSuccessPage />)
    await screen.findByText(/look it up with your order number and the email you ordered with/i)
    expect(trackOrder).not.toHaveBeenCalled()
    expect(getMyOrder).not.toHaveBeenCalled()
    expect(router.replace).not.toHaveBeenCalled()
    const links = screen.getAllByRole('link', { name: /track an order/i })
    expect(links.length).toBeGreaterThan(0)
    links.forEach((l) => expect(l).toHaveAttribute('href', '/track-order'))
  })

  it('showing the page a second time after the email was consumed gives the fallback', async () => {
    trackOrder.mockResolvedValue(base)
    const first = render(<CheckoutSuccessPage />)
    await screen.findByText(/pay on delivery/i)
    await waitFor(() => expect(window.sessionStorage.getItem(EMAIL_KEY)).toBeNull())
    first.unmount()
    trackOrder.mockClear()
    render(<CheckoutSuccessPage />)
    await screen.findByText(/look it up with your order number/i)
    expect(trackOrder).not.toHaveBeenCalled()
  })

  it('a failed lookup keeps the guest on the page with a retry and a Track link, and keeps the email for the retry', async () => {
    trackOrder.mockRejectedValueOnce(new ApiError('Order not found, or the email does not match this order', 404, null))
    render(<CheckoutSuccessPage />)
    await screen.findByText(/check your confirmation email, or track it with your order number and email/i)
    expect(window.sessionStorage.getItem(EMAIL_KEY)).toBe(GUEST)
    trackOrder.mockResolvedValue(base)
    fireEvent.click(screen.getByRole('button', { name: /try again/i }))
    await screen.findByText(/pay on delivery/i)
    expect(trackOrder).toHaveBeenCalledTimes(2)
    expect(trackOrder).toHaveBeenLastCalledWith(9, GUEST)
  })

  it('an invalid order id in the URL gives a guest the not-found state with a Track link', async () => {
    params = new URLSearchParams('orderId=abc')
    render(<CheckoutSuccessPage />)
    await screen.findByText(/couldn.t find that order/i)
    expect(trackOrder).not.toHaveBeenCalled()
    expect(screen.getAllByRole('link', { name: /track an order/i }).length).toBeGreaterThan(0)
  })

  it('never puts the email in a URL', async () => {
    trackOrder.mockResolvedValue(base)
    render(<CheckoutSuccessPage />)
    await screen.findByText(/pay on delivery/i)
    expect(router.push).not.toHaveBeenCalled()
    expect(router.replace).not.toHaveBeenCalled()
    expect(window.location.href).not.toContain('example.com')
    document.querySelectorAll('a[href]').forEach((a) => expect(a.getAttribute('href')).not.toContain('example.com'))
  })
})

describe('success page: signed in (unchanged)', () => {
  beforeEach(() => {
    auth.user = { id: 1, email: 'acct@example.com', name: 'Asha', phone: '' }
  })

  it('reads the order through the account and leaves the guest key alone', async () => {
    getMyOrder.mockResolvedValue(base)
    render(<CheckoutSuccessPage />)
    await screen.findByText(/pay on delivery/i)
    expect(getMyOrder).toHaveBeenCalledWith(9)
    expect(trackOrder).not.toHaveBeenCalled()
    expect(window.sessionStorage.getItem(EMAIL_KEY)).toBe(GUEST)
    expect(screen.getByRole('link', { name: /view my orders/i })).toHaveAttribute('href', '/account/orders')
  })

  it('Pay now passes no guest email', async () => {
    getMyOrder.mockResolvedValue(online)
    render(<CheckoutSuccessPage />)
    fireEvent.click(await screen.findByRole('button', { name: /pay now/i }))
    expect(pay.mock.calls[0][2]).toBeUndefined()
  })
})

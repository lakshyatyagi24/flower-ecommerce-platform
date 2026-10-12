import React from 'react'
import { render, screen, waitFor, fireEvent, within, act } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import CheckoutPage from '../page'
import { api, ApiError } from '@/lib/api'
import { payForOrder } from '@/lib/razorpay-flow'

// Stable references: a fresh object per render would retrigger the page's effects forever.
const router = { push: vi.fn(), replace: vi.fn() }
const cart = {
  items: [{ productId: 1, slug: 'rose', name: 'Rose', price: 100, quantity: 1, image: null, gstRate: 0 }],
  count: 1,
  clear: vi.fn(),
}
const auth = { user: { id: 1, email: 'a@b.co', name: 'A', phone: '' }, loading: false }

vi.mock('next/navigation', () => ({ useRouter: () => router }))
vi.mock('@/lib/cart-context', () => ({
  formatINR: (n: number) => `Rs${n}`,
  useCart: () => cart,
}))
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
    api: {
      getSettings: vi.fn(),
      getProductBySlug: vi.fn(),
      createOrder: vi.fn(),
      getMyOrder: vi.fn(),
      setOrderPaymentMethod: vi.fn(),
    },
  }
})
vi.mock('@/lib/razorpay-flow', () => ({ payForOrder: vi.fn() }))

const fn = (f: unknown) => f as ReturnType<typeof vi.fn>
const getSettings = fn(api.getSettings)
const getProductBySlug = fn(api.getProductBySlug)
const createOrder = fn(api.createOrder)
const getMyOrder = fn(api.getMyOrder)
const setMethod = fn(api.setOrderPaymentMethod)
const pay = fn(payForOrder)

const KEY = 'fp_pending_order'
const baseOrder = {
  id: 42, status: 'PENDING', paymentMethod: 'RAZORPAY', paymentStatus: 'UNPAID', total: 150, items: [],
}
const SUCCESS = '/checkout/success?orderId=42'

beforeEach(() => {
  window.sessionStorage.clear()
  router.push.mockReset()
  router.replace.mockReset()
  cart.clear.mockReset()
  createOrder.mockReset()
  getMyOrder.mockReset()
  setMethod.mockReset()
  pay.mockReset()
  getSettings.mockReset().mockResolvedValue({ 'shipping.flatRate': '50' })
  getProductBySlug.mockReset().mockResolvedValue({ id: 1, price: 100, gstRate: 0 })
})

async function fillAndSubmit(container: HTMLElement) {
  await waitFor(() => expect(container.querySelector('form')).not.toBeNull())
  const set = (el: Element, v: string) => fireEvent.change(el, { target: { value: v } })
  set(screen.getByPlaceholderText('+91 99999 11111'), '9999911111')
  set(container.querySelector('textarea')!, '12 Rose Street')
  const inputs = container.querySelectorAll('input[maxlength]')
  set(inputs[0], 'Pune')
  set(inputs[1], '411001')
  fireEvent.submit(container.querySelector('form')!)
}

// Place an online order and return the handlers given to payForOrder.
async function placeOnlineOrder() {
  createOrder.mockResolvedValue(baseOrder)
  const view = render(<CheckoutPage />)
  await fillAndSubmit(view.container)
  await waitFor(() => expect(pay).toHaveBeenCalledTimes(1))
  return { ...view, handlers: pay.mock.calls[0][1] }
}

describe('Checkout payment method', () => {
  it('shows a fieldset with online (default) and COD options', async () => {
    const { container } = render(<CheckoutPage />)
    await waitFor(() => expect(container.querySelector('form')).not.toBeNull())
    const group = screen.getByRole('group', { name: /payment/i })
    const online = within(group).getByRole('radio', { name: /pay online/i }) as HTMLInputElement
    const cod = within(group).getByRole('radio', { name: /cash on delivery/i }) as HTMLInputElement
    expect(online.checked).toBe(true)
    expect(cod.checked).toBe(false)
  })

  it('COD sends paymentMethod COD, clears cart and goes to success without opening payment', async () => {
    createOrder.mockResolvedValue({ ...baseOrder, paymentMethod: 'COD' })
    const { container } = render(<CheckoutPage />)
    await waitFor(() => expect(container.querySelector('form')).not.toBeNull())
    fireEvent.click(screen.getByRole('radio', { name: /cash on delivery/i }))
    await fillAndSubmit(container)
    await waitFor(() => expect(router.push).toHaveBeenCalledWith(SUCCESS))
    expect(createOrder.mock.calls[0][0].paymentMethod).toBe('COD')
    expect(cart.clear).toHaveBeenCalled()
    expect(pay).not.toHaveBeenCalled()
  })

  it('online sends RAZORPAY, calls payForOrder, keeps the cart, stores pending order and hides the form', async () => {
    const { container } = await placeOnlineOrder()
    expect(createOrder.mock.calls[0][0].paymentMethod).toBe('RAZORPAY')
    expect(pay.mock.calls[0][0]).toBe(42)
    expect(cart.clear).not.toHaveBeenCalled()
    expect(router.push).not.toHaveBeenCalled()
    expect(JSON.parse(window.sessionStorage.getItem(KEY)!).id).toBe(42)
    expect(container.querySelector('form')).toBeNull()
    expect(screen.queryByRole('button', { name: /place order/i })).toBeNull()
  })

  it('onPaid clears cart + pending key and navigates to success', async () => {
    const { handlers } = await placeOnlineOrder()
    act(() => handlers.onPaid())
    expect(cart.clear).toHaveBeenCalled()
    expect(window.sessionStorage.getItem(KEY)).toBeNull()
    expect(router.push).toHaveBeenCalledWith(SUCCESS)
  })

  it('onRefundDue also clears and navigates to success', async () => {
    const { handlers } = await placeOnlineOrder()
    act(() => handlers.onRefundDue())
    expect(cart.clear).toHaveBeenCalled()
    expect(window.sessionStorage.getItem(KEY)).toBeNull()
    expect(router.push).toHaveBeenCalledWith(SUCCESS)
  })

  it('dismiss shows the pending panel; Pay now re-invokes payForOrder', async () => {
    const { container, handlers } = await placeOnlineOrder()
    act(() => handlers.onDismiss())
    expect(screen.getByText(/Payment not completed\. Your order #42 is reserved for 30 minutes\./)).toBeInTheDocument()
    expect(container.querySelector('form')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: /pay now/i }))
    expect(pay).toHaveBeenCalledTimes(2)
    expect(pay.mock.calls[1][0]).toBe(42)
  })

  it('payment failure shows the same pending message', async () => {
    const { handlers } = await placeOnlineOrder()
    act(() => handlers.onFailure('Card declined'))
    expect(screen.getByText(/Payment not completed\. Your order #42 is reserved/)).toBeInTheDocument()
  })

  it('Switch to cash on delivery calls setOrderPaymentMethod then clears and navigates', async () => {
    const { handlers } = await placeOnlineOrder()
    setMethod.mockResolvedValue({ ...baseOrder, paymentMethod: 'COD' })
    act(() => handlers.onDismiss())
    fireEvent.click(screen.getByRole('button', { name: /switch to cash on delivery/i }))
    await waitFor(() => expect(router.push).toHaveBeenCalledWith(SUCCESS))
    expect(setMethod).toHaveBeenCalledWith(42, 'a@b.co')
    expect(cart.clear).toHaveBeenCalled()
    expect(window.sessionStorage.getItem(KEY)).toBeNull()
  })

  it('409 on switch shows a message and Check status which detects a paid order', async () => {
    const { handlers } = await placeOnlineOrder()
    setMethod.mockRejectedValue(new ApiError('Order can no longer be switched to cash on delivery', 409, null))
    act(() => handlers.onDismiss())
    fireEvent.click(screen.getByRole('button', { name: /switch to cash on delivery/i }))
    await screen.findByText(/This order can no longer be switched/i)
    expect(router.push).not.toHaveBeenCalled()
    getMyOrder.mockResolvedValue({ ...baseOrder, status: 'PAID', paymentStatus: 'PAID' })
    fireEvent.click(screen.getByRole('button', { name: /check status/i }))
    await waitFor(() => expect(router.push).toHaveBeenCalledWith(SUCCESS))
    expect(cart.clear).toHaveBeenCalled()
  })

  it('verify error shows guidance + Check status; a cancelled order shows the expired message', async () => {
    const { handlers } = await placeOnlineOrder()
    act(() => handlers.onVerifyError('We could not confirm your payment yet. Check My Orders.'))
    expect(screen.getByText(/could not confirm your payment yet/i)).toBeInTheDocument()
    getMyOrder.mockResolvedValue({ ...baseOrder, status: 'CANCELLED', paymentStatus: 'UNPAID' })
    fireEvent.click(screen.getByRole('button', { name: /check status/i }))
    await screen.findByText(/this order expired/i)
    expect(window.sessionStorage.getItem(KEY)).toBeNull()
    expect(screen.getByRole('link', { name: /products/i })).toBeInTheDocument()
    expect(router.push).not.toHaveBeenCalled()
  })

  it('onError shows the message with Pay now / Switch buttons', async () => {
    const { handlers } = await placeOnlineOrder()
    act(() => handlers.onError('Online payment is temporarily unavailable.'))
    expect(screen.getByText(/temporarily unavailable/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /pay now/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /switch to cash on delivery/i })).toBeInTheDocument()
  })
})

describe('Checkout restores a pending order', () => {
  it('a fresh pending order in sessionStorage restores the panel instead of the form', async () => {
    window.sessionStorage.setItem(KEY, JSON.stringify({ id: 42, createdAt: Date.now() - 60_000 }))
    getMyOrder.mockResolvedValue(baseOrder)
    const { container } = render(<CheckoutPage />)
    await screen.findByText(/Your order #42 is reserved for 30 minutes/)
    expect(getMyOrder).toHaveBeenCalledWith(42)
    expect(container.querySelector('form')).toBeNull()
    expect(createOrder).not.toHaveBeenCalled()
  })

  it('a stale (>30 min) one is ignored, cleared, and the form renders', async () => {
    window.sessionStorage.setItem(KEY, JSON.stringify({ id: 42, createdAt: Date.now() - 31 * 60_000 }))
    const { container } = render(<CheckoutPage />)
    await waitFor(() => expect(container.querySelector('form')).not.toBeNull())
    expect(getMyOrder).not.toHaveBeenCalled()
    expect(window.sessionStorage.getItem(KEY)).toBeNull()
  })

  it('malformed storage is ignored and cleared', async () => {
    window.sessionStorage.setItem(KEY, '{nope')
    const { container } = render(<CheckoutPage />)
    await waitFor(() => expect(container.querySelector('form')).not.toBeNull())
    expect(getMyOrder).not.toHaveBeenCalled()
    expect(window.sessionStorage.getItem(KEY)).toBeNull()
  })

  it.each([
    ['COD', { ...baseOrder, paymentMethod: 'COD' }],
    ['CANCELLED', { ...baseOrder, status: 'CANCELLED' }],
  ])('a %s order clears the key and shows the normal form', async (_n, order) => {
    window.sessionStorage.setItem(KEY, JSON.stringify({ id: 42, createdAt: Date.now() }))
    getMyOrder.mockResolvedValue(order)
    const { container } = render(<CheckoutPage />)
    await waitFor(() => expect(container.querySelector('form')).not.toBeNull())
    expect(window.sessionStorage.getItem(KEY)).toBeNull()
  })

  it('a PAID order clears cart + key and navigates to success', async () => {
    window.sessionStorage.setItem(KEY, JSON.stringify({ id: 42, createdAt: Date.now() }))
    getMyOrder.mockResolvedValue({ ...baseOrder, status: 'PAID', paymentStatus: 'PAID' })
    render(<CheckoutPage />)
    await waitFor(() => expect(router.push).toHaveBeenCalledWith(SUCCESS))
    expect(cart.clear).toHaveBeenCalled()
    expect(window.sessionStorage.getItem(KEY)).toBeNull()
  })

  it('an API error loading the order clears the key and shows the form', async () => {
    window.sessionStorage.setItem(KEY, JSON.stringify({ id: 42, createdAt: Date.now() }))
    getMyOrder.mockRejectedValue(new ApiError('nope', 404, null))
    const { container } = render(<CheckoutPage />)
    await waitFor(() => expect(container.querySelector('form')).not.toBeNull())
    expect(window.sessionStorage.getItem(KEY)).toBeNull()
  })
})

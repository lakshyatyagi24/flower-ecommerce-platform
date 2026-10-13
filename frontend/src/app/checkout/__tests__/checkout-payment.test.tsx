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
      getPaymentConfig: vi.fn(),
      getDeliveryOptions: vi.fn(async () => ({ earliest: '2026-10-14', latest: '2026-10-28', blackoutDates: [] })),
      getProductBySlug: vi.fn(),
      createOrder: vi.fn(),
      checkPincode: vi.fn(async () => ({ serviceable: true, message: '' })),
      getMyOrder: vi.fn(),
      setOrderPaymentMethod: vi.fn(),
    },
  }
})
vi.mock('@/lib/razorpay-flow', () => ({ payForOrder: vi.fn() }))

const fn = (f: unknown) => f as ReturnType<typeof vi.fn>
const getSettings = fn(api.getSettings)
const getPaymentConfig = fn(api.getPaymentConfig)
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
  getPaymentConfig.mockReset().mockResolvedValue({ enabled: true })
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

  it('onRefundDue("expired") also clears and navigates to success', async () => {
    const { handlers } = await placeOnlineOrder()
    act(() => handlers.onRefundDue('expired'))
    expect(cart.clear).toHaveBeenCalled()
    expect(window.sessionStorage.getItem(KEY)).toBeNull()
    expect(router.push).toHaveBeenCalledWith(SUCCESS)
  })

  it('onRefundDue("switched"): clears cart + pending key, shows the refund notice with a My Orders link, does NOT navigate', async () => {
    const { handlers } = await placeOnlineOrder()
    act(() => handlers.onRefundDue('switched'))
    expect(cart.clear).toHaveBeenCalled()
    expect(window.sessionStorage.getItem(KEY)).toBeNull()
    expect(router.push).not.toHaveBeenCalled()
    expect(screen.getByRole('status').textContent).toMatch(
      /We received your online payment, but this order had already been switched to cash on delivery\. We will refund your payment within 3-5 working days/,
    )
    expect(screen.getByRole('link', { name: /my orders/i }).getAttribute('href')).toBe('/account/orders')
    // the order is COD now: no way to pay again or switch
    expect(screen.queryByRole('button', { name: /pay now/i })).toBeNull()
    expect(screen.queryByRole('button', { name: /switch to cash on delivery/i })).toBeNull()
  })

  it('dismiss shows the pending panel; Pay now re-invokes payForOrder', async () => {
    const { container, handlers } = await placeOnlineOrder()
    act(() => handlers.onDismiss())
    expect(screen.getByText(/wait a minute and press Check status before switching\. Your order #42 is reserved for 30 minutes\./)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /check status/i })).toBeInTheDocument()
    expect(container.querySelector('form')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: /pay now/i }))
    expect(pay).toHaveBeenCalledTimes(2)
    expect(pay.mock.calls[1][0]).toBe(42)
  })

  it('payment failure shows the same pending message', async () => {
    const { handlers } = await placeOnlineOrder()
    act(() => handlers.onFailure('Card declined'))
    expect(screen.getByRole('alert').textContent).toMatch(/Your order #42 is reserved/)
    expect(screen.getByRole('button', { name: /check status/i })).toBeInTheDocument()
  })

  it('Switch asks for confirmation, re-checks the order, then switches and clears', async () => {
    const { handlers } = await placeOnlineOrder()
    setMethod.mockResolvedValue({ ...baseOrder, paymentMethod: 'COD' })
    getMyOrder.mockResolvedValue(baseOrder)
    act(() => handlers.onDismiss())
    fireEvent.click(screen.getByRole('button', { name: /switch to cash on delivery/i }))
    expect(screen.getByText(/Only do this if you have not paid/i)).toBeInTheDocument()
    expect(setMethod).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: /yes, switch/i }))
    await waitFor(() => expect(router.push).toHaveBeenCalledWith(SUCCESS))
    expect(getMyOrder).toHaveBeenCalledWith(42)
    expect(setMethod).toHaveBeenCalledWith(42, 'a@b.co')
    expect(cart.clear).toHaveBeenCalled()
    expect(window.sessionStorage.getItem(KEY)).toBeNull()
  })

  it('declining the confirmation does not call the API', async () => {
    const { handlers } = await placeOnlineOrder()
    act(() => handlers.onDismiss())
    fireEvent.click(screen.getByRole('button', { name: /switch to cash on delivery/i }))
    fireEvent.click(screen.getByRole('button', { name: /keep online payment/i }))
    expect(getMyOrder).not.toHaveBeenCalled()
    expect(setMethod).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: /switch to cash on delivery/i })).toBeInTheDocument()
  })

  it('switch finds the order already PAID: treats it as paid and never switches', async () => {
    const { handlers } = await placeOnlineOrder()
    getMyOrder.mockResolvedValue({ ...baseOrder, status: 'PAID', paymentStatus: 'PAID' })
    act(() => handlers.onDismiss())
    fireEvent.click(screen.getByRole('button', { name: /switch to cash on delivery/i }))
    fireEvent.click(screen.getByRole('button', { name: /yes, switch/i }))
    await waitFor(() => expect(router.push).toHaveBeenCalledWith(SUCCESS))
    expect(setMethod).not.toHaveBeenCalled()
    expect(cart.clear).toHaveBeenCalled()
  })

  it('switch finds the order CANCELLED: shows the expired state and never switches', async () => {
    const { handlers } = await placeOnlineOrder()
    getMyOrder.mockResolvedValue({ ...baseOrder, status: 'CANCELLED' })
    act(() => handlers.onDismiss())
    fireEvent.click(screen.getByRole('button', { name: /switch to cash on delivery/i }))
    fireEvent.click(screen.getByRole('button', { name: /yes, switch/i }))
    await screen.findByText(/this order expired because payment was not completed/i)
    expect(setMethod).not.toHaveBeenCalled()
    expect(window.sessionStorage.getItem(KEY)).toBeNull()
  })

  it('409 on switch shows an alert and Check status which detects a paid order', async () => {
    const { handlers } = await placeOnlineOrder()
    getMyOrder.mockResolvedValue(baseOrder)
    setMethod.mockRejectedValue(new ApiError('Order can no longer be switched to cash on delivery', 409, null))
    act(() => handlers.onDismiss())
    fireEvent.click(screen.getByRole('button', { name: /switch to cash on delivery/i }))
    fireEvent.click(screen.getByRole('button', { name: /yes, switch/i }))
    await screen.findByText(/This order can no longer be switched/i)
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(router.push).not.toHaveBeenCalled()
    getMyOrder.mockResolvedValue({ ...baseOrder, status: 'PAID', paymentStatus: 'PAID' })
    fireEvent.click(screen.getByRole('button', { name: /check status/i }))
    await waitFor(() => expect(router.push).toHaveBeenCalledWith(SUCCESS))
    expect(cart.clear).toHaveBeenCalled()
  })

  it('Check status on a still-pending order keeps the panel with a not-paid note', async () => {
    const { handlers } = await placeOnlineOrder()
    act(() => handlers.onDismiss())
    getMyOrder.mockResolvedValue(baseOrder)
    fireEvent.click(screen.getByRole('button', { name: /check status/i }))
    await screen.findByText(/still pending and has not been paid yet/i)
    expect(router.push).not.toHaveBeenCalled()
  })

  it('a 400 from createRazorpayOrder (onError) offers Check status which resolves a cancelled order', async () => {
    const { handlers } = await placeOnlineOrder()
    act(() => handlers.onError('Order is cancelled'))
    getMyOrder.mockResolvedValue({ ...baseOrder, status: 'CANCELLED' })
    fireEvent.click(screen.getByRole('button', { name: /check status/i }))
    await screen.findByText(/this order expired because payment was not completed/i)
    expect(screen.queryByRole('button', { name: /pay now/i })).toBeNull()
  })

  it.each([
    ['REFUNDED', { paymentStatus: 'REFUNDED' }, /your payment was refunded/i],
    ['COD', { paymentMethod: 'COD' }, /this order was cancelled/i],
  ])('expired copy for a cancelled %s order does not claim nothing was charged', async (_n, over, re) => {
    const { handlers } = await placeOnlineOrder()
    act(() => handlers.onDismiss())
    getMyOrder.mockResolvedValue({ ...baseOrder, status: 'CANCELLED', ...over })
    fireEvent.click(screen.getByRole('button', { name: /check status/i }))
    await screen.findByText(re)
    expect(screen.queryByText(/nothing was charged/i)).toBeNull()
  })

  it('verify error shows guidance + Check status; a cancelled order shows the expired message', async () => {
    const { handlers } = await placeOnlineOrder()
    act(() => handlers.onVerifyError('We could not confirm your payment yet. Check My Orders.'))
    expect(screen.getByText(/could not confirm your payment yet/i)).toBeInTheDocument()
    getMyOrder.mockResolvedValue({ ...baseOrder, status: 'CANCELLED', paymentStatus: 'UNPAID' })
    fireEvent.click(screen.getByRole('button', { name: /check status/i }))
    await screen.findByText(/this order expired because payment was not completed/i)
    expect(window.sessionStorage.getItem(KEY)).toBeNull()
    expect(screen.getByRole('link', { name: /products/i })).toBeInTheDocument()
    expect(router.push).not.toHaveBeenCalled()
  })

  it('onError shows the message with Pay now / Switch buttons', async () => {
    const { handlers } = await placeOnlineOrder()
    act(() => handlers.onError('Online payment is temporarily unavailable.'))
    expect(screen.getByRole('alert').textContent).toMatch(/temporarily unavailable/i)
    expect(screen.getByRole('button', { name: /pay now/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /switch to cash on delivery/i })).toBeInTheDocument()
  })
})

describe('Checkout online payments switch', () => {
  it('disabled: no online radio, COD is the default, note shown, createOrder sent with COD', async () => {
    getPaymentConfig.mockResolvedValue({ enabled: false })
    createOrder.mockResolvedValue({ ...baseOrder, paymentMethod: 'COD' })
    const { container } = render(<CheckoutPage />)
    await waitFor(() => expect(container.querySelector('form')).not.toBeNull())
    expect(screen.queryByRole('radio', { name: /pay online/i })).toBeNull()
    expect((screen.getByRole('radio', { name: /cash on delivery/i }) as HTMLInputElement).checked).toBe(true)
    expect(screen.getByText('Online payment is temporarily unavailable.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^place order$/i })).toBeInTheDocument()
    await fillAndSubmit(container)
    await waitFor(() => expect(router.push).toHaveBeenCalledWith(SUCCESS))
    expect(createOrder.mock.calls[0][0].paymentMethod).toBe('COD')
    expect(pay).not.toHaveBeenCalled()
  })

  it('config request failure behaves like disabled (COD default, no online radio)', async () => {
    getPaymentConfig.mockRejectedValue(new ApiError('down', 500, null))
    const { container } = render(<CheckoutPage />)
    await waitFor(() => expect(container.querySelector('form')).not.toBeNull())
    expect(screen.queryByRole('radio', { name: /pay online/i })).toBeNull()
    expect((screen.getByRole('radio', { name: /cash on delivery/i }) as HTMLInputElement).checked).toBe(true)
  })

  it('while the config is loading the skeleton is shown, not the form', async () => {
    getPaymentConfig.mockReturnValue(new Promise(() => {}))
    const { container } = render(<CheckoutPage />)
    await waitFor(() => expect(getPaymentConfig).toHaveBeenCalled())
    expect(container.querySelector('form')).toBeNull()
    expect(container.querySelector('[aria-busy="true"]')).not.toBeNull()
  })

  it('enabled: online radio present and the default (existing behaviour), no unavailable note', async () => {
    const { container } = render(<CheckoutPage />)
    await waitFor(() => expect(container.querySelector('form')).not.toBeNull())
    expect((screen.getByRole('radio', { name: /pay online/i }) as HTMLInputElement).checked).toBe(true)
    expect(screen.queryByText(/Online payment is temporarily unavailable\./)).toBeNull()
  })
})

describe('Checkout restores a pending order', () => {
  it('a fresh pending order in sessionStorage restores the panel instead of the form', async () => {
    window.sessionStorage.setItem(KEY, JSON.stringify({ id: 42, createdAt: Date.now() - 60_000 }))
    getMyOrder.mockResolvedValue(baseOrder)
    const { container } = render(<CheckoutPage />)
    await screen.findByText(/Your order #42 is reserved for 30 minutes/)
    expect(screen.getByRole('button', { name: /check status/i })).toBeInTheDocument()
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
    ['CANCELLED', { ...baseOrder, status: 'CANCELLED' }],
    ['REFUNDED', { ...baseOrder, status: 'CANCELLED', paymentStatus: 'REFUNDED' }],
  ])('a %s order clears the key and shows the normal form', async (_n, order) => {
    window.sessionStorage.setItem(KEY, JSON.stringify({ id: 42, createdAt: Date.now() }))
    getMyOrder.mockResolvedValue(order)
    const { container } = render(<CheckoutPage />)
    await waitFor(() => expect(container.querySelector('form')).not.toBeNull())
    expect(window.sessionStorage.getItem(KEY)).toBeNull()
  })

  it.each([
    ['COD', { ...baseOrder, paymentMethod: 'COD' }],
    ['CANCELLED but PAID (refund due)', { ...baseOrder, status: 'CANCELLED', paymentStatus: 'PAID' }],
  ])('a %s order goes to the success page, clearing cart + key', async (_n, order) => {
    window.sessionStorage.setItem(KEY, JSON.stringify({ id: 42, createdAt: Date.now() }))
    getMyOrder.mockResolvedValue(order)
    render(<CheckoutPage />)
    await waitFor(() => expect(router.push).toHaveBeenCalledWith(SUCCESS))
    expect(cart.clear).toHaveBeenCalled()
    expect(window.sessionStorage.getItem(KEY)).toBeNull()
  })

  it('a restored COD+CANCELLED order shows the expired panel instead of sticking on the skeleton', async () => {
    window.sessionStorage.setItem(KEY, JSON.stringify({ id: 42, createdAt: Date.now() }))
    getMyOrder.mockResolvedValue({ ...baseOrder, paymentMethod: 'COD', status: 'CANCELLED' })
    const { container } = render(<CheckoutPage />)
    await screen.findByText(/this order was cancelled/i)
    expect(container.querySelector('[aria-busy="true"]')).toBeNull()
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

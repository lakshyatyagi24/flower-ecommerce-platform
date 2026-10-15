import React from 'react'
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import CheckoutPage from '../page'
import { api } from '@/lib/api'
import { payForOrder } from '@/lib/razorpay-flow'

const router = { push: vi.fn(), replace: vi.fn() }
const line = { productId: 1, slug: 'rose', name: 'Rose', price: 100, quantity: 1, image: null, gstRate: 0 }
const cart = {
  items: [line],
  count: 1,
  clear: vi.fn(),
  remove: vi.fn(),
  replaceWith: vi.fn(),
}
const auth = { user: null, loading: false }

vi.mock('next/navigation', () => ({ useRouter: () => router }))
vi.mock('@/lib/cart-context', () => ({ formatINR: (n: number) => `Rs${n}`, useCart: () => cart }))
vi.mock('@/lib/auth-context', () => ({ useAuth: () => auth }))
vi.mock('@/lib/api', () => {
  class ApiError extends Error {
    status: number
    payload: unknown
    constructor(m: string, s: number, p?: unknown) {
      super(m)
      this.status = s
      this.payload = p
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
      validateCoupon: vi.fn(),
      checkPincode: vi.fn(async () => ({ serviceable: true, message: '' })),
      getMyOrder: vi.fn(),
      trackOrder: vi.fn(),
      setOrderPaymentMethod: vi.fn(),
    },
  }
})
vi.mock('@/lib/razorpay-flow', () => ({ payForOrder: vi.fn() }))

const fn = (f: unknown) => f as ReturnType<typeof vi.fn>
const createOrder = fn(api.createOrder)
const validateCoupon = fn(api.validateCoupon)
const trackOrder = fn(api.trackOrder)
const pay = fn(payForOrder)

const { ApiError } = (await import('@/lib/api')) as unknown as { ApiError: new (m: string, s: number, p?: unknown) => Error }
const badCoupon = (message: string) => new ApiError(message, 400, { statusCode: 400, message, field: 'couponCode' })

const ok10 = (code = 'SAVE10', discount = 10) => ({ code, type: 'PERCENT', value: 10, discount })

beforeEach(() => {
  window.sessionStorage.clear()
  cart.items = [line]
  cart.count = 1
  router.push.mockReset()
  cart.clear.mockReset()
  createOrder.mockReset()
  validateCoupon.mockReset().mockResolvedValue(ok10())
  trackOrder.mockReset()
  pay.mockReset()
  fn(api.getSettings).mockReset().mockResolvedValue({ 'shipping.flatRate': '50' })
  fn(api.getPaymentConfig).mockReset().mockResolvedValue({ enabled: false })
  fn(api.getProductBySlug).mockReset().mockResolvedValue({ id: 1, price: 100, gstRate: 0, stock: 10, active: true })
})

const set = (el: Element, v: string) => fireEvent.change(el, { target: { value: v } })

async function renderForm() {
  const view = render(<CheckoutPage />)
  await waitFor(() => expect(view.container.querySelector('form')).not.toBeNull())
  await waitFor(() => expect(screen.getAllByText('Rs150').length).toBeGreaterThan(0))
  return view
}

function fillRest(container: HTMLElement) {
  set(screen.getByLabelText(/full name/i), 'Guest Buyer')
  set(screen.getByLabelText(/^email/i), 'guest@example.com')
  set(screen.getByPlaceholderText('+91 99999 11111'), '9999911111')
  set(container.querySelector('textarea')!, '12 Rose Street')
  const inputs = container.querySelectorAll('input[maxlength]')
  set(inputs[0], 'Pune')
  set(inputs[1], '411001')
}

const openDisclosure = () => fireEvent.click(screen.getByRole('button', { name: /have a coupon code\?/i }))
const codeBox = () => screen.getByLabelText(/coupon code/i) as HTMLInputElement
async function applyCode(code = 'save10') {
  openDisclosure()
  set(codeBox(), code)
  fireEvent.click(screen.getByRole('button', { name: /^apply$/i }))
  await screen.findByText(/applied/i, { selector: 'span' })
}
const totalText = () => within(screen.getByLabelText('Order summary')).getAllByText(/^Rs\d+(\.\d+)?$/).map((n) => n.textContent)

describe('checkout coupon field', () => {
  it('is a collapsed disclosure by default and opens on click', async () => {
    await renderForm()
    const toggle = screen.getByRole('button', { name: /have a coupon code\?/i })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(codeBox()).not.toBeVisible()
    fireEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    expect(codeBox()).toBeVisible()
  })

  it('applies a code: upper-cased and trimmed, discount line, lower total, announced politely', async () => {
    await renderForm()
    openDisclosure()
    set(codeBox(), ' save 10 ')
    expect(codeBox().value).toBe('SAVE10')
    fireEvent.click(screen.getByRole('button', { name: /^apply$/i }))
    await screen.findByText(/applied/i, { selector: 'span' })
    expect(validateCoupon).toHaveBeenCalledWith('SAVE10', 100)
    expect(screen.getByTestId('checkout-discount')).toHaveTextContent('Discount (SAVE10)')
    expect(screen.getByTestId('checkout-discount')).toHaveTextContent('-Rs10')
    // subtotal 100 - discount 10 + shipping 50 = 140
    expect(totalText()).toContain('Rs140')
    expect(screen.getByTestId('coupon-live')).toHaveTextContent('Coupon SAVE10 applied.')
    expect(screen.getByTestId('coupon-live')).toHaveAttribute('aria-live', 'polite')
  })

  it('Remove restores the total and announces it', async () => {
    await renderForm()
    await applyCode()
    fireEvent.click(screen.getByRole('button', { name: /remove coupon save10/i }))
    expect(screen.queryByTestId('checkout-discount')).toBeNull()
    expect(totalText()).toContain('Rs150')
    expect(screen.getByTestId('coupon-live')).toHaveTextContent('Coupon SAVE10 removed.')
  })

  it('shows a server error inline on the field (described by it, no role=alert) and keeps the total', async () => {
    validateCoupon.mockRejectedValue(badCoupon('Coupon not found'))
    await renderForm()
    openDisclosure()
    set(codeBox(), 'nope')
    fireEvent.click(screen.getByRole('button', { name: /^apply$/i }))
    const msg = await screen.findByText('Coupon not found')
    expect(msg).not.toHaveAttribute('role')
    expect(msg.closest('[role="alert"]')).toBeNull()
    expect(codeBox()).toHaveAttribute('aria-invalid', 'true')
    expect(codeBox()).toHaveAccessibleDescription('Coupon not found')
    expect(screen.queryByTestId('checkout-discount')).toBeNull()
    expect(totalText()).toContain('Rs150')
  })

  it('an empty code asks for one without calling the server', async () => {
    await renderForm()
    openDisclosure()
    set(codeBox(), 'x')
    set(codeBox(), '')
    fireEvent.keyDown(codeBox(), { key: 'Enter' })
    expect(await screen.findByText('Enter a coupon code.')).toBeInTheDocument()
    expect(validateCoupon).not.toHaveBeenCalled()
  })

  it('Enter in the field applies the coupon and does not submit the checkout', async () => {
    await renderForm()
    openDisclosure()
    set(codeBox(), 'save10')
    fireEvent.keyDown(codeBox(), { key: 'Enter' })
    await screen.findByText(/applied/i, { selector: 'span' })
    expect(createOrder).not.toHaveBeenCalled()
  })

  it('re-validates when the subtotal changes and updates the discount', async () => {
    const view = await renderForm()
    await applyCode()
    validateCoupon.mockResolvedValue(ok10('SAVE10', 20))
    cart.items = [{ ...line, quantity: 2 }]
    cart.count = 2
    view.rerender(<CheckoutPage />)
    await waitFor(() => expect(validateCoupon).toHaveBeenLastCalledWith('SAVE10', 200), { timeout: 3000 })
    // 200 - 20 + 50 = 230
    await waitFor(() => expect(totalText()).toContain('Rs230'), { timeout: 3000 })
  })

  it('drops the coupon, with the reason, when the changed cart no longer qualifies', async () => {
    const view = await renderForm()
    await applyCode()
    validateCoupon.mockRejectedValue(badCoupon('Add Rs500 more to use this coupon'))
    cart.items = [{ ...line, quantity: 2 }]
    cart.count = 2
    view.rerender(<CheckoutPage />)
    expect(await screen.findByText('Add Rs500 more to use this coupon', {}, { timeout: 3000 })).toBeInTheDocument()
    expect(screen.queryByTestId('checkout-discount')).toBeNull()
    expect(screen.getByTestId('coupon-live')).toHaveTextContent(/SAVE10 removed/)
  })

  it('on a non-coupon failure (429 / offline) keeps the coupon, hides the preview amount and says it will be confirmed', async () => {
    const view = await renderForm()
    await applyCode()
    validateCoupon.mockRejectedValue(new ApiError('Too many requests', 429, null))
    cart.items = [{ ...line, quantity: 2 }]
    cart.count = 2
    view.rerender(<CheckoutPage />)
    await waitFor(() => expect(validateCoupon).toHaveBeenCalledTimes(2), { timeout: 3000 })
    const row = await screen.findByTestId('checkout-discount')
    expect(row).toHaveTextContent('Discount (SAVE10)')
    expect(row).toHaveTextContent('Discount will be confirmed when you place the order')
    expect(row).not.toHaveTextContent('-Rs')
    // no preview discount in the total: 200 + 50 shipping
    expect(totalText()).toContain('Rs250')
    expect(screen.getByTestId('coupon-live')).toHaveTextContent('Discount will be confirmed when you place the order.')
    // the coupon is still sent, the server decides
    createOrder.mockResolvedValue({ id: 7, total: 230, discount: 20, couponCode: 'SAVE10', paymentMethod: 'COD', items: [] })
    fireEvent.submit(view.container.querySelector('form')!)
  })

  it('debounces subtotal-driven re-validation: quick consecutive changes cost one request', async () => {
    const view = await renderForm()
    await applyCode()
    validateCoupon.mockClear()
    validateCoupon.mockResolvedValue(ok10('SAVE10', 30))
    for (const q of [2, 3, 4]) {
      cart.items = [{ ...line, quantity: q }]
      cart.count = q
      view.rerender(<CheckoutPage />)
    }
    expect(validateCoupon).not.toHaveBeenCalled() // still waiting out the debounce
    await waitFor(() => expect(validateCoupon).toHaveBeenCalledTimes(1), { timeout: 3000 })
    expect(validateCoupon).toHaveBeenCalledWith('SAVE10', 400)
    // no more calls follow
    await new Promise((r) => setTimeout(r, 700))
    expect(validateCoupon).toHaveBeenCalledTimes(1)
  })
})

describe('checkout coupon and GST', () => {
  it('shows GST on the discounted value, so the total equals what the server charges', async () => {
    cart.items = [{ ...line, price: 1000, gstRate: 18 }]
    fn(api.getProductBySlug).mockResolvedValue({ id: 1, price: 1000, gstRate: 18, stock: 10, active: true })
    validateCoupon.mockResolvedValue({ code: 'SAVE20', type: 'PERCENT', value: 20, discount: 200 })
    const view = render(<CheckoutPage />)
    await waitFor(() => expect(view.container.querySelector('form')).not.toBeNull())
    // before the coupon: 1000 + 50 shipping + 180 GST
    await waitFor(() => expect(totalText()).toContain('Rs1230'))
    openDisclosure()
    set(codeBox(), 'save20')
    fireEvent.click(screen.getByRole('button', { name: /^apply$/i }))
    await screen.findByText(/applied/i, { selector: 'span' })
    // 1000 - 200 + 50 + 18% of 800 (144)
    await waitFor(() => expect(totalText()).toContain('Rs994'))
    expect(totalText()).toContain('Rs144')
    expect(totalText()).not.toContain('Rs180')
  })
})

describe('checkout coupon total floor', () => {
  it('holds the order with the coupon message when the preview total would be below the floor, and keeps the coupon', async () => {
    // 100 item, free shipping not reached (flat 50)... make the discount swallow everything but shipping:
    fn(api.getSettings).mockResolvedValue({ 'shipping.flatRate': '0' })
    validateCoupon.mockResolvedValue({ code: 'ALL', type: 'PERCENT', value: 100, discount: 100, minTotal: 1 })
    const view = render(<CheckoutPage />)
    await waitFor(() => expect(view.container.querySelector('form')).not.toBeNull())
    await waitFor(() => expect(totalText()).toContain('Rs100'))
    openDisclosure()
    set(codeBox(), 'all')
    fireEvent.click(screen.getByRole('button', { name: /^apply$/i }))
    await screen.findByText(/applied/i, { selector: 'span' })
    const notice = await screen.findByTestId('coupon-notice')
    expect(notice).toHaveTextContent('below ₹1')
    expect(notice).not.toHaveAttribute('role')
    // coupon is kept, the order is held
    expect(screen.getByTestId('checkout-discount')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /place order/i })).toBeDisabled()
    expect(document.getElementById('checkout-gate')).toHaveTextContent('below ₹1')
    fireEvent.submit(view.container.querySelector('form')!)
    expect(createOrder).not.toHaveBeenCalled()
    // removing the coupon releases it
    fireEvent.click(screen.getByRole('button', { name: /remove coupon all/i }))
    await waitFor(() => expect(screen.getByRole('button', { name: /place order/i })).not.toBeDisabled())
  })

  it('uses the floor the server sends with the preview', async () => {
    fn(api.getSettings).mockResolvedValue({ 'shipping.flatRate': '0' })
    validateCoupon.mockResolvedValue({ code: 'BIG', type: 'FLAT', value: 40, discount: 40, minTotal: 70 })
    const view = render(<CheckoutPage />)
    await waitFor(() => expect(view.container.querySelector('form')).not.toBeNull())
    await waitFor(() => expect(totalText()).toContain('Rs100'))
    openDisclosure()
    set(codeBox(), 'big')
    fireEvent.click(screen.getByRole('button', { name: /^apply$/i }))
    // total 60 < 70
    expect(await screen.findByTestId('coupon-notice')).toHaveTextContent('below ₹70')
  })

  it('does not block when the total stays at or above the floor', async () => {
    await renderForm()
    await applyCode()
    expect(screen.queryByTestId('coupon-notice')).toBeNull()
    expect(screen.getByRole('button', { name: /place order/i })).not.toBeDisabled()
  })
})

describe('checkout coupon at order time', () => {
  it('sends couponCode with the order and goes to success (COD)', async () => {
    createOrder.mockResolvedValue({ id: 7, total: 140, discount: 10, couponCode: 'SAVE10', paymentMethod: 'COD', items: [] })
    const { container } = await renderForm()
    await applyCode()
    fillRest(container)
    fireEvent.submit(container.querySelector('form')!)
    await waitFor(() => expect(router.push).toHaveBeenCalledWith('/checkout/success?orderId=7'))
    expect(createOrder.mock.calls[0][0].couponCode).toBe('SAVE10')
    // the client never sends an amount: only ids and quantities
    expect(createOrder.mock.calls[0][0]).not.toHaveProperty('total')
    expect(createOrder.mock.calls[0][0]).not.toHaveProperty('discount')
  })

  it('sends no couponCode when none is applied', async () => {
    createOrder.mockResolvedValue({ id: 7, total: 150, paymentMethod: 'COD', items: [] })
    const { container } = await renderForm()
    fillRest(container)
    fireEvent.submit(container.querySelector('form')!)
    await waitFor(() => expect(createOrder).toHaveBeenCalled())
    expect(createOrder.mock.calls[0][0]).not.toHaveProperty('couponCode')
  })

  it('a server coupon rejection drops the coupon, shows the reason inline and does NOT retry without it', async () => {
    createOrder.mockRejectedValue(badCoupon('Coupon usage limit reached'))
    const { container } = await renderForm()
    await applyCode()
    fillRest(container)
    fireEvent.submit(container.querySelector('form')!)
    expect(await screen.findByText('Coupon usage limit reached')).toBeInTheDocument()
    expect(createOrder).toHaveBeenCalledTimes(1)
    expect(screen.queryByTestId('checkout-discount')).toBeNull()
    expect(totalText()).toContain('Rs150')
    expect(router.push).not.toHaveBeenCalled()
    expect(codeBox()).toHaveAccessibleDescription('Coupon usage limit reached')
    // The shopper decides: a second submit now goes without a coupon.
    createOrder.mockResolvedValue({ id: 8, total: 150, paymentMethod: 'COD', items: [] })
    fireEvent.submit(container.querySelector('form')!)
    await waitFor(() => expect(createOrder).toHaveBeenCalledTimes(2))
    expect(createOrder.mock.calls[1][0]).not.toHaveProperty('couponCode')
  })

  it('online order: the pending panel shows the amount the server persisted, with the discount', async () => {
    fn(api.getPaymentConfig).mockResolvedValue({ enabled: true })
    createOrder.mockResolvedValue({
      id: 9, total: 140, discount: 10, couponCode: 'SAVE10', paymentMethod: 'RAZORPAY', paymentStatus: 'UNPAID', status: 'PENDING', items: [],
    })
    const { container } = await renderForm()
    await applyCode()
    fillRest(container)
    fireEvent.submit(container.querySelector('form')!)
    const panel = await screen.findByTestId('pending-amounts')
    expect(panel).toHaveTextContent('Rs140')
    expect(panel).toHaveTextContent('discount of Rs10')
    expect(panel).toHaveTextContent('SAVE10')
  })

  it('pending-order restore shows the persisted discount from the order, not a recomputation', async () => {
    fn(api.getPaymentConfig).mockResolvedValue({ enabled: true })
    window.sessionStorage.setItem('fp_pending_order', JSON.stringify({ id: 42, createdAt: Date.now() }))
    window.sessionStorage.setItem('fp_last_order_email', 'guest@example.com')
    trackOrder.mockResolvedValue({
      id: 42, status: 'PENDING', paymentMethod: 'RAZORPAY', paymentStatus: 'UNPAID', total: 133.5, discount: 16.5, couponCode: 'SAVE10', items: [],
    })
    render(<CheckoutPage />)
    const panel = await screen.findByTestId('pending-amounts')
    expect(panel).toHaveTextContent('Rs133.5')
    expect(panel).toHaveTextContent('discount of Rs16.5')
    expect(panel).toHaveTextContent('coupon SAVE10')
  })

  it('a pending order without a coupon shows no discount sentence', async () => {
    fn(api.getPaymentConfig).mockResolvedValue({ enabled: true })
    window.sessionStorage.setItem('fp_pending_order', JSON.stringify({ id: 42, createdAt: Date.now() }))
    window.sessionStorage.setItem('fp_last_order_email', 'guest@example.com')
    trackOrder.mockResolvedValue({ id: 42, status: 'PENDING', paymentMethod: 'RAZORPAY', paymentStatus: 'UNPAID', total: 150, items: [] })
    render(<CheckoutPage />)
    const panel = await screen.findByTestId('pending-amounts')
    expect(panel).toHaveTextContent('Rs150')
    expect(panel).not.toHaveTextContent(/discount/i)
  })
})

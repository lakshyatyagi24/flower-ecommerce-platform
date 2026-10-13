import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import CheckoutPage from '../page'
import { api, ApiError } from '@/lib/api'
import { payForOrder } from '@/lib/razorpay-flow'
import { OPEN_SIGN_IN_EVENT } from '@/lib/sign-in-request'

// Stable references: a fresh object per render would retrigger the page's effects forever.
const router = { push: vi.fn(), replace: vi.fn() }
const cart = {
  items: [{ productId: 1, slug: 'rose', name: 'Rose', price: 100, quantity: 1, image: null, gstRate: 0 }],
  count: 1,
  clear: vi.fn(),
  remove: vi.fn(),
  replaceWith: vi.fn(),
}
const auth: { user: null | { id: number; email: string; name: string; phone: string }; loading: boolean } = {
  user: null,
  loading: false,
}

vi.mock('next/navigation', () => ({ useRouter: () => router }))
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
    api: {
      getSettings: vi.fn(),
      getPaymentConfig: vi.fn(),
      getDeliveryOptions: vi.fn(async () => ({ earliest: '2026-10-14', latest: '2026-10-28', blackoutDates: [] })),
      getProductBySlug: vi.fn(),
      createOrder: vi.fn(),
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
const getMyOrder = fn(api.getMyOrder)
const trackOrder = fn(api.trackOrder)
const setMethod = fn(api.setOrderPaymentMethod)
const getPaymentConfig = fn(api.getPaymentConfig)
const pay = fn(payForOrder)

const PENDING_KEY = 'fp_pending_order'
const EMAIL_KEY = 'fp_last_order_email'
const GUEST = 'guest@example.com'
const order = { id: 42, status: 'PENDING', paymentMethod: 'RAZORPAY', paymentStatus: 'UNPAID', total: 150, items: [] }

beforeEach(() => {
  window.sessionStorage.clear()
  auth.user = null
  auth.loading = false
  router.push.mockReset()
  router.replace.mockReset()
  cart.clear.mockReset()
  cart.remove.mockReset()
  cart.replaceWith.mockReset()
  createOrder.mockReset()
  getMyOrder.mockReset()
  trackOrder.mockReset()
  setMethod.mockReset()
  pay.mockReset()
  fn(api.getSettings).mockReset().mockResolvedValue({ 'shipping.flatRate': '50' })
  getPaymentConfig.mockReset().mockResolvedValue({ enabled: true })
  fn(api.getProductBySlug).mockReset().mockResolvedValue({ id: 1, price: 100, gstRate: 0, stock: 10, active: true })
})

const set = (el: Element, v: string) => fireEvent.change(el, { target: { value: v } })

async function renderForm() {
  const view = render(<CheckoutPage />)
  await waitFor(() => expect(view.container.querySelector('form')).not.toBeNull())
  return view
}

function fillRest(container: HTMLElement, email = GUEST) {
  set(screen.getByLabelText(/full name/i), 'Guest Buyer')
  set(screen.getByLabelText(/^email/i), email)
  set(screen.getByPlaceholderText('+91 99999 11111'), '9999911111')
  set(container.querySelector('textarea')!, '12 Rose Street')
  const inputs = container.querySelectorAll('input[maxlength]')
  set(inputs[0], 'Pune')
  set(inputs[1], '411001')
}

describe('guest checkout: no forced login', () => {
  it('renders the form for a logged-out shopper and never redirects to login', async () => {
    await renderForm()
    expect(router.replace).not.toHaveBeenCalled()
    expect(router.push).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: /place order/i })).toBeInTheDocument()
  })

  it('says "Checkout as guest" with an empty email field and a hint about where it is used', async () => {
    await renderForm()
    expect(screen.getByRole('heading', { name: /checkout as guest/i })).toBeInTheDocument()
    const email = screen.getByLabelText(/^email/i) as HTMLInputElement
    expect(email.value).toBe('')
    expect(email).toHaveAttribute('type', 'email')
    expect(email).toHaveAccessibleDescription(/confirmation and tracking details are sent here/i)
  })

  it('does not show the guest panel to a signed-in customer, and prefills from the account', async () => {
    auth.user = { id: 1, email: 'acct@example.com', name: 'Asha', phone: '9999911111' }
    await renderForm()
    expect(screen.queryByRole('heading', { name: /checkout as guest/i })).toBeNull()
    expect((screen.getByLabelText(/^email/i) as HTMLInputElement).value).toBe('acct@example.com')
    expect((screen.getByLabelText(/full name/i) as HTMLInputElement).value).toBe('Asha')
    expect((screen.getByLabelText(/^email/i)).getAttribute('aria-describedby') ?? '').not.toMatch(/hint/)
  })

  it('waits for auth to be known before choosing between guest and account', async () => {
    auth.loading = true
    const { container } = render(<CheckoutPage />)
    expect(container.querySelector('form')).toBeNull()
    expect(container.querySelector('[aria-busy="true"]')).not.toBeNull()
    expect(router.replace).not.toHaveBeenCalled()
  })
})

describe('guest checkout: validation', () => {
  it('requires an email and a valid one, with an inline error (not an alert) tied to the field', async () => {
    const { container } = await renderForm()
    fillRest(container, '')
    fireEvent.submit(container.querySelector('form')!)
    const email = screen.getByLabelText(/^email/i)
    await waitFor(() => expect(email).toHaveAttribute('aria-invalid', 'true'))
    expect(email).toHaveAccessibleDescription(/enter your email address/i)
    expect(createOrder).not.toHaveBeenCalled()
    // The field's own message is plain text (the focused summary above the form is the one live announcement).
    expect(document.getElementById('checkout-email-error')).not.toHaveAttribute('role')

    set(email, 'not-an-email')
    fireEvent.submit(container.querySelector('form')!)
    await waitFor(() => expect(email).toHaveAccessibleDescription(/enter a valid email address/i))
    expect(createOrder).not.toHaveBeenCalled()
  })
})

describe('guest checkout: sign in without losing the form', () => {
  let heard: Event[]
  const listener = (e: Event) => heard.push(e)
  beforeEach(() => {
    heard = []
    window.addEventListener(OPEN_SIGN_IN_EVENT, listener)
  })
  afterEach(() => window.removeEventListener(OPEN_SIGN_IN_EVENT, listener))

  it('"Have an account? Sign in" asks the header for the dialog instead of navigating, and keeps what was typed', async () => {
    const { container } = await renderForm()
    fillRest(container)
    const signIn = screen.getByRole('button', { name: /sign in to your account/i })
    expect(screen.getByText(/have an account\?/i)).toBeInTheDocument()
    fireEvent.click(signIn)
    expect(heard).toHaveLength(1)
    expect((heard[0] as CustomEvent).detail.trigger).toBe(signIn)
    expect(router.push).not.toHaveBeenCalled()
    expect(router.replace).not.toHaveBeenCalled()
    expect((screen.getByLabelText(/full name/i) as HTMLInputElement).value).toBe('Guest Buyer')
    expect((container.querySelector('textarea') as HTMLTextAreaElement).value).toBe('12 Rose Street')
  })

  it('after signing in the typed address and phone stay, the account email takes over and the guest panel goes', async () => {
    const view = await renderForm()
    fillRest(view.container)
    auth.user = { id: 1, email: 'acct@example.com', name: 'Asha', phone: '9000000000' }
    view.rerender(<CheckoutPage />)
    await waitFor(() => expect(screen.queryByRole('heading', { name: /checkout as guest/i })).toBeNull())
    expect((screen.getByLabelText(/^email/i) as HTMLInputElement).value).toBe('acct@example.com')
    expect((screen.getByLabelText(/full name/i) as HTMLInputElement).value).toBe('Guest Buyer')
    expect((view.container.querySelector('textarea') as HTMLTextAreaElement).value).toBe('12 Rose Street')
    expect((screen.getByPlaceholderText('+91 99999 11111') as HTMLInputElement).value).toBe('9999911111')
  })
})

describe('guest checkout: placing the order', () => {
  it('COD: sends the typed email, keeps it in sessionStorage (not the URL) and goes to the success page', async () => {
    createOrder.mockResolvedValue({ ...order, paymentMethod: 'COD' })
    const { container } = await renderForm()
    fireEvent.click(screen.getByRole('radio', { name: /cash on delivery/i }))
    fillRest(container)
    fireEvent.submit(container.querySelector('form')!)
    await waitFor(() => expect(router.push).toHaveBeenCalledWith('/checkout/success?orderId=42'))
    expect(createOrder.mock.calls[0][0].customerEmail).toBe(GUEST)
    expect(window.sessionStorage.getItem(EMAIL_KEY)).toBe(GUEST)
    expect(router.push.mock.calls[0][0]).not.toContain('example.com')
    expect(cart.clear).toHaveBeenCalled()
    expect(pay).not.toHaveBeenCalled()
  })

  it('online: stores the pending order and the email, and pays with the guest email', async () => {
    createOrder.mockResolvedValue(order)
    const { container } = await renderForm()
    fillRest(container)
    fireEvent.submit(container.querySelector('form')!)
    await waitFor(() => expect(pay).toHaveBeenCalledTimes(1))
    expect(pay.mock.calls[0][0]).toBe(42)
    expect(pay.mock.calls[0][2]).toBe(GUEST)
    expect(JSON.parse(window.sessionStorage.getItem(PENDING_KEY)!).id).toBe(42)
    expect(window.sessionStorage.getItem(EMAIL_KEY)).toBe(GUEST)
    expect(cart.clear).not.toHaveBeenCalled()
    expect(container.querySelector('form')).toBeNull()
  })

  it('a signed-in customer never writes the guest email key and pays without an email', async () => {
    auth.user = { id: 1, email: 'acct@example.com', name: 'Asha', phone: '9999911111' }
    createOrder.mockResolvedValue(order)
    const { container } = await renderForm()
    fillRest(container, 'acct@example.com')
    fireEvent.submit(container.querySelector('form')!)
    await waitFor(() => expect(pay).toHaveBeenCalledTimes(1))
    expect(window.sessionStorage.getItem(EMAIL_KEY)).toBeNull()
    expect(pay.mock.calls[0][2]).toBeUndefined()
  })
})

describe('guest checkout: pending order after a reload', () => {
  const remember = (email: string | null = GUEST) => {
    window.sessionStorage.setItem(PENDING_KEY, JSON.stringify({ id: 42, createdAt: Date.now() }))
    if (email) window.sessionStorage.setItem(EMAIL_KEY, email)
  }

  it('restores the pending panel without a login: reads the order by id + email, never through the account endpoint', async () => {
    remember()
    trackOrder.mockResolvedValue(order)
    render(<CheckoutPage />)
    await screen.findByRole('heading', { name: /payment pending/i })
    expect(trackOrder).toHaveBeenCalledWith(42, GUEST)
    expect(getMyOrder).not.toHaveBeenCalled()
    expect(router.replace).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: /pay now/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /place order/i })).toBeNull()
  })

  it('without the email a guest order cannot be read: the form shows and the stale pending key is dropped', async () => {
    remember(null)
    const { container } = render(<CheckoutPage />)
    await waitFor(() => expect(container.querySelector('form')).not.toBeNull())
    expect(trackOrder).not.toHaveBeenCalled()
    expect(window.sessionStorage.getItem(PENDING_KEY)).toBeNull()
  })

  it('a lookup that fails (order gone / email mismatch) drops both keys and shows the form', async () => {
    remember()
    trackOrder.mockRejectedValue(new Error('Order not found'))
    const { container } = render(<CheckoutPage />)
    await waitFor(() => expect(container.querySelector('form')).not.toBeNull())
    expect(window.sessionStorage.getItem(PENDING_KEY)).toBeNull()
    expect(window.sessionStorage.getItem(EMAIL_KEY)).toBeNull()
  })

  it('a restored order that was cancelled drops both keys and shows the form', async () => {
    remember()
    trackOrder.mockResolvedValue({ ...order, status: 'CANCELLED' })
    const { container } = render(<CheckoutPage />)
    await waitFor(() => expect(container.querySelector('form')).not.toBeNull())
    expect(window.sessionStorage.getItem(PENDING_KEY)).toBeNull()
    expect(window.sessionStorage.getItem(EMAIL_KEY)).toBeNull()
  })

  it('a restored order that is already paid goes to the success page and KEEPS the email for it', async () => {
    remember()
    trackOrder.mockResolvedValue({ ...order, status: 'PAID', paymentStatus: 'PAID' })
    render(<CheckoutPage />)
    await waitFor(() => expect(router.push).toHaveBeenCalledWith('/checkout/success?orderId=42'))
    expect(window.sessionStorage.getItem(EMAIL_KEY)).toBe(GUEST)
    expect(cart.clear).toHaveBeenCalled()
  })

  it('with no pending key a guest simply gets the form', async () => {
    window.sessionStorage.setItem(EMAIL_KEY, GUEST)
    await renderForm()
    expect(trackOrder).not.toHaveBeenCalled()
  })
})

describe('guest checkout: pending panel actions', () => {
  beforeEach(() => {
    window.sessionStorage.setItem(PENDING_KEY, JSON.stringify({ id: 42, createdAt: Date.now() }))
    window.sessionStorage.setItem(EMAIL_KEY, GUEST)
    trackOrder.mockResolvedValue(order)
  })

  it('Pay now passes the guest email', async () => {
    render(<CheckoutPage />)
    fireEvent.click(await screen.findByRole('button', { name: /pay now/i }))
    expect(pay).toHaveBeenCalledTimes(1)
    expect(pay.mock.calls[0][0]).toBe(42)
    expect(pay.mock.calls[0][2]).toBe(GUEST)
  })

  it('Switch to COD re-checks by email, switches with the guest email, clears and goes to success', async () => {
    setMethod.mockResolvedValue({ ...order, paymentMethod: 'COD' })
    render(<CheckoutPage />)
    fireEvent.click(await screen.findByRole('button', { name: /switch to cash on delivery/i }))
    trackOrder.mockClear()
    fireEvent.click(screen.getByRole('button', { name: /yes, switch/i }))
    await waitFor(() => expect(setMethod).toHaveBeenCalledWith(42, GUEST))
    expect(trackOrder).toHaveBeenCalledWith(42, GUEST) // pre-switch re-check
    expect(getMyOrder).not.toHaveBeenCalled()
    await waitFor(() => expect(router.push).toHaveBeenCalledWith('/checkout/success?orderId=42'))
    expect(cart.clear).toHaveBeenCalled()
    expect(window.sessionStorage.getItem(PENDING_KEY)).toBeNull()
  })

  it('Switch finds the order already paid and never calls the switch endpoint', async () => {
    render(<CheckoutPage />)
    fireEvent.click(await screen.findByRole('button', { name: /switch to cash on delivery/i }))
    trackOrder.mockResolvedValue({ ...order, status: 'PAID', paymentStatus: 'PAID' })
    fireEvent.click(screen.getByRole('button', { name: /yes, switch/i }))
    await waitFor(() => expect(router.push).toHaveBeenCalledWith('/checkout/success?orderId=42'))
    expect(setMethod).not.toHaveBeenCalled()
  })

  it('Check status after an expired order shows the expiry panel (stale-cancel) and drops the pending key', async () => {
    render(<CheckoutPage />)
    await screen.findByRole('heading', { name: /payment pending/i })
    trackOrder.mockResolvedValue({ ...order, status: 'CANCELLED' })
    fireEvent.click(await screen.findByRole('button', { name: /check status/i }))
    await screen.findByRole('heading', { name: /order expired/i })
    expect(window.sessionStorage.getItem(PENDING_KEY)).toBeNull()
    expect(window.sessionStorage.getItem(EMAIL_KEY)).toBeNull() // the guest key is spent
  })

  it('if the email was lost, Check status says how to look the order up instead of failing silently', async () => {
    render(<CheckoutPage />)
    await screen.findByRole('heading', { name: /payment pending/i })
    window.sessionStorage.removeItem(EMAIL_KEY)
    fireEvent.click(screen.getByRole('button', { name: /check status/i }))
    expect((await screen.findByRole('alert')).textContent).toMatch(/track order/i)
  })
})

describe('guest checkout: signing in with a pending guest order', () => {
  it('restores the guest order through its email when the account lookup says it is not theirs', async () => {
    auth.user = { id: 1, email: 'acct@example.com', name: 'Asha', phone: '' }
    window.sessionStorage.setItem(PENDING_KEY, JSON.stringify({ id: 42, createdAt: Date.now() }))
    window.sessionStorage.setItem(EMAIL_KEY, GUEST)
    getMyOrder.mockRejectedValue(new ApiError('Not your order', 403, null))
    trackOrder.mockResolvedValue(order)
    render(<CheckoutPage />)
    await screen.findByRole('heading', { name: /payment pending/i })
    expect(trackOrder).toHaveBeenCalledWith(42, GUEST)
    fireEvent.click(screen.getByRole('button', { name: /pay now/i }))
    expect(pay.mock.calls[0][2]).toBe(GUEST) // still the guest email, token or not
  })

  it('signing in while the pending panel is up does not tear it down', async () => {
    window.sessionStorage.setItem(PENDING_KEY, JSON.stringify({ id: 42, createdAt: Date.now() }))
    window.sessionStorage.setItem(EMAIL_KEY, GUEST)
    trackOrder.mockResolvedValue(order)
    const view = render(<CheckoutPage />)
    await screen.findByRole('heading', { name: /payment pending/i })
    getMyOrder.mockRejectedValue(new ApiError('Not your order', 403, null))
    auth.user = { id: 1, email: 'acct@example.com', name: 'Asha', phone: '' }
    view.rerender(<CheckoutPage />)
    expect(screen.getByRole('heading', { name: /payment pending/i })).toBeInTheDocument()
    expect(window.sessionStorage.getItem(PENDING_KEY)).not.toBeNull()
  })
})

describe('guest checkout: minimum-order rejection from the server', () => {
  it('shows the minimum in plain words, keeps the typed form, and re-reads the product', async () => {
    fn(api.getProductBySlug).mockResolvedValue({ id: 1, price: 100, gstRate: 0, stock: 10, active: true, minOrderQty: 1 })
    createOrder.mockRejectedValue(new ApiError('"Rose" has a minimum order of 5', 400, null))
    const { container } = await renderForm()
    fillRest(container)
    fireEvent.click(screen.getByRole('radio', { name: /cash on delivery/i }))
    const before = fn(api.getProductBySlug).mock.calls.length
    fireEvent.submit(container.querySelector('form')!)
    expect((await screen.findAllByText(/has a minimum order of 5/i)).length).toBeGreaterThan(0)
    expect(window.sessionStorage.getItem(EMAIL_KEY)).toBeNull() // nothing was placed
    await waitFor(() => expect(fn(api.getProductBySlug).mock.calls.length).toBeGreaterThan(before + 1))
    expect((screen.getByLabelText(/full name/i) as HTMLInputElement).value).toBe('Guest Buyer')
    expect(router.push).not.toHaveBeenCalled()
  })
})

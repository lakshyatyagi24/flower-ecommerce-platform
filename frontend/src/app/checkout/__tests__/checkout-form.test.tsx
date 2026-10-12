import React from 'react'
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import CheckoutPage from '../page'
import { api } from '@/lib/api'
import { validateCheckout, PHONE_PATTERN, PIN_PATTERN } from '@/lib/checkout-validation'

const router = { push: vi.fn(), replace: vi.fn() }
const cart = {
  items: [
    { productId: 1, slug: 'rose', name: 'Rose', price: 100, quantity: 2, image: null, gstRate: 18 },
    { productId: 2, slug: 'lily', name: 'Lily', price: 50, quantity: 1, image: null, gstRate: 0 },
  ],
  count: 3,
  clear: vi.fn(),
}
const auth = { user: { id: 1, email: 'a@b.co', name: 'Asha', phone: '' }, loading: false }

vi.mock('next/navigation', () => ({ useRouter: () => router }))
vi.mock('@/lib/cart-context', () => ({ formatINR: (n: number) => `Rs${n}`, useCart: () => cart }))
vi.mock('@/lib/auth-context', () => ({ useAuth: () => auth }))
vi.mock('@/lib/api', () => {
  class ApiError extends Error {
    status: number
    constructor(m: string, s: number) {
      super(m)
      this.status = s
    }
  }
  return {
    ApiError,
    api: {
      getSettings: vi.fn(),
      getPaymentConfig: vi.fn(),
      getProductBySlug: vi.fn(),
      createOrder: vi.fn(),
      getMyOrder: vi.fn(),
    },
  }
})
vi.mock('@/lib/razorpay-flow', () => ({ payForOrder: vi.fn() }))

const fn = (f: unknown) => f as ReturnType<typeof vi.fn>

beforeEach(() => {
  window.sessionStorage.clear()
  router.push.mockReset()
  fn(api.createOrder).mockReset()
  fn(api.getSettings).mockReset().mockResolvedValue({ 'shipping.flatRate': '50' })
  fn(api.getPaymentConfig).mockReset().mockResolvedValue({ enabled: true })
  fn(api.getProductBySlug)
    .mockReset()
    .mockImplementation(async (slug: string) =>
      slug === 'rose' ? { id: 1, price: 100, gstRate: 18 } : { id: 2, price: 50, gstRate: 0 },
    )
})

async function renderForm() {
  const view = render(<CheckoutPage />)
  await waitFor(() => expect(view.container.querySelector('form')).not.toBeNull())
  return view
}

describe('checkout validation rules', () => {
  it('keeps the Phase 1 phone and PIN patterns', () => {
    expect(PHONE_PATTERN).toBe('(\\+?91[\\s\\-]?|0)?[6-9][0-9]{4}[\\s\\-]?[0-9]{5}')
    expect(PIN_PATTERN).toBe('[1-9][0-9]{5}')
  })
  it('accepts valid and rejects invalid values', () => {
    const ok = { customerName: 'A', customerEmail: 'a@b.co', customerPhone: '+91 99999 11111', shippingAddress: 'x', city: 'Pune', postalCode: '411001' }
    expect(validateCheckout(ok)).toEqual({})
    expect(validateCheckout({ ...ok, customerPhone: '12345' }).customerPhone).toBeTruthy()
    expect(validateCheckout({ ...ok, postalCode: '011001' }).postalCode).toBeTruthy()
    expect(validateCheckout({ ...ok, customerEmail: 'nope' }).customerEmail).toBeTruthy()
    expect(Object.keys(validateCheckout({ ...ok, customerName: ' ', city: '' }))).toEqual(['customerName', 'city'])
  })
})

describe('checkout field attributes', () => {
  it('sets autocomplete, inputMode, pattern and maxLength on every field', async () => {
    await renderForm()
    expect(screen.getByLabelText(/full name/i)).toHaveAttribute('autocomplete', 'name')
    expect(screen.getByLabelText(/^email/i)).toHaveAttribute('autocomplete', 'email')
    const phone = screen.getByLabelText(/^phone/i)
    expect(phone).toHaveAttribute('autocomplete', 'tel')
    expect(phone).toHaveAttribute('inputmode', 'tel')
    expect(phone).toHaveAttribute('type', 'tel')
    expect(phone).toHaveAttribute('pattern', PHONE_PATTERN)
    expect(screen.getByLabelText(/^address/i)).toHaveAttribute('autocomplete', 'street-address')
    const city = screen.getByLabelText(/^city/i)
    expect(city).toHaveAttribute('autocomplete', 'address-level2')
    expect(city).toHaveAttribute('maxlength', '80')
    const pin = screen.getByLabelText(/pin code/i)
    expect(pin).toHaveAttribute('autocomplete', 'postal-code')
    expect(pin).toHaveAttribute('inputmode', 'numeric')
    expect(pin).toHaveAttribute('maxlength', '6')
    expect(pin).toHaveAttribute('pattern', PIN_PATTERN)
  })

  it('marks the notes field optional and every control has an accessible label', async () => {
    const { container } = await renderForm()
    expect(screen.getByText('(optional)')).toBeInTheDocument()
    const controls = container.querySelectorAll<HTMLElement>('input, select, textarea')
    expect(controls.length).toBeGreaterThanOrEqual(8)
    controls.forEach((el) => {
      const labelled = (el as HTMLInputElement).labels?.length || el.getAttribute('aria-label')
      expect(labelled, el.outerHTML).toBeTruthy()
    })
  })

  it('has two numbered sections: Contact & delivery and Payment', async () => {
    await renderForm()
    expect(screen.getByRole('group', { name: /contact & delivery/i })).toBeInTheDocument()
    expect(screen.getByRole('group', { name: /payment/i })).toBeInTheDocument()
  })
})

describe('checkout inline errors and summary', () => {
  it('shows an inline error after blur, linked by aria-describedby', async () => {
    await renderForm()
    const phone = screen.getByLabelText(/^phone/i)
    expect(screen.queryByText(/valid 10-digit/i)).toBeNull()
    fireEvent.change(phone, { target: { value: '123' } })
    fireEvent.blur(phone)
    const msg = await screen.findByText(/valid 10-digit indian mobile/i)
    expect(phone).toHaveAttribute('aria-invalid', 'true')
    expect(phone.getAttribute('aria-describedby')).toContain(msg.id)
    fireEvent.change(phone, { target: { value: '9999911111' } })
    expect(screen.queryByText(/valid 10-digit indian mobile/i)).toBeNull()
  })

  it('a failed submit does not call the API, shows a summary and moves focus to it', async () => {
    const { container } = await renderForm()
    fireEvent.submit(container.querySelector('form')!)
    expect(fn(api.createOrder)).not.toHaveBeenCalled()
    const alerts = await screen.findAllByRole('alert')
    const top = alerts.find((a) => a.getAttribute('tabindex') === '-1')!
    expect(top).toBeTruthy()
    expect(top).toHaveTextContent(/enter your phone number/i)
    await waitFor(() => expect(document.activeElement).toBe(top))
    // the summary links to the offending fields
    const link = within(top).getByRole('link', { name: /enter your phone number/i })
    expect(link.getAttribute('href')).toBe(`#${screen.getByLabelText(/^phone/i).id}`)
  })

  it('shows a server error in the summary and focuses it', async () => {
    const { container } = await renderForm()
    fn(api.createOrder).mockRejectedValue(new Error('Item out of stock'))
    const set = (el: Element, v: string) => fireEvent.change(el, { target: { value: v } })
    set(screen.getByLabelText(/^phone/i), '9999911111')
    set(screen.getByLabelText(/^address/i), '12 Rose St')
    set(screen.getByLabelText(/^city/i), 'Pune')
    set(screen.getByLabelText(/pin code/i), '411001')
    fireEvent.submit(container.querySelector('form')!)
    const alert = await screen.findByText('Item out of stock')
    await waitFor(() => expect(document.activeElement).toBe(alert.closest('[role="alert"]')))
  })

  it('does not submit twice while a submit is in flight', async () => {
    const { container } = await renderForm()
    let resolve!: (v: unknown) => void
    fn(api.createOrder).mockReturnValue(new Promise((r) => (resolve = r)))
    const set = (el: Element, v: string) => fireEvent.change(el, { target: { value: v } })
    set(screen.getByLabelText(/^phone/i), '9999911111')
    set(screen.getByLabelText(/^address/i), '12 Rose St')
    set(screen.getByLabelText(/^city/i), 'Pune')
    set(screen.getByLabelText(/pin code/i), '411001')
    const form = container.querySelector('form')!
    fireEvent.submit(form)
    fireEvent.submit(form)
    expect(fn(api.createOrder)).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('button', { name: /placing order/i })).toBeDisabled()
    resolve({ id: 5, paymentMethod: 'COD' })
  })
})

describe('checkout order summary', () => {
  it('lists items with line totals, subtotal, shipping, GST and total', async () => {
    await renderForm()
    const summary = screen.getByRole('complementary', { name: /order summary/i })
    expect(within(summary).getByText('Rose')).toBeInTheDocument()
    expect(within(summary).getByText('Rs200')).toBeInTheDocument() // 2 x 100
    expect(within(summary).getByText('Subtotal').nextSibling).toHaveTextContent('Rs250')
    expect(within(summary).getByText('Shipping').nextSibling).toHaveTextContent('Rs50')
    expect(within(summary).getByText('GST').nextSibling).toHaveTextContent('Rs36')
    expect(within(summary).getByText('Total').nextSibling).toHaveTextContent('Rs336')
  })

  it('the mobile accordion toggle announces expanded state and shows count and total', async () => {
    await renderForm()
    const toggle = screen.getByRole('button', { name: /order summary \(3 items\)/i })
    expect(toggle).toHaveTextContent('Rs336')
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    const panel = document.getElementById(toggle.getAttribute('aria-controls')!)!
    expect(panel.className).toContain('hidden')
    fireEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    expect(panel.className).not.toMatch(/(^|\s)hidden(\s|$)/)
    fireEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
  })
})

describe('checkout trust notes', () => {
  it('mentions Razorpay only when online payment is selected and enabled; always the confirmation email', async () => {
    await renderForm()
    expect(screen.getByText(/secure payment via razorpay/i)).toBeInTheDocument()
    expect(screen.getByText(/we'll email your order confirmation/i)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('radio', { name: /cash on delivery/i }))
    expect(screen.queryByText(/secure payment via razorpay/i)).toBeNull()
  })

  it('no Razorpay claim when online payment is disabled', async () => {
    fn(api.getPaymentConfig).mockResolvedValue({ enabled: false })
    await renderForm()
    expect(screen.queryByText(/razorpay/i)).toBeNull()
  })
})

import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import CheckoutPage from '../page'
import { api } from '@/lib/api'

const router = { push: vi.fn(), replace: vi.fn() }
const cart = {
  items: [{ productId: 1, slug: 'rose', name: 'Rose', price: 100, quantity: 1, image: null, gstRate: 0 }],
  count: 1,
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
      checkPincode: vi.fn(),
    },
  }
})
vi.mock('@/lib/razorpay-flow', () => ({ payForOrder: vi.fn() }))

const fn = (f: unknown) => f as ReturnType<typeof vi.fn>
const NO = 'We do not deliver to this PIN code yet.'

beforeEach(() => {
  window.sessionStorage.clear()
  window.localStorage.clear()
  router.push.mockReset()
  fn(api.createOrder).mockReset().mockResolvedValue({ id: 9, paymentMethod: 'COD' })
  fn(api.checkPincode).mockReset()
  fn(api.getSettings).mockReset().mockResolvedValue({ 'shipping.flatRate': '50' })
  fn(api.getPaymentConfig).mockReset().mockResolvedValue({ enabled: true })
  fn(api.getProductBySlug).mockReset().mockResolvedValue({ id: 1, price: 100, gstRate: 0 })
})

async function fill(pin = '411001') {
  const view = render(<CheckoutPage />)
  await waitFor(() => expect(view.container.querySelector('form')).not.toBeNull())
  const set = (el: Element, v: string) => fireEvent.change(el, { target: { value: v } })
  set(screen.getByLabelText(/^phone/i), '9999911111')
  set(screen.getByLabelText(/^address/i), '12 Rose St')
  set(screen.getByLabelText(/^city/i), 'Pune')
  set(screen.getByLabelText(/pin code/i), pin)
  fireEvent.click(screen.getByRole('radio', { name: /cash on delivery/i }))
  return view
}

describe('checkout PIN serviceability gate', () => {
  it('blocks submit with an inline error when the PIN is not serviceable', async () => {
    fn(api.checkPincode).mockResolvedValue({ serviceable: false, message: NO })
    const { container } = await fill()
    fireEvent.submit(container.querySelector('form')!)
    const msg = await screen.findByText(NO)
    const pin = screen.getByLabelText(/pin code/i)
    expect(pin).toHaveAttribute('aria-invalid', 'true')
    expect(pin.getAttribute('aria-describedby')).toContain(msg.id)
    expect(msg.closest('[role="alert"]')).toBeNull()
    await waitFor(() => expect(document.activeElement).toBe(pin))
    expect(fn(api.createOrder)).not.toHaveBeenCalled()
  })

  it('checks on blur and shows the error before submit', async () => {
    fn(api.checkPincode).mockResolvedValue({ serviceable: false, message: NO })
    await fill()
    fireEvent.blur(screen.getByLabelText(/pin code/i))
    expect(await screen.findByText(NO)).toBeInTheDocument()
    expect(fn(api.checkPincode)).toHaveBeenCalledWith('411001')
  })

  it('clears the block when the PIN is edited', async () => {
    fn(api.checkPincode).mockResolvedValue({ serviceable: false, message: NO })
    await fill()
    fireEvent.blur(screen.getByLabelText(/pin code/i))
    await screen.findByText(NO)
    fireEvent.change(screen.getByLabelText(/pin code/i), { target: { value: '411002' } })
    expect(screen.queryByText(NO)).toBeNull()
  })

  it('places the order when the PIN is serviceable and remembers it', async () => {
    fn(api.checkPincode).mockResolvedValue({ serviceable: true, message: 'We deliver to this PIN code.' })
    const { container } = await fill()
    fireEvent.submit(container.querySelector('form')!)
    await waitFor(() => expect(fn(api.createOrder)).toHaveBeenCalledTimes(1))
    expect(window.localStorage.getItem('fp_pincode')).toBe('411001')
  })

  it('does NOT block when the check request itself fails (backend enforces)', async () => {
    fn(api.checkPincode).mockRejectedValue(new Error('network'))
    const { container } = await fill()
    fireEvent.submit(container.querySelector('form')!)
    await waitFor(() => expect(fn(api.createOrder)).toHaveBeenCalledTimes(1))
  })

  it('shows the backend rejection if the order is refused for the PIN', async () => {
    fn(api.checkPincode).mockRejectedValue(new Error('network'))
    fn(api.createOrder).mockRejectedValue(new Error('We do not deliver to this PIN code yet'))
    const { container } = await fill()
    fireEvent.submit(container.querySelector('form')!)
    expect(await screen.findByText('We do not deliver to this PIN code yet')).toBeInTheDocument()
  })

  it('prefills the PIN from fp_pincode when empty', async () => {
    window.localStorage.setItem('fp_pincode', '560001')
    const view = render(<CheckoutPage />)
    await waitFor(() => expect(view.container.querySelector('form')).not.toBeNull())
    await waitFor(() => expect((screen.getByLabelText(/pin code/i) as HTMLInputElement).value).toBe('560001'))
  })
})

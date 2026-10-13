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
      getDeliveryOptions: vi.fn(),
      getProductBySlug: vi.fn(),
      createOrder: vi.fn(),
      getMyOrder: vi.fn(),
      checkPincode: vi.fn(),
    },
  }
})
vi.mock('@/lib/razorpay-flow', () => ({ payForOrder: vi.fn() }))

const fn = (f: unknown) => f as ReturnType<typeof vi.fn>
const OPTIONS = { earliest: '2026-10-14', latest: '2026-10-28', blackoutDates: ['2026-10-20', '2026-10-21'] }

beforeEach(() => {
  window.sessionStorage.clear()
  window.localStorage.clear()
  router.push.mockReset()
  fn(api.createOrder).mockReset().mockResolvedValue({ id: 9, paymentMethod: 'COD' })
  fn(api.checkPincode).mockReset().mockResolvedValue({ serviceable: true, message: '' })
  fn(api.getSettings).mockReset().mockResolvedValue({ 'shipping.flatRate': '50' })
  fn(api.getPaymentConfig).mockReset().mockResolvedValue({ enabled: true })
  fn(api.getDeliveryOptions).mockReset().mockResolvedValue(OPTIONS)
  fn(api.getProductBySlug).mockReset().mockResolvedValue({ id: 1, price: 100, gstRate: 0 })
})

async function open() {
  const view = render(<CheckoutPage />)
  await waitFor(() => expect(view.container.querySelector('form')).not.toBeNull())
  const set = (el: Element, v: string) => fireEvent.change(el, { target: { value: v } })
  set(screen.getByLabelText(/^phone/i), '9999911111')
  set(screen.getByLabelText(/^address/i), '12 Rose St')
  set(screen.getByLabelText(/^city/i), 'Pune')
  set(screen.getByLabelText(/pin code/i), '411001')
  fireEvent.click(screen.getByRole('radio', { name: /cash on delivery/i }))
  return view
}

const dateInput = () => screen.getByLabelText(/delivery date/i) as HTMLInputElement

describe('checkout delivery date field', () => {
  it('is a native date input with min/max from the options and prefilled with the earliest date', async () => {
    await open()
    const input = dateInput()
    expect(input.type).toBe('date')
    expect(input.min).toBe('2026-10-14')
    expect(input.max).toBe('2026-10-28')
    expect(input.value).toBe('2026-10-14')
    expect(input).toBeRequired()
  })

  it('explains the window and lists the days we cannot deliver on', async () => {
    await open()
    const hint = document.getElementById(`${dateInput().id}-hint`)!
    expect(hint).toHaveTextContent('Wednesday, 14 October 2026')
    expect(hint).toHaveTextContent('Wednesday, 28 October 2026')
    expect(hint).toHaveTextContent("We can't deliver on: Tuesday, 20 October 2026; Wednesday, 21 October 2026")
    expect(dateInput().getAttribute('aria-describedby')).toContain(hint.id)
  })

  it('submits the chosen date in the createOrder payload', async () => {
    const { container } = await open()
    fireEvent.change(dateInput(), { target: { value: '2026-10-18' } })
    fireEvent.submit(container.querySelector('form')!)
    await waitFor(() => expect(fn(api.createOrder)).toHaveBeenCalledTimes(1))
    expect(fn(api.createOrder).mock.calls[0][0]).toMatchObject({ deliveryDate: '2026-10-18', postalCode: '411001' })
  })

  it('shows the chosen date in the order summary', async () => {
    await open()
    const summary = screen.getByRole('complementary', { name: /order summary/i })
    expect(summary).toHaveTextContent('Delivery dateWednesday, 14 October 2026')
    fireEvent.change(dateInput(), { target: { value: '2026-10-18' } })
    expect(summary).toHaveTextContent('Sunday, 18 October 2026')
  })

  it('rejects a blackout date inline (native input cannot disable it) and blocks submit', async () => {
    const { container } = await open()
    fireEvent.change(dateInput(), { target: { value: '2026-10-20' } })
    fireEvent.blur(dateInput())
    const msg = await screen.findByText(/We can't deliver on Tuesday, 20 October 2026/)
    expect(msg.id).toBe(`${dateInput().id}-error`)
    expect(msg.closest('[role="alert"]')).toBeNull()
    expect(dateInput()).toHaveAttribute('aria-invalid', 'true')
    fireEvent.submit(container.querySelector('form')!)
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument())
    expect(fn(api.createOrder)).not.toHaveBeenCalled()
  })

  it.each([
    ['2026-10-13', /between Wednesday, 14 October 2026 and Wednesday, 28 October 2026/],
    ['2026-10-29', /between Wednesday, 14 October 2026 and Wednesday, 28 October 2026/],
    ['', /choose a delivery date/i],
  ])('rejects %j inline', async (value, message) => {
    const { container } = await open()
    fireEvent.change(dateInput(), { target: { value } })
    fireEvent.submit(container.querySelector('form')!)
    expect((await screen.findAllByText(message)).length).toBeGreaterThan(0)
    expect(dateInput()).toHaveAttribute('aria-invalid', 'true')
    expect(fn(api.createOrder)).not.toHaveBeenCalled()
  })

  it('keeps a date the shopper picked', async () => {
    await open()
    fireEvent.change(dateInput(), { target: { value: '2026-10-25' } })
    expect(dateInput().value).toBe('2026-10-25')
  })

  it('shows an error state with retry and NO form when the options cannot be loaded', async () => {
    fn(api.getDeliveryOptions).mockRejectedValueOnce(new Error('down'))
    const { container } = render(<CheckoutPage />)
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/couldn't load the available delivery dates/i))
    expect(container.querySelector('form')).toBeNull()
    expect(screen.queryByRole('button', { name: /place order/i })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: /try again/i }))
    await waitFor(() => expect(container.querySelector('form')).not.toBeNull())
    expect(dateInput().value).toBe('2026-10-14')
    expect(fn(api.getDeliveryOptions)).toHaveBeenCalledTimes(2)
  })

  it('treats a malformed options payload as a failed load', async () => {
    fn(api.getDeliveryOptions).mockResolvedValue({ earliest: 'soon' })
    const { container } = render(<CheckoutPage />)
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/delivery dates/i))
    expect(container.querySelector('form')).toBeNull()
  })

  it('re-reads the window after the server rejects the date', async () => {
    fn(api.createOrder).mockRejectedValueOnce(new Error('Please choose a delivery date between A and B'))
    const { container } = await open()
    fireEvent.submit(container.querySelector('form')!)
    await waitFor(() => expect(fn(api.getDeliveryOptions)).toHaveBeenCalledTimes(2))
    expect(await screen.findByText(/Please choose a delivery date between A and B/)).toBeInTheDocument()
  })

  it('keeps the form mounted and focuses the error summary while the options reload slowly', async () => {
    fn(api.createOrder).mockRejectedValueOnce(new Error('Please choose a delivery date between A and B'))
    let resolveReload: (v: unknown) => void = () => {}
    fn(api.getDeliveryOptions)
      .mockResolvedValueOnce(OPTIONS)
      .mockReturnValueOnce(new Promise((r) => (resolveReload = r)))
    const { container } = await open()
    const form = container.querySelector('form')!
    fireEvent.change(screen.getByLabelText(/^address/i), { target: { value: 'Typed address' } })
    fireEvent.submit(form)
    const message = await screen.findByText(/Please choose a delivery date between A and B/)
    // reload is in flight: nothing was torn down, typed values survive, focus sits on the error summary
    expect(container.querySelector('form')).toBe(form)
    expect((screen.getByLabelText(/^address/i) as HTMLTextAreaElement).value).toBe('Typed address')
    expect(document.activeElement).toBe(message.closest('[tabindex]') ?? message.parentElement)
    expect(screen.queryByRole('button', { name: /try again/i })).toBeNull()
    resolveReload({ ...OPTIONS, earliest: '2026-10-15' })
    await waitFor(() => expect(dateInput().min).toBe('2026-10-15'))
    expect(container.querySelector('form')).toBe(form)
  })

  it('moves an untouched date to the new earliest after a reload, but keeps a later pick', async () => {
    fn(api.createOrder).mockRejectedValue(new Error('Please choose a delivery date between A and B'))
    fn(api.getDeliveryOptions)
      .mockResolvedValueOnce(OPTIONS)
      .mockResolvedValueOnce({ ...OPTIONS, earliest: '2026-10-15' })
      .mockResolvedValueOnce({ ...OPTIONS, earliest: '2026-10-16' })
    const { container } = await open()
    expect(dateInput().value).toBe('2026-10-14')
    fireEvent.submit(container.querySelector('form')!)
    await waitFor(() => expect(dateInput().value).toBe('2026-10-15'))
    // a deliberate later pick survives the next reload
    fireEvent.change(dateInput(), { target: { value: '2026-10-25' } })
    fireEvent.submit(container.querySelector('form')!)
    await waitFor(() => expect(dateInput().min).toBe('2026-10-16'))
    expect(dateInput().value).toBe('2026-10-25')
  })

  it('moves a date that fell below the new earliest up to it', async () => {
    fn(api.createOrder).mockRejectedValue(new Error('Please choose a delivery date between A and B'))
    fn(api.getDeliveryOptions)
      .mockResolvedValueOnce(OPTIONS)
      .mockResolvedValueOnce({ ...OPTIONS, earliest: '2026-10-17' })
    const { container } = await open()
    fireEvent.change(dateInput(), { target: { value: '2026-10-16' } })
    fireEvent.submit(container.querySelector('form')!)
    await waitFor(() => expect(dateInput().min).toBe('2026-10-17'))
    expect(dateInput().value).toBe('2026-10-17')
  })

  it('keeps the form with an inline message when the reload itself fails', async () => {
    fn(api.createOrder).mockRejectedValueOnce(new Error('Please choose a delivery date between A and B'))
    fn(api.getDeliveryOptions).mockResolvedValueOnce(OPTIONS).mockRejectedValueOnce(new Error('down'))
    const { container } = await open()
    const form = container.querySelector('form')!
    fireEvent.submit(form)
    const note = await screen.findByText(/couldn't refresh the available dates/i)
    expect(note.id).toBe(`${dateInput().id}-error`)
    expect(note.closest('[role="alert"]')).toBeNull()
    expect(container.querySelector('form')).toBe(form)
    expect(screen.queryByRole('button', { name: /try again/i })).toBeNull()
    expect(dateInput().min).toBe('2026-10-14')
  })
})

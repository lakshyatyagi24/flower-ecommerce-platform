import React from 'react'
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import CheckoutPage from '../page'
import { api, ApiError } from '@/lib/api'
import { clearFreshProductCache } from '@/lib/fresh-products'

type Line = {
  productId: number
  slug: string
  name: string
  price: number
  quantity: number
  image: null
  gstRate: number
  stock?: number
  minOrderQty?: number
}
const baseLine = (): Line => ({ productId: 1, slug: 'rose', name: 'Rose', price: 100, quantity: 2, image: null, gstRate: 0, stock: 10, minOrderQty: 1 })

const router = { push: vi.fn(), replace: vi.fn() }
const cart = {
  items: [baseLine()] as Line[],
  count: 2,
  clear: vi.fn(),
  remove: vi.fn(),
  replaceWith: vi.fn(),
}
const auth = { user: { id: 1, email: 'a@b.co', name: 'Asha', phone: '9999911111' }, loading: false }

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
    },
  }
})
vi.mock('@/lib/razorpay-flow', () => ({ payForOrder: vi.fn() }))

const fn = (f: unknown) => f as ReturnType<typeof vi.fn>
const getProduct = fn(api.getProductBySlug)
const createOrder = fn(api.createOrder)

const freshRose = (over: Record<string, unknown> = {}) => ({
  id: 1, name: 'Rose', slug: 'rose', price: 100, stock: 10, active: true, saleMode: 'PURCHASE', gstRate: 0, minOrderQty: 1, ...over,
})

beforeEach(() => {
  window.sessionStorage.clear()
  clearFreshProductCache()
  cart.items = [baseLine()]
  cart.count = 2
  router.push.mockReset()
  cart.clear.mockReset()
  cart.remove.mockReset()
  cart.replaceWith.mockReset().mockImplementation((update: (prev: Line[]) => Line[]) => {
    cart.items = update(cart.items)
  })
  createOrder.mockReset()
  fn(api.getSettings).mockReset().mockResolvedValue({ 'shipping.flatRate': '50' })
  fn(api.getPaymentConfig).mockReset().mockResolvedValue({ enabled: true })
  getProduct.mockReset().mockResolvedValue(freshRose())
})

const set = (el: Element, v: string) => fireEvent.change(el, { target: { value: v } })

async function renderForm() {
  const view = render(<CheckoutPage />)
  await waitFor(() => expect(view.container.querySelector('form')).not.toBeNull())
  return view
}
function fill(container: HTMLElement) {
  set(screen.getByPlaceholderText('+91 99999 11111'), '9999911111')
  set(container.querySelector('textarea')!, '12 Rose Street')
  const inputs = container.querySelectorAll('input[maxlength]')
  set(inputs[0], 'Pune')
  set(inputs[1], '411001')
}
const placeBtn = () => screen.getByRole('button', { name: /place order/i }) as HTMLButtonElement
const changes = () => screen.getByTestId('checkout-changes')
const live = () => screen.getByTestId('checkout-changes-live')

describe('checkout stock gating', () => {
  it('nothing changed: no notices and Pay is enabled', async () => {
    await renderForm()
    expect(screen.queryByTestId('checkout-changes')).toBeNull()
    expect(placeBtn().disabled).toBe(false)
    expect(cart.replaceWith).not.toHaveBeenCalled()
  })

  it('an out-of-stock line blocks Pay with a clear message and a Remove button; nothing is deleted for the shopper', async () => {
    getProduct.mockResolvedValue(freshRose({ stock: 0 }))
    const { container } = await renderForm()
    fill(container)
    await within(await screen.findByTestId('checkout-changes')).findByText(/out of stock/i)
    expect(within(changes()).getByRole('heading', { name: /some items need attention/i })).toBeInTheDocument()
    expect(placeBtn().disabled).toBe(true)
    expect(placeBtn()).toHaveAccessibleDescription(/remove the items that can.t be ordered/i)
    fireEvent.submit(container.querySelector('form')!)
    await new Promise((r) => setTimeout(r, 0))
    expect(createOrder).not.toHaveBeenCalled()
    expect(cart.replaceWith).not.toHaveBeenCalled()
    fireEvent.click(within(changes()).getByRole('button', { name: /remove rose from your bag/i }))
    expect(cart.remove).toHaveBeenCalledWith(1)
  })

  it('a product that no longer exists (404) blocks the same way', async () => {
    getProduct.mockRejectedValue(new ApiError('not found', 404, null))
    await renderForm()
    await within(await screen.findByTestId('checkout-changes')).findByText(/no longer available/i)
    expect(placeBtn().disabled).toBe(true)
  })

  it('a product that became enquiry-only blocks', async () => {
    getProduct.mockResolvedValue(freshRose({ saleMode: 'ENQUIRY' }))
    await renderForm()
    await within(await screen.findByTestId('checkout-changes')).findByText(/enquiry only/i)
    expect(placeBtn().disabled).toBe(true)
  })

  it('only a short summary sits in the polite status region; the panel itself is plain content outside it', async () => {
    getProduct.mockResolvedValue(freshRose({ stock: 0 }))
    await renderForm()
    expect(live()).toHaveAttribute('role', 'status')
    expect(live()).toHaveAttribute('aria-live', 'polite')
    await within(await screen.findByTestId('checkout-changes')).findByText(/out of stock/i)
    expect(live()).toHaveTextContent("One item in your bag can't be ordered right now.")
    expect(live().contains(changes())).toBe(false)
    expect(changes().closest('[role=status]')).toBeNull()
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('a changed price is applied to the bag, shown, and must be accepted before Pay is enabled', async () => {
    getProduct.mockResolvedValue(freshRose({ price: 120 }))
    await renderForm()
    await within(await screen.findByTestId('checkout-changes')).findByText(/price changed from ₹100 to ₹120 each/i)
    expect(cart.replaceWith).toHaveBeenCalled()
    expect(cart.items[0].price).toBe(120)
    expect(within(changes()).getByRole('heading', { name: /your order changed/i })).toBeInTheDocument()
    expect(placeBtn().disabled).toBe(true)
    expect(placeBtn()).toHaveAccessibleDescription(/review and accept the changes/i)
    // The summary already shows the amount that will be charged.
    expect(screen.getAllByText('Rs240').length).toBeGreaterThan(0)
    expect(live()).toHaveTextContent(/one update needs your review/i)
    expect(screen.queryByText(/some prices were updated/i)).toBeNull()

    fireEvent.click(within(changes()).getByRole('button', { name: /accept changes/i }))
    await waitFor(() => expect(placeBtn().disabled).toBe(false))
    expect(screen.queryByTestId('checkout-changes')).toBeNull()
  })

  it('a quantity above stock is lowered and must be accepted', async () => {
    cart.items = [{ ...baseLine(), quantity: 8 }]
    getProduct.mockResolvedValue(freshRose({ stock: 3 }))
    await renderForm()
    await within(await screen.findByTestId('checkout-changes')).findByText(/only 3 left\. quantity lowered from 8 to 3/i)
    expect(cart.items[0].quantity).toBe(3)
    expect(placeBtn().disabled).toBe(true)
    fireEvent.click(within(changes()).getByRole('button', { name: /accept changes/i }))
    await waitFor(() => expect(placeBtn().disabled).toBe(false))
  })

  it('a raised minimum order lifts the quantity and says so', async () => {
    getProduct.mockResolvedValue(freshRose({ minOrderQty: 5, stock: 20 }))
    await renderForm()
    await within(await screen.findByTestId('checkout-changes')).findByText(/minimum order is 5\. quantity raised from 2 to 5/i)
    expect(cart.items[0]).toMatchObject({ quantity: 5, minOrderQty: 5 })
  })

  it('a price fetch failure still blocks the form entirely (never order against unknown prices)', async () => {
    getProduct.mockRejectedValue(new ApiError('boom', 500, null))
    const { container } = render(<CheckoutPage />)
    await screen.findByText(/couldn.t load delivery charges/i)
    expect(container.querySelector('form')).toBeNull()
  })
})

describe('checkout re-checks right before placing the order', () => {
  it('a price that moved since the page loaded stops the submit, shows the change, and charges nothing', async () => {
    const { container } = await renderForm()
    fill(container)
    getProduct.mockResolvedValue(freshRose({ price: 130 }))
    fireEvent.submit(container.querySelector('form')!)
    await within(await screen.findByTestId('checkout-changes')).findByText(/price changed from ₹100 to ₹130 each/i)
    expect(createOrder).not.toHaveBeenCalled()
    expect(screen.getAllByText(/changed while you were checking out/i).length).toBeGreaterThan(0)
    expect(placeBtn().disabled).toBe(true)

    createOrder.mockResolvedValue({ id: 7, status: 'PENDING', paymentMethod: 'COD', paymentStatus: 'UNPAID', total: 1, items: [] })
    fireEvent.click(within(changes()).getByRole('button', { name: /accept changes/i }))
    await waitFor(() => expect(placeBtn().disabled).toBe(false))
    fireEvent.click(screen.getByRole('radio', { name: /cash on delivery/i }))
    fireEvent.submit(container.querySelector('form')!)
    await waitFor(() => expect(createOrder).toHaveBeenCalledTimes(1))
    expect(createOrder.mock.calls[0][0].items).toEqual([{ productId: 1, quantity: 2 }])
  })

  it('an item that sold out meanwhile stops the submit with a clear message', async () => {
    const { container } = await renderForm()
    fill(container)
    getProduct.mockResolvedValue(freshRose({ stock: 0 }))
    fireEvent.submit(container.querySelector('form')!)
    await within(await screen.findByTestId('checkout-changes')).findByText(/out of stock/i)
    expect(createOrder).not.toHaveBeenCalled()
    expect(screen.getAllByText(/can.t be ordered right now/i).length).toBeGreaterThan(0)
  })

  it('if the re-check itself cannot be done the order still goes to the server, which stays authoritative', async () => {
    createOrder.mockResolvedValue({ id: 7, status: 'PENDING', paymentMethod: 'COD', paymentStatus: 'UNPAID', total: 1, items: [] })
    const { container } = await renderForm()
    fill(container)
    fireEvent.click(screen.getByRole('radio', { name: /cash on delivery/i }))
    getProduct.mockRejectedValue(new ApiError('boom', 500, null))
    fireEvent.submit(container.querySelector('form')!)
    await waitFor(() => expect(createOrder).toHaveBeenCalledTimes(1))
  })
})

describe('checkout recovers from a server stock rejection', () => {
  it('shows the server message, re-reads current stock and flags the line instead of retrying blindly', async () => {
    const { container } = await renderForm()
    fill(container)
    fireEvent.click(screen.getByRole('radio', { name: /cash on delivery/i }))
    createOrder.mockRejectedValue(new ApiError('"Rose" just went out of stock — please adjust your cart and try again', 400, null))
    // The re-check passes (stock looks fine), then the server loses the race; the next read shows the truth.
    getProduct.mockResolvedValueOnce(freshRose()).mockResolvedValue(freshRose({ stock: 1 }))
    const callsBefore = getProduct.mock.calls.length
    fireEvent.submit(container.querySelector('form')!)
    await screen.findByText(/just went out of stock/i)
    await waitFor(() => expect(getProduct.mock.calls.length).toBeGreaterThan(callsBefore + 1))
    await within(await screen.findByTestId('checkout-changes')).findByText(/only 1 left\. quantity lowered from 2 to 1/i)
    // The form is still there with what the shopper typed.
    expect((container.querySelector('textarea') as HTMLTextAreaElement).value).toBe('12 Rose Street')
    expect(placeBtn().disabled).toBe(true)
  })

  it('a non-stock server error does not trigger a price re-read', async () => {
    const { container } = await renderForm()
    fill(container)
    fireEvent.click(screen.getByRole('radio', { name: /cash on delivery/i }))
    createOrder.mockRejectedValue(new ApiError('Something else broke', 500, null))
    fireEvent.submit(container.querySelector('form')!)
    await screen.findByText(/something else broke/i)
    const afterError = getProduct.mock.calls.length
    await new Promise((r) => setTimeout(r, 20))
    expect(getProduct.mock.calls.length).toBe(afterError)
  })
})

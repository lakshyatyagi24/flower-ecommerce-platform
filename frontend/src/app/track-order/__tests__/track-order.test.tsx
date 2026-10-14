import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import TrackOrderPage from '../page'
import TrackOrderResults from '../results/page'
import { api } from '@/lib/api'
import { getTrackEmail, setTrackEmail } from '@/lib/track-order-session'

let search = ''
const push = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(search),
}))
vi.mock('@/lib/cart-context', () => ({ formatINR: (n: number) => `Rs${n}` }))
vi.mock('@/lib/api', () => {
  class ApiError extends Error {
    status: number
    constructor(m: string, s: number) {
      super(m)
      this.status = s
    }
  }
  return { ApiError, api: { trackOrder: vi.fn() } }
})

const trackOrder = api.trackOrder as unknown as ReturnType<typeof vi.fn>

const order = {
  id: 12, subtotal: 200, shipping: 0, total: 200, status: 'SHIPPED', paymentMethod: 'COD', paymentStatus: 'UNPAID',
  customerName: 'Asha Rao', customerEmail: 'a@b.co', customerPhone: '9999911111', shippingAddress: '12 Rose Street',
  city: 'Pune', postalCode: '411001', notes: null, trackingNumber: 'https://evil.example/x?t=1', courierName: 'BlueDart',
  createdAt: '2026-10-10T10:00:00Z', updatedAt: '2026-10-11T10:00:00Z',
  items: [{ id: 1, productName: 'Rose', quantity: 2, unitPrice: 100 }],
}

beforeEach(() => {
  window.sessionStorage.clear()
  push.mockReset()
  trackOrder.mockReset()
  search = ''
})

describe('Track order form', () => {
  it('labels both fields, shows field errors and hands the email over via sessionStorage', async () => {
    const user = userEvent.setup()
    render(<TrackOrderPage />)
    const id = screen.getByLabelText(/^order id/i)
    const email = screen.getByLabelText(/^email at checkout/i)
    expect(email).toHaveAttribute('autocomplete', 'email')
    expect(id).toHaveAttribute('inputmode', 'numeric')

    await user.click(screen.getByRole('button', { name: /track order/i }))
    expect(await screen.findByText('Please enter your Order ID.')).toBeInTheDocument()
    expect(id).toHaveAttribute('aria-invalid', 'true')

    await user.type(id, 'abc')
    await user.click(screen.getByRole('button', { name: /track order/i }))
    expect(await screen.findByText(/must be a number/i)).toBeInTheDocument()

    await user.clear(id)
    await user.type(id, '12')
    await user.click(screen.getByRole('button', { name: /track order/i }))
    expect(await screen.findByText('Please enter the email used at checkout.')).toBeInTheDocument()
    expect(push).not.toHaveBeenCalled()

    await user.type(email, 'a@b.co')
    await user.click(screen.getByRole('button', { name: /track order/i }))
    expect(push).toHaveBeenCalledWith('/track-order/results?orderId=12')
    expect(getTrackEmail()).toBe('a@b.co')
    expect(push.mock.calls[0][0]).not.toContain('a@b.co')
  })

  it('pre-fills the order id from the query and drops a stale email', () => {
    setTrackEmail('old@b.co')
    search = '?orderId=77'
    render(<TrackOrderPage />)
    expect((screen.getByLabelText(/^order id/i) as HTMLInputElement).value).toBe('77')
    expect(getTrackEmail()).toBeNull()
  })
})

describe('Track order results', () => {
  it('looks the order up with the session email, clears it, and renders timeline, items and address', async () => {
    search = '?orderId=12'
    setTrackEmail('a@b.co')
    render(<TrackOrderResults />)
    await screen.findByRole('heading', { name: 'Order #12' })
    expect(trackOrder).toHaveBeenCalledWith(12, 'a@b.co')
    await waitFor(() => expect(getTrackEmail()).toBeNull())
    expect(screen.getByRole('list', { name: /order progress/i })).toBeInTheDocument()
    expect(screen.getByText('SHIPPED')).toBeInTheDocument()
    expect(screen.getAllByRole('listitem').some((li) => li.getAttribute('aria-current') === 'step' && /out for delivery/i.test(li.textContent ?? ''))).toBe(true)
    expect(screen.getByText('12 Rose Street')).toBeInTheDocument()
    expect(screen.getByText('Pune, 411001')).toBeInTheDocument()
    expect(screen.getByText('Rose')).toBeInTheDocument()
  })

  it('renders courier and tracking number as text only, never as a link', async () => {
    search = '?orderId=12'
    setTrackEmail('a@b.co')
    render(<TrackOrderResults />)
    const tracking = await screen.findByText('https://evil.example/x?t=1')
    expect(tracking.closest('a')).toBeNull()
    expect(screen.getByText('BlueDart')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /evil/i })).toBeNull()
  })

  it('a cancelled order shows the notice', async () => {
    search = '?orderId=12'
    setTrackEmail('a@b.co')
    trackOrder.mockResolvedValue({ ...order, status: 'CANCELLED' })
    render(<TrackOrderResults />)
    await screen.findByText(/this order was cancelled/i)
  })

  it('shows the error state with a way back, without echoing the email', async () => {
    search = '?orderId=12'
    setTrackEmail('a@b.co')
    trackOrder.mockRejectedValue(new Error('Order not found'))
    render(<TrackOrderResults />)
    await screen.findByRole('heading', { name: /couldn't find that order/i })
    expect(screen.getByRole('alert')).toHaveTextContent('Order not found')
    expect(screen.getByRole('link', { name: /try again/i })).toHaveAttribute('href', '/track-order?orderId=12')
    await waitFor(() => expect(getTrackEmail()).toBeNull())
  })

  it('asks to re-enter the email when none was handed over, without calling the API', async () => {
    search = '?orderId=12'
    render(<TrackOrderResults />)
    await screen.findByText(/please re-enter the email/i)
    expect(trackOrder).not.toHaveBeenCalled()
  })
})

beforeEach(() => {
  trackOrder.mockResolvedValue(order)
})

describe('Track order results delivery date', () => {
  it('shows the delivery date read-only in the delivery details', async () => {
    search = '?orderId=12'
    setTrackEmail('a@b.co')
    trackOrder.mockResolvedValue({ ...order, deliveryDate: '2026-10-14T00:00:00.000Z' })
    render(<TrackOrderResults />)
    await screen.findByRole('heading', { name: 'Order #12' })
    const label = screen.getByText('Delivery date')
    expect(label.parentElement).toHaveTextContent('Wednesday, 14 October 2026')
    expect(label.closest('section')).toHaveTextContent('12 Rose Street')
  })

  it('omits it for orders without one', async () => {
    search = '?orderId=12'
    setTrackEmail('a@b.co')
    trackOrder.mockResolvedValue({ ...order, deliveryDate: null })
    render(<TrackOrderResults />)
    await screen.findByRole('heading', { name: 'Order #12' })
    expect(screen.queryByText('Delivery date')).toBeNull()
  })
})

describe('Track order results coupon', () => {
  it('shows the coupon discount line when one was applied, and not otherwise', async () => {
    search = '?orderId=12'
    setTrackEmail('a@b.co')
    trackOrder.mockResolvedValue({ ...order, couponCode: 'SAVE10', discount: 40 })
    const { unmount } = render(<TrackOrderResults />)
    await screen.findByRole('heading', { name: 'Order #12' })
    expect(screen.getByTestId('order-discount')).toHaveTextContent('Discount (SAVE10)')
    unmount()
    setTrackEmail('a@b.co')
    trackOrder.mockResolvedValue({ ...order, couponCode: null, discount: 0 })
    render(<TrackOrderResults />)
    await screen.findByRole('heading', { name: 'Order #12' })
    expect(screen.queryByTestId('order-discount')).toBeNull()
  })
})

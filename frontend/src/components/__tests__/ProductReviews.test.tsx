import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach } from 'vitest'

let authUser: { id: number } | null = null
vi.mock('@/lib/auth-context', () => ({ useAuth: () => ({ user: authUser }) }))
vi.mock('@/lib/sign-in-request', () => ({ requestSignIn: vi.fn() }))
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
      listProductReviews: vi.fn(),
      upsertProductReview: vi.fn(),
      deleteReview: vi.fn(),
      getReviewEligibility: vi.fn(),
    },
  }
})
import { api, ApiError } from '@/lib/api'
import { requestSignIn } from '@/lib/sign-in-request'
import ProductReviews, { NOT_ELIGIBLE_MESSAGE, RATE_LIMIT_MESSAGE, THANKS_MESSAGE, UNCHANGED_MESSAGE } from '../ProductReviews'

const list = api.listProductReviews as unknown as ReturnType<typeof vi.fn>
const upsert = api.upsertProductReview as unknown as ReturnType<typeof vi.fn>
const del = api.deleteReview as unknown as ReturnType<typeof vi.fn>
const eligibility = api.getReviewEligibility as unknown as ReturnType<typeof vi.fn>

const review = (over = {}) => ({
  id: 1,
  productId: 5,
  userId: 9,
  rating: 4,
  title: 'Lovely',
  body: 'Fresh and well packed.',
  createdAt: '2026-10-01T10:00:00.000Z',
  updatedAt: '2026-10-01T10:00:00.000Z',
  user: { id: 9, name: 'Asha' },
  ...over,
})
const listOf = (items: unknown[], extra = {}) => ({ items, total: items.length, take: 20, skip: 0, averageRating: 4, ownReview: null, ...extra })
const LONG = 'Smelled lovely and lasted a week'

beforeEach(() => {
  authUser = null
  list.mockReset().mockResolvedValue({ items: [], total: 0, take: 20, skip: 0, averageRating: 0, ownReview: null })
  upsert.mockReset().mockResolvedValue({ status: 'PENDING' })
  del.mockReset().mockResolvedValue({})
  eligibility.mockReset().mockResolvedValue({ canReview: true, hasReview: false })
  vi.mocked(requestSignIn).mockReset()
})

describe('ProductReviews', () => {
  it('empty state: honest message, no rating summary, explanation and sign-in prompt for guests', async () => {
    const user = userEvent.setup()
    render(<ProductReviews productId={5} />)
    expect(await screen.findByText(/No reviews yet/)).toBeInTheDocument()
    expect(screen.queryByRole('img', { name: /Rated/ })).toBeNull()
    expect(screen.queryByText(/0 reviews/)).toBeNull()
    expect(screen.getByText(/Reviews are open to customers who have received this product/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Submit review' })).toBeNull()
    expect(eligibility).not.toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: 'Sign in' }))
    expect(requestSignIn).toHaveBeenCalled()
  })

  it('lists real reviews with the average and reports stats upward', async () => {
    const onStats = vi.fn()
    list.mockResolvedValue(listOf([review(), review({ id: 2, userId: 3, user: null, rating: 5, title: null, body: 'Great.' })], { averageRating: 4.5 }))
    render(<ProductReviews productId={5} onStatsChange={onStats} />)
    expect(await screen.findByText('Fresh and well packed.')).toBeInTheDocument()
    expect(screen.getByText('4.5 · 2 reviews')).toBeInTheDocument()
    expect(screen.getByText('Asha')).toBeInTheDocument()
    expect(screen.getByText('Anonymous')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 3, name: 'Lovely' })).toBeInTheDocument()
    expect(onStats).toHaveBeenCalledWith({ averageRating: 4.5, reviewCount: 2 })
  })

  it('renders review text as text, never as HTML', async () => {
    list.mockResolvedValue(listOf([review({ body: '<img src=x onerror=alert(1)> <b>bold</b>', title: '<script>x</script>' })]))
    const { container } = render(<ProductReviews productId={5} />)
    expect(await screen.findByText('<img src=x onerror=alert(1)> <b>bold</b>')).toBeInTheDocument()
    expect(container.querySelector('img')).toBeNull()
    expect(container.querySelector('b')).toBeNull()
    expect(container.querySelector('script')).toBeNull()
  })

  it('shows a load error', async () => {
    list.mockRejectedValue(new ApiError('Reviews unavailable', 500, null))
    render(<ProductReviews productId={5} />)
    expect(await screen.findByText('Reviews unavailable')).toBeInTheDocument()
  })

  it('signed in but not eligible: explains instead of showing a form that would 403', async () => {
    authUser = { id: 1 }
    eligibility.mockResolvedValue({ canReview: false, hasReview: false })
    render(<ProductReviews productId={5} />)
    expect(await screen.findByText(NOT_ELIGIBLE_MESSAGE)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Submit review' })).toBeNull()
    expect(screen.queryByLabelText(/^Your review/)).toBeNull()
  })

  it('if the eligibility lookup fails the form still shows (the server decides)', async () => {
    authUser = { id: 1 }
    eligibility.mockRejectedValue(new ApiError('boom', 500, null))
    render(<ProductReviews productId={5} />)
    expect(await screen.findByRole('button', { name: 'Submit review' })).toBeInTheDocument()
  })

  it('a server 403 on submit turns into the honest explanation, not a raw error', async () => {
    authUser = { id: 1 }
    upsert.mockRejectedValue(new ApiError('Only customers who received this product can review it', 403, null))
    const user = userEvent.setup()
    render(<ProductReviews productId={5} />)
    await screen.findByRole('button', { name: 'Submit review' })
    await user.type(screen.getByLabelText(/^Your review/), LONG)
    await user.click(screen.getByRole('button', { name: 'Submit review' }))
    expect(await screen.findByText(NOT_ELIGIBLE_MESSAGE)).toBeInTheDocument()
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('eligible form: empty body shows an inline error (not an alert) and does not call the API', async () => {
    authUser = { id: 1 }
    const user = userEvent.setup()
    render(<ProductReviews productId={5} />)
    await user.click(await screen.findByRole('button', { name: 'Submit review' }))
    expect(upsert).not.toHaveBeenCalled()
    expect(screen.getByLabelText(/^Your review/)).toHaveAccessibleDescription(/Please write a short review\./)
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('a too-short review is caught client-side (server minimum is 10)', async () => {
    authUser = { id: 1 }
    const user = userEvent.setup()
    render(<ProductReviews productId={5} />)
    await screen.findByRole('button', { name: 'Submit review' })
    await user.type(screen.getByLabelText(/^Your review/), 'Good')
    await user.click(screen.getByRole('button', { name: 'Submit review' }))
    expect(upsert).not.toHaveBeenCalled()
    expect(screen.getByLabelText(/^Your review/)).toHaveAccessibleDescription(/at least 10 characters/)
  })

  it('has length caps matching the API (title 100, body 1000)', async () => {
    authUser = { id: 1 }
    render(<ProductReviews productId={5} />)
    await screen.findByRole('button', { name: 'Submit review' })
    expect(screen.getByLabelText(/^Title/)).toHaveAttribute('maxlength', '100')
    expect(screen.getByLabelText(/^Your review/)).toHaveAttribute('maxlength', '1000')
  })

  it('submits rating, trimmed title and body, then thanks the shopper in a polite live region', async () => {
    authUser = { id: 1 }
    const user = userEvent.setup()
    render(<ProductReviews productId={5} />)
    await screen.findByRole('button', { name: 'Submit review' })
    await user.click(screen.getByRole('button', { name: '3 stars' }))
    expect(screen.getByRole('button', { name: '3 stars' })).toHaveAttribute('aria-pressed', 'true')
    await user.type(screen.getByLabelText(/^Title/), '  Nice  ')
    await user.type(screen.getByLabelText(/^Your review/), ` ${LONG} `)
    const status = screen.getByRole('status')
    expect(status).toHaveAttribute('aria-live', 'polite')
    expect(status).toBeEmptyDOMElement()
    await user.click(screen.getByRole('button', { name: 'Submit review' }))
    await waitFor(() => expect(upsert).toHaveBeenCalledWith(5, { rating: 3, title: 'Nice', body: LONG }))
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(THANKS_MESSAGE))
    expect(THANKS_MESSAGE).toBe('Thanks — your review will appear after a quick check')
    expect(list).toHaveBeenCalledTimes(2)
  })

  it('shows another server error in an alert', async () => {
    authUser = { id: 1 }
    upsert.mockRejectedValue(new ApiError('Too many requests', 500, null))
    const user = userEvent.setup()
    render(<ProductReviews productId={5} />)
    await screen.findByRole('button', { name: 'Submit review' })
    await user.type(screen.getByLabelText(/^Your review/), LONG)
    await user.click(screen.getByRole('button', { name: 'Submit review' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Too many requests')
  })

  it('the author sees their PENDING review as awaiting approval, not in the public list', async () => {
    authUser = { id: 9 }
    list.mockResolvedValue(listOf([], { total: 0, ownReview: review({ status: 'PENDING', body: 'My pending words here' }) }))
    render(<ProductReviews productId={5} />)
    const notice = await screen.findByTestId('own-review')
    expect(notice).toHaveTextContent('Awaiting approval')
    expect(notice).toHaveTextContent('My pending words here')
    expect(screen.queryByText(/^0\.0/)).toBeNull()
    expect(await screen.findByRole('button', { name: 'Update review' })).toBeInTheDocument()
  })

  it('the author sees a REJECTED review honestly', async () => {
    authUser = { id: 9 }
    list.mockResolvedValue(listOf([], { total: 0, ownReview: review({ status: 'REJECTED' }) }))
    render(<ProductReviews productId={5} />)
    expect(await screen.findByTestId('own-review')).toHaveTextContent("This review wasn't published")
  })

  it('an APPROVED own review warns that editing re-queues it, and is not duplicated in a notice', async () => {
    authUser = { id: 9 }
    const mine = review({ status: 'APPROVED' })
    list.mockResolvedValue(listOf([mine], { ownReview: mine }))
    render(<ProductReviews productId={5} />)
    expect(await screen.findByText(/sends it for a quick check again/)).toBeInTheDocument()
    expect(screen.queryByTestId('own-review')).toBeNull()
  })

  it('edits and deletes the signed-in user review (with confirmation)', async () => {
    authUser = { id: 9 }
    const mine = review({ status: 'APPROVED' })
    list.mockResolvedValue(listOf([mine], { ownReview: mine }))
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
    const user = userEvent.setup()
    render(<ProductReviews productId={5} />)
    expect(await screen.findByRole('heading', { name: 'Edit your review' })).toBeInTheDocument()
    expect(await screen.findByLabelText(/^Your review/)).toHaveValue('Fresh and well packed.')
    expect(screen.getByRole('button', { name: 'Update review' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Delete' }))
    expect(confirmSpy).toHaveBeenCalled()
    await waitFor(() => expect(del).toHaveBeenCalledWith(1))
    confirmSpy.mockRestore()
  })

  it('does not delete when the confirmation is declined', async () => {
    authUser = { id: 9 }
    const mine = review({ status: 'APPROVED' })
    list.mockResolvedValue(listOf([mine], { ownReview: mine }))
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false)
    const user = userEvent.setup()
    render(<ProductReviews productId={5} />)
    await user.click(await screen.findByRole('button', { name: 'Delete' }))
    expect(del).not.toHaveBeenCalled()
    confirmSpy.mockRestore()
  })

  it('an identical re-submit that stays APPROVED gets a neutral note, not the thanks message', async () => {
    authUser = { id: 9 }
    const mine = review({ status: 'APPROVED' })
    list.mockResolvedValue(listOf([mine], { ownReview: mine }))
    upsert.mockResolvedValue({ ...mine, status: 'APPROVED' })
    const user = userEvent.setup()
    render(<ProductReviews productId={5} />)
    await user.click(await screen.findByRole('button', { name: 'Update review' }))
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(UNCHANGED_MESSAGE))
    expect(screen.getByRole('status')).not.toHaveTextContent('quick check')
  })

  it('maps 429 to a friendly message, never the raw throttler text', async () => {
    authUser = { id: 1 }
    upsert.mockRejectedValue(new ApiError('ThrottlerException: Too Many Requests', 429, null))
    const user = userEvent.setup()
    render(<ProductReviews productId={5} />)
    await screen.findByRole('button', { name: 'Submit review' })
    await user.type(screen.getByLabelText(/^Your review/), LONG)
    await user.click(screen.getByRole('button', { name: 'Submit review' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(RATE_LIMIT_MESSAGE)
    expect(screen.queryByText(/Throttler/)).toBeNull()
  })

  it('own review but not eligible: heading is "Your review" and Delete is still offered', async () => {
    authUser = { id: 9 }
    eligibility.mockResolvedValue({ canReview: false, hasReview: true })
    list.mockResolvedValue(listOf([], { total: 0, ownReview: review({ status: 'PENDING' }) }))
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
    const user = userEvent.setup()
    render(<ProductReviews productId={5} />)
    expect(await screen.findByRole('heading', { name: 'Your review' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Edit your review' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Update review' })).toBeNull()
    await user.click(await screen.findByRole('button', { name: 'Delete your review' }))
    await waitFor(() => expect(del).toHaveBeenCalledWith(1))
    confirmSpy.mockRestore()
  })
})

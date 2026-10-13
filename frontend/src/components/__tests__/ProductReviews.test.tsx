import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach } from 'vitest'

let authUser: { id: number } | null = null
vi.mock('@/lib/auth-context', () => ({ useAuth: () => ({ user: authUser }) }))
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
    api: { listProductReviews: vi.fn(), upsertProductReview: vi.fn(), deleteReview: vi.fn() },
  }
})
import { api, ApiError } from '@/lib/api'
import ProductReviews from '../ProductReviews'

const list = api.listProductReviews as unknown as ReturnType<typeof vi.fn>
const upsert = api.upsertProductReview as unknown as ReturnType<typeof vi.fn>
const del = api.deleteReview as unknown as ReturnType<typeof vi.fn>

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

beforeEach(() => {
  authUser = null
  list.mockReset().mockResolvedValue({ items: [], total: 0, take: 20, skip: 0, averageRating: 0 })
  upsert.mockReset().mockResolvedValue({})
  del.mockReset().mockResolvedValue({})
})

describe('ProductReviews', () => {
  it('empty state: honest message, no rating summary, sign-in prompt for guests', async () => {
    render(<ProductReviews productId={5} />)
    expect(await screen.findByText(/No reviews yet/)).toBeInTheDocument()
    expect(screen.queryByRole('img', { name: /Rated/ })).toBeNull()
    expect(screen.queryByText(/0 reviews/)).toBeNull()
    expect(screen.getByText(/Sign in to share/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Submit review' })).toBeNull()
  })

  it('lists real reviews with the average and reports stats upward', async () => {
    const onStats = vi.fn()
    list.mockResolvedValue({ items: [review(), review({ id: 2, userId: 3, user: null, rating: 5, title: null, body: 'Great.' })], total: 2, take: 20, skip: 0, averageRating: 4.5 })
    render(<ProductReviews productId={5} onStatsChange={onStats} />)
    expect(await screen.findByText('Fresh and well packed.')).toBeInTheDocument()
    expect(screen.getByText('4.5 · 2 reviews')).toBeInTheDocument()
    expect(screen.getByText('Asha')).toBeInTheDocument()
    expect(screen.getByText('Anonymous')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 3, name: 'Lovely' })).toBeInTheDocument()
    expect(onStats).toHaveBeenCalledWith({ averageRating: 4.5, reviewCount: 2 })
  })

  it('shows a load error', async () => {
    list.mockRejectedValue(new ApiError('Reviews unavailable', 500, null))
    render(<ProductReviews productId={5} />)
    expect(await screen.findByText('Reviews unavailable')).toBeInTheDocument()
  })

  it('signed-in form: empty body shows an inline error (not an alert) and does not call the API', async () => {
    authUser = { id: 1 }
    const user = userEvent.setup()
    render(<ProductReviews productId={5} />)
    await user.click(await screen.findByRole('button', { name: 'Submit review' }))
    expect(upsert).not.toHaveBeenCalled()
    expect(screen.getByLabelText(/^Your review/)).toHaveAccessibleDescription('Please write a short review.')
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('submits rating, trimmed title and body', async () => {
    authUser = { id: 1 }
    const user = userEvent.setup()
    render(<ProductReviews productId={5} />)
    await screen.findByRole('button', { name: 'Submit review' })
    await user.click(screen.getByRole('button', { name: '3 stars' }))
    expect(screen.getByRole('button', { name: '3 stars' })).toHaveAttribute('aria-pressed', 'true')
    await user.type(screen.getByLabelText(/^Title/), '  Nice  ')
    await user.type(screen.getByLabelText(/^Your review/), ' Smelled lovely ')
    await user.click(screen.getByRole('button', { name: 'Submit review' }))
    await waitFor(() => expect(upsert).toHaveBeenCalledWith(5, { rating: 3, title: 'Nice', body: 'Smelled lovely' }))
    expect(list).toHaveBeenCalledTimes(2)
  })

  it('shows a server error in an alert', async () => {
    authUser = { id: 1 }
    upsert.mockRejectedValue(new ApiError('Not allowed', 403, null))
    const user = userEvent.setup()
    render(<ProductReviews productId={5} />)
    await screen.findByRole('button', { name: 'Submit review' })
    await user.type(screen.getByLabelText(/^Your review/), 'Good')
    await user.click(screen.getByRole('button', { name: 'Submit review' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Not allowed')
  })

  it('edits and deletes the signed-in user review (with confirmation)', async () => {
    authUser = { id: 9 }
    list.mockResolvedValue({ items: [review()], total: 1, take: 20, skip: 0, averageRating: 4 })
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
    const user = userEvent.setup()
    render(<ProductReviews productId={5} />)
    expect(await screen.findByRole('heading', { name: 'Edit your review' })).toBeInTheDocument()
    expect(screen.getByLabelText(/^Your review/)).toHaveValue('Fresh and well packed.')
    expect(screen.getByRole('button', { name: 'Update review' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Delete' }))
    expect(confirmSpy).toHaveBeenCalled()
    await waitFor(() => expect(del).toHaveBeenCalledWith(1))
    confirmSpy.mockRestore()
  })

  it('does not delete when the confirmation is declined', async () => {
    authUser = { id: 9 }
    list.mockResolvedValue({ items: [review()], total: 1, take: 20, skip: 0, averageRating: 4 })
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false)
    const user = userEvent.setup()
    render(<ProductReviews productId={5} />)
    await user.click(await screen.findByRole('button', { name: 'Delete' }))
    expect(del).not.toHaveBeenCalled()
    confirmSpy.mockRestore()
  })
})

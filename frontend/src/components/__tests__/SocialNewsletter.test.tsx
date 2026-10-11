import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'

vi.mock('@/lib/api', () => ({ api: { subscribeNewsletter: vi.fn() } }))
import { api } from '@/lib/api'
import SocialNewsletter from '@/components/SocialNewsletter'

describe('SocialNewsletter', () => {
  beforeEach(() => { vi.mocked(api.subscribeNewsletter).mockReset() })

  it('submits the trimmed email and shows the success message', async () => {
    vi.mocked(api.subscribeNewsletter).mockResolvedValue({ ok: true })
    render(<SocialNewsletter />)
    await userEvent.type(screen.getByLabelText('Your email address'), 'a@b.com')
    await userEvent.click(screen.getByRole('button', { name: 'Subscribe' }))
    expect(await screen.findByText("You're on the list")).toBeInTheDocument()
    expect(api.subscribeNewsletter).toHaveBeenCalledWith('a@b.com')
  })

  it('shows the thrown error message inline', async () => {
    vi.mocked(api.subscribeNewsletter).mockRejectedValue(new Error('Too many requests'))
    render(<SocialNewsletter />)
    await userEvent.type(screen.getByLabelText('Your email address'), 'a@b.com')
    await userEvent.click(screen.getByRole('button', { name: 'Subscribe' }))
    expect(await screen.findByText('Too many requests')).toBeInTheDocument()
  })
})

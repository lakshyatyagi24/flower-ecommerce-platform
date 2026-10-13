import React from 'react'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect } from 'vitest'

vi.mock('next/link', () => ({
  default: ({ href, children, ...rest }: any) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}))
vi.mock('@/lib/api', () => {
  class ApiError extends Error {}
  return { ApiError, api: { getSettings: vi.fn().mockResolvedValue({}), createEnquiry: vi.fn().mockResolvedValue({}) } }
})
import { SettingsProvider } from '@/lib/settings-context'
import { validateEnquiry } from '@/lib/enquiry-validation'
import PrivacyPage from '../privacy/page'
import RefundPolicyPage from '../refund-policy/page'
import ContactPage from '../contact/page'
import EnquiryForm from '@/components/EnquiryForm'

const read = (rel: string) => readFileSync(path.join(__dirname, '..', rel), 'utf8').replace(/\s+/g, ' ')

async function renderIn(ui: React.ReactElement) {
  await act(async () => {
    render(<SettingsProvider>{ui}</SettingsProvider>)
  })
}

describe('copy accuracy (checkout has a delivery-date picker, Task 4.2)', () => {
  it('faq-data and terms say the shopper chooses a delivery date at checkout', () => {
    expect(read('faq/faq-data.ts')).toMatch(/you choose your delivery date at checkout/i)
    expect(read('terms/page.tsx')).toMatch(/you choose your delivery date there/i)
  })

  it('does not promise a delivery time or a fixed cut-off in static copy (those come from settings only)', () => {
    for (const file of ['faq/faq-data.ts', 'terms/page.tsx']) {
      const text = read(file)
      expect(text).not.toMatch(/same[- ]day|next[- ]day|\bby \d{1,2}(:\d{2})?\s?(am|pm)\b|cut-?off (time )?(is|of) \d/i)
      expect(text).not.toMatch(/dates are shown at checkout|charges and dates/i)
    }
  })
})

describe('privacy and refund wording', () => {
  it('privacy mentions service providers and says there are no tracking cookies', async () => {
    await renderIn(<PrivacyPage />)
    const text = document.body.textContent ?? ''
    expect(text).toMatch(/hosting provider.*email delivery service.*payment gateway/)
    expect(text).toMatch(/local storage/)
    expect(text).toMatch(/do not use advertising or tracking cookies/)
    expect(text).not.toMatch(/We use cookies/)
  })

  it('refund policy covers online and cash on delivery refunds', async () => {
    await renderIn(<RefundPolicyPage />)
    const text = document.body.textContent ?? ''
    expect(text).toMatch(/already paid online, we will refund it to the original payment method/)
    expect(text).toMatch(/cash on delivery orders we will agree the refund method with you/)
  })
})

describe('contact page', () => {
  it('does not repeat the lead sentence under the form heading', async () => {
    await renderIn(<ContactPage />)
    const matches = (document.body.textContent ?? '').match(/Questions about an order, a custom bouquet or an event\?/g)
    expect(matches).toHaveLength(1)
  })
})

describe('enquiry phone validation matches the backend', () => {
  const base = { customerName: 'A', customerEmail: '', message: '' }
  it.each(['98 76 54 32 10', '98765-43210', '+91 98765 43210', '09876543210', '919876543210'])('accepts %s', (phone) => {
    expect(validateEnquiry({ ...base, customerPhone: phone }).customerPhone).toBeUndefined()
  })
  it.each(['12345', '5876543210', '98765 4321', '+91 98765 432101'])('rejects %s', (phone) => {
    expect(validateEnquiry({ ...base, customerPhone: phone }).customerPhone).toBeTruthy()
  })
})

describe('EnquiryForm success focus and limits', () => {
  it('moves focus to the success panel (not body)', async () => {
    const user = userEvent.setup()
    render(<EnquiryForm />)
    await user.type(screen.getByLabelText(/^Your name/), 'Asha')
    await user.type(screen.getByLabelText(/^Phone/), '98 76 54 32 10')
    await user.click(screen.getByRole('button', { name: 'Send enquiry' }))
    const status = await screen.findByRole('status')
    await waitFor(() => expect(status).toHaveFocus())
    expect(status).toHaveAttribute('tabindex', '-1')
  })

  it('applies backend length limits', () => {
    render(<EnquiryForm />)
    expect(screen.getByLabelText(/^Your name/)).toHaveAttribute('maxlength', '80')
    expect(screen.getByLabelText(/^City/)).toHaveAttribute('maxlength', '80')
    expect(screen.getByLabelText(/^Delivery address/)).toHaveAttribute('maxlength', '500')
    expect(screen.getByText('Number of stems or bouquets')).toBeInTheDocument()
  })
})

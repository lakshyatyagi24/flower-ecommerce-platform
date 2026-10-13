import React from 'react'
import { readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { render, screen, waitFor, within, act } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('next/link', () => ({
  default: ({ href, children, ...rest }: any) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}))
vi.mock('@/lib/api', () => {
  class ApiError extends Error {}
  return { ApiError, api: { getSettings: vi.fn(), createEnquiry: vi.fn() } }
})
import { api } from '@/lib/api'
import { SettingsProvider } from '@/lib/settings-context'
import ContactPage from '../contact/page'
import AboutPage from '../about/page'
import CorporatePage from '../corporate/page'
import FAQPage from '../faq/page'
import PrivacyPage from '../privacy/page'
import TermsPage from '../terms/page'
import RefundPolicyPage from '../refund-policy/page'
import { categories, allFaqItems, snapshotItems } from '../faq/faq-data'

const getSettings = api.getSettings as unknown as ReturnType<typeof vi.fn>

async function renderWithSettings(ui: React.ReactElement) {
  let result!: ReturnType<typeof render>
  await act(async () => {
    result = render(<SettingsProvider>{ui}</SettingsProvider>)
  })
  return result
}

beforeEach(() => {
  getSettings.mockReset().mockResolvedValue({})
})

describe('contact page (R17)', () => {
  it('shows no placeholder, "coming soon", hours or delivery blurb when settings are blank', async () => {
    await renderWithSettings(<ContactPage />)
    await waitFor(() => expect(getSettings).toHaveBeenCalled())
    const text = document.body.textContent ?? ''
    expect(text).not.toMatch(/please update|admin settings|coming soon|example\.com/i)
    expect(text).not.toMatch(/Mon.{0,3}Sat|5:00 AM|Cab\/bike|Business hours/i)
    expect(screen.queryByRole('definition')).toBeNull()
    expect(screen.queryByLabelText('Contact details')).toBeNull()
    expect(screen.getByRole('heading', { level: 1, name: 'Get in touch' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Send message' })).toBeInTheDocument()
  })

  it('hides rows whose value is still seed placeholder text', async () => {
    getSettings.mockResolvedValue({
      'store.email': 'orders@example.com',
      'store.address': 'Delhi NCR - please update with real address',
      'store.phone': '+91 93540 16059',
    })
    await renderWithSettings(<ContactPage />)
    const details = await screen.findByLabelText('Contact details')
    const links = within(details).getAllByRole('link')
    expect(links.map((l) => l.getAttribute('href'))).toEqual(expect.arrayContaining(['tel:+919354016059']))
    expect(within(details).queryByText('Email')).toBeNull()
    expect(within(details).queryByText('Address')).toBeNull()
    expect(document.body.textContent).not.toMatch(/please update|example\.com/i)
  })

  it('shows configured email, address, hours and delivery summary from settings', async () => {
    getSettings.mockResolvedValue({
      'store.email': 'hello@freshpetals.in',
      'store.address': '12 Market Road, Delhi',
      'delivery.businessHours': 'Mon to Sat, 9 to 6',
      'policies.deliverySummary': 'Delivery within Delhi NCR only.',
    })
    await renderWithSettings(<ContactPage />)
    const details = await screen.findByLabelText('Contact details')
    expect(within(details).getByRole('link', { name: 'hello@freshpetals.in' })).toHaveAttribute('href', 'mailto:hello@freshpetals.in')
    expect(within(details).getByRole('link', { name: '12 Market Road, Delhi' })).toBeInTheDocument()
    expect(within(details).getByText('Mon to Sat, 9 to 6')).toBeInTheDocument()
    expect(within(details).getByText('Delivery within Delhi NCR only.')).toBeInTheDocument()
  })

  it('includes the short FAQ list and an events pointer', async () => {
    await renderWithSettings(<ContactPage />)
    expect(screen.getByText(snapshotItems[0].q)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'All questions' })).toHaveAttribute('href', '/faq')
    expect(screen.getByRole('link', { name: /Event and corporate enquiries/ })).toHaveAttribute('href', '/corporate')
  })
})

describe('faq page', () => {
  it('renders every question and answer in the DOM, grouped by category', async () => {
    await renderWithSettings(<FAQPage />)
    expect(screen.getByRole('heading', { level: 1, name: /Frequently asked questions/i })).toBeInTheDocument()
    for (const c of categories) expect(screen.getByRole('heading', { level: 2, name: c.title })).toBeInTheDocument()
    for (const it of allFaqItems) {
      expect(screen.getByText(it.q)).toBeInTheDocument()
      expect(screen.getByText(it.a)).toBeInTheDocument()
    }
  })

  it('shows the shop-supplied delivery and returns summaries only when set', async () => {
    const first = await renderWithSettings(<FAQPage />)
    await waitFor(() => expect(getSettings).toHaveBeenCalled())
    expect(screen.queryByText('From the shop')).toBeNull()
    first.unmount()
    getSettings.mockResolvedValue({ 'policies.deliverySummary': 'Delhi NCR only.', 'policies.returnsSummary': 'Tell us in a day.' })
    await renderWithSettings(<FAQPage />)
    expect(await screen.findByText('Delhi NCR only.')).toBeInTheDocument()
    expect(screen.getByText('Tell us in a day.')).toBeInTheDocument()
  })
})

describe('legal pages', () => {
  const pages: [string, () => React.ReactElement][] = [
    ['privacy', () => <PrivacyPage />],
    ['terms', () => <TermsPage />],
    ['refund-policy', () => <RefundPolicyPage />],
  ]
  it.each(pages)('%s has a real last-updated date and no stale month string', async (_n, page) => {
    await renderWithSettings(page())
    const time = document.querySelector('time')
    expect(time).not.toBeNull()
    expect(time!.getAttribute('datetime')).toBe('2026-10-13')
    expect(time!.textContent).toBe('13 October 2026')
    expect(document.body.textContent).not.toMatch(/April 2026/)
  })

  it.each(pages)('%s hides blank contact details and points to the contact page', async (_n, page) => {
    await renderWithSettings(page())
    await waitFor(() => expect(getSettings).toHaveBeenCalled())
    expect(document.body.textContent).not.toMatch(/example\.com|please update|the phone number on the contact page/i)
    expect(screen.getByRole('link', { name: 'contact page' })).toHaveAttribute('href', '/contact')
  })

  it('privacy shows configured email and phone', async () => {
    getSettings.mockResolvedValue({ 'store.email': 'hello@freshpetals.in', 'store.phone': '+91 93540 16059' })
    await renderWithSettings(<PrivacyPage />)
    expect(await screen.findByRole('link', { name: 'hello@freshpetals.in' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '+91 93540 16059' })).toHaveAttribute('href', 'tel:+919354016059')
  })

  it('refund policy puts the shop returns summary first when configured', async () => {
    getSettings.mockResolvedValue({ 'policies.returnsSummary': 'Tell us within two days.' })
    await renderWithSettings(<RefundPolicyPage />)
    expect(await screen.findByText('Tell us within two days.')).toBeInTheDocument()
  })
})

describe('about and corporate', () => {
  it('about has one h1 and no unbacked claims', async () => {
    await renderWithSettings(<AboutPage />)
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    const text = document.body.textContent ?? ''
    expect(text).not.toMatch(/Karnataka|Pune|Tamil Nadu|8\+|carbon|compostable|2.3 days|zero-waste|insulated/i)
  })

  it('corporate keeps the enquiry form with its source and makes no response-time promise', async () => {
    await renderWithSettings(<CorporatePage />)
    expect(screen.getByRole('heading', { level: 1, name: /Flowers for work/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Request a quote' })).toBeInTheDocument()
    expect(document.body.textContent).not.toMatch(/within a few hours|same.day/i)
  })
})

describe('content pages source hygiene', () => {
  const dirs = ['about', 'contact', 'corporate', 'faq', 'privacy', 'terms', 'refund-policy']
  const files: string[] = []
  const walk = (d: string) => {
    for (const n of readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, n.name)
      if (n.isDirectory()) walk(p)
      else if (/\.tsx?$/.test(n.name)) files.push(p)
    }
  }
  for (const d of dirs) walk(path.join(__dirname, '..', d))
  walk(path.join(__dirname, '..', '..', 'components', 'content'))

  it('no file hardcodes placeholder text, a stale date or opening hours', async () => {
    expect(files.length).toBeGreaterThan(10)
    for (const f of files) {
      const t = readFileSync(f, 'utf8')
      expect(t, f).not.toMatch(/please update via admin|coming soon|April 2026|5:00 AM|new Date\(/i)
    }
  })
})

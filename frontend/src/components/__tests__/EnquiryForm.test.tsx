import React, { useState } from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('@/lib/api', () => {
  class ApiError extends Error {
    status: number
    constructor(m: string, s: number) {
      super(m)
      this.status = s
    }
  }
  return { ApiError, api: { createEnquiry: vi.fn() } }
})
import { api, ApiError } from '@/lib/api'
import EnquiryForm from '../EnquiryForm'
import EnquiryModal from '../EnquiryModal'
import ContactForm from '@/app/contact/components/ContactForm'

const createEnquiry = api.createEnquiry as unknown as ReturnType<typeof vi.fn>

beforeEach(() => {
  createEnquiry.mockReset().mockResolvedValue({ id: 1 })
})

describe('EnquiryForm (full)', () => {
  it('is noValidate, and a blank submit shows one alert summary plus inline errors', async () => {
    const user = userEvent.setup()
    const { container } = render(<EnquiryForm />)
    expect(container.querySelector('form')).toHaveAttribute('novalidate')
    await user.click(screen.getByRole('button', { name: 'Send enquiry' }))
    expect(createEnquiry).not.toHaveBeenCalled()
    // One alert only: the summary. Inline field errors are described-by text, not role=alert.
    expect(screen.getAllByRole('alert')).toHaveLength(1)
    expect(screen.getByRole('alert')).toHaveFocus()
    const name = screen.getByLabelText(/^Your name/)
    expect(name).toHaveAttribute('aria-invalid', 'true')
    expect(name).toHaveAccessibleDescription('Enter your name')
    expect(screen.getByLabelText(/^Phone/)).toHaveAttribute('aria-invalid', 'true')
  })

  it('summary links move focus to the field', async () => {
    const user = userEvent.setup()
    render(<EnquiryForm />)
    await user.click(screen.getByRole('button', { name: 'Send enquiry' }))
    await user.click(screen.getByRole('link', { name: 'Enter your phone number' }))
    expect(screen.getByLabelText(/^Phone/)).toHaveFocus()
  })

  it('rejects an invalid phone and email inline', async () => {
    const user = userEvent.setup()
    render(<EnquiryForm />)
    await user.type(screen.getByLabelText(/^Your name/), 'Asha')
    await user.type(screen.getByLabelText(/^Phone/), '12345')
    await user.type(screen.getByLabelText(/^Email/), 'nope')
    await user.click(screen.getByRole('button', { name: 'Send enquiry' }))
    expect(createEnquiry).not.toHaveBeenCalled()
    expect(screen.getByLabelText(/^Phone/)).toHaveAccessibleDescription(/valid 10-digit/)
    expect(screen.getByLabelText(/^Email/)).toHaveAccessibleDescription(/valid email/)
  })

  it('sends the same payload as before and shows a success state', async () => {
    const user = userEvent.setup()
    const onSuccess = vi.fn()
    render(
      <EnquiryForm productId={7} productName="Rose box" source="product:rose-box" occasion="Wedding" onSuccess={onSuccess} />,
    )
    expect(screen.getByText('Rose box')).toBeInTheDocument()
    await user.type(screen.getByLabelText(/^Your name/), 'Asha')
    await user.type(screen.getByLabelText(/^Phone/), '9354016059')
    await user.type(screen.getByLabelText(/^Quantity or size/), '50')
    await user.type(screen.getByLabelText(/^City/), 'Delhi')
    await user.click(screen.getByRole('button', { name: 'Send enquiry' }))
    await waitFor(() => expect(createEnquiry).toHaveBeenCalledTimes(1))
    expect(createEnquiry).toHaveBeenCalledWith({
      productId: 7,
      productName: 'Rose box',
      customerName: 'Asha',
      customerPhone: '9354016059',
      customerEmail: undefined,
      quantity: 50,
      eventDate: undefined,
      occasion: 'Wedding',
      address: undefined,
      city: 'Delhi',
      message: undefined,
      source: 'product:rose-box',
    })
    expect(await screen.findByRole('status')).toHaveTextContent(/received your enquiry/i)
    expect(onSuccess).toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: /send another enquiry/i }))
    expect(screen.getByLabelText(/^Your name/)).toHaveValue('')
  })

  it('shows a server error in the summary and keeps the typed values', async () => {
    createEnquiry.mockRejectedValue(new ApiError('Service busy', 500, null))
    const user = userEvent.setup()
    render(<EnquiryForm />)
    await user.type(screen.getByLabelText(/^Your name/), 'Asha')
    await user.type(screen.getByLabelText(/^Phone/), '9354016059')
    await user.click(screen.getByRole('button', { name: 'Send enquiry' }))
    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('Service busy')
    expect(screen.getByLabelText(/^Your name/)).toHaveValue('Asha')
    expect(screen.getByRole('button', { name: 'Send enquiry' })).toBeEnabled()
  })

  it('does not submit twice while sending', async () => {
    let resolve!: () => void
    createEnquiry.mockReturnValue(new Promise<void>((r) => (resolve = r)))
    const user = userEvent.setup()
    render(<EnquiryForm />)
    await user.type(screen.getByLabelText(/^Your name/), 'Asha')
    await user.type(screen.getByLabelText(/^Phone/), '9354016059')
    await user.click(screen.getByRole('button', { name: 'Send enquiry' }))
    expect(screen.getByRole('button', { name: /sending/i })).toBeDisabled()
    resolve()
    await screen.findByRole('status')
    expect(createEnquiry).toHaveBeenCalledTimes(1)
  })

  it('makes no response-time promise', () => {
    render(<EnquiryForm />)
    expect(document.body.textContent).not.toMatch(/within a few hours|shortly/i)
  })
})

describe('ContactForm (contact mode)', () => {
  it('requires a message and posts the contact payload with its own source', async () => {
    const user = userEvent.setup()
    render(<ContactForm />)
    await user.type(screen.getByLabelText(/^Your name/), 'Asha')
    await user.type(screen.getByLabelText(/^Phone/), '9354016059')
    await user.click(screen.getByRole('button', { name: 'Send message' }))
    expect(createEnquiry).not.toHaveBeenCalled()
    expect(screen.getByLabelText(/^Message/)).toHaveAccessibleDescription(/little about what you need/)
    await user.type(screen.getByLabelText(/^Message/), 'Roses for Friday')
    await user.click(screen.getByRole('button', { name: 'Send message' }))
    await waitFor(() => expect(createEnquiry).toHaveBeenCalledTimes(1))
    expect(createEnquiry).toHaveBeenCalledWith({
      customerName: 'Asha',
      customerEmail: undefined,
      customerPhone: '9354016059',
      message: 'Roses for Friday',
      source: 'contact-page',
    })
    expect(await screen.findByRole('status')).toHaveTextContent(/received your message/i)
  })

  it('has no event fields', () => {
    render(<ContactForm />)
    expect(screen.queryByLabelText(/^Quantity/)).toBeNull()
  })
})

describe('EnquiryModal', () => {
  function Harness({ onClose }: { onClose: () => void }) {
    const [open, setOpen] = useState(true)
    return (
      <EnquiryModal
        open={open}
        onClose={() => {
          onClose()
          setOpen(false)
        }}
        productName="Rose box"
        heading="Enquire about Rose box"
      />
    )
  }

  it('is a labelled modal dialog with the name field focused', () => {
    render(<Harness onClose={() => {}} />)
    const dialog = screen.getByRole('dialog', { name: 'Enquire about Rose box' })
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(screen.getByLabelText(/^Your name/)).toHaveFocus()
  })

  it('renders nothing when closed', () => {
    render(<EnquiryModal open={false} onClose={() => {}} />)
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('closes on Escape', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<Harness onClose={onClose} />)
    await user.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('closes from the close button', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<Harness onClose={onClose} />)
    await user.click(screen.getByRole('button', { name: 'Close enquiry form' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('does not close when a press inside the dialog is released on the backdrop', () => {
    const onClose = vi.fn()
    render(<Harness onClose={onClose} />)
    const dialog = screen.getByRole('dialog')
    const backdrop = dialog.parentElement as HTMLElement
    fireEvent.mouseDown(dialog)
    fireEvent.click(backdrop)
    expect(onClose).not.toHaveBeenCalled()
    fireEvent.mouseDown(backdrop)
    fireEvent.click(backdrop)
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})

import React from 'react'
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import PincodeCheck from '../PincodeCheck'
import { api } from '@/lib/api'

vi.mock('@/lib/api', () => ({ api: { checkPincode: vi.fn() } }))
const check = api.checkPincode as unknown as ReturnType<typeof vi.fn>

beforeEach(() => {
  check.mockReset()
  window.localStorage.clear()
})
afterEach(() => {
  vi.restoreAllMocks()
})

const input = () => screen.getByLabelText(/delivery pin code/i) as HTMLInputElement
const press = () => fireEvent.click(screen.getByRole('button', { name: /check/i }))

describe('PincodeCheck', () => {
  it('renders a numeric 6-digit input and a status region', () => {
    render(<PincodeCheck />)
    expect(input()).toHaveAttribute('inputmode', 'numeric')
    expect(input()).toHaveAttribute('maxlength', '6')
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('names the PIN and remembers it when a service area is configured and the PIN is on it', async () => {
    check.mockResolvedValue({ serviceable: true, restricted: true, message: 'We deliver to this PIN code.' })
    render(<PincodeCheck />)
    fireEvent.change(input(), { target: { value: '110001' } })
    press()
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('We deliver to 110001.'))
    expect(check).toHaveBeenCalledWith('110001')
    expect(window.localStorage.getItem('fp_pincode')).toBe('110001')
  })

  it('stays neutral (no delivery claim) when no service area is configured, and still remembers the PIN', async () => {
    const neutral = "We'll confirm delivery to your PIN code at checkout."
    check.mockResolvedValue({ serviceable: true, restricted: false, message: neutral })
    render(<PincodeCheck />)
    fireEvent.change(input(), { target: { value: '110001' } })
    press()
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(neutral))
    expect(screen.getByRole('status')).not.toHaveTextContent(/we deliver to/i)
    expect(window.localStorage.getItem('fp_pincode')).toBe('110001')
  })

  it('shows the not-serviceable message and does not store the PIN', async () => {
    check.mockResolvedValue({ serviceable: false, restricted: true, message: 'We do not deliver to this PIN code yet.' })
    render(<PincodeCheck />)
    fireEvent.change(input(), { target: { value: '400001' } })
    press()
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('We do not deliver to 400001 yet.'))
    expect(window.localStorage.getItem('fp_pincode')).toBeNull()
  })

  it('rejects a malformed PIN inline without calling the API and without role=alert', async () => {
    render(<PincodeCheck />)
    fireEvent.change(input(), { target: { value: '123' } })
    press()
    const err = await screen.findByText(/valid 6-digit PIN code/i)
    expect(input()).toHaveAttribute('aria-invalid', 'true')
    expect(input().getAttribute('aria-describedby')).toContain(err.id)
    expect(screen.queryByRole('alert')).toBeNull()
    expect(check).not.toHaveBeenCalled()
    expect(document.activeElement).toBe(input())
  })

  it('is not announced as required or optional', () => {
    render(<PincodeCheck />)
    expect(input()).not.toHaveAttribute('aria-required')
    expect(screen.queryByText(/\(required\)|\(optional\)/)).toBeNull()
  })

  it('treats a non-boolean payload as unknown, never as serviceable', async () => {
    check.mockResolvedValue({ message: 'x' })
    render(<PincodeCheck />)
    fireEvent.change(input(), { target: { value: '110001' } })
    press()
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(/couldn't check/i))
    expect(window.localStorage.getItem('fp_pincode')).toBeNull()
  })

  it('drops a stale response when a newer check finishes first', async () => {
    let first!: (v: unknown) => void
    check.mockReturnValueOnce(new Promise((r) => (first = r)))
    check.mockResolvedValueOnce({ serviceable: false, restricted: true, message: 'x' })
    render(<PincodeCheck />)
    fireEvent.change(input(), { target: { value: '110001' } })
    press()
    fireEvent.change(input(), { target: { value: '560001' } })
    press()
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('We do not deliver to 560001 yet.'))
    await act(async () => {
      first({ serviceable: true, restricted: true, message: 'x' })
    })
    expect(screen.getByRole('status')).toHaveTextContent('We do not deliver to 560001 yet.')
  })

  it('drops a response that arrives after the PIN was edited', async () => {
    let resolve!: (v: unknown) => void
    check.mockReturnValue(new Promise((r) => (resolve = r)))
    render(<PincodeCheck />)
    fireEvent.change(input(), { target: { value: '110001' } })
    press()
    fireEvent.change(input(), { target: { value: '11000' } })
    await act(async () => {
      resolve({ serviceable: true, restricted: true, message: 'x' })
    })
    expect(screen.getByRole('status')).toBeEmptyDOMElement()
    expect(window.localStorage.getItem('fp_pincode')).toBeNull()
    expect(screen.getByRole('button', { name: /check/i })).not.toBeDisabled()
  })

  it('strips non-digits as you type', () => {
    render(<PincodeCheck />)
    fireEvent.change(input(), { target: { value: '11a0-0' } })
    expect(input().value).toBe('1100')
  })

  it('prefills from fp_pincode', async () => {
    window.localStorage.setItem('fp_pincode', '560001')
    render(<PincodeCheck />)
    await waitFor(() => expect(input().value).toBe('560001'))
  })

  it('ignores an invalid stored PIN', () => {
    window.localStorage.setItem('fp_pincode', 'junk')
    render(<PincodeCheck />)
    expect(input().value).toBe('')
  })

  it('survives localStorage throwing', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('denied')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('denied')
    })
    check.mockResolvedValue({ serviceable: true, restricted: true, message: 'We deliver to this PIN code.' })
    render(<PincodeCheck />)
    fireEvent.change(input(), { target: { value: '110001' } })
    press()
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('We deliver'))
  })

  it('on request failure says it could not check and does not claim either result', async () => {
    check.mockRejectedValue(new Error('network'))
    render(<PincodeCheck />)
    fireEvent.change(input(), { target: { value: '110001' } })
    press()
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(/couldn't check/i))
    expect(screen.getByRole('status')).not.toHaveTextContent(/we deliver to this/i)
    expect(window.localStorage.getItem('fp_pincode')).toBeNull()
  })
})

import React, { useState } from 'react'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import SignInModal from '../SignInModal'

const push = vi.fn()
const login = vi.fn()
const register = vi.fn()
vi.mock('next/navigation', () => ({ useRouter: () => ({ push, replace: vi.fn() }) }))
vi.mock('next/link', () => ({
  default: ({ href, children, onClick, ...rest }: any) => (
    <a
      href={href}
      onClick={(e) => {
        e.preventDefault()
        onClick?.(e)
      }}
      {...rest}
    >
      {children}
    </a>
  ),
}))
vi.mock('@/lib/auth-context', () => ({ useAuth: () => ({ login, register }) }))
vi.mock('@/lib/api', () => {
  class ApiError extends Error {
    status: number
    constructor(m: string, s: number) {
      super(m)
      this.status = s
    }
  }
  return { ApiError, api: {} }
})
import { ApiError } from '@/lib/api'

function Harness({ onClose = () => {} }: { onClose?: () => void }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button onClick={() => setOpen(true)}>Open sign in</button>
      {open && (
        <SignInModal
          onClose={() => {
            onClose()
            setOpen(false)
          }}
        />
      )}
    </>
  )
}

async function openModal() {
  const user = userEvent.setup()
  const onClose = vi.fn()
  render(<Harness onClose={onClose} />)
  const trigger = screen.getByRole('button', { name: 'Open sign in' })
  trigger.focus()
  await user.click(trigger)
  return { user, onClose, trigger }
}

beforeEach(() => {
  vi.clearAllMocks()
  window.sessionStorage.clear()
  window.history.replaceState({}, '', '/')
  document.body.style.overflow = ''
})

describe('SignInModal on the shared useModal hook', () => {
  it('is a labelled modal dialog and focuses the email field on open', async () => {
    await openModal()
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog).toHaveAccessibleName(/welcome back/i)
    expect(screen.getByLabelText(/^email/i)).toHaveFocus()
  })

  it('locks body scroll while open and restores it on close', async () => {
    const { user } = await openModal()
    expect(document.body.style.overflow).toBe('hidden')
    await user.keyboard('{Escape}')
    expect(document.body.style.overflow).toBe('')
  })

  it('Escape closes and returns focus to the trigger', async () => {
    const { user, onClose, trigger } = await openModal()
    await user.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(trigger).toHaveFocus()
  })

  it('the close button closes and returns focus', async () => {
    const { user, trigger } = await openModal()
    await user.click(screen.getByRole('button', { name: /close sign in dialog/i }))
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(trigger).toHaveFocus()
  })

  it('clicking the backdrop closes, clicking inside does not', async () => {
    const { user } = await openModal()
    await user.click(screen.getByLabelText(/^email/i))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('dialog').parentElement!)
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('keeps Tab and Shift+Tab inside the dialog', async () => {
    const { user } = await openModal()
    const dialog = screen.getByRole('dialog')
    for (let i = 0; i < 12; i++) {
      await user.tab()
      expect(dialog.contains(document.activeElement)).toBe(true)
    }
    for (let i = 0; i < 12; i++) {
      await user.tab({ shift: true })
      expect(dialog.contains(document.activeElement)).toBe(true)
    }
  })

  it('no longer depends on focus-trap-react', () => {
    const src = readFileSync(path.resolve(__dirname, '../SignInModal.tsx'), 'utf8')
    expect(src).not.toContain('focus-trap-react')
    expect(src).toContain('useModal')
  })
})

describe('SignInModal behaviour', () => {
  it('toggles the password type with aria-pressed', async () => {
    const { user } = await openModal()
    const pw = screen.getByLabelText(/^password/i, { selector: 'input' }) as HTMLInputElement
    expect(pw).toHaveAttribute('autocomplete', 'current-password')
    await user.click(screen.getByRole('button', { name: /show password/i }))
    expect(pw.type).toBe('text')
    expect(screen.getByRole('button', { name: /hide password/i })).toHaveAttribute('aria-pressed', 'true')
  })

  it('validates with the unchanged messages and does not call login', async () => {
    const { user } = await openModal()
    await user.click(screen.getByRole('button', { name: 'Sign in' }))
    expect(await screen.findByText('Please enter a valid email address')).toBeInTheDocument()
    expect(screen.getByText('Password must be at least 6 characters')).toBeInTheDocument()
    expect(login).not.toHaveBeenCalled()
  })

  it('signs in, then closes and follows a safe callbackUrl', async () => {
    window.history.replaceState({}, '', '/?callbackUrl=%2Fcheckout')
    login.mockResolvedValue(undefined)
    const { user, onClose } = await openModal()
    await user.type(screen.getByLabelText(/^email/i), 'a@b.co')
    await user.type(screen.getByLabelText(/^password/i, { selector: 'input' }), 'secret1')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))
    expect(login).toHaveBeenCalledWith('a@b.co', 'secret1')
    await waitFor(() => expect(onClose).toHaveBeenCalled(), { timeout: 2000 })
    expect(push).toHaveBeenCalledWith('/checkout')
  })

  it('ignores an unsafe redirect target', async () => {
    window.history.replaceState({}, '', '/?callbackUrl=https%3A%2F%2Fevil.example')
    login.mockResolvedValue(undefined)
    const { user, onClose } = await openModal()
    await user.type(screen.getByLabelText(/^email/i), 'a@b.co')
    await user.type(screen.getByLabelText(/^password/i, { selector: 'input' }), 'secret1')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))
    await waitFor(() => expect(onClose).toHaveBeenCalled(), { timeout: 2000 })
    expect(push).not.toHaveBeenCalled()
  })

  it('shows the server error, counts down attempts and locks after five failures', async () => {
    login.mockRejectedValue(new ApiError('Invalid credentials', 401, null))
    const { user } = await openModal()
    await user.type(screen.getByLabelText(/^email/i), 'a@b.co')
    await user.type(screen.getByLabelText(/^password/i, { selector: 'input' }), 'secret1')
    expect(screen.getByText('5 attempts remaining')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Sign in' }))
    expect(await screen.findByText('Invalid credentials')).toBeInTheDocument()
    expect(screen.getByText('4 attempts remaining')).toBeInTheDocument()
    for (let i = 0; i < 4; i++) {
      await user.click(screen.getByRole('button', { name: 'Sign in' }))
      await waitFor(() => expect(login).toHaveBeenCalledTimes(i + 2))
    }
    await waitFor(() => expect(screen.getByText(/Too many failed attempts\. Try again in/)).toBeInTheDocument())
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeDisabled()
  })

  it('the forgot-password link closes the modal', async () => {
    const { user, onClose } = await openModal()
    await user.click(screen.getByRole('link', { name: /forgot password/i }))
    expect(onClose).toHaveBeenCalled()
  })

  it('switches to sign-up and back, moving focus to the first field each time', async () => {
    const { user } = await openModal()
    await user.click(screen.getByRole('button', { name: /create one/i }))
    expect(screen.getByRole('dialog')).toHaveAccessibleName(/create your account/i)
    await waitFor(() => expect(screen.getByLabelText(/^full name/i)).toHaveFocus())
    await user.click(screen.getByRole('button', { name: /back/i }))
    expect(screen.getByRole('dialog')).toHaveAccessibleName(/welcome back/i)
    await waitFor(() => expect(screen.getByLabelText(/^email/i)).toHaveFocus())
  })
})

describe('SignupModal (inside the dialog)', () => {
  async function openSignup() {
    const ctx = await openModal()
    await ctx.user.click(screen.getByRole('button', { name: /create one/i }))
    return ctx
  }

  it('marks name and phone optional and sets autocomplete', async () => {
    await openSignup()
    expect(screen.getAllByText('(optional)')).toHaveLength(2)
    expect(screen.getByLabelText(/^full name/i)).toHaveAttribute('autocomplete', 'name')
    expect(screen.getByLabelText(/^email/i)).toHaveAttribute('autocomplete', 'email')
    expect(screen.getByLabelText(/^phone/i)).toHaveAttribute('autocomplete', 'tel')
    expect(screen.getByLabelText(/^password/i, { selector: 'input' })).toHaveAttribute('autocomplete', 'new-password')
  })

  it('keeps the validation messages', async () => {
    const { user } = await openSignup()
    await user.click(screen.getByRole('button', { name: 'Create account' }))
    expect(await screen.findByText('Email and password are required')).toBeInTheDocument()
    await user.type(screen.getByLabelText(/^email/i), 'a@b.co')
    await user.type(screen.getByLabelText(/^password/i, { selector: 'input' }), 'short')
    await user.click(screen.getByRole('button', { name: 'Create account' }))
    expect(await screen.findByText('Password must be at least 8 characters')).toBeInTheDocument()
    expect(register).not.toHaveBeenCalled()
  })

  it('registers and closes', async () => {
    register.mockResolvedValue(undefined)
    const { user, onClose } = await openSignup()
    await user.type(screen.getByLabelText(/^email/i), 'a@b.co')
    await user.type(screen.getByLabelText(/^password/i, { selector: 'input' }), 'longenough')
    await user.click(screen.getByRole('button', { name: 'Create account' }))
    expect(register).toHaveBeenCalledWith({ email: 'a@b.co', password: 'longenough', name: undefined, phone: undefined })
    await waitFor(() => expect(onClose).toHaveBeenCalled(), { timeout: 2000 })
  })

  it('Escape still closes from the sign-up view', async () => {
    const { user, onClose } = await openSignup()
    await user.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})

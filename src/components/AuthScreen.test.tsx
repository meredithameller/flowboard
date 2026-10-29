import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createFakeAuth } from '../test/mockSupabase'
import AuthScreen from './AuthScreen'

const h = vi.hoisted(() => ({ fake: null as unknown as ReturnType<typeof import('../test/mockSupabase').createFakeAuth> }))
vi.mock('../supabase', () => ({ supabase: { get auth() { return h.fake.auth } } }))

beforeEach(() => {
  h.fake = createFakeAuth()
})

async function fill(user: ReturnType<typeof userEvent.setup>, email = 'ada@example.com', pw = 'longenough1') {
  await user.type(screen.getByLabelText('Email'), email)
  await user.type(screen.getByLabelText('Password'), pw)
}

describe('AuthScreen', () => {
  it('starts on Log in with labelled, correctly typed fields', () => {
    render(<AuthScreen />)
    expect(screen.getByRole('heading', { level: 1, name: 'Flowboard' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Log in' })).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toHaveAttribute('type', 'email')
    expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'password')
    expect(screen.getByLabelText('Password')).toHaveAttribute('autocomplete', 'current-password')
  })

  it('requires an email and an 8+ character password', () => {
    render(<AuthScreen />)
    expect(screen.getByLabelText('Email')).toBeRequired()
    expect(screen.getByLabelText('Password')).toBeRequired()
    expect(screen.getByLabelText('Password')).toHaveAttribute('minlength', '8')
  })

  it('logs in with the trimmed email and the password', async () => {
    const user = userEvent.setup()
    render(<AuthScreen />)
    await fill(user, '  ada@example.com ')
    await user.click(screen.getByRole('button', { name: 'Log in' }))
    expect(h.fake.auth.signInWithPassword).toHaveBeenCalledWith({ email: 'ada@example.com', password: 'longenough1' })
    expect(h.fake.auth.signUp).not.toHaveBeenCalled()
  })

  it('anyone can switch to Create account and sign up', async () => {
    const user = userEvent.setup()
    render(<AuthScreen />)
    await user.click(screen.getByRole('button', { name: 'New here? Create an account' }))
    expect(screen.getByRole('heading', { level: 2, name: 'Create account' })).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toHaveAttribute('autocomplete', 'new-password')
    await fill(user)
    await user.click(screen.getByRole('button', { name: 'Create account' }))
    expect(h.fake.auth.signUp).toHaveBeenCalledWith({ email: 'ada@example.com', password: 'longenough1' })
  })

  it('shows the server error in an alert and lets the user retry', async () => {
    const user = userEvent.setup()
    h.fake.auth.signInWithPassword.mockResolvedValueOnce({ data: { session: null as never }, error: { message: 'Invalid login credentials' } })
    render(<AuthScreen />)
    await fill(user)
    await user.click(screen.getByRole('button', { name: 'Log in' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid login credentials')
    expect(screen.getByRole('button', { name: 'Log in' })).toBeEnabled()
  })

  it('when email confirmation is required, tells the user to check email and returns to Log in', async () => {
    const user = userEvent.setup()
    h.fake.auth.signUp.mockResolvedValueOnce({ data: { session: null }, error: null })
    render(<AuthScreen />)
    await user.click(screen.getByRole('button', { name: 'New here? Create an account' }))
    await fill(user)
    await user.click(screen.getByRole('button', { name: 'Create account' }))
    expect(await screen.findByRole('status')).toHaveTextContent(/check your email/i)
    expect(screen.getByRole('heading', { level: 2, name: 'Log in' })).toBeInTheDocument()
  })

  it('clears errors when switching between modes', async () => {
    const user = userEvent.setup()
    h.fake.auth.signInWithPassword.mockResolvedValueOnce({ data: { session: null as never }, error: { message: 'bad' } })
    render(<AuthScreen />)
    await fill(user)
    await user.click(screen.getByRole('button', { name: 'Log in' }))
    await screen.findByRole('alert')
    await user.click(screen.getByRole('button', { name: 'New here? Create an account' }))
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})

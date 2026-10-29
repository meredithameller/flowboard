import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { resetFakeApi } from './test/mockApi'
import { createFakeAuth, fakeSession } from './test/mockSupabase'

const h = vi.hoisted(() => ({ fake: null as unknown as ReturnType<typeof import('./test/mockSupabase').createFakeAuth> }))
vi.mock('./supabase', () => ({ supabase: { get auth() { return h.fake.auth } } }))
vi.mock('./api', async () => (await import('./test/mockApi')).apiModule)

beforeEach(() => {
  resetFakeApi([])
})

describe('App auth gate', () => {
  it('shows the login screen, not the board, when signed out', async () => {
    h.fake = createFakeAuth(null)
    render(<App />)
    expect(await screen.findByRole('heading', { level: 2, name: 'Log in' })).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Backlog' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '+ Add card' })).not.toBeInTheDocument()
  })

  it('shows a loading status while the session is being checked', () => {
    h.fake = createFakeAuth(null)
    render(<App />)
    expect(screen.getByText('Loading…')).toBeInTheDocument()
  })

  it('shows the board and a Log out button when signed in', async () => {
    h.fake = createFakeAuth(fakeSession)
    render(<App />)
    expect(await screen.findByRole('region', { name: 'Backlog' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Log out' })).toHaveAttribute('title', 'Signed in as ada@example.com')
  })

  it('logging in swaps the login screen for the board', async () => {
    const user = userEvent.setup()
    h.fake = createFakeAuth(null)
    render(<App />)
    await user.type(await screen.findByLabelText('Email'), 'ada@example.com')
    await user.type(screen.getByLabelText('Password'), 'longenough1')
    await user.click(screen.getByRole('button', { name: 'Log in' }))
    expect(await screen.findByRole('region', { name: 'Backlog' })).toBeInTheDocument()
  })

  it('Log out calls signOut and returns to the login screen', async () => {
    const user = userEvent.setup()
    h.fake = createFakeAuth(fakeSession)
    render(<App />)
    await user.click(await screen.findByRole('button', { name: 'Log out' }))
    expect(h.fake.auth.signOut).toHaveBeenCalled()
    expect(await screen.findByRole('heading', { level: 2, name: 'Log in' })).toBeInTheDocument()
  })

  it('reacts to the session ending elsewhere (expired token, other tab)', async () => {
    h.fake = createFakeAuth(fakeSession)
    render(<App />)
    await screen.findByRole('region', { name: 'Backlog' })
    act(() => h.fake.set(null))
    expect(await screen.findByRole('heading', { level: 2, name: 'Log in' })).toBeInTheDocument()
  })
})

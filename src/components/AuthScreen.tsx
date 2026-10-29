import { useState } from 'react'
import { supabase } from '../supabase'

type Mode = 'login' | 'signup'

export default function AuthScreen() {
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const signup = mode === 'signup'

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    setNotice(null)
    const credentials = { email: email.trim(), password }
    const { data, error: err } = signup
      ? await supabase.auth.signUp(credentials)
      : { data: null, error: (await supabase.auth.signInWithPassword(credentials)).error }
    setBusy(false)
    if (err) {
      setError(err.message)
    } else if (signup && !data?.session) {
      setNotice('Account created. Check your email to confirm it, then log in.')
      setMode('login')
      setPassword('')
    }
    // On success with a session, useSession() picks it up and the board appears.
  }

  return (
    <main className="auth">
      <h1>Flowboard</h1>
      <p className="auth-tagline">A Kanban board for your own tasks.</p>
      <form className="auth-card" onSubmit={submit}>
        <h2>{signup ? 'Create account' : 'Log in'}</h2>
        {notice && (
          <div className="notice" role="status">
            {notice}
          </div>
        )}
        {error && (
          <div className="error-banner auth-error" role="alert">
            {error}
          </div>
        )}
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
            autoFocus
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={signup ? 'new-password' : 'current-password'}
            minLength={8}
            aria-describedby={signup ? 'password-hint' : undefined}
            required
          />
        </label>
        {signup && (
          <span id="password-hint" className="hint">
            At least 8 characters.
          </span>
        )}
        <button type="submit" className="primary" disabled={busy}>
          {busy ? 'Please wait…' : signup ? 'Create account' : 'Log in'}
        </button>
        <button
          type="button"
          className="link"
          onClick={() => {
            setMode(signup ? 'login' : 'signup')
            setError(null)
            setNotice(null)
          }}
        >
          {signup ? 'Already have an account? Log in' : 'New here? Create an account'}
        </button>
      </form>
    </main>
  )
}

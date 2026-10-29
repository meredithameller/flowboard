import { vi } from 'vitest'
import type { Session } from '@supabase/supabase-js'

export const fakeSession = { user: { id: 'user-1', email: 'ada@example.com' } } as unknown as Session

/** Fake supabase.auth with a controllable session. Use inside a vi.mock('../supabase') factory. */
export function createFakeAuth(initial: Session | null = null) {
  let session = initial
  let listener: (event: string, s: Session | null) => void = () => {}
  const set = (s: Session | null) => {
    session = s
    listener(s ? 'SIGNED_IN' : 'SIGNED_OUT', s)
  }

  const auth = {
    getSession: vi.fn(async () => ({ data: { session } })),
    onAuthStateChange: vi.fn((cb: typeof listener) => {
      listener = cb
      return { data: { subscription: { unsubscribe: vi.fn() } } }
    }),
    signInWithPassword: vi.fn(async (_c: { email: string; password: string }) => {
      set(fakeSession)
      return { data: { session: fakeSession }, error: null as { message: string } | null }
    }),
    signUp: vi.fn(async (_c: { email: string; password: string }) => {
      set(fakeSession)
      return { data: { session: fakeSession as Session | null }, error: null as { message: string } | null }
    }),
    signOut: vi.fn(async () => {
      set(null)
      return { error: null }
    }),
  }
  return { auth, set }
}

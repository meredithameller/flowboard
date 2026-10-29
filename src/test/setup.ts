import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeEach, vi } from 'vitest'

// Dummy values so src/supabase.ts can be imported. No test reaches a real project.
vi.stubEnv('VITE_SUPABASE_URL', 'http://supabase.test')
vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', 'test-key')

beforeEach(() => {
  localStorage.clear()
  delete document.documentElement.dataset.theme
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    onchange: null,
    dispatchEvent: () => false,
  })) as typeof window.matchMedia

  // Any unmocked network call is a bug in the test: fail loudly.
  vi.stubGlobal(
    'fetch',
    vi.fn(() => {
      throw new Error('Unexpected network call: mock ../api or ../supabase in this test')
    }),
  )
  vi.stubGlobal(
    'WebSocket',
    class {
      constructor() {
        throw new Error('Unexpected WebSocket: mock ../api or ../supabase in this test')
      }
    },
  )
})

afterEach(() => {
  cleanup()
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

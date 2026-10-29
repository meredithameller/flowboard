import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useTheme } from './theme'

const prefersDark = (dark: boolean) => {
  window.matchMedia = ((q: string) => ({ matches: dark, media: q, addEventListener() {}, removeEventListener() {} })) as unknown as typeof window.matchMedia
}

describe('useTheme', () => {
  it('defaults to the system preference', () => {
    prefersDark(true)
    const { result } = renderHook(() => useTheme())
    expect(result.current[0]).toBe('dark')
    expect(document.documentElement.dataset.theme).toBe('dark')
  })

  it('toggles, applies to <html> and persists', () => {
    prefersDark(false)
    const { result } = renderHook(() => useTheme())
    expect(document.documentElement.dataset.theme).toBe('light')
    act(() => result.current[1]())
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(localStorage.getItem('flowboard.theme')).toBe('dark')
  })

  it('a saved choice beats the system preference', () => {
    prefersDark(true)
    localStorage.setItem('flowboard.theme', 'light')
    const { result } = renderHook(() => useTheme())
    expect(result.current[0]).toBe('light')
  })

  it('ignores a corrupted saved value', () => {
    prefersDark(false)
    localStorage.setItem('flowboard.theme', 'purple')
    const { result } = renderHook(() => useTheme())
    expect(result.current[0]).toBe('light')
  })
})

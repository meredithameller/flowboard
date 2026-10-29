import { vi } from 'vitest'
import type { CardData } from '../types'

export function makeCard(overrides: Partial<CardData> = {}): CardData {
  return {
    id: crypto.randomUUID(),
    title: 'Write docs',
    assignee: 'Ada',
    priority: 'Medium',
    dueDate: '2099-01-15',
    column: 'backlog',
    position: 0,
    ...overrides,
  }
}

/** In-memory stand-in for src/api.ts. Use inside a vi.mock factory. */
export function createFakeApi(initial: CardData[] = []) {
  let rows = [...initial]
  let onChange: () => void = () => {}

  const api = {
    fetchCards: vi.fn(async () => rows.map((r) => ({ ...r }))),
    createCard: vi.fn(async (draft: Omit<CardData, 'id' | 'column' | 'position'>, position: number) => {
      const card = makeCard({ ...draft, column: 'backlog', position })
      rows.push(card)
      return { ...card }
    }),
    updateCard: vi.fn(async (id: string, draft: Partial<CardData>) => {
      rows = rows.map((r) => (r.id === id ? { ...r, ...draft } : r))
    }),
    moveCardTo: vi.fn(async (id: string, column: CardData['column'], position: number) => {
      rows = rows.map((r) => (r.id === id ? { ...r, column, position } : r))
    }),
    removeCard: vi.fn(async (id: string) => {
      rows = rows.filter((r) => r.id !== id)
    }),
    restoreCard: vi.fn(async (card: CardData) => {
      rows.push({ ...card })
    }),
    subscribeToCards: vi.fn((cb: () => void) => {
      onChange = cb
      return () => {}
    }),
  }

  return {
    api,
    /** Simulate another user changing data, then a realtime event. */
    emitRemoteChange(next: CardData[]) {
      rows = [...next]
      onChange()
    },
    get rows() {
      return rows
    },
  }
}

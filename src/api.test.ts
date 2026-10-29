import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { CardData } from './types'

// Fake Supabase client: a chainable, awaitable query builder that records every call.
const h = vi.hoisted(() => {
  const state = {
    calls: [] as unknown[][],
    result: { data: null as unknown, error: null as { message: string } | null },
  }
  const builder = (): object => {
    const b: object = new Proxy(
      {},
      {
        get(_, prop) {
          if (prop === 'then') return (resolve: (v: unknown) => void) => resolve(state.result)
          return (...args: unknown[]) => {
            state.calls.push([String(prop), ...args])
            return b
          }
        },
      },
    )
    return b
  }
  return { state, builder }
})

vi.mock('./supabase', () => ({
  supabase: {
    from: (...a: unknown[]) => {
      h.state.calls.push(['from', ...a])
      return h.builder()
    },
    channel: (...a: unknown[]) => {
      h.state.calls.push(['channel', ...a])
      return h.builder()
    },
    removeChannel: (...a: unknown[]) => {
      h.state.calls.push(['removeChannel', ...a])
    },
  },
}))

import { createCard, fetchCards, moveCardTo, removeCard, restoreCard, subscribeToCards, updateCard } from './api'

const call = (name: string) => h.state.calls.find((c) => c[0] === name)

const row = {
  id: 'id-1',
  title: 'T',
  assignee: 'A',
  priority: 'High',
  due_date: '2030-05-06',
  column: 'in-review',
  position: 3,
  created_at: '2026-01-01T00:00:00Z',
}

beforeEach(() => {
  h.state.calls = []
  h.state.result = { data: null, error: null }
})

describe('api (Supabase mocked)', () => {
  it('fetchCards reads from cards ordered by position then created_at and maps columns', async () => {
    h.state.result = { data: [row], error: null }
    const cards = await fetchCards()
    expect(call('from')).toEqual(['from', 'cards'])
    const orders = h.state.calls.filter((c) => c[0] === 'order').map((c) => c[1])
    expect(orders).toEqual(['position', 'created_at'])
    expect(cards).toEqual([
      { id: 'id-1', title: 'T', assignee: 'A', priority: 'High', dueDate: '2030-05-06', column: 'in-review', position: 3 },
    ])
  })

  it('createCard inserts into backlog with the given position and never sends created_at or id', async () => {
    h.state.result = { data: row, error: null }
    await createCard({ title: 'T', assignee: 'A', priority: 'High', dueDate: '2030-05-06' }, 7)
    const payload = call('insert')![1] as Record<string, unknown>
    expect(payload).toEqual({
      title: 'T',
      assignee: 'A',
      priority: 'High',
      due_date: '2030-05-06',
      column: 'backlog',
      position: 7,
    })
    expect(payload).not.toHaveProperty('created_at')
  })

  it('updateCard only sends editable fields (no column, position, id or created_at)', async () => {
    await updateCard('id-1', { title: 'New', assignee: 'B', priority: 'Low', dueDate: '2031-01-02' })
    const payload = call('update')![1] as Record<string, unknown>
    expect(payload).toEqual({ title: 'New', assignee: 'B', priority: 'Low', due_date: '2031-01-02' })
    expect(call('eq')).toEqual(['eq', 'id', 'id-1'])
  })

  it('moveCardTo updates column and position for one card', async () => {
    await moveCardTo('id-1', 'done', 4.5)
    expect(call('update')![1]).toEqual({ column: 'done', position: 4.5 })
    expect(call('eq')).toEqual(['eq', 'id', 'id-1'])
  })

  it('removeCard deletes by id', async () => {
    await removeCard('id-1')
    expect(call('delete')).toBeDefined()
    expect(call('eq')).toEqual(['eq', 'id', 'id-1'])
  })

  it('restoreCard re-inserts with the original id and position but not created_at', async () => {
    const card: CardData = {
      id: 'id-1', title: 'T', assignee: 'A', priority: 'High', dueDate: '2030-05-06', column: 'done', position: 2,
    }
    await restoreCard(card)
    const payload = call('insert')![1] as Record<string, unknown>
    expect(payload).toEqual({
      id: 'id-1', title: 'T', assignee: 'A', priority: 'High', due_date: '2030-05-06', column: 'done', position: 2,
    })
    expect(payload).not.toHaveProperty('created_at')
  })

  it.each([
    ['fetchCards', () => fetchCards()],
    ['createCard', () => createCard({ title: 'T', assignee: 'A', priority: 'Low', dueDate: '2030-01-01' }, 0)],
    ['updateCard', () => updateCard('x', { title: 'T', assignee: 'A', priority: 'Low', dueDate: '2030-01-01' })],
    ['moveCardTo', () => moveCardTo('x', 'done', 0)],
    ['removeCard', () => removeCard('x')],
  ])('%s rejects when Supabase returns an error', async (_name, fn) => {
    h.state.result = { data: null, error: { message: 'permission denied' } }
    await expect(fn()).rejects.toMatchObject({ message: 'permission denied' })
  })

  it('never sends user_id: ownership is assigned by the database, so clients cannot forge it', async () => {
    h.state.result = { data: row, error: null }
    await createCard({ title: 'T', assignee: 'A', priority: 'High', dueDate: '2030-05-06' }, 0)
    await updateCard('id-1', { title: 'T', assignee: 'A', priority: 'High', dueDate: '2030-05-06' })
    await restoreCard({ id: 'id-1', title: 'T', assignee: 'A', priority: 'High', dueDate: '2030-05-06', column: 'done', position: 0 })
    const payloads = h.state.calls.filter((c) => c[0] === 'insert' || c[0] === 'update').map((c) => c[1])
    expect(payloads).toHaveLength(3)
    for (const p of payloads) expect(p).not.toHaveProperty('user_id')
  })

  it('subscribeToCards listens to the cards table and unsubscribes cleanly', () => {
    const stop = subscribeToCards(() => {})
    const on = call('on')!
    expect(on[2]).toMatchObject({ schema: 'public', table: 'cards' })
    stop()
    expect(call('removeChannel')).toBeDefined()
  })
})

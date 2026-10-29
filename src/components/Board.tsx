import { useCallback, useEffect, useMemo, useState } from 'react'
import type { CardData, ColumnId } from '../types'
import { COLUMNS } from '../types'
import {
  createCard,
  fetchCards,
  moveCardTo,
  removeCard,
  restoreCard,
  subscribeToCards,
  updateCard,
} from '../api'
import Column from './Column'
import CardModal, { type CardDraft } from './CardModal'
import Toast from './Toast'
import FilterBar, { NO_FILTERS, type Filters } from './FilterBar'
import { useTheme } from '../theme'

type ModalState = { card: CardData | null } | null

interface Props {
  userEmail?: string
  onSignOut?: () => void
}

export default function Board({ userEmail, onSignOut }: Props) {
  const [cards, setCards] = useState<CardData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modal, setModal] = useState<ModalState>(null)
  const [deleted, setDeleted] = useState<CardData | null>(null)
  const [filters, setFilters] = useState<Filters>(NO_FILTERS)
  const [theme, toggleTheme] = useTheme()
  const [announcement, setAnnouncement] = useState('')

  const reload = useCallback(async () => {
    try {
      setCards(await fetchCards())
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load cards')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void reload()
    return subscribeToCards(() => void reload())
  }, [reload])

  // Run a write; on failure surface the error and resync with the server.
  const run = async (write: () => Promise<unknown>) => {
    try {
      await write()
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Something went wrong'
      await reload()
      setError(message) // after reload(), which clears errors on success
    }
  }

  const moveCard = (id: string, column: ColumnId, beforeId: string | null) => {
    const target = cards.filter((c) => c.column === column && c.id !== id)
    const idx = beforeId ? target.findIndex((c) => c.id === beforeId) : -1
    const next = idx >= 0 ? target[idx] : undefined
    const prev = idx >= 0 ? target[idx - 1] : target[target.length - 1]
    const position =
      prev && next ? (prev.position + next.position) / 2 : next ? next.position - 1 : prev ? prev.position + 1 : 0
    setCards((cs) => cs.map((c) => (c.id === id ? { ...c, column, position } : c)))
    const moved = cards.find((c) => c.id === id)
    const label = COLUMNS.find((c) => c.id === column)?.label
    if (moved) setAnnouncement(`${moved.title} moved to ${label}`)
    void run(() => moveCardTo(id, column, position))
  }

  const deleteCard = (card: CardData) => {
    setCards((cs) => cs.filter((c) => c.id !== card.id))
    setDeleted(card)
    setAnnouncement(`Deleted ${card.title}`)
    void run(() => removeCard(card.id))
  }

  const undoDelete = () => {
    if (!deleted) return
    const card = deleted
    setDeleted(null)
    setCards((cs) => [...cs, card])
    void run(() => restoreCard(card))
  }

  // Throws on failure so the modal can stay open and show the error.
  const saveCard = async (draft: CardDraft) => {
    const editing = modal?.card
    if (editing) {
      await updateCard(editing.id, draft)
      setCards((cs) => cs.map((c) => (c.id === editing.id ? { ...c, ...draft } : c)))
    } else {
      const backlog = cards.filter((c) => c.column === 'backlog')
      const position = backlog.length ? Math.max(...backlog.map((c) => c.position)) + 1 : 0
      const created = await createCard(draft, position)
      setCards((cs) => (cs.some((c) => c.id === created.id) ? cs : [...cs, created]))
      setAnnouncement(`Added ${created.title} to Backlog`)
    }
    setModal(null)
  }

  const assignees = useMemo(() => [...new Set(cards.map((c) => c.assignee))].sort(), [cards])

  const visible = useMemo(() => {
    const q = filters.search.trim().toLowerCase()
    return cards.filter(
      (c) =>
        (!q || c.title.toLowerCase().includes(q) || c.assignee.toLowerCase().includes(q)) &&
        (!filters.assignee || c.assignee === filters.assignee) &&
        (!filters.priority || c.priority === filters.priority),
    )
  }, [cards, filters])

  const filtering = Boolean(filters.search || filters.assignee || filters.priority)

  return (
    <>
      <header className="topbar">
        <h1>Flowboard</h1>
        <div className="topbar-actions">
          <button
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            <span aria-hidden="true">{theme === 'dark' ? '☀️' : '🌙'}</span>
          </button>
          <button className="primary" onClick={() => setModal({ card: null })}>
            + Add card
          </button>
          {onSignOut && (
            <button onClick={onSignOut} title={userEmail ? `Signed in as ${userEmail}` : undefined}>
              Log out
            </button>
          )}
        </div>
      </header>
      <FilterBar filters={filters} assignees={assignees} onChange={setFilters} />
      <div className="sr-only" role="status" aria-live="polite">
        {filtering ? `${visible.length} of ${cards.length} cards shown. ` : ''}
        {announcement}
      </div>
      {error && (
        <div className="error-banner" role="alert">
          {error}
          <button onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}
      {loading ? (
        <p className="loading" role="status">Loading board…</p>
      ) : (
        <main className="board" data-nosnippet>
          {COLUMNS.map((col) => (
            <Column
              key={col.id}
              id={col.id}
              label={col.label}
              cards={visible.filter((c) => c.column === col.id).sort((a, b) => a.position - b.position)}
              onDropCard={moveCard}
              onEdit={(card) => setModal({ card })}
              onDelete={deleteCard}
            />
          ))}
        </main>
      )}
      {deleted && (
        <Toast
          key={deleted.id}
          message={`Deleted "${deleted.title}"`}
          onUndo={undoDelete}
          onExpire={() => setDeleted(null)}
        />
      )}
      {modal && <CardModal card={modal.card} onSave={saveCard} onClose={() => setModal(null)} />}
    </>
  )
}

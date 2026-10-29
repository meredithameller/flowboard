import { useEffect, useRef, useState } from 'react'
import type { CardData, Priority } from '../types'
import { PRIORITIES } from '../types'

export type CardDraft = Pick<CardData, 'title' | 'assignee' | 'priority' | 'dueDate'>

interface Props {
  card: CardData | null
  onSave: (draft: CardDraft) => Promise<void>
  onClose: () => void
}

export default function CardModal({ card, onSave, onClose }: Props) {
  const [title, setTitle] = useState(card?.title ?? '')
  const [assignee, setAssignee] = useState(card?.assignee ?? '')
  const [priority, setPriority] = useState<Priority>(card?.priority ?? 'Medium')
  const [dueDate, setDueDate] = useState(card?.dueDate ?? '')
  const [saving, setSaving] = useState(false)
  const dialogRef = useRef<HTMLFormElement>(null)
  const [error, setError] = useState<string | null>(null)

  // Keep the background inert, restore focus on close.
  // Captured during render: autoFocus on the title input runs before effects do.
  const [opener] = useState(() => document.activeElement as HTMLElement | null)
  useEffect(() => {
    const background = [...document.querySelectorAll<HTMLElement>('#root > :not(.overlay)')]
    background.forEach((el) => el.setAttribute('inert', ''))
    return () => {
      background.forEach((el) => el.removeAttribute('inert'))
      opener?.focus()
    }
  }, [opener])

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
      return
    }
    if (e.key !== 'Tab' || !dialogRef.current) return
    const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
      'input, select, button:not(:disabled), [tabindex]:not([tabindex="-1"])',
    )
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }

  return (
    <div className="overlay" onMouseDown={onClose}>
      <form
        className="modal"
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="card-modal-title"
        onKeyDown={onKeyDown}
        onMouseDown={(e) => e.stopPropagation()}
        onSubmit={async (e) => {
          e.preventDefault()
          setSaving(true)
          setError(null)
          try {
            await onSave({ title: title.trim(), assignee: assignee.trim(), priority, dueDate })
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Could not save the card')
            setSaving(false)
          }
        }}
      >
        <h2 id="card-modal-title">{card ? 'Edit card' : 'New card'}</h2>
        <label>
          Title
          <input value={title} onChange={(e) => setTitle(e.target.value)} required autoFocus maxLength={200} />
        </label>
        <label>
          Assignee
          <input value={assignee} onChange={(e) => setAssignee(e.target.value)} required maxLength={100} />
        </label>
        <label>
          Priority
          <select value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
            {PRIORITIES.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </label>
        <label>
          Due date
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            min="2000-01-01"
            max="2100-12-31"
            required
          />
        </label>
        {error && (
          <div className="error-banner modal-error" role="alert">
            {error}
          </div>
        )}
        <div className="modal-actions">
          <button type="button" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="primary" disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  )
}

import type { CardData, ColumnId } from '../types'
import { COLUMNS } from '../types'

interface Props {
  card: CardData
  onEdit: (card: CardData) => void
  onDelete: (card: CardData) => void
  onDropBefore: (draggedId: string, beforeId: string) => void
  onMove: (column: ColumnId) => void
  onReorder: (direction: -1 | 1) => void
}

function dueInfo(card: CardData): { label: string; state: 'overdue' | 'soon' | '' } {
  const due = new Date(`${card.dueDate}T00:00:00`)
  const label = due.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  if (card.column === 'done') return { label, state: '' }
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const days = Math.round((due.getTime() - today.getTime()) / 86_400_000)
  return { label, state: days < 0 ? 'overdue' : days <= 2 ? 'soon' : '' }
}

export default function Card({ card, onEdit, onDelete, onDropBefore, onMove, onReorder }: Props) {
  const due = dueInfo(card)

  return (
    <article
      className="card"
      tabIndex={0}
      aria-label={`${card.title}, ${card.priority} priority, assigned to ${card.assignee}. Alt plus up or down arrow reorders.`}
      onKeyDown={(e) => {
        if (e.target !== e.currentTarget || !e.altKey) return
        if (e.key === 'ArrowUp') {
          e.preventDefault()
          onReorder(-1)
        } else if (e.key === 'ArrowDown') {
          e.preventDefault()
          onReorder(1)
        }
      }}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', card.id)
        e.dataTransfer.effectAllowed = 'move'
      }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault()
        e.stopPropagation()
        const draggedId = e.dataTransfer.getData('text/plain')
        if (draggedId && draggedId !== card.id) onDropBefore(draggedId, card.id)
      }}
    >
      <h3 className="card-title">{card.title}</h3>
      <div className="card-meta">
        <span className={`badge ${card.priority.toLowerCase()}`}>{card.priority}</span>
        <span>{card.assignee}</span>
        <span className={`due ${due.state}`}>
          {due.state === 'overdue' ? 'Overdue · ' : due.state === 'soon' ? 'Due soon · ' : 'Due '}
          {due.label}
        </span>
      </div>
      <div className="card-actions">
        <button onClick={() => onEdit(card)}>Edit</button>
        <select
          aria-label={`Move ${card.title} to column`}
          value={card.column}
          onChange={(e) => onMove(e.target.value as ColumnId)}
        >
          {COLUMNS.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
        <button
          className="danger icon-btn"
          aria-label={`Delete ${card.title}`}
          data-tooltip="Delete"
          onClick={() => onDelete(card)}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M3 6h18" />
            <path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
            <path d="M19 6l-1 14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1L5 6" />
            <path d="M10 11v6M14 11v6" />
          </svg>
        </button>
      </div>
    </article>
  )
}

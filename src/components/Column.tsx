import { useState } from 'react'
import type { CardData, ColumnId } from '../types'
import Card from './Card'

interface Props {
  id: ColumnId
  label: string
  cards: CardData[]
  onDropCard: (cardId: string, column: ColumnId, beforeId: string | null) => void
  onEdit: (card: CardData) => void
  onDelete: (card: CardData) => void
}

export default function Column({ id, label, cards, onDropCard, onEdit, onDelete }: Props) {
  const [over, setOver] = useState(false)

  return (
    <section
      className={`column${over ? ' over' : ''}`}
      aria-label={label}
      onDragOver={(e) => {
        e.preventDefault()
        setOver(true)
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOver(false)
      }}
      onDrop={(e) => {
        e.preventDefault()
        setOver(false)
        const cardId = e.dataTransfer.getData('text/plain')
        if (cardId) onDropCard(cardId, id, null)
      }}
    >
      <h2>
        {label} <span className="count">{cards.length}</span>
      </h2>
      <div className="cards">
        {cards.length === 0 && <div className="empty">Drop cards here</div>}
        {cards.map((c, i) => (
          <Card
            key={c.id}
            card={c}
            onEdit={onEdit}
            onDelete={onDelete}
            onDropBefore={(draggedId, beforeId) => onDropCard(draggedId, id, beforeId)}
            onMove={(column) => onDropCard(c.id, column, null)}
            onReorder={(dir) => {
              if (dir < 0 && i > 0) onDropCard(c.id, id, cards[i - 1].id)
              if (dir > 0 && i < cards.length - 1) onDropCard(c.id, id, cards[i + 2]?.id ?? null)
            }}
          />
        ))}
      </div>
    </section>
  )
}

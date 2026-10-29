import { supabase } from './supabase'
import type { CardData, ColumnId } from './types'

interface CardRow {
  id: string
  title: string
  assignee: string
  priority: CardData['priority']
  due_date: string
  column: ColumnId
  position: number
}

const toCard = (r: CardRow): CardData => ({
  id: r.id,
  title: r.title,
  assignee: r.assignee,
  priority: r.priority,
  dueDate: r.due_date,
  column: r.column,
  position: r.position,
})

type Draft = Pick<CardData, 'title' | 'assignee' | 'priority' | 'dueDate'>

export async function fetchCards(): Promise<CardData[]> {
  const { data, error } = await supabase.from('cards').select('*').order('position').order('created_at')
  if (error) throw error
  return (data as CardRow[]).map(toCard)
}

export async function createCard(draft: Draft, position: number): Promise<CardData> {
  const { data, error } = await supabase
    .from('cards')
    .insert({
      title: draft.title,
      assignee: draft.assignee,
      priority: draft.priority,
      due_date: draft.dueDate,
      column: 'backlog',
      position,
    })
    .select()
    .single()
  if (error) throw error
  return toCard(data as CardRow)
}

export async function updateCard(id: string, draft: Draft): Promise<void> {
  const { error } = await supabase
    .from('cards')
    .update({
      title: draft.title,
      assignee: draft.assignee,
      priority: draft.priority,
      due_date: draft.dueDate,
    })
    .eq('id', id)
  if (error) throw error
}

export async function moveCardTo(id: string, column: ColumnId, position: number): Promise<void> {
  const { error } = await supabase.from('cards').update({ column, position }).eq('id', id)
  if (error) throw error
}

export async function restoreCard(card: CardData): Promise<void> {
  const { error } = await supabase.from('cards').insert({
    id: card.id,
    title: card.title,
    assignee: card.assignee,
    priority: card.priority,
    due_date: card.dueDate,
    column: card.column,
    position: card.position,
  })
  if (error) throw error
}

export async function removeCard(id: string): Promise<void> {
  const { error } = await supabase.from('cards').delete().eq('id', id)
  if (error) throw error
}

export function subscribeToCards(onChange: () => void): () => void {
  const channel = supabase
    .channel('cards-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'cards' }, onChange)
    .subscribe()
  return () => {
    void supabase.removeChannel(channel)
  }
}

import { act, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { makeCard } from '../test/fakeApi'
import { resetFakeApi } from '../test/mockApi'
import Board from './Board'

vi.mock('../api', async () => (await import('../test/mockApi')).apiModule)

const dt = () => {
  const store: Record<string, string> = {}
  return { setData: (k: string, v: string) => (store[k] = v), getData: (k: string) => store[k] ?? '', effectAllowed: '' }
}
const region = (name: string) => screen.getByRole('region', { name })
const titlesIn = (name: string) => within(region(name)).queryAllByRole('heading', { level: 3 }).map((h) => h.textContent)

async function setup(cards = [makeCard({ title: 'Write docs' })]) {
  const fake = resetFakeApi(cards)
  render(<Board />)
  await screen.findByRole('region', { name: 'Backlog' })
  return fake
}

const localISO = (offsetDays: number) => {
  const d = new Date()
  d.setDate(d.getDate() + offsetDays)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

describe('loading and layout', () => {
  it('shows a loading status, then the four labelled columns', async () => {
    resetFakeApi([])
    render(<Board />)
    expect(screen.getByText('Loading board…')).toBeInTheDocument()
    for (const label of ['Backlog', 'In Progress', 'In Review', 'Done']) {
      expect(await screen.findByRole('region', { name: label })).toBeInTheDocument()
    }
  })

  it('shows "Drop cards here" in every empty column', async () => {
    await setup([])
    expect(screen.getAllByText('Drop cards here')).toHaveLength(4)
  })

  it('has one h1, four column h2s and card titles as h3 (heading structure)', async () => {
    await setup([makeCard({ title: 'A' }), makeCard({ title: 'B', column: 'done' })])
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(4)
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(2)
  })

  it('keeps card text out of search snippets', async () => {
    await setup()
    expect(screen.getByRole('main')).toHaveAttribute('data-nosnippet')
  })

  it('orders cards by position, not by load order', async () => {
    await setup([
      makeCard({ title: 'Third', position: 3 }),
      makeCard({ title: 'First', position: 1 }),
      makeCard({ title: 'Second', position: 2 }),
    ])
    expect(titlesIn('Backlog')).toEqual(['First', 'Second', 'Third'])
  })

  it('reloads when a realtime change arrives', async () => {
    const fake = await setup()
    act(() => fake.emitRemoteChange([makeCard({ title: 'From a teammate' })]))
    expect(await screen.findByText('From a teammate')).toBeInTheDocument()
  })
})

describe('creating cards', () => {
  it('adds a new card to Backlog after the last Backlog card', async () => {
    const user = userEvent.setup()
    const fake = await setup([makeCard({ title: 'Existing', position: 4 })])
    await user.click(screen.getByRole('button', { name: '+ Add card' }))
    await user.type(screen.getByLabelText('Title'), '  Ship it ')
    await user.type(screen.getByLabelText('Assignee'), 'Grace')
    await user.selectOptions(screen.getByLabelText('Priority'), 'High')
    fireEvent.change(screen.getByLabelText('Due date'), { target: { value: '2099-03-04' } })
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findByText('Ship it')).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(fake.api.createCard).toHaveBeenCalledWith(
      { title: 'Ship it', assignee: 'Grace', priority: 'High', dueDate: '2099-03-04' },
      5,
    )
    expect(titlesIn('Backlog')).toEqual(['Existing', 'Ship it'])
  })

  it('announces the new card to screen readers', async () => {
    const user = userEvent.setup()
    await setup([])
    await user.click(screen.getByRole('button', { name: '+ Add card' }))
    await user.type(screen.getByLabelText('Title'), 'X')
    await user.type(screen.getByLabelText('Assignee'), 'Y')
    fireEvent.change(screen.getByLabelText('Due date'), { target: { value: '2099-03-04' } })
    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(await screen.findByText(/Added X to Backlog/)).toBeInTheDocument()
  })

  it('keeps the modal open with the typed text and shows the error when saving fails', async () => {
    const user = userEvent.setup()
    const fake = await setup([])
    fake.api.createCard.mockRejectedValueOnce(new Error('permission denied'))
    await user.click(screen.getByRole('button', { name: '+ Add card' }))
    await user.type(screen.getByLabelText('Title'), 'Keep me')
    await user.type(screen.getByLabelText('Assignee'), 'Y')
    fireEvent.change(screen.getByLabelText('Due date'), { target: { value: '2099-03-04' } })
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(await within(screen.getByRole('dialog')).findByRole('alert')).toHaveTextContent('permission denied')
    expect(screen.getByLabelText('Title')).toHaveValue('Keep me')
    expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled()
  })
})

describe('editing cards', () => {
  it('opens prefilled, saves changes and sends them to the API', async () => {
    const user = userEvent.setup()
    const card = makeCard({ title: 'Old', assignee: 'Ada', priority: 'Low', dueDate: '2099-01-01' })
    const fake = await setup([card])
    await user.click(screen.getByRole('button', { name: 'Edit' }))
    expect(screen.getByLabelText('Title')).toHaveValue('Old')
    expect(screen.getByLabelText('Priority')).toHaveValue('Low')

    await user.clear(screen.getByLabelText('Title'))
    await user.type(screen.getByLabelText('Title'), 'New title')
    await user.selectOptions(screen.getByLabelText('Priority'), 'High')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findByText('New title')).toBeInTheDocument()
    expect(fake.api.updateCard).toHaveBeenCalledWith(card.id, {
      title: 'New title', assignee: 'Ada', priority: 'High', dueDate: '2099-01-01',
    })
    expect(screen.queryByText('Old')).not.toBeInTheDocument()
  })
})

describe('moving cards', () => {
  const three = () => [
    makeCard({ title: 'A', position: 0 }),
    makeCard({ title: 'B', position: 1 }),
    makeCard({ title: 'C', position: 2 }),
  ]

  it('dropping on another column moves the card to the end of it', async () => {
    const fake = await setup()
    const card = fake.rows[0]
    const data = dt()
    data.setData('text/plain', card.id)
    fireEvent.drop(region('Done'), { dataTransfer: data })
    expect(fake.api.moveCardTo).toHaveBeenCalledWith(card.id, 'done', 0)
    expect(titlesIn('Done')).toEqual(['Write docs'])
    expect(await screen.findByText(/Write docs moved to Done/)).toBeInTheDocument()
  })

  it('dropping onto a card places the dragged card just before it', async () => {
    const fake = await setup(three())
    const [a, , c] = fake.rows
    const data = dt()
    data.setData('text/plain', c.id)
    fireEvent.drop(screen.getByRole('article', { name: /^A,/ }), { dataTransfer: data })
    expect(fake.api.moveCardTo).toHaveBeenCalledWith(c.id, 'backlog', a.position - 1)
    expect(titlesIn('Backlog')).toEqual(['C', 'A', 'B'])
  })

  it('dropping between two cards uses the midpoint position', async () => {
    const fake = await setup(three())
    const [a, , c] = fake.rows
    const data = dt()
    data.setData('text/plain', a.id)
    fireEvent.drop(screen.getByRole('article', { name: /^C,/ }), { dataTransfer: data })
    expect(fake.api.moveCardTo).toHaveBeenCalledWith(a.id, 'backlog', 1.5)
    expect(titlesIn('Backlog')).toEqual(['B', 'A', 'C'])
    expect(c).toBeDefined()
  })

  it('"Move to column" select moves the card (keyboard / touch alternative)', async () => {
    const user = userEvent.setup()
    const fake = await setup()
    await user.selectOptions(screen.getByLabelText(/Move Write docs to column/), 'In Review')
    expect(fake.api.moveCardTo).toHaveBeenCalledWith(fake.rows[0].id, 'in-review', 0)
    expect(titlesIn('In Review')).toEqual(['Write docs'])
  })

  it('Alt+ArrowUp moves a focused card up; Alt+ArrowDown moves it down', async () => {
    const fake = await setup(three())
    const [a, b] = fake.rows
    fireEvent.keyDown(screen.getByRole('article', { name: /^B,/ }), { key: 'ArrowUp', altKey: true })
    expect(fake.api.moveCardTo).toHaveBeenLastCalledWith(b.id, 'backlog', -1)
    expect(titlesIn('Backlog')).toEqual(['B', 'A', 'C'])

    fireEvent.keyDown(screen.getByRole('article', { name: /^A,/ }), { key: 'ArrowDown', altKey: true })
    expect(fake.api.moveCardTo).toHaveBeenLastCalledWith(a.id, 'backlog', 3)
    expect(titlesIn('Backlog')).toEqual(['B', 'C', 'A'])
  })

  it('ArrowUp without Alt, or on the first card, does nothing', async () => {
    const fake = await setup(three())
    const first = screen.getByRole('article', { name: /^A,/ })
    fireEvent.keyDown(first, { key: 'ArrowUp', altKey: true })
    fireEvent.keyDown(screen.getByRole('article', { name: /^B,/ }), { key: 'ArrowUp' })
    expect(fake.api.moveCardTo).not.toHaveBeenCalled()
  })

  it('cards are keyboard focusable with a descriptive accessible name', async () => {
    await setup([makeCard({ title: 'Ship', priority: 'High', assignee: 'Ada' })])
    const card = screen.getByRole('article', { name: /Ship, High priority, assigned to Ada/ })
    expect(card).toHaveAttribute('tabindex', '0')
  })

  it('on failure shows the error and reloads from the server', async () => {
    const fake = await setup()
    fake.api.moveCardTo.mockRejectedValueOnce(new Error('network down'))
    const before = fake.api.fetchCards.mock.calls.length
    await userEvent.setup().selectOptions(screen.getByLabelText(/Move Write docs/), 'Done')
    expect(await screen.findByRole('alert')).toHaveTextContent('network down')
    expect(fake.api.fetchCards.mock.calls.length).toBeGreaterThan(before)
  })
})

describe('deleting cards', () => {
  it('removes the card immediately, without a confirm prompt, and calls the API', async () => {
    const confirm = vi.spyOn(window, 'confirm')
    const user = userEvent.setup()
    const fake = await setup()
    const id = fake.rows[0].id
    await user.click(screen.getByRole('button', { name: 'Delete Write docs' }))
    expect(screen.queryByText('Write docs', { selector: 'h3' })).not.toBeInTheDocument()
    expect(fake.api.removeCard).toHaveBeenCalledWith(id)
    expect(confirm).not.toHaveBeenCalled()
  })

  it('Undo restores the same card (same id and position)', async () => {
    const user = userEvent.setup()
    const card = makeCard({ title: 'Oops', position: 3, column: 'in-progress' })
    const fake = await setup([card])
    await user.click(screen.getByRole('button', { name: 'Delete Oops' }))
    expect(screen.getByText('Deleted "Oops"')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Undo' }))
    expect(fake.api.restoreCard).toHaveBeenCalledWith(card)
    expect(titlesIn('In Progress')).toEqual(['Oops'])
    expect(screen.queryByRole('button', { name: 'Undo' })).not.toBeInTheDocument()
  })

  it('the undo toast expires after 6 seconds', async () => {
    const card = makeCard({ title: 'Gone' })
    await setup([card])
    vi.useFakeTimers()
    fireEvent.click(screen.getByRole('button', { name: 'Delete Gone' }))
    expect(screen.getByRole('button', { name: 'Undo' })).toBeInTheDocument()
    act(() => void vi.advanceTimersByTime(5900))
    expect(screen.getByRole('button', { name: 'Undo' })).toBeInTheDocument()
    act(() => void vi.advanceTimersByTime(200))
    expect(screen.queryByRole('button', { name: 'Undo' })).not.toBeInTheDocument()
  })

  it('the delete button has an accessible name and a tooltip', async () => {
    await setup([makeCard({ title: 'Z' })])
    expect(screen.getByRole('button', { name: 'Delete Z' })).toHaveAttribute('data-tooltip', 'Delete')
  })
})

describe('due dates', () => {
  it('formats the date as month and day, not ISO', async () => {
    await setup([makeCard({ dueDate: '2099-01-15' })])
    const text = screen.getByText(/^Due /).textContent!
    expect(text).toMatch(/Jan.*15|15.*Jan/)
    expect(text).not.toContain('2099')
  })

  it('flags overdue cards, and not once they are Done', async () => {
    await setup([
      makeCard({ title: 'Late', dueDate: '2000-01-02' }),
      makeCard({ title: 'Finished', dueDate: '2000-01-02', column: 'done' }),
    ])
    expect(within(region('Backlog')).getByText(/Overdue/)).toBeInTheDocument()
    expect(within(region('Done')).queryByText(/Overdue/)).not.toBeInTheDocument()
  })

  it('says "Due soon" in text for cards due within 2 days (not colour alone)', async () => {
    await setup([makeCard({ dueDate: localISO(1) })])
    expect(screen.getByText(/Due soon/)).toBeInTheDocument()
  })

  it('a far-future date gets no warning', async () => {
    await setup([makeCard({ dueDate: localISO(30) })])
    expect(screen.queryByText(/Due soon|Overdue/)).not.toBeInTheDocument()
  })
})

describe('search and filters', () => {
  const cards = () => [
    makeCard({ title: 'Fix login', assignee: 'Ada', priority: 'High' }),
    makeCard({ title: 'Write docs', assignee: 'Grace', priority: 'Low' }),
    makeCard({ title: 'Deploy', assignee: 'Ada', priority: 'Low', column: 'done' }),
  ]

  it('search matches title and assignee, case-insensitively', async () => {
    const user = userEvent.setup()
    await setup(cards())
    await user.type(screen.getByLabelText('Search cards'), 'LOGIN')
    expect(titlesIn('Backlog')).toEqual(['Fix login'])
    await user.clear(screen.getByLabelText('Search cards'))
    await user.type(screen.getByLabelText('Search cards'), 'grace')
    expect(titlesIn('Backlog')).toEqual(['Write docs'])
  })

  it('assignee and priority filters combine, and Clear resets them', async () => {
    const user = userEvent.setup()
    await setup(cards())
    await user.selectOptions(screen.getByLabelText('Filter by assignee'), 'Ada')
    await user.selectOptions(screen.getByLabelText('Filter by priority'), 'Low')
    expect(titlesIn('Backlog')).toEqual([])
    expect(titlesIn('Done')).toEqual(['Deploy'])
    await user.click(screen.getByRole('button', { name: 'Clear' }))
    expect(titlesIn('Backlog')).toEqual(['Fix login', 'Write docs'])
    expect(screen.queryByRole('button', { name: 'Clear' })).not.toBeInTheDocument()
  })

  it('assignee options come from the cards on the board', async () => {
    await setup(cards())
    const options = within(screen.getByLabelText('Filter by assignee')).getAllByRole('option').map((o) => o.textContent)
    expect(options).toEqual(['All assignees', 'Ada', 'Grace'])
  })

  it('column counts reflect the filter and the result count is announced', async () => {
    const user = userEvent.setup()
    await setup(cards())
    await user.type(screen.getByLabelText('Search cards'), 'docs')
    expect(screen.getByRole('heading', { name: 'Backlog 1' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Done 0' })).toBeInTheDocument()
    expect(screen.getByText(/1 of 3 cards shown/)).toBeInTheDocument()
  })

  it('still lets you drop a card next to hidden cards', async () => {
    const user = userEvent.setup()
    const fake = await setup(cards())
    await user.type(screen.getByLabelText('Search cards'), 'docs')
    await user.selectOptions(screen.getByLabelText(/Move Write docs/), 'Done')
    expect(fake.api.moveCardTo).toHaveBeenCalledWith(expect.any(String), 'done', expect.any(Number))
  })
})

describe('theme toggle', () => {
  it('switches light to dark, updates <html> and remembers the choice', async () => {
    const user = userEvent.setup()
    await setup([])
    expect(document.documentElement.dataset.theme).toBe('light')
    await user.click(screen.getByRole('button', { name: 'Switch to dark mode' }))
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(localStorage.getItem('flowboard.theme')).toBe('dark')
    expect(screen.getByRole('button', { name: 'Switch to light mode' })).toBeInTheDocument()
  })
})

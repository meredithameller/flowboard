import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { makeCard } from '../test/fakeApi'
import CardModal from './CardModal'

function renderModal(props: Partial<React.ComponentProps<typeof CardModal>> = {}) {
  const root = document.createElement('div')
  root.id = 'root'
  document.body.append(root)
  const onSave = vi.fn().mockResolvedValue(undefined)
  const onClose = vi.fn()
  const opener = document.createElement('button')
  opener.textContent = 'opener'
  document.body.append(opener)
  opener.focus()
  const utils = render(
    <>
      <header>background</header>
      <CardModal card={null} onSave={onSave} onClose={onClose} {...props} />
    </>,
    { container: root },
  )
  return { ...utils, onSave, onClose, opener }
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('CardModal', () => {
  it('is a labelled modal dialog and focuses the title field', () => {
    renderModal()
    const dialog = screen.getByRole('dialog', { name: 'New card' })
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(screen.getByLabelText('Title')).toHaveFocus()
  })

  it('titles itself "Edit card" for an existing card', () => {
    renderModal({ card: makeCard() })
    expect(screen.getByRole('dialog', { name: 'Edit card' })).toBeInTheDocument()
  })

  it('requires all four fields', () => {
    renderModal()
    for (const label of ['Title', 'Assignee', 'Due date']) expect(screen.getByLabelText(label)).toBeRequired()
    expect(screen.getByLabelText('Priority')).toHaveValue('Medium')
  })

  it('limits input lengths and dates to what the database accepts', () => {
    renderModal()
    expect(screen.getByLabelText('Title')).toHaveAttribute('maxlength', '200')
    expect(screen.getByLabelText('Assignee')).toHaveAttribute('maxlength', '100')
    expect(screen.getByLabelText('Due date')).toHaveAttribute('min', '2000-01-01')
    expect(screen.getByLabelText('Due date')).toHaveAttribute('max', '2100-12-31')
  })

  it('trims whitespace before saving', async () => {
    const user = userEvent.setup()
    const { onSave } = renderModal()
    await user.type(screen.getByLabelText('Title'), '  Hi  ')
    await user.type(screen.getByLabelText('Assignee'), ' Ada ')
    fireEvent.change(screen.getByLabelText('Due date'), { target: { value: '2099-02-03' } })
    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(onSave).toHaveBeenCalledWith({ title: 'Hi', assignee: 'Ada', priority: 'Medium', dueDate: '2099-02-03' })
  })

  it('closes on Escape', async () => {
    const { onClose } = renderModal()
    await userEvent.setup().keyboard('{Escape}')
    expect(onClose).toHaveBeenCalled()
  })

  it('traps Tab and Shift+Tab inside the dialog', async () => {
    const user = userEvent.setup()
    renderModal()
    screen.getByRole('button', { name: 'Save' }).focus()
    await user.tab()
    expect(screen.getByLabelText('Title')).toHaveFocus()
    await user.tab({ shift: true })
    expect(screen.getByRole('button', { name: 'Save' })).toHaveFocus()
  })

  it('makes the page behind inert while open, and restores it and focus on close', () => {
    const { unmount, opener } = renderModal()
    expect(screen.getByText('background')).toHaveAttribute('inert')
    unmount()
    expect(document.querySelector('header')).toBeNull()
    expect(opener).toHaveFocus()
  })

  it('shows the error inside the dialog and re-enables Save when saving fails', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn().mockRejectedValue(new Error('nope'))
    renderModal({ onSave })
    await user.type(screen.getByLabelText('Title'), 'T')
    await user.type(screen.getByLabelText('Assignee'), 'A')
    fireEvent.change(screen.getByLabelText('Due date'), { target: { value: '2099-02-03' } })
    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('nope')
    expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled()
  })
})

import type { Priority } from '../types'
import { PRIORITIES } from '../types'

export interface Filters {
  search: string
  assignee: string
  priority: Priority | ''
}

export const NO_FILTERS: Filters = { search: '', assignee: '', priority: '' }

interface Props {
  filters: Filters
  assignees: string[]
  onChange: (filters: Filters) => void
}

export default function FilterBar({ filters, assignees, onChange }: Props) {
  const active = filters.search || filters.assignee || filters.priority

  return (
    <div className="filter-bar">
      <input
        type="search"
        placeholder="Search cards…"
        aria-label="Search cards"
        value={filters.search}
        onChange={(e) => onChange({ ...filters, search: e.target.value })}
      />
      <select
        aria-label="Filter by assignee"
        value={filters.assignee}
        onChange={(e) => onChange({ ...filters, assignee: e.target.value })}
      >
        <option value="">All assignees</option>
        {assignees.map((a) => (
          <option key={a}>{a}</option>
        ))}
      </select>
      <select
        aria-label="Filter by priority"
        value={filters.priority}
        onChange={(e) => onChange({ ...filters, priority: e.target.value as Priority | '' })}
      >
        <option value="">All priorities</option>
        {PRIORITIES.map((p) => (
          <option key={p}>{p}</option>
        ))}
      </select>
      {active && <button onClick={() => onChange(NO_FILTERS)}>Clear</button>}
    </div>
  )
}

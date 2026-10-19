import { useMemo, useState, type FormEvent } from 'react'
import { Check, Pencil, Search, Trash2, UsersRound, X } from 'lucide-react'
import type { Guest, SeatingTable } from '../types'

interface GuestSidebarProps {
  guests: Guest[]
  tables: SeatingTable[]
  selectedGuestId: string | null
  onAddNames: (names: string[]) => number
  onSelectGuest: (guestId: string) => void
  onUnseatGuest: (guestId: string) => void
  onRenameGuest: (guestId: string, name: string) => void
  onRemoveGuest: (guestId: string) => void
}

function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()
}

function GuestSidebar({
  guests,
  tables,
  selectedGuestId,
  onAddNames,
  onSelectGuest,
  onUnseatGuest,
  onRenameGuest,
  onRemoveGuest,
}: GuestSidebarProps) {
  const [draft, setDraft] = useState('')
  const [query, setQuery] = useState('')
  const [formMessage, setFormMessage] = useState('')
  const [editingGuestId, setEditingGuestId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const filteredGuests = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase()
    return normalizedQuery
      ? guests.filter((guest) => guest.name.toLocaleLowerCase().includes(normalizedQuery))
      : guests
  }, [guests, query])
  const unseated = filteredGuests.filter((guest) => guest.tableId === null)
  const seated = filteredGuests.filter((guest) => guest.tableId !== null)

  const submitNames = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const names = draft.split(/\r?\n/).map((name) => name.trim()).filter(Boolean)
    if (names.length === 0) {
      setFormMessage('Add at least one name.')
      return
    }
    const added = onAddNames(names)
    setDraft('')
    setFormMessage(added > 0 ? `${added} ${added === 1 ? 'guest' : 'guests'} added` : 'Those names are already on the list.')
  }

  const renderGuest = (guest: Guest) => {
    const table = tables.find((entry) => entry.id === guest.tableId)
    const selected = selectedGuestId === guest.id
    return (
      <div className={`guest-row ${selected ? 'is-selected' : ''}`} key={guest.id}>
        {editingGuestId === guest.id ? (
          <form
            className="guest-edit-form"
            onSubmit={(event) => {
              event.preventDefault()
              onRenameGuest(guest.id, editingName)
              setEditingGuestId(null)
            }}
          >
            <input autoFocus aria-label={`Edit ${guest.name}`} value={editingName} onChange={(event) => setEditingName(event.target.value)} />
            <button type="submit" aria-label="Save guest name"><Check size={14} /></button>
            <button type="button" aria-label="Cancel name edit" onClick={() => setEditingGuestId(null)}><X size={14} /></button>
          </form>
        ) : (
          <>
            <button
              className="guest-select"
              type="button"
              draggable
              aria-pressed={selected}
              onClick={() => onSelectGuest(guest.id)}
              onDragStart={(event) => {
                event.dataTransfer.setData('text/plain', guest.id)
                event.dataTransfer.effectAllowed = 'move'
              }}
              title={guest.tableId ? `${guest.name}, seated at ${table?.name ?? 'a table'}` : `${guest.name}, unseated`}
            >
              <span className="guest-avatar">{initials(guest.name)}</span>
              <span className="guest-copy">
                <span className="guest-name">{guest.name}</span>
                <span className="guest-subtitle">{table?.name ?? 'Not seated'}</span>
              </span>
              {selected && <span className="moving-indicator">Moving</span>}
            </button>
            <div className="guest-actions">
              <button
                type="button"
                aria-label={`Rename ${guest.name}`}
                title="Rename guest"
                onClick={() => {
                  setEditingGuestId(guest.id)
                  setEditingName(guest.name)
                }}
              ><Pencil size={13} /></button>
              {table && (
                <button type="button" aria-label={`Move ${guest.name} to unseated guests`} title="Move to unseated" onClick={() => onUnseatGuest(guest.id)}>
                  <X size={14} />
                </button>
              )}
              <button type="button" aria-label={`Remove ${guest.name}`} title="Remove guest" onClick={() => onRemoveGuest(guest.id)}>
                <Trash2 size={13} />
              </button>
            </div>
          </>
        )}
      </div>
    )
  }

  return (
    <aside className="guest-sidebar" aria-label="Guest list">
      <div className="sidebar-heading">
        <div>
          <p className="eyebrow">PEOPLE</p>
          <h2>Guest list <span className="guest-total">{guests.length}</span></h2>
        </div>
        <span className="sidebar-icon"><UsersRound size={19} /></span>
      </div>

      <form className="guest-entry" onSubmit={submitNames}>
        <label htmlFor="guest-names">Add names</label>
        <textarea
          id="guest-names"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={'One name per line\nAvery Morgan\nJordan Lee'}
          rows={3}
        />
        <div className="guest-entry-footer">
          <span className="form-message" aria-live="polite">{formMessage || 'Names can be pasted from a list'}</span>
          <button className="add-guest-button" type="submit" aria-label="Add guests"><span>Add</span></button>
        </div>
      </form>

      <label className="guest-search">
        <Search size={16} />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find a guest" aria-label="Find a guest" />
        {query && <button type="button" aria-label="Clear guest search" onClick={() => setQuery('')}><X size={14} /></button>}
      </label>

      <div className="guest-groups">
        <section className="guest-group" aria-labelledby="unseated-heading">
          <div className="guest-group-heading">
            <h3 id="unseated-heading">Unseated</h3>
            <span>{guests.filter((guest) => guest.tableId === null).length}</span>
          </div>
          {unseated.length > 0 ? (
            <div className="guest-list">{unseated.map(renderGuest)}</div>
          ) : (
            <p className="guest-empty">{query ? 'No matching guests.' : 'Everyone has a seat.'}</p>
          )}
        </section>

        <section className="guest-group seated-group" aria-labelledby="seated-heading">
          <div className="guest-group-heading">
            <h3 id="seated-heading">Seated</h3>
            <span>{guests.filter((guest) => guest.tableId !== null).length}</span>
          </div>
          {seated.length > 0 ? (
            <div className="guest-list">{seated.map(renderGuest)}</div>
          ) : (
            <p className="guest-empty">Seated guests will appear here.</p>
          )}
        </section>
      </div>
      <div className="sidebar-footnote">{guests.length} guests in this event</div>
    </aside>
  )
}

export default GuestSidebar
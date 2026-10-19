import { useMemo, type CSSProperties, type DragEvent } from 'react'
import { Armchair, Trash2 } from 'lucide-react'
import { MAX_SEATS, MIN_SEATS, getSeatPosition } from '../model'
import type { Guest, SeatingTable, TableShape } from '../types'

interface TableCardProps {
  table: SeatingTable
  tableNumber: number
  guests: Guest[]
  selectedGuestId: string | null
  onSeatClick: (tableId: string, seatIndex: number) => void
  onDropGuest: (guestId: string, tableId: string, seatIndex: number) => void
  onShapeChange: (shape: TableShape) => void
  onCapacityChange: (capacity: number) => void
  onNameChange: (name: string) => void
  onDelete: () => void
}

function guestInitials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()
}

function TableCard({
  table,
  tableNumber,
  guests,
  selectedGuestId,
  onSeatClick,
  onDropGuest,
  onShapeChange,
  onCapacityChange,
  onNameChange,
  onDelete,
}: TableCardProps) {
  const occupants = useMemo(
    () => new Map(guests.filter((guest) => guest.tableId === table.id).map((guest) => [guest.seatIndex, guest])),
    [guests, table.id],
  )
  const seatedCount = occupants.size
  const seats = Array.from({ length: table.capacity }, (_, index) => index)

  const handleDrop = (event: DragEvent<HTMLButtonElement>, seatIndex: number) => {
    event.preventDefault()
    const guestId = event.dataTransfer.getData('text/plain')
    if (guestId) onDropGuest(guestId, table.id, seatIndex)
  }

  return (
    <article className="table-card">
      <header className="table-card-header">
        <div className="table-card-title">
          <span className="table-number">{String(tableNumber).padStart(2, '0')}</span>
          <input aria-label={`Table ${tableNumber} name`} value={table.name} onChange={(event) => onNameChange(event.target.value)} />
        </div>
        <button className="table-delete" type="button" aria-label={`Delete ${table.name}`} title="Delete table" onClick={onDelete}>
          <Trash2 size={16} />
        </button>
      </header>

      <div className={`table-stage stage-${table.shape}`}>
        <div className={`table-surface surface-${table.shape}`} aria-hidden="true">
          <span>{table.name}</span>
          <small>{seatedCount} / {table.capacity} seated</small>
        </div>
        {seats.map((seatIndex) => {
          const guest = occupants.get(seatIndex)
          const position = getSeatPosition(table.shape, seatIndex, table.capacity)
          const style = { left: position.left, top: position.top } as CSSProperties
          return (
            <button
              className={`table-seat ${guest ? 'seat-filled' : ''} ${guest?.id === selectedGuestId ? 'seat-selected' : ''}`}
              key={seatIndex}
              type="button"
              style={style}
              title={guest ? `${guest.name}, seat ${seatIndex + 1}` : `Open seat ${seatIndex + 1}`}
              aria-label={guest ? `Seat ${seatIndex + 1}: ${guest.name}. Select guest to move.` : `Open seat ${seatIndex + 1} at ${table.name}`}
              onClick={() => onSeatClick(table.id, seatIndex)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => handleDrop(event, seatIndex)}
            >
              {guest ? guestInitials(guest.name) : <Armchair size={15} strokeWidth={1.8} />}
            </button>
          )
        })}
      </div>

      <footer className="table-card-footer">
        <label>
          <span>Shape</span>
          <select value={table.shape} onChange={(event) => onShapeChange(event.target.value as TableShape)} aria-label={`Shape for ${table.name}`}>
            <option value="round">Round</option>
            <option value="square">Square</option>
            <option value="rectangle">Rectangle</option>
          </select>
        </label>
        <label>
          <span>Seats</span>
          <select value={table.capacity} onChange={(event) => onCapacityChange(Number(event.target.value))} aria-label={`Seat capacity for ${table.name}`}>
            {Array.from({ length: MAX_SEATS - MIN_SEATS + 1 }, (_, index) => MIN_SEATS + index).map((capacity) => (
              <option key={capacity} value={capacity}>{capacity} seats</option>
            ))}
          </select>
        </label>
        <span className="table-capacity-note">{table.capacity - seatedCount} open</span>
      </footer>
    </article>
  )
}

export default TableCard
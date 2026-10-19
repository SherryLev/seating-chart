import { useEffect, useRef, useState } from 'react'
import {
  Armchair,
  Check,
  Circle,
  Download,
  LayoutGrid,
  Plus,
  Printer,
  RectangleHorizontal,
  Square,
  Upload,
  UsersRound,
  X,
} from 'lucide-react'
import GuestSidebar from './components/GuestSidebar'
import TableCard from './components/TableCard'
import { createInitialChart, createTable, MAX_SEATS, MIN_SEATS } from './model'
import { isSeatingChart, loadChart, saveChart } from './storage'
import type { SeatingChart, SeatingTable, TableShape } from './types'
import './App.css'

const shapeOptions: { shape: TableShape; label: string; Icon: typeof Circle }[] = [
  { shape: 'round', label: 'Round', Icon: Circle },
  { shape: 'square', label: 'Square', Icon: Square },
  { shape: 'rectangle', label: 'Rectangle', Icon: RectangleHorizontal },
]

function App() {
  const [chart, setChart] = useState<SeatingChart>(() => loadChart() ?? createInitialChart())
  const [selectedGuestId, setSelectedGuestId] = useState<string | null>(null)
  const [tableShape, setTableShape] = useState<TableShape>('round')
  const [tableCapacity, setTableCapacity] = useState(8)
  const [notice, setNotice] = useState('')
  const importInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    saveChart(chart)
  }, [chart])

  const selectedGuest = chart.guests.find((guest) => guest.id === selectedGuestId)
  const seatedCount = chart.guests.filter((guest) => guest.tableId !== null).length
  const seatCount = chart.tables.reduce((total, table) => total + table.capacity, 0)

  const showNotice = (message: string) => {
    setNotice(message)
    window.setTimeout(() => setNotice(''), 2800)
  }

  const addNames = (names: string[]) => {
    const existingNames = new Set(chart.guests.map((guest) => guest.name.trim().toLocaleLowerCase()))
    const seenNames = new Set<string>()
    const newNames = names
      .map((name) => name.trim())
      .filter((name) => {
        const key = name.toLocaleLowerCase()
        if (!name || existingNames.has(key) || seenNames.has(key)) return false
        seenNames.add(key)
        return true
      })

    if (newNames.length > 0) {
      setChart((current) => ({
        ...current,
        guests: [
          ...current.guests,
          ...newNames.map((name) => ({ id: crypto.randomUUID(), name, tableId: null, seatIndex: null })),
        ],
      }))
    }
    return newNames.length
  }

  const assignGuest = (guestId: string, tableId: string, seatIndex: number) => {
    const targetTable = chart.tables.find((table) => table.id === tableId)
    if (!targetTable || seatIndex >= targetTable.capacity) return

    const occupant = chart.guests.find(
      (guest) => guest.tableId === tableId && guest.seatIndex === seatIndex,
    )
    if (occupant && occupant.id !== guestId) {
      showNotice('That seat is already occupied.')
      return
    }

    const guest = chart.guests.find((entry) => entry.id === guestId)
    setChart((current) => ({
      ...current,
      guests: current.guests.map((entry) =>
        entry.id === guestId ? { ...entry, tableId, seatIndex } : entry,
      ),
    }))
    setSelectedGuestId(null)
    if (guest) showNotice(`${guest.name} seated at ${targetTable.name}.`)
  }

  const handleSeatClick = (tableId: string, seatIndex: number) => {
    const occupant = chart.guests.find(
      (guest) => guest.tableId === tableId && guest.seatIndex === seatIndex,
    )
    if (!selectedGuestId) {
      if (occupant) setSelectedGuestId(occupant.id)
      else showNotice('Select a guest to fill this seat.')
      return
    }
    if (occupant?.id === selectedGuestId) {
      setSelectedGuestId(null)
      return
    }
    assignGuest(selectedGuestId, tableId, seatIndex)
  }

  const updateTable = (tableId: string, patch: Partial<SeatingTable>) => {
    setChart((current) => ({
      ...current,
      tables: current.tables.map((table) =>
        table.id === tableId ? { ...table, ...patch } : table,
      ),
    }))
  }

  const changeCapacity = (tableId: string, capacity: number) => {
    const nextCapacity = Math.min(MAX_SEATS, Math.max(MIN_SEATS, capacity))
    setChart((current) => ({
      ...current,
      tables: current.tables.map((table) =>
        table.id === tableId ? { ...table, capacity: nextCapacity } : table,
      ),
      guests: current.guests.map((guest) =>
        guest.tableId === tableId && (guest.seatIndex ?? 0) >= nextCapacity
          ? { ...guest, tableId: null, seatIndex: null }
          : guest,
      ),
    }))
  }

  const deleteTable = (tableId: string) => {
    const tableName = chart.tables.find((table) => table.id === tableId)?.name ?? 'Table'
    setChart((current) => ({
      ...current,
      tables: current.tables.filter((table) => table.id !== tableId),
      guests: current.guests.map((guest) =>
        guest.tableId === tableId ? { ...guest, tableId: null, seatIndex: null } : guest,
      ),
    }))
    showNotice(`${tableName} removed. Its guests are back in the list.`)
  }

  const unseatGuest = (guestId: string) => {
    setChart((current) => ({
      ...current,
      guests: current.guests.map((guest) =>
        guest.id === guestId ? { ...guest, tableId: null, seatIndex: null } : guest,
      ),
    }))
    setSelectedGuestId(null)
  }

  const renameGuest = (guestId: string, name: string) => {
    const normalizedName = name.trim()
    if (!normalizedName) return
    setChart((current) => ({
      ...current,
      guests: current.guests.map((guest) => guest.id === guestId ? { ...guest, name: normalizedName } : guest),
    }))
  }

  const removeGuest = (guestId: string) => {
    setChart((current) => ({
      ...current,
      guests: current.guests.filter((guest) => guest.id !== guestId),
    }))
    setSelectedGuestId((current) => current === guestId ? null : current)
  }

  const createNewTable = () => {
    setChart((current) => ({
      ...current,
      tables: [...current.tables, createTable(current.tables, tableShape, tableCapacity)],
    }))
  }

  const exportChart = () => {
    const file = new Blob([JSON.stringify(chart, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(file)
    const link = document.createElement('a')
    link.href = url
    link.download = `${chart.title.trim().replace(/[^a-z0-9]+/gi, '-').toLowerCase() || 'seating-chart'}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  const importChart = async (file?: File) => {
    if (!file) return
    try {
      const parsed: unknown = JSON.parse(await file.text())
      if (!isSeatingChart(parsed)) throw new Error('This file is not a valid seating chart.')
      setChart(parsed)
      setSelectedGuestId(null)
      showNotice('Chart imported.')
    } catch (error) {
      showNotice(error instanceof Error ? error.message : 'Unable to import this chart.')
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#main" aria-label="Seatwell home">
          <span className="brand-mark"><LayoutGrid size={19} strokeWidth={2.1} /></span>
          <span>seatwell</span>
        </a>
        <div className="topbar-actions">
          <span className="save-indicator"><Check size={15} /> Auto-save on</span>
          <span className="topbar-divider" />
          <button className="quiet-button" type="button" aria-label="Print seating chart" onClick={() => window.print()}>
            <Printer size={16} /> <span>Print</span>
          </button>
          <button className="quiet-button" type="button" aria-label="Export seating chart" onClick={exportChart}>
            <Download size={16} /> <span>Export</span>
          </button>
          <input
            ref={importInputRef}
            className="visually-hidden"
            type="file"
            accept="application/json,.json"
            onChange={(event) => {
              const file = event.currentTarget.files?.[0]
              event.currentTarget.value = ''
              void importChart(file)
            }}
          />
          <button className="quiet-button" type="button" aria-label="Import seating chart" onClick={() => importInputRef.current?.click()}>
            <Upload size={16} /> <span>Import</span>
          </button>
        </div>
      </header>

      <div className="workspace">
        <GuestSidebar
          guests={chart.guests}
          tables={chart.tables}
          selectedGuestId={selectedGuestId}
          onAddNames={addNames}
          onSelectGuest={(guestId) => setSelectedGuestId((current) => current === guestId ? null : guestId)}
          onUnseatGuest={unseatGuest}
          onRenameGuest={renameGuest}
          onRemoveGuest={removeGuest}
        />

        <main className="main-panel" id="main">
          <div className="page-heading">
            <div>
              <p className="eyebrow">EVENT LAYOUT</p>
              <input
                className="event-title"
                aria-label="Event name"
                value={chart.title}
                onChange={(event) => setChart((current) => ({ ...current, title: event.target.value }))}
                onFocus={(event) => event.currentTarget.select()}
              />
            </div>
            <div className="chart-summary" aria-label="Chart summary">
              <span><UsersRound size={16} /> {chart.guests.length} guests</span>
              <span><Armchair size={16} /> {seatedCount} / {seatCount} seats</span>
              <span className={chart.guests.length > seatedCount ? 'summary-pending' : ''}>
                {chart.guests.length - seatedCount} unseated
              </span>
            </div>
          </div>

          <section className="canvas-panel" aria-label="Seating chart editor">
            <div className="canvas-toolbar">
              <div className="canvas-label">
                <span className="canvas-kicker">FLOOR PLAN</span>
                <span className="canvas-count">{chart.tables.length} {chart.tables.length === 1 ? 'table' : 'tables'}</span>
              </div>
              {selectedGuest && (
                <div className="selected-guest-pill">
                  <span className="selection-dot" />
                  <span>Placing <strong>{selectedGuest.name}</strong></span>
                  <button type="button" aria-label="Cancel guest placement" onClick={() => setSelectedGuestId(null)}><X size={14} /></button>
                </div>
              )}
            </div>

            <div className="table-builder" aria-label="Add a table">
              <div className="shape-picker" role="group" aria-label="Table shape">
                {shapeOptions.map(({ shape, label, Icon }) => (
                  <button
                    className={`shape-option ${tableShape === shape ? 'is-active' : ''}`}
                    key={shape}
                    type="button"
                    aria-pressed={tableShape === shape}
                    onClick={() => setTableShape(shape)}
                  >
                    <Icon size={17} strokeWidth={1.8} /> <span>{label}</span>
                  </button>
                ))}
              </div>
              <div className="capacity-picker">
                <span className="capacity-label">Seats</span>
                <button type="button" aria-label="Remove one seat" disabled={tableCapacity <= MIN_SEATS} onClick={() => setTableCapacity((value) => Math.max(MIN_SEATS, value - 1))}>−</button>
                <output aria-live="polite">{tableCapacity}</output>
                <button type="button" aria-label="Add one seat" disabled={tableCapacity >= MAX_SEATS} onClick={() => setTableCapacity((value) => Math.min(MAX_SEATS, value + 1))}>+</button>
              </div>
              <button className="add-table-button" type="button" onClick={createNewTable}>
                <Plus size={17} /> Add table
              </button>
            </div>

            <div className="table-canvas">
              {chart.tables.length > 0 ? (
                <div className="table-grid">
                  {chart.tables.map((table, index) => (
                    <TableCard
                      key={table.id}
                      table={table}
                      tableNumber={index + 1}
                      guests={chart.guests}
                      selectedGuestId={selectedGuestId}
                      onSeatClick={handleSeatClick}
                      onDropGuest={assignGuest}
                      onShapeChange={(shape) => updateTable(table.id, { shape })}
                      onCapacityChange={(capacity) => changeCapacity(table.id, capacity)}
                      onNameChange={(name) => updateTable(table.id, { name })}
                      onDelete={() => deleteTable(table.id)}
                    />
                  ))}
                </div>
              ) : (
                <div className="empty-canvas">
                  <span className="empty-icon"><Armchair size={24} /></span>
                  <h2>Your floor plan starts here</h2>
                  <p>Add a table to begin arranging your room.</p>
                </div>
              )}
            </div>
            <div className="canvas-footer">
              <span><span className="legend-seat" /> Open seat</span>
              <span><span className="legend-seat legend-seat-filled" /> Guest seated</span>
              <span className="canvas-footer-note">Changes save automatically</span>
            </div>
          </section>
        </main>
      </div>

      {notice && <div className="toast" role="status" aria-live="polite">{notice}</div>}
    </div>
  )
}

export default App
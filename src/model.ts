import type { SeatPosition, SeatingChart, SeatingTable, TableShape } from './types'

export const MIN_SEATS = 4
export const MAX_SEATS = 20

export function createInitialChart(): SeatingChart {
  return {
    title: 'Untitled reception',
    guests: [],
    tables: [
      { id: crypto.randomUUID(), name: 'Table 1', shape: 'round', capacity: 8 },
      { id: crypto.randomUUID(), name: 'Table 2', shape: 'rectangle', capacity: 10 },
    ],
  }
}

export function createTable(tables: SeatingTable[], shape: TableShape, capacity: number): SeatingTable {
  const existingNames = new Set(tables.map((table) => table.name))
  let tableNumber = 1
  while (existingNames.has(`Table ${tableNumber}`)) tableNumber += 1

  return {
    id: crypto.randomUUID(),
    name: `Table ${tableNumber}`,
    shape,
    capacity,
  }
}

export function getSeatPosition(shape: TableShape, seatIndex: number, capacity: number): SeatPosition {
  if (shape === 'round') {
    const angle = (Math.PI * 2 * seatIndex) / capacity - Math.PI / 2
    return {
      left: `${50 + Math.cos(angle) * 41}%`,
      top: `${50 + Math.sin(angle) * 38}%`,
    }
  }

  const width = shape === 'square' ? 66 : 78
  const height = shape === 'square' ? 58 : 44
  const perimeter = 2 * (width + height)
  let distance = (perimeter * seatIndex) / capacity
  let x = -width / 2
  let y = -height / 2

  if (distance <= width) {
    x += distance
  } else if ((distance -= width) <= height) {
    x = width / 2
    y += distance
  } else if ((distance -= height) <= width) {
    x = width / 2 - distance
    y = height / 2
  } else {
    distance -= width
    x = -width / 2
    y = height / 2 - distance
  }

  return { left: `${50 + x}%`, top: `${50 + y}%` }
}
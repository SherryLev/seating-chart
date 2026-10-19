import type { SeatingChart, TableShape } from './types'

const STORAGE_KEY = 'seatwell-chart-v1'
const validShapes: TableShape[] = ['round', 'square', 'rectangle']

export function isSeatingChart(value: unknown): value is SeatingChart {
  if (!value || typeof value !== 'object') return false
  const chart = value as Partial<SeatingChart>
  if (typeof chart.title !== 'string' || !Array.isArray(chart.guests) || !Array.isArray(chart.tables)) {
    return false
  }

  const tableIds = new Set<string>()
  for (const table of chart.tables) {
    if (
      !table || typeof table.id !== 'string' || typeof table.name !== 'string' ||
      !validShapes.includes(table.shape) || !Number.isInteger(table.capacity) ||
      table.capacity < 1 || table.capacity > 40 || tableIds.has(table.id)
    ) return false
    tableIds.add(table.id)
  }

  const occupiedSeats = new Set<string>()
  const guestIds = new Set<string>()
  for (const guest of chart.guests) {
    if (
      !guest || typeof guest.id !== 'string' || typeof guest.name !== 'string' ||
      guestIds.has(guest.id) ||
      (guest.tableId !== null && typeof guest.tableId !== 'string') ||
      (guest.seatIndex !== null && !Number.isInteger(guest.seatIndex))
    ) return false
    guestIds.add(guest.id)

    if (guest.tableId === null) {
      if (guest.seatIndex !== null) return false
      continue
    }
    const table = chart.tables.find((entry) => entry.id === guest.tableId)
    if (!table || guest.seatIndex === null || guest.seatIndex < 0 || guest.seatIndex >= table.capacity) {
      return false
    }
    const seatKey = `${guest.tableId}:${guest.seatIndex}`
    if (occupiedSeats.has(seatKey)) return false
    occupiedSeats.add(seatKey)
  }

  return true
}

export function loadChart(): SeatingChart | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return null
    const parsed: unknown = JSON.parse(saved)
    return isSeatingChart(parsed) ? parsed : null
  } catch {
    return null
  }
}

export function saveChart(chart: SeatingChart): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(chart))
    return true
  } catch {
    return false
  }
}
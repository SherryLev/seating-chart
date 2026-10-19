export type TableShape = 'round' | 'square' | 'rectangle'

export interface Guest {
  id: string
  name: string
  tableId: string | null
  seatIndex: number | null
}

export interface SeatingTable {
  id: string
  name: string
  shape: TableShape
  capacity: number
}

export interface SeatingChart {
  title: string
  guests: Guest[]
  tables: SeatingTable[]
}

export interface SeatPosition {
  left: string
  top: string
}
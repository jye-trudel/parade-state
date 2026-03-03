export type FourD = string

export type Roster = {
  platoon: 1
  fourDs: FourD[]
}

export type RosterImportResult = {
  roster: Roster
  warnings: string[]
}

export type StatusCategory = 'MC' | 'LD' | 'EX' | 'RS' | 'OUT_OF_CAMP' | 'EX_STAY_IN' | 'OTHER'

export type StatusEntry = {
  id: string
  fourD: FourD
  category: StatusCategory
  startDate: string // ISO YYYY-MM-DD
  durationDays: number // inclusive of start date
  notes?: string
  archivedAt?: string // ISO YYYY-MM-DD
  createdAt: string // ISO YYYY-MM-DD
  updatedAt: string // ISO YYYY-MM-DD
}

export type Settings = {
  platoonLabel: string // e.g. "Platoon 1"
  outOfCampCategories: Array<'MC' | 'OUT_OF_CAMP'>
}



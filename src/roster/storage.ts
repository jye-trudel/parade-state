import type { Roster } from '../types'
import { normalizeFourD, sortFourDs } from './roster'

const ROSTER_STORAGE_KEY = 'ps.roster.v1'

export function loadRoster(): Roster | null {
  try {
    const raw = localStorage.getItem(ROSTER_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object') return null

    const platoon = (parsed as { platoon?: unknown }).platoon
    const fourDs = (parsed as { fourDs?: unknown }).fourDs
    if (platoon !== 1) return null
    if (!Array.isArray(fourDs)) return null

    const normalized = fourDs.map(normalizeFourD).filter((x): x is string => x !== null)
    if (normalized.length === 0) return null

    return { platoon: 1, fourDs: sortFourDs(Array.from(new Set(normalized))) }
  } catch {
    return null
  }
}

export function saveRoster(roster: Roster): void {
  localStorage.setItem(ROSTER_STORAGE_KEY, JSON.stringify(roster))
}

export function clearRoster(): void {
  localStorage.removeItem(ROSTER_STORAGE_KEY)
}


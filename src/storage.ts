import { endDateIso, todayIso } from './date'
import { normalizeFourD } from './roster/roster'
import type { Settings, StatusCategory, StatusEntry } from './types'
import { supabase } from './supabase'

const ENTRIES_KEY = 'ps.entries.v1'
const SETTINGS_KEY = 'ps.settings.v1'

const VALID_CATEGORIES: ReadonlySet<StatusCategory> = new Set([
  'MC',
  'LD',
  'EX',
  'RS',
  'OUT_OF_CAMP',
  'EX_STAY_IN',
  'OTHER',
])

function safeJsonParse(raw: string): unknown {
  try {
    return JSON.parse(raw) as unknown
  } catch {
    return null
  }
}

export function defaultSettings(): Settings {
  return {
    platoonLabel: 'Platoon 1',
    outOfCampCategories: ['MC', 'OUT_OF_CAMP'],
  }
}

export function loadSettings(): Settings {
  const raw = localStorage.getItem(SETTINGS_KEY)
  if (!raw) return defaultSettings()

  const parsed = safeJsonParse(raw)
  if (!parsed || typeof parsed !== 'object') return defaultSettings()

  const platoonLabel = (parsed as { platoonLabel?: unknown }).platoonLabel
  const outOfCampCategories = (parsed as { outOfCampCategories?: unknown }).outOfCampCategories

  const base = defaultSettings()
  const label = typeof platoonLabel === 'string' && platoonLabel.trim() ? platoonLabel.trim() : base.platoonLabel

  const isOutOfCampCategory = (x: unknown): x is Settings['outOfCampCategories'][number] =>
    x === 'MC' || x === 'OUT_OF_CAMP'

  const categories: Settings['outOfCampCategories'] = Array.isArray(outOfCampCategories)
    ? (outOfCampCategories.filter(isOutOfCampCategory).slice(0, 2) as Settings['outOfCampCategories'])
    : base.outOfCampCategories

  return { platoonLabel: label, outOfCampCategories: categories.length ? categories : base.outOfCampCategories }
}

export function saveSettings(settings: Settings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
}

function normalizeEntry(raw: unknown, today: string): StatusEntry | null {
  if (!raw || typeof raw !== 'object') return null

  const id = (raw as { id?: unknown }).id
  const fourD = normalizeFourD((raw as { fourD?: unknown }).fourD)
  const category = (raw as { category?: unknown }).category
  const startDate = (raw as { startDate?: unknown }).startDate
  const durationDays = (raw as { durationDays?: unknown }).durationDays
  const notes = (raw as { notes?: unknown }).notes
  const archivedAt = (raw as { archivedAt?: unknown }).archivedAt
  const createdAt = (raw as { createdAt?: unknown }).createdAt
  const updatedAt = (raw as { updatedAt?: unknown }).updatedAt

  if (typeof id !== 'string' || !id) return null
  if (!fourD) return null
  if (typeof category !== 'string' || !VALID_CATEGORIES.has(category as StatusCategory)) return null
  if (typeof startDate !== 'string') return null

  const duration = typeof durationDays === 'number' ? durationDays : Number(durationDays)
  if (!Number.isFinite(duration) || duration < 1) return null

  const normalized: StatusEntry = {
    id,
    fourD,
    category: category as StatusCategory,
    startDate,
    durationDays: Math.trunc(duration),
    notes: typeof notes === 'string' && notes.trim() ? notes.trim() : undefined,
    archivedAt: typeof archivedAt === 'string' && archivedAt ? archivedAt : undefined,
    createdAt: typeof createdAt === 'string' && createdAt ? createdAt : today,
    updatedAt: typeof updatedAt === 'string' && updatedAt ? updatedAt : today,
  }

  const endIso = endDateIso(normalized.startDate, normalized.durationDays)
  if (!endIso) return null

  if (today > endIso) {
    normalized.archivedAt = normalized.archivedAt ?? today
  } else {
    normalized.archivedAt = undefined
  }

  return normalized
}

// -----------------------------------------------------------------------------
// client-side helpers (unchanged)
// -----------------------------------------------------------------------------

export function loadLocalEntries(): StatusEntry[] {
  const today = todayIso()
  const raw = localStorage.getItem(ENTRIES_KEY)
  if (!raw) return []

  const parsed = safeJsonParse(raw)
  if (!Array.isArray(parsed)) return []

  const normalized = parsed.map((x) => normalizeEntry(x, today)).filter((x): x is StatusEntry => x !== null)
  return normalized
}

export function saveLocalEntries(entries: StatusEntry[]): void {
  localStorage.setItem(ENTRIES_KEY, JSON.stringify(entries))
}

// -----------------------------------------------------------------------------
// supabase-backed API
// -----------------------------------------------------------------------------

// helper used by both local and remote fetch paths
async function normalizeRows(rows: any[]): Promise<StatusEntry[]> {
  const today = todayIso()
  return rows
    .map((r) => normalizeEntry(r, today))
    .filter((x): x is StatusEntry => x !== null)
}

function hasSupabase(): boolean {
  // empty string/undefined if env not provided
  return Boolean(process.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL)
}

export async function fetchEntries(): Promise<StatusEntry[]> {
  if (!hasSupabase()) {
    return loadLocalEntries()
  }

  const { data, error } = await supabase.from<StatusEntry>('entries').select('*')
  if (error) {
    console.error('fetchEntries:', error.message)
    return []
  }
  return normalizeRows(data ?? [])
}

export async function upsertEntry(entry: StatusEntry): Promise<void> {
  if (!hasSupabase()) {
    const cur = loadLocalEntries()
    const without = cur.filter((e) => e.id !== entry.id)
    saveLocalEntries(refreshEntryArchives([...without, entry]).entries)
    return
  }

  const { error } = await supabase.from('entries').upsert(entry)
  if (error) console.error('upsertEntry:', error.message)
}

export async function deleteEntry(id: string): Promise<void> {
  if (!hasSupabase()) {
    const cur = loadLocalEntries()
    const next = cur.filter((e) => e.id !== id)
    saveLocalEntries(next)
    return
  }

  const { error } = await supabase.from('entries').delete().eq('id', id)
  if (error) console.error('deleteEntry:', error.message)
}

export function subscribeEntries(
  callback: (entries: StatusEntry[]) => void
): () => void {
  if (!hasSupabase()) {
    // no realtime for local data; nothing to unsubscribe
    return () => {}
  }

  const subscription = supabase
    .from('entries')
    .on('*', async () => {
      const e = await fetchEntries()
      callback(e)
    })
    .subscribe()

  return () => {
    supabase.removeSubscription(subscription)
  }
}

export function isEntryActive(entry: StatusEntry, atIso: string = todayIso()): boolean {
  const endIso = endDateIso(entry.startDate, entry.durationDays)
  if (!endIso) return false
  return atIso <= endIso
}

export function refreshEntryArchives(entries: StatusEntry[], atIso: string = todayIso()): {
  entries: StatusEntry[]
  changed: boolean
} {
  let changed = false
  const next = entries.map((e) => {
    const endIso = endDateIso(e.startDate, e.durationDays)
    if (!endIso) return e

    const shouldArchive = atIso > endIso
    const archivedAt = shouldArchive ? e.archivedAt ?? atIso : undefined
    if (archivedAt !== e.archivedAt) {
      changed = true
      return { ...e, archivedAt }
    }
    return e
  })
  return { entries: next, changed }
}

export function newId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `id_${Math.random().toString(16).slice(2)}_${Date.now()}`
}


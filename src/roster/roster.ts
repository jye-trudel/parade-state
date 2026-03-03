import type { FourD } from '../types'

function toStr(raw: unknown): string {
  if (raw === null || raw === undefined) return ''
  if (typeof raw === 'string') return raw
  if (typeof raw === 'number' && Number.isFinite(raw)) return String(Math.trunc(raw))
  return String(raw)
}

export function normalizeFourD(raw: unknown): FourD | null {
  const rawStr = toStr(raw).trim()
  const compact = rawStr.replace(/\s+/g, '')
  const s = /^[A-Za-z]\d{4}$/.test(compact) ? compact.slice(1) : compact
  if (!/^\d{4}$/.test(s)) return null

  const platoon = Number(s.slice(0, 1))
  const section = Number(s.slice(1, 2))
  const bed = Number(s.slice(2, 4))

  if (platoon !== 1) return null
  if (section < 1 || section > 4) return null
  if (bed < 1 || bed > 16) return null

  return s as FourD
}

export function fourDFromParts(rawPlatoon: unknown, rawSection: unknown, rawBed: unknown): FourD | null {
  const platoon = Number(toStr(rawPlatoon).trim())
  const section = Number(toStr(rawSection).trim())
  const bed = Number(toStr(rawBed).trim())

  if (!Number.isInteger(platoon) || !Number.isInteger(section) || !Number.isInteger(bed)) return null
  if (platoon !== 1) return null
  if (section < 1 || section > 4) return null
  if (bed < 1 || bed > 16) return null

  const fourD = `${platoon}${section}${String(bed).padStart(2, '0')}`
  return normalizeFourD(fourD)
}

export function sortFourDs(fourDs: FourD[]): FourD[] {
  return [...fourDs].sort((a, b) => {
    const aSection = Number(a.slice(1, 2))
    const bSection = Number(b.slice(1, 2))
    if (aSection !== bSection) return aSection - bSection
    const aBed = Number(a.slice(2, 4))
    const bBed = Number(b.slice(2, 4))
    return aBed - bBed
  })
}


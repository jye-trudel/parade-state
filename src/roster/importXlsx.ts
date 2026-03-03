import type { RosterImportResult } from '../types'
import { fourDFromParts, normalizeFourD, sortFourDs } from './roster'

function normalizeHeader(h: string): string {
  return h
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[^a-z0-9]/g, '')
}

function pickColumn(headers: string[], candidates: string[]): string | null {
  const normalized = new Map<string, string>()
  for (const h of headers) normalized.set(normalizeHeader(h), h)
  for (const c of candidates) {
    const hit = normalized.get(normalizeHeader(c))
    if (hit) return hit
  }
  return null
}

export async function importRosterFromXlsx(file: File): Promise<RosterImportResult> {
  const warnings: string[] = []

  const XLSX = await import('xlsx')
  const buf = await file.arrayBuffer()
  const workbook = XLSX.read(buf, { type: 'array' })
  const firstSheetName = workbook.SheetNames[0]
  if (!firstSheetName) {
    return { roster: { platoon: 1, fourDs: [] }, warnings: ['No worksheets found in the XLSX file.'] }
  }

  const sheet = workbook.Sheets[firstSheetName]
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: null })
  if (rows.length === 0) {
    return { roster: { platoon: 1, fourDs: [] }, warnings: ['The first worksheet is empty.'] }
  }

  const headers = Array.from(
    rows.reduce((acc, r) => {
      for (const k of Object.keys(r)) acc.add(k)
      return acc
    }, new Set<string>()),
  )

  const fourDCol = pickColumn(headers, ['4d', 'fourD', 'fourd', '4dno', '4dnumber', '4dnum'])
  const nameCol = pickColumn(headers, ['fullname', 'full name', 'name', 'recruitname', 'recruit name'])
  const platoonCol = pickColumn(headers, ['platoon', 'plt', 'platoonno', 'platoonnum'])
  const sectionCol = pickColumn(headers, ['section', 'sec', 'sectionno', 'sectionnum'])
  const bedCol = pickColumn(headers, ['bed', 'bunk', 'bedno', 'bednum'])

  const found: string[] = []
  let skipped = 0

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i] ?? {}

    if (nameCol) {
      const nameVal = r[nameCol]
      const name = typeof nameVal === 'string' ? nameVal.trim() : ''
      if (!name) {
        skipped++
        continue
      }
    }

    const maybeFourD = fourDCol ? normalizeFourD(r[fourDCol]) : null
    if (maybeFourD) {
      found.push(maybeFourD)
      continue
    }

    if (platoonCol && sectionCol && bedCol) {
      const fromParts = fourDFromParts(r[platoonCol], r[sectionCol], r[bedCol])
      if (fromParts) {
        found.push(fromParts)
        continue
      }
    }

    skipped++
    // Excel row numbers are 1-based and include a header row. This is only informational.
    if (skipped <= 5) warnings.push(`Skipped row ${i + 2}: could not read a valid Platoon 1 4D.`)
  }

  const unique = Array.from(new Set(found))
  const sorted = sortFourDs(unique)

  if (sorted.length === 0) {
    warnings.unshift(
      `No valid Platoon 1 4D numbers found. Add a column named "4D" (preferred) or columns "Platoon", "Section", "Bed".`,
    )
  } else if (skipped > 0) {
    warnings.unshift(`Imported ${sorted.length} 4D numbers. Skipped ${skipped} rows.`)
  } else {
    warnings.unshift(`Imported ${sorted.length} 4D numbers.`)
  }

  return {
    roster: { platoon: 1, fourDs: sorted },
    warnings,
  }
}


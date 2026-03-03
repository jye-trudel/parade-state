import { addDays, format, isValid, parseISO } from 'date-fns'

export function todayIso(): string {
  return format(new Date(), 'yyyy-MM-dd')
}

export function toDate(iso: string): Date | null {
  const d = parseISO(iso)
  return isValid(d) ? d : null
}

export function endDateIso(startDateIso: string, durationDays: number): string | null {
  const start = toDate(startDateIso)
  if (!start) return null
  if (!Number.isFinite(durationDays) || durationDays < 1) return null
  const end = addDays(start, Math.trunc(durationDays) - 1)
  return format(end, 'yyyy-MM-dd')
}

export function formatDdMmYy(iso: string): string {
  const d = toDate(iso)
  if (!d) return '????????'
  return format(d, 'ddMMyy')
}

export function formatRangeDdMmYy(startIso: string, durationDays: number): string {
  const endIso = endDateIso(startIso, durationDays)
  if (!endIso) return `${formatDdMmYy(startIso)}-${'????????'}`
  return `${formatDdMmYy(startIso)}-${formatDdMmYy(endIso)}`
}


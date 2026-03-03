// This file contains logic for building the Telegram message text from the roster and status entries.



/* 
IMPORTANt####### FILE HAS BEEN DEPRECATED AND IS NO LONGER USED IN THE APP.
WIP CLOSED on 03-03-2026, any questions you can email me
*/

import { formatRangeDdMmYy, todayIso } from './date'
import { isEntryActive } from './storage'
import type { Roster, Settings, StatusEntry, StatusCategory } from './types'

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

function byFourD(a: StatusEntry, b: StatusEntry): number {
  return a.fourD.localeCompare(b.fourD)
}

function labelForEntry(entry: StatusEntry): string {
  const notes = entry.notes?.trim()
  if (!notes) return entry.category
  if (entry.category === 'OTHER') return `OTHERS ${notes}`
  return `${entry.category} ${notes}`
}

function lineForEntry(entry: StatusEntry): string {

  if (entry.category === 'RS') {
    const notes = entry.notes?.trim()
    
    if (notes) {
      return `${entry.fourD} - ${notes}`
    }
    return `${entry.fourD} -`
  }

  const label = labelForEntry(entry)
  const range = formatRangeDdMmYy(entry.startDate, entry.durationDays)
  return `${entry.fourD} - ${entry.durationDays}D ${label} (${range})`
}

export function buildTelegramMessage(input: {
  roster: Roster
  entries: StatusEntry[]
  settings: Settings
}): string {
  const { roster, entries, settings } = input

  const atIso = todayIso()
  const active = entries.filter((e) => isEntryActive(e, atIso))

  const grouped: Record<StatusCategory, StatusEntry[]> = {
    MC: [],
    LD: [],
    EX: [],
    RS: [],
    OUT_OF_CAMP: [],
    EX_STAY_IN: [],
    OTHER: [],
  }
  for (const e of active) grouped[e.category].push(e)
  for (const k of Object.keys(grouped) as StatusCategory[]) grouped[k].sort(byFourD)

  const totalStrength = roster.fourDs.length
  const outOfCampCount = active.filter((e) => {
    if (e.category === 'MC') return settings.outOfCampCategories.includes('MC')
    if (e.category === 'OUT_OF_CAMP') return settings.outOfCampCategories.includes('OUT_OF_CAMP')
    return false
  }).length
  const inCamp = Math.max(0, totalStrength - outOfCampCount)

  // RS (report sick) is not considered part of the standard status tally
  //const statusCount = grouped.LD.length + grouped.EX.length + grouped.OTHER.length

  const statusCount = Object.entries(grouped)
  .filter(([category]) => category !== 'RS' && ['LD', 'EX', 'OTHER'].includes(category))
  .reduce((sum, [, entries]) => sum + entries.length, 0)

  
  const rsCount = grouped.RS.length

  const lines: string[] = []
  lines.push(`${settings.platoonLabel}: ${inCamp}/${totalStrength}`)
  lines.push(`Out of Camp: ${pad2(outOfCampCount)}`)
  lines.push('')

  lines.push(`EX STAY IN: 00/${pad2(grouped.EX_STAY_IN.length)}`)
  for (const e of grouped.EX_STAY_IN) {
    lines.push(`${e.fourD} (${formatRangeDdMmYy(e.startDate, e.durationDays)})`)
  }
  lines.push('')

  lines.push(`MC: ${pad2(grouped.MC.length)}`)
  for (const e of grouped.MC) lines.push(lineForEntry(e))
  lines.push('')
  lines.push('')

  lines.push(`Status: ${pad2(statusCount)}`)
  // show RS separately so it doesn’t inflate the status figure
  lines.push(`RS: ${pad2(rsCount)}`)
  lines.push('')

  lines.push(`LD: ${pad2(grouped.LD.length)}/${pad2(grouped.LD.length)}`)
  for (const e of grouped.LD) lines.push(lineForEntry(e))
  lines.push('')

  lines.push(`EX: ${pad2(grouped.EX.length)}/${pad2(grouped.EX.length)}`)
  for (const e of grouped.EX) lines.push(lineForEntry(e))
  lines.push('')

  lines.push(`RS: ${pad2(grouped.RS.length)}`)
  for (const e of grouped.RS) lines.push(lineForEntry(e))
  lines.push('')

  lines.push(`OTHERS: ${pad2(grouped.OTHER.length)}`)
  for (const e of grouped.OTHER) lines.push(lineForEntry(e))

  return lines.join('\n')
}


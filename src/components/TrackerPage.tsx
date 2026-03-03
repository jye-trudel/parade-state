import { useMemo, useState, useEffect } from 'react'
import { formatRangeDdMmYy, todayIso } from '../date'
import { loadRoster } from '../roster/storage'
import { normalizeFourD } from '../roster/roster'
import {
  isEntryActive,
  newId,
  refreshEntryArchives,
  fetchEntries,
  upsertEntry,
  deleteEntry,
  subscribeEntries,
} from '../storage'
import { buildTelegramMessage } from '../telegram'
import type { Settings, StatusCategory, StatusEntry } from '../types'

type Props = {
  onGoRoster: () => void
  settings: Settings
}

const CATEGORY_OPTIONS: Array<{ value: StatusCategory; label: string }> = [
  { value: 'MC', label: 'MC' },
  { value: 'LD', label: 'LD' },
  { value: 'EX', label: 'EX' },
  { value: 'RS', label: 'RS' },
  { value: 'OUT_OF_CAMP', label: 'Out of Camp' },
  { value: 'EX_STAY_IN', label: 'EX Stay In' },
  { value: 'OTHER', label: 'Other' },
]

function byFourD(a: StatusEntry, b: StatusEntry): number {
  return a.fourD.localeCompare(b.fourD)
}

export function TrackerPage({ onGoRoster, settings }: Props) {
  const roster = useMemo(() => loadRoster(), [])

  const [entries, setEntries] = useState<StatusEntry[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [actionNote, setActionNote] = useState<string>('')

  const rosterFourDs = roster?.fourDs ?? []

  const [fourD, setFourD] = useState<string>('')
  const [category, setCategory] = useState<StatusCategory>('MC')
  const [startDate, setStartDate] = useState<string>(todayIso())
  const [durationDays, setDurationDays] = useState<number>(1)
  const [notes, setNotes] = useState<string>('')
  const [error, setError] = useState<string>('')

  // ensure RS entries don’t accidentally keep old dates
  useEffect(() => {
    if (category === 'RS') {
      setStartDate(todayIso())
      setDurationDays(1)
    }
  }, [category])

  const activeEntries = useMemo(() => entries.filter((e) => isEntryActive(e)), [entries])

  function resetForm() {
    setEditingId(null)
    setFourD('')
    setCategory('MC')
    setStartDate(todayIso())
    setDurationDays(1)
    setNotes('')
    setError('')
  }

  function beginEdit(entry: StatusEntry) {
    setEditingId(entry.id)
    setFourD(entry.fourD)
    setCategory(entry.category)
    setStartDate(entry.startDate)
    setDurationDays(entry.durationDays)
    setNotes(entry.notes ?? '')
    setError('')
  }

  async function remove(id: string) {
    const next = entries.filter((e) => e.id !== id)
    setEntries(next)
    await deleteEntry(id)
    if (editingId === id) resetForm()
  }

  async function upsert() {
    setError('')
    const normalized = normalizeFourD(fourD)
    if (!normalized) {
      setError('4D is invalid. Example: 1410 (or D1410).')
      return
    }
    if (!rosterFourDs.includes(normalized)) {
      setError('4D not found in nominal roll (roster).')
      return
    }
    const dur = Math.trunc(Number(durationDays))
    if (!Number.isFinite(dur) || dur < 1) {
      setError('Duration must be at least 1 day.')
      return
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
      setError('Start date is invalid.')
      return
    }

    const today = todayIso()
    const existing = editingId ? entries.find((e) => e.id === editingId) : undefined
    const nextEntry: StatusEntry =
      existing
        ? {
            ...existing,
          fourD: normalized,
          category,
          startDate,
          durationDays: dur,
          notes: notes.trim() ? notes.trim() : undefined,
          updatedAt: today,
          }
        : {
          id: newId(),
          fourD: normalized,
          category,
          startDate,
          durationDays: dur,
          notes: notes.trim() ? notes.trim() : undefined,
          createdAt: today,
          updatedAt: today,
        }

    const without = existing ? entries.filter((e) => e.id !== existing.id) : entries
    const next = [...without, nextEntry]
    const refreshed = refreshEntryArchives(next).entries

    setEntries(refreshed)
    await upsertEntry(nextEntry)
    resetForm()
  }

  const paradeText = useMemo(() => {
    if (!roster) return ''
    return buildTelegramMessage({ roster, entries, settings })
  }, [entries, roster, settings])

  async function copyToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text)
      setActionNote('Copied to clipboard.')
    } catch {
      setActionNote('Copy failed. Try selecting the text and copying manually.')
    }
  }

  async function shareText(text: string) {
    try {
      if (navigator.share) {
        await navigator.share({ text })
        setActionNote('Share opened.')
        return
      }
      await copyToClipboard(text)
    } catch {
      setActionNote('Share failed. Try Copy instead.')
    }
  }


  // load initial entries & subscribe for realtime updates
  useEffect(() => {
    let mounted = true
    fetchEntries().then((e) => {
      if (mounted) setEntries(e)
    })

    const unsubscribe = subscribeEntries((e) => {
      if (mounted) setEntries(e)
    })

    return () => {
      mounted = false
      unsubscribe()
    }
  }, [])

  if (!roster) {
    return (
      <div className="card">
        <h2>Tracker</h2>
        <p className="muted">Load your Platoon 1 roster first (XLSX nominal roll).</p>
        <div className="row">
          <button type="button" onClick={onGoRoster}>
            Go to roster import
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="grid">
      <section className="card">
        <h2>{editingId ? 'Edit status' : 'Add status'}</h2>
        <div className="form">
          <label className="field">
            <div className="label">4D</div>
            <input
              inputMode="numeric"
              placeholder="e.g. 1410"
              value={fourD}
              onChange={(e) => setFourD(e.target.value)}
              list="rosterFourDs"
              aria-label="4D number"
            />
            <datalist id="rosterFourDs">
              {rosterFourDs.map((x) => (
                <option key={x} value={x} />
              ))}
            </datalist>
          </label>

          <label className="field">
            <div className="label">Status</div>
            <select value={category} onChange={(e) => setCategory(e.target.value as StatusCategory)}>
              {CATEGORY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>

          {category !== 'RS' && (
            <>
              <label className="field">
                <div className="label">Start date</div>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </label>

              <label className="field">
                <div className="label">Duration (days)</div>
                <input
                  inputMode="numeric"
                  type="number"
                  min={1}
                  value={durationDays}
                  onChange={(e) => setDurationDays(Number(e.target.value))}
                />
              </label>
            </>
          )}

          <label className="field full">
            <div className="label">Notes (optional)</div>
            <input
              placeholder='Example: "HL & RMJ" or "FLEGS, STAY IN"'
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </label>
        </div>

        {error ? <div className="error">{error}</div> : null}

        <div className="row">
          <button type="button" onClick={upsert}>
            {editingId ? 'Update' : 'Add'}
          </button>
          <button type="button" className="secondary" onClick={resetForm}>
            Clear
          </button>
        </div>
      </section>

      <section className="card">
        <h2>Today’s parade state</h2>
        <div className="row">
          <button type="button" onClick={() => void copyToClipboard(paradeText)} disabled={!paradeText}>
            Copy message
          </button>
          <button type="button" className="secondary" onClick={() => void shareText(paradeText)} disabled={!paradeText}>
            Share…
          </button>
          {actionNote ? <span className="muted">{actionNote}</span> : null}
        </div>
        <pre className="pre" aria-label="Telegram format preview">
          {paradeText}
        </pre>

        <div className="panel">
          <div className="panelTitle">Active entries</div>
          {activeEntries.length === 0 ? (
            <div className="muted">No active entries.</div>
          ) : (
            <ul className="entries">
              {activeEntries
                .slice()
                .sort((a, b) => (a.category === b.category ? byFourD(a, b) : a.category.localeCompare(b.category)))
                .map((e) => (
                  <li key={e.id} className="entry">
                    <button type="button" className="entryMain" onClick={() => beginEdit(e)}>
                      <div className="entryTop">
                        <span className="mono">{e.fourD}</span>
                        <span className="badge">{e.category}</span>
                        {e.category !== 'RS' ? (
                          <span className="muted">
                            {e.durationDays}D · {formatRangeDdMmYy(e.startDate, e.durationDays)}
                          </span>
                        ) : null}
                      </div>
                      {e.notes ? <div className="muted">{e.notes}</div> : null}
                    </button>
                    <button type="button" className="danger" onClick={() => remove(e.id)}>
                      Delete
                    </button>
                  </li>
                ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  )
}


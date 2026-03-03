import { useMemo, useState } from 'react'
import type { Roster } from '../types'
import { importRosterFromXlsx } from '../roster/importXlsx'
import { clearRoster, loadRoster, saveRoster } from '../roster/storage'

type Props = {
  onDone: () => void
}

export function RosterPage({ onDone }: Props) {
  const existing = useMemo(() => loadRoster(), [])
  const [preview, setPreview] = useState<Roster | null>(existing)
  const [warnings, setWarnings] = useState<string[]>([])
  const [isImporting, setIsImporting] = useState(false)

  async function onPickFile(file: File) {
    setIsImporting(true)
    try {
      const res = await importRosterFromXlsx(file)
      setPreview(res.roster.fourDs.length ? res.roster : null)
      setWarnings(res.warnings)
    } finally {
      setIsImporting(false)
    }
  }

  function onSave() {
    if (!preview) return
    saveRoster(preview)
    onDone()
  }

  function onClear() {
    clearRoster()
    setPreview(null)
    setWarnings([])
  }

  return (
    <div className="card">
      <h2>Platoon 1 nominal roll</h2>
      <p className="muted">
        Upload your Platoon 1 nominal roll (.xlsx). The app will extract the valid 4D numbers and use that as the
        roster/strength baseline.
      </p>

      <div className="row">
        <label className="file">
          <input
            type="file"
            accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) void onPickFile(f)
              e.currentTarget.value = ''
            }}
            disabled={isImporting}
          />
          <span>{isImporting ? 'Importing…' : 'Choose XLSX file'}</span>
        </label>
        <button type="button" className="secondary" onClick={onClear}>
          Clear roster
        </button>
      </div>

      {warnings.length > 0 ? (
        <div className="panel">
          <div className="panelTitle">Import notes</div>
          <ul className="list">
            {warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="panel">
        <div className="panelTitle">Current roster</div>
        {preview ? (
          <>
            <div className="muted">Count: {preview.fourDs.length}</div>
            <div className="chips" aria-label="Roster 4D list">
              {preview.fourDs.map((x) => (
                <span key={x} className="chip">
                  {x}
                </span>
              ))}
            </div>
          </>
        ) : (
          <div className="muted">No roster loaded yet.</div>
        )}
      </div>

      <div className="row">
        <button type="button" onClick={onSave} disabled={!preview}>
          Save & continue
        </button>
      </div>
    </div>
  )
}


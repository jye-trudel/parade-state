import type { Settings } from '../types'

type Props = {
  settings: Settings
  onChange: (next: Settings) => void
}

export function SettingsPage({ settings, onChange }: Props) {
  const outOfCampMc = settings.outOfCampCategories.includes('MC')
  const outOfCampOut = settings.outOfCampCategories.includes('OUT_OF_CAMP')

  return (
    <div className="card">
      <h2>Settings</h2>

      <div className="form">
        <label className="field full">
          <div className="label">Platoon label</div>
          <input
            value={settings.platoonLabel}
            onChange={(e) => onChange({ ...settings, platoonLabel: e.target.value })}
            placeholder="Platoon 1"
          />
        </label>

        <div className="field full">
          <div className="label">Out of Camp count includes</div>
          <div className="checks">
            <label className="check">
              <input
                type="checkbox"
                checked={outOfCampMc}
                onChange={(e) => {
                  const next = e.target.checked
                    ? Array.from(new Set([...settings.outOfCampCategories, 'MC']))
                    : settings.outOfCampCategories.filter((x) => x !== 'MC')
                  onChange({ ...settings, outOfCampCategories: next as Settings['outOfCampCategories'] })
                }}
              />
              <span>MC</span>
            </label>
            <label className="check">
              <input
                type="checkbox"
                checked={outOfCampOut}
                onChange={(e) => {
                  const next = e.target.checked
                    ? Array.from(new Set([...settings.outOfCampCategories, 'OUT_OF_CAMP']))
                    : settings.outOfCampCategories.filter((x) => x !== 'OUT_OF_CAMP')
                  onChange({ ...settings, outOfCampCategories: next as Settings['outOfCampCategories'] })
                }}
              />
              <span>Out of Camp</span>
            </label>
          </div>
          <div className="muted" style={{ marginTop: 6 }}>
            Default matches your sample: Out of Camp = MC count.
          </div>
        </div>
      </div>
    </div>
  )
}


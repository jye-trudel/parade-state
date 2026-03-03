import './App.css'
import { useEffect, useMemo, useState } from 'react'
import { RosterPage } from './components/RosterPage'
import { SettingsPage } from './components/SettingsPage'
import { TrackerPage } from './components/TrackerPage'
import { loadRoster } from './roster/storage'
import { loadSettings, saveSettings } from './storage'

function App() {
  const roster = useMemo(() => loadRoster(), [])
  const [page, setPage] = useState<'tracker' | 'roster' | 'settings'>(roster ? 'tracker' : 'roster')
  const [settings, setSettings] = useState(() => loadSettings())

  useEffect(() => {
    saveSettings(settings)
  }, [settings])

  return (
    <div className="app">
      <header className="topbar">
        <div className="title">Parade state</div>
        <nav className="tabs">
          <button
            type="button"
            className={page === 'tracker' ? 'tab active' : 'tab'}
            onClick={() => setPage('tracker')}
            disabled={!loadRoster()}
            title={!loadRoster() ? 'Load roster first' : undefined}
          >
            Tracker
          </button>
          <button
            type="button"
            className={page === 'roster' ? 'tab active' : 'tab'}
            onClick={() => setPage('roster')}
          >
            Roster
          </button>
          <button
            type="button"
            className={page === 'settings' ? 'tab active' : 'tab'}
            onClick={() => setPage('settings')}
          >
            Settings
          </button>
        </nav>
      </header>

      <main className="container">
        {page === 'roster' ? (
          <RosterPage
            onDone={() => {
              setPage('tracker')
            }}
          />
        ) : page === 'settings' ? (
          <SettingsPage settings={settings} onChange={setSettings} />
        ) : (
          <TrackerPage
            onGoRoster={() => {
              setPage('roster')
            }}
            settings={settings}
          />
        )}
      </main>
    </div>
  )
}

export default App



//ts app is so ugly, can we rewrite in rust?
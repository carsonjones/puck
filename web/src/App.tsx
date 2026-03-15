import { useState } from 'react';
import { viewModes, type ViewMode } from '@shared/appState.js';

const phaseOneChecklist = [
  'Shared state extracted from the TUI store',
  'Dedicated web package scaffolded on Vite + Cloudflare',
  'Worker-backed API surface reserved for browser-safe endpoints',
  'Terminal-inspired shell ready for the first real games view',
];

export default function App() {
  const [activeView, setActiveView] = useState<ViewMode>('games');

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">puck</p>
          <h1>Web Migration</h1>
        </div>
        <p className="status">Phase 1 in progress</p>
      </header>

      <section className="pane-grid">
        <aside className="pane pane-list">
          <div className="pane-header">
            <span>Views</span>
            <span>kbd-ready</span>
          </div>
          <div className="tab-list" role="tablist" aria-label="Primary views">
            {viewModes.map((mode) => (
              <button
                key={mode}
                className={mode === activeView ? 'tab-button active' : 'tab-button'}
                onClick={() => setActiveView(mode)}
                role="tab"
                aria-selected={mode === activeView}
              >
                {mode}
              </button>
            ))}
          </div>
          <div className="list-block">
            <p className="section-label">Next</p>
            <ul className="checklist">
              {phaseOneChecklist.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </aside>

        <section className="pane pane-detail">
          <div className="pane-header">
            <span>{activeView}</span>
            <span>placeholder shell</span>
          </div>
          <div className="detail-body">
            <p>
              This is the initial browser shell. The next step is porting the games split-pane
              using the current shared state and NHL data layer.
            </p>
            <p>
              The visual direction is intentionally terminal-like: dense panes, monospace type,
              hard borders, and strong active selection states.
            </p>
          </div>
        </section>
      </section>

      <footer className="statusbar">
        <span>web scaffold active</span>
        <span>[g] games [s] standings [p] players</span>
      </footer>
    </main>
  );
}

import React, { useState } from 'react';
import { LayoutGrid } from 'lucide-react';
import { productivityApps } from './apps/registry';

export default function App() {
  const [activeAppId, setActiveAppId] = useState(productivityApps[0].id);

  return (
    <div className="workspace-shell">
      <header className="workspace-header">
        <div className="workspace-brand">
          <div className="workspace-brand-mark"><LayoutGrid size={22} /></div>
          <div>
            <p className="workspace-kicker">PERSONAL WORKSPACE</p>
            <h1>Productivity Desk</h1>
          </div>
        </div>
        <p className="workspace-caption">One home for the systems that keep you moving.</p>
      </header>

      <nav className="workspace-nav" aria-label="Productivity applications">
        {productivityApps.map((app) => {
          const Icon = app.icon;
          return (
            <button
              key={app.id}
              className={`workspace-nav-item ${activeAppId === app.id ? 'active' : ''}`}
              onClick={() => setActiveAppId(app.id)}
              type="button"
            >
              <Icon size={18} />
              <span>{app.label}</span>
              <small>{app.shortLabel}</small>
            </button>
          );
        })}
      </nav>

      <main className="workspace-content">
        {productivityApps.map((app) => {
          const AppComponent = app.component;
          return <div className={`workspace-app-frame ${activeAppId === app.id ? 'active' : ''}`} key={app.id}><AppComponent /></div>;
        })}
      </main>
    </div>
  );
}


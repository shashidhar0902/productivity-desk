import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Clock3, FileText, Save } from 'lucide-react';

const START_HOUR = 5;
const END_HOUR = 25;

function dateKey(date) {
  return date.toISOString().slice(0, 10);
}

function createSlots() {
  return Array.from({ length: (END_HOUR - START_HOUR) * 2 }, (_, index) => {
    const totalMinutes = START_HOUR * 60 + index * 30;
    const hour = Math.floor(totalMinutes / 60) % 24;
    const minutes = totalMinutes % 60;
    const nextTotalMinutes = totalMinutes + 30;
    const nextHour = Math.floor(nextTotalMinutes / 60) % 24;
    const nextMinutes = nextTotalMinutes % 60;
    return {
      key: `${String(hour).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`,
      label: `${formatTime(hour, minutes)} - ${formatTime(nextHour, nextMinutes)}`
    };
  });
}

function formatTime(hour, minutes) {
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${String(minutes).padStart(2, '0')} ${period}`;
}

function shiftDate(value, amount) {
  const next = new Date(`${value}T12:00:00`);
  next.setDate(next.getDate() + amount);
  return dateKey(next);
}

function formatDate(value) {
  return new Date(`${value}T12:00:00`).toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });
}

export default function DailyUpdatesApp() {
  const slots = useMemo(createSlots, []);
  const [selectedDate, setSelectedDate] = useState(() => dateKey(new Date()));
  const [entries, setEntries] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [saveState, setSaveState] = useState('saved');

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    fetch(`/api/updates/${selectedDate}`)
      .then((response) => response.ok ? response.json() : Promise.reject(new Error('Could not load updates')))
      .then((data) => { if (!cancelled) setEntries(data.slots || {}); })
      .catch(() => { if (!cancelled) setEntries({}); })
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, [selectedDate]);

  useEffect(() => {
    if (isLoading) return undefined;
    setSaveState('saving');
    const timer = window.setTimeout(() => {
      fetch(`/api/updates/${selectedDate}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slots: entries })
      })
        .then((response) => response.ok ? setSaveState('saved') : Promise.reject(new Error('Save failed')))
        .catch(() => setSaveState('error'));
    }, 500);
    return () => window.clearTimeout(timer);
  }, [entries, isLoading, selectedDate]);

  const filledCount = slots.filter((slot) => entries[slot.key]?.trim()).length;
  const updateEntry = (key, value) => setEntries((current) => ({ ...current, [key]: value }));

  return (
    <div className="daily-updates-workspace">
      <div className="daily-updates-heading">
        <div>
          <p className="app-eyebrow">DAILY LOG / HALF-HOUR RECORD</p>
          <h2>What I Did Today</h2>
          <p className="app-description">A quiet record of where your time actually went.</p>
        </div>
        <div className={`daily-updates-save-status ${saveState}`}><Save size={15} /><span>{saveState === 'saving' ? 'Saving...' : saveState === 'error' ? 'Save error' : 'Autosaved to file'}</span></div>
      </div>

      <div className="daily-updates-date-bar">
        <button type="button" onClick={() => setSelectedDate((current) => shiftDate(current, -1))} aria-label="Previous day"><ChevronLeft size={18} /></button>
        <div><strong>{formatDate(selectedDate)}</strong><span>{filledCount} of {slots.length} slots recorded</span></div>
        <button type="button" onClick={() => setSelectedDate((current) => shiftDate(current, 1))} aria-label="Next day"><ChevronRight size={18} /></button>
        <button type="button" className="daily-updates-today" onClick={() => setSelectedDate(dateKey(new Date()))}>Today</button>
      </div>

      {isLoading ? <div className="daily-updates-loading">Loading this day...</div> : <div className="daily-updates-list">
        {slots.map((slot) => <label className={`daily-updates-slot ${entries[slot.key]?.trim() ? 'filled' : ''}`} key={slot.key}>
          <span className="daily-updates-slot-time"><Clock3 size={15} />{slot.label}</span>
          <textarea value={entries[slot.key] || ''} onChange={(event) => updateEntry(slot.key, event.target.value)} placeholder="What did you spend this time doing?" rows={2} />
        </label>)}
      </div>}

      <div className="daily-updates-footer"><FileText size={15} /> Stored in <strong>data/updates_data.json</strong></div>
    </div>
  );
}
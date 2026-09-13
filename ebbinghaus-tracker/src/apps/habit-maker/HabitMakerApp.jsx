import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Check, Flame, Pencil, Plus, Trash2, X } from 'lucide-react';

const today = () => new Date().toISOString().slice(0, 10);
const dateKey = (year, month, day) => `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

function getStreaks(habit) {
  const logs = habit.logs || {};
  let current = 0;
  const cursor = new Date();
  while (logs[cursor.toISOString().slice(0, 10)] === true) {
    current += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  const successfulDates = Object.keys(logs).filter((key) => logs[key] === true).sort();
  let best = 0;
  let run = 0;
  let previous;
  successfulDates.forEach((key) => {
    const gap = previous ? (new Date(key) - new Date(previous)) / 86400000 : 1;
    run = gap === 1 ? run + 1 : 1;
    best = Math.max(best, run);
    previous = key;
  });

  const now = new Date();
  const monthDays = now.getDate();
  const doneThisMonth = Array.from({ length: monthDays }, (_, index) =>
    logs[dateKey(now.getFullYear(), now.getMonth(), index + 1)] === true
  ).filter(Boolean).length;
  return { current, best, percentage: Math.round((doneThisMonth / monthDays) * 100) };
}

function HabitCalendar({ habit, month, onMonthChange }) {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const firstDay = (new Date(year, monthIndex, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const cells = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  const currentDay = today();

  return (
    <div className="habit-calendar">
      <div className="habit-calendar-nav">
        <button className="habit-icon-button" onClick={() => onMonthChange(-1)} aria-label="Previous month"><span aria-hidden="true">‹</span></button>
        <strong>{month.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</strong>
        <button className="habit-icon-button" onClick={() => onMonthChange(1)} aria-label="Next month"><span aria-hidden="true">›</span></button>
      </div>
      <div className="habit-calendar-grid">
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, index) => <span className="habit-day-label" key={`${day}-${index}`}>{day}</span>)}
        {cells.map((day, index) => {
          if (!day) return <span className="habit-day empty" key={`empty-${index}`} />;
          const key = dateKey(year, monthIndex, day);
          const log = habit.logs?.[key];
          const future = key > currentDay;
          return <span className={`habit-day ${future ? 'future' : log === true ? 'done' : log === false ? 'skipped' : ''} ${key === currentDay ? 'today' : ''}`} key={key}>{day}</span>;
        })}
      </div>
      <div className="habit-legend"><span><i className="done" /> Done</span><span><i className="skipped" /> Skipped</span><span><i /> Not logged</span></div>
    </div>
  );
}

export default function HabitMakerApp() {
  const [habits, setHabits] = useState([]);
  const [selectedHabitId, setSelectedHabitId] = useState('');
  const [month, setMonth] = useState(() => new Date());
  const [name, setName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [notice, setNotice] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState('saved');

  useEffect(() => {
    fetch('/api/habits')
      .then((response) => response.ok ? response.json() : Promise.reject(new Error('Could not load habits')))
      .then((data) => setHabits(data.habits || []))
      .catch(() => setNotice('Could not load habit data from the project file.'))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    if (isLoading) return;
    let cancelled = false;
    setSaveStatus('saving');
    fetch('/api/habits', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ habits })
    })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error('Could not save habits')))
      .then(() => { if (!cancelled) setSaveStatus('saved'); })
      .catch(() => { if (!cancelled) setSaveStatus('error'); });
    return () => { cancelled = true; };
  }, [habits, isLoading]);
  const selectedHabit = habits.find((habit) => habit.id === selectedHabitId);
  const stats = useMemo(() => habits.map((habit) => ({ ...habit, stats: getStreaks(habit) })), [habits]);

  const saveHabit = (event) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setHabits((current) => editingId
      ? current.map((habit) => habit.id === editingId ? { ...habit, name: trimmed } : habit)
      : [...current, { id: `${Date.now()}-${Math.random()}`, name: trimmed, createdAt: today(), logs: {} }]);
    setName(''); setEditingId(null); setShowForm(false); setNotice(editingId ? 'Habit renamed.' : 'Habit added.');
  };

  const logHabit = (id, value) => setHabits((current) => current.map((habit) => {
    if (habit.id !== id) return habit;
    const logs = { ...(habit.logs || {}) };
    logs[today()] = logs[today()] === value ? undefined : value;
    if (logs[today()] === undefined) delete logs[today()];
    return { ...habit, logs };
  }));

  return (
    <div className="habit-workspace">
      <div className="habit-app-heading">
        <div><p className="app-eyebrow">ROUTINES / DAILY PRACTICE</p><h2>Habit Maker</h2><p className="app-description">Build a small rhythm, then let the streaks tell the story.</p></div>
        <div className="habit-actions"><div className={`habit-save-status ${saveStatus}`}><span />{saveStatus === 'saved' ? 'Autosaved to project file' : saveStatus === 'saving' ? 'Saving...' : 'Save error'}</div><button className="habit-button primary" onClick={() => { setEditingId(null); setName(''); setShowForm(true); }}><Plus size={16} /> Add habit</button></div>
      </div>
      {notice && <div className="habit-notice">{notice}<button onClick={() => setNotice('')} aria-label="Dismiss"><X size={15} /></button></div>}
      <div className="habit-layout">
        <section className="habit-panel today-panel"><div className="panel-heading"><div><p className="panel-kicker">TODAY</p><h3>{new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}</h3></div><Flame size={25} /></div>
          {isLoading ? <div className="habit-empty"><p>Loading habits from the project file...</p></div> : habits.length === 0 ? <div className="habit-empty"><CheckSquarePlaceholder /><p>Your first habit starts here.</p><button className="text-action" onClick={() => setShowForm(true)}>Create a habit <span>→</span></button></div> : <div className="habit-list">{habits.map((habit) => { const log = habit.logs?.[today()]; return <div className={`habit-row ${log === true ? 'complete' : log === false ? 'skipped' : ''}`} key={habit.id}><div className="habit-status">{log === true ? <Check size={16} /> : log === false ? '×' : '·'}</div><strong>{habit.name}</strong><div className="habit-row-actions"><button className={`habit-check yes ${log === true ? 'active' : ''}`} onClick={() => logHabit(habit.id, true)}>Yes</button><button className={`habit-check no ${log === false ? 'active' : ''}`} onClick={() => logHabit(habit.id, false)}>No</button></div></div>; })}</div>}
        </section>
        <section className="habit-panel calendar-panel"><div className="panel-heading"><div><p className="panel-kicker">REFLECTION</p><h3>Calendar</h3></div><CalendarDays size={22} /></div><select className="habit-select" value={selectedHabitId} onChange={(event) => setSelectedHabitId(event.target.value)}><option value="">Choose a habit to inspect</option>{habits.map((habit) => <option value={habit.id} key={habit.id}>{habit.name}</option>)}</select>{selectedHabit ? <HabitCalendar habit={selectedHabit} month={month} onMonthChange={(direction) => setMonth(new Date(yearMonth(month, direction)))} /> : <div className="calendar-placeholder">Select a habit to see its month at a glance.</div>}</section>
      </div>
      <section className="habit-panel streak-panel"><div className="panel-heading"><div><p className="panel-kicker">MOMENTUM</p><h3>Streaks & stats</h3></div><Flame size={22} /></div>{stats.length === 0 ? <p className="muted">Add habits to start measuring your rhythm.</p> : <div className="streak-list">{stats.map((habit) => <div className="streak-row" key={habit.id}><strong>{habit.name}</strong><span><b>{habit.stats.current}</b> current</span><span><b>{habit.stats.best}</b> best</span><span><b>{habit.stats.percentage}%</b> this month</span><div className="streak-row-actions"><button onClick={() => { setEditingId(habit.id); setName(habit.name); setShowForm(true); }} aria-label={`Rename ${habit.name}`}><Pencil size={15} /></button><button onClick={() => setHabits((current) => current.filter((item) => item.id !== habit.id))} aria-label={`Delete ${habit.name}`}><Trash2 size={15} /></button></div></div>)}</div>}</section>
      {showForm && <div className="habit-modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setShowForm(false)}><form className="habit-modal" onSubmit={saveHabit}><div className="modal-heading"><h3>{editingId ? 'Rename habit' : 'Add a habit'}</h3><button type="button" onClick={() => setShowForm(false)} aria-label="Close"><X size={18} /></button></div><input autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Drink 2L water" maxLength={60} /><div className="modal-actions"><button type="button" className="habit-button secondary" onClick={() => setShowForm(false)}>Cancel</button><button className="habit-button primary">Save habit</button></div></form></div>}
    </div>
  );
}

function yearMonth(date, direction) { return new Date(date.getFullYear(), date.getMonth() + direction, 1); }
function CheckSquarePlaceholder() { return <div className="habit-empty-icon"><Check size={20} /></div>; }
import { useEffect, useMemo, useState } from 'react';
import { Coffee, FastForward, History, Pause, Play, RotateCcw, Settings, TimerReset } from 'lucide-react';

const DEFAULT_DURATIONS = { focus: 25, shortBreak: 5, longBreak: 15 };
const MODE_LABELS = { focus: 'Focus', shortBreak: 'Short break', longBreak: 'Long break' };

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
}

function dayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export default function PomodoroApp() {
  const [durations, setDurations] = useState(DEFAULT_DURATIONS);
  const [mode, setMode] = useState('focus');
  const [secondsLeft, setSecondsLeft] = useState(DEFAULT_DURATIONS.focus * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [task, setTask] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    fetch('/api/pomodoro')
      .then((response) => response.ok ? response.json() : Promise.reject(new Error('Could not load sessions')))
      .then((data) => setSessions(data.sessions || []))
      .catch(() => setNotice('Could not load Pomodoro history from the project file.'));
  }, []);

  useEffect(() => {
    if (!isRunning) return undefined;
    const timer = window.setInterval(() => {
      setSecondsLeft((current) => {
        if (current > 1) return current - 1;
        completeTimer();
        return 0;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [isRunning, mode]);

  const todaySessions = useMemo(() => sessions.filter((session) => session.date === dayKey()), [sessions]);
  const todayFocusMinutes = todaySessions.reduce((total, session) => total + session.minutes, 0);
  const focusCount = todaySessions.length;

  function setTimerMode(nextMode) {
    setIsRunning(false);
    setMode(nextMode);
    setSecondsLeft(durations[nextMode] * 60);
  }

  function resetTimer() {
    setIsRunning(false);
    setSecondsLeft(durations[mode] * 60);
  }

  async function completeTimer() {
    setIsRunning(false);
    if (mode === 'focus') {
      try {
        const response = await fetch('/api/pomodoro/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ minutes: durations.focus, task: task.trim() })
        });
        if (!response.ok) throw new Error('Could not save session');
        const session = await response.json();
        setSessions((current) => [session, ...current]);
        setNotice('Focus session saved to the project file.');
      } catch {
        setNotice('Session finished, but could not be saved.');
      }
      setTimerMode(focusCount + 1 >= 4 ? 'longBreak' : 'shortBreak');
    } else {
      setTimerMode('focus');
      setNotice(`${MODE_LABELS[mode]} complete. Ready when you are.`);
    }
  }

  function updateDuration(key, value) {
    const nextValue = Math.max(1, Math.min(120, Number(value) || 1));
    setDurations((current) => ({ ...current, [key]: nextValue }));
    if (!isRunning && mode === key) setSecondsLeft(nextValue * 60);
  }

  return (
    <div className="pomodoro-workspace">
      <div className="pomodoro-heading">
        <div><p className="app-eyebrow">FOCUS / RECOVERY / RHYTHM</p><h2>Pomodoro Focus</h2><p className="app-description">Give one meaningful task your full attention, then recover on purpose.</p></div>
        <button className="pomodoro-settings-button" onClick={() => setShowSettings((current) => !current)} aria-label="Open timer settings"><Settings size={18} /></button>
      </div>

      {notice && <div className="pomodoro-notice">{notice}<button onClick={() => setNotice('')} aria-label="Dismiss">×</button></div>}

      <div className="pomodoro-layout">
        <section className="pomodoro-timer-panel">
          <div className="pomodoro-mode-tabs">
            {Object.keys(MODE_LABELS).map((key) => <button key={key} className={mode === key ? 'active' : ''} onClick={() => setTimerMode(key)}>{MODE_LABELS[key]}</button>)}
          </div>
          <div className={`pomodoro-clock ${mode}`}><span>{formatTime(secondsLeft)}</span><small>{isRunning ? 'IN SESSION' : 'READY WHEN YOU ARE'}</small></div>
          <div className="pomodoro-task"><label htmlFor="pomodoro-task">What are you working on?</label><input id="pomodoro-task" value={task} onChange={(event) => setTask(event.target.value)} placeholder="Name the next useful thing" /></div>
          <div className="pomodoro-controls"><button className="pomodoro-primary-button" onClick={() => setIsRunning((current) => !current)}>{isRunning ? <Pause size={17} /> : <Play size={17} />}{isRunning ? 'Pause' : 'Start focus'}</button><button className="pomodoro-secondary-button" onClick={resetTimer}><RotateCcw size={16} /> Reset</button><button className="pomodoro-secondary-button" onClick={() => setTimerMode(mode === 'focus' ? 'shortBreak' : 'focus')}><FastForward size={16} /> Skip</button></div>
          <div className="pomodoro-cycle-note"><TimerReset size={16} /> {focusCount % 4} of 4 focus sessions completed today</div>
        </section>

        <aside className="pomodoro-side-panel">
          {showSettings && <div className="pomodoro-settings"><div className="pomodoro-side-heading"><h3>Timer settings</h3><Settings size={17} /></div>{Object.entries(MODE_LABELS).map(([key, label]) => <label key={key}>{label}<span><input type="number" min="1" max="120" value={durations[key]} onChange={(event) => updateDuration(key, event.target.value)} /> min</span></label>)}</div>}
          <div className="pomodoro-stats"><div className="pomodoro-side-heading"><div><p className="panel-kicker">TODAY</p><h3>Momentum</h3></div><Coffee size={20} /></div><div className="pomodoro-stat-grid"><div><strong>{focusCount}</strong><span>sessions</span></div><div><strong>{todayFocusMinutes}</strong><span>focus minutes</span></div></div></div>
          <div className="pomodoro-history"><div className="pomodoro-side-heading"><div><p className="panel-kicker">RECENT WORK</p><h3>Session history</h3></div><History size={20} /></div>{sessions.length === 0 ? <p className="pomodoro-empty">Complete your first focus session to start a record.</p> : <div className="pomodoro-session-list">{sessions.slice(0, 6).map((session) => <div className="pomodoro-session" key={session.id}><span className="pomodoro-session-dot" /><div><strong>{session.task || 'Focused work'}</strong><small>{session.date} · {session.minutes} min</small></div></div>)}</div>}</div>
        </aside>
      </div>
    </div>
  );
}
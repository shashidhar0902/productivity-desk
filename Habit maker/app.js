/* =============================================
   HABIT TRACKER — app.js
   ============================================= */

// ─── State ───────────────────────────────────────────────────────────────────
let fileHandle = null;
let data = { habits: [] };
let calendarHabitId = null;
let calendarYear  = new Date().getFullYear();
let calendarMonth = new Date().getMonth();
let habitToDelete = null;

// ─── Helpers ─────────────────────────────────────────────────────────────────
const TODAY = (() => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
})();

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}
function toDateStr(year, month, day) {
  return `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
}
function formatMonthYear(year, month) {
  return new Date(year, month, 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
}
function formatTodayDisplay() {
  return new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

// ─── IndexedDB — persist the file handle across sessions ─────────────────────
const IDB_NAME    = 'habit-tracker-db';
const IDB_STORE   = 'handles';
const IDB_KEY     = 'dataFileHandle';

function openIDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = e => e.target.result.createObjectStore(IDB_STORE);
    req.onsuccess = e => resolve(e.target.result);
    req.onerror   = e => reject(e.target.error);
  });
}

async function saveHandleToIDB(handle) {
  const db = await openIDB();
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(IDB_STORE, 'readwrite');
    const req = tx.objectStore(IDB_STORE).put(handle, IDB_KEY);
    req.onsuccess = () => resolve();
    req.onerror   = e => reject(e.target.error);
  });
}

async function loadHandleFromIDB() {
  try {
    const db = await openIDB();
    return new Promise((resolve, reject) => {
      const tx  = db.transaction(IDB_STORE, 'readonly');
      const req = tx.objectStore(IDB_STORE).get(IDB_KEY);
      req.onsuccess = e => resolve(e.target.result || null);
      req.onerror   = e => reject(e.target.error);
    });
  } catch {
    return null;
  }
}

async function clearHandleFromIDB() {
  const db = await openIDB();
  return new Promise((resolve) => {
    const tx = db.transaction(IDB_STORE, 'readwrite');
    tx.objectStore(IDB_STORE).delete(IDB_KEY);
    tx.oncomplete = resolve;
  });
}

// ─── Startup — auto-restore saved handle ─────────────────────────────────────
async function init() {
  if (!('showOpenFilePicker' in window)) {
    // Browser doesn't support File System Access API
    hide('loading-notice');
    show('file-notice');
    document.querySelector('#file-notice p').innerHTML =
      '❌ Your browser does not support file saving. Please use <strong>Chrome</strong> or <strong>Edge</strong>.';
    document.getElementById('btn-open-file-2').disabled = true;
    return;
  }

  const savedHandle = await loadHandleFromIDB();

  if (!savedHandle) {
    // First time — show setup screen
    hide('loading-notice');
    show('file-notice');
    return;
  }

  // Handle found — check permission state
  fileHandle = savedHandle;
  const perm = await fileHandle.queryPermission({ mode: 'readwrite' });

  if (perm === 'granted') {
    // Already permitted this session — load silently
    await loadFileData();
  } else {
    // Need one click to re-confirm
    hide('loading-notice');
    show('resume-notice');
  }
}

// User clicks "Resume" — request permission with one click
async function resumeFile() {
  try {
    const perm = await fileHandle.requestPermission({ mode: 'readwrite' });
    if (perm === 'granted') {
      hide('resume-notice');
      show('loading-notice');
      await loadFileData();
    } else {
      showToast('⚠️ Permission denied. Please try again or use a different file.', 4000);
    }
  } catch (err) {
    showToast('❌ ' + err.message, 4000);
  }
}

async function loadFileData() {
  try {
    const file = await fileHandle.getFile();
    const text = await file.text();
    try {
      data = JSON.parse(text);
      if (!data.habits) data.habits = [];
    } catch {
      data = { habits: [] };
    }
    onFileLoaded();
  } catch (err) {
    // File may have moved or been deleted
    await clearHandleFromIDB();
    fileHandle = null;
    hide('loading-notice');
    show('file-notice');
    showToast('⚠️ Could not open the saved file. Please select it again.', 4000);
  }
}

// ─── File System Access ───────────────────────────────────────────────────────
async function openOrCreateFile() {
  try {
    const [handle] = await window.showOpenFilePicker({
      types: [{ description: 'JSON Data', accept: { 'application/json': ['.json'] } }],
      multiple: false
    });
    fileHandle = handle;
    await saveHandleToIDB(fileHandle);
    await loadFileData();
    showToast('✅ Data file loaded!');
  } catch (err) {
    if (err.name === 'AbortError') {
      await createNewFile();
    } else {
      showToast('❌ Error opening file: ' + err.message, 4000);
    }
  }
}

async function createNewFile() {
  try {
    fileHandle = await window.showSaveFilePicker({
      suggestedName: 'data.json',
      types: [{ description: 'JSON Data', accept: { 'application/json': ['.json'] } }]
    });
    data = { habits: [] };
    await saveData();
    await saveHandleToIDB(fileHandle);
    showToast('✅ New data file created!');
    onFileLoaded();
  } catch (err) {
    if (err.name !== 'AbortError') {
      showToast('❌ Error creating file: ' + err.message, 4000);
    }
  }
}

async function saveData() {
  if (!fileHandle) return;
  try {
    const writable = await fileHandle.createWritable();
    await writable.write(JSON.stringify(data, null, 2));
    await writable.close();
  } catch (err) {
    showToast('⚠️ Save failed: ' + err.message, 4000);
  }
}

function onFileLoaded() {
  hide('file-notice');
  hide('resume-notice');
  hide('loading-notice');
  show('app');
  document.getElementById('btn-add-habit').disabled = false;
  document.getElementById('btn-settings').disabled = false;
  renderAll();
}

// ─── Screen helpers ───────────────────────────────────────────────────────────
function show(id) { document.getElementById(id).classList.remove('hidden'); }
function hide(id) { document.getElementById(id).classList.add('hidden');    }

// ─── Rendering ────────────────────────────────────────────────────────────────
function renderAll() {
  renderToday();
  renderCalendarHabitSelect();
  renderCalendar();
  renderStreaks();
}

function renderToday() {
  document.getElementById('today-date').textContent = formatTodayDisplay();
  const list  = document.getElementById('habits-list');
  const noMsg = document.getElementById('no-habits-msg');
  list.innerHTML = '';

  if (data.habits.length === 0) {
    noMsg.classList.remove('hidden');
    return;
  }
  noMsg.classList.add('hidden');

  data.habits.forEach(habit => {
    const log = habit.logs?.[TODAY];
    const isDone    = log === true;
    const isSkipped = log === false;

    const row = document.createElement('div');
    row.className = `habit-row${isDone ? ' done' : isSkipped ? ' skipped' : ''}`;

    const icon = isDone ? '✅' : isSkipped ? '❌' : '⬜';
    row.innerHTML = `
      <div class="habit-row-icon">${icon}</div>
      <div class="habit-row-name">${escHtml(habit.name)}</div>
      <div class="habit-row-buttons">
        <button class="btn-yes${isDone ? ' active' : ''}" data-id="${habit.id}" data-val="yes">✓ Yes</button>
        <button class="btn-no${isSkipped ? ' active' : ''}"  data-id="${habit.id}" data-val="no">✗ No</button>
      </div>
    `;
    list.appendChild(row);
  });

  list.querySelectorAll('.btn-yes, .btn-no').forEach(btn => {
    btn.addEventListener('click', () => logHabit(btn.dataset.id, btn.dataset.val === 'yes'));
  });
}

async function logHabit(id, done) {
  const habit = data.habits.find(h => h.id === id);
  if (!habit) return;
  const current = habit.logs?.[TODAY];
  if (!habit.logs) habit.logs = {};
  if ((done && current === true) || (!done && current === false)) {
    delete habit.logs[TODAY];
  } else {
    habit.logs[TODAY] = done;
  }
  await saveData();
  renderAll();
}

// ─── Calendar ─────────────────────────────────────────────────────────────────
function renderCalendarHabitSelect() {
  const sel  = document.getElementById('habit-select');
  const prev = sel.value;
  sel.innerHTML = '<option value="">— Select a habit —</option>';
  data.habits.forEach(h => {
    const opt = document.createElement('option');
    opt.value = h.id;
    opt.textContent = h.name;
    sel.appendChild(opt);
  });
  if (prev && data.habits.find(h => h.id === prev)) {
    sel.value = prev;
    calendarHabitId = prev;
  } else if (calendarHabitId && !data.habits.find(h => h.id === calendarHabitId)) {
    calendarHabitId = null;
  }
}

function renderCalendar() {
  const grid    = document.getElementById('calendar-grid');
  const label   = document.getElementById('cal-month-label');
  const noHabit = document.getElementById('cal-no-habit');
  const calCont = document.getElementById('calendar-container');

  if (!calendarHabitId) {
    calCont.classList.add('hidden');
    noHabit.classList.remove('hidden');
    return;
  }
  const habit = data.habits.find(h => h.id === calendarHabitId);
  if (!habit) {
    calCont.classList.add('hidden');
    noHabit.classList.remove('hidden');
    return;
  }

  calCont.classList.remove('hidden');
  noHabit.classList.add('hidden');
  label.textContent = formatMonthYear(calendarYear, calendarMonth);
  grid.innerHTML = '';

  const dayNames = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  dayNames.forEach(d => {
    const h = document.createElement('div');
    h.className = 'cal-day-header';
    h.textContent = d;
    grid.appendChild(h);
  });

  const firstDay    = new Date(calendarYear, calendarMonth, 1).getDay();
  const offset      = (firstDay + 6) % 7;
  const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
  const todayDate   = new Date();

  for (let i = 0; i < offset; i++) {
    const cell = document.createElement('div');
    cell.className = 'cal-day empty';
    grid.appendChild(cell);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr  = toDateStr(calendarYear, calendarMonth, day);
    const cellDate = new Date(calendarYear, calendarMonth, day);
    const isToday  = dateStr === TODAY;
    const isFuture = cellDate > todayDate && !isToday;
    const log = habit.logs?.[dateStr];

    let stateClass = 'unlogged';
    if (isFuture)          stateClass = 'future';
    else if (log === true)  stateClass = 'done-day';
    else if (log === false) stateClass = 'skipped-day';

    const cell = document.createElement('div');
    cell.className = `cal-day ${stateClass}${isToday ? ' today-day' : ''}`;
    cell.textContent = day;
    cell.title = dateStr;
    grid.appendChild(cell);
  }

  let legend = document.getElementById('cal-legend');
  if (!legend) {
    legend = document.createElement('div');
    legend.id = 'cal-legend';
    legend.className = 'cal-legend';
    legend.innerHTML = `
      <div class="legend-item"><div class="legend-dot" style="background:var(--done)"></div> Done</div>
      <div class="legend-item"><div class="legend-dot" style="background:var(--skipped)"></div> Skipped</div>
      <div class="legend-item"><div class="legend-dot" style="background:var(--unlogged)"></div> Not logged</div>
      <div class="legend-item"><div class="legend-dot" style="background:var(--future)"></div> Future</div>
    `;
    document.getElementById('calendar-panel').appendChild(legend);
  }
}

// ─── Streaks ──────────────────────────────────────────────────────────────────
function calcStreaks(habit) {
  const logs = habit.logs || {};
  const allDates = Object.keys(logs).sort();

  let current = 0;
  const d = new Date();
  while (true) {
    const ds = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    if (logs[ds] === true) { current++; d.setDate(d.getDate() - 1); } else break;
  }

  let best = 0, streak = 0, prevDate = null;
  allDates.forEach(ds => {
    if (logs[ds] !== true) return;
    if (!prevDate) { streak = 1; }
    else {
      const diff = (new Date(ds) - new Date(prevDate)) / 86400000;
      streak = diff === 1 ? streak + 1 : 1;
    }
    best = Math.max(best, streak);
    prevDate = ds;
  });

  const now = new Date();
  const year = now.getFullYear(), month = now.getMonth();
  const daysPassed = Math.min(now.getDate(), new Date(year, month + 1, 0).getDate());
  let doneDays = 0;
  for (let d2 = 1; d2 <= daysPassed; d2++) {
    if (logs[toDateStr(year, month, d2)] === true) doneDays++;
  }
  const pct = daysPassed > 0 ? Math.round((doneDays / daysPassed) * 100) : 0;

  return { current, best, pct };
}

function renderStreaks() {
  const list = document.getElementById('streaks-list');
  list.innerHTML = '';
  if (data.habits.length === 0) {
    const p = document.createElement('p');
    p.className = 'muted';
    p.textContent = 'Add habits to see streaks.';
    list.appendChild(p);
    return;
  }
  data.habits.forEach(habit => {
    const { current, best, pct } = calcStreaks(habit);
    const row = document.createElement('div');
    row.className = 'streak-row';
    row.innerHTML = `
      <div class="streak-name">${escHtml(habit.name)}</div>
      <div class="streak-badges">
        <span class="badge badge-fire" title="Current streak">🔥 ${current} day${current !== 1 ? 's' : ''}</span>
        <span class="badge badge-best" title="Best streak">🏆 Best: ${best}</span>
        <span class="badge badge-pct"  title="This month completion">📊 ${pct}% this month</span>
      </div>
    `;
    list.appendChild(row);
  });
}

// ─── Habit CRUD ───────────────────────────────────────────────────────────────
function renderManageHabits() {
  const list = document.getElementById('manage-habits-list');
  list.innerHTML = '';
  if (data.habits.length === 0) {
    list.innerHTML = '<p class="muted">No habits yet.</p>';
    return;
  }
  data.habits.forEach(habit => {
    const row = document.createElement('div');
    row.className = 'manage-habit-row';
    row.innerHTML = `
      <div class="manage-habit-name">${escHtml(habit.name)}</div>
      <div class="manage-habit-actions">
        <button class="btn btn-ghost btn-sm" data-id="${habit.id}" data-action="edit">✏️ Rename</button>
        <button class="btn btn-danger btn-sm" data-id="${habit.id}" data-action="delete">🗑</button>
      </div>
    `;
    list.appendChild(row);
  });
  list.querySelectorAll('[data-action]').forEach(btn => {
    btn.addEventListener('click', () => {
      const habit = data.habits.find(h => h.id === btn.dataset.id);
      if (!habit) return;
      if (btn.dataset.action === 'edit') {
        openAddModal(habit);
      } else {
        habitToDelete = habit.id;
        document.getElementById('delete-habit-name').textContent = habit.name;
        openModal('modal-delete');
      }
    });
  });
}

function openAddModal(habit = null) {
  const title  = document.getElementById('add-modal-title');
  const input  = document.getElementById('habit-name-input');
  const editId = document.getElementById('editing-habit-id');
  if (habit) {
    title.textContent = '✏️ Rename Habit';
    input.value = habit.name;
    editId.value = habit.id;
  } else {
    title.textContent = '+ Add Habit';
    input.value = '';
    editId.value = '';
  }
  openModal('modal-add-habit');
  setTimeout(() => input.focus(), 100);
}

async function saveHabit() {
  const name = document.getElementById('habit-name-input').value.trim();
  if (!name) { showToast('⚠️ Please enter a habit name.'); return; }
  const editId = document.getElementById('editing-habit-id').value;
  if (editId) {
    const habit = data.habits.find(h => h.id === editId);
    if (habit) habit.name = name;
    showToast('✅ Habit renamed!');
  } else {
    data.habits.push({ id: uid(), name, createdAt: TODAY, logs: {} });
    showToast('✅ Habit added!');
  }
  await saveData();
  closeModal('modal-add-habit');
  renderManageHabits();
  renderAll();
}

async function deleteHabit() {
  if (!habitToDelete) return;
  data.habits = data.habits.filter(h => h.id !== habitToDelete);
  if (calendarHabitId === habitToDelete) calendarHabitId = null;
  habitToDelete = null;
  await saveData();
  closeModal('modal-delete');
  renderManageHabits();
  renderAll();
  showToast('🗑 Habit deleted.');
}

// ─── Modal Helpers ────────────────────────────────────────────────────────────
function openModal(id) { document.getElementById(id).classList.remove('hidden'); }
function closeModal(id) { document.getElementById(id).classList.add('hidden'); }

// ─── Toast ────────────────────────────────────────────────────────────────────
let toastTimer = null;
function showToast(msg, duration = 2500) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.remove('hidden');
  requestAnimationFrame(() => toast.classList.add('show'));
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.classList.add('hidden'), 300);
  }, duration);
}

// ─── Security ─────────────────────────────────────────────────────────────────
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ─── Event Listeners ──────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Boot: try to auto-restore the file handle
  init();

  // File screens
  document.getElementById('btn-open-file').addEventListener('click', openOrCreateFile);
  document.getElementById('btn-open-file-2').addEventListener('click', openOrCreateFile);
  document.getElementById('btn-resume').addEventListener('click', resumeFile);
  document.getElementById('btn-change-file').addEventListener('click', async () => {
    await clearHandleFromIDB();
    fileHandle = null;
    hide('resume-notice');
    show('file-notice');
  });

  // Habits
  document.getElementById('btn-add-habit').addEventListener('click', () => openAddModal());
  document.getElementById('btn-settings').addEventListener('click', () => {
    renderManageHabits();
    openModal('modal-settings');
  });
  document.getElementById('btn-save-habit').addEventListener('click', saveHabit);
  document.getElementById('habit-name-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') saveHabit();
  });
  document.getElementById('btn-confirm-delete').addEventListener('click', deleteHabit);

  // Calendar
  document.getElementById('habit-select').addEventListener('change', e => {
    calendarHabitId = e.target.value || null;
    renderCalendar();
  });
  document.getElementById('cal-prev').addEventListener('click', () => {
    calendarMonth--;
    if (calendarMonth < 0) { calendarMonth = 11; calendarYear--; }
    renderCalendar();
  });
  document.getElementById('cal-next').addEventListener('click', () => {
    calendarMonth++;
    if (calendarMonth > 11) { calendarMonth = 0; calendarYear++; }
    renderCalendar();
  });

  // Modals
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(overlay.id); });
  });
  document.querySelectorAll('.modal-close').forEach(btn => {
    btn.addEventListener('click', () => closeModal(btn.dataset.modal));
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay:not(.hidden)').forEach(m => closeModal(m.id));
    }
  });
});

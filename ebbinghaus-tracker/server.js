import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;
const DATA_FILE = path.join(__dirname, 'data', 'learning_data.json');
const HABITS_DATA_FILE = path.join(__dirname, 'data', 'habits_data.json');
const POMODORO_DATA_FILE = path.join(__dirname, 'data', 'pomodoro_data.json');
const UPDATES_DATA_FILE = path.join(__dirname, 'data', 'updates_data.json');

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Ensure data directory and file exist
function ensureDataFile() {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ topics: [] }, null, 2), 'utf-8');
  }
}

// Helper to read data safely
function readData() {
  ensureDataFile();
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading JSON file:', err);
    return { topics: [] };
  }
}

// Helper to write data safely
function writeData(data) {
  ensureDataFile();
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

function ensureHabitsDataFile() {
  const dir = path.dirname(HABITS_DATA_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(HABITS_DATA_FILE)) {
    fs.writeFileSync(HABITS_DATA_FILE, JSON.stringify({ habits: [] }, null, 2), 'utf-8');
  }
}

function readHabitsData() {
  ensureHabitsDataFile();
  try {
    return JSON.parse(fs.readFileSync(HABITS_DATA_FILE, 'utf-8'));
  } catch (err) {
    console.error('Error reading habits file:', err);
    return { habits: [] };
  }
}

function writeHabitsData(data) {
  ensureHabitsDataFile();
  fs.writeFileSync(HABITS_DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

function ensurePomodoroDataFile() {
  const dir = path.dirname(POMODORO_DATA_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(POMODORO_DATA_FILE)) {
    fs.writeFileSync(POMODORO_DATA_FILE, JSON.stringify({ sessions: [] }, null, 2), 'utf-8');
  }
}

function readPomodoroData() {
  ensurePomodoroDataFile();
  try {
    return JSON.parse(fs.readFileSync(POMODORO_DATA_FILE, 'utf-8'));
  } catch (err) {
    console.error('Error reading Pomodoro file:', err);
    return { sessions: [] };
  }
}

function writePomodoroData(data) {
  ensurePomodoroDataFile();
  fs.writeFileSync(POMODORO_DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

function ensureUpdatesDataFile() {
  const dir = path.dirname(UPDATES_DATA_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(UPDATES_DATA_FILE)) {
    fs.writeFileSync(UPDATES_DATA_FILE, JSON.stringify({ days: {} }, null, 2), 'utf-8');
  }
}

function readUpdatesData() {
  ensureUpdatesDataFile();
  try {
    return JSON.parse(fs.readFileSync(UPDATES_DATA_FILE, 'utf-8'));
  } catch (err) {
    console.error('Error reading daily updates file:', err);
    return { days: {} };
  }
}

function writeUpdatesData(data) {
  ensureUpdatesDataFile();
  fs.writeFileSync(UPDATES_DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

// Ebbinghaus Stage Intervals in Days
// Stage 1: +1 day, Stage 2: +3 days, Stage 3: +7 days, Stage 4: +14 days, Stage 5: +30 days, Stage 6: +60 days (Mastered)
const STAGE_INTERVALS = {
  1: 1,
  2: 3,
  3: 7,
  4: 14,
  5: 30,
  6: 60
};

function addDaysToDateStr(dateStr, days) {
  const date = new Date(dateStr + 'T00:00:00');
  date.setDate(date.getDate() + days);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Habit Maker data is stored beside the learning data and autosaved through this API.
app.get('/api/habits', (req, res) => {
  res.json(readHabitsData());
});

app.put('/api/habits', (req, res) => {
  const { habits } = req.body;
  if (!Array.isArray(habits)) {
    return res.status(400).json({ error: 'Invalid habits data. Expected { habits: [] }' });
  }
  writeHabitsData({ habits });
  res.json({ success: true, count: habits.length });
});

app.get('/api/pomodoro', (req, res) => {
  res.json(readPomodoroData());
});

app.post('/api/pomodoro/sessions', (req, res) => {
  const minutes = Number(req.body.minutes);
  if (!Number.isFinite(minutes) || minutes < 1) {
    return res.status(400).json({ error: 'A positive session duration is required' });
  }
  const session = {
    id: 'pomodoro_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    date: new Date().toISOString().split('T')[0],
    completedAt: new Date().toISOString(),
    minutes,
    task: typeof req.body.task === 'string' ? req.body.task.trim().slice(0, 120) : ''
  };
  const data = readPomodoroData();
  data.sessions.unshift(session);
  writePomodoroData(data);
  res.status(201).json(session);
});

app.get('/api/updates/:date', (req, res) => {
  const data = readUpdatesData();
  res.json({ date: req.params.date, slots: data.days[req.params.date] || {} });
});

app.put('/api/updates/:date', (req, res) => {
  const { slots } = req.body;
  if (!slots || typeof slots !== 'object' || Array.isArray(slots)) {
    return res.status(400).json({ error: 'Invalid updates data. Expected { slots: {} }' });
  }
  const data = readUpdatesData();
  data.days[req.params.date] = Object.fromEntries(
    Object.entries(slots).filter(([key, value]) => /^\d{2}:\d{2}$/.test(key) && typeof value === 'string' && value.trim())
  );
  writeUpdatesData(data);
  res.json({ success: true, date: req.params.date });
});

// GET all topics
app.get('/api/topics', (req, res) => {
  const data = readData();
  res.json(data);
});

// POST add new topic
app.post('/api/topics', (req, res) => {
  const { title, dateLearned } = req.body;
  if (!title || !title.trim()) {
    return res.status(400).json({ error: 'Title is required' });
  }

  const learnedDateStr = dateLearned || new Date().toISOString().split('T')[0];
  const nextReview = addDaysToDateStr(learnedDateStr, STAGE_INTERVALS[1]);

  const newTopic = {
    id: 'topic_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    title: title.trim(),
    dateLearned: learnedDateStr,
    stage: 1, // Start at stage 1
    nextReviewDate: nextReview,
    lastReviewedDate: learnedDateStr,
    history: [
      {
        date: new Date().toISOString().split('T')[0],
        action: 'created',
        stage: 1
      }
    ]
  };

  const data = readData();
  data.topics.unshift(newTopic);
  writeData(data);

  res.status(201).json(newTopic);
});

// PUT complete review for a topic
app.put('/api/topics/:id/review', (req, res) => {
  const { id } = req.params;
  const data = readData();
  const topic = data.topics.find((t) => t.id === id);

  if (!topic) {
    return res.status(404).json({ error: 'Topic not found' });
  }

  const todayStr = new Date().toISOString().split('T')[0];
  const currentStage = topic.stage || 1;
  const nextStage = Math.min(currentStage + 1, 6);
  const daysToAdd = STAGE_INTERVALS[nextStage] || 60;
  const nextReviewDate = addDaysToDateStr(todayStr, daysToAdd);

  topic.stage = nextStage;
  topic.lastReviewedDate = todayStr;
  topic.nextReviewDate = nextReviewDate;
  topic.history.push({
    date: todayStr,
    action: nextStage === 6 ? 'mastered' : 'reviewed',
    stage: nextStage
  });

  writeData(data);
  res.json(topic);
});

// DELETE a topic
app.delete('/api/topics/:id', (req, res) => {
  const { id } = req.params;
  const data = readData();
  data.topics = data.topics.filter((t) => t.id !== id);
  writeData(data);
  res.json({ success: true, id });
});

// POST import full JSON data
app.post('/api/import', (req, res) => {
  const importedData = req.body;
  if (!importedData || !Array.isArray(importedData.topics)) {
    return res.status(400).json({ error: 'Invalid data format. Expected { topics: [] }' });
  }
  writeData(importedData);
  res.json({ success: true, count: importedData.topics.length });
});

// GET export path file info
app.get('/api/export-path', (req, res) => {
  res.json({ path: DATA_FILE });
});

app.listen(PORT, () => {
  console.log(`Ebbinghaus Backend API server running at http://localhost:${PORT}`);
  console.log(`Data stored cleanly at: ${DATA_FILE}`);
  console.log(`Habit data stored cleanly at: ${HABITS_DATA_FILE}`);
  console.log(`Pomodoro data stored cleanly at: ${POMODORO_DATA_FILE}`);
  console.log(`Daily updates stored cleanly at: ${UPDATES_DATA_FILE}`);
});

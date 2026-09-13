import { Brain, CheckSquare, Clock3, Timer } from 'lucide-react';
import EbbinghausApp from './ebbinghaus/EbbinghausApp';
import HabitMakerApp from './habit-maker/HabitMakerApp';
import PomodoroApp from './pomodoro/PomodoroApp';
import DailyUpdatesApp from './daily-updates/DailyUpdatesApp';

// Add future productivity apps here. Each entry owns its label, icon, and screen.
export const productivityApps = [
  {
    id: 'recall',
    label: 'Ebbinghaus Recall',
    shortLabel: 'Learning',
    icon: Brain,
    component: EbbinghausApp
  },
  {
    id: 'habits',
    label: 'Habit Maker',
    shortLabel: 'Routines',
    icon: CheckSquare,
    component: HabitMakerApp
  },
  {
    id: 'pomodoro',
    label: 'Pomodoro Focus',
    shortLabel: 'Deep work',
    icon: Timer,
    component: PomodoroApp
  },
  {
    id: 'daily-updates',
    label: 'Daily Updates',
    shortLabel: 'Time log',
    icon: Clock3,
    component: DailyUpdatesApp
  }
];
// Ebbinghaus Curve Intervals
export const STAGE_CONFIG = {
  1: { days: 1, label: 'Stage 1 (+1 Day)', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.12)' },
  2: { days: 3, label: 'Stage 2 (+3 Days)', color: '#6366f1', bg: 'rgba(99, 102, 241, 0.12)' },
  3: { days: 7, label: 'Stage 3 (+7 Days)', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.12)' },
  4: { days: 14, label: 'Stage 4 (+14 Days)', color: '#ec4899', bg: 'rgba(236, 72, 153, 0.12)' },
  5: { days: 30, label: 'Stage 5 (+30 Days)', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)' },
  6: { days: 60, label: 'Stage 6 (Mastered)', color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)' }
};

export function getTodayStr() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function isDueTodayOrOverdue(nextReviewDateStr) {
  if (!nextReviewDateStr) return false;
  const today = getTodayStr();
  return nextReviewDateStr <= today;
}

export function getDaysUntil(dateStr) {
  if (!dateStr) return 0;
  const today = new Date(getTodayStr() + 'T00:00:00');
  const target = new Date(dateStr + 'T00:00:00');
  const diffTime = target - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

export function formatDateFriendly(dateStr) {
  if (!dateStr) return '';
  const todayStr = getTodayStr();
  if (dateStr === todayStr) return 'Today';
  
  const daysDiff = getDaysUntil(dateStr);
  if (daysDiff === -1) return 'Yesterday';
  if (daysDiff === 1) return 'Tomorrow';
  if (daysDiff < -1) return `${Math.abs(daysDiff)} days ago`;
  if (daysDiff > 1) return `In ${daysDiff} days`;

  return dateStr;
}

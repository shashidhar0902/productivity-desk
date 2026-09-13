import React, { useState } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { getTodayStr } from '../utils/ebbinghaus';

export default function CalendarView({ topics }) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  const startingDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sun, 1 = Mon ...
  const daysInMonth = lastDayOfMonth.getDate();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Map topics by date
  const todayStr = getTodayStr();

  // Create grid cells
  const cells = [];
  for (let i = 0; i < startingDayOfWeek; i++) {
    cells.push({ empty: true, id: `empty-${i}` });
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const monthStr = String(month + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    const dateKey = `${year}-${monthStr}-${dayStr}`;

    // Filter topics learned or due on this date
    const learned = topics.filter((t) => t.dateLearned === dateKey);
    const due = topics.filter((t) => t.nextReviewDate === dateKey && t.stage < 6);

    cells.push({
      empty: false,
      day,
      dateKey,
      isToday: dateKey === todayStr,
      learned,
      due
    });
  }

  return (
    <div className="section-card">
      <div className="due-queue-header">
        <h2 className="card-title" style={{ margin: 0 }}>
          <CalendarIcon size={20} color="#8b5cf6" />
          Review Schedule Calendar
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontWeight: 600, fontSize: '1rem' }}>
            {monthNames[month]} {year}
          </span>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button className="btn-outline" onClick={prevMonth} style={{ padding: '6px' }}>
              <ChevronLeft size={16} />
            </button>
            <button className="btn-outline" onClick={nextMonth} style={{ padding: '6px' }}>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="calendar-grid">
        {daysOfWeek.map((day) => (
          <div key={day} className="calendar-day-header">
            {day}
          </div>
        ))}

        {cells.map((cell) => {
          if (cell.empty) {
            return <div key={cell.id} className="calendar-day-cell" style={{ opacity: 0.2 }} />;
          }

          return (
            <div
              key={cell.dateKey}
              className={`calendar-day-cell ${cell.isToday ? 'today' : ''}`}
            >
              <div className="day-number">{cell.day}</div>
              <div className="day-items-list">
                {cell.learned.map((t) => (
                  <div
                    key={`l-${t.id}`}
                    className="day-topic-chip chip-learned"
                    title={`Learned: ${t.title}`}
                  >
                    🌱 {t.title}
                  </div>
                ))}
                {cell.due.map((t) => (
                  <div
                    key={`d-${t.id}`}
                    className="day-topic-chip chip-due"
                    title={`Due for review: ${t.title}`}
                  >
                    ⏰ {t.title}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { PlusCircle, Calendar } from 'lucide-react';
import { getTodayStr } from '../utils/ebbinghaus';

export default function TopicLogger({ onAddTopic }) {
  const [title, setTitle] = useState('');
  const [dateLearned, setDateLearned] = useState(getTodayStr());

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAddTopic(title.trim(), dateLearned);
    setTitle('');
  };

  return (
    <div className="logger-card">
      <div className="card-title">
        <PlusCircle size={20} color="#6366f1" />
        Log New Learning
      </div>
      <form onSubmit={handleSubmit} className="logger-form">
        <input
          type="text"
          className="input-field"
          placeholder="What topic did you learn today? (e.g., 'Options in financing')"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Calendar size={16} color="#9ca3af" />
          <input
            type="date"
            className="input-field"
            value={dateLearned}
            onChange={(e) => setDateLearned(e.target.value)}
            style={{ width: '150px' }}
          />
        </div>
        <button type="submit" className="btn-primary">
          <PlusCircle size={18} />
          Add Topic
        </button>
      </form>
    </div>
  );
}

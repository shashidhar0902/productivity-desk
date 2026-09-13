import React, { useState } from 'react';
import { BookOpen, Search, Download, Upload, Trash2, CheckCircle, ArrowRight } from 'lucide-react';
import { STAGE_CONFIG, formatDateFriendly, isDueTodayOrOverdue } from '../utils/ebbinghaus';

export default function TopicLibrary({ topics, onDeleteTopic, onImportData, dataFilePath }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');

  const filteredTopics = topics.filter((t) => {
    const matchesSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;

    if (filter === 'due') return isDueTodayOrOverdue(t.nextReviewDate) && t.stage < 6;
    if (filter === 'mastered') return t.stage >= 6;
    if (filter === 'learning') return t.stage < 6;
    return true;
  });

  const handleExportJSON = () => {
    const jsonStr = JSON.stringify({ topics }, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `learning_data_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(evt.target.result);
        if (parsed && Array.isArray(parsed.topics)) {
          onImportData(parsed);
          alert(`Successfully imported ${parsed.topics.length} topics!`);
        } else {
          alert('Invalid file format. Must contain { "topics": [...] }');
        }
      } catch (err) {
        alert('Failed to parse JSON file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="section-card">
      <div className="due-queue-header" style={{ flexWrap: 'wrap', gap: '12px' }}>
        <h2 className="card-title" style={{ margin: 0 }}>
          <BookOpen size={20} color="#3b82f6" />
          All Logged Topics ({topics.length})
        </h2>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn-outline" onClick={handleExportJSON} title="Download JSON file">
            <Download size={15} /> Export File
          </button>
          <label className="btn-outline" style={{ cursor: 'pointer' }} title="Import JSON file from computer">
            <Upload size={15} /> Import File
            <input
              type="file"
              accept=".json"
              onChange={handleImportFileChange}
              style={{ display: 'none' }}
            />
          </label>
        </div>
      </div>

      {dataFilePath && (
        <div className="file-info-banner">
          <div className="file-info-text">
            <span>💾 Disk Auto-Sync Active: Data saved directly to file:</span>
            <span className="file-path-code">{dataFilePath}</span>
          </div>
        </div>
      )}

      {/* Filter and Search controls */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
          <Search size={16} color="#6b7280" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            className="input-field"
            placeholder="Search topic heading..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '36px' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '6px' }}>
          {['all', 'due', 'learning', 'mastered'].map((fKey) => (
            <button
              key={fKey}
              className={`btn-outline ${filter === fKey ? 'active' : ''}`}
              style={{
                background: filter === fKey ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                borderColor: filter === fKey ? 'var(--primary)' : 'var(--border-color)',
                textTransform: 'capitalize'
              }}
              onClick={() => setFilter(fKey)}
            >
              {fKey}
            </button>
          ))}
        </div>
      </div>

      {filteredTopics.length === 0 ? (
        <div className="empty-state">
          <p>No topics match your search or filter.</p>
        </div>
      ) : (
        <div className="topic-list">
          {filteredTopics.map((topic) => {
            const stageConfig = STAGE_CONFIG[topic.stage] || STAGE_CONFIG[1];
            const isDue = isDueTodayOrOverdue(topic.nextReviewDate) && topic.stage < 6;

            return (
              <div key={topic.id} className="topic-item">
                <div className="topic-main-info">
                  <div>
                    <div className="topic-title">{topic.title}</div>
                    <div className="topic-meta">
                      <span>Studied: {formatDateFriendly(topic.dateLearned)}</span>
                      <span>•</span>
                      {topic.stage >= 6 ? (
                        <span style={{ color: '#10b981', fontWeight: 600 }}>Mastered!</span>
                      ) : (
                        <span>Next Review: {formatDateFriendly(topic.nextReviewDate)}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span
                    className="stage-pill"
                    style={{ background: stageConfig.bg, color: stageConfig.color }}
                  >
                    {stageConfig.label}
                  </span>
                  <button
                    className="btn-icon-danger"
                    title="Delete topic"
                    onClick={() => onDeleteTopic(topic.id)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

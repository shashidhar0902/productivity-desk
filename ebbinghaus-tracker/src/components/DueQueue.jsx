import React from 'react';
import { CheckCircle2, Clock, Sparkles } from 'lucide-react';
import { STAGE_CONFIG, formatDateFriendly } from '../utils/ebbinghaus';

export default function DueQueue({ dueTopics, onReviewTopic }) {
  return (
    <div className="section-card">
      <div className="due-queue-header">
        <h2 className="card-title" style={{ margin: 0 }}>
          <Clock size={20} color="#f59e0b" />
          Ready for Review Today ({dueTopics.length})
        </h2>
        {dueTopics.length > 0 && (
          <span className="badge-count" style={{ background: '#f59e0b', color: '#000' }}>
            {dueTopics.length} Pending
          </span>
        )}
      </div>

      {dueTopics.length === 0 ? (
        <div className="empty-state">
          <Sparkles className="empty-icon" style={{ color: '#10b981' }} />
          <div className="empty-title">All Caught Up!</div>
          <p>You have no topics due for review today. Great work!</p>
        </div>
      ) : (
        <div className="topic-list">
          {dueTopics.map((topic) => {
            const stageConfig = STAGE_CONFIG[topic.stage] || STAGE_CONFIG[1];
            return (
              <div key={topic.id} className="topic-item">
                <div className="topic-main-info">
                  <div>
                    <div className="topic-title">{topic.title}</div>
                    <div className="topic-meta">
                      <span>Studied: {formatDateFriendly(topic.dateLearned)}</span>
                      <span>•</span>
                      <span>Due: {formatDateFriendly(topic.nextReviewDate)}</span>
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
                    className="btn-review"
                    onClick={() => onReviewTopic(topic.id)}
                  >
                    <CheckCircle2 size={16} />
                    Mark Reviewed
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

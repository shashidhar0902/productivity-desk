import { useEffect, useState } from 'react';
import { Brain, Clock, Calendar as CalendarIcon, BookOpen } from 'lucide-react';
import TopicLogger from '../../components/TopicLogger';
import DueQueue from '../../components/DueQueue';
import CalendarView from '../../components/CalendarView';
import TopicLibrary from '../../components/TopicLibrary';
import { isDueTodayOrOverdue } from '../../utils/ebbinghaus';
import { playDueNotificationSound, playReviewSuccessSound } from '../../utils/sound';

export default function EbbinghausApp() {
  const [topics, setTopics] = useState([]);
  const [activeTab, setActiveTab] = useState('queue');
  const [dataFilePath, setDataFilePath] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchTopics = async () => {
    try {
      const res = await fetch('/api/topics');
      const data = await res.json();
      setTopics(data.topics || []);

      const dueCount = (data.topics || []).filter(
        (topic) => isDueTodayOrOverdue(topic.nextReviewDate) && topic.stage < 6
      ).length;

      if (dueCount > 0) playDueNotificationSound();
    } catch (err) {
      console.error('Error fetching topics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTopics();
    fetch('/api/export-path')
      .then((res) => res.json())
      .then((data) => { if (data.path) setDataFilePath(data.path); })
      .catch((err) => console.error('Error fetching path:', err));
  }, []);

  const handleAddTopic = async (title, dateLearned) => {
    const res = await fetch('/api/topics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, dateLearned })
    });
    if (res.ok) fetchTopics();
  };

  const handleReviewTopic = async (id) => {
    const res = await fetch(`/api/topics/${id}/review`, { method: 'PUT' });
    if (res.ok) {
      playReviewSuccessSound();
      fetchTopics();
    }
  };

  const handleDeleteTopic = async (id) => {
    if (!window.confirm('Are you sure you want to delete this topic?')) return;
    const res = await fetch(`/api/topics/${id}`, { method: 'DELETE' });
    if (res.ok) fetchTopics();
  };

  const handleImportData = async (importedData) => {
    const res = await fetch('/api/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(importedData)
    });
    if (res.ok) fetchTopics();
  };

  const dueTopics = topics.filter(
    (topic) => isDueTodayOrOverdue(topic.nextReviewDate) && topic.stage < 6
  );

  return (
    <div className="app-container">
      <header className="header">
        <div className="header-brand">
          <div className="brand-icon-wrapper"><Brain size={24} /></div>
          <div>
            <h1 className="header-title">Ebbinghaus Recall</h1>
            <p className="header-subtitle">Daily Learning & Spaced Repetition Tracker</p>
          </div>
        </div>
        <div className="data-status-badge"><span className="status-dot" /><span>Saved to File (`learning_data.json`)</span></div>
      </header>

      <nav className="nav-tabs">
        <button className={`tab-btn ${activeTab === 'queue' ? 'active' : ''}`} onClick={() => setActiveTab('queue')}>
          <Clock size={18} /> Due Today & Log {dueTopics.length > 0 && <span className="badge-count">{dueTopics.length}</span>}
        </button>
        <button className={`tab-btn ${activeTab === 'calendar' ? 'active' : ''}`} onClick={() => setActiveTab('calendar')}>
          <CalendarIcon size={18} /> Schedule Calendar
        </button>
        <button className={`tab-btn ${activeTab === 'library' ? 'active' : ''}`} onClick={() => setActiveTab('library')}>
          <BookOpen size={18} /> All Topics ({topics.length})
        </button>
      </nav>

      {isLoading ? (
        <div className="section-card" style={{ textAlign: 'center', padding: '3rem' }}><p>Loading your learning history from file...</p></div>
      ) : (
        <>
          {activeTab === 'queue' && <><TopicLogger onAddTopic={handleAddTopic} /><DueQueue dueTopics={dueTopics} onReviewTopic={handleReviewTopic} /></>}
          {activeTab === 'calendar' && <CalendarView topics={topics} />}
          {activeTab === 'library' && <TopicLibrary topics={topics} onDeleteTopic={handleDeleteTopic} onImportData={handleImportData} dataFilePath={dataFilePath} />}
        </>
      )}
    </div>
  );
}
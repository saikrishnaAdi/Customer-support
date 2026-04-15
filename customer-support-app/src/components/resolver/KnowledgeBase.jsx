import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import { Search, BookOpen, PlusCircle, ThumbsUp, ThumbsDown, ExternalLink, Lightbulb, FileText } from 'lucide-react';
import './KnowledgeBase.css';

export default function KnowledgeBase() {
  const { user } = useAuth();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedModule, setSelectedModule] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newArticle, setNewArticle] = useState({ title: '', module: '', content: '', tags: '' });
  const modules = ['All', 'DEVIATION', 'CAPA', 'CMS', 'TMS', 'CCN', 'NTF', 'General'];

  const loadArticles = () => {
    setLoading(true);
    api.getKBArticles(search, selectedModule === 'All' ? '' : selectedModule)
      .then(setArticles)
      .catch(() => setArticles([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadArticles(); }, [selectedModule]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => loadArticles(), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Suggestions based on search
  useEffect(() => {
    if (search.length >= 3) {
      api.suggestKBArticles(search).then(setSuggestions).catch(() => setSuggestions([]));
    } else {
      setSuggestions([]);
    }
  }, [search]);

  const handleFeedback = async (articleId, helpful) => {
    try {
      await api.kbFeedback(articleId, helpful);
      setArticles((prev) => prev.map((a) => 
        a.id === articleId 
          ? { ...a, helpful: (a.helpful || 0) + (helpful ? 1 : 0), notHelpful: (a.notHelpful || 0) + (!helpful ? 1 : 0) }
          : a
      ));
    } catch {}
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newArticle.title || !newArticle.content || !newArticle.module) return;
    try {
      const created = await api.createKBArticle({
        ...newArticle,
        tags: newArticle.tags.split(',').map(t => t.trim()).filter(Boolean),
        createdBy: user?.name || 'System',
      });
      setArticles((prev) => [created, ...prev]);
      setShowCreate(false);
      setNewArticle({ title: '', module: '', content: '', tags: '' });
    } catch {}
  };

  return (
    <div className="knowledge-base">
      <div className="page-title-row">
        <div>
          <h2 className="page-title">📖 Knowledge Base</h2>
          <p className="page-subtitle">Articles and guides for common support topics</p>
        </div>
        <button className="primary-btn" onClick={() => setShowCreate(!showCreate)}>
          <PlusCircle size={16} /> New Article
        </button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <form className="kb-create-form" onSubmit={handleCreate}>
          <h4>Create New Article</h4>
          <input type="text" placeholder="Title" value={newArticle.title} onChange={(e) => setNewArticle(p => ({ ...p, title: e.target.value }))} required />
          <select value={newArticle.module} onChange={(e) => setNewArticle(p => ({ ...p, module: e.target.value }))} required>
            <option value="">Select Module</option>
            {modules.filter(m => m !== 'All').map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <textarea placeholder="Article content..." value={newArticle.content} onChange={(e) => setNewArticle(p => ({ ...p, content: e.target.value }))} rows={5} required />
          <input type="text" placeholder="Tags (comma-separated)" value={newArticle.tags} onChange={(e) => setNewArticle(p => ({ ...p, tags: e.target.value }))} />
          <div className="kb-create-actions">
            <button type="button" className="secondary-btn" onClick={() => setShowCreate(false)}>Cancel</button>
            <button type="submit" className="primary-btn">Create Article</button>
          </div>
        </form>
      )}

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="kb-suggestions">
          <Lightbulb size={14} />
          <span>Suggested: </span>
          {suggestions.map((s) => (
            <button key={s.id} className="kb-suggest-chip" onClick={() => setExpandedId(s.id)}>
              {s.title}
            </button>
          ))}
        </div>
      )}

      <div className="kb-search-bar">
        <Search size={18} />
        <input type="text" placeholder="Search knowledge base articles..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="kb-module-tabs">
        {modules.map((m) => (
          <button
            key={m}
            className={`kb-tab ${(selectedModule || 'All') === m ? 'active' : ''}`}
            onClick={() => setSelectedModule(m === 'All' ? '' : m)}
          >
            {m}
          </button>
        ))}
      </div>

      <div className="kb-results">{articles.length} article{articles.length !== 1 ? 's' : ''} found</div>

      {loading ? (
        <div className="loading-spinner"><div className="spinner" /></div>
      ) : (
        <div className="kb-list">
          {articles.map((article) => (
            <div key={article.id} className={`kb-article ${expandedId === article.id ? 'expanded' : ''}`}>
              <div className="kb-article-header" onClick={() => setExpandedId(expandedId === article.id ? null : article.id)}>
                <div className="kb-article-icon"><BookOpen size={16} /></div>
                <div className="kb-article-info">
                  <h4>{article.title}</h4>
                  <div className="kb-article-meta">
                    <span className="kb-module-tag">{article.module}</span>
                    <span>{article.views || 0} views</span>
                    <span><ThumbsUp size={11} /> {article.helpful || 0} found helpful</span>
                  </div>
                </div>
                <ExternalLink size={14} className="kb-expand-icon" />
              </div>
              {expandedId === article.id && (
                <div className="kb-article-content">
                  <p>{article.content}</p>
                  {article.tags?.length > 0 && (
                    <div className="kb-tags">
                      {article.tags.map((t, i) => <span key={i} className="kb-tag">{t}</span>)}
                    </div>
                  )}
                  <div className="kb-feedback-row">
                    <span>Was this helpful?</span>
                    <button className="kb-feedback-btn helpful" onClick={() => handleFeedback(article.id, true)}>
                      <ThumbsUp size={14} /> Yes ({article.helpful || 0})
                    </button>
                    <button className="kb-feedback-btn not-helpful" onClick={() => handleFeedback(article.id, false)}>
                      <ThumbsDown size={14} /> No ({article.notHelpful || 0})
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

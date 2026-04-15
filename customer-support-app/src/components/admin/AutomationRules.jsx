import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Activity, ToggleLeft, ToggleRight, Clock, Zap, AlertTriangle, RefreshCw } from 'lucide-react';
import './AutomationRules.css';

export default function AutomationRules() {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getRules()
      .then(setRules)
      .catch(() => setRules([]))
      .finally(() => setLoading(false));
  }, []);

  const toggleRule = async (rule) => {
    try {
      await api.updateRule(rule.id, { enabled: !rule.enabled });
      setRules((prev) => prev.map((r) => r.id === rule.id ? { ...r, enabled: !r.enabled } : r));
    } catch {}
  };

  const typeIcon = (type) => {
    switch (type) {
      case 'auto-close': return <Clock size={16} />;
      case 'escalation': return <AlertTriangle size={16} />;
      case 'auto-assign': return <Zap size={16} />;
      case 'status-change': return <RefreshCw size={16} />;
      default: return <Activity size={16} />;
    }
  };

  const typeColor = (type) => {
    switch (type) {
      case 'auto-close': return '#64748b';
      case 'escalation': return '#f97316';
      case 'auto-assign': return '#3b82f6';
      case 'status-change': return '#8b5cf6';
      default: return '#475569';
    }
  };

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

  return (
    <div className="automation-rules">
      <div className="page-title-row">
        <div>
          <h2 className="page-title">⚡ Automation Rules</h2>
          <p className="page-subtitle">Configure automated workflow actions for ticket management</p>
        </div>
      </div>

      <div className="rules-summary">
        <span><Zap size={14} /> {rules.filter((r) => r.enabled).length} active</span>
        <span className="rules-divider">·</span>
        <span>{rules.length} total rules</span>
      </div>

      <div className="rules-list">
        {rules.map((rule) => (
          <div key={rule.id} className={`rule-card ${rule.enabled ? 'enabled' : 'disabled'}`}>
            <div className="rule-header">
              <div className="rule-type-icon" style={{ color: typeColor(rule.type) }}>
                {typeIcon(rule.type)}
              </div>
              <div className="rule-info">
                <h4>{rule.name}</h4>
                <p>{rule.description || 'No description'}</p>
              </div>
              <button className="rule-toggle" onClick={() => toggleRule(rule)} title={rule.enabled ? 'Disable' : 'Enable'}>
                {rule.enabled ? (
                  <ToggleRight size={28} className="toggle-on" />
                ) : (
                  <ToggleLeft size={28} className="toggle-off" />
                )}
              </button>
            </div>
            <div className="rule-meta">
              <span className="rule-type-badge" style={{ color: typeColor(rule.type), borderColor: typeColor(rule.type) + '40' }}>
                {rule.type}
              </span>
              <span className="rule-id">{rule.id}</span>
            </div>
            {rule.conditions && (
              <div className="rule-conditions">
                <span className="rule-conditions-label">Conditions:</span>
                {Object.entries(rule.conditions).map(([key, val]) => (
                  <span key={key} className="rule-condition-chip">{key}: {JSON.stringify(val)}</span>
                ))}
              </div>
            )}
            {rule.actions && (
              <div className="rule-actions-list">
                <span className="rule-actions-label">Actions:</span>
                {Object.entries(rule.actions).map(([key, val]) => (
                  <span key={key} className="rule-action-chip">{key}: {JSON.stringify(val)}</span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

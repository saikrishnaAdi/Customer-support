import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Headphones, User, Shield, ArrowRight, Info, Settings, Eye, ClipboardCheck } from 'lucide-react';
import './LoginPage.css';

const ROLE_CONFIG = {
  raiser: {
    label: 'Request Raiser',
    icon: User,
    color: 'raiser',
    description: 'Raise and track support requests for eQMS module issues',
    features: ['📋 Raise new support tickets', '💬 Chat with support agent', '📞 Audio & Video calls', '🖥️ Share your screen', '⭐ Rate & provide feedback'],
  },
  resolver: {
    label: 'Request Resolver',
    icon: Shield,
    color: 'resolver',
    description: 'Resolve support tickets and assist platform users',
    features: ['🎯 Pick & resolve tickets', '💬 Chat with users', '📞 Audio & Video calls', '🖥️ Remote control access', '📊 View reports & stats'],
  },
  admin: {
    label: 'Administrator',
    icon: Settings,
    color: 'admin',
    description: 'Manage system configuration, rules, and users',
    features: ['⚙️ Automation rules engine', '📋 Audit trail viewer', '📊 Advanced reports', '📖 Knowledge base management', '👥 User & role management'],
  },
  'qa-reviewer': {
    label: 'QA Reviewer',
    icon: ClipboardCheck,
    color: 'qa-reviewer',
    description: 'Review escalated tickets and ensure quality standards',
    features: ['🔍 Review escalated tickets', '✅ Approve/reject resolutions', '📊 Quality metrics', '📈 SLA compliance monitoring'],
  },
  auditor: {
    label: 'Auditor',
    icon: Eye,
    color: 'auditor',
    description: 'Read-only access for compliance auditing',
    features: ['📋 Full audit trail access', '📊 Compliance reports', '🔍 Ticket inspection (read-only)', '📈 SLA & CSAT analytics'],
  },
};

export default function LoginPage() {
  const { users, login } = useAuth();
  const [selectedRole, setSelectedRole] = useState(null);

  const roles = ['raiser', 'resolver', 'admin', 'qa-reviewer', 'auditor'];

  return (
    <div className="login-page">
      <div className="login-bg-pattern" />
      <div className="login-container">
        <div className="login-brand">
          <Headphones size={36} className="login-brand-icon" />
          <h1>eQMS Support</h1>
          <p>Customer Support System for QcMetric QMS Platform</p>
        </div>

        <div className="login-info-banner">
          <Info size={16} />
          <span>Select a role and user to sign in. This is a demo — pick any user to explore.</span>
        </div>

        {!selectedRole && (
          <div className="role-selection">
            <h2>Choose Your Role</h2>
            <div className="role-cards">
              {roles.map((role) => {
                const cfg = ROLE_CONFIG[role];
                const Icon = cfg.icon;
                return (
                  <button key={role} className={`role-card ${cfg.color}`} onClick={() => setSelectedRole(role)}>
                    <div className={`role-card-icon ${cfg.color}-icon`}><Icon size={28} /></div>
                    <h3>{cfg.label}</h3>
                    <p>{cfg.description}</p>
                    <ul className="role-features">
                      {cfg.features.map((f, i) => <li key={i}>{f}</li>)}
                    </ul>
                    <span className="role-cta">Continue as {cfg.label} <ArrowRight size={16} /></span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {selectedRole && (
          <div className="user-selection">
            <button className="back-link" onClick={() => setSelectedRole(null)}>
              ← Back to roles
            </button>
            <h2>Select a {ROLE_CONFIG[selectedRole].label}</h2>
            <div className="user-list">
              {users.filter((u) => u.role === selectedRole).map((u) => (
                <button key={u.id} className="user-card" onClick={() => login(u.id)}>
                  <div className={`user-card-avatar ${selectedRole}`}>{u.avatar}</div>
                  <div className="user-card-info">
                    <strong>{u.name}</strong>
                    <span>{u.email}</span>
                    <span className="user-card-dept">{u.department}</span>
                  </div>
                  <ArrowRight size={16} className="user-card-arrow" />
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="login-footer">
          <p>eQMS Modules Supported: <strong>TMS · CMS · CCN · CAPA · Deviation · Note to File</strong></p>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  LayoutDashboard, PlusCircle, List, Settings, HelpCircle,
  Inbox, BarChart3, BookOpen, Users, X, Shield, Eye, ClipboardCheck,
  Activity, FileText, Search
} from 'lucide-react';
import './Sidebar.css';

const ROLE_LINKS = {
  raiser: [
    { to: '/raiser', icon: LayoutDashboard, label: 'Dashboard', end: true },
    { to: '/raiser/new', icon: PlusCircle, label: 'New Request' },
    { to: '/raiser/requests', icon: List, label: 'My Requests' },
    { to: '/raiser/help', icon: HelpCircle, label: 'Help & FAQ' },
  ],
  resolver: [
    { to: '/resolver', icon: LayoutDashboard, label: 'Dashboard', end: true },
    { to: '/resolver/queue', icon: Inbox, label: 'Ticket Queue' },
    { to: '/resolver/reports', icon: BarChart3, label: 'Reports' },
    { to: '/resolver/kb', icon: BookOpen, label: 'Knowledge Base' },
    { to: '/resolver/agents', icon: Users, label: 'Team' },
  ],
  admin: [
    { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
    { to: '/admin/rules', icon: Activity, label: 'Automation Rules' },
    { to: '/admin/audit', icon: FileText, label: 'Audit Log' },
    { to: '/admin/reports', icon: BarChart3, label: 'Reports' },
    { to: '/admin/kb', icon: BookOpen, label: 'Knowledge Base' },
  ],
  'qa-reviewer': [
    { to: '/qa-reviewer', icon: ClipboardCheck, label: 'Escalated Tickets', end: true },
    { to: '/qa-reviewer/reports', icon: BarChart3, label: 'Reports' },
  ],
  auditor: [
    { to: '/auditor', icon: LayoutDashboard, label: 'Dashboard', end: true },
    { to: '/auditor/audit', icon: FileText, label: 'Audit Log' },
    { to: '/auditor/reports', icon: BarChart3, label: 'Reports' },
  ],
};

const ROLE_TITLES = {
  raiser: '📋 My Support',
  resolver: '🛠️ Resolver Panel',
  admin: '⚙️ Admin Panel',
  'qa-reviewer': '✅ QA Review',
  auditor: '🔍 Audit View',
};

export default function Sidebar({ open, onClose }) {
  const { user } = useAuth();
  if (!user) return null;

  const links = ROLE_LINKS[user.role] || ROLE_LINKS.raiser;

  return (
    <>
      {open && <div className="sidebar-overlay" onClick={onClose} />}
      <aside className={`app-sidebar ${open ? 'open' : ''}`}>
        <div className="sidebar-header">
          <span className="sidebar-title">{ROLE_TITLES[user.role] || '📋 Menu'}</span>
          <button className="sidebar-close" onClick={onClose}><X size={18} /></button>
        </div>
        <nav className="sidebar-nav">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={onClose}
            >
              <link.icon size={18} />
              <span>{link.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-module-label">eQMS Modules</div>
          <div className="sidebar-modules">
            {['TMS', 'CMS', 'CCN', 'CAPA', 'DEV', 'NTF'].map((m) => (
              <span key={m} className="module-chip">{m}</span>
            ))}
          </div>
        </div>
      </aside>
    </>
  );
}

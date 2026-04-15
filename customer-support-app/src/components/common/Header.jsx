import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { api } from '../../services/api';
import {
  LogOut, Headphones, Bell, Search, Menu, X, Check, CheckCheck, ExternalLink
} from 'lucide-react';
import './Header.css';

const ROLE_LABELS = {
  raiser: 'Request Raiser',
  resolver: 'Support Resolver',
  admin: 'Administrator',
  'qa-reviewer': 'QA Reviewer',
  auditor: 'Auditor',
};

export default function Header({ onToggleSidebar }) {
  const { user, logout } = useAuth();
  const { onlineUsers, socket } = useSocket();
  const [notifications, setNotifications] = useState([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [showSearch, setShowSearch] = useState(false);
  const notifRef = useRef(null);
  const searchRef = useRef(null);
  const searchTimer = useRef(null);

  useEffect(() => {
    if (!user) return;
    api.getNotifications(user.id).then(setNotifications).catch(() => {});
  }, [user]);

  useEffect(() => {
    if (!socket || !user) return;
    const handler = (notif) => {
      if (notif.userId === user.id) {
        setNotifications((prev) => [notif, ...prev]);
      }
    };
    socket.on('notification:new', handler);
    return () => socket.off('notification:new', handler);
  }, [socket, user]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifs(false);
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowSearch(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markRead = async (id) => {
    await api.markNotificationRead(id).catch(() => {});
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
  };

  const markAllRead = async () => {
    await api.markAllNotificationsRead(user.id).catch(() => {});
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleSearch = (q) => {
    setSearchQuery(q);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (!q.trim()) { setSearchResults(null); return; }
    searchTimer.current = setTimeout(async () => {
      try {
        const results = await api.search(q);
        setSearchResults(results);
        setShowSearch(true);
      } catch { setSearchResults(null); }
    }, 300);
  };

  if (!user) return null;

  const timeAgo = (date) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <header className="app-header">
      <div className="header-left">
        <button className="menu-toggle" onClick={onToggleSidebar}>
          <Menu size={20} />
        </button>
        <div className="header-brand">
          <Headphones size={24} className="brand-icon" />
          <div>
            <h1 className="brand-title">eQMS Support</h1>
            <span className="brand-sub">Customer Support System</span>
          </div>
        </div>
      </div>

      <div className="header-center" ref={searchRef}>
        <div className="header-search">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search tickets, KB, messages..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => searchResults && setShowSearch(true)}
          />
          {searchQuery && (
            <button className="search-clear" onClick={() => { setSearchQuery(''); setSearchResults(null); setShowSearch(false); }}>
              <X size={14} />
            </button>
          )}
        </div>
        {showSearch && searchResults && (
          <div className="search-dropdown">
            {searchResults.tickets?.length > 0 && (
              <div className="search-section">
                <div className="search-section-title">Tickets</div>
                {searchResults.tickets.slice(0, 5).map((t) => (
                  <div key={t.id} className="search-result-item">
                    <span className="search-result-id">{t.id}</span>
                    <span className="search-result-text">{t.title}</span>
                    <span className={`search-result-badge priority-${t.priority?.toLowerCase()}`}>{t.priority}</span>
                  </div>
                ))}
              </div>
            )}
            {searchResults.kbArticles?.length > 0 && (
              <div className="search-section">
                <div className="search-section-title">Knowledge Base</div>
                {searchResults.kbArticles.slice(0, 3).map((a) => (
                  <div key={a.id} className="search-result-item">
                    <span className="search-result-text">{a.title}</span>
                    <span className="search-result-tag">{a.module}</span>
                  </div>
                ))}
              </div>
            )}
            {searchResults.emails?.length > 0 && (
              <div className="search-section">
                <div className="search-section-title">Emails</div>
                {searchResults.emails.slice(0, 3).map((e) => (
                  <div key={e.id} className="search-result-item">
                    <span className="search-result-text">{e.subject}</span>
                  </div>
                ))}
              </div>
            )}
            {!searchResults.tickets?.length && !searchResults.kbArticles?.length && !searchResults.emails?.length && (
              <div className="search-empty">No results found for "{searchQuery}"</div>
            )}
          </div>
        )}
      </div>

      <div className="header-right">
        <div className="online-indicator">
          <span className="online-dot" />
          <span>{onlineUsers.length} Online</span>
        </div>

        {/* Notification Bell */}
        <div className="notif-wrapper" ref={notifRef}>
          <button className="header-icon-btn" title="Notifications" onClick={() => setShowNotifs(!showNotifs)}>
            <Bell size={18} />
            {unreadCount > 0 && <span className="notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
          </button>
          {showNotifs && (
            <div className="notif-dropdown">
              <div className="notif-dropdown-header">
                <h4>Notifications</h4>
                {unreadCount > 0 && (
                  <button className="notif-mark-all" onClick={markAllRead}>
                    <CheckCheck size={14} /> Mark all read
                  </button>
                )}
              </div>
              <div className="notif-dropdown-list">
                {notifications.length === 0 ? (
                  <div className="notif-empty">No notifications yet</div>
                ) : (
                  notifications.slice(0, 20).map((n) => (
                    <div
                      key={n.id}
                      className={`notif-item ${n.read ? '' : 'unread'} notif-type-${n.type || 'info'}`}
                      onClick={() => markRead(n.id)}
                    >
                      <div className="notif-item-dot" />
                      <div className="notif-item-content">
                        <div className="notif-item-title">{n.title}</div>
                        <div className="notif-item-message">{n.message}</div>
                        <div className="notif-item-time">{timeAgo(n.createdAt)}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="header-user">
          <div className="user-avatar" data-role={user.role}>
            {user.avatar}
          </div>
          <div className="user-info">
            <span className="user-name">{user.name}</span>
            <span className="user-role">{ROLE_LABELS[user.role] || user.role}</span>
          </div>
        </div>
        <button className="header-icon-btn logout-btn" onClick={logout} title="Logout">
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}

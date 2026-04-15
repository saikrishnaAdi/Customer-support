import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { api } from '../../services/api';
import {
  Mail, Send, Inbox, Clock, ChevronDown, ChevronUp, RefreshCw,
  User, Paperclip, Eye, ArrowRight, X, FileText, Image, FileSpreadsheet, File, Download
} from 'lucide-react';
import './EmailCompose.css';

export default function EmailCompose({ ticketId, ticketTitle, ticketModule }) {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCompose, setShowCompose] = useState(false);
  const [sending, setSending] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [files, setFiles] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);
  const [form, setForm] = useState({
    to: '',
    subject: `[${ticketId}] `,
    body: '',
  });

  const MAX_FILE_SIZE = 25 * 1024 * 1024;
  const ALLOWED_TYPES = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.csv', '.zip', '.rar'];

  const getFileIcon = (name) => {
    const ext = name.split('.').pop().toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return <Image size={14} className="att-icon-img" />;
    if (['xls', 'xlsx', 'csv'].includes(ext)) return <FileSpreadsheet size={14} className="att-icon-sheet" />;
    if (['pdf', 'doc', 'docx', 'ppt', 'pptx', 'txt'].includes(ext)) return <FileText size={14} className="att-icon-doc" />;
    return <File size={14} className="att-icon-other" />;
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const addFiles = useCallback((newFiles) => {
    const valid = [];
    for (const file of newFiles) {
      const ext = '.' + file.name.split('.').pop().toLowerCase();
      if (!ALLOWED_TYPES.includes(ext)) continue;
      if (file.size > MAX_FILE_SIZE) continue;
      if (files.some((f) => f.name === file.name && f.size === file.size)) continue;
      valid.push(file);
    }
    if (valid.length) setFiles((prev) => [...prev, ...valid]);
  }, [files]);

  const removeFile = (index) => setFiles((prev) => prev.filter((_, i) => i !== index));

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files?.length) addFiles(Array.from(e.dataTransfer.files));
  }, [addFiles]);

  const loadEmails = () => {
    setLoading(true);
    api.getTicketEmails(ticketId)
      .then((data) => setEmails(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadEmails();
  }, [ticketId]);

  // Listen for new emails in real-time
  useEffect(() => {
    if (!socket) return;
    const handler = (email) => {
      if (email.ticketId === ticketId) {
        setEmails((prev) => [email, ...prev]);
      }
    };
    socket.on('email:sent', handler);
    return () => socket.off('email:sent', handler);
  }, [socket, ticketId]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!form.to.trim() || !form.subject.trim() || !form.body.trim()) return;
    setSending(true);
    try {
      // Upload files first if any
      let uploadedFiles = [];
      if (files.length > 0) {
        const formData = new FormData();
        files.forEach((f) => formData.append('files', f));
        const uploadRes = await fetch('http://localhost:4000/api/upload', {
          method: 'POST',
          body: formData,
        });
        if (uploadRes.ok) {
          const data = await uploadRes.json();
          uploadedFiles = data.files;
        }
      }

      await api.sendEmail({
        from: user.email,
        fromName: user.name,
        to: form.to.trim(),
        toName: form.to.trim(),
        subject: form.subject.trim(),
        body: form.body.trim(),
        ticketId,
        attachments: uploadedFiles,
      });
      setForm({ to: '', subject: `[${ticketId}] `, body: '' });
      setFiles([]);
      setShowCompose(false);
    } catch (err) {
      console.error('Send email failed:', err);
    } finally {
      setSending(false);
    }
  };

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'ticket-confirmation': return 'Confirmation';
      case 'resolver-notification': return 'Notification';
      case 'status-update': return 'Status Update';
      case 'user-compose': return 'Composed';
      default: return 'Email';
    }
  };

  const getTypeClass = (type) => {
    switch (type) {
      case 'ticket-confirmation': return 'type-confirmation';
      case 'resolver-notification': return 'type-notification';
      case 'status-update': return 'type-status';
      case 'user-compose': return 'type-compose';
      default: return '';
    }
  };

  const isMyEmail = (email) => email.from === user.email;

  const formatDate = (d) => {
    const date = new Date(d);
    const now = new Date();
    const diffMs = now - date;
    if (diffMs < 60000) return 'Just now';
    if (diffMs < 3600000) return `${Math.floor(diffMs / 60000)}m ago`;
    if (diffMs < 86400000) return `${Math.floor(diffMs / 3600000)}h ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="email-compose-panel">
      {/* Header */}
      <div className="email-header">
        <div className="email-header-left">
          <Mail size={16} />
          <span>Emails</span>
          <span className="email-count">{emails.length}</span>
        </div>
        <div className="email-header-actions">
          <button className="email-icon-btn" onClick={loadEmails} title="Refresh">
            <RefreshCw size={14} />
          </button>
          <button
            className={`email-compose-btn ${showCompose ? 'active' : ''}`}
            onClick={() => setShowCompose(!showCompose)}
          >
            <Send size={14} />
            {showCompose ? 'Cancel' : 'Compose'}
          </button>
        </div>
      </div>

      {/* Compose Form */}
      {showCompose && (
        <form className="email-form" onSubmit={handleSend}>
          <div className="email-form-field">
            <label>From</label>
            <input type="text" value={`${user.name} <${user.email}>`} disabled />
          </div>
          <div className="email-form-field">
            <label>To</label>
            <input
              type="email"
              placeholder="recipient@example.com"
              value={form.to}
              onChange={(e) => setForm({ ...form, to: e.target.value })}
              required
            />
          </div>
          <div className="email-form-field">
            <label>Subject</label>
            <input
              type="text"
              placeholder="Email subject..."
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              required
            />
          </div>
          <div className="email-form-field">
            <label>Body</label>
            <textarea
              placeholder="Type your message here..."
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              rows={6}
              required
            />
          </div>
          {/* Attachments */}
          <div className="email-form-field">
            <label>Attachments</label>
            <div
              className={`email-drop-zone ${dragOver ? 'drag-active' : ''}`}
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={(e) => { e.preventDefault(); setDragOver(false); }}
              onClick={() => fileInputRef.current?.click()}
            >
              <Paperclip size={16} />
              <span>Drop files here or <strong>browse</strong></span>
              <span className="email-drop-hint">Max 25 MB · Images, PDFs, Docs, Spreadsheets</span>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept={ALLOWED_TYPES.join(',')}
                style={{ display: 'none' }}
                onChange={(e) => {
                  if (e.target.files?.length) addFiles(Array.from(e.target.files));
                  e.target.value = '';
                }}
              />
            </div>
            {files.length > 0 && (
              <div className="email-file-list">
                {files.map((file, i) => (
                  <div key={`${file.name}-${i}`} className="email-file-item">
                    <div className="email-file-icon">{getFileIcon(file.name)}</div>
                    <div className="email-file-info">
                      <span className="email-file-name">{file.name}</span>
                      <span className="email-file-size">{formatSize(file.size)}</span>
                    </div>
                    <button
                      type="button"
                      className="email-file-remove"
                      onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
                <div className="email-file-summary">
                  {files.length} file{files.length > 1 ? 's' : ''} · {formatSize(files.reduce((a, f) => a + f.size, 0))}
                </div>
              </div>
            )}
          </div>
          <div className="email-form-actions">
            <button type="button" className="email-cancel-btn" onClick={() => setShowCompose(false)}>
              Cancel
            </button>
            <button type="submit" className="email-send-btn" disabled={sending}>
              {sending ? <span className="email-spinner" /> : <Send size={14} />}
              {sending ? 'Sending...' : 'Send Email'}
            </button>
          </div>
        </form>
      )}

      {/* Email List */}
      <div className="email-list">
        {loading ? (
          <div className="email-loading">
            <div className="spinner" />
            <span>Loading emails...</span>
          </div>
        ) : emails.length === 0 ? (
          <div className="email-empty">
            <Inbox size={32} />
            <p>No emails for this ticket yet</p>
            <span>Compose an email or wait for notifications</span>
          </div>
        ) : (
          emails.map((email) => (
            <div
              key={email.id}
              className={`email-item ${expandedId === email.id ? 'expanded' : ''} ${isMyEmail(email) ? 'sent' : 'received'}`}
            >
              <div className="email-item-header" onClick={() => toggleExpand(email.id)}>
                <div className="email-item-avatar">
                  {isMyEmail(email) ? (
                    <ArrowRight size={14} />
                  ) : (
                    <Inbox size={14} />
                  )}
                </div>
                <div className="email-item-summary">
                  <div className="email-item-top">
                    <span className="email-item-from">
                      {isMyEmail(email) ? `To: ${email.toName || email.to}` : `From: ${email.fromName || email.from}`}
                    </span>
                    <span className={`email-type-badge ${getTypeClass(email.type)}`}>
                      {getTypeLabel(email.type)}
                    </span>
                  </div>
                  <div className="email-item-subject">{email.subject}</div>
                  <div className="email-item-meta">
                    <Clock size={11} />
                    <span>{formatDate(email.sentAt)}</span>
                  </div>
                </div>
                <div className="email-item-expand">
                  {expandedId === email.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </div>
              </div>

              {expandedId === email.id && (
                <div className="email-item-body">
                  <div className="email-body-meta">
                    <div><strong>From:</strong> {email.fromName} &lt;{email.from}&gt;</div>
                    <div><strong>To:</strong> {email.toName || email.to} &lt;{email.to}&gt;</div>
                    <div><strong>Date:</strong> {new Date(email.sentAt).toLocaleString()}</div>
                  </div>
                  <div className="email-body-content">
                    {email.body.split('\n').map((line, i) => (
                      <p key={i}>{line || '\u00A0'}</p>
                    ))}
                  </div>
                  {email.attachments && email.attachments.length > 0 && (
                    <div className="email-attachments">
                      <div className="email-attachments-label">
                        <Paperclip size={12} />
                        {email.attachments.length} Attachment{email.attachments.length > 1 ? 's' : ''}
                      </div>
                      <div className="email-attachments-list">
                        {email.attachments.map((att) => (
                          <a
                            key={att.id}
                            className="email-attachment-chip"
                            href={`http://localhost:4000${att.url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={`Download ${att.originalName}`}
                          >
                            {getFileIcon(att.originalName)}
                            <span className="att-chip-name">{att.originalName}</span>
                            <span className="att-chip-size">{formatSize(att.size)}</span>
                            <Download size={11} />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

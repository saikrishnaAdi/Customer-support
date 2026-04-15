import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { api } from '../../services/api';
import { MODULES } from '../../data/constants';
import EmailCompose from '../common/EmailCompose';
import { StatusBadge, PriorityBadge, ModuleBadge } from '../common/StatusBadge';
import {
  ArrowLeft, Clock, User, Star, MessageSquare, ThumbsUp,
  AlertTriangle, History, Mail, Send, FileText,
  Paperclip, Download, Eye, X, ChevronDown, Smile,
  Bold, Italic, Code, ExternalLink, Video, RotateCcw, MoreVertical
} from 'lucide-react';
import './RequestDetail.css';

export default function RequestDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();

  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [feedbackCategories, setFeedbackCategories] = useState([]);
  const [showHistory, setShowHistory] = useState(true);
  const [showEmailCompose, setShowEmailCompose] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [typing, setTyping] = useState(null);

  const bottomRef = useRef(null);
  const typingTimerRef = useRef(null);

  useEffect(() => { api.getTicket(id).then(setTicket).catch(() => {}).finally(() => setLoading(false)); }, [id]);
  useEffect(() => { if (!id) return; api.getMessages(id).then(setMessages).catch(() => {}); }, [id]);

  useEffect(() => {
    if (!socket) return;
    const handler = (updated) => { if (updated.id === id) setTicket(updated); };
    socket.on('ticket:updated', handler);
    return () => socket.off('ticket:updated', handler);
  }, [socket, id]);

  useEffect(() => {
    if (!socket || !id) return;
    const handler = (msg) => setMessages((prev) => [...prev, msg]);
    const typingHandler = ({ userName }) => {
      setTyping(userName);
      clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => setTyping(null), 2000);
    };
    socket.on('chat:' + id, handler);
    socket.on('chat:typing:' + id, typingHandler);
    return () => { socket.off('chat:' + id, handler); socket.off('chat:typing:' + id, typingHandler); };
  }, [socket, id]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const FEEDBACK_CATEGORIES = ['Delay', 'Behavior', 'Quality', 'Resolution', 'Communication'];
  const toggleCategory = (cat) => setFeedbackCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);

  const handleRate = async () => {
    if (!rating) return;
    await api.updateTicket(id, { rating, feedback, feedbackCategories, status: 'Closed', updatedBy: user.name });
  };

  const sendMessage = useCallback(() => {
    if (!input.trim() || !socket) return;
    socket.emit('chat:message', { ticketId: id, senderId: user.id, senderName: user.name, text: input.trim(), type: 'text' });
    setInput('');
  }, [input, socket, id, user]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
    else { socket?.emit('chat:typing', { ticketId: id, userName: user.name }); }
  };

  const formatTime = (ts) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const formatDate = (ts) => {
    const d = new Date(ts); const now = new Date(); const diff = now - d; const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now'; if (mins < 60) return mins + 'm ago';
    const hrs = Math.floor(mins / 60); if (hrs < 24) return hrs + 'h ago'; return d.toLocaleDateString();
  };

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;
  if (!ticket) return <div className="error-state">Ticket not found</div>;

  const ticketAge = formatDate(ticket.createdAt);

  return (
    <div className="zd-workspace raiser-view">
      <div className="zd-topbar">
        <div className="zd-topbar-left">
          <button className="zd-back-btn" onClick={() => navigate('/raiser/requests')}><ArrowLeft size={16} /></button>
          <div className="zd-topbar-tab active">
            <span className={'zd-tab-dot status-dot-' + ticket.status?.toLowerCase().replace(/\s+/g, '-')} />
            {ticket.id}
          </div>
        </div>
        <div className="zd-topbar-right">
          <span className="zd-conv-badge"><MessageSquare size={14} /> {messages.length}</span>
        </div>
      </div>

      <div className="zd-breadcrumb">
        <span>My Requests</span>
        <span className="zd-bc-sep">&rsaquo;</span>
        <StatusBadge status={ticket.status} />
        <span className="zd-bc-sep">&rsaquo;</span>
        <span className="zd-bc-bold">Ticket {ticket.id}</span>
      </div>

      <div className="zd-main">
        {/* LEFT */}
        <aside className="zd-left">
          <div className="zd-field"><label>Status</label><StatusBadge status={ticket.status} /></div>
          <div className="zd-field"><label>Priority</label><PriorityBadge priority={ticket.priority} /></div>
          <div className="zd-field"><label>Module</label><ModuleBadge module={ticket.module} /></div>
          {ticket.category && <div className="zd-field"><label>Category</label><span className="zd-val">{ticket.category}</span></div>}
          <hr className="zd-hr" />
          <div className="zd-field"><label>Assigned To</label><span className="zd-val">{ticket.resolverName || 'Pending Assignment'}</span></div>
          <div className="zd-field"><label>Created</label><span className="zd-val">{new Date(ticket.createdAt).toLocaleString()}</span></div>
          {ticket.slaDeadline && (
            <div className="zd-field">
              <label>SLA Deadline</label>
              <span className="zd-val">{new Date(ticket.slaDeadline).toLocaleString()}</span>
              {ticket.slaBreached && <span className="zd-sla-breach">{"\u26A0"} SLA Breached</span>}
            </div>
          )}
          <hr className="zd-hr" />
          {/* Rating (when Resolved) */}
          {ticket.status === 'Resolved' && !ticket.rating && (
            <div className="zd-rating-section">
              <label>Rate Your Experience</label>
              <div className="zd-stars">{[1,2,3,4,5].map(s => <button key={s} className={'zd-star' + (s <= rating ? ' on' : '')} onClick={() => setRating(s)}><Star size={20} /></button>)}</div>
              <textarea className="zd-rate-text" placeholder="Share your feedback (optional)..." value={feedback} onChange={e => setFeedback(e.target.value)} rows={3} />
              <div className="zd-rate-cats">
                <span className="zd-rate-label">Areas to improve:</span>
                <div className="zd-rate-chips">{FEEDBACK_CATEGORIES.map(cat => <button key={cat} className={'zd-rate-chip' + (feedbackCategories.includes(cat) ? ' on' : '')} onClick={() => toggleCategory(cat)}>{cat}</button>)}</div>
              </div>
              <button className="zd-btn pri" onClick={handleRate} disabled={!rating}><ThumbsUp size={14} /> Submit & Close</button>
            </div>
          )}
        </aside>

        {/* CENTER */}
        <main className="zd-center">
          <div className="zd-title-bar">
            <h2>{ticket.title}</h2>
            <div className="zd-title-actions">
              <button className="zd-icon-btn" title="Refresh" onClick={() => api.getMessages(id).then(setMessages)}><RotateCcw size={16} /></button>
            </div>
          </div>
          <div className="zd-meta-bar"><span className="zd-age">{ticketAge}</span><span className="zd-via">Via {ticket.channel || 'support portal'}</span></div>

          <div className="zd-thread">
            <div className="zd-msg">
              <div className="zd-msg-av">{ticket.raiserName?.[0]}</div>
              <div className="zd-msg-body">
                <div className="zd-msg-hd"><strong>{ticket.raiserName} (You)</strong><span>{formatDate(ticket.createdAt)}</span></div>
                <p>{ticket.description}</p>
                {ticket.attachments?.length > 0 && (
                  <div className="zd-atts">{ticket.attachments.map((att, i) => {
                    const isImg = /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(att.name);
                    const url = 'http://localhost:4000/uploads/' + (att.storedName || att.name);
                    return <div key={i} className="zd-att">{isImg ? <div className="zd-att-img" onClick={() => setPreviewImage(url)}><img src={url} alt={att.name} /><div className="zd-att-ov"><Eye size={14} /></div></div> : <FileText size={16} />}<span>{att.name}</span><a href={url} download={att.name}><Download size={12} /></a></div>;
                  })}</div>
                )}
              </div>
            </div>

            {messages.map((msg) => {
              const isMtg = msg.text?.startsWith('\uD83D\uDCF9 Meeting Link:');
              const isInternal = msg.type === 'internal';
              if (isInternal) return null;
              return (
                <div key={msg.id} className="zd-msg">
                  <div className="zd-msg-av">{msg.senderName?.[0]}</div>
                  <div className="zd-msg-body">
                    <div className="zd-msg-hd"><strong>{msg.senderName}{msg.senderId === user.id ? ' (You)' : ''}</strong><span>{formatTime(msg.timestamp)}</span></div>
                    {isMtg ? <div className="zd-mtg-link"><Video size={16} /><a href={msg.text.replace('\uD83D\uDCF9 Meeting Link: ', '')} target="_blank" rel="noopener noreferrer">{msg.text.replace('\uD83D\uDCF9 Meeting Link: ', '')}<ExternalLink size={12} /></a></div> : <p>{msg.text}</p>}
                  </div>
                </div>
              );
            })}
            {typing && <div className="zd-typing"><span className="zd-dots"><span /><span /><span /></span>{typing} is typing...</div>}
            <div ref={bottomRef} />
          </div>

          <div className="zd-reply">
            <div className="zd-reply-tabs">
              <button className="zd-rt on">{"\u2190"} Reply</button>
              <span className="zd-rt-who">{ticket.resolverName || 'Support Team'}</span>
            </div>
            <div className="zd-reply-box">
              <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown} placeholder="Type your reply..." rows={3} />
              <div className="zd-reply-tools">
                <button title="Attach"><Paperclip size={14} /></button>
                <button title="Emoji"><Smile size={14} /></button>
                <button title="Bold"><Bold size={14} /></button>
                <button title="Italic"><Italic size={14} /></button>
              </div>
            </div>
            <div className="zd-reply-footer">
              <button className="zd-email-btn" onClick={() => setShowEmailCompose(!showEmailCompose)}><Mail size={14} /> Email</button>
              <button className="zd-submit" onClick={sendMessage} disabled={!input.trim()}>Send Reply<ChevronDown size={14} /></button>
            </div>
          </div>

          {showEmailCompose && <div className="zd-email-panel"><div className="zd-email-hdr"><h4><Mail size={14} /> Email</h4><button onClick={() => setShowEmailCompose(false)}><X size={16} /></button></div><EmailCompose ticketId={ticket.id} ticketTitle={ticket.title} ticketModule={ticket.module} /></div>}
        </main>

        {/* RIGHT */}
        <aside className="zd-right">
          <div className="zd-cust-card">
            <div className="zd-cust-hdr">
              <span className="zd-cust-av">{ticket.resolverName?.[0] || '?'}</span>
              <h4>{ticket.resolverName || 'Unassigned'}</h4>
              <button className="zd-icon-btn" onClick={() => setShowHistory(!showHistory)}><ChevronDown size={14} className={showHistory ? 'rot' : ''} /></button>
            </div>
            {showHistory && (
              <div className="zd-cust-body">
                <div className="zd-cust-row"><span>Role</span><span>Support Resolver</span></div>
                <div className="zd-cust-row"><span>Status</span><StatusBadge status={ticket.status} /></div>
              </div>
            )}
          </div>
          <div className="zd-hist">
            <div className="zd-hist-hdr"><h4>Ticket Timeline</h4></div>
            <div className="zd-hist-list">
              <div className="zd-hist-item cur"><div className={'zd-hist-dot status-dot-' + ticket.status?.toLowerCase().replace(/\s+/g, '-')} /><div><strong>{ticket.title}</strong><span>{ticketAge}</span><span>Status {ticket.status}</span></div></div>
              {ticket.history?.slice(0, 10).map((h, i) => <div key={i} className="zd-hist-item"><div className="zd-hist-dot" /><div><span>{h.detail}</span><span className="zd-hist-meta">{h.by} {"\u00B7"} {formatDate(h.at)}</span></div></div>)}
            </div>
          </div>
        </aside>
      </div>

      {previewImage && (
        <div className="zd-modal-ov" onClick={() => setPreviewImage(null)}>
          <div className="zd-img-modal" onClick={e => e.stopPropagation()}>
            <button className="zd-img-close" onClick={() => setPreviewImage(null)}><X size={20} /></button>
            <img src={previewImage} alt="Preview" />
          </div>
        </div>
      )}
    </div>
  );
}

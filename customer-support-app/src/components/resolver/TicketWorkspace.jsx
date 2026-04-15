import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { api } from '../../services/api';
import { MODULES, CATEGORIES, PRIORITIES } from '../../data/constants';
import EmailCompose from '../common/EmailCompose';
import { StatusBadge, PriorityBadge, ModuleBadge } from '../common/StatusBadge';
import {
  ArrowLeft, UserPlus, Clock, User, AlertTriangle,
  MessageSquare, FileText, ChevronDown, Save,
  Paperclip, Download, Eye, X, Mail, Send,
  ArrowUpRight, Timer, Link2, ExternalLink, Video,
  Tag, Smile, Bold, Italic, Code,
  MoreVertical, Filter, SlidersHorizontal, RotateCcw
} from 'lucide-react';
import './TicketWorkspace.css';

export default function TicketWorkspace() {
  const { id } = useParams();
  const { user } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();

  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [replyMode, setReplyMode] = useState('public');
  const [showResolve, setShowResolve] = useState(false);
  const [resolution, setResolution] = useState('');
  const [previewImage, setPreviewImage] = useState(null);
  const [meetingLink, setMeetingLink] = useState('');
  const [showMeetingInput, setShowMeetingInput] = useState(false);
  const [showCustomerDetails, setShowCustomerDetails] = useState(true);
  const [showEmailCompose, setShowEmailCompose] = useState(false);
  const [typing, setTyping] = useState(null);

  const bottomRef = useRef(null);
  const typingTimerRef = useRef(null);

  useEffect(() => {
    api.getTicket(id).then(setTicket).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!id) return;
    api.getMessages(id).then(setMessages).catch(() => {});
  }, [id]);

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

  const assignToMe = async () => { await api.updateTicket(id, { resolverId: user.id, status: 'Open', updatedBy: user.name }); };
  const updateStatus = async (status) => { await api.updateTicket(id, { status, updatedBy: user.name }); };
  const resolveTicket = async () => { await api.updateTicket(id, { status: 'Resolved', updatedBy: user.name, resolution }); setShowResolve(false); };
  const handleEscalate = async () => {
    if (!confirm('Escalate this ticket to the next level?')) return;
    try { await api.escalateTicket(id, { reason: 'Manual escalation by resolver', escalatedBy: user.name }); const updated = await api.getTicket(id); setTicket(updated); } catch {}
  };

  const sendMessage = useCallback(() => {
    if (!input.trim() || !socket) return;
    socket.emit('chat:message', { ticketId: id, senderId: user.id, senderName: user.name, text: input.trim(), type: replyMode === 'internal' ? 'internal' : 'text' });
    setInput('');
  }, [input, socket, id, user, replyMode]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
    else { socket?.emit('chat:typing', { ticketId: id, userName: user.name }); }
  };

  const sendMeetingLink = () => {
    if (!meetingLink.trim() || !socket) return;
    socket.emit('chat:message', { ticketId: id, senderId: user.id, senderName: user.name, text: '\uD83D\uDCF9 Meeting Link: ' + meetingLink.trim(), type: 'text' });
    setMeetingLink(''); setShowMeetingInput(false);
  };

  const formatTime = (ts) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const formatDate = (ts) => {
    const d = new Date(ts); const now = new Date(); const diff = now - d; const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now'; if (mins < 60) return mins + 'm ago';
    const hrs = Math.floor(mins / 60); if (hrs < 24) return hrs + 'h ago'; return d.toLocaleDateString();
  };

  const getSlaInfo = () => {
    if (!ticket?.slaDeadline) return null;
    const now = Date.now(); const deadline = new Date(ticket.slaDeadline).getTime(); const remaining = deadline - now;
    const totalSla = deadline - new Date(ticket.createdAt).getTime(); const elapsed = now - new Date(ticket.createdAt).getTime();
    const pct = Math.min(100, (elapsed / totalSla) * 100);
    if (ticket.slaBreached || remaining <= 0) return { label: 'BREACHED', color: '#ef4444', pct: 100, breached: true };
    const hrs = Math.floor(remaining / 3600000); const mins = Math.floor((remaining % 3600000) / 60000);
    if (pct >= 75) return { label: hrs + 'h ' + mins + 'm left', color: '#f59e0b', pct, breached: false };
    return { label: hrs + 'h ' + mins + 'm left', color: '#22c55e', pct, breached: false };
  };

  const slaInfo = getSlaInfo();
  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;
  if (!ticket) return <div className="error-state">Ticket not found</div>;

  const isAssignedToMe = ticket.resolverId === user.id;
  const isResolved = ticket.status === 'Resolved' || ticket.status === 'Closed';
  const ticketAge = formatDate(ticket.createdAt);

  return (
    <div className="zd-workspace">
      <div className="zd-topbar">
        <div className="zd-topbar-left">
          <button className="zd-back-btn" onClick={() => navigate('/resolver/queue')}><ArrowLeft size={16} /></button>
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
        <span>{ticket.raiserDept || 'Organization'}</span>
        <span className="zd-bc-sep">&rsaquo;</span>
        <span>{ticket.raiserName}</span>
        <span className="zd-bc-sep">&rsaquo;</span>
        <StatusBadge status={ticket.status} />
        <span className="zd-bc-sep">&rsaquo;</span>
        <span className="zd-bc-bold">Ticket {ticket.id}</span>
      </div>

      <div className="zd-main">
        {/* LEFT */}
        <aside className="zd-left">
          <div className="zd-field"><label>Requester</label><div className="zd-user-chip"><span className="zd-avatar">{ticket.raiserName?.[0]}</span>{ticket.raiserName}</div></div>
          <div className="zd-field"><label>Assignee*</label>{ticket.resolverName ? <div className="zd-user-chip"><span className="zd-avatar res">{ticket.resolverName?.[0]}</span>{ticket.resolverName}</div> : <button className="zd-assign-btn" onClick={assignToMe}><UserPlus size={14} /> Assign to Me</button>}</div>
          <div className="zd-field"><label>Followers</label><button className="zd-link-btn">follow</button></div>
          <hr className="zd-hr" />
          <div className="zd-field"><label>Tags</label><div className="zd-tags"><span className="zd-tag">{ticket.module}</span>{ticket.category && <span className="zd-tag">{ticket.category}</span>}</div></div>
          <div className="zd-row">
            <div className="zd-field half"><label>Type</label><span className="zd-val">{ticket.category || '-'}</span></div>
            <div className="zd-field half"><label>Priority</label><PriorityBadge priority={ticket.priority} /></div>
          </div>
          <div className="zd-field"><label>Module</label><ModuleBadge module={ticket.module} /></div>
          {slaInfo && !isResolved && (
            <div className={'zd-sla ' + (slaInfo.breached ? 'breached' : slaInfo.pct >= 75 ? 'warn' : 'ok')}>
              <div className="zd-sla-top"><Timer size={12} /><span>SLA</span><span style={{color: slaInfo.color, fontWeight: 700}}>{slaInfo.label}</span></div>
              <div className="zd-sla-bar"><div style={{width: slaInfo.pct + '%', background: slaInfo.color}} /></div>
            </div>
          )}
          <hr className="zd-hr" />
          <div className="zd-field"><label>Escalation</label><div className="zd-esc-row"><span>{ticket.escalationLevel || 'L1'}</span>{isAssignedToMe && !isResolved && <button className="zd-esc-btn" onClick={handleEscalate}><ArrowUpRight size={12} /> Escalate</button>}</div></div>
          <div className="zd-field"><label>Meeting Link</label><button className="zd-meeting-btn" onClick={() => setShowMeetingInput(!showMeetingInput)}><Video size={14} /> Share Link</button>
            {showMeetingInput && <div className="zd-mt-input"><input type="url" placeholder="Paste Meet/Teams/Zoom link..." value={meetingLink} onChange={(e) => setMeetingLink(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && sendMeetingLink()} /><button onClick={sendMeetingLink} disabled={!meetingLink.trim()}><Send size={12} /></button></div>}
          </div>
          {ticket.linkedRecords?.length > 0 && (
            <div className="zd-field"><label>Linked Records</label><div className="zd-linked">{ticket.linkedRecords.map((r, i) => <span key={i} className="zd-lr"><Link2 size={10} /> {r.type} {r.id}</span>)}</div></div>
          )}
          <hr className="zd-hr" />
          {isAssignedToMe && !isResolved && (
            <div className="zd-field"><label>Status</label><div className="zd-status-btns">{['Open','In Progress','Awaiting User'].map(s => <button key={s} className={'zd-st-btn' + (ticket.status === s ? ' on' : '')} onClick={() => updateStatus(s)} disabled={ticket.status === s}>{s}</button>)}</div></div>
          )}
        </aside>

        {/* CENTER */}
        <main className="zd-center">
          <div className="zd-title-bar">
            <h2>{ticket.title}</h2>
            <div className="zd-title-actions">
              <button className="zd-icon-btn" title="Refresh" onClick={() => api.getMessages(id).then(setMessages)}><RotateCcw size={16} /></button>
              <button className="zd-icon-btn"><MoreVertical size={16} /></button>
            </div>
          </div>
          <div className="zd-meta-bar"><span className="zd-age">{ticketAge}</span><span className="zd-via">Via {ticket.channel || 'support portal'}</span></div>

          <div className="zd-thread">
            {/* Original description */}
            <div className="zd-msg">
              <div className="zd-msg-av">{ticket.raiserName?.[0]}</div>
              <div className="zd-msg-body">
                <div className="zd-msg-hd"><strong>{ticket.raiserName}</strong><span>{formatDate(ticket.createdAt)}</span></div>
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

            {/* Messages */}
            {messages.map((msg) => {
              const isInternal = msg.type === 'internal';
              const isMtg = msg.text?.startsWith('\uD83D\uDCF9 Meeting Link:');
              return (
                <div key={msg.id} className={'zd-msg' + (isInternal ? ' internal' : '')}>
                  <div className="zd-msg-av">{msg.senderName?.[0]}</div>
                  <div className="zd-msg-body">
                    <div className="zd-msg-hd"><strong>{msg.senderName}</strong>{isInternal && <span className="zd-int-badge">{"\uD83D\uDD12"} Internal</span>}<span>{formatTime(msg.timestamp)}</span></div>
                    {isMtg ? <div className="zd-mtg-link"><Video size={16} /><a href={msg.text.replace('\uD83D\uDCF9 Meeting Link: ', '')} target="_blank" rel="noopener noreferrer">{msg.text.replace('\uD83D\uDCF9 Meeting Link: ', '')}<ExternalLink size={12} /></a></div> : <p>{msg.text}</p>}
                  </div>
                </div>
              );
            })}
            {typing && <div className="zd-typing"><span className="zd-dots"><span /><span /><span /></span>{typing} is typing...</div>}
            <div ref={bottomRef} />
          </div>

          {/* Reply */}
          <div className="zd-reply">
            <div className="zd-reply-tabs">
              <button className={'zd-rt' + (replyMode === 'public' ? ' on' : '')} onClick={() => setReplyMode('public')}>{"\u2190"} Public reply</button>
              <button className={'zd-rt' + (replyMode === 'internal' ? ' on' : '')} onClick={() => setReplyMode('internal')}>{"\uD83D\uDD12"} Internal note</button>
              <span className="zd-rt-who">{replyMode === 'public' ? (ticket.raiserName + ', ' + (ticket.resolverName || user.name)) : 'Only support staff'}</span>
            </div>
            <div className={'zd-reply-box' + (replyMode === 'internal' ? ' int' : '')}>
              <textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown} placeholder={replyMode === 'internal' ? 'Write an internal note...' : 'Type your reply...'} rows={3} />
              <div className="zd-reply-tools">
                <button title="Attach"><Paperclip size={14} /></button>
                <button title="Emoji"><Smile size={14} /></button>
                <button title="Bold"><Bold size={14} /></button>
                <button title="Italic"><Italic size={14} /></button>
                <button title="Code"><Code size={14} /></button>
              </div>
            </div>
            <div className="zd-reply-footer">
              <button className="zd-email-btn" onClick={() => setShowEmailCompose(!showEmailCompose)}><Mail size={14} /> Email</button>
              <div className="zd-reply-right">
                {isAssignedToMe && !isResolved && <button className="zd-resolve-btn" onClick={() => setShowResolve(true)}>{"\u2705"} Resolve</button>}
                <button className={'zd-submit' + (replyMode === 'internal' ? ' int' : '')} onClick={sendMessage} disabled={!input.trim()}>{replyMode === 'internal' ? 'Add Note' : 'Submit as Pending'}<ChevronDown size={14} /></button>
              </div>
            </div>
          </div>

          {showEmailCompose && <div className="zd-email-panel"><div className="zd-email-hdr"><h4><Mail size={14} /> Email</h4><button onClick={() => setShowEmailCompose(false)}><X size={16} /></button></div><EmailCompose ticketId={ticket.id} ticketTitle={ticket.title} ticketModule={ticket.module} /></div>}

          {showResolve && (
            <div className="zd-modal-ov" onClick={() => setShowResolve(false)}>
              <div className="zd-modal" onClick={e => e.stopPropagation()}>
                <h3>Resolve Ticket</h3>
                <textarea placeholder="Resolution summary..." value={resolution} onChange={e => setResolution(e.target.value)} rows={4} />
                <div className="zd-modal-acts"><button className="zd-btn sec" onClick={() => setShowResolve(false)}>Cancel</button><button className="zd-btn pri" onClick={resolveTicket} disabled={!resolution.trim()}><Save size={14} /> Resolve</button></div>
              </div>
            </div>
          )}
        </main>

        {/* RIGHT */}
        <aside className="zd-right">
          <div className="zd-cust-card">
            <div className="zd-cust-hdr">
              <span className="zd-cust-av">{ticket.raiserName?.[0]}</span>
              <h4>{ticket.raiserName}</h4>
              <button className="zd-icon-btn" onClick={() => setShowCustomerDetails(!showCustomerDetails)}><ChevronDown size={14} className={showCustomerDetails ? 'rot' : ''} /></button>
            </div>
            {showCustomerDetails && (
              <div className="zd-cust-body">
                <div className="zd-cust-row"><span>Email</span><span className="zd-link">{ticket.raiserEmail || (ticket.raiserName?.toLowerCase().replace(/\s/g, '.') + '@company.com')}</span></div>
                <div className="zd-cust-row"><span>Department</span><span>{ticket.raiserDept || 'N/A'}</span></div>
                <div className="zd-cust-row"><span>Local time</span><span>{new Date().toLocaleString('en-US', { weekday: 'short', hour: '2-digit', minute: '2-digit', timeZoneName: 'short' })}</span></div>
                <div className="zd-cust-row"><span>Language</span><span>English</span></div>
                <div className="zd-cust-notes"><span>Notes</span><textarea placeholder="Add user notes" rows={2} /></div>
              </div>
            )}
          </div>

          <div className="zd-hist">
            <div className="zd-hist-hdr"><h4>Interaction history</h4><button className="zd-icon-btn"><RotateCcw size={14} /></button></div>
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

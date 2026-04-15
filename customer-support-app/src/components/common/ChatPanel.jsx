import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { api } from '../../services/api';
import { Send, Paperclip, Smile, Image, FileText, MessageSquare } from 'lucide-react';
import './ChatPanel.css';

export default function ChatPanel({ ticketId, otherUser }) {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(null);
  const [isInternal, setIsInternal] = useState(false);
  const bottomRef = useRef(null);
  const typingTimerRef = useRef(null);

  useEffect(() => {
    if (!ticketId) return;
    api.getMessages(ticketId).then(setMessages).catch(() => {});
  }, [ticketId]);

  useEffect(() => {
    if (!socket || !ticketId) return;

    const handler = (msg) => {
      setMessages((prev) => [...prev, msg]);
    };
    const typingHandler = ({ userName }) => {
      setTyping(userName);
      clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => setTyping(null), 2000);
    };

    socket.on(`chat:${ticketId}`, handler);
    socket.on(`chat:typing:${ticketId}`, typingHandler);

    return () => {
      socket.off(`chat:${ticketId}`, handler);
      socket.off(`chat:typing:${ticketId}`, typingHandler);
    };
  }, [socket, ticketId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = useCallback(() => {
    if (!input.trim() || !socket) return;
    socket.emit('chat:message', {
      ticketId,
      senderId: user.id,
      senderName: user.name,
      text: input.trim(),
      type: isInternal ? 'internal' : 'text',
    });
    setInput('');
  }, [input, socket, ticketId, user, isInternal]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    } else {
      socket?.emit('chat:typing', { ticketId, userName: user.name });
    }
  };

  const formatTime = (ts) => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="chat-panel">
      <div className="chat-header">
        <MessageSquare size={16} />
        <span className="chat-header-title">Chat</span>
        {otherUser && <span className="chat-header-sub">with {otherUser}</span>}
      </div>

      <div className="chat-messages">
        {messages.length === 0 && (
          <div className="chat-empty">
            <MessageSquare size={32} />
            <p>No messages yet. Start the conversation!</p>
          </div>
        )}
        {messages.map((msg) => {
          const isMe = msg.senderId === user.id;
          const isInternalMsg = msg.type === 'internal';
          return (
            <div
              key={msg.id}
              className={`chat-msg ${isMe ? 'me' : 'them'} ${isInternalMsg ? 'internal' : ''}`}
            >
              {!isMe && <div className="msg-avatar">{msg.senderName?.[0]}</div>}
              <div className="msg-bubble">
                {!isMe && <div className="msg-sender">{msg.senderName}</div>}
                {isInternalMsg && <div className="msg-internal-tag">🔒 Internal Note</div>}
                <div className="msg-text">{msg.text}</div>
                <div className="msg-time">{formatTime(msg.timestamp)}</div>
              </div>
            </div>
          );
        })}
        {typing && (
          <div className="chat-typing">
            <span className="typing-dots"><span /><span /><span /></span>
            {typing} is typing...
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="chat-input-area">
        {user.role === 'resolver' && (
          <div className="chat-input-options">
            <label className={`internal-toggle ${isInternal ? 'active' : ''}`}>
              <input
                type="checkbox"
                checked={isInternal}
                onChange={(e) => setIsInternal(e.target.checked)}
              />
              🔒 Internal Note
            </label>
          </div>
        )}
        <div className="chat-input-row">
          <button className="chat-action-btn" title="Attach file">
            <Paperclip size={16} />
          </button>
          <button className="chat-action-btn" title="Send image">
            <Image size={16} />
          </button>
          <textarea
            className="chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isInternal ? 'Write an internal note...' : 'Type a message...'}
            rows={1}
          />
          <button
            className={`chat-send-btn ${input.trim() ? 'active' : ''}`}
            onClick={sendMessage}
            disabled={!input.trim()}
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { Monitor, MonitorOff, Shield, ShieldAlert, MousePointer2, X, Hand, Share2, Eye, Keyboard, Mouse, Minimize2, Maximize2 } from 'lucide-react';
import './RemoteControl.css';

const ICE_SERVERS = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

/**
 * Teams-like Remote Control:
 * 
 * RESOLVER can:
 *   - "Request Control" → asks raiser to share screen + grant control
 *   - "View Only" → asks raiser to share screen (no control)
 * 
 * RAISER can:
 *   - "Give Control" → proactively shares screen and grants control to resolver
 *   - Accept / Deny incoming requests
 *   - "Stop Sharing" → ends session at any time
 * 
 * During session:
 *   - Resolver sees raiser's screen in real-time
 *   - If control granted, resolver can send mouse/keyboard events
 *   - Either party can end the session
 */
export default function RemoteControl({ ticketId, remoteUserId, remoteUserName, compact = false }) {
  const { user } = useAuth();
  const { socket, remoteRequest, setRemoteRequest } = useSocket();

  // idle | requesting | waiting-accept | sharing | viewing | controlling
  const [state, setState] = useState('idle');
  const [controlGranted, setControlGranted] = useState(false);
  const [requestType, setRequestType] = useState(null);
  const [sessionLog, setSessionLog] = useState([]);
  const [remoteFullscreen, setRemoteFullscreen] = useState(false);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });

  const pcRef = useRef(null);
  const screenStreamRef = useRef(null);
  const videoRef = useRef(null);
  const remoteSocketRef = useRef(null);

  const addLog = useCallback((msg) => {
    setSessionLog((prev) => [...prev.slice(-9), { time: new Date().toLocaleTimeString(), msg }]);
  }, []);

  const cleanup = useCallback(() => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
    }
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    setState('idle');
    setControlGranted(false);
    setRequestType(null);
  }, []);

  /* ── RESOLVER Actions ─────────────────────────────── */

  // Resolver: Request control of raiser's screen
  const requestControl = useCallback(() => {
    if (!socket || !remoteUserId) return;
    setState('requesting');
    setRequestType('control');
    addLog('Requesting screen control...');
    socket.emit('remote:request', {
      to: remoteUserId,
      fromName: user.name,
      ticketId,
      requestType: 'control',
    });
  }, [socket, remoteUserId, user, ticketId, addLog]);

  // Resolver: Request view-only of raiser's screen
  const requestView = useCallback(() => {
    if (!socket || !remoteUserId) return;
    setState('requesting');
    setRequestType('view');
    addLog('Requesting screen view...');
    socket.emit('remote:request', {
      to: remoteUserId,
      fromName: user.name,
      ticketId,
      requestType: 'view',
    });
  }, [socket, remoteUserId, user, ticketId, addLog]);

  /* ── RAISER Actions ───────────────────────────────── */

  // Raiser: Proactively give control to resolver
  const giveControl = useCallback(async () => {
    if (!socket || !remoteUserId) return;
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: 'always' },
        audio: false,
      });
      screenStreamRef.current = stream;
      setState('sharing');
      setControlGranted(true);
      addLog('Screen sharing started with control granted');

      // Set up WebRTC peer connection
      const pc = new RTCPeerConnection(ICE_SERVERS);
      pcRef.current = pc;
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      pc.onicecandidate = (event) => {
        if (event.candidate && remoteSocketRef.current) {
          socket.emit('remote:rtc:ice-candidate', {
            socketId: remoteSocketRef.current,
            candidate: event.candidate,
          });
        }
      };

      // Notify resolver — they will accept and we'll get onOfferAccepted
      socket.emit('remote:offer-control', {
        to: remoteUserId,
        fromName: user.name,
        ticketId,
      });

      // When user stops sharing via browser UI
      stream.getVideoTracks()[0].onended = () => {
        addLog('Screen sharing stopped');
        socket.emit('remote:end', { socketId: remoteSocketRef.current, to: remoteUserId });
        cleanup();
      };
    } catch (err) {
      console.error('Screen share error:', err);
      addLog('Failed to start screen sharing');
      cleanup();
    }
  }, [socket, remoteUserId, user, ticketId, cleanup, addLog]);

  // Raiser: Accept an incoming remote request
  const acceptRequest = useCallback(async () => {
    if (!remoteRequest || !socket) return;
    remoteSocketRef.current = remoteRequest.socketId;
    const grantControl = remoteRequest.requestType === 'control';

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: 'always' },
        audio: false,
      });
      screenStreamRef.current = stream;
      setState('sharing');
      setControlGranted(grantControl);
      addLog(`Screen sharing started (${grantControl ? 'with control' : 'view only'})`);

      const pc = new RTCPeerConnection(ICE_SERVERS);
      pcRef.current = pc;
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('remote:rtc:ice-candidate', {
            socketId: remoteSocketRef.current,
            candidate: event.candidate,
          });
        }
      };

      // Send accept FIRST so resolver creates PC before receiving the offer
      socket.emit('remote:accept', {
        socketId: remoteRequest.socketId,
        controlGranted: grantControl,
      });
      setRemoteRequest(null);

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit('remote:rtc:offer', { socketId: remoteSocketRef.current, offer });

      // When user stops sharing via browser UI
      stream.getVideoTracks()[0].onended = () => {
        addLog('Screen sharing stopped');
        socket.emit('remote:end', { socketId: remoteSocketRef.current });
        cleanup();
      };
    } catch (err) {
      console.error('Screen share error:', err);
      addLog('Failed to start screen sharing');
      socket.emit('remote:reject', { socketId: remoteRequest.socketId });
      setRemoteRequest(null);
      cleanup();
    }
  }, [remoteRequest, socket, setRemoteRequest, cleanup, addLog]);

  // Raiser: Deny incoming request
  const rejectRequest = useCallback(() => {
    if (!remoteRequest || !socket) return;
    addLog('Denied remote request');
    socket.emit('remote:reject', { socketId: remoteRequest.socketId });
    setRemoteRequest(null);
  }, [remoteRequest, socket, setRemoteRequest, addLog]);

  // Raiser: Toggle control during active session
  const toggleControl = useCallback(() => {
    if (!socket || !remoteSocketRef.current) return;
    const newVal = !controlGranted;
    setControlGranted(newVal);
    socket.emit('remote:toggle-control', {
      socketId: remoteSocketRef.current,
      controlGranted: newVal,
    });
    addLog(newVal ? 'Control granted to resolver' : 'Control revoked');
  }, [socket, controlGranted, addLog]);

  // Either: End the session
  const endSession = useCallback(() => {
    addLog('Session ended');
    socket?.emit('remote:end', { socketId: remoteSocketRef.current, to: remoteUserId });
    cleanup();
  }, [socket, remoteUserId, cleanup, addLog]);

  /* ── WebRTC Signaling (Resolver side – receives stream) ── */
  useEffect(() => {
    if (!socket) return;

    const onAccepted = ({ socketId, controlGranted: granted }) => {
      remoteSocketRef.current = socketId;
      setState(granted ? 'controlling' : 'viewing');
      setControlGranted(granted);
      addLog(granted ? 'Control granted – you can interact' : 'View-only – watching screen');

      const pc = new RTCPeerConnection(ICE_SERVERS);
      pcRef.current = pc;

      pc.ontrack = (event) => {
        if (videoRef.current) videoRef.current.srcObject = event.streams[0];
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('remote:rtc:ice-candidate', { socketId, candidate: event.candidate });
        }
      };
    };

    // Resolver receives offer from raiser (who initiated give-control)
    const onOfferControl = async (data) => {
      remoteSocketRef.current = data.socketId;
      setState('controlling');
      setControlGranted(true);
      addLog(`${data.fromName} is sharing their screen with you (control granted)`);

      // Set up RTCPeerConnection to receive screen stream
      if (!pcRef.current) {
        const pc = new RTCPeerConnection(ICE_SERVERS);
        pcRef.current = pc;
        pc.ontrack = (event) => {
          if (videoRef.current) videoRef.current.srcObject = event.streams[0];
        };
        pc.onicecandidate = (event) => {
          if (event.candidate) {
            socket.emit('remote:rtc:ice-candidate', { socketId: data.socketId, candidate: event.candidate });
          }
        };
      }

      socket.emit('remote:accept-offer', { socketId: data.socketId });
    };

    // Raiser: resolver accepted give-control → now send WebRTC offer
    const onOfferAccepted = async ({ socketId }) => {
      remoteSocketRef.current = socketId;
      addLog('Resolver connected — sending screen stream...');
      if (pcRef.current) {
        const offer = await pcRef.current.createOffer();
        await pcRef.current.setLocalDescription(offer);
        socket.emit('remote:rtc:offer', { socketId, offer });
      }
    };

    const onOffer = async ({ offer, socketId }) => {
      remoteSocketRef.current = socketId;
      // Create PC if not yet created (handles race conditions)
      if (!pcRef.current) {
        const pc = new RTCPeerConnection(ICE_SERVERS);
        pcRef.current = pc;
        pc.ontrack = (event) => {
          if (videoRef.current) videoRef.current.srcObject = event.streams[0];
        };
        pc.onicecandidate = (event) => {
          if (event.candidate) {
            socket.emit('remote:rtc:ice-candidate', { socketId, candidate: event.candidate });
          }
        };
      }
      await pcRef.current.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pcRef.current.createAnswer();
      await pcRef.current.setLocalDescription(answer);
      socket.emit('remote:rtc:answer', { socketId, answer });
    };

    const onAnswer = async ({ answer }) => {
      if (pcRef.current) {
        await pcRef.current.setRemoteDescription(new RTCSessionDescription(answer));
      }
    };

    const onIceCandidate = async ({ candidate }) => {
      if (pcRef.current) {
        try { await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate)); } catch (e) { /* */ }
      }
    };

    const onToggleControl = ({ controlGranted: granted }) => {
      setControlGranted(granted);
      setState(granted ? 'controlling' : 'viewing');
      addLog(granted ? 'Control granted' : 'Control revoked – view only');
    };

    const onRejected = () => { setState('idle'); addLog('Request denied'); };
    const onEnded = () => { addLog('Remote session ended by other party'); cleanup(); };

    socket.on('remote:accepted', onAccepted);
    socket.on('remote:offer-control', onOfferControl);
    socket.on('remote:offer-accepted', onOfferAccepted);
    socket.on('remote:rtc:offer', onOffer);
    socket.on('remote:rtc:answer', onAnswer);
    socket.on('remote:rtc:ice-candidate', onIceCandidate);
    socket.on('remote:toggle-control', onToggleControl);
    socket.on('remote:rejected', onRejected);
    socket.on('remote:ended', onEnded);

    return () => {
      socket.off('remote:accepted', onAccepted);
      socket.off('remote:offer-control', onOfferControl);
      socket.off('remote:offer-accepted', onOfferAccepted);
      socket.off('remote:rtc:offer', onOffer);
      socket.off('remote:rtc:answer', onAnswer);
      socket.off('remote:rtc:ice-candidate', onIceCandidate);
      socket.off('remote:toggle-control', onToggleControl);
      socket.off('remote:rejected', onRejected);
      socket.off('remote:ended', onEnded);
    };
  }, [socket, cleanup, addLog]);

  /* ── Mouse / Keyboard forwarding (Resolver) ──────── */
  const handleMouseEvent = useCallback((e) => {
    if (!controlGranted || !videoRef.current || !socket) return;
    const rect = videoRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    if (x < 0 || x > 1 || y < 0 || y > 1) return;
    setCursorPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    socket.emit('remote:mouse', {
      socketId: remoteSocketRef.current,
      x, y, type: e.type, button: e.button,
    });
  }, [controlGranted, socket]);

  const handleKeyEvent = useCallback((e) => {
    if (!controlGranted || !socket) return;
    e.preventDefault();
    socket.emit('remote:keyboard', {
      socketId: remoteSocketRef.current,
      key: e.key,
      code: e.code,
      type: e.type,
      ctrlKey: e.ctrlKey,
      shiftKey: e.shiftKey,
      altKey: e.altKey,
    });
  }, [controlGranted, socket]);

  const handleScroll = useCallback((e) => {
    if (!controlGranted || !socket) return;
    socket.emit('remote:scroll', {
      socketId: remoteSocketRef.current,
      deltaX: e.deltaX,
      deltaY: e.deltaY,
    });
  }, [controlGranted, socket]);

  const isActive = state === 'sharing' || state === 'viewing' || state === 'controlling';

  /* ── RENDER ──────────────────────────────────────── */

  /* Incoming request popup — always portaled to body */
  const requestPopup = remoteRequest && state === 'idle' ? createPortal(
    <div className="remote-request-overlay">
      <div className="remote-request-modal">
        <div className="remote-request-icon">
          {remoteRequest.requestType === 'control' ? <Hand size={28} /> : <Eye size={28} />}
        </div>
        <h3>{remoteRequest.requestType === 'control' ? 'Control Request' : 'Screen View Request'}</h3>
        <p>
          <strong>{remoteRequest.fromName}</strong> is requesting to{' '}
          {remoteRequest.requestType === 'control' ? 'view and control your screen' : 'view your screen'}.
        </p>
        <div className="remote-request-warning">
          <ShieldAlert size={16} />
          <span>
            {remoteRequest.requestType === 'control'
              ? 'They will be able to see your screen and perform actions. You can revoke control at any time.'
              : 'They will only be able to see your screen. No control will be granted.'}
          </span>
        </div>
        <div className="remote-request-actions">
          <button className="remote-btn accept" onClick={acceptRequest}><Shield size={16} /> Allow</button>
          <button className="remote-btn reject" onClick={rejectRequest}><X size={16} /> Deny</button>
        </div>
      </div>
    </div>,
    document.body
  ) : null;

  /* Raiser: sharing overlay — portaled to body for full-screen */
  const sharingOverlay = state === 'sharing' ? createPortal(
    <div className="remote-sharing-bar">
      <div className="sharing-bar-inner">
        <div className="sharing-bar-left">
          <Monitor size={16} className="sharing-bar-pulse" />
          <span className="sharing-bar-text">
            You are sharing your screen
            {controlGranted
              ? <> — <strong>{remoteUserName}</strong> has control</>
              : <> — view only</>
            }
          </span>
        </div>
        <div className="sharing-bar-actions">
          <button className={`sharing-bar-btn ${controlGranted ? 'revoke' : 'grant'}`} onClick={toggleControl}>
            <Hand size={14} />
            {controlGranted ? 'Revoke Control' : 'Grant Control'}
          </button>
          <button className="sharing-bar-btn stop" onClick={endSession}>
            <MonitorOff size={14} /> Stop Sharing
          </button>
        </div>
      </div>
      {controlGranted && (
        <div className="sharing-control-indicator">
          <MousePointer2 size={14} />
          <span><strong>{remoteUserName}</strong> is controlling your screen</span>
        </div>
      )}
    </div>,
    document.body
  ) : null;

  /* Resolver: full-screen remote view — portaled to body */
  const viewingOverlay = (state === 'viewing' || state === 'controlling') ? createPortal(
    <div className={`remote-fullscreen-overlay ${remoteFullscreen ? 'maximized' : ''}`}>
      <div className="remote-fs-toolbar">
        <div className="remote-fs-toolbar-left">
          <div className="remote-fs-live"><span className="live-dot" /> LIVE</div>
          <span className="remote-fs-name">{remoteUserName}'s Screen</span>
        </div>
        <div className="remote-fs-toolbar-center">
          {controlGranted ? (
            <div className="remote-fs-mode controlling">
              <MousePointer2 size={14} /> Controlling — you can interact
            </div>
          ) : (
            <div className="remote-fs-mode viewing">
              <Eye size={14} /> View Only
            </div>
          )}
        </div>
        <div className="remote-fs-toolbar-right">
          <button className="remote-fs-btn" onClick={() => setRemoteFullscreen(f => !f)} title={remoteFullscreen ? 'Minimize' : 'Maximize'}>
            {remoteFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
          <button className="remote-fs-btn end" onClick={endSession}>
            <MonitorOff size={14} /> End Session
          </button>
        </div>
      </div>
      <div
        className="remote-fs-screen"
        onWheel={controlGranted ? handleScroll : undefined}
      >
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className={`remote-fs-video ${controlGranted ? 'controllable' : ''}`}
          onClick={handleMouseEvent}
          onMouseMove={controlGranted ? handleMouseEvent : undefined}
          onMouseDown={controlGranted ? handleMouseEvent : undefined}
          onMouseUp={controlGranted ? handleMouseEvent : undefined}
          onDoubleClick={controlGranted ? handleMouseEvent : undefined}
          onKeyDown={handleKeyEvent}
          onKeyUp={handleKeyEvent}
          tabIndex={controlGranted ? 0 : -1}
        />
        {controlGranted && (
          <div className="remote-fs-hints">
            <span><Mouse size={12} /> Click & move</span>
            <span><Keyboard size={12} /> Type to send keys</span>
          </div>
        )}
      </div>
      {controlGranted && (
        <div className="remote-fs-status">
          <MousePointer2 size={13} /> You are controlling {remoteUserName}'s screen · Click anywhere on the screen to interact
        </div>
      )}
    </div>,
    document.body
  ) : null;

  return (
    <div className={`remote-control ${compact ? 'compact' : ''}`}>

      {/* Portal overlays */}
      {requestPopup}
      {sharingOverlay}
      {viewingOverlay}

      {/* ─── IDLE STATE (inline in call panel) ─── */}
      {state === 'idle' && (
        <div className="remote-idle">
          <div className="remote-idle-header">
            <Monitor size={18} />
            <span>Screen Sharing & Remote Control</span>
          </div>

          {user.role === 'resolver' ? (
            <div className="remote-action-grid">
              <button className="remote-action-btn control" onClick={requestControl}>
                <div className="remote-action-icon"><Hand size={22} /></div>
                <div>
                  <strong>Request Control</strong>
                  <span>Take control of {remoteUserName || 'user'}'s screen</span>
                </div>
              </button>
              <button className="remote-action-btn view" onClick={requestView}>
                <div className="remote-action-icon view-icon"><Eye size={22} /></div>
                <div>
                  <strong>View Only</strong>
                  <span>Watch {remoteUserName || 'user'}'s screen</span>
                </div>
              </button>
            </div>
          ) : (
            <div className="remote-action-grid">
              <button className="remote-action-btn give" onClick={giveControl}>
                <div className="remote-action-icon give-icon"><Share2 size={22} /></div>
                <div>
                  <strong>Give Control</strong>
                  <span>Share your screen and let {remoteUserName || 'the resolver'} help</span>
                </div>
              </button>
            </div>
          )}

          <div className="remote-info-note">
            <Shield size={13} />
            <span>You can stop sharing or revoke control at any time.</span>
          </div>
        </div>
      )}

      {/* ─── REQUESTING / WAITING (inline) ─── */}
      {(state === 'requesting' || state === 'waiting-accept') && (
        <div className="remote-requesting">
          <div className="remote-spinner" />
          <p>
            {state === 'requesting'
              ? `Waiting for ${remoteUserName || 'user'} to accept...`
              : `Waiting for ${remoteUserName || 'resolver'} to connect...`}
          </p>
          <button className="remote-btn reject" onClick={() => { cleanup(); addLog('Cancelled'); }}>
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}

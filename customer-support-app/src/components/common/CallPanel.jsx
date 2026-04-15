import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import {
  Phone, Video, PhoneOff, Mic, MicOff, VideoOff, Monitor,
  Volume2, VolumeX, Maximize2, Minimize2, Circle, Square, Type
} from 'lucide-react';
import RemoteControl from './RemoteControl';
import './CallPanel.css';

const ICE_SERVERS = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

export default function CallPanel({ ticketId, remoteUserId, remoteUserName, onCallStateChange }) {
  const { user } = useAuth();
  const { socket, incomingCall, setIncomingCall, callAccepted, setCallAccepted } = useSocket();
  const [callState, setCallState] = useState('idle'); // idle | ringing | connected | ended
  const [callType, setCallType] = useState(null); // audio | video
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showRemote, setShowRemote] = useState(false);
  const [duration, setDuration] = useState(0);

  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);

  // Live captions state
  const [captionsOn, setCaptionsOn] = useState(false);
  const [caption, setCaption] = useState('');
  const recognitionRef = useRef(null);

  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const remoteSocketRef = useRef(null);
  const timerRef = useRef(null);

  // Notify parent of call connection state
  useEffect(() => {
    onCallStateChange?.(callState === 'connected');
  }, [callState, onCallStateChange]);

  const cleanup = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    // Stop recording
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    mediaRecorderRef.current = null;
    recordedChunksRef.current = [];
    setIsRecording(false);
    // Stop captions
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setCaptionsOn(false);
    setCaption('');

    clearInterval(timerRef.current);
    setCallState('idle');
    setCallType(null);
    setIsMuted(false);
    setIsVideoOff(false);
    setDuration(0);
  }, []);

  const setupPeerConnection = useCallback((stream) => {
    const pc = new RTCPeerConnection(ICE_SERVERS);
    pcRef.current = pc;

    stream.getTracks().forEach((track) => pc.addTrack(track, stream));

    pc.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('webrtc:ice-candidate', {
          socketId: remoteSocketRef.current,
          candidate: event.candidate,
        });
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        endCall();
      }
    };

    return pc;
  }, [socket]);

  const startCall = useCallback(async (type) => {
    if (!socket || !remoteUserId) return;
    setCallType(type);
    setCallState('ringing');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: type === 'video',
      });
      localStreamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;

      socket.emit('call:initiate', {
        to: remoteUserId,
        from: user.id,
        fromName: user.name,
        type,
        ticketId,
      });
    } catch (err) {
      console.error('Media error:', err);
      cleanup();
    }
  }, [socket, remoteUserId, user, ticketId, cleanup]);

  const acceptCall = useCallback(async () => {
    if (!incomingCall || !socket) return;
    const type = incomingCall.type;
    setCallType(type);
    setCallState('connected');
    remoteSocketRef.current = incomingCall.socketId;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: type === 'video',
      });
      localStreamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;

      const pc = setupPeerConnection(stream);

      socket.emit('call:accept', { socketId: incomingCall.socketId });
      setIncomingCall(null);
      setCallAccepted(false);

      timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
    } catch (err) {
      console.error('Media error:', err);
      cleanup();
    }
  }, [incomingCall, socket, setupPeerConnection, setIncomingCall, setCallAccepted, cleanup]);

  const rejectCall = useCallback(() => {
    if (!incomingCall || !socket) return;
    socket.emit('call:reject', { socketId: incomingCall.socketId });
    setIncomingCall(null);
    setCallAccepted(false);
  }, [incomingCall, socket, setIncomingCall, setCallAccepted]);

  // Auto-accept when user clicked Accept in the global incoming call overlay
  useEffect(() => {
    if (callAccepted && incomingCall && callState === 'idle' && socket) {
      acceptCall();
    }
  }, [callAccepted, incomingCall, callState, socket, acceptCall]);

  const endCall = useCallback(() => {
    socket?.emit('call:end', { socketId: remoteSocketRef.current, to: remoteUserId });
    cleanup();
  }, [socket, remoteUserId, cleanup]);

  // WebRTC signaling handlers
  useEffect(() => {
    if (!socket) return;

    const onAccepted = async ({ socketId }) => {
      remoteSocketRef.current = socketId;
      setCallState('connected');
      timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);

      if (localStreamRef.current) {
        const pc = setupPeerConnection(localStreamRef.current);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit('webrtc:offer', { socketId, offer });
      }
    };

    const onOffer = async ({ offer, socketId }) => {
      remoteSocketRef.current = socketId;
      if (pcRef.current && localStreamRef.current) {
        await pcRef.current.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pcRef.current.createAnswer();
        await pcRef.current.setLocalDescription(answer);
        socket.emit('webrtc:answer', { socketId, answer });
      } else if (localStreamRef.current) {
        const pc = setupPeerConnection(localStreamRef.current);
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit('webrtc:answer', { socketId, answer });
      }
    };

    const onAnswer = async ({ answer }) => {
      if (pcRef.current) {
        await pcRef.current.setRemoteDescription(new RTCSessionDescription(answer));
      }
    };

    const onIceCandidate = async ({ candidate }) => {
      if (pcRef.current) {
        try {
          await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) { /* ignore */ }
      }
    };

    const onEnded = () => cleanup();
    const onRejected = () => cleanup();

    socket.on('call:accepted', onAccepted);
    socket.on('webrtc:offer', onOffer);
    socket.on('webrtc:answer', onAnswer);
    socket.on('webrtc:ice-candidate', onIceCandidate);
    socket.on('call:ended', onEnded);
    socket.on('call:rejected', onRejected);

    return () => {
      socket.off('call:accepted', onAccepted);
      socket.off('webrtc:offer', onOffer);
      socket.off('webrtc:answer', onAnswer);
      socket.off('webrtc:ice-candidate', onIceCandidate);
      socket.off('call:ended', onEnded);
      socket.off('call:rejected', onRejected);
    };
  }, [socket, setupPeerConnection, cleanup]);

  const toggleMute = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((t) => (t.enabled = isMuted));
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((t) => (t.enabled = isVideoOff));
      setIsVideoOff(!isVideoOff);
    }
  };

  const formatDuration = (s) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  // ── Recording ──
  const toggleRecording = useCallback(() => {
    if (isRecording) {
      // Stop recording
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
    } else {
      // Start recording — capture remote + local audio
      const streams = [];
      if (remoteVideoRef.current?.srcObject) streams.push(remoteVideoRef.current.srcObject);
      if (localStreamRef.current) streams.push(localStreamRef.current);
      if (streams.length === 0) return;

      const audioCtx = new AudioContext();
      const dest = audioCtx.createMediaStreamDestination();
      streams.forEach((s) => {
        try { audioCtx.createMediaStreamSource(s).connect(dest); } catch (e) { /* ignore */ }
      });

      // If video call, include video track from remote
      const tracks = [...dest.stream.getTracks()];
      if (remoteVideoRef.current?.srcObject) {
        const videoTracks = remoteVideoRef.current.srcObject.getVideoTracks();
        if (videoTracks.length) tracks.push(videoTracks[0]);
      }
      const combinedStream = new MediaStream(tracks);

      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
        ? 'video/webm;codecs=vp9,opus'
        : MediaRecorder.isTypeSupported('video/webm')
          ? 'video/webm'
          : 'audio/webm';

      const recorder = new MediaRecorder(combinedStream, { mimeType });
      recordedChunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        if (recordedChunksRef.current.length > 0) {
          const blob = new Blob(recordedChunksRef.current, { type: mimeType });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `call-recording-${ticketId}-${Date.now()}.webm`;
          a.click();
          URL.revokeObjectURL(url);
        }
      };
      recorder.start(1000);
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    }
  }, [isRecording, ticketId]);

  // ── Live Captions (Web Speech API) ──
  const toggleCaptions = useCallback(() => {
    if (captionsOn) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
      setCaptionsOn(false);
      setCaption('');
    } else {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        alert('Live captions are not supported in this browser. Please use Chrome or Edge.');
        return;
      }
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        let interim = '';
        let final = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            final += transcript + ' ';
          } else {
            interim += transcript;
          }
        }
        setCaption(final || interim);
      };

      recognition.onerror = () => {};
      recognition.onend = () => {
        // Auto-restart if captions still on
        if (recognitionRef.current) {
          try { recognitionRef.current.start(); } catch (e) { /* ignore */ }
        }
      };

      recognition.start();
      recognitionRef.current = recognition;
      setCaptionsOn(true);
    }
  }, [captionsOn]);

  return (
    <div className="call-panel">
      {/* Incoming Call Modal — only show if global overlay hasn't already handled it */}
      {incomingCall && callState === 'idle' && !callAccepted && (
        <div className="call-incoming-overlay">
          <div className="call-incoming-modal">
            <div className="call-incoming-pulse" />
            <div className="call-incoming-icon">
              {incomingCall.type === 'video' ? <Video size={28} /> : <Phone size={28} />}
            </div>
            <h3>Incoming {incomingCall.type === 'video' ? 'Video' : 'Audio'} Call</h3>
            <p>{incomingCall.fromName}</p>
            <div className="call-incoming-actions">
              <button className="call-btn accept" onClick={acceptCall}>
                <Phone size={20} /> Accept
              </button>
              <button className="call-btn reject" onClick={rejectCall}>
                <PhoneOff size={20} /> Decline
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Call Controls (Idle) */}
      {callState === 'idle' && !incomingCall && (
        <div className="call-idle">
          <div className="call-idle-text">
            <Phone size={16} />
            <span>Communication</span>
          </div>
          <div className="call-buttons">
            <button className="call-start-btn audio" onClick={() => startCall('audio')} title="Audio Call">
              <Phone size={16} />
              <span>Audio Call</span>
            </button>
            <button className="call-start-btn video" onClick={() => startCall('video')} title="Video Call">
              <Video size={16} />
              <span>Video Call</span>
            </button>
          </div>
          {remoteUserName && <p className="call-target">Call {remoteUserName}</p>}
        </div>
      )}

      {/* Ringing */}
      {callState === 'ringing' && (
        <div className="call-ringing">
          <div className="call-ringing-animation">
            <Phone size={28} className="ringing-icon" />
          </div>
          <p>Calling {remoteUserName}...</p>
          <button className="call-btn reject" onClick={endCall}>
            <PhoneOff size={18} /> Cancel
          </button>
        </div>
      )}

      {/* Connected */}
      {callState === 'connected' && (
        <div className={`call-connected ${isFullscreen ? 'fullscreen' : ''}`}>
          <div className="call-video-area">
            <video ref={remoteVideoRef} autoPlay playsInline className="remote-video" />
            <video ref={localVideoRef} autoPlay playsInline muted className="local-video" />
            <div className="call-status-bar">
              <span className="call-connected-indicator" />
              <span>{remoteUserName || 'Connected'}</span>
              <span className="call-timer">{formatDuration(duration)}</span>
              {isRecording && <span className="recording-indicator"><Circle size={10} fill="#ef4444" /> REC</span>}
            </div>
            {/* Live Captions Overlay */}
            {captionsOn && caption && (
              <div className="captions-overlay">
                <div className="captions-text">{caption}</div>
              </div>
            )}
          </div>
          <div className="call-controls">
            <button className={`call-ctrl-btn ${isMuted ? 'active' : ''}`} onClick={toggleMute} title={isMuted ? 'Unmute' : 'Mute'}>
              {isMuted ? <MicOff size={18} /> : <Mic size={18} />}
            </button>
            {callType === 'video' && (
              <button className={`call-ctrl-btn ${isVideoOff ? 'active' : ''}`} onClick={toggleVideo} title={isVideoOff ? 'Turn on camera' : 'Turn off camera'}>
                {isVideoOff ? <VideoOff size={18} /> : <Video size={18} />}
              </button>
            )}
            <button className={`call-ctrl-btn ${isRecording ? 'recording' : ''}`} onClick={toggleRecording} title={isRecording ? 'Stop Recording' : 'Start Recording'}>
              {isRecording ? <Square size={16} /> : <Circle size={16} />}
            </button>
            <button className={`call-ctrl-btn ${captionsOn ? 'active' : ''}`} onClick={toggleCaptions} title={captionsOn ? 'Turn off captions' : 'Turn on captions'}>
              <Type size={18} />
            </button>
            <button className={`call-ctrl-btn ${showRemote ? 'active' : ''}`} onClick={() => setShowRemote((s) => !s)} title="Screen Share / Remote Control">
              <Monitor size={18} />
            </button>
            <button className="call-ctrl-btn" onClick={() => setIsFullscreen((f) => !f)} title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}>
              {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </button>
            <button className="call-ctrl-btn end-call" onClick={endCall} title="End Call">
              <PhoneOff size={20} />
              <span className="end-call-label">End</span>
            </button>
          </div>
          {/* Remote Control Panel (always mounted for socket events, panel toggled) */}
          <div className={`call-remote-panel ${showRemote ? 'visible' : ''}`}>
            <RemoteControl ticketId={ticketId} remoteUserId={remoteUserId} remoteUserName={remoteUserName} compact />
          </div>
        </div>
      )}
    </div>
  );
}

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { Phone, PhoneOff, Video } from 'lucide-react';
import './GlobalIncomingCall.css';

export default function GlobalIncomingCall() {
  const { user } = useAuth();
  const { socket, incomingCall, setIncomingCall, callAccepted, setCallAccepted } = useSocket();
  const navigate = useNavigate();

  if (!incomingCall || callAccepted) return null;

  const accept = () => {
    setCallAccepted(true);
    // Navigate to the ticket page so CallPanel mounts and auto-accepts
    const path = user.role === 'raiser'
      ? `/raiser/request/${incomingCall.ticketId}`
      : `/resolver/ticket/${incomingCall.ticketId}`;
    navigate(path);
  };

  const reject = () => {
    if (socket) {
      socket.emit('call:reject', { socketId: incomingCall.socketId });
    }
    setIncomingCall(null);
    setCallAccepted(false);
  };

  return (
    <div className="global-call-overlay">
      <div className="global-call-modal">
        <div className="global-call-pulse" />
        <div className="global-call-icon">
          {incomingCall.type === 'video' ? <Video size={28} /> : <Phone size={28} />}
        </div>
        <h3>Incoming {incomingCall.type === 'video' ? 'Video' : 'Audio'} Call</h3>
        <p>{incomingCall.fromName}</p>
        <div className="global-call-actions">
          <button className="global-call-btn accept" onClick={accept}>
            <Phone size={20} /> Accept
          </button>
          <button className="global-call-btn reject" onClick={reject}>
            <PhoneOff size={20} /> Decline
          </button>
        </div>
      </div>
    </div>
  );
}

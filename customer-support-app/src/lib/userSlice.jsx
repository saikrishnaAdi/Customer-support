// User state management — auth context re-export and role config

export { AuthProvider, useAuth } from '../contexts/AuthContext';
export { SocketProvider, useSocket } from '../contexts/SocketContext';

export const ROLE_CONFIG = {
  raiser: {
    label: 'Request Raiser',
    home: '/raiser',
    path: '/raiser/*',
  },
  resolver: {
    label: 'Request Resolver',
    home: '/resolver',
    path: '/resolver/*',
  },
};

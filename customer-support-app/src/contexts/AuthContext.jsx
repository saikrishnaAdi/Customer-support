import React, { createContext, useContext, useState, useCallback } from 'react';

const AuthContext = createContext(null);

const USERS = [
  { id: 'raiser-1', name: 'Anita Sharma', email: 'anita@pharma.com', role: 'raiser', department: 'Quality Control', avatar: 'AS' },
  { id: 'raiser-2', name: 'Raj Patel', email: 'raj@pharma.com', role: 'raiser', department: 'Production', avatar: 'RP' },
  { id: 'raiser-3', name: 'Meena Gupta', email: 'meena@pharma.com', role: 'raiser', department: 'QA', avatar: 'MG' },
  { id: 'resolver-1', name: 'David Chen', email: 'david@support.com', role: 'resolver', department: 'IT Support', avatar: 'DC', level: 'L2', specialties: ['TMS', 'CMS', 'CCN'] },
  { id: 'resolver-2', name: 'Sarah Johnson', email: 'sarah@support.com', role: 'resolver', department: 'IT Support', avatar: 'SJ', level: 'L1', specialties: ['CAPA', 'DEVIATION', 'NTF'] },
  { id: 'admin-1', name: 'Priya Nair', email: 'priya@pharma.com', role: 'admin', department: 'IT Admin', avatar: 'PN' },
  { id: 'qa-reviewer-1', name: 'Vikram Mehta', email: 'vikram@pharma.com', role: 'qa-reviewer', department: 'QA Head', avatar: 'VM' },
  { id: 'auditor-1', name: 'Linda Foster', email: 'linda@pharma.com', role: 'auditor', department: 'Compliance', avatar: 'LF' },
];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  const login = useCallback((userId) => {
    const found = USERS.find((u) => u.id === userId);
    if (found) {
      setUser(found);
      return found;
    }
    return null;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, users: USERS, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}

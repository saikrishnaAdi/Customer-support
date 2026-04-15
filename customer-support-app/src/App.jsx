import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import RaiserPage from './pages/RaiserPage';
import ResolverPage from './pages/ResolverPage';
import AdminPage from './pages/AdminPage';
import AuditorPage from './pages/AuditorPage';
import QAReviewerPage from './pages/QAReviewerPage';
import './App.css';

const ROLE_CONFIG = {
  raiser: { path: '/raiser/*', component: RaiserPage, home: '/raiser' },
  resolver: { path: '/resolver/*', component: ResolverPage, home: '/resolver' },
  admin: { path: '/admin/*', component: AdminPage, home: '/admin' },
  auditor: { path: '/auditor/*', component: AuditorPage, home: '/auditor' },
  'qa-reviewer': { path: '/qa-reviewer/*', component: QAReviewerPage, home: '/qa-reviewer' },
};

export default function App() {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const config = ROLE_CONFIG[user.role] || ROLE_CONFIG.raiser;
  const PageComponent = config.component;

  return (
    <>
      <Routes>
        <Route path={config.path} element={<PageComponent />} />
        <Route path="*" element={<Navigate to={config.home} replace />} />
      </Routes>
    </>
  );
}

// app/dashboard/page.jsx — Main dashboard page
// Renders raiser or resolver dashboard based on role

import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import RaiserDashboard from '../../components/raiser/RaiserDashboard';
import ResolverDashboard from '../../components/resolver/ResolverDashboard';

export default function DashboardPage() {
  const { user } = useAuth();

  if (user?.role === 'resolver') {
    return <ResolverDashboard />;
  }

  return <RaiserDashboard />;
}

// app/tickets/[id]/page.jsx — Individual ticket detail page
// Renders raiser's RequestDetail or resolver's TicketWorkspace based on role

import React from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import RequestDetail from '../../../components/raiser/RequestDetail';
import TicketWorkspace from '../../../components/resolver/TicketWorkspace';

export default function TicketDetailPage() {
  const { user } = useAuth();

  if (user?.role === 'resolver') {
    return <TicketWorkspace />;
  }

  return <RequestDetail />;
}

// app/tickets/page.jsx — Ticket list page
// Renders raiser's MyRequests or resolver's TicketQueue based on role

import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import MyRequests from '../../components/raiser/MyRequests';
import TicketQueue from '../../components/resolver/TicketQueue';

export default function TicketsPage() {
  const { user } = useAuth();

  if (user?.role === 'resolver') {
    return <TicketQueue />;
  }

  return <MyRequests />;
}

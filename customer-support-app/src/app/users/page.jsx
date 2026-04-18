// app/users/page.jsx — Users list page (support team view)

import React from 'react';
import { SUPPORT_TEAM } from '../../lib/supportModels';

export default function UsersPage() {
  return (
    <div style={{ padding: 24, maxWidth: 700, margin: '0 auto' }}>
      <h2 className="page-title">👥 Team</h2>
      <p className="page-subtitle">Support team members and availability</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 20 }}>
        {SUPPORT_TEAM.map((t, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 16 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg,#0ea5e9,#06b6d4)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 15 }}>
              {t.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div style={{ flex: 1 }}>
              <strong style={{ fontSize: 14, color: '#1e293b' }}>{t.name}</strong>
              <div style={{ fontSize: 12, color: '#16a34a', fontWeight: 500 }}>● {t.status}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{t.tickets} active</div>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>CSAT: {t.csat}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

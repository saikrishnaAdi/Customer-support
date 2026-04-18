// app/support/page.jsx — Help & FAQ page

import React from 'react';
import { FAQ_ITEMS } from '../../lib/supportModels';

export default function SupportPage() {
  return (
    <div style={{ padding: 24, maxWidth: 800, margin: '0 auto' }}>
      <h2 className="page-title">Help & FAQ</h2>
      <p className="page-subtitle">Frequently asked questions and guides</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 20 }}>
        {FAQ_ITEMS.map((faq, i) => (
          <details key={i} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '14px 16px' }}>
            <summary style={{ fontWeight: 600, fontSize: 14, color: '#1e293b', cursor: 'pointer' }}>{faq.q}</summary>
            <p style={{ fontSize: 14, color: '#475569', marginTop: 8, lineHeight: 1.6 }}>{faq.a}</p>
          </details>
        ))}
      </div>
    </div>
  );
}

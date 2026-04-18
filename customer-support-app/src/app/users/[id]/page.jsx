// app/users/[id]/page.jsx — Individual user profile page

import React from 'react';
import { useParams } from 'react-router-dom';
import { getUserById } from '../../../lib/userModels';

export default function UserDetailPage() {
  const { id } = useParams();
  const user = getUserById(id);

  if (!user) {
    return (
      <div style={{ padding: 24, textAlign: 'center', color: '#94a3b8' }}>
        <h3>User not found</h3>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, maxWidth: 500, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <div style={{ width: 56, height: 56, borderRadius: 14, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 20 }}>
          {user.avatar}
        </div>
        <div>
          <h2 style={{ margin: 0, fontSize: 18, color: '#1e293b' }}>{user.name}</h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>{user.email}</p>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ background: '#f8fafc', borderRadius: 10, padding: '12px 16px', display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, color: '#64748b' }}>Role</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{user.role}</span>
        </div>
        <div style={{ background: '#f8fafc', borderRadius: 10, padding: '12px 16px', display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, color: '#64748b' }}>Department</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{user.department}</span>
        </div>
        {user.level && (
          <div style={{ background: '#f8fafc', borderRadius: 10, padding: '12px 16px', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, color: '#64748b' }}>Level</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{user.level}</span>
          </div>
        )}
        {user.specialties && (
          <div style={{ background: '#f8fafc', borderRadius: 10, padding: '12px 16px', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, color: '#64748b' }}>Specialties</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{user.specialties.join(', ')}</span>
          </div>
        )}
      </div>
    </div>
  );
}

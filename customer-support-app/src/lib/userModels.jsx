// User-related constants and model helpers

export const ROLES = [
  { key: 'raiser', label: 'Request Raiser' },
  { key: 'resolver', label: 'Request Resolver' },
];

export const USERS = [
  { id: 'raiser-1', name: 'Anita Sharma', email: 'anita@pharma.com', role: 'raiser', department: 'Quality Control', avatar: 'AS' },
  { id: 'raiser-2', name: 'Raj Patel', email: 'raj@pharma.com', role: 'raiser', department: 'Production', avatar: 'RP' },
  { id: 'raiser-3', name: 'Meena Gupta', email: 'meena@pharma.com', role: 'raiser', department: 'QA', avatar: 'MG' },
  { id: 'resolver-1', name: 'David Chen', email: 'david@support.com', role: 'resolver', department: 'IT Support', avatar: 'DC', level: 'L2', specialties: ['TMS', 'CMS', 'CCN'] },
  { id: 'resolver-2', name: 'Sarah Johnson', email: 'sarah@support.com', role: 'resolver', department: 'IT Support', avatar: 'SJ', level: 'L1', specialties: ['CAPA', 'DEVIATION', 'NTF'] },
];

export function getUserById(id) {
  return USERS.find((u) => u.id === id) || null;
}

export function getUsersByRole(role) {
  return USERS.filter((u) => u.role === role);
}

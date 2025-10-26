// Simple in-memory mock data to test Dashboard rendering and linking from forms

export const mockUser = {
  id: 'u_mock_001',
  fullName: 'สมิทธิ์ ไม่มีนี่',
  email: 'aunh888@gmail.com',
  phone: '+66861234567',
  role: 'foreman',
  username: '+66861234567',
};

export const mockProjects = [
  { id: 'p1', name: 'โรงงานบางปู', ownerId: 'u_mock_001', createdAt: '2025-10-01' },
  { id: 'p2', name: 'คอนโดฝั่งธน', ownerId: 'u_mock_001', createdAt: '2025-10-10' },
];

export const mockSites = [
  { id: 's1', projectId: 'p1', name: 'ไซต์ A', location: 'สมุทรปราการ' },
  { id: 's2', projectId: 'p2', name: 'ไซต์ B', location: 'กรุงเทพฯ' },
];

export const mockTasks = [
  { id: 't1', projectId: 'p1', siteId: 's1', title: 'ติดตั้งแผ่นยิปซัม', priority: 'high', status: 'todo', assigneeUsername: '+66861234567', dueDate: '2025-07-15' },
  { id: 't2', projectId: 'p2', siteId: 's2', title: 'ผนังกั้นรอบ', priority: 'medium', status: 'todo', assigneeUsername: '+66861234567', dueDate: '2025-07-20' },
  { id: 't3', projectId: 'p1', siteId: 's1', title: 'การเดินสายไฟฟ้า', priority: 'low', status: 'todo', assigneeUsername: '+66861234567', dueDate: '2025-07-25' },
  { id: 't4', projectId: 'p2', siteId: 's2', title: 'ความปลอดภัยหน้างาน', priority: 'medium', status: 'in-progress', assigneeUsername: '+66861234567', dueDate: '2025-10-30' },
];

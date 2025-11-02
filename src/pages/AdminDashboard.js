import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './Dashboard.css';
import { mockUser } from '../mock/mockData';
import AdminUsersTable from './admin/AdminUsersTable';
import AdminQuizBank from './admin/AdminQuizBank';
import AdminAuditLog from './admin/AdminAuditLog';

const AdminDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const navUser = location.state?.user;
  const user = navUser || { ...mockUser, role: 'admin', username: '0863125891' };

  const [tab, setTab] = useState('overview');

  const kpis = useMemo(() => ([
    { label: 'Total Users', value: 42 },
    { label: 'Active Today', value: 17 },
    { label: 'Projects', value: 8 },
    { label: 'Pending Approvals', value: 3 },
  ]), []);

  return (
    <div className="dash-layout">
      <aside className="dash-sidebar">
        <nav className="menu">
          <button type="button" className={`menu-item ${tab==='overview'?'active':''}`} onClick={() => setTab('overview')}>Overview</button>
          <button type="button" className={`menu-item ${tab==='users'?'active':''}`} onClick={() => setTab('users')}>Users</button>
          <button type="button" className={`menu-item ${tab==='quiz'?'active':''}`} onClick={() => setTab('quiz')}>Skills & Quiz Bank</button>
          <button type="button" className={`menu-item ${tab==='audit'?'active':''}`} onClick={() => setTab('audit')}>Audit Log</button>
          <div style={{ height: 12 }} />
          <button type="button" className="menu-item" onClick={() => navigate('/dashboard', { state: { user: { ...user, role: 'foreman' } } })}>Impersonate Foreman</button>
          <button type="button" className="menu-item" onClick={() => navigate('/pm', { state: { user: { ...user, role: 'Project Manager' } } })}>Impersonate PM</button>
          <button type="button" className="menu-item" onClick={() => navigate('/skill-assessment', { state: { user: { ...user, role: 'worker' } } })}>Impersonate Worker</button>
        </nav>
      </aside>

      <main className="dash-main">
        <div className="dash-topbar">
          <div className="role-pill">Admin</div>
          <div className="top-actions">
            <span className="profile">
              <span className="avatar" />
              <span className="phone" style={{ marginLeft: '2rem' }}>{user.username}</span>
            </span>
          </div>
        </div>

        {tab === 'overview' && (
          <>
            <div className="pm-stats">
              {kpis.map((k) => (
                <div className="stat" key={k.label}>
                  <div className="label">{k.label}</div>
                  <div className="value">{k.value}</div>
                </div>
              ))}
            </div>
            <div className="pm-grid" style={{ marginTop: '1rem' }}>
              <div className="panel">
                <h2 className="panel-title">Recent activity</h2>
                <ul style={{ margin: 0, paddingLeft: '1rem' }}>
                  <li>ผู้ใช้ใหม่ 2 บัญชี</li>
                  <li>อัพเดตคำถามแบบทดสอบ 5 ข้อ</li>
                  <li>ปิดใช้งานผู้ใช้ 1 บัญชี</li>
                </ul>
              </div>
              <div className="panel">
                <h2 className="panel-title">Quick actions</h2>
                <div className="filter-pills">
                  <button className="pill" type="button" onClick={() => setTab('users')}>Create User</button>
                  <button className="pill" type="button" onClick={() => setTab('quiz')}>Import Questions</button>
                </div>
              </div>
            </div>
          </>
        )}

        {tab === 'users' && <AdminUsersTable />}
        {tab === 'quiz' && <AdminQuizBank />}
        {tab === 'audit' && <AdminAuditLog />}
      </main>
    </div>
  );
};

export default AdminDashboard;

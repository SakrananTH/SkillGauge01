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

  const [tab, setTab] = useState('users');

  return (
    <div className="dash-layout">
      <aside className="dash-sidebar">
        <nav className="menu">
          <button type="button" className={`menu-item ${tab==='users'?'active':''}`} onClick={() => setTab('users')}>Users</button>
          <button type="button" className={`menu-item ${tab==='quiz'?'active':''}`} onClick={() => setTab('quiz')}>Skills & Quiz Bank</button>
          <button type="button" className={`menu-item ${tab==='audit'?'active':''}`} onClick={() => setTab('audit')}>Audit Log</button>
          <div style={{ height: 12 }} />
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

        {tab === 'users' && <AdminUsersTable />}
        {tab === 'quiz' && <AdminQuizBank />}
        {tab === 'audit' && <AdminAuditLog />}
      </main>
    </div>
  );
};

export default AdminDashboard;

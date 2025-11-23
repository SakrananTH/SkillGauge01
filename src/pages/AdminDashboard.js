import React, { useMemo, useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './Dashboard.css';
import { mockUser } from '../mock/mockData';
import AdminOverview from './admin/AdminOverview';
import AdminUsersTable from './admin/AdminUsersTable';
import AdminQuizBank from './admin/AdminQuizBank';
import AdminAuditLog from './admin/AdminAuditLog';
import AdminSettings from './admin/AdminSettings';

const AdminDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const navUser = location.state?.user;
  const user = navUser || { ...mockUser, role: 'admin', username: '0863125891' };

  const [tab, setTab] = useState(location.state?.initialTab || 'overview');
  const [avatar, setAvatar] = useState(null);

  useEffect(() => {
    const storedAvatar = localStorage.getItem('admin_avatar');
    if (storedAvatar) {
      setAvatar(storedAvatar);
    }
  }, []);

  return (
    <div className="dash-layout">
      <aside className="dash-sidebar">
        <nav className="menu">
          <button type="button" className={`menu-item ${tab==='overview'?'active':''}`} onClick={() => setTab('overview')}>ภาพรวมระบบ</button>
          <button type="button" className={`menu-item ${tab==='users'?'active':''}`} onClick={() => setTab('users')}>จัดการผู้ใช้งาน</button>
          <button type="button" className={`menu-item ${tab==='quiz'?'active':''}`} onClick={() => setTab('quiz')}>จัดการคําถาม</button>
          <button type="button" className={`menu-item ${tab==='audit'?'active':''}`} onClick={() => setTab('audit')}>ประวัติการใช้งาน</button>
          <button type="button" className={`menu-item ${tab==='settings'?'active':''}`} onClick={() => setTab('settings')}>ตั้งค่า</button>
          <div style={{ height: 12 }} />
        </nav>
      </aside>

      <main className="dash-main">
        <div className="dash-topbar">
          <div className="role-pill">Admin</div>
          <div className="top-actions">
            <span className="profile">
              {avatar ? (
                <img src={avatar} alt="Profile" className="avatar-img" />
              ) : (
                <span className="avatar" />
              )}
              <span className="phone">{user.username}</span>
            </span>
          </div>
        </div>

        {tab === 'overview' && <AdminOverview setTab={setTab} />}
        {tab === 'users' && <AdminUsersTable />}
        {tab === 'quiz' && <AdminQuizBank />}
        {tab === 'audit' && <AdminAuditLog />}
        {tab === 'settings' && <AdminSettings onAvatarChange={setAvatar} />}
      </main>
    </div>
  );
};

export default AdminDashboard;

import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './Dashboard.css';
import { mockUser } from '../mock/mockData';

const AdminDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const navUser = location.state?.user;
  const user = navUser || { ...mockUser, role: 'admin', username: '0863125891' };

  return (
    <div className="dash-layout">
      <aside className="dash-sidebar">
        <nav className="menu">
          <button type="button" className="menu-item active">Admin</button>
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

        <div className="panel" style={{ marginTop: '1rem' }}>
          <h2 className="panel-title">Welcome, Admin</h2>
          <p>นี่คือแดชบอร์ดสำหรับผู้ดูแลระบบ (ตัวอย่าง). คุณสามารถสลับเข้าไปดูหน้าของแต่ละบทบาทเพื่อทดสอบ UI ได้จากเมนูซ้าย</p>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;

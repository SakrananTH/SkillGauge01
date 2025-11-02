import React from 'react';
import { mockAdminUsers } from '../../mock/mockData';

const AdminUsersTable = () => {
  const users = mockAdminUsers;
  return (
    <div className="panel" style={{ marginTop: '1rem' }}>
      <h2 className="panel-title">Users</h2>
      <div className="filters">
        <div className="search" style={{ maxWidth: 420 }}>
          <span role="img" aria-label="search">🔎</span>
          <input placeholder="ค้นหาผู้ใช้..." />
        </div>
        <div className="filter-pills">
          <select className="pill" defaultValue="">
            <option value="">All roles</option>
            <option value="admin">Admin</option>
            <option value="project_manager">Project Manager</option>
            <option value="foreman">Foreman</option>
            <option value="worker">Worker</option>
          </select>
        </div>
      </div>
      <div className="table" role="table" aria-label="Users table">
        <div className="thead" role="row">
          <div>ชื่อ-สกุล</div>
          <div>เบอร์โทร</div>
          <div>บทบาท</div>
          <div>สถานะ</div>
          <div>เข้าใช้ล่าสุด</div>
        </div>
        <div className="tbody">
          {users.map(u => (
            <div className="tr" role="row" key={u.id}>
              <div className="td">{u.fullName}</div>
              <div className="td">{u.phone}</div>
              <div className="td"><span className="pill small">{u.role}</span></div>
              <div className="td">{u.status}</div>
              <div className="td">{u.lastLogin || '-'}</div>
            </div>
          ))}
          {users.length === 0 && <div className="empty">ไม่พบผู้ใช้</div>}
        </div>
      </div>
    </div>
  );
};

export default AdminUsersTable;

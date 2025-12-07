import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminOverview.css';

const AdminOverview = ({ setTab }) => {
  const navigate = useNavigate();

  const [stats, setStats] = useState([
    { label: 'พนักงานทั้งหมด', value: 0, unit: 'คน', change: '-', trend: 'neutral', color: 'blue' },
    { label: 'รอตรวจสอบเอกสาร', value: 0, unit: 'รายการ', change: '-', trend: 'neutral', color: 'orange' },
    { label: 'แบบทดสอบที่ทำวันนี้', value: 0, unit: 'ครั้ง', change: '-', trend: 'neutral', color: 'green' },
    { label: 'ผู้ใช้งาน Active', value: 0, unit: 'คน', change: '-', trend: 'neutral', color: 'purple' },
  ]);

  const [recentActivities, setRecentActivities] = useState([]);

  useEffect(() => {
    // Load workers from localStorage
    const workers = JSON.parse(localStorage.getItem('admin_workers') || '[]');

    // Calculate Stats
    const total = workers.length;
    const active = workers.filter(w => w.status === 'active' || w.status === 'fulltime').length;
    // Assuming 'probation' might need doc check
    const pending = workers.filter(w => w.status === 'probation').length; 
    
    // Update Stats
    setStats([
      { label: 'พนักงานทั้งหมด', value: total, unit: 'คน', change: '-', trend: 'neutral', color: 'blue' },
      { label: 'รอตรวจสอบเอกสาร', value: pending, unit: 'รายการ', change: '-', trend: 'neutral', color: 'orange' },
      { label: 'แบบทดสอบที่ทำวันนี้', value: 0, unit: 'ครั้ง', change: '-', trend: 'neutral', color: 'green' }, // No data yet
      { label: 'ผู้ใช้งาน Active', value: active, unit: 'คน', change: '-', trend: 'neutral', color: 'purple' },
    ]);

    // Generate Activities from Workers (Newest first)
    const activities = workers
      .sort((a, b) => b.id - a.id) // Sort by timestamp desc
      .slice(0, 5) // Take top 5
      .map(w => {
        const timeDiff = Date.now() - w.id;
        let timeString = 'เมื่อสักครู่';
        const minutes = Math.floor(timeDiff / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) timeString = `${days} วันที่แล้ว`;
        else if (hours > 0) timeString = `${hours} ชั่วโมงที่แล้ว`;
        else if (minutes > 0) timeString = `${minutes} นาทีที่แล้ว`;

        return {
          id: w.id,
          user: w.name,
          action: 'ลงทะเบียนพนักงานใหม่',
          time: timeString,
          type: 'register'
        };
      });

    setRecentActivities(activities);

  }, []);

  return (
    <div className="admin-overview">
      <header className="admin-overview__header">
        <h2>ภาพรวมระบบ (System Overview)</h2>
        <p>สรุปสถานะและกิจกรรมล่าสุดในระบบ Skill Gauge</p>
      </header>

      <div className="admin-overview__stats">
        {stats.map((stat, index) => (
          <div key={index} className={`stat-card stat-card--${stat.color}`}>
            <div className="stat-card__content">
              <span className="stat-card__label">{stat.label}</span>
              <div className="stat-card__value-group">
                <span className="stat-card__value">{stat.value}</span>
                <span className="stat-card__unit">{stat.unit}</span>
              </div>
            </div>
            {/* Trend indicator removed or simplified as we don't have historical data yet */}
          </div>
        ))}
      </div>

      <div className="admin-overview__grid">
        <section className="overview-section">
          <div className="overview-section__header">
            <h3>กิจกรรมล่าสุด</h3>
            <button className="view-all-btn">ดูทั้งหมด</button>
          </div>
          <div className="activity-list">
            {recentActivities.length === 0 ? (
              <div style={{ padding: '1rem', color: '#718096', textAlign: 'center' }}>ยังไม่มีกิจกรรมล่าสุด</div>
            ) : (
              recentActivities.map(activity => (
                <div key={activity.id} className="activity-item">
                  <div className={`activity-icon type--${activity.type}`}>
                    {activity.type === 'register' && <svg  xmlns="http://www.w3.org/2000/svg" width={24} height={24} fill={"currentColor"} viewBox="0 0 24 24">{/* Boxicons v3.0.5 https://boxicons.com | License  https://docs.boxicons.com/free */}<path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2M5 19V5h14v14z"></path><path d="M7 7h10v2H7zM7 11h10v2H7zM7 15h10v2H7z"></path></svg>}
                    {activity.type === 'quiz' && '✅'}
                    {activity.type === 'system' && '⚙️'}
                    {activity.type === 'login' && '🔑'}
                  </div>
                  <div className="activity-details">
                    <span className="activity-user">{activity.user}</span>
                    <span className="activity-action">{activity.action}</span>
                  </div>
                  <span className="activity-time">{activity.time}</span>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="overview-section">
          <div className="overview-section__header">
            <h3>เมนูลัด (Quick Actions)</h3>
          </div>
          <div className="quick-actions-grid">
            <button className="quick-action-btn" onClick={() => setTab('users')}>
              <div className="quick-action-icon"><svg  xmlns="http://www.w3.org/2000/svg" width={24} height={24} fill={"currentColor"} viewBox="0 0 24 24">{/* Boxicons v3.0.5 https://boxicons.com | License  https://docs.boxicons.com/free */}<path d="M12 2A2 2 0 1 0 12 6 2 2 0 1 0 12 2z"></path><path d="M4 9 9 9 9 22 11 22 11 15 13 15 13 22 15 22 15 9 20 9 20 7 4 7 4 9z"></path></svg></div>
              <span>จัดการผู้ใช้งาน</span>
            </button>
            <button className="quick-action-btn" onClick={() => navigate('/admin/worker-registration')}>
              <div className="quick-action-icon"><svg  xmlns="http://www.w3.org/2000/svg" width={24} height={24} fill={"currentColor"} viewBox="0 0 24 24">{/* Boxicons v3.0.5 https://boxicons.com | License  https://docs.boxicons.com/free */}<path d="m19,3H5c-1.1,0-2,.9-2,2v14c0,1.1.9,2,2,2h14c1.1,0,2-.9,2-2V5c0-1.1-.9-2-2-2ZM5,19V5h14v14s-14,0-14,0Z"></path><path d="M8.5 10.5A1.5 1.5 0 1 0 8.5 13.5 1.5 1.5 0 1 0 8.5 10.5z"></path><path d="M11 11H17V13H11z"></path><path d="M7 7H17V9H7z"></path><path d="M7 15H17V17H7z"></path></svg></div>
              <span>ลงทะเบียนพนักงาน</span>
            </button>
            <button className="quick-action-btn" onClick={() => setTab('quiz')}>
              <div className="quick-action-icon"><svg  xmlns="http://www.w3.org/2000/svg" width={24} height={24} fill={"currentColor"} viewBox="0 0 24 24">{/* Boxicons v3.0.5 https://boxicons.com | License  https://docs.boxicons.com/free */}<path d="M8 6h9v2H8z"></path><path d="M20 2H6C4.35 2 3 3.35 3 5v14c0 1.65 1.35 3 3 3h15v-2H6c-.55 0-1-.45-1-1s.45-1 1-1h14c.55 0 1-.45 1-1V3c0-.55-.45-1-1-1m-6 14H6c-.35 0-.69.07-1 .18V5c0-.55.45-1 1-1h13v12z"></path></svg></div>
              <span>เพิ่มข้อสอบใหม่</span>
            </button>
            <button className="quick-action-btn" onClick={() => navigate('/admin/signup')}>
              <div className="quick-action-icon"><svg  xmlns="http://www.w3.org/2000/svg" width={24} height={24} fill={"currentColor"} viewBox="0 0 24 24">{/* Boxicons v3.0.5 https://boxicons.com | License  https://docs.boxicons.com/free */}<path d="M12 12c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5m0-8c1.65 0 3 1.35 3 3s-1.35 3-3 3-3-1.35-3-3 1.35-3 3-3M4 22h16c.55 0 1-.45 1-1v-1c0-3.86-3.14-7-7-7h-4c-3.86 0-7 3.14-7 7v1c0 .55.45 1 1 1m6-7h4c2.76 0 5 2.24 5 5H5c0-2.76 2.24-5 5-5"></path></svg></div>
              <span>สร้างบัญชี Login</span>
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AdminOverview;

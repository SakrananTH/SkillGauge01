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
                    {activity.type === 'register' && '📝'}
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
              <div className="quick-action-icon">👥</div>
              <span>จัดการผู้ใช้งาน</span>
            </button>
            <button className="quick-action-btn" onClick={() => navigate('/admin/worker-registration')}>
              <div className="quick-action-icon">📋</div>
              <span>ลงทะเบียนพนักงาน</span>
            </button>
            <button className="quick-action-btn" onClick={() => setTab('quiz')}>
              <div className="quick-action-icon">📚</div>
              <span>เพิ่มข้อสอบใหม่</span>
            </button>
            <button className="quick-action-btn" onClick={() => navigate('/admin/signup')}>
              <div className="quick-action-icon">🔐</div>
              <span>สร้างบัญชี Login</span>
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AdminOverview;

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminOverview.css';
import { apiRequest } from '../../utils/api';

const AdminOverview = () => {
  const navigate = useNavigate();

  // 1. ปรับ KPI ให้สะท้อน "คุณค่าหลัก" (Skill & Performance)
  const [stats, setStats] = useState([
    { label: 'คะแนนทักษะเฉลี่ย', value: 0, unit: '/ 100', change: '-', trend: 'neutral', color: 'blue', insight: 'กำลังประมวลผล...' },
    { label: 'ผ่านเกณฑ์มาตรฐาน', value: 0, unit: '%', change: '-', trend: 'neutral', color: 'green', insight: 'กำลังประมวลผล...' },
    { label: 'ต่ำกว่าเกณฑ์', value: 0, unit: 'คน', change: '-', trend: 'neutral', color: 'red', insight: 'กำลังประมวลผล...' },
    { label: 'จุดอ่อนที่ต้องพัฒนา', value: '-', unit: '', change: '', trend: 'neutral', color: 'orange', insight: 'กำลังประมวลผล...' },
  ]);

  const [pendingActions, setPendingActions] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [skillDistribution, setSkillDistribution] = useState([]);
  const [skillGapData, setSkillGapData] = useState([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);
  const [activitiesError, setActivitiesError] = useState('');

  useEffect(() => {
    let active = true;

    const loadOverview = async () => {
      try {
        setActivitiesLoading(true);
        setActivitiesError('');

        const response = await apiRequest('/api/admin/workers');
        const items = Array.isArray(response?.items)
          ? response.items
          : Array.isArray(response)
            ? response
            : [];

        if (!active) {
          return;
        }

        const totalWorkers = items.length;
        const pendingWorkers = items.filter(worker => worker.status === 'probation').length;
        
        // --- ดึงข้อมูล KPI จาก API ---
        let kpiData = {
          avgScore: 0,
          passRate: 0,
          belowThreshold: 0,
          weakestSkill: '-',
          trend: { avgScore: '-', passRate: '-', belowThreshold: '-' }
        };

        try {
          const statsResponse = await apiRequest('/api/admin/dashboard/stats');
          if (statsResponse) {
            kpiData = {
              avgScore: statsResponse.avgScore || 0,
              passRate: statsResponse.passRate || 0,
              belowThreshold: statsResponse.belowThreshold || 0,
              weakestSkill: statsResponse.weakestSkill || '-',
              trend: statsResponse.trend || { avgScore: '-', passRate: '-', belowThreshold: '-' }
            };
          }
        } catch (err) {
          console.warn('Failed to fetch dashboard stats, using fallback', err);
          // Fallback กรณี API ยังไม่พร้อม
          kpiData.avgScore = totalWorkers > 0 ? 72 : 0;
        }

        // --- ดึงข้อมูล Skill Gap Analysis จาก API ใหม่ ---
        try {
          const gapData = await apiRequest('/api/admin/dashboard/skill-gap');
          setSkillGapData(Array.isArray(gapData) ? gapData : []);
        } catch (err) {
          console.warn('Failed to fetch skill gap data', err);
        }

        setStats([
          { 
            label: 'คะแนนทักษะเฉลี่ย', value: kpiData.avgScore, unit: '/ 100', 
            change: kpiData.trend.avgScore, trend: kpiData.trend.avgScore.includes('+') ? 'up' : 'down', color: 'blue', 
            insight: 'คะแนนเฉลี่ยรวม' 
          },
          { 
            label: 'ผ่านเกณฑ์มาตรฐาน', value: kpiData.passRate, unit: '%', 
            change: kpiData.trend.passRate, trend: kpiData.trend.passRate.includes('+') ? 'up' : 'down', color: 'green', 
            insight: 'เทียบกับเกณฑ์ที่ตั้งไว้' 
          },
          { 
            label: 'ทักษะต่ำกว่าเกณฑ์', value: kpiData.belowThreshold, unit: 'คน', 
            change: kpiData.trend.belowThreshold, trend: kpiData.trend.belowThreshold.includes('-') ? 'up' : 'down', color: 'red', 
            insight: 'ต้องการการอบรมเพิ่ม' 
          },
          { 
            label: 'จุดอ่อนที่ต้องพัฒนา', value: kpiData.weakestSkill, unit: '', 
            change: 'Priority', trend: 'neutral', color: 'orange', 
            insight: 'คะแนนเฉลี่ยต่ำสุดในระบบ' 
          },
        ]);

        // --- 3. สร้างรายการสิ่งที่ต้องดำเนินการ (Pending Actions) ---
        const actions = [];
        if (pendingWorkers > 0) {
          actions.push({ id: 'p1', title: 'ตรวจสอบเอกสารพนักงานใหม่', count: pendingWorkers, type: 'urgent', link: '/admin' });
        }
        
        // ดึงข้อมูลแบบทดสอบรอการอนุมัติ
        try {
          const pendingQuizzesResponse = await apiRequest('/api/admin/quizzes?status=pending');
          const pendingQuizzes = Array.isArray(pendingQuizzesResponse?.items) 
            ? pendingQuizzesResponse.items 
            : Array.isArray(pendingQuizzesResponse) 
            ? pendingQuizzesResponse 
            : [];
          
          if (pendingQuizzes.length > 0) {
            actions.push({ 
              id: 'p2', 
              title: 'แบบทดสอบรอการอนุมัติ', 
              count: pendingQuizzes.length, 
              type: 'warning', 
              link: '/admin/pending-actions?tab=quizzes',
              details: pendingQuizzes
            });
          }
        } catch (err) {
          console.warn('Failed to fetch pending quizzes', err);
        }

        // ดึงข้อมูลการประเมินที่ใกล้หมดอายุ
        try {
          const expiringAssessmentsResponse = await apiRequest('/api/admin/assessments/expiring');
          const expiringAssessments = Array.isArray(expiringAssessmentsResponse?.items) 
            ? expiringAssessmentsResponse.items 
            : Array.isArray(expiringAssessmentsResponse) 
            ? expiringAssessmentsResponse 
            : [];
          
          if (expiringAssessments.length > 0) {
            actions.push({ 
              id: 'p3', 
              title: 'การประเมินที่ใกล้หมดอายุ', 
              count: expiringAssessments.length, 
              type: 'info', 
              link: '/admin/pending-actions?tab=assessments',
              details: expiringAssessments
            });
          }
        } catch (err) {
          console.warn('Failed to fetch expiring assessments', err);
        }

        setPendingActions(actions);

        // --- 4. สร้างข้อมูล Visualization (Skill Distribution) ---
        setSkillDistribution([
          { level: 'Expert (สูง)', count: Math.floor(totalWorkers * 0.3), percentage: 30, color: '#48bb78' },
          { level: 'Intermediate (กลาง)', count: Math.floor(totalWorkers * 0.55), percentage: 55, color: '#ecc94b' },
          { level: 'Beginner (ต่ำ)', count: Math.floor(totalWorkers * 0.15), percentage: 15, color: '#f56565' },
        ]);

        // --- จัดการ Recent Activity ---
        const toDate = value => {
          if (!value) return null;
          const date = new Date(value);
          return Number.isNaN(date.getTime()) ? null : date;
        };

        const formatTimeAgo = date => {
          if (!(date instanceof Date)) {
            return 'เมื่อสักครู่';
          }
          const diffMs = Date.now() - date.getTime();
          if (diffMs <= 0) {
            return 'เมื่อสักครู่';
          }
          const minutes = Math.floor(diffMs / 60000);
          const hours = Math.floor(minutes / 60);
          const days = Math.floor(hours / 24);

          if (days > 0) {
            return `${days} วันที่แล้ว`;
          }
          if (hours > 0) {
            return `${hours} ชั่วโมงที่แล้ว`;
          }
          if (minutes > 0) {
            return `${minutes} นาทีที่แล้ว`;
          }
          return 'เมื่อสักครู่';
        };

        const activities = items
          .map(worker => {
            const timestamps = [
              worker.fullData?.meta?.createdAt,
              worker.fullData?.meta?.updatedAt,
              worker.startDate,
              worker.fullData?.meta?.lastUpdated
            ].filter(Boolean);
            const parsedDate = timestamps.length ? toDate(timestamps[0]) : null;
            return {
              id: worker.id,
              user: worker.name || 'ไม่ระบุ',
              action: 'ลงทะเบียนพนักงานใหม่',
              type: 'register',
              date: parsedDate || null
            };
          })
          .sort((a, b) => {
            const timeA = a.date ? a.date.getTime() : 0;
            const timeB = b.date ? b.date.getTime() : 0;
            return timeB - timeA;
          })
          .slice(0, 5)
          .map(activity => ({
            ...activity,
            time: formatTimeAgo(activity.date)
          }));

        setRecentActivities(activities);
      } catch (error) {
        if (!active) {
          return;
        }
        console.error('Failed to load overview data', error);
        setActivitiesError(error?.message || 'ไม่สามารถโหลดข้อมูลกิจกรรมได้');
        setRecentActivities([]);
      } finally {
        if (active) {
          setActivitiesLoading(false);
        }
      }
    };

    loadOverview();

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="admin-overview">
      <header className="admin-welcome-section">
        <div className="welcome-text">
          <h2>ภาพรวมระบบ (System Overview)</h2>
          <p>สรุปสถานะและข้อมูลสำคัญของระบบ Skill Gauge</p>
        </div>
        <div className="date-display">
          {new Date().toLocaleDateString('th-TH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </header>

      {/* 1. & 2. KPI Cards พร้อม Insight */}
      <div className="admin-stats-grid">
        {stats.map((stat, index) => (
          <div key={index} className={`stat-card stat-card--${stat.color}`}>
            <div className="stat-icon-wrapper">
              {/* Simple icons based on color/context */}
              {stat.color === 'blue' && <span className="stat-icon"><svg  xmlns="http://www.w3.org/2000/svg" width={24} height={24} fill={"currentColor"} viewBox="0 0 24 24">{/* Boxicons v3.0.6 https://boxicons.com | License  https://docs.boxicons.com/free */}<path d="m10,13h-2c-2.76,0-5,2.24-5,5v1c0,.55.45,1,1,1h10c.55,0,1-.45,1-1v-1c0-2.76-2.24-5-5-5Zm-5,5c0-1.65,1.35-3,3-3h2c1.65,0,3,1.35,3,3H5Z"></path><path d="m12.73,6.51c-.08-.22-.19-.42-.3-.62,0,0,0,0,0-.01-.69-1.14-1.93-1.89-3.42-1.89-2.28,0-4,1.72-4,4s1.72,4,4,4c1.49,0,2.73-.74,3.42-1.89,0,0,0,0,0-.01.12-.2.22-.4.3-.62.02-.06.03-.12.05-.18.06-.17.11-.34.15-.52.05-.25.07-.51.07-.78s-.03-.53-.07-.78c-.03-.18-.09-.35-.15-.52-.02-.06-.03-.12-.05-.18Zm-3.73,3.49c-1.18,0-2-.82-2-2s.82-2,2-2,2,.82,2,2-.82,2-2,2Z"></path><path d="m15,10c-.11,0-.22-.01-.33-.03-.22.66-.56,1.27-.98,1.81.41.13.84.22,1.31.22,2.28,0,4-1.72,4-4s-1.72-4-4-4c-.47,0-.9.09-1.31.22.43.53.76,1.14.98,1.81.11-.01.21-.03.33-.03,1.18,0,2,.82,2,2s-.82,2-2,2Z"></path><path d="m16,13h-1.11c.6.58,1.08,1.27,1.44,2.03,1.5.17,2.67,1.43,2.67,2.97h-2v1c0,.35-.07.69-.18,1h3.18c.55,0,1-.45,1-1v-1c0-2.76-2.24-5-5-5Z"></path></svg></span>}
              {stat.color === 'orange' && <span className="stat-icon"><svg  xmlns="http://www.w3.org/2000/svg" width={24} height={24} fill={"currentColor"} viewBox="0 0 24 24">{/* Boxicons v3.0.6 https://boxicons.com | License  https://docs.boxicons.com/free */}<path d="m19,3H5c-1.1,0-2,.9-2,2v14c0,1.1.9,2,2,2h14c1.1,0,2-.9,2-2V5c0-1.1-.9-2-2-2ZM5,19V5h14v14s-14,0-14,0Z"></path><path d="M8.5 10.5A1.5 1.5 0 1 0 8.5 13.5 1.5 1.5 0 1 0 8.5 10.5z"></path><path d="M11 11H17V13H11z"></path><path d="M7 7H17V9H7z"></path><path d="M7 15H17V17H7z"></path></svg></span>}
              {stat.color === 'green' && <span className="stat-icon"><svg  xmlns="http://www.w3.org/2000/svg" width={24} height={24} fill={"currentColor"} viewBox="0 0 24 24">{/* Boxicons v3.0.6 https://boxicons.com | License  https://docs.boxicons.com/free */}<path d="M2 20H22V22H2z"></path><path d="m18,8h-4c-.55,0-1,.45-1,1v8c0,.55.45,1,1,1h4c.55,0,1-.45,1-1v-8c0-.55-.45-1-1-1Zm-1,8h-2v-6h2v6Z"></path><path d="m10,2h-4c-.55,0-1,.45-1,1v14c0,.55.45,1,1,1h4c.55,0,1-.45,1-1V3c0-.55-.45-1-1-1Zm-1,14h-2V4h2v12Z"></path></svg></span>}
              {stat.color === 'purple' && <span className="stat-icon"><svg  xmlns="http://www.w3.org/2000/svg" width={24} height={24} fill={"currentColor"} viewBox="0 0 24 24">{/* Boxicons v3.0.6 https://boxicons.com | License  https://docs.boxicons.com/free */}<path d="M4 8c0 2.28 1.72 4 4 4s4-1.72 4-4-1.72-4-4-4-4 1.72-4 4m6 0c0 1.18-.82 2-2 2s-2-.82-2-2 .82-2 2-2 2 .82 2 2M3 20h10c.55 0 1-.45 1-1v-1c0-2.76-2.24-5-5-5H7c-2.76 0-5 2.24-5 5v1c0 .55.45 1 1 1m4-5h2c1.65 0 3 1.35 3 3H4c0-1.65 1.35-3 3-3M12.29 11.71l3 3c.2.2.45.29.71.29s.51-.1.71-.29l5-5L20.3 8.3l-4.29 4.29-2.29-2.29-1.41 1.41Z"></path></svg></span>}
            </div>
            <div className="stat-card__content">
              <span className="stat-card__label">{stat.label}</span>
              <div className="stat-card__value-group">
                <span className="stat-card__value">{stat.value}</span>
                <span className="stat-card__unit">{stat.unit}</span>
              </div>
              {/* Insight Text */}
              <div style={{ fontSize: '0.8rem', marginTop: '0.5rem', color: '#718096', display: 'flex', alignItems: 'center', gap: '4px' }}>
                {stat.trend === 'up' && <span style={{ color: '#48bb78' }}>▲ {stat.change}</span>}
                {stat.trend === 'down' && <span style={{ color: '#f56565' }}>▼ {stat.change}</span>}
                <span>{stat.insight}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="admin-content-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginTop: '2rem' }}>
        
        {/* 4. Visualization: กราฟแสดงภาพรวม Skill */}
        <section className="overview-section" style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <div className="section-header" style={{ marginBottom: '1.5rem' }}>
            <h3>การกระจายระดับทักษะ (Skill Distribution)</h3>
            <p style={{ color: '#718096', fontSize: '0.9rem' }}>ภาพรวมความสามารถของพนักงานทั้งองค์กร</p>
          </div>
          
          <div className="skill-chart-container" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {skillDistribution.map((item, idx) => (
              <div key={idx} className="skill-bar-item">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '500' }}>
                  <span>{item.level}</span>
                  <span>{item.count} คน ({item.percentage}%)</span>
                </div>
                <div style={{ width: '100%', height: '12px', background: '#edf2f7', borderRadius: '6px', overflow: 'hidden' }}>
                  <div style={{ width: `${item.percentage}%`, height: '100%', background: item.color, borderRadius: '6px', transition: 'width 1s ease-in-out' }}></div>
                </div>
              </div>
            ))}
          </div>

          {/* ตาราง Skill Gap Analysis */}
          <div style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid #edf2f7' }}>
            <h4 style={{ fontSize: '1rem', marginBottom: '1rem' }}>วิเคราะห์ช่องว่างทักษะ (Skill Gap Analysis)</h4>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ background: '#f7fafc', textAlign: 'left' }}>
                    <th style={{ padding: '0.75rem', borderBottom: '2px solid #e2e8f0', color: '#4a5568' }}>แผนก</th>
                    <th style={{ padding: '0.75rem', borderBottom: '2px solid #e2e8f0', textAlign: 'center', color: '#4a5568' }}>พนักงาน</th>
                    <th style={{ padding: '0.75rem', borderBottom: '2px solid #e2e8f0', textAlign: 'center', color: '#4a5568' }}>คะแนนเฉลี่ย</th>
                    <th style={{ padding: '0.75rem', borderBottom: '2px solid #e2e8f0', textAlign: 'center', color: '#4a5568' }}>Gap</th>
                    <th style={{ padding: '0.75rem', borderBottom: '2px solid #e2e8f0', color: '#4a5568' }}>สถานะ</th>
                  </tr>
                </thead>
                <tbody>
                  {skillGapData.length === 0 ? (
                    <tr><td colSpan="5" style={{ padding: '1rem', textAlign: 'center', color: '#718096' }}>ไม่พบข้อมูล</td></tr>
                  ) : (
                    skillGapData.map((item, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #edf2f7' }}>
                        <td style={{ padding: '0.75rem', color: '#2d3748', fontWeight: '500' }}>{item.department_name}</td>
                        <td style={{ padding: '0.75rem', textAlign: 'center', color: '#4a5568' }}>{item.total_workers}</td>
                        <td style={{ padding: '0.75rem', textAlign: 'center', color: '#4a5568' }}>{item.current_avg_score}</td>
                        <td style={{ padding: '0.75rem', textAlign: 'center', fontWeight: 'bold', color: item.skill_gap > 0 ? '#e53e3e' : '#38a169' }}>
                          {item.skill_gap > 0 ? `-${item.skill_gap}` : `+${Math.abs(item.skill_gap)}`}
                        </td>
                        <td style={{ padding: '0.75rem' }}>
                          <span style={{
                            padding: '0.25rem 0.75rem', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 'bold',
                            background: item.priority_status === 'Critical' ? '#fed7d7' : item.priority_status === 'High' ? '#feebc8' : '#c6f6d5',
                            color: item.priority_status === 'Critical' ? '#c53030' : item.priority_status === 'High' ? '#c05621' : '#2f855a'
                          }}>
                            {item.priority_status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid #edf2f7' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h4 style={{ fontSize: '1rem', margin: 0 }}>3. สิ่งที่ต้องดำเนินการ (Pending Actions)</h4>
              {pendingActions.length > 0 && (
                <button
                  onClick={() => navigate('/admin/pending-actions')}
                  style={{
                    background: '#4299e1',
                    color: 'white',
                    border: 'none',
                    padding: '0.5rem 1rem',
                    borderRadius: '6px',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    fontWeight: '500',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.background = '#3182ce'}
                  onMouseLeave={(e) => e.target.style.background = '#4299e1'}
                >
                  ดูทั้งหมด →
                </button>
              )}
            </div>
            <div className="pending-actions-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {pendingActions.length === 0 ? (
                <div style={{ color: '#718096', fontStyle: 'italic', padding: '1rem', textAlign: 'center', background: '#f7fafc', borderRadius: '8px' }}>
                  ✅ ไม่มีรายการที่ต้องดำเนินการ
                </div>
              ) : (
                pendingActions.map(action => (
                  <div key={action.id} 
                    onClick={() => navigate(action.link)}
                    style={{ 
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                      padding: '1rem', background: '#f8fafc', borderRadius: '8px', 
                      borderLeft: `4px solid ${action.type === 'urgent' ? '#f56565' : action.type === 'warning' ? '#ed8936' : '#4299e1'}`,
                      cursor: 'pointer', transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateX(4px)';
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateX(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{ fontSize: '1.5rem' }}>
                        {action.type === 'urgent' ? '🚨' : action.type === 'warning' ? '⚠️' : 'ℹ️'}
                      </span>
                      <span style={{ fontWeight: '500', color: '#2d3748' }}>{action.title}</span>
                    </div>
                    <span style={{ 
                      background: action.type === 'urgent' ? '#fff5f5' : action.type === 'warning' ? '#fef5e7' : '#ebf8ff', 
                      color: action.type === 'urgent' ? '#c53030' : action.type === 'warning' ? '#c77b00' : '#2b6cb0',
                      padding: '0.25rem 0.75rem', borderRadius: '99px', fontSize: '0.85rem', fontWeight: 'bold'
                    }}>
                      {action.count}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        {/* 3. กิจกรรมล่าสุด (History) */}
        <section className="overview-section activity-section">
          <div className="section-header">
            <h3>ประวัติกิจกรรม (History)</h3>
            <button className="view-all-btn" onClick={() => navigate('/admin/audit-log')}>ดูทั้งหมด</button>
          </div>
          <div className="activity-list">
            {activitiesLoading ? (
              <div className="empty-state">กำลังโหลดข้อมูล...</div>
            ) : activitiesError ? (
              <div className="empty-state">{activitiesError}</div>
            ) : recentActivities.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon">📭</span>
                <p>ยังไม่มีกิจกรรมล่าสุด</p>
              </div>
            ) : (
              recentActivities.map(activity => (
                <div key={activity.id} className="activity-item">
                  <div className={`activity-icon type--${activity.type}`}>
                    {activity.type === 'register' && <svg xmlns="http://www.w3.org/2000/svg" width={20} height={20} fill="currentColor" viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2M5 19V5h14v14z"></path><path d="M7 7h10v2H7zM7 11h10v2H7zM7 15h10v2H7z"></path></svg>}
                    {activity.type === 'quiz' && '✅'}
                    {activity.type === 'system' && '⚙️'}
                    {activity.type === 'login' && '🔑'}
                  </div>
                  <div className="activity-info">
                    <span className="activity-action" style={{ fontSize: '0.9rem', fontWeight: '600' }}>{activity.action}</span>
                    <span className="activity-user" style={{ fontSize: '0.8rem', color: '#718096' }}>โดย {activity.user}</span>
                  </div>
                  <span className="activity-time">{activity.time}</span>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default AdminOverview;

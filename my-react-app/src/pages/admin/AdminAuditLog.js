import React, { useState, useEffect } from 'react';
import '../Dashboard.css';

// ข้อมูลจำลอง (Mock Data) - ในอนาคตสามารถเปลี่ยนเป็น fetch จาก API ได้
const MOCK_LOGS = [
  { id: 1, action: 'LOGIN', user: 'Admin', role: 'admin', details: 'เข้าสู่ระบบสำเร็จ', ip: '124.120.1.15', timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), status: 'success' },
  { id: 2, action: 'CREATE_WORKER', user: 'HR Manager', role: 'manager', details: 'ลงทะเบียนพนักงานใหม่ "สมชาย ใจดี"', ip: '124.120.1.15', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), status: 'success' },
  { id: 3, action: 'UPDATE_QUIZ', user: 'Admin', role: 'admin', details: 'แก้ไขโครงสร้างข้อสอบ "งานโครงสร้าง"', ip: '124.120.1.15', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), status: 'success' },
  { id: 4, action: 'DELETE_USER', user: 'Admin', role: 'admin', details: 'ลบผู้ใช้งาน ID: 55', ip: '124.120.1.15', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 25).toISOString(), status: 'warning' },
  { id: 5, action: 'LOGIN_FAILED', user: 'Unknown', role: '-', details: 'พยายามเข้าสู่ระบบด้วยรหัสผ่านผิด', ip: '180.1.1.5', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), status: 'error' },
  { id: 6, action: 'EXPORT_DATA', user: 'Manager', role: 'manager', details: 'ส่งออกรายงานประจำเดือน', ip: '124.120.1.15', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 50).toISOString(), status: 'success' },
  { id: 7, action: 'UPDATE_SETTINGS', user: 'Admin', role: 'admin', details: 'อัปเดตการตั้งค่าระบบ', ip: '124.120.1.15', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(), status: 'success' },
  { id: 8, action: 'LOGIN', user: 'Worker001', role: 'worker', details: 'เข้าสู่ระบบสำเร็จ', ip: '1.2.3.4', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 80).toISOString(), status: 'success' },
  { id: 9, action: 'SUBMIT_QUIZ', user: 'Worker001', role: 'worker', details: 'ส่งข้อสอบหมวดความปลอดภัย', ip: '1.2.3.4', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 81).toISOString(), status: 'success' },
  { id: 10, action: 'LOGOUT', user: 'Worker001', role: 'worker', details: 'ออกจากระบบ', ip: '1.2.3.4', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 82).toISOString(), status: 'success' },
  { id: 11, action: 'LOGIN_FAILED', user: 'Hacker', role: '-', details: 'รหัสผ่านผิดพลาดเกินกำหนด', ip: '192.168.1.1', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 90).toISOString(), status: 'error' },
  { id: 12, action: 'VIEW_REPORT', user: 'Admin', role: 'admin', details: 'ดูรายงานสรุปผล', ip: '124.120.1.15', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 95).toISOString(), status: 'success' },
];

// จำลอง API Endpoint สำหรับดึงข้อมูล Audit Log
const fetchAuditLogs = (page = 1, limit = 5, search = '', filter = 'all', startDate = '', endDate = '') => {
  return new Promise((resolve) => {
    setTimeout(() => {
      let filtered = MOCK_LOGS.filter(log => {
        const matchesSearch = log.user.toLowerCase().includes(search.toLowerCase()) || 
                              log.details.toLowerCase().includes(search.toLowerCase()) ||
                              log.action.toLowerCase().includes(search.toLowerCase());
        const matchesFilter = filter === 'all' || log.status === filter;
        
        let matchesDate = true;
        if (startDate || endDate) {
          const logDate = new Date(log.timestamp);
          if (startDate) {
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            if (logDate < start) matchesDate = false;
          }
          if (endDate && matchesDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            if (logDate > end) matchesDate = false;
          }
        }
        return matchesSearch && matchesFilter && matchesDate;
      });
      
      // เรียงลำดับตามเวลาล่าสุด
      filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      const total = filtered.length;
      const start = (page - 1) * limit;
      const items = filtered.slice(start, start + limit);
      
      resolve({ items, total });
    }, 600); // จำลองความล่าช้าของเครือข่าย
  });
};

const AdminAuditLog = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const { items, total } = await fetchAuditLogs(currentPage, itemsPerPage, search, filter, startDate, endDate);
        setLogs(items);
        setTotalPages(Math.ceil(total / itemsPerPage));
      } catch (err) {
        console.error('Failed to fetch logs', err);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [currentPage, search, filter, itemsPerPage, startDate, endDate]);

  // รีเซ็ตหน้าเมื่อมีการค้นหาหรือกรองใหม่
  useEffect(() => {
    setCurrentPage(1);
  }, [search, filter, itemsPerPage, startDate, endDate]);

  const getStatusColor = (status) => {
    switch(status) {
      case 'success': return '#48bb78'; // สีเขียว
      case 'warning': return '#ed8936'; // สีส้ม
      case 'error': return '#f56565';   // สีแดง
      default: return '#a0aec0';        // สีเทา
    }
  };

  return (
    <div className="admin-audit-log" style={{ padding: '2rem' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#2d3748' }}>ประวัติการใช้งาน (Audit Log)</h2>
        <p style={{ color: '#718096' }}>ตรวจสอบกิจกรรมและการเปลี่ยนแปลงที่เกิดขึ้นในระบบ</p>
      </header>

      <div style={{ background: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '1rem', flex: 1, flexWrap: 'wrap' }}>
             <input 
               type="text" 
               placeholder="ค้นหาผู้ใช้ หรือ กิจกรรม..." 
               value={search}
               onChange={(e) => setSearch(e.target.value)}
               style={{ padding: '0.5rem 1rem', border: '1px solid #e2e8f0', borderRadius: '6px', width: '100%', maxWidth: '300px' }}
             />
             <select 
               value={filter} 
               onChange={(e) => setFilter(e.target.value)}
               style={{ padding: '0.5rem 1rem', border: '1px solid #e2e8f0', borderRadius: '6px' }}
             >
               <option value="all">สถานะทั้งหมด</option>
               <option value="success">สำเร็จ (Success)</option>
               <option value="warning">แจ้งเตือน (Warning)</option>
               <option value="error">ผิดพลาด (Error)</option>
             </select>
             <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
               <input 
                 type="date" 
                 value={startDate} 
                 onChange={(e) => setStartDate(e.target.value)}
                 style={{ padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '6px', color: '#4a5568' }}
                 title="วันที่เริ่มต้น"
               />
               <span style={{ color: '#718096' }}>-</span>
               <input 
                 type="date" 
                 value={endDate} 
                 onChange={(e) => setEndDate(e.target.value)}
                 style={{ padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '6px', color: '#4a5568' }}
                 title="วันที่สิ้นสุด"
               />
             </div>
          </div>
          <button style={{ padding: '0.5rem 1rem', background: '#edf2f7', border: 'none', borderRadius: '6px', color: '#4a5568', cursor: 'pointer' }}>
            Export CSV
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #edf2f7', textAlign: 'left' }}>
                <th style={{ padding: '1rem', color: '#4a5568', fontSize: '0.875rem' }}>เวลา</th>
                <th style={{ padding: '1rem', color: '#4a5568', fontSize: '0.875rem' }}>ผู้ใช้งาน</th>
                <th style={{ padding: '1rem', color: '#4a5568', fontSize: '0.875rem' }}>กิจกรรม</th>
                <th style={{ padding: '1rem', color: '#4a5568', fontSize: '0.875rem' }}>รายละเอียด</th>
                <th style={{ padding: '1rem', color: '#4a5568', fontSize: '0.875rem' }}>IP Address</th>
                <th style={{ padding: '1rem', color: '#4a5568', fontSize: '0.875rem' }}>สถานะ</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: '#718096' }}>กำลังโหลดข้อมูล...</td>
                </tr>
              ) : logs.map(log => (
                <tr 
                  key={log.id} 
                  style={{ borderBottom: '1px solid #edf2f7', cursor: 'pointer', transition: 'background-color 0.2s' }}
                  onClick={() => setSelectedLog(log)}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f7fafc'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <td style={{ padding: '1rem', fontSize: '0.9rem', color: '#2d3748' }}>
                    {new Date(log.timestamp).toLocaleString('th-TH')}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ fontWeight: '500', color: '#2d3748' }}>{log.user}</div>
                    <div style={{ fontSize: '0.75rem', color: '#718096' }}>{log.role}</div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ background: '#ebf8ff', color: '#3182ce', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600' }}>
                      {log.action}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', fontSize: '0.9rem', color: '#4a5568' }}>{log.details}</td>
                  <td style={{ padding: '1rem', fontSize: '0.85rem', color: '#718096', fontFamily: 'monospace' }}>{log.ip}</td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: getStatusColor(log.status), marginRight: '6px' }}></span>
                    <span style={{ fontSize: '0.9rem', color: '#4a5568', textTransform: 'capitalize' }}>{log.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && logs.length === 0 && (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#a0aec0' }}>ไม่พบข้อมูล</div>
          )}
        </div>

        {/* Pagination Controls */}
        <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', borderTop: '1px solid #edf2f7', paddingTop: '1rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#718096' }}>
            <span>แสดง</span>
            <select
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
              style={{ padding: '0.25rem 0.5rem', border: '1px solid #e2e8f0', borderRadius: '4px', background: 'white' }}
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
            <span>รายการต่อหน้า</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1 || loading}
              style={{ padding: '0.5rem 1rem', border: '1px solid #e2e8f0', borderRadius: '6px', background: currentPage === 1 ? '#f7fafc' : 'white', color: currentPage === 1 ? '#cbd5e0' : '#4a5568', cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
            >
              &lt; ก่อนหน้า
            </button>
            <span style={{ color: '#4a5568', fontSize: '0.9rem', fontWeight: '500' }}>
              หน้า {currentPage} จาก {totalPages || 1}
            </span>
            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || loading}
              style={{ padding: '0.5rem 1rem', border: '1px solid #e2e8f0', borderRadius: '6px', background: currentPage === totalPages ? '#f7fafc' : 'white', color: currentPage === totalPages ? '#cbd5e0' : '#4a5568', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
            >
              ถัดไป &gt;
            </button>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedLog && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }} onClick={() => setSelectedLog(null)}>
          <div style={{
            background: 'white', padding: '2rem', borderRadius: '8px', width: '90%', maxWidth: '600px',
            maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', position: 'relative'
          }} onClick={e => e.stopPropagation()}>
            <button 
                onClick={() => setSelectedLog(null)}
                style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#718096' }}
            >
                &times;
            </button>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem', color: '#2d3748', borderBottom: '1px solid #edf2f7', paddingBottom: '1rem' }}>
                รายละเอียดกิจกรรม
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem', marginBottom: '1rem', fontSize: '0.95rem' }}>
                <div style={{ color: '#718096', fontWeight: '500' }}>ID:</div>
                <div style={{ color: '#2d3748' }}>{selectedLog.id}</div>
                
                <div style={{ color: '#718096', fontWeight: '500' }}>เวลา:</div>
                <div style={{ color: '#2d3748' }}>{new Date(selectedLog.timestamp).toLocaleString('th-TH')}</div>
                
                <div style={{ color: '#718096', fontWeight: '500' }}>ผู้ใช้งาน:</div>
                <div style={{ color: '#2d3748' }}>{selectedLog.user} <span style={{ color: '#718096', fontSize: '0.85rem' }}>({selectedLog.role})</span></div>
                
                <div style={{ color: '#718096', fontWeight: '500' }}>กิจกรรม:</div>
                <div>
                    <span style={{ background: '#ebf8ff', color: '#3182ce', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.85rem', fontWeight: '600' }}>
                        {selectedLog.action}
                    </span>
                </div>
                
                <div style={{ color: '#718096', fontWeight: '500' }}>สถานะ:</div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', backgroundColor: getStatusColor(selectedLog.status), marginRight: '8px' }}></span>
                    <span style={{ textTransform: 'capitalize', color: '#2d3748' }}>{selectedLog.status}</span>
                </div>
                
                <div style={{ color: '#718096', fontWeight: '500' }}>IP Address:</div>
                <div style={{ fontFamily: 'monospace', color: '#4a5568' }}>{selectedLog.ip}</div>
                
                <div style={{ color: '#718096', fontWeight: '500' }}>รายละเอียด:</div>
                <div style={{ background: '#f7fafc', padding: '0.75rem', borderRadius: '6px', border: '1px solid #edf2f7', color: '#2d3748', lineHeight: '1.5' }}>
                    {selectedLog.details}
                </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAuditLog;

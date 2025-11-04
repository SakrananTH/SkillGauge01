import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Signup.css';

const Signup = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState('project_manager');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const onRegister = async () => {
    setError('');
    if (!fullName || !phone || !password || !confirmPassword) {
      setError('กรุณากรอกข้อมูลให้ครบ');
      return;
    }
    if (password !== confirmPassword) {
      setError('รหัสผ่านไม่ตรงกัน');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('http://localhost:4000/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName,
          phone,
          email: email || '',
          password,
          role,
        }),
      });

      if (res.status === 409) {
        const data = await res.json().catch(() => ({}));
        setError(data.message || 'เบอร์โทรหรืออีเมลถูกใช้งานแล้ว');
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.message || 'สมัครสมาชิกไม่สำเร็จ');
        return;
      }

      const user = await res.json();
      sessionStorage.setItem('role', user.role || role);
      // Navigate by role
      if ((user.role || role) === 'project_manager') navigate('/pm');
      else if ((user.role || role) === 'foreman') navigate('/project-tasks');
      else navigate('/skill-assessment');
    } catch (e) {
      setError('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="signup-screen">
      <div className="signup-page">
        <div className="signup-logo-side">
          <img src="/logo123.png" alt="SkillGauge" />
        </div>

        <div>
          <h1 className="signup-header"></h1>
          <div className="signup-card">
            <div className="signup-row">
              <label className="signup-label">Full Name</label>
              <input className="signup-input" placeholder="ชื่อ-นามสกุล" value={fullName} onChange={e=>setFullName(e.target.value)} />
            </div>
            <div className="signup-row">
              <label className="signup-label">Email</label>
              <input className="signup-input" type="email" placeholder="sakya@gmail.com" value={email} onChange={e=>setEmail(e.target.value)} />
            </div>
            <div className="signup-row">
              <label className="signup-label">Phone Number</label>
              <input className="signup-input" placeholder="086-xxxx-xxx" value={phone} onChange={e=>setPhone(e.target.value)} />
            </div>
            <div className="signup-row">
              <label className="signup-label">Role</label>
              <select className="signup-select" value={role} onChange={(e)=>setRole(e.target.value)}>
                <option value="project_manager">Project Manager</option>
                <option value="foreman">Foreman</option>
                <option value="worker">Worker</option>
              </select>
            </div>
            <div className="signup-row">
              <label className="signup-label">Username</label>
              <input className="signup-input" placeholder="เบอร์โทรศัพท์" value={username} onChange={e=>setUsername(e.target.value)} />
            </div>
            <div className="signup-row">
              <label className="signup-label">Password</label>
              <input className="signup-input" type="password" placeholder="********" value={password} onChange={e=>setPassword(e.target.value)} />
            </div>
            <div className="signup-row">
              <label className="signup-label">Confirm Password</label>
              <input className="signup-input" type="password" placeholder="********" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} />
            </div>
            {error && <div className="signup-error" role="alert">{error}</div>}
            <button className="signup-submit" type="button" onClick={onRegister} disabled={submitting}>
              {submitting ? 'Registering…' : 'Register'}
            </button>
            <div className="signup-footer">
              Already have an account? <Link to="/login">Login</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;

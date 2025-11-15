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
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

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
      // Persist identity for later navigation/guard
      sessionStorage.setItem('role', user.role || role);
      if (user.id) sessionStorage.setItem('user_id', user.id);
      if (user.email) sessionStorage.setItem('user_email', user.email);
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
              <label className="signup-label">Username</label>
              <input className="signup-input" placeholder="เบอร์โทรศัพท์" value={username} onChange={e=>setUsername(e.target.value)} />
            </div>
            <div className="signup-row">
              <label className="signup-label">Phone Number</label>
              <input className="signup-input" placeholder="086-xxxx-xxx" value={phone} onChange={e=>setPhone(e.target.value)} />
            </div>
            <div className="signup-row">
              <label className="signup-label">birthday</label>
              <input className="signup-input" type="date" placeholder="dd/mm/yyyy" />
            </div>
            <div className="signup-row">
              <label className="signup-label">Password</label>
              <div className="input-with-eye">
                <input className="signup-input" type={showPass ? 'text' : 'password'} placeholder="********" value={password} onChange={e=>setPassword(e.target.value)} />
                  <button
                    type="button"
                    className={`eye-btn ${showPass ? 'is-show' : 'is-hide'}`}
                    aria-label={showPass ? 'Hide password' : 'Show password'}
                    onClick={()=>setShowPass(s=>!s)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-eye-fill" viewBox="0 0 16 16">
                      <path d="M10.5 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0"/>
                      <path d="M0 8s3-5.5 8-5.5S16 8 16 8s-3 5.5-8 5.5S0 8 0 8m8 3.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7"/>
                    </svg>
                  </button>
              </div>
            </div>
            <div className="signup-row">
              <label className="signup-label">Confirm Password</label>
              <div className="input-with-eye">
                <input className="signup-input" type={showConfirm ? 'text' : 'password'} placeholder="********" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} />
                  <button
                    type="button"
                    className={`eye-btn ${showConfirm ? 'is-show' : 'is-hide'}`}
                    aria-label={showConfirm ? 'Hide password' : 'Show password'}
                    onClick={()=>setShowConfirm(s=>!s)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-eye-fill" viewBox="0 0 16 16">
                      <path d="M10.5 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0"/>
                      <path d="M0 8s3-5.5 8-5.5S16 8 16 8s-3 5.5-8 5.5S0 8 0 8m8 3.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7"/>
                    </svg>
                  </button>
              </div>
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

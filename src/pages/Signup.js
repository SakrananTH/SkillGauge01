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

  const onRegister = () => {
    // Skip validation for mock; navigate with payload for dashboard testing
    const user = { fullName: fullName || 'สมิทธิ์ ไม่มีนี่', email: email || 'aunh888@gmail.com', phone: phone || '+66861234567', username: username || '+66861234567', role };
    navigate('/dashboard', { state: { user, source: 'signup' } });
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
            <button className="signup-submit" type="button" onClick={onRegister}>Register</button>
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

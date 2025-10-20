import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Signup.css';

const Signup = () => {
  const [role, setRole] = useState('project_manager');

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
              <input className="signup-input" placeholder="ชื่อ-นามสกุล" />
            </div>
            <div className="signup-row">
              <label className="signup-label">Email</label>
              <input className="signup-input" type="email" placeholder="sakya@gmail.com" />
            </div>
            <div className="signup-row">
              <label className="signup-label">Phone Number</label>
              <input className="signup-input" placeholder="086-xxxx-xxx" />
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
              <input className="signup-input" placeholder="เบอร์โทรศัพท์" />
            </div>
            <div className="signup-row">
              <label className="signup-label">Password</label>
              <input className="signup-input" type="password" placeholder="********" />
            </div>
            <div className="signup-row">
              <label className="signup-label">Confirm Password</label>
              <input className="signup-input" type="password" placeholder="********" />
            </div>
            <button className="signup-submit">Register</button>
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

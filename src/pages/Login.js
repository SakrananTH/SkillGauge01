import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Login.css';

const Login = () => {
  const [role, setRole] = useState('foreman');

  return (
    <div className="login-screen">
      <div className="login-page">
        <div>
          <h1 className="login-header"></h1>

          <div className="login-card">
            <div className="login-row">
              <label className="login-label">Username</label>
              <input className="login-input" placeholder="เบอร์โทรศัพท์" />
            </div>
            <div className="login-row">
              <label className="login-label">Password</label>
              <input className="login-input" type="password" placeholder="••••••••" />
            </div>
            <div className="login-links">
              <Link to="#">Forgot password</Link>
              <div className="role-toggle">
                <button
                  type="button"
                  className={`role-btn ${role === 'project_manager' ? 'active' : ''}`}
                  onClick={() => setRole('project_manager')}
                >
                  Project Manager
                </button>
                <button
                  type="button"
                  className={`role-btn ${role === 'foreman' ? 'active' : ''}`}
                  onClick={() => setRole('foreman')}
                >
                  Foreman
                </button>
                <button
                  type="button"
                  className={`role-btn ${role === 'worker' ? 'active' : ''}`}
                  onClick={() => setRole('worker')}
                >
                  worker
                </button>
              </div>
            </div>
            <button className="login-submit">Login</button>
            <div className="login-footer-link">
              Don't have an account? <Link to="/signup">Sign Up</Link>
            </div>
          </div>
        </div>
        <div className="login-logo-side">
          <img src="/logo123.png" alt="Logo" />
        </div>
      </div>
    </div>
  );
};

export default Login;

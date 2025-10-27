import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState('foreman');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const onLogin = () => {
    // No real auth yet: just navigate with in-memory payload to test dashboard wiring
    const user = { username: username || '+66861234567', role };
    const dest = role === 'project_manager' ? '/pm' : '/dashboard';
    navigate(dest, { state: { user, source: 'login' } });
  };

  return (
    <div className="login-screen">
      <div className="login-page">
        <div>
          <h1 className="login-header"></h1>

          <div className="login-card">
            <div className="login-row">
              <label className="login-label">Username</label>
              <input className="login-input" placeholder="เบอร์โทรศัพท์" value={username} onChange={e=>setUsername(e.target.value)} />
            </div>
            <div className="login-row">
              <label className="login-label">Password</label>
              <input className="login-input" type="password" placeholder="••••••••" value={password} onChange={e=>setPassword(e.target.value)} />
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
            <button className="login-submit" type="button" onClick={onLogin}>Login</button>
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

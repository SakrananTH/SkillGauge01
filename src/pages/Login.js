import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();
  // Start with no role selected; user can toggle selection on/off
  const [role, setRole] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const toggleRole = (target) => {
    setRole((prev) => (prev === target ? '' : target));
  };

  const API = process.env.REACT_APP_API_URL || 'http://localhost:4000';

  const onLogin = async () => {
    // Simple demo logic: check for Admin credentials first
    if (username === '0863125891' && password === '0863503381') {
      const user = { username, role: 'admin' };
      try {
        sessionStorage.setItem('role', 'admin');
        // Try to fetch user_id by phone to store identity
        const url = new URL('/api/users/by-phone', API);
        url.searchParams.set('phone', username);
        const res = await fetch(url);
        if (res.ok) {
          const u = await res.json();
          if (u.id) sessionStorage.setItem('user_id', u.id);
        }
      } catch {}
      navigate('/admin', { state: { user, source: 'login' } });
      return;
    }

    // Otherwise fallback to selected role navigation (no real auth yet)
    const currentRole = role || 'foreman';
    const user = { username: username || '+66861234567', role: currentRole };
    try { sessionStorage.setItem('role', currentRole); } catch {}
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
                  aria-pressed={role === 'project_manager'}
                  onClick={() => toggleRole('project_manager')}
                >
                  Project Manager
                </button>
                <button
                  type="button"
                  className={`role-btn ${role === 'foreman' ? 'active' : ''}`}
                  aria-pressed={role === 'foreman'}
                  onClick={() => toggleRole('foreman')}
                >
                  Foreman
                </button>
                <button
                  type="button"
                  className={`role-btn ${role === 'worker' ? 'active' : ''}`}
                  aria-pressed={role === 'worker'}
                  onClick={() => toggleRole('worker')}
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

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Login.css';
import { chooseRole } from '../utils/auth';

const Login = () => {
  const navigate = useNavigate();
  // Start with no role selected; user can toggle selection on/off
  const [role, setRole] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);

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
    // Real login for PM/FM/WK
    try {
      const res = await fetch(`${API}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: username, password }),
      });
      if (!res.ok) {
        alert('Invalid phone or password');
        return;
      }
      const data = await res.json();
  const { token, user } = data;
      // Persist token and identity
      try {
        sessionStorage.setItem('auth_token', token);
        if (user?.id) sessionStorage.setItem('user_id', user.id);
        if (user?.email) sessionStorage.setItem('user_email', user.email);
      } catch {}

      // Pick role: prefer selected role if present in server roles; else first role; else worker
  const serverRoles = Array.isArray(user?.roles) ? user.roles : [];
  let chosenRole = chooseRole(role, serverRoles);
      try { sessionStorage.setItem('role', chosenRole); } catch {}

      const dest = chosenRole === 'project_manager' ? '/pm' : '/dashboard';
      navigate(dest, { state: { user: { username, role: chosenRole }, source: 'login' } });
    } catch (e) {
      console.error(e);
      alert('Login failed');
    }
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
              <div className="input-with-eye">
                <input className="login-input" type={showPass ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={e=>setPassword(e.target.value)} />
                  <button
                    type="button"
                    className={`eye-btn ${showPass ? 'is-show' : 'is-hide'}`}
                    aria-label={showPass ? 'Hide password' : 'Show password'}
                    onClick={()=>setShowPass(s=>!s)}
                  >
                    {/* Bootstrap eye SVG (inline), uses currentColor */}
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true">
                      <path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8M1.173 8a13 13 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5s3.879 1.168 5.168 2.457A13 13 0 0 1 14.828 8q-.086.13-.195.288c-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5s-3.879-1.168-5.168-2.457A13 13 0 0 1 1.172 8z"/>
                      <path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5M4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0"/>
                    </svg>
                  </button>
              </div>
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

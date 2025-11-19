import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './Signup.css';

const SignupCredentials = () => {
  const navigate = useNavigate();
  const [profileDraft, setProfileDraft] = useState(null);
  const [form, setForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const draft = sessionStorage.getItem('signup_profile');
    if (!draft) {
      navigate('/signup');
      return;
    }
    try {
      const parsed = JSON.parse(draft);
      setProfileDraft(parsed);
      const makeDefaultEmail = (name) => {
        const base = String(name || '').trim().replace(/\s+/g, '');
        return base ? `${base}@gmail.com`.toLowerCase() : '';
      };
      setForm(prev => ({ ...prev, email: parsed.email || makeDefaultEmail(parsed.name) }));
    } catch {
      navigate('/signup');
    }
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const newErrors = {};
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) {
      newErrors.email = 'รูปแบบอีเมลไม่ถูกต้อง';
    }

    if (!form.password) newErrors.password = 'กรุณากรอกรหัสผ่าน';
    else if (form.password.length < 8) newErrors.password = 'รหัสผ่านอย่างน้อย 8 ตัวอักษร';

    if (form.password !== form.confirmPassword) newErrors.confirmPassword = 'รหัสผ่านไม่ตรงกัน';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    if (!profileDraft) return;
    if (!profileDraft.phoneNumber) {
      setErrors({ email: 'ไม่พบเบอร์โทรจากขั้นตอนก่อนหน้า' });
      return;
    }

    setSubmitting(true);
    try {
      const fullName = `${profileDraft.skill}${profileDraft.name} ${profileDraft.surname}`;
      const phone = profileDraft.phoneNumber; // backend stored from step 1

      const res = await fetch('http://localhost:4000/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName,
          phone,
          email: form.email || '',
          password: form.password,
        }),
      });

      if (res.status === 409) {
        const data = await res.json().catch(() => ({}));
        setErrors({ email: data.message || 'ข้อมูลนี้ถูกใช้งานแล้ว' });
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setErrors({ email: data.message || 'สมัครสมาชิกไม่สำเร็จ' });
        return;
      }

      const user = await res.json();

      // Build final profile for session
      const finalProfile = {
        ...profileDraft,
        email: form.email || '',
      };
      sessionStorage.setItem('worker_profile', JSON.stringify(finalProfile));
      sessionStorage.removeItem('signup_profile');

      // After successful signup, redirect to Login and prefill username with phone
      try {
        sessionStorage.setItem('login_prefill_username', phone);
        sessionStorage.setItem('login_message', 'สมัครสมาชิกสำเร็จ กรุณาเข้าสู่ระบบ');
        // Clear any stray role/auth data just in case
        sessionStorage.removeItem('auth_token');
        sessionStorage.removeItem('role');
        sessionStorage.removeItem('user_id');
      } catch {}

      navigate('/login');
    } catch {
      setErrors({ email: 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="profile-page">
      <div className="profile-container">
        <h2 className="profile-title">สร้างบัญชีเข้าสู่ระบบ</h2>
        <form onSubmit={onSubmit} className="profile-form">
          <div className="form-group">
            <label>อีเมล</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="example@mail.com"
              className={errors.email ? 'error' : ''}
            />
            {errors.email && <span className="error-message">{errors.email}</span>}
          </div>
          <div className="form-group">
            <label>รหัสผ่าน</label>
            <div className="password-input-wrapper">
              <input
                type={showPass ? 'text' : 'password'}
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="********"
                className={errors.password ? 'error' : ''}
              />
              <button type="button" className="eye-toggle" onClick={() => setShowPass(s => !s)}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-eye-fill" viewBox="0 0 16 16">
                  <path d="M10.5 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0"/>
                  <path d="M0 8s3-5.5 8-5.5S16 8 16 8s-3 5.5-8 5.5S0 8 0 8m8 3.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7"/>
                </svg>
              </button>
            </div>
            {errors.password && <span className="error-message">{errors.password}</span>}
          </div>

          <div className="form-group">
            <label>ยืนยันรหัสผ่าน</label>
            <div className="password-input-wrapper">
              <input
                type={showConfirm ? 'text' : 'password'}
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                placeholder="********"
                className={errors.confirmPassword ? 'error' : ''}
              />
              <button type="button" className="eye-toggle" onClick={() => setShowConfirm(s => !s)}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-eye-fill" viewBox="0 0 16 16">
                  <path d="M10.5 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0"/>
                  <path d="M0 8s3-5.5 8-5.5S16 8 16 8s-3 5.5-8 5.5S0 8 0 8m8 3.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7"/>
                </svg>
              </button>
            </div>
            {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
          </div>

          <button type="submit" className="submit-btn" disabled={submitting}>
            {submitting ? 'กำลังสร้างบัญชี...' : 'ยืนยันและสมัครสมาชิก'}
          </button>

          <div className="login-link" style={{ marginTop: '0.75rem' }}>
            <Link to="/signup">ย้อนกลับแก้ไขข้อมูลส่วนตัว</Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SignupCredentials;

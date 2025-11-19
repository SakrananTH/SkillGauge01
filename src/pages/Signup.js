import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Signup.css';

const Signup = () => {
  const navigate = useNavigate();
  
  // helpers: format Thai ID and phone for display while typing
  const formatThaiId = (v) => {
    const d = (v || '').replace(/\D/g, '').slice(0, 13);
    const parts = [];
    if (d.length > 0) parts.push(d.slice(0, 1));
    if (d.length > 1) parts.push(d.slice(1, 5));
    if (d.length > 5) parts.push(d.slice(5, 10));
    if (d.length > 10) parts.push(d.slice(10, 12));
    if (d.length > 12) parts.push(d.slice(12, 13));
    return parts.join('-');
  };

  const formatPhone = (v) => {
    const d = (v || '').replace(/\D/g, '').slice(0, 10);
    if (d.length <= 3) return d;
    if (d.length <= 6) return `${d.slice(0, 3)}-${d.slice(3)}`;
    return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
  };

  const [formData, setFormData] = useState({
    skill: '',
    name: '',
    surname: '',
    idCard: '',
    phoneNumber: '',
    address: '',
    addressDetails: '',
    birthDay: '',
    birthMonth: '',
    birthYear: '',
    province: '',
    category: '',
    PostalCode: ''
  });

  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    let next = value;
    if (name === 'idCard') next = formatThaiId(value);
    if (name === 'phoneNumber') next = formatPhone(value);
    setFormData(prev => ({
      ...prev,
      [name]: next
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.skill) newErrors.skill = 'กรุณาเลือกคำนำหน้า';
    if (!formData.name.trim()) newErrors.name = 'กรุณากรอกชื่อ';
    if (!formData.surname.trim()) newErrors.surname = 'กรุณากรอกนามสกุล';
    if (!formData.idCard.trim()) newErrors.idCard = 'กรุณากรอกเลขบัตรประชาชน';
    else if (!/^\d{13}$/.test(formData.idCard.replace(/\D/g, ''))) {
      newErrors.idCard = 'เลขบัตรประชาชนต้องเป็นตัวเลข 13 หลัก';
    }
    const phoneDigits = (formData.phoneNumber || '').replace(/\D/g, '');
    if (!phoneDigits) newErrors.phoneNumber = 'กรุณากรอกเบอร์โทรศัพท์';
    else if (!(phoneDigits.length === 9 || phoneDigits.length === 10)) {
      newErrors.phoneNumber = 'กรุณากรอกเบอร์ 9-10 หลัก';
    }
    if (!formData.birthDay || !formData.birthMonth || !formData.birthYear) {
      newErrors.birthDate = 'กรุณาเลือกวันเกิดให้ครบถ้วน';
    }
    if (!formData.address.trim()) newErrors.address = 'กรุณากรอกที่อยู่';
    if (!formData.addressDetails.trim()) newErrors.addressDetails = 'กรุณากรอกอำเภอ/เขต';
    if (!formData.province.trim()) newErrors.province = 'กรุณากรอกจังหวัด';
      if (!formData.category) newErrors.category = 'กรุณาเลือกหมวดหมู่';
      if (!formData.PostalCode || !formData.PostalCode.trim()) newErrors.PostalCode = 'กรุณากรอกรหัสไปรษณีย์';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onRegister = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    try {
      // Build birthDate from day, month, year
      const birthDate = `${formData.birthYear}-${String(formData.birthMonth).padStart(2, '0')}-${String(formData.birthDay).padStart(2, '0')}`;
      const sanitizedPhone = formData.phoneNumber.replace(/\D/g, '');

      // Persist Step 1 profile data, exclude phone/password
      const profileDraft = {
        skill: formData.skill,
        name: formData.name,
        surname: formData.surname,
        idCard: formData.idCard,
        phoneNumber: sanitizedPhone,
        address: formData.address,
        addressDetails: formData.addressDetails,
        province: formData.province,
        category: formData.category,
        birthDate,
        PostalCode: formData.PostalCode || ''
      };
      sessionStorage.setItem('signup_profile', JSON.stringify(profileDraft));

      // Go to credentials step
      navigate('/signup/credentials');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="profile-page">
      <div className="profile-container">
        <h2 className="profile-title">ลงทะเบียน</h2>
        <p className="profile-subtitle">อย่าลืมเช็คความถูกต้องก่อนบันทึกข้อมูล</p>

        <form onSubmit={onRegister}>
          {/* คำนำหน้า */}
          <div className="form-group">
            <label>คำนำหน้า</label>
            <select
              name="skill"
              value={formData.skill}
              onChange={handleChange}
              className={errors.skill ? 'error' : ''}
            >
              <option value="">เลือกคำนำหน้า</option>
              <option value="นาย">นาย</option>
              <option value="นาง">นาง</option>
              <option value="นางสาว">นางสาว</option>
            </select>
            {errors.skill && <span className="error-message">{errors.skill}</span>}
          </div>

          {/* ชื่อ - นามสกุล */}
          <div className="form-row">
            <div className="form-group">
              <label>ชื่อ</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="ชื่อ"
                className={errors.name ? 'error' : ''}
              />
              {errors.name && <span className="error-message">{errors.name}</span>}
            </div>
            <div className="form-group">
              <label>นามสกุล</label>
              <input
                type="text"
                name="surname"
                value={formData.surname}
                onChange={handleChange}
                placeholder="นามสกุล"
                className={errors.surname ? 'error' : ''}
              />
              {errors.surname && <span className="error-message">{errors.surname}</span>}
            </div>
          </div>

          {/* เลขบัตรประชาชน */}
          <div className="form-group">
            <label>เลขบัตรประชาชน 13 หลัก</label>
            <input
              type="text"
              name="idCard"
              value={formData.idCard}
              onChange={handleChange}
              placeholder="x-xxxx-xxxxx-xx-x"
              maxLength="17"
              className={errors.idCard ? 'error' : ''}
            />
            {errors.idCard && <span className="error-message">{errors.idCard}</span>}
          </div>
          {/* เบอร์โทรศัพท์ (แสดงใต้เลขบัตร) */}
          <div className="form-group">
            <label>หมวดหมู่</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className={errors.category ? 'error' : ''}
            >
              <option value="">เลือกหมวดหมู่</option>
              <option value="othe0">1.ไม่มี</option>
              <option value="othe1">2.ช่างไฟฟ้า</option>
              <option value="othe2">3.ช่างประปา</option>
              <option value="othe3">4.ช่างก่ออิฐฉาบปูน</option>
              <option value="othe4">5.ช่างประตู-หน้าต่าง</option>
              <option value="othe5">6.ช่างฝ้าเพดาน</option>
              <option value="othe6">7.ช่างหลังคา</option>
              <option value="othe7">8.ช่างกระเบื้อง</option>
              <option value="othe">9.ช่างโครงสร้าง</option>
            </select>
            {errors.category && <span className="error-message">{errors.category}</span>}
          </div>
           <div className="form-group">
            <label>เบอร์โทรศัพท์</label>
            <input
              type="text"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              placeholder="08x-xxx-xxxx"
              maxLength="13"
              className={errors.phoneNumber ? 'error' : ''}
            />
            {errors.phoneNumber && <span className="error-message">{errors.phoneNumber}</span>}
          </div>
          {/* วันเกิด - ตำบล/แขวง - จังหวัด */}
          <div className="form-group">
            <label>วันเกิด</label>
            <div className="date-grid">
              <select
                name="birthDay"
                value={formData.birthDay || ''}
                onChange={handleChange}
                className={errors.birthDate ? 'error' : ''}
              >
                <option value="">วัน</option>
                {[...Array(31)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>{i + 1}</option>
                ))}
              </select>
              <select
                name="birthMonth"
                value={formData.birthMonth || ''}
                onChange={handleChange}
                className={errors.birthDate ? 'error' : ''}
              >
                <option value="">เดือน</option>
                <option value="1">มกราคม</option>
                <option value="2">กุมภาพันธ์</option>
                <option value="3">มีนาคม</option>
                <option value="4">เมษายน</option>
                <option value="5">พฤษภาคม</option>
                <option value="6">มิถุนายน</option>
                <option value="7">กรกฎาคม</option>
                <option value="8">สิงหาคม</option>
                <option value="9">กันยายน</option>
                <option value="10">ตุลาคม</option>
                <option value="11">พฤศจิกายน</option>
                <option value="12">ธันวาคม</option>
              </select>
              <select
                name="birthYear"
                value={formData.birthYear || ''}
                onChange={handleChange}
                className={errors.birthDate ? 'error' : ''}
              >
                <option value="">ปี</option>
                {[...Array(100)].map((_, i) => {
                  const year = new Date().getFullYear() - i;
                  return <option key={year} value={year}>{year}</option>;
                })}
              </select>
            </div>
            {errors.birthDate && <span className="error-message">{errors.birthDate}</span>}
          </div>
          {/* ที่อยู่ */}
          <div className="form-group">
            <label>ที่อยู่</label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="บ้านเลขที่ หมู่ ถนน"
              rows="3"
              className={errors.address ? 'error' : ''}
            ></textarea>
            {errors.address && <span className="error-message">{errors.address}</span>}
          </div>
          <div className="form-group">
            <label>รหัสไปรษณีย์</label>
            <input
              type="text"
              name="PostalCode"
              value={formData.PostalCode}
              onChange={handleChange}
              placeholder="รหัสไปรษณีย์"
              className={errors.PostalCode ? 'error' : ''}
            />
            {errors.PostalCode && <span className="error-message">{errors.PostalCode}</span>}
          </div>
          {/* ตำบล/แขวง - จังหวัด */}
          <div className="form-row">
            <div className="form-group">
              <label>ตำบล/แขวง</label>
              <input
                type="text"
                name="addressDetails"
                value={formData.addressDetails}
                onChange={handleChange}
                placeholder="ตำบล/แขวง"
                className={errors.addressDetails ? 'error' : ''}
              />
              {errors.addressDetails && <span className="error-message">{errors.addressDetails}</span>}
            </div>
            <div className="form-group">
              <label>จังหวัด</label>
              <input
                type="text"
                name="province"
                value={formData.province}
                onChange={handleChange}
                placeholder="จังหวัด"
                className={errors.province ? 'error' : ''}
              />
              {errors.province && <span className="error-message">{errors.province}</span>}
            </div>
          </div>
          {/* อีเมล */}
          {/* Confirm Password */}
          {/* Submit Button */}
          <button type="submit" className="submit-btn" disabled={submitting}>
            {submitting ? 'กำลังลงทะเบียน...' : 'บันทึก และไปต่อ →'}
          </button>

          <div className="login-link">
            มีบัญชีอยู่แล้ว? <Link to="/login">เข้าสู่ระบบ</Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Signup;

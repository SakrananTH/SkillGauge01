import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './WorkerProfile.css';

const WorkerProfile = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = location.state?.user || {};

  const [formData, setFormData] = useState({
    skill: '',
    name: '',
    surname: '',
    idCard: '',
    address: '',
    phoneType: '',
    phoneNumber: '',
    birthDate: '',
    province: ''
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
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
    else if (!/^\d{13}$/.test(formData.idCard.replace(/\s/g, ''))) {
      newErrors.idCard = 'เลขบัตรประชาชนต้องเป็นตัวเลข 13 หลัก';
    }
    if (!formData.address.trim()) newErrors.address = 'กรุณากรอกรายละเอียดที่อยู่';
    if (!formData.phoneType) newErrors.phoneType = 'กรุณาเลือกรหัสโทรศัพท์';
    if (!formData.phoneNumber.trim()) newErrors.phoneNumber = 'กรุณากรอกเบอร์โทรศัพท์';
    if (!formData.birthDate) newErrors.birthDate = 'กรุณากรอกวันเกิด';
    if (!formData.province.trim()) newErrors.province = 'กรุณากรอกจังหวัด';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      // Save profile data to sessionStorage or send to backend
      sessionStorage.setItem('worker_profile', JSON.stringify(formData));
      
      // Navigate to dashboard
      navigate('/dashboard', { state: { user, profileCompleted: true } });
    }
  };

  return (
    <div className="worker-profile-screen">
      <div className="profile-container">
        <div className="profile-header">
          <div className="header-icon">📋</div>
          <h1>ข้อมูลบัตรประชาชนเพื่อออกใบอนุญาติ</h1>
          <p className="subtitle">อย่าลืมเช็ตความถูกต้องก่อนกรอกข้อมูลบัญชี</p>
        </div>

        <form onSubmit={handleSubmit} className="profile-form">
          <div className="form-group">
            <label>คำนำหน้าชื่อ</label>
            <select 
              name="skill" 
              value={formData.skill}
              onChange={handleChange}
              className={errors.skill ? 'error' : ''}
            >
              <option value="">กรุณาระบุ</option>
              <option value="นาย">นาย</option>
              <option value="นาง">นาง</option>
              <option value="นางสาว">นางสาว</option>
            </select>
            {errors.skill && <span className="error-text">{errors.skill}</span>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>ชื่อ</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="ระบุชื่อจริง และชื่อกลาง"
                className={errors.name ? 'error' : ''}
              />
              {errors.name && <span className="error-text">{errors.name}</span>}
            </div>

            <div className="form-group">
              <label>นามสกุล</label>
              <input
                type="text"
                name="surname"
                value={formData.surname}
                onChange={handleChange}
                placeholder="ระบุนามสกุลจริง"
                className={errors.surname ? 'error' : ''}
              />
              {errors.surname && <span className="error-text">{errors.surname}</span>}
            </div>
          </div>

          <div className="form-group">
            <label>เลขบัตรประชาชน</label>
            <input
              type="text"
              name="idCard"
              value={formData.idCard}
              onChange={handleChange}
              placeholder="ระบุเลขบัตรประชาชน 13 หลัก"
              maxLength="13"
              className={errors.idCard ? 'error' : ''}
            />
            {errors.idCard && <span className="error-text">{errors.idCard}</span>}
          </div>

          <div className="form-group">
            <label>ที่อยู่ตามบัตรประชาชน</label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="ระบุเลขที่, หมู่, ถนน, ซอย"
              rows="3"
              className={errors.address ? 'error' : ''}
            />
            {errors.address && <span className="error-text">{errors.address}</span>}
          </div>

          <div className="form-group">
            <label>รายละเอียดที่อยู่</label>
            <input
              type="text"
              name="addressDetails"
              placeholder="ระบุแขวง/ตำบล, เขต/อำเภอ, ซอย"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>รหัสโทรศัพท์</label>
              <select
                name="phoneType"
                value={formData.phoneType}
                onChange={handleChange}
                className={errors.phoneType ? 'error' : ''}
              >
                <option value="">รหัสโทรศัพท์</option>
                <option value="+66">+66 (ไทย)</option>
                <option value="+1">+1 (USA)</option>
                <option value="+86">+86 (China)</option>
              </select>
              {errors.phoneType && <span className="error-text">{errors.phoneType}</span>}
            </div>

            <div className="form-group">
              <label>ตำแหน่ง/แขวง</label>
              <input
                type="text"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                placeholder="ระบุตำแหน่ง/แขวง"
                className={errors.phoneNumber ? 'error' : ''}
              />
              {errors.phoneNumber && <span className="error-text">{errors.phoneNumber}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>อำเภอ/เขต</label>
              <input
                type="text"
                name="birthDate"
                value={formData.birthDate}
                onChange={handleChange}
                placeholder="ระบุอำเภอ/เขต"
                className={errors.birthDate ? 'error' : ''}
              />
              {errors.birthDate && <span className="error-text">{errors.birthDate}</span>}
            </div>

            <div className="form-group">
              <label>จังหวัด</label>
              <input
                type="text"
                name="province"
                value={formData.province}
                onChange={handleChange}
                placeholder="ระบุจังหวัด"
                className={errors.province ? 'error' : ''}
              />
              {errors.province && <span className="error-text">{errors.province}</span>}
            </div>
          </div>

          <button type="submit" className="submit-btn">
            บันทึก และไปต่อ →
          </button>
        </form>
      </div>
    </div>
  );
};

export default WorkerProfile;

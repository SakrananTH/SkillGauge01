import React, { useState } from 'react';
import './Contact.css';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    alert('ขอบคุณสำหรับการติดต่อ เราจะติดต่อกลับภายใน 24 ชั่วโมง');
  };

  return (
    <div className="contact-page">
      <section className="section-hero contact-hero">
        <div className="container">
          <div className="hero-content">
            <h1 className="hero-title">ติดต่อเรา</h1>
            <p className="hero-subtitle">
              พร้อมให้คำปรึกษาและรับฟังความต้องการของคุณ
            </p>
          </div>
        </div>
      </section>

      <section className="section contact-content">
        <div className="container">
          <div className="grid grid-cols-2 gap-8">
            <div className="contact-form-section">
              <h2>ส่งข้อความถึงเรา</h2>
              <form className="contact-form" onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="name">ชื่อ-นามสกุล *</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email">อีเมล *</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="phone">เบอร์โทรศัพท์</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="subject">หัวข้อ *</label>
                  <select
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">เลือกหัวข้อ</option>
                    <option value="website">พัฒนาเว็บไซต์</option>
                    <option value="mobile">แอปพลิเคชันมือถือ</option>
                    <option value="ecommerce">E-Commerce</option>
                    <option value="consultation">ปรึกษาทั่วไป</option>
                    <option value="other">อื่นๆ</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="message">ข้อความ *</label>
                  <textarea
                    id="message"
                    name="message"
                    rows="5"
                    value={formData.message}
                    onChange={handleInputChange}
                    placeholder="บอกเราเกี่ยวกับโครงการของคุณ..."
                    required
                  ></textarea>
                </div>

                <button type="submit" className="submit-button">
                  ส่งข้อความ
                </button>
              </form>
            </div>

            <div className="contact-info-section">
              <h2>ข้อมูลติดต่อ</h2>
              
              <div className="contact-info-grid">
                <div className="contact-info-item">
                  <div className="contact-icon">📍</div>
                  <div>
                    <h4>ที่อยู่</h4>
                    <p>123 ถนนเทคโนโลยี<br />เขตบางคอแหลม กรุงเทพฯ 10120</p>
                  </div>
                </div>

                <div className="contact-info-item">
                  <div className="contact-icon">📞</div>
                  <div>
                    <h4>โทรศัพท์</h4>
                    <p>+66 2-123-4567<br />+66 89-123-4567</p>
                  </div>
                </div>

                <div className="contact-info-item">
                  <div className="contact-icon">✉️</div>
                  <div>
                    <h4>อีเมล</h4>
                    <p>info@webstudio.com<br />contact@webstudio.com</p>
                  </div>
                </div>

                <div className="contact-info-item">
                  <div className="contact-icon">🕒</div>
                  <div>
                    <h4>เวลาทำการ</h4>
                    <p>จันทร์ - ศุกร์: 9:00 - 18:00<br />เสาร์: 9:00 - 16:00</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;
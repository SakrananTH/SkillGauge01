import React from 'react';
import './Services.css';

const Services = () => {
  const services = [
    {
      icon: '🌐',
      title: 'พัฒนาเว็บไซต์',
      description: 'สร้างเว็บไซต์ที่ทันสมัยและตอบสนองได้ดีบนทุกอุปกรณ์',
      features: ['Responsive Design', 'SEO Optimized', 'Fast Loading', 'Modern UI/UX']
    },
    {
      icon: '📱',
      title: 'แอปพลิเคชันมือถือ',
      description: 'พัฒนาแอปมือถือสำหรับ iOS และ Android',
      features: ['Cross Platform', 'Native Performance', 'Push Notifications', 'Offline Support']
    },
    {
      icon: '🛒',
      title: 'E-Commerce',
      description: 'ระบบร้านค้าออนไลน์ที่ครบครันและใช้งานง่าย',
      features: ['Payment Gateway', 'Inventory Management', 'Order Tracking', 'Admin Dashboard']
    },
    {
      icon: '⚙️',
      title: 'ระบบจัดการเนื้อหา',
      description: 'CMS ที่ออกแบบมาเพื่อการจัดการเนื้อหาที่มีประสิทธิภาพ',
      features: ['Easy Content Management', 'User Roles', 'Media Library', 'SEO Tools']
    },
    {
      icon: '📊',
      title: 'ระบบวิเคราะห์ข้อมูล',
      description: 'Dashboard และรายงานเพื่อการวิเคราะห์ธุรกิจ',
      features: ['Real-time Analytics', 'Custom Reports', 'Data Visualization', 'Export Options']
    },
    {
      icon: '🔧',
      title: 'บำรุงรักษาเว็บไซต์',
      description: 'บริการดูแลและอัพเดตเว็บไซต์อย่างต่อเนื่อง',
      features: ['Regular Updates', 'Security Monitoring', 'Performance Optimization', '24/7 Support']
    }
  ];

  return (
    <div className="services-page">
      {/* Hero Section */}
      <section className="section-hero services-hero">
        <div className="container">
          <div className="hero-content">
            <h1 className="hero-title">บริการของเรา</h1>
            <p className="hero-subtitle">
              เราให้บริการพัฒนาเว็บไซต์และแอปพลิเคชันครบวงจร 
              ด้วยเทคโนโลยีล่าสุดและทีมงานมืออาชีพ
            </p>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="section services-grid-section">
        <div className="container">
          <div className="grid grid-cols-3 gap-8">
            {services.map((service, index) => (
              <div key={index} className="service-card">
                <div className="service-icon">{service.icon}</div>
                <h3 className="service-title">{service.title}</h3>
                <p className="service-description">{service.description}</p>
                <ul className="service-features">
                  {service.features.map((feature, idx) => (
                    <li key={idx}>{feature}</li>
                  ))}
                </ul>
                <button className="service-button">เรียนรู้เพิ่มเติม</button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="section process-section">
        <div className="container">
          <h2 className="section-title">ขั้นตอนการทำงาน</h2>
          <div className="process-timeline">
            <div className="process-step">
              <div className="step-number">1</div>
              <h4>ปรึกษาและวางแผน</h4>
              <p>รับฟังความต้องการและวิเคราะห์โครงการ</p>
            </div>
            <div className="process-step">
              <div className="step-number">2</div>
              <h4>ออกแบบ</h4>
              <p>สร้าง mockup และ prototype</p>
            </div>
            <div className="process-step">
              <div className="step-number">3</div>
              <h4>พัฒนา</h4>
              <p>เขียนโค้ดและพัฒนาระบบ</p>
            </div>
            <div className="process-step">
              <div className="step-number">4</div>
              <h4>ทดสอบ</h4>
              <p>ตรวจสอบคุณภาพและแก้ไขบั๊ก</p>
            </div>
            <div className="process-step">
              <div className="step-number">5</div>
              <h4>ส่งมอบ</h4>
              <p>Deploy และฝึกอบรมการใช้งาน</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Services;
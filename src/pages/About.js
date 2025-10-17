import React from 'react';
import './About.css';

const About = () => {
  return (
    <div className="about-page">
      {/* Hero Section */}
      <section className="section-hero about-hero">
        <div className="container">
          <div className="grid grid-cols-2 gap-8 items-center">
            <div>
              <h1 className="hero-title">เกี่ยวกับเรา</h1>
              <p className="hero-subtitle">
                เราคือทีมผู้เชี่ยวชาญด้านการพัฒนาเว็บไซต์และแอปพลิเคชัน 
                ที่มุ่งมั่นสร้างสรรค์โซลูชันดิจิทัลที่ตอบโจทย์ธุรกิจของคุณ
              </p>
            </div>
            <div className="hero-image">
              <div className="placeholder-image">
                📱 💻 🚀
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="section values-section">
        <div className="container">
          <h2 className="section-title">ค่านิยมของเรา</h2>
          <div className="grid grid-cols-3 gap-6">
            <div className="value-card">
              <div className="value-icon">🎯</div>
              <h3>คุณภาพ</h3>
              <p>เราใส่ใจในทุกรายละเอียดเพื่อให้ได้ผลงานที่มีคุณภาพสูงสุด</p>
            </div>
            <div className="value-card">
              <div className="value-icon">⚡</div>
              <h3>ความรวดเร็ว</h3>
              <p>ทำงานอย่างมีประสิทธิภาพเพื่อส่งมอบผลงานตรงเวลา</p>
            </div>
            <div className="value-card">
              <div className="value-icon">🤝</div>
              <h3>ความร่วมมือ</h3>
              <p>ทำงานร่วมกันอย่างใกล้ชิดกับลูกค้าเพื่อผลลัพธ์ที่ดีที่สุด</p>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="section team-section">
        <div className="container">
          <h2 className="section-title">ทีมงานของเรา</h2>
          <div className="grid grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((member) => (
              <div key={member} className="team-card">
                <div className="team-avatar">👨‍💻</div>
                <h4>สมาชิกทีม {member}</h4>
                <p>Web Developer</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
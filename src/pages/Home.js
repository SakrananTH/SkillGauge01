import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Card from '../components/Card';
import './Home.css';

const Home = () => {
  // Simple carousel images served from public/images
  const images = [
    '/S2.png',
    '/P2.png',
    '/F2.png',
  ];

  const Carousel = () => {
    const [index, setIndex] = useState(0);
    const timerRef = useRef(null);
    const intervalMs = 2500; // 2.5s

    const next = () => setIndex((prev) => (prev + 1) % images.length);
    const goTo = (i) => setIndex(i % images.length);

    useEffect(() => {
      timerRef.current = setInterval(next, intervalMs);
      return () => clearInterval(timerRef.current);
    }, []);

    const pause = () => timerRef.current && clearInterval(timerRef.current);
    const resume = () => {
      timerRef.current = setInterval(next, intervalMs);
    };

    return (
      <div className="carousel" onMouseEnter={pause} onMouseLeave={resume}>
        <div
          className="carousel-track"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {images.map((src, i) => (
            <div className="carousel-slide" key={i} aria-hidden={i !== index}>
              <img
                src={src}
                alt={`ภาพสไลด์ที่ ${i + 1}`}
                onError={(e) => {
                  const img = e.currentTarget;
                  if (!img.dataset.fallback) {
                    img.src = 'https://picsum.photos/1600/520?blur=3';
                    img.dataset.fallback = 'true';
                  }
                }}
              />
            </div>
          ))}
        </div>
        <div className="carousel-indicators" role="tablist" aria-label="ตัวบ่งชี้สไลด์">
          {images.map((_, i) => (
            <button
              key={i}
              className={`dot ${i === index ? 'active' : ''}`}
              role="tab"
              aria-label={`ไปยังสไลด์ที่ ${i + 1}`}
              aria-selected={i === index}
              onClick={() => goTo(i)}
            />
          ))}
        </div>
      </div>
    );
  };
  const services = [
    {
      title: "บริการออกแบบเว็บไซต์",
      description: "ออกแบบและพัฒนาเว็บไซต์ที่สวยงาม ทันสมัย และใช้งานง่าย ตอบสนองทุกอุปกรณ์"
    },
    {
      title: "ระบบจัดการเนื้อหา",
      description: "พัฒนาระบบจัดการเนื้อหาที่ใช้งานง่าย สามารถอัพเดทข้อมูลได้ด้วยตนเอง"
    },
    {
      title: "SEO และการตลาดออนไลน์",
      description: "ปรับแต่ง SEO และให้คำปรึกษาด้านการตลาดออนไลน์เพื่อเพิ่มยอดขาย"
    }
  ];

  return (
    <div className="home">
      <section className="hero section-hero">
        <div className="hero-carousel" aria-roledescription="carousel">
          <Carousel />
          <div className="container hero-overlay">
            <div className="grid grid-cols-2 gap-8 items-center">
              <div>
                <h1 className="hero-title">ระบบประเมินช่างก่อสร้าง</h1>
                <p className="hero-subtitle">
                  บริการออกแบบและพัฒนาเว็บไซต์มืออาชีพ ด้วยเทคโนโลยีล่าสุด 
                  ทำให้ธุรกิจของคุณโดดเด่นในโลกออนไลน์
                </p>
                <div className="flex gap-4">
                  <Link to="/contact" className="hero-button primary">
                    ติดต่อเรา
                  </Link>
                  <Link to="/services" className="hero-button secondary">
                    ดูบริการ
                  </Link>
                </div>
              </div>
              <div className="hero-image" />
            </div>
          </div>
        </div>
      </section>

      <section className="services">
        <div className="container">
          <h2 className="section-title"></h2>
          <div className="services-grid">
            {services.map((service, index) => (
              <Card
                key={index}
                title={service.title}
                description={service.description}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="about-preview">
        <div className="container">
          <div className="about-content">
            <h2>....</h2>
            <p>
             ยังไม่มีเนื้อหา
            
          
            </p>
            <button className="learn-more-btn">เรียนรู้เพิ่มเติม</button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
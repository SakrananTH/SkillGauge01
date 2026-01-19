import React, { useState, useEffect } from 'react';
import './AdminSettings.css';

const AdminSettings = ({ avatar, onAvatarChange }) => {
  const [preview, setPreview] = useState(avatar);
  const [structureOptions, setStructureOptions] = useState([
    { value: 'rebar', label: '1. งานเหล็กเสริม (Rebar)' },
    { value: 'concrete', label: '2. งานคอนกรีต (Concrete)' },
    { value: 'formwork', label: '3. งานไม้แบบ (Formwork)' },
    { value: 'tools', label: '4. องค์อาคาร: คาน/เสา/ฐานราก' },
    { value: 'theory', label: '5. ทฤษฎีแบบ/พฤติ (Design Theory)' }
  ]);

  useEffect(() => {
    setPreview(avatar);
    const storedOptions = localStorage.getItem('admin_subcategory_options');
    if (storedOptions) {
      try {
        const parsed = JSON.parse(storedOptions);
        if (parsed.structure && Array.isArray(parsed.structure)) {
          setStructureOptions(parsed.structure);
        }
      } catch (error) {
        console.error('Error loading subcategory options:', error);
      }
    }
  }, [avatar]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubcategoryChange = (index, newValue) => {
    const updated = [...structureOptions];
    updated[index].label = newValue;
    setStructureOptions(updated);
  };

  const handleSave = () => {
    if (preview) {
      localStorage.setItem('admin_avatar', preview);
    } else {
      localStorage.removeItem('admin_avatar');
    }
    if (onAvatarChange) {
      onAvatarChange(preview);
    }

    const optionsToSave = {
      structure: structureOptions,
      plumbing: [], roofing: [], masonry: [], aluminum: [], ceiling: [], electric: [], tiling: []
    };
    localStorage.setItem('admin_subcategory_options', JSON.stringify(optionsToSave));

    alert('บันทึกการตั้งค่าเรียบร้อยแล้ว');
  };

  const handleRemove = () => {
    localStorage.removeItem('admin_avatar');
    setPreview(null);
    if (onAvatarChange) {
      onAvatarChange(null);
    }
  };

  return (
    <div className="admin-settings">
      <header className="admin-settings__header">
        <h2>ตั้งค่าบัญชีผู้ใช้</h2>
        <p>จัดการข้อมูลส่วนตัวและรูปโปรไฟล์ของคุณ</p>
      </header>

      <div className="settings-card">
        <h3>รูปโปรไฟล์</h3>
        <div className="avatar-upload-section">
          <div className="avatar-preview">
            {preview ? (
              <img src={preview} alt="Profile Preview" />
            ) : (
              <div className="avatar-placeholder">
                <span>No Image</span>
              </div>
            )}
          </div>
          <div className="avatar-actions">
            <input
              type="file"
              id="avatar-upload"
              accept="image/*"
              onChange={handleImageChange}
              style={{ display: 'none' }}
            />
            <label htmlFor="avatar-upload" className="btn-upload">
              เลือกรูปภาพ
            </label>
            {preview && (
              <button type="button" className="btn-remove" onClick={handleRemove}>
                ลบรูปภาพ
              </button>
            )}
          </div>
        </div>

        <hr style={{ margin: '2rem 0', border: '0', borderTop: '1px solid #eee' }} />

        <h3>ตั้งค่าชื่อหมวดหมู่ (โครงสร้าง)</h3>
        <div className="settings-form">
          {structureOptions.map((option, index) => (
            <div key={option.value} className="form-group" style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#666' }}>
                รหัส: {option.value}
              </label>
              <input
                type="text"
                value={option.label}
                onChange={(e) => handleSubcategoryChange(index, e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              />
            </div>
          ))}
        </div>

        <div className="save-section">
          <button type="button" className="btn-save" onClick={handleSave}>
            บันทึกการเปลี่ยนแปลง
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;

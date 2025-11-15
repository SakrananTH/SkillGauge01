import React, { useState } from 'react';
import '../Dashboard.css';
import './AdminQuizBank.css';

const AdminQuizBank = () => {
  const [questions, setQuestions] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [form, setForm] = useState({
    text: '',
    category: 'safety',
    difficulty: 'easy',
    options: [
      { text: '', is_correct: false },
      { text: '', is_correct: false },
      { text: '', is_correct: false },
      { text: '', is_correct: false },
    ],
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validation
    if (!form.text.trim()) {
      alert('กรุณาใส่คำถาม');
      return;
    }
    
    const filledOptions = form.options.filter(o => o.text.trim());
    if (filledOptions.length < 2) {
      alert('ต้องมีตัวเลือกอย่างน้อย 2 ข้อ');
      return;
    }
    
    const hasCorrect = form.options.some(o => o.is_correct && o.text.trim());
    if (!hasCorrect) {
      alert('กรุณาเลือกคำตอบที่ถูกต้อง');
      return;
    }

    if (editingId) {
      // Update existing
      setQuestions(prev => prev.map(q => 
        q.id === editingId 
          ? { ...form, id: editingId, options: form.options.filter(o => o.text.trim()) }
          : q
      ));
      setEditingId(null);
    } else {
      // Add new
      const newQ = {
        ...form,
        id: Date.now(),
        options: form.options.filter(o => o.text.trim()),
      };
      setQuestions(prev => [...prev, newQ]);
    }

    // Reset form
    setForm({
      text: '',
      category: 'safety',
      difficulty: 'easy',
      options: [
        { text: '', is_correct: false },
        { text: '', is_correct: false },
        { text: '', is_correct: false },
        { text: '', is_correct: false },
      ],
    });
    setShowForm(false);
  };

  const handleEdit = (q) => {
    setEditingId(q.id);
    setForm({
      text: q.text,
      category: q.category,
      difficulty: q.difficulty,
      options: [
        ...q.options,
        ...Array(Math.max(0, 4 - q.options.length)).fill({ text: '', is_correct: false }),
      ],
    });
    setShowForm(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('ต้องการลบคำถามนี้?')) {
      setQuestions(prev => prev.filter(q => q.id !== id));
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setForm({
      text: '',
      category: 'safety',
      difficulty: 'easy',
      options: [
        { text: '', is_correct: false },
        { text: '', is_correct: false },
        { text: '', is_correct: false },
        { text: '', is_correct: false },
      ],
    });
  };

  return (
    <div className="admin-quiz-bank">
      <div className="quiz-header">
        <h2>คลังข้อสอบ</h2>
        {!showForm && (
          <button className="pill" onClick={() => setShowForm(true)}>
            + เพิ่มคำถามใหม่
          </button>
        )}
      </div>

      {showForm && (
        <div className="quiz-form-card">
          <h3>{editingId ? 'แก้ไขคำถาม' : 'เพิ่มคำถามใหม่'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <label>คำถาม *</label>
              <textarea
                value={form.text}
                onChange={(e) => setForm({ ...form, text: e.target.value })}
                placeholder="พิมพ์คำถามที่นี่..."
                rows="3"
                required
              />
            </div>

            <div className="form-row-inline">
              <div className="form-col">
                <label>หมวดหมู่</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                >
                  <option value="safety">Safety (ความปลอดภัย)</option>
                  <option value="electrical">Electrical (ไฟฟ้า)</option>
                  <option value="plumbing">Plumbing (ประปา)</option>
                  <option value="carpentry">Carpentry (ช่างไม้)</option>
                  <option value="masonry">Masonry (ช่างก่อ)</option>
                  <option value="general">General (ทั่วไป)</option>
                </select>
              </div>

              <div className="form-col">
                <label>ระดับความยาก</label>
                <select
                  value={form.difficulty}
                  onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
                >
                  <option value="easy">Easy (ง่าย)</option>
                  <option value="medium">Medium (ปานกลาง)</option>
                  <option value="hard">Hard (ยาก)</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <label>ตัวเลือก * (อย่างน้อย 2 ข้อ)</label>
              {form.options.map((opt, idx) => (
                <div key={idx} className="option-row">
                  <input
                    type="checkbox"
                    checked={opt.is_correct}
                    onChange={(e) => {
                      const newOpts = [...form.options];
                      newOpts[idx].is_correct = e.target.checked;
                      setForm({ ...form, options: newOpts });
                    }}
                    title="คำตอบที่ถูกต้อง"
                  />
                  <input
                    type="text"
                    value={opt.text}
                    onChange={(e) => {
                      const newOpts = [...form.options];
                      newOpts[idx].text = e.target.value;
                      setForm({ ...form, options: newOpts });
                    }}
                    placeholder={`ตัวเลือกที่ ${idx + 1}`}
                  />
                </div>
              ))}
              <small style={{ color: '#999', marginTop: 4 }}>
                ✓ เช็คช่องถูกต้องเพื่อระบุคำตอบที่ถูก
              </small>
            </div>

            <div className="form-actions">
              <button type="submit" className="pill primary">
                {editingId ? 'บันทึกการแก้ไข' : 'เพิ่มคำถาม'}
              </button>
              <button type="button" className="pill" onClick={handleCancel}>
                ยกเลิก
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="quiz-list">
        {questions.length === 0 && !showForm && (
          <div className="empty-state">
            <p>ยังไม่มีคำถามในคลัง</p>
            <p>คลิก "เพิ่มคำถามใหม่" เพื่อเริ่มต้น</p>
          </div>
        )}

        {questions.map((q) => (
          <div key={q.id} className="quiz-item">
            <div className="quiz-item-header">
              <div className="quiz-badges">
                <span className={`badge cat-${q.category}`}>{q.category}</span>
                <span className={`badge diff-${q.difficulty}`}>{q.difficulty}</span>
              </div>
              <div className="quiz-actions">
                <button className="btn-icon" onClick={() => handleEdit(q)} title="แก้ไข">
                  ✏️
                </button>
                <button className="btn-icon" onClick={() => handleDelete(q.id)} title="ลบ">
                  🗑️
                </button>
              </div>
            </div>
            <div className="quiz-question">{q.text}</div>
            <div className="quiz-options">
              {q.options.map((opt, idx) => (
                <div key={idx} className={`quiz-option ${opt.is_correct ? 'correct' : ''}`}>
                  {opt.is_correct && <span className="check-mark">✓</span>}
                  {opt.text}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminQuizBank;

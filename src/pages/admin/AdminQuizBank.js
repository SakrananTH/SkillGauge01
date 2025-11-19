import React, { useState } from 'react';
import '../Dashboard.css';
import './AdminQuizBank.css';

const CATEGORY_OPTIONS = [
  { value: 'safety', label: '1.ช่างโครงสร้าง' },
  { value: 'electrical', label: '2.ช่างไฟฟ้า' },
  { value: 'plumbing', label: '3.ช่างประปา' },
  { value: 'carpentry', label: '4.ช่างก่ออิฐฉาบปูน' },
  { value: 'masonry', label: '5.ช่างประตู-หน้าต่าง' },
  { value: 'general', label: '6.ช่างฝ้าเพดาน' },
  { value: 'roof', label: '7.ช่างหลังคา' },
  { value: 'tile', label: '8.ช่างกระเบื้อง' },
  { value: 'none', label: '9.ไม่มี' },
];

const DIFFICULTY_OPTIONS = [
  { value: 'easy', label: 'ระดับที่ 1' },
  { value: 'medium', label: 'ระดับที่ 2' },
  { value: 'hard', label: 'ระดับที่ 3' },
];

const CATEGORY_LABELS = CATEGORY_OPTIONS.reduce((acc, option) => {
  acc[option.value] = option.label;
  return acc;
}, {});

const DIFFICULTY_LABELS = DIFFICULTY_OPTIONS.reduce((acc, option) => {
  acc[option.value] = option.label;
  return acc;
}, {});

const createEmptyOption = () => ({ text: '', is_correct: false });

const createInitialForm = () => ({
  text: '',
  category: CATEGORY_OPTIONS[0].value,
  difficulty: DIFFICULTY_OPTIONS[0].value,
  options: Array.from({ length: 4 }, () => createEmptyOption()),
});

const MIN_OPTIONS = 2;
const MAX_OPTIONS = 8;

const AdminQuizBank = () => {
  const [questions, setQuestions] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState(createInitialForm);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validation
    if (!form.text.trim()) {
      alert('กรุณาใส่คำถาม');
      return;
    }
    
    const filledOptions = form.options.filter(o => o.text.trim());
    if (filledOptions.length < 1) {
      alert('ต้องมีตัวเลือกอย่างน้อย 1 ข้อ');
      return;
    }
    
    const hasCorrect = form.options.some(o => o.is_correct && o.text.trim());
    if (!hasCorrect) {
      alert('กรุณาเลือกคำตอบที่ถูกต้อง');
      return;
    }

    const sanitizedOptions = form.options
      .filter(o => o.text.trim())
      .map(o => ({ text: o.text.trim(), is_correct: o.is_correct }));

    const questionPayload = {
      id: editingId || Date.now(),
      text: form.text.trim(),
      category: form.category,
      difficulty: form.difficulty,
      options: sanitizedOptions,
    };

    if (editingId) {
      setQuestions(prev => prev.map(q => (q.id === editingId ? questionPayload : q)));
      setEditingId(null);
    } else {
      setQuestions(prev => [...prev, questionPayload]);
    }

    // Reset form
    setForm(createInitialForm());
    setShowForm(false);
  };

  const handleEdit = (q) => {
    setEditingId(q.id);
    const existingOptions = q.options.map(opt => ({ ...opt }));
    const paddedCount = Math.max(existingOptions.length, MIN_OPTIONS);
    const paddedOptions = [
      ...existingOptions,
      ...Array.from({ length: Math.max(0, paddedCount - existingOptions.length) }, () => createEmptyOption()),
    ];
    const categoryValue = CATEGORY_LABELS[q.category] ? q.category : CATEGORY_OPTIONS[0].value;
    const difficultyValue = DIFFICULTY_LABELS[q.difficulty] ? q.difficulty : DIFFICULTY_OPTIONS[0].value;
    setForm({
      text: q.text,
      category: categoryValue,
      difficulty: difficultyValue,
      options: paddedOptions,
    });
    setShowForm(true);
  };

  const handleAddOption = () => {
    setForm(prev => {
      if (prev.options.length >= MAX_OPTIONS) {
        alert(`เพิ่มตัวเลือกได้ไม่เกิน ${MAX_OPTIONS} ข้อ`);
        return prev;
      }
      return {
        ...prev,
        options: [...prev.options, createEmptyOption()],
      };
    });
  };

  const handleRemoveOption = (index) => {
    setForm(prev => {
      if (prev.options.length <= MIN_OPTIONS) {
        alert(`ต้องมีตัวเลือกอย่างน้อย ${MIN_OPTIONS} ข้อ`);
        return prev;
      }
      const updated = prev.options.filter((_, idx) => idx !== index);
      return {
        ...prev,
        options: updated,
      };
    });
  };

  const handleDelete = (id) => {
    if (window.confirm('ต้องการลบคำถามนี้?')) {
      setQuestions(prev => prev.filter(q => q.id !== id));
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(createInitialForm());
  };

  return (
    <div className="admin-quiz-bank">
      <div className="quiz-content">
        <div className="quiz-header">
          <h2>คลังข้อสอบ</h2>
          {!showForm && (
            <button type="button" className="pill" onClick={() => setShowForm(true)}>
              + เพิ่มคำถามใหม่
            </button>
          )}
        </div>

        {showForm && (
          <div className="quiz-form-card">
            <h3>{editingId ? 'แก้ไขคำถาม' : 'เพิ่มคำถามใหม่'}</h3>
            <form onSubmit={handleSubmit} className="quiz-form">
              <div className="form-grid form-grid--stack">
                <div className="form-group form-group--label">
                  <label htmlFor="question-text">คำถาม *</label>
                </div>
                <div className="form-group">
                  <textarea
                    id="question-text"
                    value={form.text}
                    onChange={(e) => setForm({ ...form, text: e.target.value })}
                    placeholder="พิมพ์คำถามที่นี่..."
                    rows="4"
                    required
                  />
                </div>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="question-category">หมวดหมู่</label>
                  <select
                    id="question-category"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                  >
                    {CATEGORY_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="question-difficulty">ระดับความยาก</label>
                  <select
                    id="question-difficulty"
                    value={form.difficulty}
                    onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
                  >
                    {DIFFICULTY_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-grid form-grid--stack form-grid--options">
                <div className="form-group form-group--label">
                  <label>ตัวเลือก * (อย่างน้อย 1 ข้อ)</label>
                  <span className="form-hint">✓ เช็คช่องถูกต้องเพื่อระบุคำตอบที่ถูก</span>
                </div>
                <div className="form-group">
                  <div className="options-grid">
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
                        {form.options.length > MIN_OPTIONS && (
                          <button
                            type="button"
                            className="btn-icon btn-icon--remove"
                            onClick={() => handleRemoveOption(idx)}
                            title="ลบตัวเลือก"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="options-actions">
                    <button type="button" className="pill" onClick={handleAddOption}>
                      + เพิ่มตัวเลือก
                    </button>
                  </div>
                </div>
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
                  <span className={`badge cat-${q.category}`}>{CATEGORY_LABELS[q.category] || q.category}</span>
                  <span className={`badge diff-${q.difficulty}`}>{DIFFICULTY_LABELS[q.difficulty] || q.difficulty}</span>
                </div>
                <div className="quiz-actions">
                  <button type="button" className="btn-icon" onClick={() => handleEdit(q)} title="แก้ไข" aria-label="แก้ไขคำถาม">
                    <i class='bx  bx-edit'></i> 
                  </button>
                  <button type="button" className="btn-icon" onClick={() => handleDelete(q.id)} title="ลบ" aria-label="ลบคำถาม">
                    <i class='bx  bx-trash-alt'></i> 
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
    </div>
  );
};

export default AdminQuizBank;

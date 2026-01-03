import React, { useCallback, useEffect, useState } from 'react';
import '../Dashboard.css';
import './AdminQuizBank.css';
import { apiRequest } from '../../utils/api';

const CATEGORY_OPTIONS = [
  { value: 'safety', label: '1.ช่างโครงสร้าง' },
  { value: 'electrical', label: '2.ช่างไฟฟ้า' },
  { value: 'plumbing', label: '3.ช่างประปา' },
  { value: 'carpentry', label: '4.ช่างก่ออิฐฉาบปูน' },
  { value: 'masonry', label: '5.ช่างประตู-หน้าต่าง' },
  { value: 'general', label: '6.ช่างฝ้าเพดาน' },
  { value: 'roof', label: '7.ช่างหลังคา' },
  { value: 'tile', label: '8.ช่างกระเบื้อง' },
  { value: 'none', label: '9.ไม่มี' }
];

const DIFFICULTY_OPTIONS = [
  { value: 'easy', label: 'ระดับที่ 1' },
  { value: 'medium', label: 'ระดับที่ 2' },
  { value: 'hard', label: 'ระดับที่ 3' }
];

const CATEGORY_LABELS = CATEGORY_OPTIONS.reduce((acc, option) => {
  acc[option.value] = option.label;
  return acc;
}, {});

const DIFFICULTY_LABELS = DIFFICULTY_OPTIONS.reduce((acc, option) => {
  acc[option.value] = option.label;
  return acc;
}, {});

const MIN_OPTIONS = 2;
const MAX_OPTIONS = 8;

const createEmptyOption = () => ({ text: '', isCorrect: false });

const createInitialForm = () => ({
  text: '',
  category: CATEGORY_OPTIONS[0].value,
  difficulty: DIFFICULTY_OPTIONS[0].value,
  options: Array.from({ length: 4 }, () => createEmptyOption())
});

const QUESTION_ERROR_MESSAGES = {
  invalid_text: 'กรุณาใส่คำถามให้ครบถ้วน',
  options_required: 'ต้องเพิ่มตัวเลือกอย่างน้อย 1 ข้อ',
  missing_correct_option: 'กรุณาเลือกคำตอบที่ถูกต้องอย่างน้อย 1 ตัวเลือก'
};

const SETTINGS_ERROR_MESSAGES = {
  invalid_start_at: 'รูปแบบเวลาเริ่มสอบไม่ถูกต้อง',
  invalid_end_at: 'รูปแบบเวลาปิดสอบไม่ถูกต้อง',
  end_before_start: 'เวลาปิดสอบต้องอยู่หลังเวลาเริ่มสอบ',
  settings_unavailable: 'ไม่พบการตั้งค่าการสอบในระบบ'
};

const formatDateTimeLocal = (isoString) => {
  if (!isoString) {
    return '';
  }
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const pad = (num) => String(num).padStart(2, '0');
  return [
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
    `${pad(date.getHours())}:${pad(date.getMinutes())}`
  ].join('T');
};

const toISOStringOrNull = (value) => {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toISOString();
};

const AdminQuizBank = () => {
  const [questions, setQuestions] = useState([]);
  const [questionsLoading, setQuestionsLoading] = useState(true);
  const [questionsError, setQuestionsError] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(createInitialForm);
  const [savingQuestion, setSavingQuestion] = useState(false);

  const [settings, setSettings] = useState({
    questionCount: '10',
    startAt: '',
    endAt: '',
    frequencyMonths: ''
  });
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState('');
  const [settingsError, setSettingsError] = useState('');

  const loadQuestions = useCallback(async () => {
    setQuestionsLoading(true);
    setQuestionsError('');
    try {
      const response = await apiRequest('/api/admin/questions');
      const items = Array.isArray(response?.items) ? response.items : [];
      setQuestions(items);
    } catch (error) {
      console.error('Failed to load questions', error);
      setQuestions([]);
      setQuestionsError(error?.message || 'ไม่สามารถโหลดคลังข้อสอบได้');
    } finally {
      setQuestionsLoading(false);
    }
  }, []);

  const loadSettings = useCallback(async () => {
    setSettingsError('');
    try {
      const response = await apiRequest('/api/admin/assessments/settings');
      if (response) {
        setSettings({
          questionCount: response.questionCount ? String(response.questionCount) : '10',
          startAt: formatDateTimeLocal(response.startAt),
          endAt: formatDateTimeLocal(response.endAt),
          frequencyMonths: response.frequencyMonths ? String(response.frequencyMonths) : ''
        });
      }
    } catch (error) {
      console.error('Failed to load assessment settings', error);
      setSettingsError(error?.message || 'ไม่สามารถโหลดการตั้งค่าการสอบได้');
    }
  }, []);

  useEffect(() => {
    loadQuestions();
    loadSettings();
  }, [loadQuestions, loadSettings]);

  const resetForm = useCallback(() => {
    setForm(createInitialForm());
    setEditingId(null);
    setShowForm(false);
    setSavingQuestion(false);
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.text.trim()) {
      alert('กรุณาใส่คำถาม');
      return;
    }

    const sanitizedOptions = form.options
      .map(option => ({
        text: option.text.trim(),
        isCorrect: option.text.trim().length > 0 && option.isCorrect
      }))
      .filter(option => option.text.length > 0);

    if (!sanitizedOptions.length) {
      alert('ต้องมีตัวเลือกอย่างน้อย 1 ข้อ');
      return;
    }

    if (!sanitizedOptions.some(option => option.isCorrect)) {
      alert('กรุณาเลือกคำตอบที่ถูกต้อง');
      return;
    }

    const payload = {
      text: form.text.trim(),
      category: form.category,
      difficulty: form.difficulty,
      options: sanitizedOptions
    };

    setSavingQuestion(true);
    try {
      const endpoint = editingId ? `/api/admin/questions/${editingId}` : '/api/admin/questions';
      const method = editingId ? 'PUT' : 'POST';
      const saved = await apiRequest(endpoint, { method, body: payload });
      if (saved) {
        setQuestions(prev => {
          if (editingId) {
            return prev.map(question => (question.id === saved.id ? saved : question));
          }
          return [saved, ...prev];
        });
      }
      resetForm();
    } catch (error) {
      console.error('Failed to save question', error);
      const messageKey = error?.data?.message;
      const friendly = QUESTION_ERROR_MESSAGES[messageKey] || error?.message || 'ไม่สามารถบันทึกคำถามได้';
      alert(friendly);
    } finally {
      setSavingQuestion(false);
    }
  };

  const handleEdit = (question) => {
    setEditingId(question.id);
    const baseCategory = CATEGORY_LABELS[question.category] ? question.category : CATEGORY_OPTIONS[0].value;
    const baseDifficulty = DIFFICULTY_LABELS[question.difficulty] ? question.difficulty : DIFFICULTY_OPTIONS[0].value;
    const existingOptions = Array.isArray(question.options)
      ? question.options.map(option => ({ text: option.text, isCorrect: Boolean(option.isCorrect) }))
      : [];
    const desiredLength = Math.max(existingOptions.length, MIN_OPTIONS);
    const paddedOptions = [
      ...existingOptions,
      ...Array.from({ length: Math.max(0, desiredLength - existingOptions.length) }, () => createEmptyOption())
    ];

    setForm({
      text: question.text,
      category: baseCategory,
      difficulty: baseDifficulty,
      options: paddedOptions
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
        options: [...prev.options, createEmptyOption()]
      };
    });
  };

  const handleRemoveOption = (index) => {
    setForm(prev => {
      if (prev.options.length <= MIN_OPTIONS) {
        alert(`ต้องมีตัวเลือกอย่างน้อย ${MIN_OPTIONS} ข้อ`);
        return prev;
      }
      return {
        ...prev,
        options: prev.options.filter((_, idx) => idx !== index)
      };
    });
  };

  const handleDelete = async (questionId) => {
    if (!window.confirm('ต้องการลบคำถามนี้?')) {
      return;
    }
    try {
      await apiRequest(`/api/admin/questions/${questionId}`, { method: 'DELETE' });
      setQuestions(prev => prev.filter(question => question.id !== questionId));
    } catch (error) {
      console.error('Failed to delete question', error);
      alert(error?.message || 'ไม่สามารถลบคำถามได้');
    }
  };

  const handleCancel = () => {
    resetForm();
  };

  const handleSettingsSubmit = async (event) => {
    event.preventDefault();
    setSettingsError('');
    setSettingsMessage('');

    const questionCountValue = Number.parseInt(settings.questionCount, 10);
    if (!Number.isFinite(questionCountValue) || questionCountValue < 1) {
      setSettingsError('จำนวนคำถามต้องเป็นตัวเลขตั้งแต่ 1 ข้อขึ้นไป');
      return;
    }

    let frequencyValue = null;
    if (settings.frequencyMonths) {
      frequencyValue = Number.parseInt(settings.frequencyMonths, 10);
      if (!Number.isFinite(frequencyValue) || frequencyValue < 1) {
        setSettingsError('ความถี่การสอบต้องเป็นจำนวนเดือนตั้งแต่ 1 เดือนขึ้นไป');
        return;
      }
    }

    const payload = {
      questionCount: questionCountValue,
      startAt: toISOStringOrNull(settings.startAt),
      endAt: toISOStringOrNull(settings.endAt),
      frequencyMonths: frequencyValue
    };

    setSettingsSaving(true);
    try {
      const updated = await apiRequest('/api/admin/assessments/settings', { method: 'PUT', body: payload });
      if (updated) {
        setSettings({
          questionCount: updated.questionCount ? String(updated.questionCount) : settings.questionCount,
          startAt: formatDateTimeLocal(updated.startAt),
          endAt: formatDateTimeLocal(updated.endAt),
          frequencyMonths: updated.frequencyMonths ? String(updated.frequencyMonths) : ''
        });
      }
      setSettingsMessage('บันทึกการตั้งค่าเรียบร้อย');
    } catch (error) {
      console.error('Failed to update assessment settings', error);
      const messageKey = error?.data?.message;
      const friendly = SETTINGS_ERROR_MESSAGES[messageKey] || error?.message || 'ไม่สามารถบันทึกการตั้งค่าได้';
      setSettingsError(friendly);
    } finally {
      setSettingsSaving(false);
    }
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

        <div className="quiz-form-card" style={{ marginBottom: '2rem' }}>
          <h3>ตั้งค่าการสอบประเมิน</h3>
          <form onSubmit={handleSettingsSubmit} className="quiz-form">
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="setting-question-count">จำนวนคำถามต่อรอบ *</label>
                <input
                  id="setting-question-count"
                  type="number"
                  min="1"
                  value={settings.questionCount}
                  onChange={(event) => setSettings(prev => ({ ...prev, questionCount: event.target.value }))}
                />
              </div>
              <div className="form-group">
                <label htmlFor="setting-frequency-months">ความถี่การสอบ (เดือน)</label>
                <input
                  id="setting-frequency-months"
                  type="number"
                  min="1"
                  placeholder="เช่น 2 หมายถึงทุก 2 เดือน"
                  value={settings.frequencyMonths}
                  onChange={(event) => setSettings(prev => ({ ...prev, frequencyMonths: event.target.value }))}
                />
              </div>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="setting-start">เวลาเริ่มเปิดสอบ</label>
                <input
                  id="setting-start"
                  type="datetime-local"
                  value={settings.startAt}
                  onChange={(event) => setSettings(prev => ({ ...prev, startAt: event.target.value }))}
                />
              </div>
              <div className="form-group">
                <label htmlFor="setting-end">เวลาปิดสอบ</label>
                <input
                  id="setting-end"
                  type="datetime-local"
                  value={settings.endAt}
                  onChange={(event) => setSettings(prev => ({ ...prev, endAt: event.target.value }))}
                />
              </div>
            </div>

            {settingsError && <div className="form-feedback error">{settingsError}</div>}
            {settingsMessage && <div className="form-feedback success">{settingsMessage}</div>}

            <div className="form-actions">
              <button type="submit" className="pill primary" disabled={settingsSaving}>
                {settingsSaving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}
              </button>
            </div>
          </form>
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
                    onChange={(event) => setForm({ ...form, text: event.target.value })}
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
                    onChange={(event) => setForm({ ...form, category: event.target.value })}
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
                    onChange={(event) => setForm({ ...form, difficulty: event.target.value })}
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
                    {form.options.map((option, index) => (
                      <div key={index} className="option-row">
                        <input
                          type="checkbox"
                          checked={option.isCorrect}
                          onChange={(event) => {
                            const next = [...form.options];
                            next[index].isCorrect = event.target.checked;
                            setForm({ ...form, options: next });
                          }}
                          title="คำตอบที่ถูกต้อง"
                        />
                        <input
                          type="text"
                          value={option.text}
                          onChange={(event) => {
                            const next = [...form.options];
                            next[index].text = event.target.value;
                            setForm({ ...form, options: next });
                          }}
                          placeholder={`ตัวเลือกที่ ${index + 1}`}
                        />
                        {form.options.length > MIN_OPTIONS && (
                          <button
                            type="button"
                            className="btn-icon btn-icon--remove"
                            onClick={() => handleRemoveOption(index)}
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
                <button type="submit" className="pill primary" disabled={savingQuestion}>
                  {savingQuestion ? 'กำลังบันทึก...' : editingId ? 'บันทึกการแก้ไข' : 'เพิ่มคำถาม'}
                </button>
                <button type="button" className="pill" onClick={handleCancel}>
                  ยกเลิก
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="quiz-list">
          {questionsLoading && (
            <div className="empty-state">กำลังโหลดข้อมูล...</div>
          )}

          {!questionsLoading && questionsError && (
            <div className="empty-state">{questionsError}</div>
          )}

          {!questionsLoading && !questionsError && questions.length === 0 && !showForm && (
            <div className="empty-state">
              <p>ยังไม่มีคำถามในคลัง</p>
              <p>คลิก "เพิ่มคำถามใหม่" เพื่อเริ่มต้น</p>
            </div>
          )}

          {!questionsLoading && !questionsError && questions.map(question => (
            <div key={question.id} className="quiz-item">
              <div className="quiz-item-header">
                <div className="quiz-badges">
                  <span className={`badge cat-${question.category}`}>{CATEGORY_LABELS[question.category] || question.category}</span>
                  <span className={`badge diff-${question.difficulty}`}>{DIFFICULTY_LABELS[question.difficulty] || question.difficulty}</span>
                </div>
                <div className="quiz-actions">
                  <button type="button" className="btn-icon" onClick={() => handleEdit(question)} title="แก้ไข" aria-label="แก้ไขคำถาม">
                    <i className="bx bx-edit" />
                  </button>
                  <button type="button" className="btn-icon" onClick={() => handleDelete(question.id)} title="ลบ" aria-label="ลบคำถาม">
                    <i className="bx bx-trash-alt" />
                  </button>
                </div>
              </div>
              <div className="quiz-question">{question.text}</div>
              <div className="quiz-options">
                {Array.isArray(question.options) && question.options.map((option, index) => (
                  <div key={index} className={`quiz-option ${option.isCorrect ? 'correct' : ''}`}>
                    {option.isCorrect && <span className="check-mark">✓</span>}
                    {option.text}
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

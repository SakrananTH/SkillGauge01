import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './AdminWorkerRegistration.css';

const provinceOptions = [
];

const tradeOptions = [
  { value: 'electrician', label: 'ช่างไฟฟ้า' },
  { value: 'plumber', label: 'ช่างประปา' },
  { value: 'mason', label: 'ช่างปูน' },
  { value: 'steel', label: 'ช่างเหล็ก' },
  { value: 'carpenter', label: 'ช่างไม้' },
  { value: 'hvac', label: 'ช่างเครื่องปรับอากาศ' },
  { value: 'other', label: 'อื่นๆ' }
];

const gearOptions = [
  { value: 'helmet', label: 'หมวกนิรภัย' },
  { value: 'gloves', label: 'ถุงมือ' },
  { value: 'boots', label: 'รองเท้านิรภัย' },
  { value: 'vest', label: 'เสื้อกั๊กสะท้อนแสง' }
];

const contractTypes = [
  { value: 'daily', label: 'รายวัน' },
  { value: 'monthly', label: 'รายเดือน' },
  { value: 'project', label: 'สัญญาจ้างรายโปรเจกต์' }
];

const workerStatuses = [
  { value: 'probation', label: 'ทดลองงาน' },
  { value: 'fulltime', label: 'พนักงานประจำ' },
  { value: 'external', label: 'พนักงานภายนอก' }
];

const buildInitialFormState = () => ({
  personal: {
    firstNameTh: '',
    lastNameTh: '',
    firstNameEn: '',
    lastNameEn: '',
    birthDate: '',
    gender: '',
    phone: '',
    email: '',
    photo: null
  },
  identity: {
    nationalId: '',
    issueDate: '',
    expiryDate: '',
    idCopy: null,
    houseRegistration: null
  },
  address: {
    addressOnId: '',
    currentAddress: '',
    workProvinces: []
  },
  skills: {
    tradeTypes: [],
    level: '',
    experienceYears: '',
    specialties: '',
    assessmentScore: '',
    portfolioFiles: [],
    certifications: '',
    certificationFiles: []
  },
  employment: {
    contractType: '',
    position: '',
    startDate: '',
    salary: '',
    otRate: '',
    baseLocation: '',
    workerStatus: ''
  },
  safety: {
    safetyTraining: '',
    licenseNumber: '',
    gear: [],
    healthNotes: ''
  },
  finance: {
    bankAccount: '',
    bankName: '',
    accountName: '',
    bankBookImage: null
  },
  emergency: {
    contactName: '',
    relationship: '',
    contactPhone: ''
  },
  documents: {
    applicationFile: null,
    contractFile: null,
    wageAgreementFile: null,
    safetyAgreementFile: null
  }
});

const AdminWorkerRegistration = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState(buildInitialFormState);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [isViewOnly, setIsViewOnly] = useState(false);

  useEffect(() => {
    if (location.state?.editWorker) {
      const { fullData } = location.state.editWorker;
      if (fullData) {
        setForm(fullData);
      }
      if (location.state.viewOnly) {
        setIsViewOnly(true);
      }
    }
  }, [location.state]);

  const age = useMemo(() => {
    if (!form.personal.birthDate) {
      return '';
    }
    const birth = new Date(form.personal.birthDate);
    if (Number.isNaN(birth.getTime())) {
      return '';
    }
    const today = new Date();
    let calculated = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      calculated -= 1;
    }
    return calculated >= 0 ? calculated : '';
  }, [form.personal.birthDate]);

  const progressInfo = useMemo(() => {
    const sections = [
      {
        label: 'ข้อมูลส่วนตัวพื้นฐาน',
        values: [
          form.personal.firstNameTh,
          form.personal.lastNameTh,
          form.personal.birthDate,
          form.personal.phone,
          form.personal.email
        ]
      },
      {
        label: 'ข้อมูลเอกสารยืนยันตัวตน',
        values: [
          form.identity.nationalId,
          form.identity.issueDate,
          form.identity.expiryDate,
          form.identity.idCopy,
          form.identity.houseRegistration
        ]
      },
      {
        label: 'ประวัติการทำงาน',
        values: [
          form.skills.tradeTypes,
          form.skills.level,
          form.skills.experienceYears,
          form.employment.contractType
        ]
      }
    ].map(section => {
      const totalFields = section.values.length;
      const filledCount = section.values.reduce((count, value) => {
        if (Array.isArray(value)) {
          return value.length > 0 ? count + 1 : count;
        }
        if (value && typeof value === 'object') {
          return value ? count + 1 : count;
        }
        return value ? count + 1 : count;
      }, 0);
      const progress = totalFields > 0 ? filledCount / totalFields : 0;
      return {
        label: section.label,
        completed: progress === 1,
        progress,
        percent: Math.round(progress * 100)
      };
    });

    const totalPercent = sections.length > 0
      ? Math.round(
          (sections.reduce((sum, section) => sum + section.progress, 0) / sections.length) * 100
        )
      : 0;

    return {
      sections,
      totalPercent
    };
  }, [form]);

  const { sections: progressSections, totalPercent: progressPercent } = progressInfo;

  const updateField = (section, key, value) => {
    setForm(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
  };

  const handleInputChange = (section, key) => (event) => {
    updateField(section, key, event.target.value);
  };

  const handleSingleSelectArray = (section, key) => (event) => {
    const value = event.target.value;
    updateField(section, key, value ? [value] : []);
  };

  const toggleOption = (section, key, value) => {
    setForm(prev => {
      const current = prev[section][key] || [];
      const exists = current.includes(value);
      const next = exists ? current.filter(item => item !== value) : [...current, value];
      return {
        ...prev,
        [section]: {
          ...prev[section],
          [key]: next
        }
      };
    });
  };

  const handleFileChange = (section, key, multiple = false) => (event) => {
    const files = event.target.files;
    updateField(section, key, multiple ? Array.from(files || []) : (files && files[0] ? files[0] : null));
  };

  const resetForm = () => {
    setForm(buildInitialFormState());
    setFeedback('');
  };

  const handleBack = () => {
    navigate('/admin');
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setSubmitting(true);
    setFeedback('');

    setTimeout(() => {
      const payload = {
        ...form,
        personal: {
          ...form.personal,
          age
        }
      };
      
      const existingWorkers = JSON.parse(localStorage.getItem('admin_workers') || '[]');
      const isEditing = location.state?.editWorker;
      let updatedWorkers;

      if (isEditing) {
        // Update existing worker
        updatedWorkers = existingWorkers.map(w => 
          w.id === location.state.editWorker.id 
            ? { 
                ...w, 
                name: `${form.personal.firstNameTh} ${form.personal.lastNameTh}`,
                phone: form.personal.phone,
                category: form.skills.tradeTypes.length > 0 ? form.skills.tradeTypes.join(', ') : 'ไม่ระบุ',
                level: form.skills.level || 'ไม่ระบุ',
                status: form.employment.workerStatus || 'active',
                startDate: form.employment.startDate || w.startDate,
                province: form.address.workProvinces.length > 0 ? form.address.workProvinces[0] : 'ไม่ระบุ',
                fullData: payload // Update full data
              } 
            : w
        );
        setFeedback('อัปเดตข้อมูลสำเร็จ!');
      } else {
        // Create new worker
        const newWorker = {
          id: Date.now(),
          name: `${form.personal.firstNameTh} ${form.personal.lastNameTh}`,
          phone: form.personal.phone,
          category: form.skills.tradeTypes.length > 0 ? form.skills.tradeTypes.join(', ') : 'ไม่ระบุ',
          level: form.skills.level || 'ไม่ระบุ',
          status: form.employment.workerStatus || 'active',
          startDate: form.employment.startDate || new Date().toISOString().split('T')[0],
          province: form.address.workProvinces.length > 0 ? form.address.workProvinces[0] : 'ไม่ระบุ',
          fullData: payload // Save full data
        };
        updatedWorkers = [...existingWorkers, newWorker];
        setFeedback('บันทึกข้อมูลสำเร็จ!');
      }

      localStorage.setItem('admin_workers', JSON.stringify(updatedWorkers));

      console.log('Worker saved', payload);
      setSubmitting(false);
      
      // Navigate back to table after short delay
      setTimeout(() => {
        navigate('/admin', { state: { initialTab: 'users' } });
      }, 1500);
      
    }, 1000);
  };

  const renderFileNames = (files) => {
    if (!files || files.length === 0) {
      return null;
    }
    const list = Array.isArray(files) ? files : [files];
    return (
      <ul className="file-preview">
        {list.map((file, index) => (
          <li key={`${file.name}-${index}`}>{file.name}</li>
        ))}
      </ul>
    );
  };

  return (
    <div className="registration-page">
      <div className="registration-wrapper">
        <div className="registration-nav">
          <button type="button" onClick={handleBack}>กลับหน้าแดชบอร์ด</button>
          <button type="button" onClick={() => navigate('/admin/signup')}>ไปหน้าสร้างบัญชีเข้าสู่ระบบ</button>
        </div>
        <header className="registration-header">
          <h1>แบบฟอร์มลงทะเบียนพนักงาน</h1>
          <p>เก็บข้อมูลสำคัญสำหรับ HR, การจัดทีม และความปลอดภัยในการทำงาน</p>
        </header>

        {feedback && (
          <div className="registration-feedback" role="status">
            {feedback}
          </div>
        )}

        <div className="registration-content">
          <form onSubmit={handleSubmit}>
            <section className="registration-section">
            <div className="section-header">
              <h2>1) ข้อมูลส่วนตัวพื้นฐาน</h2>
              <p>ข้อมูลหลักสำหรับระบุตัวตนและการติดต่อของพนักงาน</p>
            </div>
            <div className="field-grid two-columns">
              <div className="field">
                <label>ชื่อ - นามสกุล (ภาษาไทย)</label>
                <input type="text" value={form.personal.firstNameTh} onChange={handleInputChange('personal', 'firstNameTh')} placeholder="ชื่อ - นามสกุล จริงภาษาไทย" />
              </div>
              <div className="field">
                <label>ชื่อ - นามสกุล (ภาษาอังกฤษ)</label>
                <input type="text" value={form.personal.firstNameEn} onChange={handleInputChange('personal', 'firstNameEn')} placeholder="Full Name" />
              </div>
              <div className="field">
                <label>วันเกิด</label>
                <input type="date" value={form.personal.birthDate} onChange={handleInputChange('personal', 'birthDate')} />
              </div>
              <div className="field">
                <label>อายุ (คำนวณอัตโนมัติ)</label>
                <input type="text" value={age !== '' ? `${age} ปี` : ''} readOnly placeholder="ระบบคำนวณจากวันเกิด" />
              </div>
              <div className="field">
                <label>เพศ</label>
                <select value={form.personal.gender} onChange={handleInputChange('personal', 'gender')}>
                  <option value="">เลือกเพศ (หากจำเป็น)</option>
                  <option value="male">ชาย</option>
                  <option value="female">หญิง</option>
                  <option value="other">ไม่ระบุ</option>
                </select>
              </div>
              <div className="field">
                <label>รูปถ่ายหน้าตรง</label>
                <input type="file" accept="image/*" onChange={handleFileChange('personal', 'photo')} />
                {renderFileNames(form.personal.photo)}
              </div>
            </div>
          </section>

            <section className="registration-section">
            <div className="section-header">
              <h2>2) ข้อมูลเอกสารยืนยันตัวตน</h2>
              <p>รองรับการทำสัญญาและเอกสารทางราชการ</p>
            </div>
            <div className="field-grid two-columns">
              <div className="field">
                <label>เลขบัตรประชาชน</label>
                <input type="text" value={form.identity.nationalId} onChange={handleInputChange('identity', 'nationalId')} placeholder="x-xxxx-xxxxx-xx-x" />
              </div>
              <div className="field">
                <label>วันที่ออกบัตร</label>
                <input type="date" value={form.identity.issueDate} onChange={handleInputChange('identity', 'issueDate')} />
              </div>
              <div className="field">
                <label>วันหมดอายุ</label>
                <input type="date" value={form.identity.expiryDate} onChange={handleInputChange('identity', 'expiryDate')} />
              </div>
              <div className="field">
                <label>สำเนาบัตรประชาชน</label>
                <input type="file" accept="image/*,.pdf" onChange={handleFileChange('identity', 'idCopy')} />
                {renderFileNames(form.identity.idCopy)}
              </div>
              <div className="field">
                <label>สำเนาทะเบียนบ้าน (ถ้ามี)</label>
                <input type="file" accept="image/*,.pdf" onChange={handleFileChange('identity', 'houseRegistration')} />
                {renderFileNames(form.identity.houseRegistration)}
              </div>
            </div>
          </section>

            <section className="registration-section">
            <div className="section-header">
              <h2>3) ข้อมูลที่อยู่</h2>
              <p>ใช้สำหรับเอกสารทางราชการและการประสานงาน</p>
            </div>
            <div className="field-grid one-column">
              <div className="field">
                <label>ที่อยู่ตามบัตรประชาชน</label>
                <textarea value={form.address.addressOnId} onChange={handleInputChange('address', 'addressOnId')} rows={3} placeholder="รายละเอียดที่อยู่ตามบัตรประชาชน" />
              </div>
              <div className="field">
                <label>ที่อยู่ปัจจุบัน</label>
                <textarea value={form.address.currentAddress} onChange={handleInputChange('address', 'currentAddress')} rows={3} placeholder="รายละเอียดที่อยู่ปัจจุบัน" />
              </div>
            </div>
          </section>

            <section className="registration-section">
            <div className="section-header">
              <h2>4) ข้อมูลด้านทักษะช่าง</h2>
              <p>ใช้สำหรับจัดทีมและมอบหมายงานตามทักษะ</p>
            </div>
            <div className="field-grid two-columns">
              <div className="field trade-select-field">
                <label>ประเภทช่าง</label>
                <select value={form.skills.tradeTypes[0] || ''} onChange={handleSingleSelectArray('skills', 'tradeTypes')}>
                  <option value="">เลือกประเภทช่าง</option>
                  {tradeOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="field-grid two-columns">
              <div className="field">
                <label>ระดับทักษะ</label>
                <select value={form.skills.level} onChange={handleInputChange('skills', 'level')}>
                  <option value="">เลือกระดับทักษะ</option>
                  <option value="level1">ระดับ 1</option>
                  <option value="level2">ระดับ 2</option>
                  <option value="level3">ระดับ 3</option>
                </select>
              </div>
              <div className="field">
                <label>ประสบการณ์ทำงาน (ปี)</label>
                <input type="number" min="0" value={form.skills.experienceYears} onChange={handleInputChange('skills', 'experienceYears')} placeholder="เช่น 5" />
              </div>
              <div className="field">
                <label>ความเชี่ยวชาญเฉพาะทาง</label>
                <textarea value={form.skills.specialties} onChange={handleInputChange('skills', 'specialties')} rows={3} placeholder="เช่น เดินสายเมน, ควบคุมตู้ไฟ" />
              </div>
              <div className="field">
                <label>ผลสอบ/คะแนนจากระบบประเมินทักษะ(ถ้ามี)</label>
                <input type="text" value={form.skills.assessmentScore} onChange={handleInputChange('skills', 'assessmentScore')} placeholder="เช่น 85/100" />
              </div>
              <div className="field">
                <label>รูปผลงาน (ถ้ามี)</label>
                <input type="file" accept="image/*" multiple onChange={handleFileChange('skills', 'portfolioFiles', true)} />
                {renderFileNames(form.skills.portfolioFiles)}
              </div>
              <div className="field">
                <label>ใบเซอร์วิชาชีพ /เอกสาร(ถ้ามี)</label>
                <input type="file" accept="image/*,.pdf" multiple onChange={handleFileChange('skills', 'certificationFiles', true)} />
                {renderFileNames(form.skills.certificationFiles)}
              </div>
            </div>
          </section>
            <section className="registration-section">
            <div className="section-header">
              <h2>5) ข้อมูลการเงิน</h2>
              <p>สำหรับการโอนเงินค่าจ้างและสิทธิประโยชน์</p>
            </div>
            <div className="field-grid two-columns">
              <div className="field">
                <label>เลขบัญชีธนาคาร</label>
                <input type="text" value={form.finance.bankAccount} onChange={handleInputChange('finance', 'bankAccount')} placeholder="ระบุเลขบัญชี" />
              </div>
              <div className="field">
                <label>ธนาคาร</label>
                <input type="text" value={form.finance.bankName} onChange={handleInputChange('finance', 'bankName')} placeholder="ชื่อธนาคาร" />
              </div>
              <div className="field">
                <label>ชื่อบัญชี</label>
                <input type="text" value={form.finance.accountName} onChange={handleInputChange('finance', 'accountName')} placeholder="ชื่อ-นามสกุลตามบัญชี" />
              </div>
              <div className="field">
                <label>รูปถ่ายสมุดบัญชี (ถ้าจำเป็น)</label>
                <input type="file" accept="image/*" onChange={handleFileChange('finance', 'bankBookImage')} />
                {renderFileNames(form.finance.bankBookImage)}
              </div>
            </div>
          </section>

            <section className="registration-section">
            <div className="section-header">
              <h2>6) บุคคลติดต่อฉุกเฉิน</h2>
              <p>ใช้ติดต่อในกรณีเกิดเหตุไม่คาดคิด</p>
            </div>
            <div className="field-grid two-columns">
              <div className="field">
                <label>ชื่อผู้ติดต่อ</label>
                <input type="text" value={form.emergency.contactName} onChange={handleInputChange('emergency', 'contactName')} placeholder="ชื่อ-นามสกุล" />
              </div>
              <div className="field">
                <label>ความสัมพันธ์</label>
                <input type="text" value={form.emergency.relationship} onChange={handleInputChange('emergency', 'relationship')} placeholder="เช่น บิดา, มารดา" />
              </div>
              <div className="field">
                <label>เบอร์โทรศัพท์</label>
                <input type="tel" value={form.emergency.contactPhone} onChange={handleInputChange('emergency', 'contactPhone')} placeholder="08x-xxx-xxxx" />
              </div>
            </div>
          </section>

            <section className="registration-section">
            <div className="section-header">
              <h2>7) เอกสารประกอบอื่นๆ</h2>
              <p>แนบไฟล์เพิ่มเติมตามที่บริษัทต้องการ</p>
            </div>
            <div className="field-grid two-columns">
              <div className="field">
                <label>ใบสมัครงาน</label>
                <input type="file" accept="image/*,.pdf" onChange={handleFileChange('documents', 'applicationFile')} />
                {renderFileNames(form.documents.applicationFile)}
              </div>
              <div className="field">
                <label>สัญญาจ้างงาน</label>
                <input type="file" accept="image/*,.pdf" onChange={handleFileChange('documents', 'contractFile')} />
                {renderFileNames(form.documents.contractFile)}
              </div>
              <div className="field">
                <label>ข้อตกลงเรื่องค่าแรง</label>
                <input type="file" accept="image/*,.pdf" onChange={handleFileChange('documents', 'wageAgreementFile')} />
                {renderFileNames(form.documents.wageAgreementFile)}
              </div>
              <div className="field">
                <label>ข้อตกลงเรื่องความปลอดภัย</label>
                <input type="file" accept="image/*,.pdf" onChange={handleFileChange('documents', 'safetyAgreementFile')} />
                {renderFileNames(form.documents.safetyAgreementFile)}
              </div>
            </div>
          </section>

            <div className="registration-actions">
              {!isViewOnly && (
                <button type="submit" className="primary" disabled={submitting}>
                  {submitting ? 'กำลังบันทึก...' : (location.state?.editWorker ? 'อัปเดตข้อมูล' : 'บันทึกข้อมูลเบื้องต้น')}
                </button>
              )}
              <button 
                type="button" 
                className="secondary" 
                onClick={() => isViewOnly ? navigate('/admin', { state: { initialTab: 'users' } }) : resetForm()} 
                disabled={submitting}
              >
                {isViewOnly ? 'ย้อนกลับ' : 'ล้างฟอร์ม'}
              </button>
            </div>
          </form>

          <aside className="registration-progress-card">
            <div className="progress-card-header">
              <h3>ความคืบหน้าการสมัคร</h3>
              <span>{progressPercent}%</span>
            </div>
            <div className="progress-bar">
              <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }} />
            </div>
            <ul className="progress-step-list">
              {progressSections.map((section, index) => {
                const stepClassNames = [
                  'progress-step',
                  section.completed ? 'completed' : '',
                  !section.completed && section.progress > 0 ? 'in-progress' : ''
                ]
                  .filter(Boolean)
                  .join(' ');
                return (
                  <li key={`${section.label}-${index}`} className={stepClassNames}>
                    <span className="step-dot" aria-hidden="true" />
                    <div className="step-content">
                      <span className="step-label">{section.label}</span>
                      <span className="step-status">{section.completed ? 'ครบถ้วน' : `${section.percent}%`}</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default AdminWorkerRegistration;

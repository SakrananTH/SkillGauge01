import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './AdminWorkerRegistration.css';

const provinceOptions = [];

const tradeOptions = [
  { value: 'electrician', label: 'ช่างไฟฟ้า' },
  { value: 'plumber', label: 'ช่างประปา' },
  { value: 'mason', label: 'ช่างปูน' },
  { value: 'steel', label: 'ช่างเหล็ก' },
  { value: 'carpenter', label: 'ช่างไม้' },
  { value: 'hvac', label: 'ช่างเครื่องปรับอากาศ' },
  { value: 'other', label: 'อื่นๆ' }
];

const roleOptions = [
  { value: 'pm', label: 'ผู้จัดการโครงการ (PM)' },
  { value: 'fm', label: 'หัวหน้าช่าง (FM)' },
  { value: 'worker', label: 'ช่าง (WK)' }
];

const STEP_FLOW = [
  {
    key: 'personal',
    title: '1) ข้อมูลส่วนตัวและตำแหน่งงาน',
    label: 'ข้อมูลส่วนตัว/ตำแหน่ง',
    description: 'กรอกข้อมูลประจำตัวและรายละเอียดตำแหน่งงานของพนักงานในหน้าเดียว'
  },
  {
    key: 'address',
    title: '2) ข้อมูลที่อยู่และบัตร',
    label: 'ข้อมูลที่อยู่',
    description: 'รายละเอียดที่อยู่ จังหวัด อำเภอ ตำบล และวันออก/หมดอายุบัตร'
  },
  {
    key: 'credentials',
    title: '3) สร้างบัญชีเข้าสู่ระบบ',
    label: 'สร้างบัญชีเข้าสู่ระบบ',
    description: 'สร้างอีเมลและรหัสผ่านสำหรับเข้าสู่ระบบ'
  },
  {
    key: 'review',
    title: '4) ตรวจสอบและยืนยันข้อมูล',
    label: 'ตรวจสอบข้อมูล',
    description: 'ตรวจสอบความถูกต้องของข้อมูลทั้งหมดก่อนบันทึก'
  }
];

const STEP_INDEX_BY_KEY = STEP_FLOW.reduce((accumulator, step, index) => {
  accumulator[step.key] = index;
  return accumulator;
}, {});

const STEP_FIELD_PATHS = {
  personal: [
    ['personal', 'nationalId'],
    ['personal', 'fullName'],
    ['personal', 'birthDate'],
    ['employment', 'role'],
    ['employment', 'tradeType'],
    ['employment', 'experienceYears']
  ],
  address: [
    ['address', 'addressOnId'],
    ['address', 'province'],
    ['address', 'district'],
    ['address', 'subdistrict'],
    ['address', 'postalCode'],
    ['address', 'currentAddress'],
    ['identity', 'issueDate'],
    ['identity', 'expiryDate']
  ],
  credentials: [
    ['credentials', 'email'],
    ['credentials', 'password'],
    ['credentials', 'confirmPassword']
  ],
  review: []
};

const getValueByPath = (obj, path) => path.reduce((value, key) => {
  if (value === null || value === undefined) {
    return undefined;
  }
  return value[key];
}, obj);

const isFilledValue = (value) => {
  if (Array.isArray(value)) {
    return value.length > 0;
  }
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }
  return Boolean(value);
};

const formatDate = (value) => {
  if (!value) {
    return 'ไม่ระบุ';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  try {
    return date.toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  } catch (error) {
    return date.toISOString().split('T')[0];
  }
};

const buildInitialFormState = () => ({
  personal: {
    nationalId: '',
    fullName: '',
    birthDate: ''
  },
  identity: {
    issueDate: '',
    expiryDate: ''
  },
  address: {
    addressOnId: '',
    province: '',
    district: '',
    subdistrict: '',
    postalCode: '',
    currentAddress: ''
  },
  employment: {
    role: '',
    tradeType: '',
    experienceYears: ''
  },
  credentials: {
    email: '',
    password: '',
    confirmPassword: ''
  }
});

const AdminWorkerRegistration = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState(buildInitialFormState);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [isViewOnly, setIsViewOnly] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (location.state?.editWorker) {
      const { fullData } = location.state.editWorker;
      if (fullData) {
        const fallbackEmail = location.state.editWorker.email;
        const credentialData = fullData.credentials || {};
        setForm(prev => ({
          personal: { ...prev.personal, ...(fullData.personal || {}) },
          identity: { ...prev.identity, ...(fullData.identity || {}) },
          address: { ...prev.address, ...(fullData.address || {}) },
          employment: { ...prev.employment, ...(fullData.employment || {}) },
          credentials: {
            ...prev.credentials,
            email:
              credentialData.email ||
              fallbackEmail ||
              prev.credentials.email,
            password: '',
            confirmPassword: ''
          }
        }));
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

  const currentStepConfig = STEP_FLOW[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === STEP_FLOW.length - 1;

  const selectedRoleLabel = useMemo(() => {
    return roleOptions.find(option => option.value === form.employment.role)?.label || 'ไม่ระบุ';
  }, [form.employment.role]);

  const selectedTradeLabel = useMemo(() => {
    return tradeOptions.find(option => option.value === form.employment.tradeType)?.label || 'ไม่ระบุ';
  }, [form.employment.tradeType]);

  const reviewSections = useMemo(() => {
    const formatExperience = () => {
      if (!form.employment.experienceYears && form.employment.experienceYears !== 0) {
        return 'ไม่ระบุ';
      }
      const years = Number(form.employment.experienceYears);
      if (Number.isNaN(years)) {
        return `${form.employment.experienceYears}`;
      }
      return `${years} ปี`;
    };

    return [
      {
        key: 'personal',
        title: 'ข้อมูลส่วนตัว',
        stepIndex: 0,
        items: [
          { label: 'ชื่อ-นามสกุล', value: form.personal.fullName?.trim() || 'ไม่ระบุ' },
          { label: 'เลขบัตรประชาชน', value: form.personal.nationalId?.trim() || 'ไม่ระบุ' },
          { label: 'วันเกิด', value: formatDate(form.personal.birthDate) },
          { label: 'อายุ', value: age ? `${age} ปี` : 'ไม่ระบุ' }
        ]
      },
      {
        key: 'employment',
        title: 'ข้อมูลตำแหน่งงาน',
        stepIndex: 0,
        items: [
          { label: 'ตำแหน่ง', value: selectedRoleLabel },
          { label: 'ประเภทช่าง', value: selectedTradeLabel },
          { label: 'ประสบการณ์', value: formatExperience() }
        ]
      },
      {
        key: 'address',
        title: 'ข้อมูลที่อยู่',
        stepIndex: 1,
        items: [
          { label: 'ที่อยู่ตามบัตรประชาชน', value: form.address.addressOnId?.trim() || 'ไม่ระบุ' },
          { label: 'จังหวัด', value: form.address.province?.trim() || 'ไม่ระบุ' },
          { label: 'อำเภอ', value: form.address.district?.trim() || 'ไม่ระบุ' },
          { label: 'ตำบล', value: form.address.subdistrict?.trim() || 'ไม่ระบุ' },
          { label: 'รหัสไปรษณีย์', value: form.address.postalCode?.trim() || 'ไม่ระบุ' },
          { label: 'ที่อยู่ปัจจุบัน', value: form.address.currentAddress?.trim() || 'ไม่ระบุ' }
        ]
      },
      {
        key: 'identity',
        title: 'ข้อมูลบัตรประชาชน',
        stepIndex: 1,
        items: [
          { label: 'วันออกบัตร', value: formatDate(form.identity.issueDate) },
          { label: 'วันหมดอายุบัตร', value: formatDate(form.identity.expiryDate) }
        ]
      },
      {
        key: 'account',
        title: 'บัญชีเข้าสู่ระบบ',
        stepIndex: 2,
        items: [
          { label: 'อีเมลเข้าสู่ระบบ', value: form.credentials.email.trim() || 'ไม่ระบุ' },
          {
            label: 'รหัสผ่าน',
            value: form.credentials.password
              ? 'ตั้งรหัสผ่านเรียบร้อย'
              : 'ยังไม่กำหนด'
          }
        ]
      }
    ];
  }, [form.personal.fullName, form.personal.nationalId, form.personal.birthDate, age, selectedRoleLabel, selectedTradeLabel, form.employment.experienceYears, form.address.addressOnId, form.address.province, form.address.district, form.address.subdistrict, form.address.postalCode, form.address.currentAddress, form.identity.issueDate, form.identity.expiryDate, form.credentials.email, form.credentials.password]);

  const progressInfo = useMemo(() => {
    const sections = STEP_FLOW.map((step, index) => {
      const paths = STEP_FIELD_PATHS[step.key] || [];
      const totalFields = paths.length;
      const filledCount = paths.reduce((count, path) => {
        const value = getValueByPath(form, path);
        return isFilledValue(value) ? count + 1 : count;
      }, 0);
      let progress = totalFields > 0 ? filledCount / totalFields : 0;
      if (step.key === 'review') {
        progress = index <= currentStep ? 1 : 0;
      }
      return {
        key: step.key,
        label: step.label,
        completed: progress === 1,
        progress,
        percent: Math.round(progress * 100),
        isActive: index === currentStep
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
  }, [form, currentStep]);

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

  const validateCredentials = () => {
    const emailValue = form.credentials.email.trim();
    const passwordValue = form.credentials.password;
    const confirmValue = form.credentials.confirmPassword;
    const validationErrors = {};

    if (!emailValue) {
      validationErrors.email = 'กรุณากรอกอีเมลสำหรับเข้าสู่ระบบ';
    } else if (!/^\S+@\S+\.\S+$/.test(emailValue)) {
      validationErrors.email = 'รูปแบบอีเมลไม่ถูกต้อง';
    }

    if (!passwordValue) {
      validationErrors.password = 'กรุณากำหนดรหัสผ่าน';
    } else if (passwordValue.length < 8) {
      validationErrors.password = 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร';
    }

    if (!confirmValue) {
      validationErrors.confirmPassword = 'กรุณายืนยันรหัสผ่าน';
    } else if (passwordValue !== confirmValue) {
      validationErrors.confirmPassword = 'รหัสผ่านไม่ตรงกัน';
    }

    return {
      errors: validationErrors,
      values: {
        email: emailValue,
        password: passwordValue,
        confirmPassword: confirmValue
      }
    };
  };

  const handleInputChange = (section, key) => (event) => {
    updateField(section, key, event.target.value);
    if (section === 'credentials' && errors[key]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const resetForm = () => {
    setForm(buildInitialFormState());
    setFeedback('');
    setCurrentStep(0);
    setErrors({});
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const handleBack = () => {
    navigate('/admin');
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setFeedback('');
    const { errors: credentialErrors, values } = validateCredentials();

    if (Object.keys(credentialErrors).length > 0) {
      setErrors(credentialErrors);
      const credentialStepIndex = STEP_INDEX_BY_KEY.credentials;
      if (credentialStepIndex !== undefined) {
        setCurrentStep(credentialStepIndex);
      }
      return;
    }

    setErrors({});

    if (values.email !== form.credentials.email) {
      setForm(prev => ({
        ...prev,
        credentials: {
          ...prev.credentials,
          email: values.email
        }
      }));
    }

    setSubmitting(true);

    setTimeout(() => {
      const payload = {
        personal: {
          ...form.personal,
          age
        },
        identity: { ...form.identity },
        address: { ...form.address },
        employment: { ...form.employment },
        credentials: {
          email: values.email,
          password: values.password
        }
      };

      const roleLabel = selectedRoleLabel;
      const tradeLabel = selectedTradeLabel;

      const existingWorkers = JSON.parse(localStorage.getItem('admin_workers') || '[]');
      const isEditing = location.state?.editWorker;
      let updatedWorkers;

      if (isEditing) {
        updatedWorkers = existingWorkers.map(w =>
          w.id === location.state.editWorker.id
            ? {
                ...w,
                name: form.personal.fullName || 'ไม่ระบุ',
                phone: w.phone || '',
                role: roleLabel,
                category: tradeLabel,
                level: tradeLabel,
                status: w.status || 'active',
                startDate: w.startDate || new Date().toISOString().split('T')[0],
                province: form.address.province || 'ไม่ระบุ',
                email: values.email,
                fullData: payload
              }
            : w
        );
        setFeedback('อัปเดตข้อมูลสำเร็จ!');
      } else {
        const newWorker = {
          id: Date.now(),
          name: form.personal.fullName || 'ไม่ระบุ',
          phone: '',
          role: roleLabel,
          category: tradeLabel,
          level: tradeLabel,
          status: 'active',
          startDate: new Date().toISOString().split('T')[0],
          province: form.address.province || 'ไม่ระบุ',
          email: values.email,
          fullData: payload
        };
        updatedWorkers = [...existingWorkers, newWorker];
        setFeedback('บันทึกข้อมูลสำเร็จ!');
      }

      localStorage.setItem('admin_workers', JSON.stringify(updatedWorkers));

      console.log('Worker saved', payload);
      setSubmitting(false);

      setTimeout(() => {
        navigate('/admin', { state: { initialTab: 'users' } });
      }, 1500);
    }, 1000);
  };

  const handleNextStep = () => {
    const nextStepIndex = Math.min(currentStep + 1, STEP_FLOW.length - 1);

    if (currentStepConfig.key === 'credentials' && !isViewOnly) {
      const { errors: credentialErrors, values } = validateCredentials();
      if (Object.keys(credentialErrors).length > 0) {
        setErrors(credentialErrors);
        return;
      }
      if (values.email !== form.credentials.email) {
        setForm(prev => ({
          ...prev,
          credentials: {
            ...prev.credentials,
            email: values.email
          }
        }));
      }
      if (Object.keys(errors).length > 0) {
        setErrors({});
      }
    }

    setCurrentStep(nextStepIndex);
  };

  const handlePreviousStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const handleStepSelect = (stepIndex) => {
    const clampedTarget = Math.min(Math.max(stepIndex, 0), STEP_FLOW.length - 1);
    const targetStep = STEP_FLOW[clampedTarget];

    if (!isViewOnly && targetStep?.key === 'review') {
      const { errors: credentialErrors, values } = validateCredentials();
      if (Object.keys(credentialErrors).length > 0) {
        setErrors(credentialErrors);
        const credentialStepIndex = STEP_INDEX_BY_KEY.credentials;
        if (credentialStepIndex !== undefined) {
          setCurrentStep(credentialStepIndex);
        }
        return;
      }
      if (values.email !== form.credentials.email) {
        setForm(prev => ({
          ...prev,
          credentials: {
            ...prev.credentials,
            email: values.email
          }
        }));
      }
      if (Object.keys(errors).length > 0) {
        setErrors({});
      }
    }

    setCurrentStep(clampedTarget);
  };

  const handleStepKeyDown = (event, stepIndex) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleStepSelect(stepIndex);
    }
  };

  const renderStepFields = () => {
    switch (currentStepConfig.key) {
      case 'personal':
        return (
          <div className="field-stack">
            <section className="field-section">
              <h3 className="field-section-title">ข้อมูลส่วนตัว</h3>
              <div className="field-grid two-columns">
                <div className="field">
                  <label>เลขบัตรประชาชน</label>
                  <input
                    type="text"
                    value={form.personal.nationalId}
                    onChange={handleInputChange('personal', 'nationalId')}
                    placeholder="x-xxxx-xxxxx-xx-x"
                  />
                </div>
                <div className="field">
                  <label>ชื่อ-นามสกุล</label>
                  <input
                    type="text"
                    value={form.personal.fullName}
                    onChange={handleInputChange('personal', 'fullName')}
                    placeholder="ชื่อและนามสกุล"
                  />
                </div>
                <div className="field">
                  <label>วันเกิด</label>
                  <input
                    type="date"
                    value={form.personal.birthDate}
                    onChange={handleInputChange('personal', 'birthDate')}
                  />
                </div>
                <div className="field">
                  <label>อายุ (คำนวณอัตโนมัติ)</label>
                  <input
                    type="text"
                    value={age !== '' ? `${age} ปี` : ''}
                    readOnly
                    placeholder="ระบบคำนวณจากวันเกิด"
                  />
                </div>
              </div>
            </section>

            <section className="field-section">
              <h3 className="field-section-title">ข้อมูลตำแหน่งงาน</h3>
              <div className="field-grid two-columns">
                <div className="field">
                  <label>Role</label>
                  <select
                    value={form.employment.role}
                    onChange={handleInputChange('employment', 'role')}
                  >
                    <option value="">เลือก Role</option>
                    {roleOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label>ประเภทช่าง</label>
                  <select
                    value={form.employment.tradeType}
                    onChange={handleInputChange('employment', 'tradeType')}
                  >
                    <option value="">เลือกประเภทช่าง</option>
                    {tradeOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label>ประสบการณ์ (ปี)</label>
                  <input
                    type="number"
                    min="0"
                    value={form.employment.experienceYears}
                    onChange={handleInputChange('employment', 'experienceYears')}
                    placeholder="เช่น 5"
                  />
                </div>
              </div>
            </section>
          </div>
        );
      case 'address':
        return (
          <div className="field-grid one-column">
            <div className="field">
              <label>ที่อยู่ตามบัตรประชาชน</label>
              <textarea
                value={form.address.addressOnId}
                onChange={handleInputChange('address', 'addressOnId')}
                rows={3}
                placeholder="บ้านเลขที่ หมู่ ซอย ถนน"
              />
            </div>

            <div className="field-grid two-columns">
              <div className="field">
                <label>จังหวัด</label>
                <input
                  type="text"
                  value={form.address.province}
                  onChange={handleInputChange('address', 'province')}
                  placeholder="จังหวัด"
                />
              </div>
              <div className="field">
                <label>อำเภอ</label>
                <input
                  type="text"
                  value={form.address.district}
                  onChange={handleInputChange('address', 'district')}
                  placeholder="อำเภอ"
                />
              </div>
              <div className="field">
                <label>ตำบล</label>
                <input
                  type="text"
                  value={form.address.subdistrict}
                  onChange={handleInputChange('address', 'subdistrict')}
                  placeholder="ตำบล"
                />
              </div>
              <div className="field">
                <label>รหัสไปรษณีย์</label>
                <input
                  type="text"
                  value={form.address.postalCode}
                  onChange={handleInputChange('address', 'postalCode')}
                  placeholder="xxxxx"
                />
              </div>
            </div>

            <div className="field">
              <label>ที่อยู่ปัจจุบัน</label>
              <textarea
                value={form.address.currentAddress}
                onChange={handleInputChange('address', 'currentAddress')}
                rows={3}
                placeholder="รายละเอียดที่อยู่ปัจจุบัน"
              />
            </div>

            <div className="field-grid two-columns">
              <div className="field">
                <label>วันออกบัตร</label>
                <input
                  type="date"
                  value={form.identity.issueDate}
                  onChange={handleInputChange('identity', 'issueDate')}
                />
              </div>
              <div className="field">
                <label>วันหมดอายุบัตร</label>
                <input
                  type="date"
                  value={form.identity.expiryDate}
                  onChange={handleInputChange('identity', 'expiryDate')}
                />
              </div>
            </div>
          </div>
        );
      case 'credentials':
        return (
          <div className="account-step">
            <section className="account-note">
              <h3>ขั้นตอนนี้ทำอะไร?</h3>
              <p>
                เราจะสร้างบัญชีเข้าสู่ระบบโดยใช้อีเมลและรหัสผ่านสำหรับพนักงาน ผู้ใช้งานสามารถเปลี่ยนรหัสผ่านได้ภายหลัง
                เพื่อความปลอดภัย กรุณากำหนดรหัสผ่านอย่างน้อย 8 ตัวอักษร และผสมตัวเลขหรืออักขระพิเศษ
              </p>
            </section>

            <div className="account-form">
              <div className="field-grid one-column credentials-grid">
                <div className="field">
                  <label>อีเมลสำหรับเข้าสู่ระบบ</label>
                  <input
                    type="email"
                    value={form.credentials.email}
                    onChange={handleInputChange('credentials', 'email')}
                    placeholder="example@mail.com"
                    className={errors.email ? 'error' : ''}
                  />
                  {errors.email && <span className="error-message">{errors.email}</span>}
                  <span className="help-text">หากไม่มีอีเมลบริษัท ให้สร้างอีเมลชั่วคราวสำหรับเข้าระบบ</span>
                </div>
                <div className="field">
                  <label>รหัสผ่าน</label>
                  <div className="password-input">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={form.credentials.password}
                      onChange={handleInputChange('credentials', 'password')}
                      placeholder="********"
                      className={errors.password ? 'error' : ''}
                    />
                    <button
                      type="button"
                      className="toggle-visibility"
                      onClick={() => setShowPassword(prev => !prev)}
                      aria-label={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                    >
                      {showPassword ? 'ซ่อน' : 'แสดง'}
                    </button>
                  </div>
                  {errors.password && <span className="error-message">{errors.password}</span>}
                  <span className="help-text">รหัสผ่านอย่างน้อย 8 ตัวอักษร แนะนำให้ผสมตัวเลขและอักขระพิเศษ</span>
                </div>
                <div className="field">
                  <label>ยืนยันรหัสผ่าน</label>
                  <div className="password-input">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={form.credentials.confirmPassword}
                      onChange={handleInputChange('credentials', 'confirmPassword')}
                      placeholder="********"
                      className={errors.confirmPassword ? 'error' : ''}
                    />
                    <button
                      type="button"
                      className="toggle-visibility"
                      onClick={() => setShowConfirmPassword(prev => !prev)}
                      aria-label={showConfirmPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                    >
                      {showConfirmPassword ? 'ซ่อน' : 'แสดง'}
                    </button>
                  </div>
                  {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
                </div>
              </div>
            </div>
          </div>
        );
      case 'review':
        return (
          <div className="review-step">
            <section className="review-intro">
              <h3>ตรวจสอบข้อมูลก่อนยืนยัน</h3>
              <p>ตรวจสอบรายละเอียดทุกส่วนให้ถูกต้อง หากข้อมูลใดไม่ถูกต้องสามารถกดปุ่มแก้ไขเพื่อกลับไปแก้ในขั้นตอนก่อนหน้า</p>
            </section>

            <div className="review-grid">
              {reviewSections.map(section => (
                <div key={section.key} className="review-card">
                  <div className="review-card-header">
                    <h4 className="review-card-title">{section.title}</h4>
                    {!isViewOnly && (
                      <button
                        type="button"
                        className="review-card-edit"
                        onClick={() => handleStepSelect(section.stepIndex)}
                      >
                        แก้ไข
                      </button>
                    )}
                  </div>
                  <dl className="review-list">
                    {section.items.map(item => (
                      <div key={`${section.key}-${item.label}`} className="review-list-row">
                        <dt>{item.label}</dt>
                        <dd>{item.value || 'ไม่ระบุ'}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ))}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="registration-page">
      <div className="registration-wrapper">
        <div className="registration-nav">
          <button type="button" onClick={handleBack}>กลับหน้าแดชบอร์ด</button>
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
                <h2>{currentStepConfig.title}</h2>
                <p>{currentStepConfig.description}</p>
              </div>
              {renderStepFields()}
            </section>

            <div className="registration-actions">
              <div className="wizard-nav-buttons">
                {!isFirstStep && (
                  <button type="button" className="secondary" onClick={handlePreviousStep}>
                    ย้อนกลับ
                  </button>
                )}
                {!isLastStep && (
                  <button type="button" className="primary" onClick={handleNextStep}>
                    ไปหน้าถัดไป
                  </button>
                )}
                {isLastStep && !isViewOnly && (
                  <button type="submit" className="primary" disabled={submitting}>
                    {submitting
                      ? 'กำลังบันทึก...'
                      : (location.state?.editWorker ? 'อัปเดตข้อมูล' : 'บันทึกข้อมูลเบื้องต้น')}
                  </button>
                )}
              </div>
              <button
                type="button"
                className="secondary"
                onClick={() =>
                  isViewOnly
                    ? navigate('/admin', { state: { initialTab: 'users' } })
                    : resetForm()
                }
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
                  !section.completed && section.progress > 0 ? 'in-progress' : '',
                  section.isActive ? 'active' : ''
                ]
                  .filter(Boolean)
                  .join(' ');
                let statusLabel;
                if (section.key === 'review') {
                  if (section.completed) {
                    statusLabel = 'พร้อมยืนยัน';
                  } else if (section.isActive) {
                    statusLabel = 'กำลังตรวจสอบ';
                  } else {
                    statusLabel = 'รอตรวจสอบ';
                  }
                } else {
                  statusLabel = section.completed
                    ? 'ครบถ้วน'
                    : section.isActive
                      ? 'กำลังกรอก'
                      : `${section.percent}%`;
                }
                return (
                  <li
                    key={`${section.label}-${index}`}
                    className={stepClassNames}
                    role="button"
                    tabIndex={0}
                    aria-current={section.isActive ? 'step' : undefined}
                    onClick={() => handleStepSelect(index)}
                    onKeyDown={(event) => handleStepKeyDown(event, index)}
                  >
                    <span className="step-dot" aria-hidden="true" />
                    <div className="step-content">
                      <span className="step-label">{section.label}</span>
                      <span className="step-status">{statusLabel}</span>
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

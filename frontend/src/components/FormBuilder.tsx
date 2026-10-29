import React, { useState } from 'react';
import { Plus, X, Calendar, Radio } from 'lucide-react';
import API from '../api';

interface FormField {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'select' | 'radio' | 'checkbox';
  required: boolean;
  order: number;
  options?: Array<{ value: string; label: string }>;
  placeholder?: string;
}

interface FormBuilderProps {
  onFormCreated?: () => void;
}

export const FormBuilder: React.FC<FormBuilderProps> = ({ onFormCreated }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [exportInterval, setExportInterval] = useState(7);
  const [expirationDate, setExpirationDate] = useState('');
  const [fields, setFields] = useState<FormField[]>([]);
  const [nextFieldId, setNextFieldId] = useState(1);
  const [editingFieldId, setEditingFieldId] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [loading, setLoading] = useState(false);

  const [currentFieldLabel, setCurrentFieldLabel] = useState('');
  const [currentFieldType, setCurrentFieldType] = useState<FormField['type']>('text');
  const [currentFieldRequired, setCurrentFieldRequired] = useState(false);
  const [currentFieldOptions, setCurrentFieldOptions] = useState('');
  const [currentFieldPlaceholder, setCurrentFieldPlaceholder] = useState('');

  const handleAddField = () => {
    if (!currentFieldLabel.trim()) {
      setMessage('برچسب فیلد را وارد کنید.');
      setMessageType('error');
      return;
    }

    const newField: FormField = {
      name: `field_${nextFieldId}`,
      label: currentFieldLabel.trim(),
      type: currentFieldType,
      required: currentFieldRequired,
      order: fields.length,
      placeholder: currentFieldPlaceholder || undefined,
    };

    // اگر فیلد دارای options است
    if (['select', 'radio', 'checkbox'].includes(currentFieldType) && currentFieldOptions.trim()) {
      newField.options = currentFieldOptions
        .split('\n')
        .filter(line => line.trim())
        .map((line, idx) => ({
          value: `option_${idx}`,
          label: line.trim()
        }));
    }

    if (editingFieldId !== null) {
      // ویرایش فیلد موجود
      setFields(fields.map(f => f.name === `field_${editingFieldId}` ? newField : f));
      setEditingFieldId(null);
    } else {
      // افزودن فیلد جدید
      setFields([...fields, newField]);
    }

    setNextFieldId(nextFieldId + 1);
    resetFieldForm();
    setMessage('');
  };

  const resetFieldForm = () => {
    setCurrentFieldLabel('');
    setCurrentFieldType('text');
    setCurrentFieldRequired(false);
    setCurrentFieldOptions('');
    setCurrentFieldPlaceholder('');
    setEditingFieldId(null);
  };

  const handleEditField = (index: number) => {
    const field = fields[index];
    setCurrentFieldLabel(field.label);
    setCurrentFieldType(field.type);
    setCurrentFieldRequired(field.required);
    setCurrentFieldPlaceholder(field.placeholder || '');
    if (field.options) {
      setCurrentFieldOptions(field.options.map(o => o.label).join('\n'));
    }
    setEditingFieldId(index);
  };

  const handleDeleteField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index));
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      setMessage('عنوان فرم الزامی است.');
      setMessageType('error');
      return;
    }

    if (!expirationDate) {
      setMessage('تاریخ انقضا الزامی است.');
      setMessageType('error');
      return;
    }

    if (fields.length === 0) {
      setMessage('حداقل یک فیلد برای فرم الزامی است.');
      setMessageType('error');
      return;
    }

    setLoading(true);

    try {
      // تبدیل تاریخ input (YYYY-MM-DD) به ISO format
      const expDate = new Date(expirationDate);
      expDate.setHours(23, 59, 59);

      const payload = {
        title: title.trim(),
        description: description.trim() || '',
        export_interval_days: parseInt(exportInterval.toString()),
        expiration_date: expDate.toISOString(),
        fields_schema: fields
      };

      const response = await API.post('custom-forms/', payload);

      if (response.status === 201) {
        setMessage('فرم با موفقیت ایجاد شد ✨');
        setMessageType('success');
        
        // ریست فرم
        setTitle('');
        setDescription('');
        setExportInterval(7);
        setExpirationDate('');
        setFields([]);
        setNextFieldId(1);

        if (onFormCreated) {
          setTimeout(() => onFormCreated(), 1500);
        }
      }
    } catch (err: any) {
      console.error('Error creating form:', err);
      setMessage('خطا در ایجاد فرم. لطفاً دوباره تلاش کنید.');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      backgroundColor: 'rgba(23, 14, 46, 0.85)',
      backdropFilter: 'blur(16px)',
      border: '1.5px solid rgba(217, 70, 239, 0.4)',
      borderRadius: '1.75rem',
      padding: '1.5rem',
      boxShadow: '0 0 30px rgba(162, 28, 175, 0.25)',
      direction: 'rtl'
    }}>
      <h2 style={{ margin: '0 0 1.25rem', fontSize: '1.3rem', fontWeight: 800, color: '#f0abfc' }}>
        سازندۀ فرم سفارشی
      </h2>

      {message && (
        <div style={{
          marginBottom: '1rem',
          padding: '0.75rem',
          backgroundColor: messageType === 'success' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
          border: messageType === 'success' ? '1px solid rgba(34, 197, 94, 0.4)' : '1px solid rgba(239, 68, 68, 0.4)',
          borderRadius: '0.75rem',
          color: messageType === 'success' ? '#86efac' : '#ef5350',
          fontSize: '0.85rem',
          textAlign: 'center'
        }}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmitForm} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* اطلاعات کلی */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div>
            <label style={{ fontSize: '0.8rem', color: '#d8b4fe', marginBottom: '0.3rem', display: 'block' }}>
              عنوان فرم <span style={{ color: '#ef5350' }}>*</span>
            </label>
            <input
              type="text"
              placeholder="مثال: بازخورد رشد فردی"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              style={{
                width: '100%',
                backgroundColor: 'rgba(15, 10, 30, 0.7)',
                border: '1px solid rgba(168, 85, 247, 0.4)',
                borderRadius: '0.75rem',
                padding: '0.6rem 0.8rem',
                color: '#fff',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', color: '#d8b4fe', marginBottom: '0.3rem', display: 'block' }}>
              توضیحات (اختیاری)
            </label>
            <input
              type="text"
              placeholder="توضیح کوتاه درباره فرم"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{
                width: '100%',
                backgroundColor: 'rgba(15, 10, 30, 0.7)',
                border: '1px solid rgba(168, 85, 247, 0.4)',
                borderRadius: '0.75rem',
                padding: '0.6rem 0.8rem',
                color: '#fff',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>
        </div>

        {/* تنظیمات ضروری: Export Interval و Expiration Date */}
        <div style={{
          backgroundColor: 'rgba(40, 20, 70, 0.4)',
          border: '1px solid rgba(168, 85, 247, 0.3)',
          borderRadius: '1rem',
          padding: '1rem'
        }}>
          <h3 style={{ margin: '0 0 0.75rem', fontSize: '0.95rem', fontWeight: 700, color: '#e879f9' }}>
            تنظیمات ضروری
          </h3>

          {/* Export Interval - Radio Buttons */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ fontSize: '0.85rem', color: '#d8b4fe', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Radio style={{ width: '16px', height: '16px' }} />
              دوره تجمیع و صادرات داده‌ها <span style={{ color: '#ef5350' }}>*</span>
            </label>
            <div style={{ display: 'flex', gap: '1rem', marginLeft: '1.5rem' }}>
              {[3, 5, 7].map((days) => (
                <label key={days} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  cursor: 'pointer',
                  color: '#e9d5ff'
                }}>
                  <input
                    type="radio"
                    name="exportInterval"
                    value={days}
                    checked={exportInterval === days}
                    onChange={(e) => setExportInterval(parseInt(e.target.value))}
                    style={{ cursor: 'pointer', accentColor: '#a21caf' }}
                  />
                  {days} روز
                </label>
              ))}
            </div>
          </div>

          {/* Expiration Date */}
          <div>
            <label style={{ fontSize: '0.85rem', color: '#d8b4fe', marginBottom: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Calendar style={{ width: '16px', height: '16px' }} />
              تاریخ انقضای فرم <span style={{ color: '#ef5350' }}>*</span>
            </label>
            <input
              type="date"
              value={expirationDate}
              onChange={(e) => setExpirationDate(e.target.value)}
              required
              style={{
                width: '100%',
                backgroundColor: 'rgba(15, 10, 30, 0.7)',
                border: '1px solid rgba(168, 85, 247, 0.4)',
                borderRadius: '0.75rem',
                padding: '0.6rem 0.8rem',
                color: '#fff',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>
        </div>

        {/* اضافه کردن فیلدهای فرم */}
        <div style={{
          backgroundColor: 'rgba(40, 20, 70, 0.4)',
          border: '1px solid rgba(168, 85, 247, 0.3)',
          borderRadius: '1rem',
          padding: '1rem'
        }}>
          <h3 style={{ margin: '0 0 0.75rem', fontSize: '0.95rem', fontWeight: 700, color: '#e879f9' }}>
            فیلدهای فرم <span style={{ color: '#ef5350' }}>*</span>
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div>
              <label style={{ fontSize: '0.75rem', color: '#d8b4fe', marginBottom: '0.2rem', display: 'block' }}>
                برچسب فیلد
              </label>
              <input
                type="text"
                placeholder="مثال: نام شما"
                value={currentFieldLabel}
                onChange={(e) => setCurrentFieldLabel(e.target.value)}
                style={{
                  width: '100%',
                  backgroundColor: 'rgba(15, 10, 30, 0.7)',
                  border: '1px solid rgba(168, 85, 247, 0.4)',
                  borderRadius: '0.5rem',
                  padding: '0.5rem 0.6rem',
                  color: '#fff',
                  outline: 'none',
                  boxSizing: 'border-box',
                  fontSize: '0.85rem'
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', color: '#d8b4fe', marginBottom: '0.2rem', display: 'block' }}>
                نوع فیلد
              </label>
              <select
                value={currentFieldType}
                onChange={(e) => setCurrentFieldType(e.target.value as FormField['type'])}
                style={{
                  width: '100%',
                  backgroundColor: 'rgba(15, 10, 30, 0.7)',
                  border: '1px solid rgba(168, 85, 247, 0.4)',
                  borderRadius: '0.5rem',
                  padding: '0.5rem 0.6rem',
                  color: '#fff',
                  outline: 'none',
                  boxSizing: 'border-box',
                  fontSize: '0.85rem'
                }}
              >
                <option value="text">متن ساده</option>
                <option value="textarea">متن طویل</option>
                <option value="number">عدد</option>
                <option value="select">لیست انتخابی</option>
                <option value="radio">دکمه‌های رادیویی</option>
                <option value="checkbox">چک‌باکس</option>
              </select>
            </div>
          </div>

          {/* Placeholder */}
          <div style={{ marginBottom: '0.75rem' }}>
            <label style={{ fontSize: '0.75rem', color: '#d8b4fe', marginBottom: '0.2rem', display: 'block' }}>
              متن راهنما (اختیاری)
            </label>
            <input
              type="text"
              placeholder="مثال: لطفاً پاسخ دقیق دهید"
              value={currentFieldPlaceholder}
              onChange={(e) => setCurrentFieldPlaceholder(e.target.value)}
              style={{
                width: '100%',
                backgroundColor: 'rgba(15, 10, 30, 0.7)',
                border: '1px solid rgba(168, 85, 247, 0.4)',
                borderRadius: '0.5rem',
                padding: '0.5rem 0.6rem',
                color: '#fff',
                outline: 'none',
                boxSizing: 'border-box',
                fontSize: '0.85rem'
              }}
            />
          </div>

          {/* Options برای Select, Radio, Checkbox */}
          {['select', 'radio', 'checkbox'].includes(currentFieldType) && (
            <div style={{ marginBottom: '0.75rem' }}>
              <label style={{ fontSize: '0.75rem', color: '#d8b4fe', marginBottom: '0.2rem', display: 'block' }}>
                گزینه‌ها (هر خط یک گزینه)
              </label>
              <textarea
                placeholder="گزینه 1&#10;گزینه 2&#10;گزینه 3"
                value={currentFieldOptions}
                onChange={(e) => setCurrentFieldOptions(e.target.value)}
                rows={3}
                style={{
                  width: '100%',
                  backgroundColor: 'rgba(15, 10, 30, 0.7)',
                  border: '1px solid rgba(168, 85, 247, 0.4)',
                  borderRadius: '0.5rem',
                  padding: '0.5rem 0.6rem',
                  color: '#fff',
                  outline: 'none',
                  boxSizing: 'border-box',
                  fontSize: '0.85rem',
                  resize: 'none'
                }}
              />
            </div>
          )}

          {/* Required و دکمه افزودن */}
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#e9d5ff', cursor: 'pointer', flex: 1 }}>
              <input
                type="checkbox"
                checked={currentFieldRequired}
                onChange={(e) => setCurrentFieldRequired(e.target.checked)}
                style={{ cursor: 'pointer', accentColor: '#a21caf' }}
              />
              <span style={{ fontSize: '0.8rem' }}>فیلد الزامی</span>
            </label>
            <button
              type="button"
              onClick={handleAddField}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '0.5rem',
                border: 'none',
                background: 'linear-gradient(90deg, #a21caf, #701a75)',
                color: '#fff',
                fontWeight: 700,
                cursor: 'pointer',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem'
              }}
            >
              <Plus style={{ width: '16px', height: '16px' }} />
              {editingFieldId !== null ? 'ذخیره تغییرات' : 'افزودن فیلد'}
            </button>
          </div>
        </div>

        {/* لیست فیلدهای اضافه شده */}
        {fields.length > 0 && (
          <div style={{
            backgroundColor: 'rgba(40, 20, 70, 0.3)',
            border: '1px solid rgba(168, 85, 247, 0.3)',
            borderRadius: '1rem',
            padding: '1rem'
          }}>
            <h4 style={{ margin: '0 0 0.75rem', fontSize: '0.9rem', color: '#e879f9' }}>
              فیلدهای فرم ({fields.length})
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {fields.map((field, idx) => (
                <div
                  key={field.name}
                  style={{
                    backgroundColor: 'rgba(23, 14, 46, 0.5)',
                    border: '1px solid rgba(217, 70, 239, 0.3)',
                    borderRadius: '0.5rem',
                    padding: '0.6rem 0.8rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ color: '#e9d5ff', fontSize: '0.9rem', fontWeight: 600 }}>
                      {field.label}
                    </div>
                    <div style={{ color: '#a8a8ff', fontSize: '0.75rem' }}>
                      {field.type} {field.required ? '• الزامی' : '• اختیاری'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.3rem' }}>
                    <button
                      type="button"
                      onClick={() => handleEditField(idx)}
                      style={{
                        padding: '0.4rem 0.8rem',
                        borderRadius: '0.4rem',
                        border: 'none',
                        backgroundColor: 'rgba(168, 85, 247, 0.3)',
                        color: '#fff',
                        fontSize: '0.75rem',
                        cursor: 'pointer'
                      }}
                    >
                      ویرایش
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteField(idx)}
                      style={{
                        padding: '0.4rem 0.8rem',
                        borderRadius: '0.4rem',
                        border: 'none',
                        backgroundColor: 'rgba(239, 68, 68, 0.3)',
                        color: '#fff',
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.2rem'
                      }}
                    >
                      <X style={{ width: '14px', height: '14px' }} />
                      حذف
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* دکمه ایجاد فرم */}
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '0.85rem',
            borderRadius: '1rem',
            border: 'none',
            background: 'linear-gradient(90deg, #c026d3 0%, #9333ea 50%, #4f46e5 100%)',
            boxShadow: '0 0 20px rgba(192, 38, 211, 0.5)',
            color: '#fff',
            fontWeight: 700,
            fontSize: '1rem',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1
          }}
        >
          {loading ? 'در حال ایجاد...' : '✨ منتشر کردن فرم'}
        </button>
      </form>
    </div>
  );
};

export default FormBuilder;

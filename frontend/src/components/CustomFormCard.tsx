import React, { useState } from 'react';
import { CheckCircle2, AlertCircle, Loader, Send } from 'lucide-react';
import API from '../api';

interface Field {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'radio' | 'checkbox';
  required?: boolean;
  options?: { value: string; label: string }[];
}

interface CustomForm {
  id: number;
  title: string;
  description?: string;
  fields_schema: Field[];
  expiration_date?: string;
  is_expired: boolean;
  has_submitted: boolean;
  response_count?: number;
  is_global?: boolean;
  workgroup_name?: string;
  created_at?: string;
}

interface CustomFormCardProps {
  form: CustomForm;
  onSuccess?: () => void;
}

export const CustomFormCard: React.FC<CustomFormCardProps> = ({ form, onSuccess }) => {
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleFieldChange = (fieldId: string, value: any) => {
    setAnswers((prev) => ({
      ...prev,
      [fieldId]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await API.post(`/api/custom-forms/${form.id}/submit/`, {
        answers,
      });

      setSuccessMessage('✅ پاسخ شما با موفقیت ثبت شد');
      setAnswers({});

      // پاک کردن پیام موفقیت بعد از 3 ثانیه
      setTimeout(() => {
        setSuccessMessage(null);
        if (onSuccess) onSuccess();
      }, 3000);
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.error ||
        err.message ||
        'خطا در ثبت پاسخ. لطفا دوباره سعی کنید.';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const renderField = (field: Field) => {
    const value = answers[field.id] ?? '';

    switch (field.type) {
      case 'text':
        return (
          <input
            type="text"
            placeholder={field.label}
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-400 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
            required={field.required}
          />
        );

      case 'textarea':
        return (
          <textarea
            placeholder={field.label}
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            rows={4}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-400 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition resize-none"
            required={field.required}
          />
        );

      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
            required={field.required}
          >
            <option value="">انتخاب کنید</option>
            {field.options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        );

      case 'radio':
        return (
          <div className="space-y-2">
            {field.options?.map((opt) => (
              <label key={opt.value} className="flex items-center space-x-2 rtl:space-x-reverse cursor-pointer">
                <input
                  type="radio"
                  name={field.id}
                  value={opt.value}
                  checked={value === opt.value}
                  onChange={(e) => handleFieldChange(field.id, e.target.value)}
                  className="w-4 h-4 text-cyan-500 bg-slate-700 border-slate-600"
                  required={field.required}
                />
                <span className="text-slate-300">{opt.label}</span>
              </label>
            ))}
          </div>
        );

      case 'checkbox':
        return (
          <div className="space-y-2">
            {field.options?.map((opt) => (
              <label key={opt.value} className="flex items-center space-x-2 rtl:space-x-reverse cursor-pointer">
                <input
                  type="checkbox"
                  value={opt.value}
                  checked={Array.isArray(value) && value.includes(opt.value)}
                  onChange={(e) => {
                    const arr = Array.isArray(value) ? value : [];
                    if (e.target.checked) {
                      handleFieldChange(field.id, [...arr, opt.value]);
                    } else {
                      handleFieldChange(
                        field.id,
                        arr.filter((v) => v !== opt.value)
                      );
                    }
                  }}
                  className="w-4 h-4 text-cyan-500 bg-slate-700 border-slate-600 rounded"
                />
                <span className="text-slate-300">{opt.label}</span>
              </label>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="relative w-full bg-gradient-to-b from-slate-800/60 to-slate-900/40 border border-cyan-500/20 rounded-xl p-6 backdrop-blur-sm">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h2 className="text-xl font-bold text-slate-100">{form.title}</h2>
            {form.description && (
              <p className="text-sm text-slate-400 mt-1">{form.description}</p>
            )}
          </div>
          {form.is_expired && (
            <span className="inline-flex items-center space-x-1 rtl:space-x-reverse bg-red-500/20 text-red-300 px-3 py-1 rounded-full text-xs font-medium">
              <AlertCircle className="w-3 h-3" />
              <span>منقضی‌شده</span>
            </span>
          )}
        </div>

        {/* Metadata */}
        <div className="text-xs text-slate-500 space-y-1">
          {form.is_global ? (
            <p>📢 فرم همگانی</p>
          ) : (
            <p>📍 کارگروه: {form.workgroup_name}</p>
          )}
          {form.expiration_date && (
            <p>📅 انقضا: {new Date(form.expiration_date).toLocaleDateString('fa-IR')}</p>
          )}
          {form.response_count !== undefined && (
            <p>📊 تعداد پاسخ‌ها: {form.response_count}</p>
          )}
        </div>
      </div>

      {/* Already Submitted Badge */}
      {form.has_submitted && (
        <div className="mb-4 p-3 bg-green-500/20 border border-green-500/30 rounded-lg flex items-center space-x-2 rtl:space-x-reverse">
          <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
          <span className="text-sm text-green-300 font-medium">✅ پاسخ شما برای این فرم ثبت شده است</span>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center space-x-2 rtl:space-x-reverse">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <span className="text-sm text-red-300">{error}</span>
        </div>
      )}

      {/* Success Message */}
      {successMessage && (
        <div className="mb-4 p-3 bg-green-500/20 border border-green-500/30 rounded-lg flex items-center space-x-2 rtl:space-x-reverse">
          <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
          <span className="text-sm text-green-300">{successMessage}</span>
        </div>
      )}

      {/* Form Fields */}
      {!form.has_submitted ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          {form.fields_schema && form.fields_schema.length > 0 ? (
            form.fields_schema.map((field) => (
              <div key={field.id}>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  {field.label}
                  {field.required && <span className="text-red-400 ml-1">*</span>}
                </label>
                {renderField(field)}
              </div>
            ))
          ) : (
            <p className="text-slate-400 text-sm">این فرم هیچ فیلدی ندارد.</p>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || form.is_expired}
            className={`w-full mt-6 px-4 py-2 rounded-lg font-medium flex items-center justify-center space-x-2 rtl:space-x-reverse transition ${
              loading || form.is_expired
                ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:shadow-lg hover:shadow-cyan-500/50'
            }`}
          >
            {loading ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                <span>درحال ارسال...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>ارسال پاسخ</span>
              </>
            )}
          </button>
        </form>
      ) : (
        <div className="py-6 text-center text-slate-400">
          <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-3" />
          <p className="font-medium">پاسخ شما ثبت شده است</p>
          <p className="text-sm mt-1">برای ویرایش پاسخ خود با مسئول کارگروه تماس بگیرید</p>
        </div>
      )}
    </div>
  );
};

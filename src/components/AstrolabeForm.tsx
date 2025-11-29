/**
 * 出生資料輸入表單
 * 支援陽曆和陰曆排盤，含前端表單驗證
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { BirthData } from '@/lib/types';
import { EARTHLY_BRANCHES, TIME_RANGES, TIMEZONES } from '@/lib/constants';
import { saveChart } from '@/lib/chartStorage';

const FORM_STORAGE_KEY = 'astrolabe_form_data';

interface FormErrors {
  birthDate?: string;
  gender?: string;
  birthTimeIndex?: string;
  general?: string;
}

export default function AstrolabeForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [formData, setFormData] = useState<BirthData>({
    name: null,
    gender: '男',
    birthDate: '',
    birthTimeIndex: 0,
    timezone: 'Asia/Taipei',
    calendar: 'solar',
    earlyZiHour: true,
  });

  // 初始化時從 localStorage 恢復表單數據
  useEffect(() => {
    const savedData = localStorage.getItem(FORM_STORAGE_KEY);
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setFormData(parsed);
      } catch (e) {
        console.error('Failed to parse saved form data:', e);
      }
    }
  }, []);

  // 每當表單數據改變時保存到 localStorage
  useEffect(() => {
    localStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(formData));
  }, [formData]);

  /**
   * 前端表單驗證
   */
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    const currentYear = new Date().getFullYear();

    // 驗證出生日期
    if (!formData.birthDate) {
      newErrors.birthDate = '請輸入出生日期';
    } else {
      const [year, month, day] = formData.birthDate.split('-').map(Number);

      // 年份範圍
      if (year < 1900 || year > currentYear) {
        newErrors.birthDate = `出生年份須在 1900-${currentYear} 之間`;
      }

      // 未來日期檢查
      const inputDate = new Date(year, month - 1, day);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (inputDate > today) {
        newErrors.birthDate = '出生日期不能是未來日期';
      }

      // 陰曆日期範圍
      if (formData.calendar === 'lunar' && (day < 1 || day > 30)) {
        newErrors.birthDate = '陰曆日期須在 1-30 之間';
      }
    }

    // 驗證性別
    if (!formData.gender) {
      newErrors.gender = '請選擇性別';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    // 清除該欄位的錯誤
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'radio' ? value === 'true' : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 前端驗證
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const response = await fetch('/api/astrolabe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        // 顯示後端返回的錯誤訊息
        setErrors({ general: data.error || '排盤失敗' });
        setLoading(false);
        return;
      }

      const { chartId, astrolabe } = data;

      // 儲存到 localStorage
      saveChart(astrolabe);

      router.push(`/chart?chartId=${chartId}`);
    } catch (error) {
      setErrors({ general: '網路錯誤，請檢查連線後再試' });
      console.error(error);
      setLoading(false);
    }
  };

  // 計算陰曆日期最大值
  const getMaxDay = () => {
    if (formData.calendar === 'lunar') {
      return 30;
    }
    if (formData.birthDate) {
      const [year, month] = formData.birthDate.split('-').map(Number);
      if (year && month) {
        return new Date(year, month, 0).getDate();
      }
    }
    return 31;
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-4 sm:p-6 md:p-8 rounded-lg shadow-md max-w-md mx-auto">
      <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-center text-primary">出生資料</h2>

      {/* 通用錯誤訊息 */}
      {errors.general && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          {errors.general}
        </div>
      )}

      {/* 姓名 */}
      <div className="mb-4 sm:mb-5">
        <label className="block text-sm font-medium mb-1.5 sm:mb-2">姓名（可選）</label>
        <input
          type="text"
          name="name"
          value={formData.name || ''}
          onChange={(e) => setFormData({ ...formData, name: e.target.value || null })}
          placeholder="輸入姓名"
          className="w-full px-3 py-3 sm:py-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:border-transparent text-base"
        />
      </div>

      {/* 性別 */}
      <div className="mb-4 sm:mb-5">
        <label className="block text-sm font-medium mb-2">性別</label>
        <div className="flex gap-2 sm:gap-4">
          <label className="flex items-center cursor-pointer min-h-[44px] px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition touch-manipulation">
            <input
              type="radio"
              name="gender"
              value="男"
              checked={formData.gender === '男'}
              onChange={handleChange}
              className="mr-2 w-4 h-4"
            />
            <span className="text-base">男</span>
          </label>
          <label className="flex items-center cursor-pointer min-h-[44px] px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition touch-manipulation">
            <input
              type="radio"
              name="gender"
              value="女"
              checked={formData.gender === '女'}
              onChange={handleChange}
              className="mr-2 w-4 h-4"
            />
            <span className="text-base">女</span>
          </label>
        </div>
        {errors.gender && (
          <p className="mt-1 text-sm text-red-600">{errors.gender}</p>
        )}
      </div>

      {/* 陰曆/陽曆 */}
      <div className="mb-4 sm:mb-5">
        <label className="block text-sm font-medium mb-2">曆制</label>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
          <label className="flex items-center cursor-pointer min-h-[44px] px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition touch-manipulation">
            <input
              type="radio"
              name="calendar"
              value="solar"
              checked={formData.calendar === 'solar'}
              onChange={handleChange}
              className="mr-2 w-4 h-4"
            />
            <span className="text-base">陽曆（國曆）</span>
          </label>
          <label className="flex items-center cursor-pointer min-h-[44px] px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition touch-manipulation">
            <input
              type="radio"
              name="calendar"
              value="lunar"
              checked={formData.calendar === 'lunar'}
              onChange={handleChange}
              className="mr-2 w-4 h-4"
            />
            <span className="text-base">陰曆（農曆）</span>
          </label>
        </div>
        {formData.calendar === 'lunar' && (
          <p className="mt-2 text-xs text-amber-600 bg-amber-50 p-2 rounded">
            提示：陰曆日期請輸入農曆月份和日期。如果是閏月出生，請在下方選擇閏月選項。
          </p>
        )}
      </div>

      {/* 出生日期 */}
      <div className="mb-4 sm:mb-5">
        <label className="block text-sm font-medium mb-1.5 sm:mb-2">
          出生日期（{formData.calendar === 'solar' ? '陽曆' : '陰曆'}）
        </label>
        <input
          type="date"
          name="birthDate"
          value={formData.birthDate}
          onChange={handleChange}
          max={new Date().toISOString().split('T')[0]}
          min="1900-01-01"
          required
          className={`w-full px-3 py-3 sm:py-2 border rounded focus:ring-2 focus:ring-primary focus:border-transparent text-base ${
            errors.birthDate ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.birthDate && (
          <p className="mt-1 text-sm text-red-600">{errors.birthDate}</p>
        )}
      </div>

      {/* 閏月選項（僅陰曆顯示） */}
      {formData.calendar === 'lunar' && (
        <div className="mb-4 sm:mb-5">
          <label className="block text-sm font-medium mb-2">閏月處理</label>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
            <label className="flex items-center cursor-pointer min-h-[44px] px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition touch-manipulation">
              <input
                type="radio"
                name="leapMonthMode"
                value="current"
                checked={formData.leapMonthMode !== 'next'}
                onChange={(e) => setFormData({ ...formData, leapMonthMode: 'current' })}
                className="mr-2 w-4 h-4"
              />
              <span className="text-base">當月（非閏月）</span>
            </label>
            <label className="flex items-center cursor-pointer min-h-[44px] px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition touch-manipulation">
              <input
                type="radio"
                name="leapMonthMode"
                value="next"
                checked={formData.leapMonthMode === 'next'}
                onChange={(e) => setFormData({ ...formData, leapMonthMode: 'next' })}
                className="mr-2 w-4 h-4"
              />
              <span className="text-base">閏月</span>
            </label>
          </div>
        </div>
      )}

      {/* 出生時辰 */}
      <div className="mb-4 sm:mb-5">
        <label className="block text-sm font-medium mb-1.5 sm:mb-2">出生時辰</label>
        <select
          name="birthTimeIndex"
          value={formData.birthTimeIndex}
          onChange={(e) => setFormData({ ...formData, birthTimeIndex: parseInt(e.target.value) })}
          className="w-full px-3 py-3 sm:py-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:border-transparent text-base"
        >
          {EARTHLY_BRANCHES.map((branch, index) => (
            <option key={index} value={index}>
              {branch}時（{TIME_RANGES[index]}）
            </option>
          ))}
        </select>
      </div>

      {/* 早子時/晚子時 */}
      {formData.birthTimeIndex === 0 && (
        <div className="mb-4 sm:mb-5">
          <label className="block text-sm font-medium mb-2">子時分類</label>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
            <label className="flex items-center cursor-pointer min-h-[44px] px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition touch-manipulation">
              <input
                type="radio"
                name="earlyZiHour"
                value="true"
                checked={formData.earlyZiHour === true}
                onChange={(e) => setFormData({ ...formData, earlyZiHour: e.target.value === 'true' })}
                className="mr-2 w-4 h-4"
              />
              <span className="text-base">早子時（23:00-00:00）</span>
            </label>
            <label className="flex items-center cursor-pointer min-h-[44px] px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition touch-manipulation">
              <input
                type="radio"
                name="earlyZiHour"
                value="false"
                checked={formData.earlyZiHour === false}
                onChange={(e) => setFormData({ ...formData, earlyZiHour: e.target.value === 'true' })}
                className="mr-2 w-4 h-4"
              />
              <span className="text-base">晚子時（00:00-01:00）</span>
            </label>
          </div>
          <p className="mt-2 text-xs text-gray-500">
            早子時算當天，晚子時算隔天
          </p>
        </div>
      )}

      {/* 時區 */}
      <div className="mb-5 sm:mb-6">
        <label className="block text-sm font-medium mb-1.5 sm:mb-2">時區</label>
        <select
          name="timezone"
          value={formData.timezone}
          onChange={handleChange}
          className="w-full px-3 py-3 sm:py-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:border-transparent text-base"
        >
          {TIMEZONES.map((tz) => (
            <option key={tz.value} value={tz.value}>
              {tz.label}
            </option>
          ))}
        </select>
      </div>

      {/* 提交按鈕 */}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-primary text-white py-4 sm:py-3 rounded-lg font-bold text-base sm:text-lg hover:bg-opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] touch-manipulation min-h-[48px]"
      >
        {loading ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            排盤中...
          </span>
        ) : (
          '排盤'
        )}
      </button>
    </form>
  );
}

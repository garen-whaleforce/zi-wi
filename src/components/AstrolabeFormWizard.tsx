/**
 * 出生資料輸入表單（分步式精靈）
 * 將表單分成多個步驟，提供更好的使用者體驗
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
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

// 擴展 BirthData 允許空字串（用於表單初始狀態）
interface WizardFormData extends Omit<BirthData, 'gender'> {
  gender: '男' | '女' | 'M' | 'F' | '';
}

type Step = 'gender' | 'calendar' | 'date' | 'time' | 'confirm';

const STEPS: Step[] = ['gender', 'calendar', 'date', 'time', 'confirm'];

const STEP_TITLES: Record<Step, string> = {
  gender: '選擇性別',
  calendar: '選擇曆制',
  date: '輸入出生日期',
  time: '選擇出生時辰',
  confirm: '確認資料',
};

export default function AstrolabeFormWizard() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>('gender');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [formData, setFormData] = useState<WizardFormData>({
    name: null,
    gender: '',
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

  const currentStepIndex = STEPS.indexOf(currentStep);
  const progress = ((currentStepIndex + 1) / STEPS.length) * 100;

  const goToNextStep = useCallback(() => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < STEPS.length) {
      setCurrentStep(STEPS[nextIndex]);
    }
  }, [currentStepIndex]);

  const goToPrevStep = useCallback(() => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(STEPS[prevIndex]);
    }
  }, [currentStepIndex]);

  const validateCurrentStep = (): boolean => {
    const newErrors: FormErrors = {};

    switch (currentStep) {
      case 'gender':
        if (!formData.gender) {
          newErrors.gender = '請選擇性別';
        }
        break;
      case 'date':
        if (!formData.birthDate) {
          newErrors.birthDate = '請輸入出生日期';
        } else {
          const [year] = formData.birthDate.split('-').map(Number);
          const currentYear = new Date().getFullYear();
          if (year < 1900 || year > currentYear) {
            newErrors.birthDate = `出生年份須在 1900-${currentYear} 之間`;
          }
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      goToNextStep();
    }
  };

  const handleSubmit = async () => {
    if (!validateCurrentStep()) return;

    setLoading(true);
    setErrors({});

    try {
      // 確保 gender 是有效值再發送
      if (formData.gender !== '男' && formData.gender !== '女') {
        setErrors({ gender: '請選擇性別' });
        setLoading(false);
        return;
      }

      const submitData: BirthData = {
        ...formData,
        gender: formData.gender as '男' | '女',
      };

      const response = await fetch('/api/astrolabe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrors({ general: data.error || '排盤失敗' });
        setLoading(false);
        return;
      }

      const { chartId, astrolabe } = data;
      saveChart(astrolabe);
      router.push(`/chart?chartId=${chartId}`);
    } catch (error) {
      setErrors({ general: '網路錯誤，請檢查連線後再試' });
      console.error(error);
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'gender':
        return (
          <div className="space-y-4 animate-fade-in-up">
            <p className="text-center text-white/60 mb-6">
              紫微斗數命盤會根據性別有不同的排法
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {(['男', '女'] as const).map((gender) => (
                <button
                  key={gender}
                  type="button"
                  onClick={() => {
                    setFormData({ ...formData, gender });
                    setErrors({});
                  }}
                  className={`
                    flex-1 max-w-[200px] py-6 px-8 rounded-xl text-xl font-bold
                    transition-all duration-200 ease-out border
                    ${
                      formData.gender === gender
                        ? 'bg-primary-900/50 text-gold-400 border-gold-400/50 shadow-glow scale-105'
                        : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10 hover:text-white'
                    }
                  `}
                >
                  {gender === '男' ? '👨 男' : '👩 女'}
                </button>
              ))}
            </div>
            {errors.gender && (
              <p className="text-center text-red-400 text-sm mt-2">{errors.gender}</p>
            )}
          </div>
        );

      case 'calendar':
        return (
          <div className="space-y-4 animate-fade-in-up">
            <p className="text-center text-white/60 mb-6">
              請選擇您知道的出生日期類型
            </p>
            <div className="flex flex-col gap-4 max-w-md mx-auto">
              {[
                { value: 'solar', label: '陽曆（國曆）', desc: '身分證/護照上的日期', icon: '☀️' },
                { value: 'lunar', label: '陰曆（農曆）', desc: '傳統農民曆日期', icon: '🌙' },
              ].map((cal) => (
                <button
                  key={cal.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, calendar: cal.value as 'solar' | 'lunar' })}
                  className={`
                    p-4 rounded-xl text-left border
                    transition-all duration-200 ease-out
                    ${
                      formData.calendar === cal.value
                        ? 'bg-primary-900/50 border-gold-400/50 shadow-glow'
                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                    }
                  `}
                >
                  <div className={`font-bold text-lg flex items-center gap-2 ${formData.calendar === cal.value ? 'text-gold-400' : 'text-white'}`}>
                    <span>{cal.icon}</span> {cal.label}
                  </div>
                  <div className={formData.calendar === cal.value ? 'text-white/70' : 'text-white/50'}>
                    {cal.desc}
                  </div>
                </button>
              ))}
            </div>
            {formData.calendar === 'lunar' && (
              <div className="mt-4 p-3 bg-gold-500/20 border border-gold-400/30 rounded-lg text-gold-300 text-sm max-w-md mx-auto animate-fade-in">
                <p>如果是閏月出生，請在下一步選擇閏月選項。</p>
              </div>
            )}
          </div>
        );

      case 'date':
        return (
          <div className="space-y-6 animate-fade-in-up max-w-md mx-auto">
            {/* 姓名（可選） */}
            <div>
              <label className="block text-sm font-medium mb-2 text-white/70">
                姓名（可選）
              </label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value || null })}
                placeholder="輸入姓名方便日後辨識"
                className="w-full px-4 py-3 bg-dark-800 border border-white/20 rounded-xl text-white placeholder-white/40 focus:border-gold-400 focus:outline-none focus:ring-1 focus:ring-gold-400/50 text-base"
              />
            </div>

            {/* 出生日期 */}
            <div>
              <label className="block text-sm font-medium mb-2 text-white/70">
                出生日期（{formData.calendar === 'solar' ? '陽曆' : '陰曆'}）
              </label>
              <input
                type="date"
                value={formData.birthDate}
                onChange={(e) => {
                  setFormData({ ...formData, birthDate: e.target.value });
                  setErrors({});
                }}
                max={new Date().toISOString().split('T')[0]}
                min="1900-01-01"
                className={`
                  w-full px-4 py-3 bg-dark-800 border rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-gold-400/50 text-base
                  ${errors.birthDate ? 'border-red-400' : 'border-white/20 focus:border-gold-400'}
                `}
              />
              {errors.birthDate && (
                <p className="mt-1 text-sm text-red-400">{errors.birthDate}</p>
              )}
            </div>

            {/* 閏月選項（僅陰曆） */}
            {formData.calendar === 'lunar' && (
              <div className="animate-fade-in">
                <label className="block text-sm font-medium mb-2 text-white/70">
                  是否為閏月？
                </label>
                <div className="flex gap-4">
                  {[
                    { value: 'current', label: '否' },
                    { value: 'next', label: '是（閏月）' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, leapMonthMode: option.value as 'current' | 'next' })}
                      className={`
                        flex-1 py-3 px-4 rounded-xl font-medium border
                        transition-all duration-200
                        ${
                          (formData.leapMonthMode || 'current') === option.value
                            ? 'bg-primary-900/50 text-gold-400 border-gold-400/50'
                            : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10'
                        }
                      `}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case 'time':
        return (
          <div className="space-y-6 animate-fade-in-up max-w-md mx-auto">
            {/* 出生時辰 */}
            <div>
              <label className="block text-sm font-medium mb-2 text-white/70">
                出生時辰
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {EARTHLY_BRANCHES.map((branch, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setFormData({ ...formData, birthTimeIndex: index })}
                    className={`
                      py-3 px-2 rounded-lg text-sm font-medium border
                      transition-all duration-200
                      ${
                        formData.birthTimeIndex === index
                          ? 'bg-primary-900/50 text-gold-400 border-gold-400/50 shadow-glow'
                          : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10 hover:text-white'
                      }
                    `}
                  >
                    <div>{branch}時</div>
                    <div className={`text-xs ${formData.birthTimeIndex === index ? 'text-gold-300/80' : 'text-white/50'}`}>
                      {TIME_RANGES[index]}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* 早子時/晚子時 */}
            {formData.birthTimeIndex === 0 && (
              <div className="animate-fade-in">
                <label className="block text-sm font-medium mb-2 text-white/70">
                  子時分類
                </label>
                <div className="flex flex-col gap-2">
                  {[
                    { value: true, label: '早子時（23:00-00:00）', desc: '算當天' },
                    { value: false, label: '晚子時（00:00-01:00）', desc: '算隔天' },
                  ].map((option) => (
                    <button
                      key={String(option.value)}
                      type="button"
                      onClick={() => setFormData({ ...formData, earlyZiHour: option.value })}
                      className={`
                        py-3 px-4 rounded-xl text-left border
                        transition-all duration-200
                        ${
                          formData.earlyZiHour === option.value
                            ? 'bg-primary-900/50 border-gold-400/50'
                            : 'bg-white/5 border-white/10 hover:bg-white/10'
                        }
                      `}
                    >
                      <span className={`font-medium ${formData.earlyZiHour === option.value ? 'text-gold-400' : 'text-white'}`}>{option.label}</span>
                      <span className={`ml-2 text-sm ${formData.earlyZiHour === option.value ? 'text-white/70' : 'text-white/50'}`}>
                        {option.desc}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 時區 */}
            <div>
              <label className="block text-sm font-medium mb-2 text-white/70">
                出生地時區
              </label>
              <select
                value={formData.timezone}
                onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                className="w-full px-4 py-3 bg-dark-800 border border-white/20 rounded-xl text-white focus:border-gold-400 focus:outline-none focus:ring-1 focus:ring-gold-400/50 text-base"
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        );

      case 'confirm':
        return (
          <div className="space-y-6 animate-fade-in-up max-w-md mx-auto">
            <p className="text-center text-white/60 mb-4">
              請確認以下資料是否正確
            </p>

            <div className="bg-dark-800/50 border border-white/10 rounded-xl p-6 space-y-4">
              <div className="flex justify-between">
                <span className="text-white/60">姓名</span>
                <span className="font-medium text-white">{formData.name || '未填寫'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">性別</span>
                <span className="font-medium text-white">{formData.gender}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">曆制</span>
                <span className="font-medium text-white">{formData.calendar === 'solar' ? '陽曆' : '陰曆'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">出生日期</span>
                <span className="font-medium text-gold-400">{formData.birthDate}</span>
              </div>
              {formData.calendar === 'lunar' && formData.leapMonthMode === 'next' && (
                <div className="flex justify-between">
                  <span className="text-white/60">閏月</span>
                  <span className="font-medium text-gold-400">是</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-white/60">出生時辰</span>
                <span className="font-medium text-gold-400">
                  {EARTHLY_BRANCHES[formData.birthTimeIndex]}時（{TIME_RANGES[formData.birthTimeIndex]}）
                </span>
              </div>
              {formData.birthTimeIndex === 0 && (
                <div className="flex justify-between">
                  <span className="text-white/60">子時類型</span>
                  <span className="font-medium text-white">{formData.earlyZiHour ? '早子時' : '晚子時'}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-white/60">時區</span>
                <span className="font-medium text-white">
                  {TIMEZONES.find(tz => tz.value === formData.timezone)?.label}
                </span>
              </div>
            </div>

            {errors.general && (
              <div className="p-3 bg-red-500/20 border border-red-400/30 rounded-lg text-red-300 text-sm">
                {errors.general}
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div className="glass-card p-6 sm:p-8 max-w-lg mx-auto">
      {/* 進度條 */}
      <div className="mb-8">
        <div className="flex justify-between mb-2">
          <span className="text-sm text-white/50">步驟 {currentStepIndex + 1} / {STEPS.length}</span>
          <span className="text-sm font-medium text-gold-400">{STEP_TITLES[currentStep]}</span>
        </div>
        <div className="h-2 bg-dark-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-gold rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* 步驟內容 */}
      <div className="min-h-[300px]">
        {renderStepContent()}
      </div>

      {/* 導航按鈕 */}
      <div className="flex justify-between mt-8 pt-6 border-t border-white/10">
        <button
          type="button"
          onClick={goToPrevStep}
          disabled={currentStepIndex === 0}
          className={`
            px-6 py-3 rounded-xl font-medium transition-all duration-200
            ${
              currentStepIndex === 0
                ? 'text-white/30 cursor-not-allowed'
                : 'text-white/70 hover:bg-white/10 hover:text-white'
            }
          `}
        >
          ← 上一步
        </button>

        {currentStep === 'confirm' ? (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="btn-primary px-8 py-3 font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-dark-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                排盤中...
              </>
            ) : (
              '開始排盤 →'
            )}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleNext}
            className="btn-primary px-8 py-3 font-bold"
          >
            下一步 →
          </button>
        )}
      </div>
    </div>
  );
}

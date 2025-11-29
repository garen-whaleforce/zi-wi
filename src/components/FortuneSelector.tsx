/**
 * 運勢選擇器（本命/大限/流年/流月/流日）- 現代化深色設計
 * 支援樹狀結構選擇：大限 → 流年 → 流月 → 流日
 * 使用 React.memo 和 useCallback 優化效能
 */

'use client';

import { useState, useMemo, useCallback, memo } from 'react';

interface FortuneSelectorProps {
  birthYear?: number; // 出生年份，用於計算大限
  onScopeChange?: (
    scope: 'natal' | 'decade' | 'year' | 'month' | 'day',
    params: FortuneParams
  ) => void;
}

export interface FortuneParams {
  decadeRange?: { start: number; end: number }; // 大限年齡區間
  year: number;
  month: number;
  day: number;
}

// 大限區間（每十年一個大運）
const DECADE_RANGES = [
  { start: 5, end: 14, label: '5-14 歲' },
  { start: 15, end: 24, label: '15-24 歲' },
  { start: 25, end: 34, label: '25-34 歲' },
  { start: 35, end: 44, label: '35-44 歲' },
  { start: 45, end: 54, label: '45-54 歲' },
  { start: 55, end: 64, label: '55-64 歲' },
  { start: 65, end: 74, label: '65-74 歲' },
  { start: 75, end: 84, label: '75-84 歲' },
  { start: 85, end: 94, label: '85-94 歲' },
] as const;

const SCOPE_LABELS = {
  natal: '本命',
  decade: '大限',
  year: '流年',
  month: '流月',
  day: '流日',
} as const;

const SCOPE_ICONS = {
  natal: '☯',
  decade: '⏳',
  year: '📅',
  month: '🌙',
  day: '☀️',
} as const;

type ScopeType = keyof typeof SCOPE_LABELS;

/**
 * 大限按鈕元件（Memoized）
 */
const DecadeButton = memo(function DecadeButton({
  decade,
  isSelected,
  isCurrentDecade,
  onClick,
}: {
  decade: (typeof DECADE_RANGES)[number];
  isSelected: boolean;
  isCurrentDecade: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        px-2 sm:px-3 py-1.5 sm:py-1.5 rounded-lg text-xs sm:text-sm transition-all duration-200
        min-h-[36px] touch-manipulation active:scale-95 border
        ${
          isSelected
            ? 'bg-primary-900/50 text-gold-400 border-gold-400/50 shadow-glow'
            : isCurrentDecade
              ? 'bg-gold-500/20 text-gold-400 border-gold-400/50 hover:bg-gold-500/30'
              : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10 hover:text-white'
        }
      `}
    >
      {decade.label}
    </button>
  );
});

/**
 * 運勢類型按鈕元件（Memoized）
 */
const ScopeButton = memo(function ScopeButton({
  scope,
  isActive,
  onClick,
}: {
  scope: ScopeType;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-1.5 px-3 sm:px-4 py-2.5 sm:py-2 rounded-lg
        transition-all duration-200 font-medium text-xs sm:text-sm
        min-h-[40px] touch-manipulation active:scale-95
        ${
          isActive
            ? 'bg-primary-900/50 text-gold-400 shadow-glow'
            : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
        }
      `}
    >
      <span>{SCOPE_ICONS[scope]}</span>
      <span>{SCOPE_LABELS[scope]}</span>
    </button>
  );
});

function FortuneSelectorComponent({
  birthYear,
  onScopeChange,
}: FortuneSelectorProps) {
  const today = useMemo(() => new Date(), []);
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;
  const currentDay = today.getDate();

  const [scope, setScope] = useState<ScopeType>('natal');
  const [selectedDecade, setSelectedDecade] = useState<{
    start: number;
    end: number;
  } | null>(null);
  const [year, setYear] = useState(currentYear);
  const [month, setMonth] = useState(currentMonth);
  const [day, setDay] = useState(currentDay);

  // 計算當前年齡對應的大限
  const currentAge = birthYear ? currentYear - birthYear : null;
  const currentDecade = useMemo(() => {
    if (!currentAge) return null;
    return DECADE_RANGES.find((d) => currentAge >= d.start && currentAge <= d.end) || null;
  }, [currentAge]);

  // 根據大限計算可選年份範圍
  const availableYears = useMemo(() => {
    if (selectedDecade && birthYear) {
      const startYear = birthYear + selectedDecade.start;
      const endYear = birthYear + selectedDecade.end;
      return Array.from(
        { length: endYear - startYear + 1 },
        (_, i) => startYear + i
      );
    }
    // 預設顯示前後 50 年
    return Array.from({ length: 100 }, (_, i) => currentYear - 50 + i);
  }, [selectedDecade, birthYear, currentYear]);

  // 根據選定年月計算可選日期
  const daysInMonth = useMemo(() => {
    return new Date(year, month, 0).getDate();
  }, [year, month]);

  // 靜態陣列使用 useMemo 避免重建
  const months = useMemo(() => Array.from({ length: 12 }, (_, i) => i + 1), []);
  const days = useMemo(
    () => Array.from({ length: daysInMonth }, (_, i) => i + 1),
    [daysInMonth]
  );

  const handleScopeChange = useCallback(
    (newScope: ScopeType) => {
      setScope(newScope);
      if (newScope === 'natal') {
        setSelectedDecade(null);
      }
      onScopeChange?.(newScope, {
        decadeRange: newScope === 'natal' ? undefined : selectedDecade || undefined,
        year,
        month,
        day,
      });
    },
    [onScopeChange, selectedDecade, year, month, day]
  );

  const handleDecadeChange = useCallback(
    (decade: { start: number; end: number }) => {
      setSelectedDecade(decade);
      // 自動調整年份到大限範圍內
      let newYear = year;
      if (birthYear) {
        const startYear = birthYear + decade.start;
        const endYear = birthYear + decade.end;
        if (year < startYear || year > endYear) {
          newYear = Math.min(Math.max(year, startYear), endYear);
          setYear(newYear);
        }
      }
      onScopeChange?.(scope, {
        decadeRange: decade,
        year: newYear,
        month,
        day,
      });
    },
    [birthYear, scope, year, month, day, onScopeChange]
  );

  const handleParamChange = useCallback(
    (param: 'year' | 'month' | 'day', value: number) => {
      let newYear = year;
      let newMonth = month;
      let newDay = day;

      if (param === 'year') {
        newYear = value;
        setYear(value);
      }
      if (param === 'month') {
        newMonth = value;
        setMonth(value);
        // 確保日期在有效範圍內
        const maxDay = new Date(year, value, 0).getDate();
        if (day > maxDay) {
          newDay = maxDay;
          setDay(maxDay);
        }
      }
      if (param === 'day') {
        newDay = value;
        setDay(value);
      }

      onScopeChange?.(scope, {
        decadeRange: selectedDecade || undefined,
        year: newYear,
        month: newMonth,
        day: newDay,
      });
    },
    [scope, selectedDecade, year, month, day, onScopeChange]
  );

  const handleTodayClick = useCallback(() => {
    setScope('day');
    setYear(currentYear);
    setMonth(currentMonth);
    setDay(currentDay);
    onScopeChange?.('day', {
      decadeRange: selectedDecade || undefined,
      year: currentYear,
      month: currentMonth,
      day: currentDay,
    });
  }, [currentYear, currentMonth, currentDay, selectedDecade, onScopeChange]);

  // 選擇摘要文字
  const selectionSummary = useMemo(() => {
    if (scope === 'decade' && selectedDecade) {
      return `大限 ${selectedDecade.start}-${selectedDecade.end} 歲`;
    }
    if (scope === 'year') {
      const decadePrefix = selectedDecade
        ? `大限 ${selectedDecade.start}-${selectedDecade.end} 歲 → `
        : '';
      return `${decadePrefix}${year} 年流年`;
    }
    if (scope === 'month') {
      const decadePrefix = selectedDecade
        ? `大限 ${selectedDecade.start}-${selectedDecade.end} 歲 → `
        : '';
      return `${decadePrefix}${year} 年 ${month} 月流月`;
    }
    if (scope === 'day') {
      const decadePrefix = selectedDecade
        ? `大限 ${selectedDecade.start}-${selectedDecade.end} 歲 → `
        : '';
      return `${decadePrefix}${year} 年 ${month} 月 ${day} 日流日`;
    }
    if (scope === 'decade' && !selectedDecade) {
      return null;
    }
    return null;
  }, [scope, selectedDecade, year, month, day]);

  return (
    <div className="glass-card p-4 sm:p-6">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <h3 className="text-base sm:text-lg font-serif font-bold text-gradient">運勢選擇</h3>
        <button
          onClick={handleTodayClick}
          className="px-4 py-1.5 sm:py-1 text-xs sm:text-sm bg-gradient-gold text-dark-900 rounded-full hover:opacity-90 transition-all duration-200 font-medium touch-manipulation active:scale-95 min-h-[36px] shadow-glow-gold"
        >
          今日運勢
        </button>
      </div>

      {/* 運勢類型選擇 */}
      <div className="flex gap-1.5 sm:gap-2 mb-3 sm:mb-4 flex-wrap p-1 bg-dark-800/50 rounded-xl">
        {(['natal', 'decade', 'year', 'month', 'day'] as const).map((s) => (
          <ScopeButton
            key={s}
            scope={s}
            isActive={scope === s}
            onClick={() => handleScopeChange(s)}
          />
        ))}
      </div>

      {/* 大限選擇 */}
      {scope !== 'natal' && (
        <div className="space-y-4">
          {/* 大限區間 */}
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">
              大限區間
              {currentDecade && (
                <span className="ml-2 text-xs text-gold-400">
                  （目前：{currentDecade.label}）
                </span>
              )}
            </label>
            <div className="flex gap-2 flex-wrap">
              {DECADE_RANGES.map((decade) => (
                <DecadeButton
                  key={decade.start}
                  decade={decade}
                  isSelected={
                    selectedDecade !== null &&
                    decade.start === selectedDecade.start
                  }
                  isCurrentDecade={
                    currentDecade !== null &&
                    decade.start === currentDecade.start
                  }
                  onClick={() => handleDecadeChange(decade)}
                />
              ))}
            </div>
          </div>

          {/* 年月日選擇 - 樹狀結構 */}
          {(scope === 'year' || scope === 'month' || scope === 'day') && (
            <div className="flex gap-4 flex-wrap items-end">
              {/* 流年 */}
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">
                  流年
                </label>
                <select
                  value={year}
                  onChange={(e) =>
                    handleParamChange('year', parseInt(e.target.value))
                  }
                  className="px-3 py-2 bg-dark-800 border border-white/20 rounded-lg min-w-[100px] text-white focus:border-gold-400 focus:outline-none focus:ring-1 focus:ring-gold-400/50"
                >
                  {availableYears.map((y) => (
                    <option key={y} value={y}>
                      {y} 年 {y === currentYear && '(今)'}
                    </option>
                  ))}
                </select>
              </div>

              {/* 流月 */}
              {(scope === 'month' || scope === 'day') && (
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1">
                    流月
                  </label>
                  <select
                    value={month}
                    onChange={(e) =>
                      handleParamChange('month', parseInt(e.target.value))
                    }
                    className="px-3 py-2 bg-dark-800 border border-white/20 rounded-lg min-w-[80px] text-white focus:border-gold-400 focus:outline-none focus:ring-1 focus:ring-gold-400/50"
                  >
                    {months.map((m) => (
                      <option key={m} value={m}>
                        {m} 月{' '}
                        {year === currentYear && m === currentMonth && '(今)'}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* 流日 */}
              {scope === 'day' && (
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1">
                    流日
                  </label>
                  <select
                    value={day}
                    onChange={(e) =>
                      handleParamChange('day', parseInt(e.target.value))
                    }
                    className="px-3 py-2 bg-dark-800 border border-white/20 rounded-lg min-w-[80px] text-white focus:border-gold-400 focus:outline-none focus:ring-1 focus:ring-gold-400/50"
                  >
                    {days.map((d) => (
                      <option key={d} value={d}>
                        {d} 日{' '}
                        {year === currentYear &&
                          month === currentMonth &&
                          d === currentDay &&
                          '(今)'}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* 目前選擇摘要 */}
          <div className="p-3 bg-primary-900/30 border border-primary-500/20 rounded-lg text-sm">
            <span className="font-medium text-white/70">目前查看：</span>
            {selectionSummary ? (
              <span className="text-gold-400">{selectionSummary}</span>
            ) : (
              <span className="text-white/40">請選擇大限區間</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// 使用 React.memo 包裝，避免不必要的重新渲染
const FortuneSelector = memo(FortuneSelectorComponent);
export default FortuneSelector;

/**
 * FortuneMatrix - 運勢時間軸矩陣
 * 類似文墨天機的大限/流年/流月/流日條狀矩陣
 */

'use client';

import { useState, useMemo, useCallback, memo } from 'react';
import type { FortuneScope } from '@/lib/types';

export interface FortuneMatrixProps {
  birthYear: number;
  selected: {
    scope: FortuneScope;
    decadeRange?: { start: number; end: number };
    year?: number;
    month?: number;
    day?: number;
  };
  onSelect: (
    scope: FortuneScope,
    params: {
      decadeRange?: { start: number; end: number };
      year?: number;
      month?: number;
      day?: number;
    }
  ) => void;
}

// 大限區間配置
const DECADE_CONFIGS = [
  { start: 5, end: 14 },
  { start: 15, end: 24 },
  { start: 25, end: 34 },
  { start: 35, end: 44 },
  { start: 45, end: 54 },
  { start: 55, end: 64 },
  { start: 65, end: 74 },
  { start: 75, end: 84 },
] as const;

/**
 * 大限格子元件
 */
const DecadeCell = memo(function DecadeCell({
  decade,
  birthYear,
  isSelected,
  isCurrent,
  isExpanded,
  onClick,
}: {
  decade: { start: number; end: number };
  birthYear: number;
  isSelected: boolean;
  isCurrent: boolean;
  isExpanded: boolean;
  onClick: () => void;
}) {
  const yearRange = `${birthYear + decade.start}-${birthYear + decade.end}`;

  return (
    <button
      onClick={onClick}
      className={`
        relative flex flex-col items-center justify-center
        px-2 py-2.5 rounded-lg transition-all duration-200
        min-w-[70px] sm:min-w-[80px] border
        ${isSelected
          ? 'bg-gold-500/30 border-gold-400 text-gold-400 shadow-glow-gold'
          : isExpanded
            ? 'bg-primary-800/60 border-primary-400/60 text-primary-300'
            : isCurrent
              ? 'bg-primary-800/50 border-primary-400/50 text-primary-300'
              : 'bg-dark-800/50 border-white/10 text-white/60 hover:bg-dark-700/50 hover:text-white/80'
        }
      `}
    >
      <span className="text-xs font-medium">{decade.start}-{decade.end}歲</span>
      <span className="text-[10px] text-white/40 mt-0.5 hidden sm:block">{yearRange}</span>
      {isCurrent && (
        <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary-400 rounded-full animate-pulse" />
      )}
    </button>
  );
});

/**
 * 流年格子元件
 */
const YearCell = memo(function YearCell({
  year,
  isSelected,
  isCurrent,
  isExpanded,
  onClick,
}: {
  year: number;
  isSelected: boolean;
  isCurrent: boolean;
  isExpanded: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        px-2.5 py-1.5 rounded transition-all duration-150
        text-xs sm:text-sm font-medium
        ${isSelected
          ? 'bg-gold-500/30 text-gold-400'
          : isExpanded
            ? 'bg-primary-700/60 text-primary-300'
            : isCurrent
              ? 'bg-primary-700/50 text-primary-300'
              : 'bg-dark-800/30 text-white/50 hover:bg-dark-700/50 hover:text-white/70'
        }
      `}
    >
      {year}
      {isCurrent && <span className="ml-0.5 text-[10px]">(今)</span>}
    </button>
  );
});

/**
 * 流月格子元件
 */
const MonthCell = memo(function MonthCell({
  month,
  isSelected,
  isCurrent,
  isExpanded,
  onClick,
}: {
  month: number;
  isSelected: boolean;
  isCurrent: boolean;
  isExpanded: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        w-9 h-9 sm:w-10 sm:h-10 rounded-lg transition-all duration-150
        text-xs sm:text-sm font-medium flex items-center justify-center
        ${isSelected
          ? 'bg-gold-500/30 text-gold-400'
          : isExpanded
            ? 'bg-primary-700/60 text-primary-300'
            : isCurrent
              ? 'bg-primary-700/50 text-primary-300'
              : 'bg-dark-800/30 text-white/50 hover:bg-dark-700/50'
        }
      `}
    >
      {month}月
    </button>
  );
});

/**
 * 流日格子元件
 */
const DayCell = memo(function DayCell({
  day,
  isSelected,
  isCurrent,
  onClick,
}: {
  day: number;
  isSelected: boolean;
  isCurrent: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        w-7 h-7 sm:w-8 sm:h-8 rounded transition-all duration-100
        text-[10px] sm:text-xs font-medium flex items-center justify-center
        ${isSelected
          ? 'bg-gold-500/40 text-gold-400'
          : isCurrent
            ? 'bg-primary-600/50 text-primary-300'
            : 'bg-dark-800/20 text-white/40 hover:bg-dark-700/40'
        }
      `}
    >
      {day}
    </button>
  );
});

function FortuneMatrixComponent({
  birthYear,
  selected,
  onSelect,
}: FortuneMatrixProps) {
  const today = useMemo(() => new Date(), []);
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;
  const currentDay = today.getDate();
  const currentAge = currentYear - birthYear;

  // 展開狀態
  const [expandedDecade, setExpandedDecade] = useState<{ start: number; end: number } | null>(
    selected.decadeRange || null
  );
  const [expandedYear, setExpandedYear] = useState<number | null>(selected.year || null);
  const [expandedMonth, setExpandedMonth] = useState<number | null>(selected.month || null);

  // 當前大限
  const currentDecade = useMemo(() => {
    return DECADE_CONFIGS.find(d => currentAge >= d.start && currentAge <= d.end) || null;
  }, [currentAge]);

  // 選中的大限涵蓋的年份
  const yearsInDecade = useMemo(() => {
    if (!expandedDecade) return [];
    const startYear = birthYear + expandedDecade.start;
    const endYear = birthYear + expandedDecade.end;
    return Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i);
  }, [expandedDecade, birthYear]);

  // 該月的天數
  const daysInMonth = useMemo(() => {
    if (!expandedYear || !expandedMonth) return [];
    const days = new Date(expandedYear, expandedMonth, 0).getDate();
    return Array.from({ length: days }, (_, i) => i + 1);
  }, [expandedYear, expandedMonth]);

  // 處理大限點擊
  const handleDecadeClick = useCallback((decade: { start: number; end: number }) => {
    if (expandedDecade?.start === decade.start) {
      // 如果已展開，再次點擊則選中這個大限
      onSelect('decade', { decadeRange: decade });
    } else {
      // 展開這個大限
      setExpandedDecade(decade);
      setExpandedYear(null);
      setExpandedMonth(null);
    }
  }, [expandedDecade, onSelect]);

  // 處理流年點擊
  const handleYearClick = useCallback((year: number) => {
    if (expandedYear === year) {
      // 再次點擊則選中這個年
      onSelect('year', {
        decadeRange: expandedDecade || undefined,
        year,
      });
    } else {
      setExpandedYear(year);
      setExpandedMonth(null);
    }
  }, [expandedYear, expandedDecade, onSelect]);

  // 處理流月點擊
  const handleMonthClick = useCallback((month: number) => {
    if (expandedMonth === month) {
      onSelect('month', {
        decadeRange: expandedDecade || undefined,
        year: expandedYear!,
        month,
      });
    } else {
      setExpandedMonth(month);
    }
  }, [expandedMonth, expandedDecade, expandedYear, onSelect]);

  // 處理流日點擊
  const handleDayClick = useCallback((day: number) => {
    onSelect('day', {
      decadeRange: expandedDecade || undefined,
      year: expandedYear!,
      month: expandedMonth!,
      day,
    });
  }, [expandedDecade, expandedYear, expandedMonth, onSelect]);

  // 處理本命點擊
  const handleNatalClick = useCallback(() => {
    setExpandedDecade(null);
    setExpandedYear(null);
    setExpandedMonth(null);
    onSelect('natal', {});
  }, [onSelect]);

  return (
    <div className="glass-card p-3 sm:p-4 space-y-3 sm:space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base sm:text-lg font-serif font-bold text-gradient flex items-center gap-2">
          <span>📊</span>
          <span>運勢時間軸</span>
        </h3>
        <button
          onClick={handleNatalClick}
          className={`
            px-3 py-1.5 text-xs sm:text-sm rounded-full transition-all duration-200
            ${selected.scope === 'natal'
              ? 'bg-gold-500/30 text-gold-400 border border-gold-400/50'
              : 'bg-dark-800/50 text-white/60 border border-white/10 hover:bg-dark-700/50'
            }
          `}
        >
          ☯ 本命
        </button>
      </div>

      {/* 大限層 */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs sm:text-sm text-white/60">
          <span className="w-10 sm:w-12 shrink-0">大限</span>
          <div className="flex-1 h-px bg-white/10" />
          {currentDecade && (
            <span className="text-[10px] sm:text-xs text-primary-400">
              目前 {currentAge} 歲
            </span>
          )}
        </div>
        <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-2 scrollbar-thin">
          {DECADE_CONFIGS.map(decade => (
            <DecadeCell
              key={decade.start}
              decade={decade}
              birthYear={birthYear}
              isSelected={
                selected.scope === 'decade' &&
                selected.decadeRange?.start === decade.start
              }
              isCurrent={currentDecade?.start === decade.start}
              isExpanded={expandedDecade?.start === decade.start}
              onClick={() => handleDecadeClick(decade)}
            />
          ))}
        </div>
      </div>

      {/* 流年層（展開時顯示） */}
      {expandedDecade && (
        <div className="space-y-2 animate-fade-in">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-white/60">
            <span className="w-10 sm:w-12 shrink-0">流年</span>
            <span className="text-[10px] sm:text-xs text-gold-400/60">
              {expandedDecade.start}-{expandedDecade.end}歲
            </span>
            <div className="flex-1 h-px bg-white/10" />
          </div>
          <div className="flex gap-1 sm:gap-1.5 flex-wrap">
            {yearsInDecade.map(year => (
              <YearCell
                key={year}
                year={year}
                isSelected={selected.year === year && (selected.scope === 'year' || selected.scope === 'month' || selected.scope === 'day')}
                isCurrent={year === currentYear}
                isExpanded={expandedYear === year}
                onClick={() => handleYearClick(year)}
              />
            ))}
          </div>
        </div>
      )}

      {/* 流月層（展開時顯示） */}
      {expandedYear && (
        <div className="space-y-2 animate-fade-in">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-white/60">
            <span className="w-10 sm:w-12 shrink-0">流月</span>
            <span className="text-[10px] sm:text-xs text-gold-400/60">{expandedYear}年</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>
          <div className="flex gap-1 sm:gap-1.5 flex-wrap">
            {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
              <MonthCell
                key={month}
                month={month}
                isSelected={
                  selected.year === expandedYear &&
                  selected.month === month &&
                  (selected.scope === 'month' || selected.scope === 'day')
                }
                isCurrent={expandedYear === currentYear && month === currentMonth}
                isExpanded={expandedMonth === month}
                onClick={() => handleMonthClick(month)}
              />
            ))}
          </div>
        </div>
      )}

      {/* 流日層（展開時顯示） */}
      {expandedMonth && (
        <div className="space-y-2 animate-fade-in">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-white/60">
            <span className="w-10 sm:w-12 shrink-0">流日</span>
            <span className="text-[10px] sm:text-xs text-gold-400/60">
              {expandedYear}年{expandedMonth}月
            </span>
            <div className="flex-1 h-px bg-white/10" />
          </div>
          <div className="flex gap-0.5 sm:gap-1 flex-wrap max-h-28 sm:max-h-32 overflow-y-auto scrollbar-thin">
            {daysInMonth.map(day => (
              <DayCell
                key={day}
                day={day}
                isSelected={
                  selected.year === expandedYear &&
                  selected.month === expandedMonth &&
                  selected.day === day &&
                  selected.scope === 'day'
                }
                isCurrent={
                  expandedYear === currentYear &&
                  expandedMonth === currentMonth &&
                  day === currentDay
                }
                onClick={() => handleDayClick(day)}
              />
            ))}
          </div>
        </div>
      )}

      {/* 目前選擇提示 */}
      <div className="pt-2 border-t border-white/10 text-xs sm:text-sm">
        <span className="text-white/50">目前選擇：</span>
        <span className="text-gold-400 ml-2">
          {selected.scope === 'natal' && '本命盤'}
          {selected.scope === 'decade' && selected.decadeRange &&
            `${selected.decadeRange.start}-${selected.decadeRange.end}歲大限`
          }
          {selected.scope === 'year' && `${selected.year}年流年`}
          {selected.scope === 'month' && `${selected.year}年${selected.month}月流月`}
          {selected.scope === 'day' &&
            `${selected.year}年${selected.month}月${selected.day}日流日`
          }
        </span>
      </div>
    </div>
  );
}

const FortuneMatrix = memo(FortuneMatrixComponent);
export default FortuneMatrix;

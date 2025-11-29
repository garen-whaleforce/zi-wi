/**
 * POST /api/astrolabe
 * 根據出生資訊排盤（支援陽曆和陰曆）
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateAstrolabe, generateAstrolabeByLunar } from '@/lib/ziweiEngine';
import type { BirthData } from '@/lib/types';

/**
 * 驗證出生日期
 */
function validateBirthDate(dateStr: string, calendar: 'solar' | 'lunar'): { valid: boolean; error?: string } {
  if (!dateStr) {
    return { valid: false, error: '請輸入出生日期' };
  }

  const [year, month, day] = dateStr.split('-').map(Number);

  // 檢查年份範圍（1900-當年）
  const currentYear = new Date().getFullYear();
  if (year < 1900 || year > currentYear) {
    return { valid: false, error: `出生年份須在 1900-${currentYear} 之間` };
  }

  // 檢查月份
  if (month < 1 || month > 12) {
    return { valid: false, error: '月份須在 1-12 之間' };
  }

  // 檢查日期
  if (calendar === 'solar') {
    // 陽曆：根據月份檢查最大日期
    const daysInMonth = new Date(year, month, 0).getDate();
    if (day < 1 || day > daysInMonth) {
      return { valid: false, error: `${month} 月最多只有 ${daysInMonth} 天` };
    }
  } else {
    // 陰曆：大月30天，小月29天
    if (day < 1 || day > 30) {
      return { valid: false, error: '陰曆日期須在 1-30 之間' };
    }
  }

  // 檢查是否為未來日期
  const inputDate = new Date(year, month - 1, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (inputDate > today) {
    return { valid: false, error: '出生日期不能是未來日期' };
  }

  return { valid: true };
}

/**
 * 驗證時辰索引
 */
function validateBirthTimeIndex(index: number): { valid: boolean; error?: string } {
  if (index === undefined || index === null) {
    return { valid: false, error: '請選擇出生時辰' };
  }

  if (!Number.isInteger(index) || index < 0 || index > 11) {
    return { valid: false, error: '出生時辰須在 0-11 之間（子時至亥時）' };
  }

  return { valid: true };
}

/**
 * 驗證性別
 */
function validateGender(gender: string): { valid: boolean; error?: string } {
  if (!gender) {
    return { valid: false, error: '請選擇性別' };
  }

  if (!['男', '女', 'M', 'F'].includes(gender)) {
    return { valid: false, error: '性別須為「男」或「女」' };
  }

  return { valid: true };
}

export async function POST(request: NextRequest) {
  try {
    const birthData: BirthData = await request.json();

    // 完整驗證
    const dateValidation = validateBirthDate(birthData.birthDate, birthData.calendar || 'solar');
    if (!dateValidation.valid) {
      return NextResponse.json(
        { error: dateValidation.error },
        { status: 400 },
      );
    }

    const timeValidation = validateBirthTimeIndex(birthData.birthTimeIndex);
    if (!timeValidation.valid) {
      return NextResponse.json(
        { error: timeValidation.error },
        { status: 400 },
      );
    }

    const genderValidation = validateGender(birthData.gender);
    if (!genderValidation.valid) {
      return NextResponse.json(
        { error: genderValidation.error },
        { status: 400 },
      );
    }

    // 根據曆制選擇排盤方式
    let astrolabe;
    if (birthData.calendar === 'lunar') {
      astrolabe = await generateAstrolabeByLunar(birthData);
    } else {
      astrolabe = await generateAstrolabe(birthData);
    }

    return NextResponse.json({
      chartId: astrolabe.chartId,
      astrolabe,
    });
  } catch (error) {
    console.error('Astrolabe generation error:', error);

    // 區分不同類型的錯誤
    if (error instanceof Error) {
      if (error.message.includes('Invalid date')) {
        return NextResponse.json(
          { error: '日期格式無效，請檢查輸入' },
          { status: 400 },
        );
      }
    }

    return NextResponse.json(
      { error: '排盤失敗，請稍後再試' },
      { status: 500 },
    );
  }
}

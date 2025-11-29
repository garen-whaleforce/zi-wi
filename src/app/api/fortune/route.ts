/**
 * POST /api/fortune
 * 根據命盤與運勢類型，產生運勢資料
 */

import { NextRequest, NextResponse } from 'next/server';
import { getHoroscope, type HoroscopeData } from '@/lib/ziweiEngine';
import type { Astrolabe, FortuneData } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const { astrolabe, scope, year, month, day } = await request.json();

    // 驗證
    if (!scope) {
      return NextResponse.json(
        { error: '缺少必填欄位' },
        { status: 400 },
      );
    }

    // 本命盤不需要計算運限
    if (scope === 'natal') {
      return NextResponse.json({
        scope: 'natal',
        overallScore: 0,
        summary: '本命盤顯示您的先天命格特質。',
        parents: '',
        children: '',
        marriage: '',
        career: '',
        wealth: '',
        health: '',
        keyPeriods: [],
      } as FortuneData);
    }

    // 如果沒有命盤資料，返回基本資訊
    if (!astrolabe) {
      return NextResponse.json({
        scope,
        year,
        month,
        day,
        overallScore: 0,
        summary: '請提供命盤資料以計算運勢。',
        parents: '',
        children: '',
        marriage: '',
        career: '',
        wealth: '',
        health: '',
        keyPeriods: [],
      } as FortuneData);
    }

    // 使用 iztro 計算真實運限
    const horoscope = getHoroscope(
      astrolabe as Astrolabe,
      scope as 'decade' | 'year' | 'month' | 'day',
      { year: year || new Date().getFullYear(), month: month || 1, day: day || 1 }
    );

    // 將運限資料轉換為 FortuneData 格式
    const fortune = convertHoroscopeToFortune(horoscope, scope, { year, month, day });

    return NextResponse.json(fortune);
  } catch (error) {
    console.error('Fortune generation error:', error);
    return NextResponse.json(
      { error: '運勢查詢失敗' },
      { status: 500 },
    );
  }
}

/**
 * 將 HoroscopeData 轉換為 FortuneData
 */
function convertHoroscopeToFortune(
  horoscope: HoroscopeData,
  scope: string,
  params: { year?: number; month?: number; day?: number }
): FortuneData {
  const scopeLabel = {
    decade: '大限',
    year: '流年',
    month: '流月',
    day: '流日',
  }[scope] || scope;

  // 建立宮位運限摘要
  const palaceSummaries = horoscope.palaceHoroscopes?.map((p) => {
    const stars: string[] = [];
    if (scope === 'decade' && p.decadeStars?.length) {
      stars.push(...p.decadeStars);
    }
    if ((scope === 'year' || scope === 'decade') && p.yearStars?.length) {
      stars.push(...p.yearStars);
    }
    if ((scope === 'month' || scope === 'year') && p.monthStars?.length) {
      stars.push(...p.monthStars);
    }
    if (scope === 'day' && p.dayStars?.length) {
      stars.push(...p.dayStars);
    }
    return { name: p.name, stars };
  }) || [];

  // 找出各宮位的星曜
  const findPalaceStars = (palaceName: string): string => {
    const palace = palaceSummaries.find((p) => p.name === palaceName);
    if (palace && palace.stars.length > 0) {
      return `${scopeLabel}期間，${palaceName}宮有 ${palace.stars.join('、')} 等星曜影響。`;
    }
    return `${scopeLabel}期間，${palaceName}宮運勢平穩。`;
  };

  // 產生總結
  let summary = `${scopeLabel}運勢分析：`;
  if (horoscope.decadePalace) {
    summary += `\n大限宮位：${horoscope.decadePalace}`;
  }
  if (horoscope.yearPalace) {
    summary += `\n流年宮位：${horoscope.yearPalace}`;
  }
  if (horoscope.monthPalace) {
    summary += `\n流月宮位：${horoscope.monthPalace}`;
  }
  if (horoscope.dayPalace) {
    summary += `\n流日宮位：${horoscope.dayPalace}`;
  }

  // 計算整體分數（基於星曜數量的簡單評估）
  const totalStars = palaceSummaries.reduce((sum, p) => sum + p.stars.length, 0);
  const overallScore = Math.min(100, Math.max(0, 50 + totalStars * 3));

  // 產生關鍵時期
  const keyPeriods: string[] = [];
  if (horoscope.decpiAge) {
    keyPeriods.push(`大限：${horoscope.decpiAge.start}-${horoscope.decpiAge.end} 歲`);
  }
  if (params.year) {
    keyPeriods.push(`年份：${params.year} 年`);
  }
  if (params.month) {
    keyPeriods.push(`月份：${params.month} 月`);
  }
  if (params.day) {
    keyPeriods.push(`日期：${params.day} 日`);
  }

  return {
    scope: scope as FortuneData['scope'],
    decadeRange: horoscope.decpiAge,
    year: params.year,
    month: params.month,
    day: params.day,
    overallScore,
    summary,
    parents: findPalaceStars('父母'),
    children: findPalaceStars('子女'),
    marriage: findPalaceStars('夫妻'),
    career: findPalaceStars('官祿'),
    wealth: findPalaceStars('財帛'),
    health: findPalaceStars('疾厄'),
    keyPeriods,
  };
}

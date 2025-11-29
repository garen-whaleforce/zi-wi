/**
 * 產生假運勢資料（Stub）
 * 用於開發階段，之後可替換為真實 iztro 運限計算
 */

import type { FortuneData } from './types';

/**
 * 產生模擬的運勢 JSON
 */
export function generateFortuneStub(scope: 'natal' | 'year' | 'month' | 'day', params: any): FortuneData {
  const scopeLabel = {
    natal: '本命',
    year: '流年',
    month: '流月',
    day: '流日',
  }[scope];

  return {
    scope,
    year: params.year,
    month: params.month,
    day: params.day,
    overallScore: Math.floor(Math.random() * 100),
    summary: `${scopeLabel}運勢示意：這是範例資料，實際運勢需要結合完整命盤計算。`,
    parents: `${scopeLabel}期間，與父母或長輩的互動傾向。建議保持耐心和溝通。`,
    children: `${scopeLabel}期間，與子女或晚輩的相處情況。可多花時間陪伴與指導。`,
    marriage: `${scopeLabel}期間，感情運勢。已婚者應加強溝通；單身者保持開放心態。`,
    career: `${scopeLabel}期間，事業發展機會。建議把握學習機會，穩健推進計畫。`,
    wealth: `${scopeLabel}期間，財運變化。理性消費，避免衝動投資，穩健理財最重要。`,
    health: `${scopeLabel}期間，身心狀態。規律作息、適度運動、保持樂觀心態。`,
    keyPeriods: [
      `${scopeLabel}初期：適合規劃與準備`,
      `${scopeLabel}中期：適合行動與執行`,
      `${scopeLabel}末期：適合總結與調整`,
    ],
  };
}

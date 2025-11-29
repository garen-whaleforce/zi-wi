/**
 * 命盤存儲管理
 * 支援 localStorage（離線）和 Supabase（雲端同步）
 */

import type { Astrolabe, SavedChart } from './types';
import {
  saveChartToSupabase,
  getChartFromSupabase,
  deleteChartFromSupabase,
  updateChartName as updateChartNameSupabase,
  isSupabaseConfigured,
} from './supabase';

const CHARTS_KEY = 'saved_charts';

/**
 * 取得所有已保存的命盤列表
 */
export function getSavedCharts(): SavedChart[] {
  if (typeof window === 'undefined') return [];

  try {
    const data = localStorage.getItem(CHARTS_KEY);
    if (!data) return [];
    return JSON.parse(data);
  } catch (e) {
    console.error('讀取命盤列表失敗:', e);
    return [];
  }
}

/**
 * 保存命盤（同時存到 localStorage 和 Supabase）
 */
export function saveChart(astrolabe: Astrolabe): SavedChart {
  const charts = getSavedCharts();

  const savedChart: SavedChart = {
    chartId: astrolabe.chartId,
    name: astrolabe.name || '未命名',
    birthDate: astrolabe.birthDate,
    birthTime: astrolabe.birthTime,
    gender: astrolabe.gender,
    createdAt: new Date().toISOString(),
    astrolabe,
  };

  // 檢查是否已存在（根據 chartId）
  const existingIndex = charts.findIndex(c => c.chartId === astrolabe.chartId);
  if (existingIndex >= 0) {
    charts[existingIndex] = savedChart;
  } else {
    charts.unshift(savedChart); // 新的放在最前面
  }

  // 最多保存 20 個命盤
  const trimmedCharts = charts.slice(0, 20);

  localStorage.setItem(CHARTS_KEY, JSON.stringify(trimmedCharts));

  // 同時保存單一命盤資料（向後兼容）
  localStorage.setItem(`astrolabe_${astrolabe.chartId}`, JSON.stringify(astrolabe));

  // 非同步儲存到 Supabase（不阻塞）
  if (isSupabaseConfigured) {
    saveChartToSupabase(astrolabe).catch(err => {
      console.warn('Supabase 同步失敗:', err);
    });
  }

  return savedChart;
}

/**
 * 取得單一命盤（優先 localStorage，其次 Supabase）
 */
export function getChart(chartId: string): Astrolabe | null {
  if (typeof window === 'undefined') return null;

  try {
    // 優先從單一存儲讀取
    const data = localStorage.getItem(`astrolabe_${chartId}`);
    if (data) {
      return JSON.parse(data);
    }

    // 從列表中找
    const charts = getSavedCharts();
    const found = charts.find(c => c.chartId === chartId);
    return found?.astrolabe || null;
  } catch (e) {
    console.error('讀取命盤失敗:', e);
    return null;
  }
}

/**
 * 非同步取得命盤（支援從 Supabase 載入）
 */
export async function getChartAsync(chartId: string): Promise<Astrolabe | null> {
  // 先嘗試本地
  const localChart = getChart(chartId);
  if (localChart) {
    return localChart;
  }

  // 嘗試從 Supabase 載入
  if (isSupabaseConfigured) {
    const result = await getChartFromSupabase(chartId);
    if (result.success && result.chart) {
      // 同步到本地
      saveChart(result.chart);
      return result.chart;
    }
  }

  return null;
}

/**
 * 刪除命盤
 */
export function deleteChart(chartId: string): void {
  const charts = getSavedCharts();
  const filtered = charts.filter(c => c.chartId !== chartId);
  localStorage.setItem(CHARTS_KEY, JSON.stringify(filtered));
  localStorage.removeItem(`astrolabe_${chartId}`);

  // 非同步從 Supabase 刪除
  if (isSupabaseConfigured) {
    deleteChartFromSupabase(chartId).catch(err => {
      console.warn('Supabase 刪除失敗:', err);
    });
  }
}

/**
 * 更新命盤名稱
 */
export function updateChartName(chartId: string, newName: string): void {
  const charts = getSavedCharts();
  const chart = charts.find(c => c.chartId === chartId);

  if (chart) {
    chart.name = newName;
    chart.astrolabe.name = newName;
    localStorage.setItem(CHARTS_KEY, JSON.stringify(charts));
    localStorage.setItem(`astrolabe_${chartId}`, JSON.stringify(chart.astrolabe));

    // 非同步更新 Supabase
    if (isSupabaseConfigured) {
      updateChartNameSupabase(chartId, newName).catch(err => {
        console.warn('Supabase 更新名稱失敗:', err);
      });
    }
  }
}

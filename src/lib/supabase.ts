/**
 * Supabase 客戶端設定
 * 支援瀏覽器端和伺服器端使用
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Astrolabe } from './types';

// ============ Supabase 設定 ============

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// 檢查環境變數
const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

// 建立 Supabase 客戶端（僅在設定完成時）
let supabase: SupabaseClient | null = null;

if (isSupabaseConfigured) {
  supabase = createClient(supabaseUrl!, supabaseAnonKey!);
}

// ============ 資料庫型別 ============

export interface DBChart {
  id: string;
  user_id?: string;
  name: string | null;
  gender: '男' | '女';
  birth_date: string;
  birth_time: string;
  timezone: string;
  chart_data: Astrolabe;
  created_at: string;
  updated_at: string;
}

export interface DBInterpretation {
  id: string;
  chart_id: string;
  fortune_scope: string;
  fortune_params: Record<string, any>;
  result: Record<string, any>;
  created_at: string;
}

// ============ 命盤 CRUD ============

/**
 * 儲存命盤到 Supabase
 */
export async function saveChartToSupabase(
  astrolabe: Astrolabe
): Promise<{ success: boolean; chartId?: string; error?: string }> {
  if (!supabase) {
    console.log('Supabase 未設定，跳過雲端儲存');
    return { success: false, error: 'Supabase 未設定' };
  }

  try {
    const chartData: Partial<DBChart> = {
      id: astrolabe.chartId,
      name: astrolabe.name,
      gender: astrolabe.gender,
      birth_date: astrolabe.birthDate,
      birth_time: astrolabe.birthTime,
      timezone: astrolabe.timezone,
      chart_data: astrolabe,
    };

    const { data, error } = await supabase
      .from('charts')
      .upsert(chartData)
      .select('id')
      .single();

    if (error) {
      console.error('Supabase 儲存失敗:', error);
      return { success: false, error: error.message };
    }

    return { success: true, chartId: data.id };
  } catch (error) {
    console.error('儲存命盤錯誤:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '未知錯誤',
    };
  }
}

/**
 * 從 Supabase 讀取命盤
 */
export async function getChartFromSupabase(
  chartId: string
): Promise<{ success: boolean; chart?: Astrolabe; error?: string }> {
  if (!supabase) {
    return { success: false, error: 'Supabase 未設定' };
  }

  try {
    const { data, error } = await supabase
      .from('charts')
      .select('chart_data')
      .eq('id', chartId)
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, chart: data.chart_data as Astrolabe };
  } catch (error) {
    console.error('讀取命盤錯誤:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '未知錯誤',
    };
  }
}

/**
 * 取得使用者所有命盤
 */
export async function getUserCharts(
  userId?: string
): Promise<{ success: boolean; charts?: DBChart[]; error?: string }> {
  if (!supabase) {
    return { success: false, error: 'Supabase 未設定' };
  }

  try {
    let query = supabase
      .from('charts')
      .select('*')
      .order('created_at', { ascending: false });

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, charts: data as DBChart[] };
  } catch (error) {
    console.error('取得命盤列表錯誤:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '未知錯誤',
    };
  }
}

/**
 * 刪除命盤
 */
export async function deleteChartFromSupabase(
  chartId: string
): Promise<{ success: boolean; error?: string }> {
  if (!supabase) {
    return { success: false, error: 'Supabase 未設定' };
  }

  try {
    const { error } = await supabase.from('charts').delete().eq('id', chartId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('刪除命盤錯誤:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '未知錯誤',
    };
  }
}

/**
 * 更新命盤名稱
 */
export async function updateChartName(
  chartId: string,
  name: string
): Promise<{ success: boolean; error?: string }> {
  if (!supabase) {
    return { success: false, error: 'Supabase 未設定' };
  }

  try {
    const { error } = await supabase
      .from('charts')
      .update({ name, updated_at: new Date().toISOString() })
      .eq('id', chartId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('更新命盤名稱錯誤:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '未知錯誤',
    };
  }
}

// ============ 解讀結果快取 ============

/**
 * 儲存解讀結果
 */
export async function saveInterpretation(
  chartId: string,
  fortuneScope: string,
  fortuneParams: Record<string, any>,
  result: Record<string, any>
): Promise<{ success: boolean; error?: string }> {
  if (!supabase) {
    return { success: false, error: 'Supabase 未設定' };
  }

  try {
    const { error } = await supabase.from('interpretations').upsert({
      chart_id: chartId,
      fortune_scope: fortuneScope,
      fortune_params: fortuneParams,
      result,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('儲存解讀結果錯誤:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '未知錯誤',
    };
  }
}

/**
 * 取得快取的解讀結果
 */
export async function getCachedInterpretation(
  chartId: string,
  fortuneScope: string,
  fortuneParams: Record<string, any>
): Promise<{ success: boolean; result?: Record<string, any>; error?: string }> {
  if (!supabase) {
    return { success: false, error: 'Supabase 未設定' };
  }

  try {
    const { data, error } = await supabase
      .from('interpretations')
      .select('result')
      .eq('chart_id', chartId)
      .eq('fortune_scope', fortuneScope)
      .eq('fortune_params', fortuneParams)
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, result: data.result };
  } catch (error) {
    return { success: false };
  }
}

// ============ 匯出 ============

export { supabase, isSupabaseConfigured };

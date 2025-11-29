/**
 * POST /api/interpret
 * 根據命盤 + 運勢，使用 LLM 生成解釋
 * 含速率限制保護（每分鐘 10 次）和雙層快取（記憶體 + Supabase）
 */

import { NextRequest, NextResponse } from 'next/server';
import { callLLM } from '@/lib/llm';
import {
  checkRateLimit,
  getClientIP,
  createRateLimitResponse,
  RATE_LIMIT_CONFIGS,
} from '@/lib/rateLimit';
import {
  interpretCache,
  generateCacheKey,
  startCacheCleanup,
} from '@/lib/cache';
import {
  getCachedInterpretation,
  saveInterpretation,
  isSupabaseConfigured,
  initializeTables,
} from '@/lib/supabase';
import type { Astrolabe, FortuneData, InterpretResult } from '@/lib/types';

// 啟動快取清理定時器
startCacheCleanup();

// 初始化 Supabase 資料表（啟動時檢查）
if (isSupabaseConfigured) {
  initializeTables().then((result) => {
    if (result.success) {
      console.log('Supabase 資料表已就緒');
    } else {
      console.warn('Supabase 初始化提示:', result.error);
    }
  });
}

/**
 * 建立快取鍵（用於記憶體快取）
 * 確保不同的 scope 有不同的快取鍵
 */
function buildInterpretCacheKey(
  astrolabe: Astrolabe,
  fortune: FortuneData | null
): string {
  if (!fortune || fortune.scope === 'natal') {
    return generateCacheKey('interpret', astrolabe.chartId, 'natal');
  }

  // 對於非本命運勢，包含完整的識別資訊
  const decadeKey = fortune.decadeRange
    ? `${fortune.decadeRange.start}-${fortune.decadeRange.end}`
    : 'nodecade';

  const fortuneKey = `${fortune.scope}-${decadeKey}-${fortune.year || 0}-${fortune.month || 0}-${fortune.day || 0}`;

  return generateCacheKey('interpret', astrolabe.chartId, fortuneKey);
}

/**
 * 取得運勢範圍字串
 */
function getFortuneScope(fortune: FortuneData | null): string {
  return fortune?.scope || 'natal';
}

/**
 * 建立運勢參數物件（用於 Supabase 查詢）
 */
function buildFortuneParams(fortune: FortuneData | null): Record<string, any> {
  if (!fortune) {
    return { scope: 'natal' };
  }
  return {
    scope: fortune.scope,
    year: fortune.year,
    month: fortune.month,
    day: fortune.day,
    decadeRange: fortune.decadeRange,
  };
}

export async function POST(request: NextRequest) {
  // 速率限制檢查
  const clientIP = getClientIP(request);
  const rateLimitResult = checkRateLimit(
    clientIP,
    RATE_LIMIT_CONFIGS.interpret
  );

  if (!rateLimitResult.allowed) {
    return createRateLimitResponse(rateLimitResult);
  }

  try {
    const { astrolabe, fortune, topics } = await request.json();

    if (!astrolabe) {
      return NextResponse.json({ error: '缺少命盤資料' }, { status: 400 });
    }

    const chartId = (astrolabe as Astrolabe).chartId;
    const fortuneScope = getFortuneScope(fortune as FortuneData | null);
    const fortuneParams = buildFortuneParams(fortune as FortuneData | null);
    const memoryCacheKey = buildInterpretCacheKey(
      astrolabe as Astrolabe,
      fortune as FortuneData | null
    );

    // 詳細日誌記錄
    console.log('=== Interpret API 請求 ===');
    console.log('chartId:', chartId);
    console.log('fortune scope:', fortune?.scope || 'null (natal)');
    console.log('fortune data:', JSON.stringify(fortune, null, 2));
    console.log('memoryCacheKey:', memoryCacheKey);

    let result: InterpretResult | null = null;
    let cacheSource: 'memory' | 'supabase' | 'llm' = 'llm';

    // 第一層：檢查記憶體快取
    const memoryCached = interpretCache.get(memoryCacheKey);
    if (memoryCached) {
      console.log(`記憶體快取命中: ${memoryCacheKey}`);
      result = memoryCached as InterpretResult;
      cacheSource = 'memory';
    }

    // 第二層：檢查 Supabase 持久化快取
    if (!result && isSupabaseConfigured) {
      console.log(`檢查 Supabase 快取: chartId=${chartId}, scope=${fortuneScope}`);
      const supabaseResult = await getCachedInterpretation(
        chartId,
        fortuneScope,
        fortuneParams
      );

      if (supabaseResult.success && supabaseResult.result) {
        console.log(`Supabase 快取命中: chartId=${chartId}`);
        result = supabaseResult.result as InterpretResult;
        cacheSource = 'supabase';

        // 回填到記憶體快取
        interpretCache.set(memoryCacheKey, result, 5 * 60 * 1000);
      }
    }

    // 第三層：呼叫 LLM 生成
    if (!result) {
      console.log(`快取未命中，呼叫 LLM: chartId=${chartId}, scope=${fortuneScope}`);
      result = await callLLM(
        astrolabe as Astrolabe,
        fortune as FortuneData | null,
        topics || []
      );
      cacheSource = 'llm';

      // 儲存到記憶體快取
      interpretCache.set(memoryCacheKey, result, 5 * 60 * 1000);

      // 儲存到 Supabase 持久化快取（非同步，不阻塞回應）
      if (isSupabaseConfigured) {
        saveInterpretation(chartId, fortuneScope, fortuneParams, result)
          .then((saveResult) => {
            if (saveResult.success) {
              console.log(`Supabase 快取已儲存: chartId=${chartId}`);
            } else {
              console.error(`Supabase 儲存失敗: ${saveResult.error}`);
            }
          })
          .catch((err) => {
            console.error('Supabase 儲存錯誤:', err);
          });
      }
    }

    // 在回應中加入速率限制和快取資訊
    const response = NextResponse.json(result);
    response.headers.set(
      'X-RateLimit-Remaining',
      String(rateLimitResult.remaining)
    );
    response.headers.set('X-RateLimit-Reset', String(rateLimitResult.resetTime));
    response.headers.set('X-Cache', cacheSource.toUpperCase());
    response.headers.set('X-Cache-Source', cacheSource);

    return response;
  } catch (error) {
    console.error('Interpretation error:', error);
    return NextResponse.json({ error: '解釋生成失敗' }, { status: 500 });
  }
}

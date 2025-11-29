/**
 * POST /api/interpret
 * 根據命盤 + 運勢，使用 LLM 生成解釋
 * 含速率限制保護（每分鐘 10 次）和伺服器端快取
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
  withCache,
  startCacheCleanup,
} from '@/lib/cache';
import type { Astrolabe, FortuneData, InterpretResult } from '@/lib/types';

// 啟動快取清理定時器
startCacheCleanup();

/**
 * 建立快取鍵
 */
function buildInterpretCacheKey(
  astrolabe: Astrolabe,
  fortune: FortuneData | null
): string {
  // 使用命盤 ID + 運勢資訊 + 日期作為快取鍵
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const fortuneKey = fortune
    ? `${fortune.scope}-${fortune.year}-${fortune.month}-${fortune.day}`
    : 'natal';

  return generateCacheKey('interpret', astrolabe.chartId, fortuneKey, today);
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

    // 建立快取鍵
    const cacheKey = buildInterpretCacheKey(
      astrolabe as Astrolabe,
      fortune as FortuneData | null
    );

    // 使用快取包裝 LLM 呼叫
    const result = await withCache<InterpretResult>(
      interpretCache,
      cacheKey,
      async () => {
        return await callLLM(
          astrolabe as Astrolabe,
          fortune as FortuneData | null,
          topics || []
        );
      },
      5 * 60 * 1000 // 5 分鐘 TTL
    );

    // 在回應中加入速率限制和快取資訊
    const response = NextResponse.json(result);
    response.headers.set(
      'X-RateLimit-Remaining',
      String(rateLimitResult.remaining)
    );
    response.headers.set('X-RateLimit-Reset', String(rateLimitResult.resetTime));
    response.headers.set(
      'X-Cache',
      interpretCache.has(cacheKey) ? 'HIT' : 'MISS'
    );

    return response;
  } catch (error) {
    console.error('Interpretation error:', error);
    return NextResponse.json({ error: '解釋生成失敗' }, { status: 500 });
  }
}

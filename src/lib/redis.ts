/**
 * Redis 客戶端設定
 * 用於持久化快取 LLM 解讀結果
 */

import Redis from 'ioredis';

// Redis 連線設定
const REDIS_URL = process.env.REDIS_URL;

// 檢查 Redis 是否已設定
export const isRedisConfigured = !!REDIS_URL;

// Redis 客戶端（單例模式）
let redis: Redis | null = null;

/**
 * 取得 Redis 客戶端
 */
export function getRedisClient(): Redis | null {
  if (!isRedisConfigured) {
    return null;
  }

  if (!redis) {
    redis = new Redis(REDIS_URL!, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        if (times > 3) {
          console.error('Redis 連線失敗，已達最大重試次數');
          return null;
        }
        return Math.min(times * 200, 2000);
      },
      lazyConnect: true,
    });

    redis.on('error', (err) => {
      console.error('Redis 錯誤:', err.message);
    });

    redis.on('connect', () => {
      console.log('Redis 已連線');
    });
  }

  return redis;
}

// ============ 快取操作 ============

/**
 * 預設 TTL（7 天，單位：秒）
 */
const DEFAULT_TTL = 7 * 24 * 60 * 60;

/**
 * 從 Redis 取得快取
 */
export async function getFromRedis<T>(key: string): Promise<T | null> {
  const client = getRedisClient();
  if (!client) {
    return null;
  }

  try {
    const data = await client.get(key);
    if (!data) {
      return null;
    }
    return JSON.parse(data) as T;
  } catch (error) {
    console.error('Redis 讀取錯誤:', error);
    return null;
  }
}

/**
 * 儲存到 Redis
 */
export async function setToRedis<T>(
  key: string,
  value: T,
  ttlSeconds: number = DEFAULT_TTL
): Promise<boolean> {
  const client = getRedisClient();
  if (!client) {
    return false;
  }

  try {
    await client.setex(key, ttlSeconds, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error('Redis 寫入錯誤:', error);
    return false;
  }
}

/**
 * 刪除 Redis 快取
 */
export async function deleteFromRedis(key: string): Promise<boolean> {
  const client = getRedisClient();
  if (!client) {
    return false;
  }

  try {
    await client.del(key);
    return true;
  } catch (error) {
    console.error('Redis 刪除錯誤:', error);
    return false;
  }
}

/**
 * 建立解讀快取鍵
 */
export function buildRedisInterpretKey(
  chartId: string,
  fortuneScope: string,
  fortuneParams: {
    decadeRange?: { start: number; end: number };
    year?: number;
    month?: number;
    day?: number;
  }
): string {
  const decadeKey = fortuneParams.decadeRange
    ? `${fortuneParams.decadeRange.start}-${fortuneParams.decadeRange.end}`
    : 'nodecade';

  const parts = [
    'interpret',
    chartId,
    fortuneScope,
    decadeKey,
    fortuneParams.year || 0,
    fortuneParams.month || 0,
    fortuneParams.day || 0,
  ];

  return parts.join(':');
}

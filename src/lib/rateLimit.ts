/**
 * API 速率限制模組
 * 使用記憶體存儲（適用於單一伺服器環境）
 */

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

// 記憶體存儲速率限制記錄
const rateLimitStore = new Map<string, RateLimitRecord>();

// 定期清理過期記錄（每 5 分鐘）
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let cleanupTimer: NodeJS.Timeout | null = null;

function startCleanupTimer() {
  if (cleanupTimer) return;
  cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitStore.entries()) {
      if (record.resetTime < now) {
        rateLimitStore.delete(key);
      }
    }
  }, CLEANUP_INTERVAL);
}

// 啟動清理定時器
startCleanupTimer();

export interface RateLimitConfig {
  // 時間窗口（毫秒）
  windowMs: number;
  // 最大請求次數
  maxRequests: number;
  // 識別符前綴（用於區分不同的 API）
  keyPrefix?: string;
}

export interface RateLimitResult {
  // 是否允許請求
  allowed: boolean;
  // 剩餘請求次數
  remaining: number;
  // 重置時間（毫秒時間戳）
  resetTime: number;
  // 重試等待時間（秒）
  retryAfter?: number;
}

/**
 * 檢查速率限制
 * @param identifier 用戶識別符（如 IP 地址）
 * @param config 速率限制配置
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const { windowMs, maxRequests, keyPrefix = '' } = config;
  const key = `${keyPrefix}:${identifier}`;
  const now = Date.now();

  let record = rateLimitStore.get(key);

  // 如果沒有記錄或記錄已過期，創建新記錄
  if (!record || record.resetTime < now) {
    record = {
      count: 1,
      resetTime: now + windowMs,
    };
    rateLimitStore.set(key, record);

    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetTime: record.resetTime,
    };
  }

  // 檢查是否超過限制
  if (record.count >= maxRequests) {
    const retryAfter = Math.ceil((record.resetTime - now) / 1000);
    return {
      allowed: false,
      remaining: 0,
      resetTime: record.resetTime,
      retryAfter,
    };
  }

  // 增加計數
  record.count += 1;
  rateLimitStore.set(key, record);

  return {
    allowed: true,
    remaining: maxRequests - record.count,
    resetTime: record.resetTime,
  };
}

/**
 * 從請求中獲取客戶端 IP
 */
export function getClientIP(request: Request): string {
  // 嘗試從各種 header 中獲取 IP
  const headers = request.headers;

  // Cloudflare
  const cfIP = headers.get('cf-connecting-ip');
  if (cfIP) return cfIP;

  // X-Forwarded-For（可能有多個 IP，取第一個）
  const forwardedFor = headers.get('x-forwarded-for');
  if (forwardedFor) {
    const ips = forwardedFor.split(',').map((ip) => ip.trim());
    return ips[0];
  }

  // X-Real-IP
  const realIP = headers.get('x-real-ip');
  if (realIP) return realIP;

  // 如果都沒有，返回預設值
  return 'unknown';
}

/**
 * 預設的速率限制配置
 */
export const RATE_LIMIT_CONFIGS = {
  // LLM 解釋 API：每分鐘 10 次
  interpret: {
    windowMs: 60 * 1000, // 1 分鐘
    maxRequests: 10,
    keyPrefix: 'interpret',
  },
  // 排盤 API：每分鐘 30 次
  astrolabe: {
    windowMs: 60 * 1000,
    maxRequests: 30,
    keyPrefix: 'astrolabe',
  },
  // 運勢 API：每分鐘 60 次
  fortune: {
    windowMs: 60 * 1000,
    maxRequests: 60,
    keyPrefix: 'fortune',
  },
} as const;

/**
 * 創建速率限制錯誤回應
 */
export function createRateLimitResponse(result: RateLimitResult): Response {
  return new Response(
    JSON.stringify({
      error: '請求過於頻繁，請稍後再試',
      retryAfter: result.retryAfter,
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(result.retryAfter || 60),
        'X-RateLimit-Remaining': String(result.remaining),
        'X-RateLimit-Reset': String(result.resetTime),
      },
    }
  );
}

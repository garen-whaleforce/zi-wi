/**
 * 重試機制與錯誤處理工具
 */

/**
 * 可重試的錯誤類型
 */
export class RetryableError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly retryAfter?: number
  ) {
    super(message);
    this.name = 'RetryableError';
  }
}

/**
 * 速率限制錯誤
 */
export class RateLimitError extends RetryableError {
  constructor(retryAfter: number = 60) {
    super('請求過於頻繁，請稍後再試', 429, retryAfter);
    this.name = 'RateLimitError';
  }
}

/**
 * API 錯誤
 */
export class APIError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly code?: string,
    public readonly retryable: boolean = false
  ) {
    super(message);
    this.name = 'APIError';
  }
}

/**
 * 重試配置
 */
export interface RetryConfig {
  maxRetries: number;        // 最大重試次數
  initialDelayMs: number;    // 初始延遲（毫秒）
  maxDelayMs: number;        // 最大延遲（毫秒）
  backoffMultiplier: number; // 延遲倍增係數
  timeoutMs?: number;        // 請求超時時間
}

/**
 * 預設重試配置
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
  timeoutMs: 30000,
};

/**
 * 延遲函數
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 計算下一次重試的延遲時間（指數退避）
 */
function calculateBackoff(
  attempt: number,
  config: RetryConfig,
  retryAfter?: number
): number {
  // 如果 API 指定了 retry-after，優先使用
  if (retryAfter && retryAfter > 0) {
    return Math.min(retryAfter * 1000, config.maxDelayMs);
  }

  // 指數退避 + 隨機抖動
  const exponentialDelay = config.initialDelayMs * Math.pow(config.backoffMultiplier, attempt);
  const jitter = Math.random() * 0.3 * exponentialDelay; // 加入 30% 隨機抖動
  return Math.min(exponentialDelay + jitter, config.maxDelayMs);
}

/**
 * 判斷錯誤是否可重試
 */
function isRetryableError(error: unknown): boolean {
  if (error instanceof RetryableError) {
    return true;
  }

  if (error instanceof APIError) {
    return error.retryable;
  }

  // HTTP 狀態碼判斷
  if (error instanceof Error && 'statusCode' in error) {
    const statusCode = (error as any).statusCode;
    // 5xx 伺服器錯誤、429 速率限制、408 請求超時
    return statusCode >= 500 || statusCode === 429 || statusCode === 408;
  }

  // 網路錯誤通常可重試
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return true;
  }

  return false;
}

/**
 * 帶重試機制的函數執行器
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const fullConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError: unknown;

  for (let attempt = 0; attempt <= fullConfig.maxRetries; attempt++) {
    try {
      // 加入超時控制
      if (fullConfig.timeoutMs) {
        const result = await Promise.race([
          fn(),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('請求超時')), fullConfig.timeoutMs)
          ),
        ]);
        return result;
      }

      return await fn();
    } catch (error) {
      lastError = error;

      // 記錄錯誤
      console.error(`嘗試 ${attempt + 1}/${fullConfig.maxRetries + 1} 失敗:`, error);

      // 檢查是否應該重試
      if (attempt >= fullConfig.maxRetries || !isRetryableError(error)) {
        throw error;
      }

      // 計算延遲時間
      const retryAfter = error instanceof RetryableError ? error.retryAfter : undefined;
      const delayMs = calculateBackoff(attempt, fullConfig, retryAfter);

      console.log(`將在 ${Math.round(delayMs / 1000)} 秒後重試...`);
      await delay(delayMs);
    }
  }

  throw lastError;
}

/**
 * 帶超時的 fetch
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number = 30000
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * 統一的 API 錯誤回應格式
 */
export interface APIErrorResponse {
  error: string;
  code?: string;
  retryable: boolean;
  retryAfter?: number;
  timestamp: string;
}

/**
 * 建立統一的錯誤回應
 */
export function createErrorResponse(
  error: unknown,
  defaultMessage: string = '發生錯誤，請稍後再試'
): APIErrorResponse {
  const timestamp = new Date().toISOString();

  if (error instanceof RateLimitError) {
    return {
      error: error.message,
      code: 'RATE_LIMIT',
      retryable: true,
      retryAfter: error.retryAfter,
      timestamp,
    };
  }

  if (error instanceof APIError) {
    return {
      error: error.message,
      code: error.code,
      retryable: error.retryable,
      timestamp,
    };
  }

  if (error instanceof RetryableError) {
    return {
      error: error.message,
      code: 'RETRYABLE_ERROR',
      retryable: true,
      retryAfter: error.retryAfter,
      timestamp,
    };
  }

  if (error instanceof Error) {
    return {
      error: error.message || defaultMessage,
      code: 'UNKNOWN_ERROR',
      retryable: false,
      timestamp,
    };
  }

  return {
    error: defaultMessage,
    code: 'UNKNOWN_ERROR',
    retryable: false,
    timestamp,
  };
}

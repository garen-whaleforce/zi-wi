/**
 * 前端快取工具
 * LRU (Least Recently Used) 快取實作
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

/**
 * LRU 快取類別
 */
export class LRUCache<T> {
  private cache: Map<string, CacheEntry<T>>;
  private maxSize: number;
  private defaultTTL: number; // 毫秒

  constructor(maxSize: number = 100, defaultTTL: number = 5 * 60 * 1000) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTL;
  }

  /**
   * 取得快取值
   */
  get(key: string): T | undefined {
    const entry = this.cache.get(key);

    if (!entry) {
      return undefined;
    }

    // 檢查是否過期
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return undefined;
    }

    // 移動到最前面（最近使用）
    this.cache.delete(key);
    this.cache.set(key, entry);

    return entry.value;
  }

  /**
   * 設定快取值
   */
  set(key: string, value: T, ttl?: number): void {
    // 如果已存在，先刪除
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }

    // 如果超過容量，刪除最舊的
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    const expiresAt = Date.now() + (ttl || this.defaultTTL);
    this.cache.set(key, { value, expiresAt });
  }

  /**
   * 檢查是否存在
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * 刪除快取
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * 清空所有快取
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * 取得快取大小
   */
  get size(): number {
    return this.cache.size;
  }

  /**
   * 清理過期項目
   */
  cleanup(): number {
    const now = Date.now();
    let removed = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        removed++;
      }
    }

    return removed;
  }
}

/**
 * 解讀結果快取（5 分鐘 TTL）
 */
export const interpretCache = new LRUCache<any>(50, 5 * 60 * 1000);

/**
 * 運勢資料快取（10 分鐘 TTL）
 */
export const fortuneCache = new LRUCache<any>(100, 10 * 60 * 1000);

/**
 * 產生快取鍵
 */
export function generateCacheKey(prefix: string, ...args: any[]): string {
  const data = args.map((arg) => {
    if (typeof arg === 'object' && arg !== null) {
      // 對物件進行穩定序列化
      return JSON.stringify(arg, Object.keys(arg).sort());
    }
    return String(arg);
  });

  return `${prefix}:${data.join(':')}`;
}

/**
 * 帶快取的函數執行器
 */
export async function withCache<T>(
  cache: LRUCache<T>,
  key: string,
  fn: () => Promise<T>,
  ttl?: number
): Promise<T> {
  // 嘗試從快取取得
  const cached = cache.get(key);
  if (cached !== undefined) {
    console.log(`快取命中: ${key}`);
    return cached;
  }

  // 執行函數
  console.log(`快取未命中: ${key}`);
  const result = await fn();

  // 儲存到快取
  cache.set(key, result, ttl);

  return result;
}

/**
 * 定期清理快取（每 5 分鐘）
 */
let cleanupInterval: NodeJS.Timeout | null = null;

export function startCacheCleanup(): void {
  if (cleanupInterval) return;

  cleanupInterval = setInterval(
    () => {
      const interpretRemoved = interpretCache.cleanup();
      const fortuneRemoved = fortuneCache.cleanup();

      if (interpretRemoved > 0 || fortuneRemoved > 0) {
        console.log(
          `快取清理完成: 解讀 ${interpretRemoved} 項, 運勢 ${fortuneRemoved} 項`
        );
      }
    },
    5 * 60 * 1000
  );
}

export function stopCacheCleanup(): void {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
  }
}

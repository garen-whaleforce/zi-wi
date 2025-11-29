/**
 * LRU Cache 單元測試
 */

import { LRUCache, generateCacheKey, withCache } from '@/lib/cache';

describe('LRUCache', () => {
  let cache: LRUCache<string>;

  beforeEach(() => {
    cache = new LRUCache<string>(3, 1000); // 3 個項目，1 秒 TTL
  });

  describe('基本操作', () => {
    it('應該能設定和取得值', () => {
      cache.set('key1', 'value1');
      expect(cache.get('key1')).toBe('value1');
    });

    it('不存在的鍵應該返回 undefined', () => {
      expect(cache.get('nonexistent')).toBeUndefined();
    });

    it('應該能刪除值', () => {
      cache.set('key1', 'value1');
      expect(cache.delete('key1')).toBe(true);
      expect(cache.get('key1')).toBeUndefined();
    });

    it('應該能檢查鍵是否存在', () => {
      cache.set('key1', 'value1');
      expect(cache.has('key1')).toBe(true);
      expect(cache.has('key2')).toBe(false);
    });

    it('應該能清空快取', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.clear();
      expect(cache.size).toBe(0);
    });
  });

  describe('LRU 行為', () => {
    it('超過容量時應該移除最舊的項目', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');
      cache.set('key4', 'value4'); // 應該移除 key1

      expect(cache.get('key1')).toBeUndefined();
      expect(cache.get('key2')).toBe('value2');
      expect(cache.get('key3')).toBe('value3');
      expect(cache.get('key4')).toBe('value4');
    });

    it('存取項目應該更新其位置', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');

      // 存取 key1，使其變成最近使用
      cache.get('key1');

      // 新增 key4，應該移除 key2（最久未使用）
      cache.set('key4', 'value4');

      expect(cache.get('key1')).toBe('value1');
      expect(cache.get('key2')).toBeUndefined();
      expect(cache.get('key3')).toBe('value3');
      expect(cache.get('key4')).toBe('value4');
    });
  });

  describe('TTL 過期', () => {
    it('過期的項目應該被移除', async () => {
      cache.set('key1', 'value1', 50); // 50ms TTL
      expect(cache.get('key1')).toBe('value1');

      await new Promise((resolve) => setTimeout(resolve, 60));

      expect(cache.get('key1')).toBeUndefined();
    });

    it('has() 應該返回 false 對於過期項目', async () => {
      cache.set('key1', 'value1', 50);
      expect(cache.has('key1')).toBe(true);

      await new Promise((resolve) => setTimeout(resolve, 60));

      expect(cache.has('key1')).toBe(false);
    });

    it('cleanup() 應該移除過期項目', async () => {
      cache.set('key1', 'value1', 50);
      cache.set('key2', 'value2', 50);
      cache.set('key3', 'value3', 10000); // 長 TTL

      await new Promise((resolve) => setTimeout(resolve, 60));

      const removed = cache.cleanup();
      expect(removed).toBe(2);
      expect(cache.size).toBe(1);
      expect(cache.get('key3')).toBe('value3');
    });
  });
});

describe('generateCacheKey', () => {
  it('應該生成正確格式的鍵', () => {
    const key = generateCacheKey('prefix', 'arg1', 'arg2');
    expect(key).toBe('prefix:arg1:arg2');
  });

  it('應該處理物件參數', () => {
    const key = generateCacheKey('prefix', { a: 1, b: 2 });
    expect(key).toContain('prefix:');
    expect(key).toContain('"a":1');
    expect(key).toContain('"b":2');
  });

  it('應該穩定排序物件鍵', () => {
    const key1 = generateCacheKey('prefix', { b: 2, a: 1 });
    const key2 = generateCacheKey('prefix', { a: 1, b: 2 });
    expect(key1).toBe(key2);
  });
});

describe('withCache', () => {
  let cache: LRUCache<string>;

  beforeEach(() => {
    cache = new LRUCache<string>(10, 60000);
  });

  it('快取未命中時應該執行函數', async () => {
    const fn = jest.fn().mockResolvedValue('result');

    const result = await withCache(cache, 'key1', fn);

    expect(fn).toHaveBeenCalledTimes(1);
    expect(result).toBe('result');
  });

  it('快取命中時不應該執行函數', async () => {
    cache.set('key1', 'cached');
    const fn = jest.fn().mockResolvedValue('new result');

    const result = await withCache(cache, 'key1', fn);

    expect(fn).not.toHaveBeenCalled();
    expect(result).toBe('cached');
  });

  it('應該快取函數結果', async () => {
    const fn = jest.fn().mockResolvedValue('result');

    await withCache(cache, 'key1', fn);
    expect(cache.get('key1')).toBe('result');
  });
});

/**
 * 重試機制單元測試
 */

import {
  RetryableError,
  RateLimitError,
  APIError,
  withRetry,
  fetchWithTimeout,
} from '@/lib/retry';

describe('錯誤類別', () => {
  describe('RetryableError', () => {
    it('應該是 Error 的實例', () => {
      const error = new RetryableError('test error');
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(RetryableError);
    });

    it('應該保存 statusCode', () => {
      const error = new RetryableError('test', 500);
      expect(error.statusCode).toBe(500);
    });

    it('應該有正確的名稱', () => {
      const error = new RetryableError('test');
      expect(error.name).toBe('RetryableError');
    });
  });

  describe('RateLimitError', () => {
    it('應該保存 retryAfter', () => {
      const error = new RateLimitError(60);
      expect(error.retryAfter).toBe(60);
    });

    it('應該有正確的訊息', () => {
      const error = new RateLimitError(30);
      expect(error.message).toContain('請求過於頻繁');
    });
  });

  describe('APIError', () => {
    it('應該保存所有屬性', () => {
      const error = new APIError('test', 400, 'INVALID', false);
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('INVALID');
      expect(error.retryable).toBe(false);
    });

    it('預設應該不可重試', () => {
      const error = new APIError('test', 500);
      expect(error.retryable).toBe(false);
    });
  });
});

describe('withRetry', () => {
  it('成功時應該返回結果', async () => {
    const fn = jest.fn().mockResolvedValue('success');
    const result = await withRetry(fn, { maxRetries: 0 });
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('非可重試錯誤應該立即拋出', async () => {
    const fn = jest.fn().mockRejectedValue(new Error('non-retryable'));

    await expect(
      withRetry(fn, { maxRetries: 3, initialDelayMs: 1 })
    ).rejects.toThrow('non-retryable');
    expect(fn).toHaveBeenCalledTimes(1);
  });
});

describe('fetchWithTimeout', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockReset();
  });

  it('應該成功取得回應', async () => {
    const mockResponse = { ok: true, json: () => Promise.resolve({ data: 'test' }) };
    (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

    const response = await fetchWithTimeout('https://api.example.com', {});
    expect(response).toBe(mockResponse);
  });
});

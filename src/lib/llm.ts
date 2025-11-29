/**
 * LLM（大語言模型）抽象層
 * 使用 OpenAI API，含重試機制與 fallback
 */

import type { Astrolabe, FortuneData, InterpretResult } from './types';
import {
  withRetry,
  fetchWithTimeout,
  RetryableError,
  RateLimitError,
  APIError,
} from './retry';

// 系統角色設定
const SYSTEM_PROMPT = `你是一位以紫微斗數為基礎的命盤分析助手。

## 重要規則
1. 你僅提供娛樂與自我反思參考，不提供醫療、投資、法律等專業建議。
2. 命盤資料以 JSON 方式提供給你，不要自行編造星曜位置。
3. 不要推翻命盤數據，不要自行猜測星曜在何宮，只能根據提供的資訊解釋。
4. 遇到健康、財務等議題，只能給出生活習慣與態度建議，並提醒尋求專業人士協助。
5. 語氣溫和專業，避免過於絕對的斷言，多使用「傾向於」、「可能」、「適合考慮」等詞彙。
6. 請用繁體中文回答。

## 輸出格式
請以 JSON 格式回覆，不要包含任何其他文字。`;

/**
 * LLM 配置
 */
interface LLMConfig {
  apiKey: string;
  model: string;
  maxTokens: number;
  temperature: number;
  timeoutMs: number;
}

/**
 * 模型 fallback 順序
 */
const MODEL_FALLBACK_ORDER = ['gpt-4o-mini', 'gpt-3.5-turbo'];

/**
 * 取得 LLM 配置
 */
function getLLMConfig(): LLMConfig {
  const apiKey = process.env.OPENAI_API_KEY || '';
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

  return {
    apiKey,
    model,
    maxTokens: 4096,
    temperature: 0.7,
    timeoutMs: 30000, // 30 秒超時
  };
}

/**
 * 呼叫 OpenAI API（底層函數）
 */
async function callOpenAIAPI(
  messages: { role: string; content: string }[],
  config: LLMConfig,
  model?: string
): Promise<string> {
  const useModel = model || config.model;

  const response = await fetchWithTimeout(
    'https://api.openai.com/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: useModel,
        messages,
        max_tokens: config.maxTokens,
        temperature: config.temperature,
      }),
    },
    config.timeoutMs
  );

  // 處理錯誤回應
  if (!response.ok) {
    const errorText = await response.text();
    let errorData: any = {};
    try {
      errorData = JSON.parse(errorText);
    } catch {
      // 忽略 JSON 解析錯誤
    }

    // 429 速率限制
    if (response.status === 429) {
      const retryAfter = parseInt(response.headers.get('retry-after') || '60');
      throw new RateLimitError(retryAfter);
    }

    // 5xx 伺服器錯誤（可重試）
    if (response.status >= 500) {
      throw new RetryableError(
        `OpenAI 伺服器錯誤: ${response.status}`,
        response.status
      );
    }

    // 4xx 客戶端錯誤（不可重試）
    throw new APIError(
      errorData.error?.message || `API 錯誤: ${response.status}`,
      response.status,
      errorData.error?.code,
      false
    );
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new APIError('OpenAI 回應無內容', 500, 'EMPTY_RESPONSE', true);
  }

  return content;
}

/**
 * 帶重試和 fallback 的 OpenAI 呼叫
 */
async function callOpenAIWithFallback(
  messages: { role: string; content: string }[],
  config: LLMConfig
): Promise<string> {
  // 建立模型列表（主模型 + fallback）
  const models = [config.model];
  for (const fallbackModel of MODEL_FALLBACK_ORDER) {
    if (!models.includes(fallbackModel)) {
      models.push(fallbackModel);
    }
  }

  let lastError: unknown;

  for (const model of models) {
    try {
      console.log(`嘗試使用模型: ${model}`);

      // 使用重試機制呼叫 API
      const result = await withRetry(
        () => callOpenAIAPI(messages, config, model),
        {
          maxRetries: 2,
          initialDelayMs: 1000,
          maxDelayMs: 5000,
          timeoutMs: config.timeoutMs,
        }
      );

      console.log(`模型 ${model} 呼叫成功`);
      return result;
    } catch (error) {
      lastError = error;
      console.error(`模型 ${model} 呼叫失敗:`, error);

      // 如果是速率限制，等待後繼續嘗試下一個模型
      if (error instanceof RateLimitError) {
        console.log('遇到速率限制，嘗試下一個模型...');
        continue;
      }

      // 其他錯誤也嘗試下一個模型
      continue;
    }
  }

  // 所有模型都失敗
  throw lastError;
}

/**
 * 解析 LLM 回應為 JSON
 */
function parseLLMResponse(content: string): InterpretResult {
  try {
    // 移除可能的 markdown 代碼塊標記
    const jsonStr = content
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();
    const parsed = JSON.parse(jsonStr);

    return {
      // 十二宮
      life: parsed.life || '解讀生成中...',
      siblings: parsed.siblings || '解讀生成中...',
      marriage: parsed.marriage || '解讀生成中...',
      children: parsed.children || '解讀生成中...',
      wealth: parsed.wealth || '解讀生成中...',
      health: parsed.health || '解讀生成中...',
      travel: parsed.travel || '解讀生成中...',
      friends: parsed.friends || '解讀生成中...',
      career: parsed.career || '解讀生成中...',
      property: parsed.property || '解讀生成中...',
      fortune: parsed.fortune || '解讀生成中...',
      parents: parsed.parents || '解讀生成中...',
      // 總覽與今日
      summary: parsed.summary || '解讀生成中...',
      todayAdvice: Array.isArray(parsed.todayAdvice) ? parsed.todayAdvice : [],
      todayTodo: Array.isArray(parsed.todayTodo) ? parsed.todayTodo : [],
      todayAvoid: Array.isArray(parsed.todayAvoid) ? parsed.todayAvoid : [],
    };
  } catch (parseError) {
    console.error('JSON 解析錯誤，使用原始內容:', parseError);
    // 如果 JSON 解析失敗，將整個內容放入 summary
    const defaultText = '請參考總結';
    return {
      life: defaultText,
      siblings: defaultText,
      marriage: defaultText,
      children: defaultText,
      wealth: defaultText,
      health: defaultText,
      travel: defaultText,
      friends: defaultText,
      career: defaultText,
      property: defaultText,
      fortune: defaultText,
      parents: defaultText,
      summary: content,
      todayAdvice: [],
      todayTodo: [],
      todayAvoid: [],
    };
  }
}

/**
 * 呼叫 LLM 進行命盤解釋（主要入口）
 */
export async function callLLM(
  astrolabe: Astrolabe,
  fortune: FortuneData | null,
  topics: string[]
): Promise<InterpretResult> {
  const config = getLLMConfig();

  if (!config.apiKey) {
    console.error('OpenAI API Key 未設定');
    return getDefaultResult('API 金鑰未設定，請聯繫管理員');
  }

  // 建立命盤 JSON 資料
  const chartData = buildChartData(astrolabe, fortune);

  // 取得今天日期
  const today = new Date().toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });

  const prompt = `請根據以下命盤 JSON 資料，為命主提供詳細的命理解讀。

## 命盤資料
\`\`\`json
${JSON.stringify(chartData, null, 2)}
\`\`\`

## 今天日期
${today}

## 解讀任務
請針對十二宮提供解讀（每項 80-120 字）：

1. **命宮解讀**（life）：性格特質、人生觀、外在形象
2. **兄弟宮解讀**（siblings）：兄弟姐妹關係、朋友交際、人際互動
3. **夫妻宮解讀**（marriage）：感情婚姻、伴侶關係、擇偶傾向
4. **子女宮解讀**（children）：子女緣份、與晚輩的互動、教養方式
5. **財帛宮解讀**（wealth）：財運、理財方式、收入來源
6. **疾厄宮解讀**（health）：健康狀況、需注意事項、養生建議
7. **遷移宮解讀**（travel）：外出運勢、遠行發展、貴人運
8. **交友宮解讀**（friends）：人際關係、朋友助力、部屬運
9. **官祿宮解讀**（career）：職業發展、工作運勢、適合行業
10. **田宅宮解讀**（property）：不動產運、居家環境、家族資產
11. **福德宮解讀**（fortune）：精神生活、興趣嗜好、內心世界、晚年運勢
12. **父母宮解讀**（parents）：與長輩、父母的關係、家庭背景影響

另外提供：
- **總結建議**（summary）：整體性格特質與人生建議（100-150字）
- **今日適合做的事**（todayTodo）：根據命盤與今日運勢，列出 3-5 件今天適合做的具體事項
- **今日不適合的事**（todayAvoid）：根據命盤與今日運勢，列出 3-5 件今天應避免的事項

## 輸出 JSON 格式
{
  "life": "命宮解讀內容",
  "siblings": "兄弟宮解讀內容",
  "marriage": "夫妻宮解讀內容",
  "children": "子女宮解讀內容",
  "wealth": "財帛宮解讀內容（請加註：投資理財請諮詢專業人士）",
  "health": "疾厄宮解讀內容（請加註：健康問題請就醫諮詢）",
  "travel": "遷移宮解讀內容",
  "friends": "交友宮解讀內容",
  "career": "官祿宮解讀內容",
  "property": "田宅宮解讀內容",
  "fortune": "福德宮解讀內容",
  "parents": "父母宮解讀內容",
  "summary": "總結建議",
  "todayTodo": ["適合做的事1", "適合做的事2", "適合做的事3"],
  "todayAvoid": ["不適合的事1", "不適合的事2", "不適合的事3"]
}`;

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: prompt },
  ];

  try {
    const content = await callOpenAIWithFallback(messages, config);
    return parseLLMResponse(content);
  } catch (error) {
    console.error('呼叫 LLM 時發生錯誤:', error);

    // 根據錯誤類型提供不同的錯誤訊息
    if (error instanceof RateLimitError) {
      return getDefaultResult('服務繁忙中，請稍後再試');
    }

    if (error instanceof APIError) {
      return getDefaultResult(
        `服務暫時不可用 (${error.code || error.statusCode})`
      );
    }

    if (error instanceof Error && error.message.includes('超時')) {
      return getDefaultResult('服務回應超時，請稍後再試');
    }

    return getDefaultResult('無法連接 AI 服務，請檢查網路連線');
  }
}

/**
 * 建立給 LLM 的命盤資料結構
 */
function buildChartData(astrolabe: Astrolabe, fortune: FortuneData | null) {
  // 基本資料
  const meta = {
    gender: astrolabe.gender,
    birthDate: astrolabe.birthDate,
    birthTime: astrolabe.birthTime,
    timezone: astrolabe.timezone,
  };

  // 從 iztro 原始資料取得更多資訊
  const originalData = astrolabe.originalData || {};

  // 整理十二宮資料
  const palaces: Record<string, any> = {};
  for (const palace of astrolabe.palaces) {
    palaces[palace.name] = {
      heavenlyStem: palace.stem,
      earthlyBranch: palace.branch,
      mainStars: palace.mainStars.map((s) => s.name),
      minorStars: palace.minorStars.map((s) => s.name),
    };
  }

  // 運勢資料
  const fortuneData = fortune
    ? {
        scope: fortune.scope,
        year: fortune.year,
        month: fortune.month,
        day: fortune.day,
      }
    : null;

  return {
    meta,
    palaces,
    fortune: fortuneData,
    // 加入額外的 iztro 資料（如果有）
    fiveElementsClass: originalData.fiveElementsClass,
    soulStar: originalData.soul?.majorStars?.[0]?.name,
    bodyStar: originalData.body?.majorStars?.[0]?.name,
  };
}

/**
 * 預設結果（錯誤時使用）
 */
function getDefaultResult(errorMessage?: string): InterpretResult {
  const defaultText = errorMessage || '無法生成解讀，請稍後再試。';
  return {
    life: defaultText,
    siblings: defaultText,
    marriage: defaultText,
    children: defaultText,
    wealth: defaultText,
    health: defaultText,
    travel: defaultText,
    friends: defaultText,
    career: defaultText,
    property: defaultText,
    fortune: defaultText,
    parents: defaultText,
    summary:
      errorMessage || '目前無法連接 AI 服務，請檢查網路連線或稍後再試。',
    todayAdvice: [],
    todayTodo: [],
    todayAvoid: [],
  };
}

/**
 * 紫微斗數命盤相關類型定義
 */

// ============ 共用型別 ============

/**
 * 運勢範圍類型
 */
export type FortuneScope = 'natal' | 'decade' | 'year' | 'month' | 'day';

/**
 * 十二宮位名稱
 */
export type PalaceName =
  | '命宮' | '兄弟' | '夫妻' | '子女'
  | '財帛' | '疾厄' | '遷移' | '交友'
  | '官祿' | '田宅' | '福德' | '父母';

/**
 * 宮位英文 key 對應（用於 InterpretResult）
 */
export type PalaceKey =
  | 'life' | 'siblings' | 'marriage' | 'children'
  | 'wealth' | 'health' | 'travel' | 'friends'
  | 'career' | 'property' | 'fortune' | 'parents';

/**
 * 宮位名稱與英文 key 的對應表
 */
export const PALACE_NAME_TO_KEY: Record<PalaceName, PalaceKey> = {
  '命宮': 'life',
  '兄弟': 'siblings',
  '夫妻': 'marriage',
  '子女': 'children',
  '財帛': 'wealth',
  '疾厄': 'health',
  '遷移': 'travel',
  '交友': 'friends',
  '官祿': 'career',
  '田宅': 'property',
  '福德': 'fortune',
  '父母': 'parents',
};

/**
 * 英文 key 與宮位名稱的對應表
 */
export const PALACE_KEY_TO_NAME: Record<PalaceKey, PalaceName> = {
  life: '命宮',
  siblings: '兄弟',
  marriage: '夫妻',
  children: '子女',
  wealth: '財帛',
  health: '疾厄',
  travel: '遷移',
  friends: '交友',
  career: '官祿',
  property: '田宅',
  fortune: '福德',
  parents: '父母',
};

// ============ 資料型別 ============

export interface BirthData {
  name: string | null;
  gender: '男' | '女' | 'M' | 'F';
  birthDate: string; // YYYY-MM-DD
  birthTimeIndex: number; // 0-11: 子丑寅卯辰巳午未申酉戌亥
  timezone: string;
  calendar: 'solar' | 'lunar';
  earlyZiHour?: boolean;
  leapMonthMode?: 'current' | 'next';
}

export interface Star {
  name: string;
  type: 'main' | 'minor' | 'misc'; // 主星、輔星、雜曜
}

export interface Palace {
  name: string;
  branch: string; // 地支：子、丑、寅...
  stem: string; // 天干
  mainStars: Star[];
  minorStars: Star[];
}

export interface Astrolabe {
  chartId: string;
  name: string | null;
  gender: '男' | '女';
  birthDate: string;
  birthTime: string;
  timezone: string;
  palaces: Palace[]; // 12 宮
  originalData?: any; // iztro 原始資料
}

export interface FortuneData {
  scope: FortuneScope;
  decadeRange?: { start: number; end: number }; // 大限年齡區間
  year?: number;
  month?: number;
  day?: number;
  overallScore: number; // 0-100
  summary: string;
  parents: string;
  children: string;
  marriage: string;
  career: string;
  wealth: string;
  health: string;
  keyPeriods: string[];
}

export interface InterpretResult {
  // 十二宮解讀
  life: string;        // 命宮
  siblings: string;    // 兄弟宮
  marriage: string;    // 夫妻宮
  children: string;    // 子女宮
  wealth: string;      // 財帛宮
  health: string;      // 疾厄宮
  travel: string;      // 遷移宮
  friends: string;     // 僕役/交友宮
  career: string;      // 官祿宮
  property: string;    // 田宅宮
  fortune: string;     // 福德宮
  parents: string;     // 父母宮
  // 總覽與今日運勢
  summary: string;
  todayAdvice?: string[]; // 今日建議（3條）
  todayTodo?: string[];   // 今日適合做的事（3-5條）
  todayAvoid?: string[];  // 今日不適合的事（3-5條）
}

// 已保存的命盤資料
export interface SavedChart {
  chartId: string;
  name: string;
  birthDate: string;
  birthTime: string;
  gender: '男' | '女';
  createdAt: string;
  astrolabe: Astrolabe;
}

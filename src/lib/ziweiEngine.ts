import { astro } from 'iztro';
import { BirthData, Astrolabe, Palace, Star, FortuneScope, FortuneData, PalaceName } from './types';

// iztro FunctionalAstrolabe 型別（使用 any 避免版本相容問題）
type FunctionalAstrolabe = ReturnType<typeof astro.bySolar>;
import { EARTHLY_BRANCHES } from './constants';

/**
 * 簡體字轉繁體字對照表（紫微斗數專用術語）
 */
const SIMPLIFIED_TO_TRADITIONAL: Record<string, string> = {
  // 宮位名稱
  '命宫': '命宮',
  '兄弟': '兄弟',
  '夫妻': '夫妻',
  '子女': '子女',
  '财帛': '財帛',
  '疾厄': '疾厄',
  '迁移': '遷移',
  '仆役': '僕役',
  '交友': '交友',
  '官禄': '官祿',
  '事业': '事業',
  '田宅': '田宅',
  '福德': '福德',
  '父母': '父母',
  // 主星
  '紫微': '紫微',
  '天机': '天機',
  '太阳': '太陽',
  '武曲': '武曲',
  '天同': '天同',
  '廉贞': '廉貞',
  '天府': '天府',
  '太阴': '太陰',
  '贪狼': '貪狼',
  '巨门': '巨門',
  '天相': '天相',
  '天梁': '天梁',
  '七杀': '七殺',
  '破军': '破軍',
  // 輔星
  '文昌': '文昌',
  '文曲': '文曲',
  '左辅': '左輔',
  '右弼': '右弼',
  '天魁': '天魁',
  '天钺': '天鉞',
  '禄存': '祿存',
  '天马': '天馬',
  // 煞星
  '擎羊': '擎羊',
  '陀罗': '陀羅',
  '火星': '火星',
  '铃星': '鈴星',
  '地空': '地空',
  '地劫': '地劫',
  // 四化
  '化禄': '化祿',
  '化权': '化權',
  '化科': '化科',
  '化忌': '化忌',
  // 雜曜
  '天空': '天空',
  '天刑': '天刑',
  '天姚': '天姚',
  '解神': '解神',
  '天巫': '天巫',
  '天月': '天月',
  '阴煞': '陰煞',
  '台辅': '台輔',
  '封诰': '封誥',
  '天贵': '天貴',
  '天官': '天官',
  '天福': '天福',
  '天厨': '天廚',
  '龙池': '龍池',
  '凤阁': '鳳閣',
  '红鸾': '紅鸞',
  '天喜': '天喜',
  '孤辰': '孤辰',
  '寡宿': '寡宿',
  '蜚廉': '蜚廉',
  '破碎': '破碎',
  '华盖': '華蓋',
  '咸池': '咸池',
  '天德': '天德',
  '月德': '月德',
  '天才': '天才',
  '天寿': '天壽',
  '截空': '截空',
  '旬空': '旬空',
  '天伤': '天傷',
  '天使': '天使',
  '三台': '三台',
  '八座': '八座',
  '恩光': '恩光',
  // 長生十二神
  '长生': '長生',
  '沐浴': '沐浴',
  '冠带': '冠帶',
  '临官': '臨官',
  '帝旺': '帝旺',
  '衰': '衰',
  '病': '病',
  '死': '死',
  '墓': '墓',
  '绝': '絕',
  '胎': '胎',
  '养': '養',
  // 博士十二神
  '博士': '博士',
  '力士': '力士',
  '青龙': '青龍',
  '小耗': '小耗',
  '将军': '將軍',
  '奏书': '奏書',
  '飞廉': '飛廉',
  '喜神': '喜神',
  '病符': '病符',
  '大耗': '大耗',
  '伏兵': '伏兵',
  '官府': '官府',
  // 流年諸星
  '岁建': '歲建',
  '晦气': '晦氣',
  '丧门': '喪門',
  '贯索': '貫索',
  '官符': '官符',
  '岁破': '歲破',
  '龙德': '龍德',
  '白虎': '白虎',
  '吊客': '弔客',
  // 天干地支
  '辰': '辰',
  '戌': '戌',
  '丑': '丑',
  '未': '未',
  '寅': '寅',
  '申': '申',
  '卯': '卯',
  '酉': '酉',
  '巳': '巳',
  '亥': '亥',
  '子': '子',
  '午': '午',
  '甲': '甲',
  '乙': '乙',
  '丙': '丙',
  '丁': '丁',
  '戊': '戊',
  '己': '己',
  '庚': '庚',
  '辛': '辛',
  '壬': '壬',
  '癸': '癸',
};

/**
 * 將簡體字轉換為繁體字
 */
function toTraditional(text: string): string {
  if (!text) return text;

  // 先嘗試完整匹配
  if (SIMPLIFIED_TO_TRADITIONAL[text]) {
    return SIMPLIFIED_TO_TRADITIONAL[text];
  }

  // 逐字轉換
  let result = text;
  for (const [simplified, traditional] of Object.entries(SIMPLIFIED_TO_TRADITIONAL)) {
    result = result.replace(new RegExp(simplified, 'g'), traditional);
  }

  return result;
}

/**
 * 運限資料結構（不包含本命 natal）
 */
export interface HoroscopeData {
  scope: Exclude<FortuneScope, 'natal'>;
  // 大限資訊
  decpiAge?: { start: number; end: number };
  decadePalace?: string;
  // 流年資訊
  yearPalace?: string;
  yearStars?: { name: string; type: string }[];
  // 流月資訊
  monthPalace?: string;
  monthStars?: { name: string; type: string }[];
  // 流日資訊
  dayPalace?: string;
  dayStars?: { name: string; type: string }[];
  // 各宮位的運限星曜
  palaceHoroscopes?: {
    name: string;
    decadeStars?: string[];
    yearStars?: string[];
    monthStars?: string[];
    dayStars?: string[];
  }[];
}

/**
 * 陽曆排盤
 */
export async function generateAstrolabe(birthData: BirthData): Promise<Astrolabe> {
  try {
    const [year, month, day] = birthData.birthDate.split('-').map(Number);
    const gender = birthData.gender === '男' || birthData.gender === 'M' ? '男' : '女';
    const isLeapMonth = birthData.leapMonthMode === 'next';

    // iztro expects date as string format 'YYYY-MM-DD'
    const solarDateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    // Get time branch name for display
    const timeBranchName = EARTHLY_BRANCHES[birthData.birthTimeIndex] || '子';

    // Call iztro排盤 API
    const iztroResult = astro.bySolar(
      solarDateStr,
      birthData.birthTimeIndex,
      gender,
      isLeapMonth // fixLeap parameter
    );

    // Transform iztro palaces to our Palace interface
    const palaces: Palace[] = transformPalaces(iztroResult);

    const astrolabe: Astrolabe = {
      chartId: `astrolabe_${Date.now()}`,
      name: birthData.name || null,
      gender: gender as '男' | '女',
      birthDate: solarDateStr,
      birthTime: `${timeBranchName}時 (${String(birthData.birthTimeIndex).padStart(2, '0')}:00)`,
      timezone: birthData.timezone,
      palaces,
      originalData: iztroResult,
    };

    return astrolabe;
  } catch (error) {
    console.error('Error generating astrolabe:', error);
    throw error;
  }
}

/**
 * 陰曆排盤
 */
export async function generateAstrolabeByLunar(birthData: BirthData): Promise<Astrolabe> {
  try {
    const [year, month, day] = birthData.birthDate.split('-').map(Number);
    const gender = birthData.gender === '男' || birthData.gender === 'M' ? '男' : '女';
    const isLeapMonth = birthData.leapMonthMode === 'next';

    // Get time branch name for display
    const timeBranchName = EARTHLY_BRANCHES[birthData.birthTimeIndex] || '子';

    // Call iztro 陰曆排盤 API
    const iztroResult = astro.byLunar(
      `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
      birthData.birthTimeIndex,
      gender,
      isLeapMonth, // isLeapMonth
      birthData.leapMonthMode === 'next' // fixLeap
    );

    // Transform iztro palaces to our Palace interface
    const palaces: Palace[] = transformPalaces(iztroResult);

    // 從 iztro 取得對應的陽曆日期
    const solarDate = iztroResult.solarDate;

    const astrolabe: Astrolabe = {
      chartId: `astrolabe_${Date.now()}`,
      name: birthData.name || null,
      gender: gender as '男' | '女',
      birthDate: solarDate, // 儲存陽曆日期
      birthTime: `${timeBranchName}時 (${String(birthData.birthTimeIndex).padStart(2, '0')}:00)`,
      timezone: birthData.timezone,
      palaces,
      originalData: iztroResult,
    };

    return astrolabe;
  } catch (error) {
    console.error('Error generating astrolabe by lunar:', error);
    throw error;
  }
}

/**
 * 轉換 iztro 宮位資料為標準格式
 */
function transformPalaces(iztroResult: FunctionalAstrolabe): Palace[] {
  return iztroResult.palaces.map((ipalace: any) => ({
    name: toTraditional(ipalace.name),
    branch: toTraditional(ipalace.earthlyBranch),
    stem: toTraditional(ipalace.heavenlyStem),
    mainStars: ipalace.majorStars.map((star: any) => ({
      name: toTraditional(star.name),
      type: 'main' as const,
    } as Star)),
    minorStars: [
      ...ipalace.minorStars.map((star: any) => ({
        name: toTraditional(star.name),
        type: 'minor' as const,
      } as Star)),
      ...ipalace.adjectiveStars.map((star: any) => ({
        name: toTraditional(star.name),
        type: 'misc' as const,
      } as Star)),
    ],
  }));
}

/**
 * 從命盤資料重建 iztro 物件（用於 API 呼叫時）
 */
function rebuildIztroAstrolabe(astrolabe: Astrolabe): FunctionalAstrolabe | null {
  try {
    // 從 birthTime 解析時辰索引
    // birthTime 格式如: "子時 (00:00)" 或 "丑時 (01:00)"
    const timeMatch = astrolabe.birthTime?.match(/^([子丑寅卯辰巳午未申酉戌亥])時/);
    let birthTimeIndex = 0;
    if (timeMatch) {
      birthTimeIndex = EARTHLY_BRANCHES.indexOf(timeMatch[1]);
      if (birthTimeIndex === -1) birthTimeIndex = 0;
    }

    const gender = astrolabe.gender;

    // 重新呼叫 iztro 排盤
    const iztroResult = astro.bySolar(
      astrolabe.birthDate,
      birthTimeIndex,
      gender,
      false // fixLeap - 預設不是閏月
    );

    return iztroResult;
  } catch (error) {
    console.error('Error rebuilding iztro astrolabe:', error);
    return null;
  }
}

/**
 * 計算運限（大限/流年/流月/流日）
 */
export function getHoroscope(
  astrolabe: Astrolabe,
  scope: 'decade' | 'year' | 'month' | 'day',
  targetDate: { year: number; month: number; day: number }
): HoroscopeData {
  try {
    // 嘗試從 originalData 取得 iztro 物件
    let iztroAstrolabe = astrolabe.originalData as FunctionalAstrolabe;

    // 如果 originalData 無效（例如透過 JSON 傳遞後函數丟失），重新建立
    if (!iztroAstrolabe || typeof iztroAstrolabe.horoscope !== 'function') {
      console.log('Rebuilding iztro astrolabe for horoscope calculation...');
      iztroAstrolabe = rebuildIztroAstrolabe(astrolabe) as FunctionalAstrolabe;

      if (!iztroAstrolabe) {
        console.error('Failed to rebuild iztro astrolabe');
        return { scope };
      }
    }

    // 格式化日期
    const dateStr = `${targetDate.year}-${String(targetDate.month).padStart(2, '0')}-${String(targetDate.day).padStart(2, '0')}`;

    // 調用 iztro horoscope API
    const horoscope = iztroAstrolabe.horoscope(dateStr);

    const result: HoroscopeData = { scope };

    // 大限資訊
    if (horoscope.decadal) {
      const decadal = horoscope.decadal as any;
      if (decadal.age) {
        result.decpiAge = {
          start: decadal.age.start,
          end: decadal.age.end,
        };
      }
      result.decadePalace = decadal.palaceNames?.map((n: string) => toTraditional(n)).join('、');
    }

    // 流年資訊
    if (horoscope.yearly) {
      result.yearPalace = horoscope.yearly.palaceNames?.map((n: string) => toTraditional(n)).join('、');
      result.yearStars = extractStars(horoscope.yearly);
    }

    // 流月資訊
    if (horoscope.monthly) {
      result.monthPalace = horoscope.monthly.palaceNames?.map((n: string) => toTraditional(n)).join('、');
      result.monthStars = extractStars(horoscope.monthly);
    }

    // 流日資訊
    if (horoscope.daily) {
      result.dayPalace = horoscope.daily.palaceNames?.map((n: string) => toTraditional(n)).join('、');
      result.dayStars = extractStars(horoscope.daily);
    }

    // 各宮位的運限星曜（使用 any 繞過 iztro 型別定義問題）
    const horoscopeAny = horoscope as any;
    result.palaceHoroscopes = iztroAstrolabe.palaces.map((palace: any) => {
      const palaceHoroscope: any = {
        name: toTraditional(palace.name),
      };

      // 取得該宮位在各運限的星曜
      if (horoscopeAny.decadal?.palaces) {
        const decadalPalace = horoscopeAny.decadal.palaces.find((p: any) => p.name === palace.name);
        if (decadalPalace) {
          palaceHoroscope.decadeStars = [
            ...(decadalPalace.majorStars?.map((s: any) => toTraditional(s.name)) || []),
            ...(decadalPalace.minorStars?.map((s: any) => toTraditional(s.name)) || []),
          ];
        }
      }

      if (horoscopeAny.yearly?.palaces) {
        const yearlyPalace = horoscopeAny.yearly.palaces.find((p: any) => p.name === palace.name);
        if (yearlyPalace) {
          palaceHoroscope.yearStars = [
            ...(yearlyPalace.majorStars?.map((s: any) => toTraditional(s.name)) || []),
            ...(yearlyPalace.minorStars?.map((s: any) => toTraditional(s.name)) || []),
          ];
        }
      }

      if (horoscopeAny.monthly?.palaces) {
        const monthlyPalace = horoscopeAny.monthly.palaces.find((p: any) => p.name === palace.name);
        if (monthlyPalace) {
          palaceHoroscope.monthStars = [
            ...(monthlyPalace.majorStars?.map((s: any) => toTraditional(s.name)) || []),
            ...(monthlyPalace.minorStars?.map((s: any) => toTraditional(s.name)) || []),
          ];
        }
      }

      if (horoscopeAny.daily?.palaces) {
        const dailyPalace = horoscopeAny.daily.palaces.find((p: any) => p.name === palace.name);
        if (dailyPalace) {
          palaceHoroscope.dayStars = [
            ...(dailyPalace.majorStars?.map((s: any) => toTraditional(s.name)) || []),
            ...(dailyPalace.minorStars?.map((s: any) => toTraditional(s.name)) || []),
          ];
        }
      }

      return palaceHoroscope;
    });

    return result;
  } catch (error) {
    console.error('Error calculating horoscope:', error);
    return { scope };
  }
}

/**
 * 從運限物件提取星曜
 */
function extractStars(horoscopeLevel: any): { name: string; type: string }[] {
  const stars: { name: string; type: string }[] = [];

  if (horoscopeLevel.palaces) {
    for (const palace of horoscopeLevel.palaces) {
      if (palace.majorStars) {
        for (const star of palace.majorStars) {
          stars.push({ name: toTraditional(star.name), type: 'major' });
        }
      }
      if (palace.minorStars) {
        for (const star of palace.minorStars) {
          stars.push({ name: toTraditional(star.name), type: 'minor' });
        }
      }
    }
  }

  return stars;
}

/**
 * 取得流年運勢
 */
export async function getYearTransit(astrolabe: Astrolabe, year: number): Promise<HoroscopeData> {
  return getHoroscope(astrolabe, 'year', { year, month: 1, day: 1 });
}

/**
 * 取得流月運勢
 */
export async function getMonthTransit(astrolabe: Astrolabe, year: number, month: number): Promise<HoroscopeData> {
  return getHoroscope(astrolabe, 'month', { year, month, day: 1 });
}

/**
 * 取得流日運勢
 */
export async function getDayTransit(astrolabe: Astrolabe, year: number, month: number, day: number): Promise<HoroscopeData> {
  return getHoroscope(astrolabe, 'day', { year, month, day });
}

// ============ Palace Tags 系統 ============

/**
 * 宮位標籤（用於 LLM 解讀）
 */
export interface PalaceTag {
  palace: PalaceName;
  tags: string[];
}

/**
 * 星曜分類常數
 */
const STAR_CATEGORIES = {
  // 紫微星系（帝王星系）
  ziwei: ['紫微', '天機', '太陽', '武曲', '天同', '廉貞'],
  // 天府星系（財官星系）
  tianfu: ['天府', '太陰', '貪狼', '巨門', '天相', '天梁', '七殺', '破軍'],
  // 六吉星
  lucky: ['左輔', '右弼', '文昌', '文曲', '天魁', '天鉞'],
  // 六煞星
  unlucky: ['擎羊', '陀羅', '火星', '鈴星', '地空', '地劫'],
  // 祿馬星
  wealth: ['祿存', '天馬'],
  // 桃花星
  romance: ['紅鸞', '天喜', '咸池', '天姚'],
  // 孤寡星
  lonely: ['孤辰', '寡宿'],
} as const;

/**
 * 四化類型對應
 */
const SIHUA_PATTERNS: Record<string, string> = {
  '化祿': '祿',
  '化權': '權',
  '化科': '科',
  '化忌': '忌',
};

/**
 * 判斷星曜是否帶有四化
 */
function getSihua(starName: string): string | null {
  for (const [pattern, short] of Object.entries(SIHUA_PATTERNS)) {
    if (starName.includes(pattern)) {
      return short;
    }
  }
  return null;
}

/**
 * 取得星曜的基礎名稱（去除四化後綴）
 */
function getBaseStarName(starName: string): string {
  return starName.replace(/化[祿權科忌]/g, '').trim();
}

/**
 * 判斷是否為煞星
 */
function isUnluckyStar(starName: string): boolean {
  const baseName = getBaseStarName(starName);
  return STAR_CATEGORIES.unlucky.some(s => baseName.includes(s));
}

/**
 * 判斷是否為吉星
 */
function isLuckyStar(starName: string): boolean {
  const baseName = getBaseStarName(starName);
  return STAR_CATEGORIES.lucky.some(s => baseName.includes(s)) ||
         STAR_CATEGORIES.wealth.some(s => baseName.includes(s));
}

/**
 * 建立宮位標籤
 * @param astrolabe 命盤資料
 * @param fortune 運勢資料（可選，用於運限星曜）
 */
export function buildPalaceTags(
  astrolabe: Astrolabe,
  fortune?: FortuneData | null
): PalaceTag[] {
  const palaceTags: PalaceTag[] = [];

  for (const palace of astrolabe.palaces) {
    const tags: string[] = [];
    const palaceName = palace.name as PalaceName;

    // 取得所有星曜
    const allStars = [
      ...palace.mainStars.map(s => s.name),
      ...palace.minorStars.map(s => s.name),
    ];

    const mainStarNames = palace.mainStars.map(s => s.name);
    const minorStarNames = palace.minorStars.map(s => s.name);

    // === 規則 1: 主星組合格局 ===
    const mainStarPatterns = analyzeMainStarPatterns(mainStarNames, palaceName);
    tags.push(...mainStarPatterns);

    // === 規則 2: 四化影響 ===
    const sihuaTags = analyzeSihuaEffects(allStars, palaceName);
    tags.push(...sihuaTags);

    // === 規則 3: 煞星影響 ===
    const unluckyTags = analyzeUnluckyStars(allStars, palaceName);
    tags.push(...unluckyTags);

    // === 規則 4: 吉星加持 ===
    const luckyTags = analyzeLuckyStars(minorStarNames, palaceName);
    tags.push(...luckyTags);

    // === 規則 5: 特殊格局 ===
    const specialPatterns = analyzeSpecialPatterns(allStars, palaceName);
    tags.push(...specialPatterns);

    // === 規則 6: 宮位強弱評估 ===
    const strengthTag = evaluatePalaceStrength(allStars, palaceName);
    if (strengthTag) tags.push(strengthTag);

    palaceTags.push({
      palace: palaceName,
      tags: [...new Set(tags)], // 去重
    });
  }

  return palaceTags;
}

/**
 * 分析主星組合格局
 */
function analyzeMainStarPatterns(mainStars: string[], palace: PalaceName): string[] {
  const tags: string[] = [];
  const baseNames = mainStars.map(getBaseStarName);

  // 紫微格局
  if (baseNames.includes('紫微')) {
    if (baseNames.includes('天府')) {
      tags.push('紫府同宮格');
    } else if (baseNames.includes('天相')) {
      tags.push('紫相朝垣');
    } else if (baseNames.includes('貪狼')) {
      tags.push('紫貪格局');
    } else if (baseNames.includes('七殺')) {
      tags.push('紫殺格局');
    } else if (baseNames.includes('破軍')) {
      tags.push('紫破格局');
    } else {
      tags.push('紫微坐' + palace);
    }
  }

  // 日月格局
  if (baseNames.includes('太陽') && baseNames.includes('太陰')) {
    tags.push('日月同宮');
  } else if (baseNames.includes('太陽')) {
    tags.push('太陽坐' + palace);
  } else if (baseNames.includes('太陰')) {
    tags.push('太陰坐' + palace);
  }

  // 財官格局（針對財帛、官祿宮）
  if (palace === '財帛') {
    if (baseNames.includes('武曲')) {
      tags.push('武曲坐財');
    }
    if (baseNames.includes('天府')) {
      tags.push('天府守財');
    }
    if (baseNames.includes('太陰')) {
      tags.push('太陰守財');
    }
  }

  if (palace === '官祿') {
    if (baseNames.includes('紫微') || baseNames.includes('天府')) {
      tags.push('官祿主星得力');
    }
    if (baseNames.includes('七殺')) {
      tags.push('七殺守官祿');
    }
    if (baseNames.includes('武曲')) {
      tags.push('武曲守官祿');
    }
  }

  // 命宮特殊格局
  if (palace === '命宮') {
    if (baseNames.includes('廉貞') && baseNames.includes('貪狼')) {
      tags.push('廉貪同宮');
    }
    if (baseNames.includes('天機') && baseNames.includes('太陰')) {
      tags.push('機月同宮');
    }
    if (baseNames.includes('天同') && baseNames.includes('天梁')) {
      tags.push('同梁格局');
    }
  }

  // 無主星情況
  if (mainStars.length === 0) {
    tags.push('借星安命');
  }

  return tags;
}

/**
 * 分析四化效應
 */
function analyzeSihuaEffects(allStars: string[], palace: PalaceName): string[] {
  const tags: string[] = [];

  const sihuaStars = allStars.filter(s => getSihua(s));

  for (const star of sihuaStars) {
    const sihua = getSihua(star);
    const baseName = getBaseStarName(star);

    if (sihua === '祿') {
      if (palace === '財帛') {
        tags.push('財帛化祿');
      } else if (palace === '命宮') {
        tags.push('命宮化祿');
      } else if (palace === '官祿') {
        tags.push('官祿化祿');
      } else {
        tags.push(`${baseName}化祿在${palace}`);
      }
    }

    if (sihua === '權') {
      if (palace === '官祿') {
        tags.push('官祿化權');
      } else if (palace === '命宮') {
        tags.push('命宮化權');
      } else {
        tags.push(`${baseName}化權`);
      }
    }

    if (sihua === '科') {
      tags.push(`${baseName}化科`);
    }

    if (sihua === '忌') {
      tags.push(`${baseName}化忌在${palace}`);
      if (palace === '財帛') {
        tags.push('財帛見化忌');
      }
      if (palace === '疾厄') {
        tags.push('疾厄見化忌');
      }
      if (palace === '夫妻') {
        tags.push('夫妻見化忌');
      }
    }
  }

  return tags;
}

/**
 * 分析煞星影響
 */
function analyzeUnluckyStars(allStars: string[], palace: PalaceName): string[] {
  const tags: string[] = [];

  const unluckyInPalace = allStars.filter(isUnluckyStar);

  if (unluckyInPalace.length >= 2) {
    tags.push('煞星會聚');
  }

  // 火鈴同宮
  const hasHuo = allStars.some(s => getBaseStarName(s).includes('火星'));
  const hasLing = allStars.some(s => getBaseStarName(s).includes('鈴星'));
  if (hasHuo && hasLing) {
    tags.push('火鈴同宮');
  } else if (hasHuo) {
    tags.push('火星入' + palace);
  } else if (hasLing) {
    tags.push('鈴星入' + palace);
  }

  // 羊陀
  const hasYang = allStars.some(s => getBaseStarName(s).includes('擎羊'));
  const hasTuo = allStars.some(s => getBaseStarName(s).includes('陀羅'));
  if (hasYang && hasTuo) {
    tags.push('羊陀夾' + palace);
  } else if (hasYang) {
    tags.push('擎羊入' + palace);
  } else if (hasTuo) {
    tags.push('陀羅入' + palace);
  }

  // 地空地劫
  const hasKong = allStars.some(s => getBaseStarName(s).includes('地空'));
  const hasJie = allStars.some(s => getBaseStarName(s).includes('地劫'));
  if (hasKong || hasJie) {
    if (palace === '財帛') {
      tags.push('財帛見空劫');
    } else if (palace === '命宮') {
      tags.push('命帶空劫');
    } else {
      tags.push('空劫入' + palace);
    }
  }

  if (unluckyInPalace.length > 0 && palace === '命宮') {
    tags.push('命宮帶煞');
  }

  return tags;
}

/**
 * 分析吉星加持
 */
function analyzeLuckyStars(minorStars: string[], palace: PalaceName): string[] {
  const tags: string[] = [];

  // 左右輔弼
  const hasZuo = minorStars.some(s => getBaseStarName(s).includes('左輔'));
  const hasYou = minorStars.some(s => getBaseStarName(s).includes('右弼'));
  if (hasZuo && hasYou) {
    tags.push('左右夾輔');
  } else if (hasZuo || hasYou) {
    tags.push('單見輔弼');
  }

  // 昌曲
  const hasChang = minorStars.some(s => getBaseStarName(s).includes('文昌'));
  const hasQu = minorStars.some(s => getBaseStarName(s).includes('文曲'));
  if (hasChang && hasQu) {
    tags.push('昌曲同宮');
  } else if (hasChang || hasQu) {
    tags.push('文星入' + palace);
  }

  // 魁鉞
  const hasKui = minorStars.some(s => getBaseStarName(s).includes('天魁'));
  const hasYue = minorStars.some(s => getBaseStarName(s).includes('天鉞'));
  if (hasKui || hasYue) {
    tags.push('魁鉞貴人');
  }

  // 祿馬
  const hasLu = minorStars.some(s => getBaseStarName(s).includes('祿存'));
  const hasMa = minorStars.some(s => getBaseStarName(s).includes('天馬'));
  if (hasLu && hasMa) {
    tags.push('祿馬交馳');
  } else if (hasLu) {
    tags.push('祿存守' + palace);
  } else if (hasMa) {
    tags.push('天馬入' + palace);
  }

  // 統計吉星數量
  const luckyCount = minorStars.filter(isLuckyStar).length;
  if (luckyCount >= 3) {
    tags.push('吉星雲集');
  }

  return tags;
}

/**
 * 分析特殊格局
 */
function analyzeSpecialPatterns(allStars: string[], palace: PalaceName): string[] {
  const tags: string[] = [];
  const baseNames = allStars.map(getBaseStarName);

  // 桃花格局
  const romanceStars = STAR_CATEGORIES.romance.filter(s =>
    baseNames.some(name => name.includes(s))
  );
  if (romanceStars.length >= 2) {
    tags.push('桃花旺盛');
  } else if (romanceStars.length === 1) {
    if (palace === '命宮' || palace === '夫妻') {
      tags.push('帶桃花');
    }
  }

  // 孤寡格局
  const hasGuChen = baseNames.some(s => s.includes('孤辰'));
  const hasGuaSu = baseNames.some(s => s.includes('寡宿'));
  if (hasGuChen && hasGuaSu) {
    tags.push('孤寡同宮');
  } else if (hasGuChen || hasGuaSu) {
    if (palace === '命宮' || palace === '夫妻') {
      tags.push('帶孤寡');
    }
  }

  // 華蓋（藝術、宗教傾向）
  const hasHuaGai = baseNames.some(s => s.includes('華蓋'));
  if (hasHuaGai && palace === '命宮') {
    tags.push('命帶華蓋');
  }

  return tags;
}

/**
 * 評估宮位強弱
 */
function evaluatePalaceStrength(allStars: string[], palace: PalaceName): string | null {
  let score = 0;

  for (const star of allStars) {
    const sihua = getSihua(star);

    // 四化加減分
    if (sihua === '祿') score += 2;
    if (sihua === '權') score += 1.5;
    if (sihua === '科') score += 1;
    if (sihua === '忌') score -= 2;

    // 吉凶星加減分
    if (isLuckyStar(star)) score += 1;
    if (isUnluckyStar(star)) score -= 1;
  }

  // 根據分數返回評語
  if (score >= 4) return `${palace}極強`;
  if (score >= 2) return `${palace}強`;
  if (score <= -3) return `${palace}弱`;
  if (score <= -1) return `${palace}略波動`;

  return null;
}

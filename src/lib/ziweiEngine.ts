import { astro } from 'iztro';
import { BirthData, Astrolabe, Palace, Star } from './types';

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
 * 運限資料結構
 */
export interface HoroscopeData {
  scope: 'decade' | 'year' | 'month' | 'day';
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

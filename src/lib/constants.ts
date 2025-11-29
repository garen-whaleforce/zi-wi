/**
 * 常數定義
 */

export const HEAVENLY_STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];

export const EARTHLY_BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

// 時辰對應的時間範圍
export const TIME_RANGES = [
  '23:00-01:00', // 子
  '01:00-03:00', // 丑
  '03:00-05:00', // 寅
  '05:00-07:00', // 卯
  '07:00-09:00', // 辰
  '09:00-11:00', // 巳
  '11:00-13:00', // 午
  '13:00-15:00', // 未
  '15:00-17:00', // 申
  '17:00-19:00', // 酉
  '19:00-21:00', // 戌
  '21:00-23:00', // 亥
];

export const PALACES = ['命', '兄弟', '夫妻', '子女', '財帛', '疾厄', '遷移', '交友', '官祿', '田宅', '福德', '父母'];

export const TIMEZONES = [
  { label: '台灣/香港/上海', value: 'Asia/Taipei' },
  { label: '北京', value: 'Asia/Shanghai' },
  { label: '東京', value: 'Asia/Tokyo' },
  { label: '新加坡', value: 'Asia/Singapore' },
  { label: 'UTC', value: 'UTC' },
];

export const LEGAL_DISCLAIMER = `本網站內容僅供娛樂與自我反思參考，不構成醫療、法律、投資或其他專業意見。\n若有健康、財務或法律問題，請尋求專業人士協助。`;

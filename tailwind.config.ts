import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // 紫微主題色系
        primary: {
          50: '#fdf4f7',
          100: '#fce8f0',
          200: '#fad5e3',
          300: '#f5b3cd',
          400: '#ed83ab',
          500: '#e05a8c',
          600: '#c73d6c',
          700: '#a82f55',
          800: '#8b2947',
          900: '#722c46', // 主色
          950: '#4a1329',
        },
        // 金色輔助色
        gold: {
          50: '#fdfbf4',
          100: '#faf5e4',
          200: '#f4e9c5',
          300: '#ecd89e',
          400: '#e2c06d',
          500: '#d4a574', // 輔助色
          600: '#c48a4a',
          700: '#a4703e',
          800: '#865a38',
          900: '#6e4a31',
        },
        // 深色背景
        dark: {
          50: '#f6f6f7',
          100: '#e3e3e5',
          200: '#c6c6ca',
          300: '#a2a2a8',
          400: '#7e7e86',
          500: '#63636b',
          600: '#4e4e55',
          700: '#414146',
          800: '#38383c',
          900: '#1a1a1a',
          950: '#0d0d0d',
        },
        // 命盤宮位色
        palace: {
          life: '#722c46',      // 命宮 - 紫紅
          wealth: '#d4a574',    // 財帛 - 金
          career: '#2d5a7b',    // 官祿 - 藍
          spouse: '#c45c8a',    // 夫妻 - 粉紅
          children: '#7cb342',  // 子女 - 綠
          health: '#00897b',    // 疾厄 - 青
          travel: '#5c6bc0',    // 遷移 - 靛
          friends: '#ff7043',   // 交友 - 橙
          property: '#8d6e63',  // 田宅 - 棕
          fortune: '#9c27b0',   // 福德 - 紫
          parents: '#546e7a',   // 父母 - 灰藍
          siblings: '#26a69a',  // 兄弟 - 青綠
        },
      },
      fontFamily: {
        serif: ['Noto Serif TC', 'serif'],
        sans: ['Noto Sans TC', 'sans-serif'],
      },
      backgroundImage: {
        // 漸層背景
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-primary': 'linear-gradient(135deg, #722c46 0%, #4a1329 100%)',
        'gradient-gold': 'linear-gradient(135deg, #d4a574 0%, #a4703e 100%)',
        'gradient-dark': 'linear-gradient(180deg, #1a1a1a 0%, #0d0d0d 100%)',
        'gradient-glass': 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
        // 星空背景
        'stars': 'radial-gradient(2px 2px at 20px 30px, #eee, transparent), radial-gradient(2px 2px at 40px 70px, rgba(255,255,255,0.8), transparent), radial-gradient(1px 1px at 90px 40px, #fff, transparent), radial-gradient(2px 2px at 160px 120px, rgba(255,255,255,0.9), transparent)',
      },
      boxShadow: {
        'glow': '0 0 20px rgba(114, 44, 70, 0.3)',
        'glow-gold': '0 0 20px rgba(212, 165, 116, 0.3)',
        'glow-lg': '0 0 40px rgba(114, 44, 70, 0.4)',
        'inner-glow': 'inset 0 0 20px rgba(114, 44, 70, 0.2)',
        'glass': '0 8px 32px rgba(0, 0, 0, 0.1)',
        'glass-lg': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'fade-in-up': 'fadeInUp 0.4s ease-out',
        'fade-in-down': 'fadeInDown 0.4s ease-out',
        'slide-in-right': 'slideInRight 0.4s ease-out',
        'slide-in-left': 'slideInLeft 0.4s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 20s linear infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
        'star-twinkle': 'starTwinkle 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInDown: {
          '0%': { opacity: '0', transform: 'translateY(-20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(30px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-30px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(114, 44, 70, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(114, 44, 70, 0.6)' },
        },
        starTwinkle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};
export default config;

import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/presentation/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // CSS variable-based colors (from globals.css)
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        // Brand colors
        primary: {
          50: '#fef7ee',
          100: '#fdecd7',
          200: '#fad5ae',
          300: '#f6b77a',
          400: '#f19044',
          500: '#ed7420',
          600: '#de5a16',
          700: '#b84314',
          800: '#933618',
          900: '#772f17',
          950: '#40150a',
        },
        // Moroccan-inspired accent
        accent: {
          50: '#f0fdf6',
          100: '#dcfcea',
          200: '#bbf7d6',
          300: '#86efb8',
          400: '#4ade91',
          500: '#22c56e',
          600: '#16a358',
          700: '#158048',
          800: '#16653c',
          900: '#145333',
          950: '#052e1a',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        arabic: ['var(--font-noto-arabic)', 'var(--font-inter)', 'system-ui', 'sans-serif'],
        'arabic-display': ['var(--font-cairo)', 'var(--font-noto-arabic)', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        'pulse-fade': {
          '0%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.8', transform: 'scale(1.1)' },
          '100%': { opacity: '0', transform: 'scale(1.2)' },
        },
        'shimmer-slide': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        'thumb-nudge': {
          '0%, 100%': { transform: 'translateX(0)', boxShadow: '0 0 12px 2px rgba(16,185,129,0.2)' },
          '50%': { transform: 'translateX(3px)', boxShadow: '0 0 18px 4px rgba(16,185,129,0.35)' },
        },
        'confirm-burst': {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '30%': { transform: 'scale(1.08)' },
          '60%': { transform: 'scale(0.98)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'chevron-flow': {
          '0%': { opacity: '0' },
          '15%': { opacity: '0.6' },
          '50%': { opacity: '0.6' },
          '85%': { opacity: '0' },
          '100%': { opacity: '0' },
        },
        'blocked-shake': {
          '0%, 100%': { transform: 'translateX(0) scaleY(1)' },
          '15%': { transform: 'translateX(-2px) scaleY(0.94)' },
          '30%': { transform: 'translateX(2px) scaleY(0.92)' },
          '45%': { transform: 'translateX(-1px) scaleY(0.94)' },
          '60%': { transform: 'translateX(1px) scaleY(0.96)' },
          '80%': { transform: 'translateX(0) scaleY(1)' },
        },
      },
      animation: {
        'pulse-fade': 'pulse-fade 0.8s ease-out forwards',
        'shimmer-slide': 'shimmer-slide 2.5s ease-in-out infinite',
        'thumb-nudge': 'thumb-nudge 2s ease-in-out infinite',
        'confirm-burst': 'confirm-burst 0.4s ease-out forwards',
        'chevron-flow': 'chevron-flow 1.4s ease-in-out infinite',
        'blocked-shake': 'blocked-shake 0.35s ease-out forwards',
      },
      // RTL-aware spacing utilities
      spacing: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
      },
    },
  },
  plugins: [],
  // Enable RTL support
  corePlugins: {
    // These generate both LTR and RTL variants
    preflight: true,
  },
};

export default config;

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

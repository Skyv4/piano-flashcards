import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/utils/noteColors.ts',
  ],
  theme: {
    extend: {
      colors: {
        red: {
          '500': '#ef4444',
          '700': '#b91c1c',
        },
        orange: {
          '500': '#f97316',
          '700': '#c2410c',
        },
        yellow: {
          '500': '#eab308',
        },
        green: {
          '500': '#22c55e',
          '700': '#15803d',
        },
        blue: {
          '500': '#3b82f6',
          '700': '#1d4ed8',
        },
        indigo: {
          '500': '#6366f1',
          '700': '#4338ca',
        },
        purple: {
          '500': '#a855f7',
        },
      },
    },
  },
  plugins: [],
};
export default config;
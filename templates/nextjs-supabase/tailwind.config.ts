import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Add your custom colors here
      },
      minHeight: {
        // Touch target sizes (RANA Mobile Framework)
        '44': '44px', // Minimum WCAG touch target
        '48': '48px', // Recommended touch target
      },
      minWidth: {
        '44': '44px',
        '48': '48px',
      },
    },
  },
  plugins: [],
};

export default config;

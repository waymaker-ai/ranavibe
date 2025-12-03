/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        rana: {
          blue: '#3B82F6',
          purple: '#8B5CF6',
          green: '#10B981',
        },
      },
    },
  },
  plugins: [],
}

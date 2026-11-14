/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        clinical: {
          bg: '#F5F7FA',
          surface: '#FFFFFF',
          blue: '#2563EB',
          blueHover: '#1D4ED8',
          teal: '#0F9D92',
          tealHover: '#0D8A80',
          text: '#172033',
          secondary: '#667085',
          border: '#E4E7EC',
          borderLight: '#F2F4F7',
          success: '#15966A',
          warning: '#D99121',
          danger: '#D64545',
        },
        neuro: {
          bg: '#0B0F19',
          panel: '#111827',
          panelLight: '#1F2937',
          cyan: '#06B6D4',
          cyanHover: '#0891B2',
          purple: '#8B5CF6',
          purpleHover: '#7C3AED',
          green: '#10B981',
          red: '#EF4444',
          amber: '#F59E0B',
          textMuted: '#9CA3AF',
          textHigh: '#F9FAFB',
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
};

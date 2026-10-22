/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bgDark: '#0c071e',
        cardBg: 'rgba(23, 14, 46, 0.65)',
        neonPurple: '#a855f7',
        neonCyan: '#06b6d4',
        neonPink: '#ec4899',
      },
      boxShadow: {
        neonCyan: '0 0 15px rgba(6, 182, 212, 0.5), inset 0 0 10px rgba(6, 182, 212, 0.2)',
        neonPurple: '0 0 15px rgba(168, 85, 247, 0.5), inset 0 0 10px rgba(168, 85, 247, 0.2)',
        glow: '0 0 25px rgba(147, 51, 234, 0.45)',
      }
    },
  },
  plugins: [],
};
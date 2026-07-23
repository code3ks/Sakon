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
        // Claude-inspired color palette
        claude: {
          bg: {
            light: '#FFFFFF',
            dark: '#1E1E1E',
          },
          surface: {
            light: '#F7F7F7',
            dark: '#2D2D2D',
          },
          text: {
            primary: {
              light: '#1A1A1A',
              dark: '#E8E8E8',
            },
            secondary: {
              light: '#666666',
              dark: '#A0A0A0',
            },
          },
          accent: {
            primary: '#D97706',
            hover: '#B45309',
          },
          border: {
            light: '#E5E5E5',
            dark: '#404040',
          },
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

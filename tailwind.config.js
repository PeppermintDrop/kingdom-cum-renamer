/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/renderer/index.html",
    "./src/renderer/src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Quicksand', 'sans-serif'],
        display: ['Fredoka', 'sans-serif'],
        script: ['Dancing Script', 'cursive'],
        mono: ['JetBrains Mono', 'monospace']
      },
      colors: {
        'pop-pink': '#ff0099',
        'pop-cyan': '#00f2ea',
        'pop-purple': '#bf00ff',
        'dark-base': '#050505',
      },
      boxShadow: {
        'neon-pink': '0 0 20px rgba(255, 0, 153, 0.4)',
        'neon-cyan': '0 0 20px rgba(0, 242, 234, 0.4)',
        'glass-dark': '0 8px 32px 0 rgba(0, 0, 0, 0.5)',
      }
    },
  },
  plugins: [require('@tailwindcss/typography')],
}
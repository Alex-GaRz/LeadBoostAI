/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // Forzamos JetBrains Mono como la fuente por defecto de todo el sistema
        sans: ['"JetBrains Mono"', 'monospace'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        // Paleta Táctica Enterprise
        slate: {
          850: '#151e2e',
          900: '#0f172a',
          950: '#020617', // Fondo ultra oscuro
        },
        neon: {
          blue: '#00f0ff',
          green: '#0aff00',
          red: '#ff003c',
          amber: '#ffbf00',
        }
      },
      animation: {
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glitch': 'glitch 1s linear infinite',
      },
    },
  },
  plugins: [],
}
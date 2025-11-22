/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    // Path obligatorio para Tremor
    './node_modules/@tremor/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Colores Tremor mapeados a modo oscuro absoluto
        tremor: {
          brand: {
            faint: '#0B1221', 
            muted: '#172033',
            subtle: '#1e293b',
            DEFAULT: '#3b82f6',  // Azul Eléctrico Base
            emphasis: '#1d4ed8',
            inverted: '#ffffff',
          },
          background: {
            muted: '#09090b',    // Fondo Secundario
            subtle: '#18181b',   // Fondo Tarjetas
            DEFAULT: '#050505',  // Fondo Principal (Casi negro)
            emphasis: '#27272a',
          },
          border: {
            DEFAULT: '#27272a',  // Bordes sutiles
          },
          ring: {
            DEFAULT: '#27272a',
          },
          content: {
            subtle: '#71717a',   // Texto terciario
            DEFAULT: '#a1a1aa',  // Texto secundario
            emphasis: '#e4e4e7', // Texto primario
            strong: '#ffffff',   // Títulos
            inverted: '#000000',
          },
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'Noto Sans',
          'sans-serif',
        ],
      },
      fontSize: {
        'heading-1': ['2rem', { lineHeight: '2.5rem', fontWeight: '700' }], // 32px
        'heading-2': ['1.5rem', { lineHeight: '2rem', fontWeight: '700' }], // 24px
        'heading-3': ['1.25rem', { lineHeight: '1.75rem', fontWeight: '600' }], // 20px
        'body-lg': ['1.125rem', { lineHeight: '1.75rem', fontWeight: '400' }], // 18px
        body: ['1rem', { lineHeight: '1.5rem', fontWeight: '400' }], // 16px
        'body-sm': ['0.875rem', { lineHeight: '1.25rem', fontWeight: '400' }], // 14px
        label: ['0.875rem', { lineHeight: '1.25rem', fontWeight: '500' }], // 14px
      },
    },
  },
  plugins: [],
};

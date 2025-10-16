/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#2563eb', // Azul acción principal
        secondary: '#e5e7eb', // Gris claro
        accent: '#1a237e', // Azul oscuro/acento
        success: '#22c55e', // Verde éxito
        warning: '#facc15', // Amarillo warning
        error: '#ef4444', // Rojo error
        info: '#38bdf8', // Azul info
        background: '#f7f8fa', // Fondo general
        card: '#fff', // Fondo tarjetas
        border: '#e5e7eb', // Bordes
        text: '#1f2937', // Texto principal
        'text-muted': '#6b7280', // Texto secundario
        'text-label': '#4b5563', // Etiquetas
        'badge-active': '#22c55e', // Verde badge activo
        'badge-paused': '#facc15', // Amarillo badge pausa
        'badge-completed': '#2563eb', // Azul badge completada
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

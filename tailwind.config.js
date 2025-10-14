/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'brand-primary': '#16a34a',    // bg-green-600
        'brand-action': '#2563eb',     // bg-blue-600
        'brand-secondary': '#e5e7eb',  // bg-gray-200
        'brand-bg': '#f3f4f6',         // bg-gray-100
        'brand-title': '#1f2937',      // text-gray-800
        'brand-base': '#374151',       // text-gray-700
        'brand-label': '#4b5563',      // text-gray-600
        'brand-muted': '#6b7280',      // text-gray-500
      },
    },
  },
  plugins: [],
};

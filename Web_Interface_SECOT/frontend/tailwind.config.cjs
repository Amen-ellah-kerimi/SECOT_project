/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      borderRadius: {
        'lg': '0.5rem',
      },
      colors: {
        gray: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
        },
        blue: {
          500: '#3b82f6',
          700: '#1d4ed8',
        },
        red: {
          500: '#ef4444',
          700: '#b91c1c',
        },
        green: {
          500: '#22c55e',
          700: '#15803d',
        },
        yellow: {
          500: '#eab308',
          700: '#a16207',
        },
      },
    },
  },
  plugins: [],
  safelist: [
    'rounded-lg',
    'shadow-md',
    'border',
    'border-l-4',
    'bg-gray-800',
    'bg-gray-900',
    'bg-blue-900',
    'bg-green-900',
    'bg-red-900',
    'bg-yellow-900',
    'border-gray-700',
    'border-blue-500',
    'border-green-500',
    'border-red-500',
    'border-yellow-700',
    'text-blue-200',
    'text-green-200',
    'text-red-200',
    'text-yellow-300',
  ],
}

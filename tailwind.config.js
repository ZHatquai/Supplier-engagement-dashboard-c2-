/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#000000',
        graphite: '#4A453B',
        slate: '#8C8674',
        stone: '#B6B09F',
        linen: '#EAE4D5',
        chalk: '#F2F2F2',
        lime: '#C8F135',
        danger: '#C0392B',
        success: '#2E7D32',
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        body: ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        none: '0',
      },
      maxWidth: {
        page: '1120px',
      },
    },
  },
  corePlugins: {
    // The Corporate brand: square corners only, no drop shadows anywhere.
    borderRadius: false,
    boxShadow: false,
    dropShadow: false,
  },
  plugins: [],
}

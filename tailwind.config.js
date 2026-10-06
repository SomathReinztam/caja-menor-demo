/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Tokens extraídos del tema Flutter de la app Visitadores.
        primary: '#68548E',
        accent: '#F6FE83',
        btn: '#635B70',
        bg: '#FEF7FF',
        surface: '#F2ECF4',
        surfaceLow: '#F8F1FA',
        ink: '#1D1B20',
        muted: '#49454E',
        faint: '#7A757F',
        line: '#CBC4CF',
        lineInput: '#AFA9B4',
        success: '#3B6939',
        successBg: '#BCF0B4',
        warning: '#88511D',
        warningBg: '#FFDCC2',
        danger: '#904A41',
        dangerBg: '#FFDAD5',
        info: '#36618E',
        infoBg: '#D1E4FF',
        chip: '#EBDDFF',
        chipInk: '#4F3D74',
        avatarBg: '#FFD9E1',
        avatarInk: '#643B46',
      },
      borderRadius: { card: '20px', input: '12px', pill: '9999px' },
      fontFamily: { sans: ['Roboto', 'system-ui', 'sans-serif'] },
    },
  },
  plugins: [],
}

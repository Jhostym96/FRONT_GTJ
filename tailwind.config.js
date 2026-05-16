/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class', // ✅ Activar dark mode por clase
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  safelist: [
    'estado-pendiente',
    'estado-anulada',
    'estado-concluido'
  ],
  theme: {
    extend: {
      fontFamily: {
        inter: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      backgroundColor: {
        background: "#202020",
        surface: "#2E2E2E",
        navbar: "#3A3A3A",
        card: "#2E2E2E",
        input: "#1C1C1C",
        // nuevos botones
        "button-primary": "#3B82F6", // Azul moderno
        "button-secondary": "#A5A5A5",
        "button-danger": "#FF6F61",
        "button-success": "#22C55E",
        highlight: "#2272FF",
        focus: "#00BFA5",
      },
      textColor: {
        "text-primary": "#FFFFFF",
        "text-secondary": "#B0B0B0",
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: 0, transform: 'scale(0.95)' },
          '100%': { opacity: 1, transform: 'scale(1)' },
        },
      },
      ringColor: {
        focus: '#00BFA5',
      },
    },
  },
  plugins: [],
};

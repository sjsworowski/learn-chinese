/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    50: '#fff7ed',
                    100: '#ffedd5',
                    200: '#fed7aa',
                    300: '#fdba74',
                    400: '#fb923c',
                    500: '#f97316',
                    600: '#ea580c',
                    700: '#c2410c',
                    800: '#9a3412',
                    900: '#7c2d12',
                },
            },
            fontFamily: {
                'chinese': ['Noto Sans SC', 'sans-serif'],
            },
            keyframes: {
                'pulse-grow': {
                    '0%, 100%': { transform: 'scale(1)' },
                    '50%': { transform: 'scale(1.08)' },
                },
            },
            animation: {
                'pulse-grow': 'pulse-grow 3.5s ease-in-out infinite',
            }
        },
    },
    plugins: [],
} 
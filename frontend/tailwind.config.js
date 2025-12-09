/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // Base colors that change with theme
                bg: 'var(--bg-color)',
                surface: 'var(--surface-color)',
                text: 'var(--text-color)',

                // Neon accents (Cyberpunk)
                'neon-blue': '#4d4dff',
                'neon-purple': '#bf00ff',
                'neon-cyan': '#00f2ff',
                'neon-pink': '#ff00ff',

                // Dark theme specific
                'dark-bg': '#0f172a',
                'dark-input': '#1e293b',
                'dark-card': '#1e293b',
            },
            boxShadow: {
                'neon-blue': '0 0 10px #4d4dff, 0 0 20px #4d4dff',
                'neon-purple': '0 0 10px #bf00ff, 0 0 20px #bf00ff',
            }
        },
    },
    plugins: [],
}

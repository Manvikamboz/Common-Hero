import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        violet: {
          50: '#f0f6ff',
          100: '#e0edff',
          200: '#c0dbff',
          300: '#90beff',
          400: '#5a9aff',
          500: '#2f80ed', // Secondary #2F80ED
          600: '#0b3d91', // Primary #0B3D91
          700: '#093175',
          800: '#072559',
          900: '#05193d',
          950: '#020a1c',
        },
        indigo: {
          50: '#f0f6ff',
          100: '#e0edff',
          200: '#c0dbff',
          300: '#90beff',
          400: '#5a9aff',
          500: '#2f80ed',
          600: '#0b3d91',
          700: '#093175',
          800: '#072559',
          900: '#05193d',
          950: '#020a1c',
        }
      },
    },
  },
  plugins: [],
};
export default config;

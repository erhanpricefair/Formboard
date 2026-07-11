import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f0fdf6",
          100: "#dcfce9",
          500: "#0f9d58",
          600: "#0b7d46",
          700: "#0a6238",
        },
        ink: {
          900: "#0b1220",
          700: "#243044",
          500: "#5b6b82",
        },
      },
    },
  },
  plugins: [],
};

export default config;

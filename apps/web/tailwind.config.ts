import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#0F766E",
          dark: "#0B5851",
        },
      },
    },
  },
  plugins: [],
};

export default config;

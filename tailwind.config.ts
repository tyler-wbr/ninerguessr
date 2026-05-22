import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        niner: {
          green: "#005035",
          gold: "#A49665",
          white: "#FFFFFF",
        },
      },
    },
  },
  plugins: [],
};

export default config;

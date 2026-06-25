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
        tiktok: {
          black: "#010101",
          red: "#FE2C55",
          cyan: "#25F4EE",
          dark: "#161823",
          gray: "#8A8B91",
          light: "#F1F1F2",
        }
      },
      backgroundImage: {
        "tiktok-gradient": "linear-gradient(90deg, #25F4EE 0%, #FE2C55 100%)",
      }
    },
  },
  plugins: [],
};
export default config;

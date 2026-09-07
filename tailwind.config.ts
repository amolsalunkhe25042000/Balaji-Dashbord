import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#12232B",
        paper: "#F7F8F6",
        deep: "#0B3142",
        panel: "#EEF2F0",
        muted: "#5B6B67",
        line: "#D8DDD9",
        water: "#0F8B8D",
        paint: "#D9622B",
      },
      fontFamily: {
        display: ["Space Grotesk", "Inter", "system-ui", "sans-serif"],
        sans: ["IBM Plex Sans", "Inter", "system-ui", "sans-serif"],
        mono: ["IBM Plex Mono", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;

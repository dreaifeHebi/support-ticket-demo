import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#17202a",
        muted: "#667085",
        panel: "#f7f8fa",
        line: "#d9dee7",
        accent: "#2563eb",
        success: "#13845b",
        warn: "#b54708",
        danger: "#b42318"
      }
    }
  },
  plugins: []
};

export default config;

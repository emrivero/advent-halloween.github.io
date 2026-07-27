import type { Config } from "tailwindcss";
import forms from "@tailwindcss/forms";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        halloweenLocked: "#835c08",
        halloweenUnlocked: "#ff5153",
        halloweenAccent: "#f0a500",
      },
      backgroundImage: {
        spiderweb: "url('/img/spiderweb.png')",
        pumpkin: "url('/img/pumpkin.png')",
      },
      borderRadius: {
        pumpkin: "30%",
      },
      fontFamily: {
        werebeast: ["'Were-Beast'", "sans-serif"],
      },
    },
  },
  plugins: [forms],
};
export default config;

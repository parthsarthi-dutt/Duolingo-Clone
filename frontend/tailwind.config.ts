import type { Config } from "tailwindcss";

/** Theme-aware colour backed by a CSS variable holding "R G B" (see globals.css). */
const themed = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    screens: {
      sm: "480px",
      md: "700px", // sidebar appears (icon rail)
      lg: "1060px", // right rail appears
      xl: "1160px", // sidebar shows labels
    },
    extend: {
      colors: {
        // surfaces & text (switch with the theme)
        bg: themed("bg"),
        surface: themed("surface"),
        line: themed("line"),
        ink: themed("ink"),
        "ink-soft": themed("ink-soft"),
        muted: themed("muted"),
        // interactive colours (switch with the theme)
        primary: { DEFAULT: themed("primary"), shadow: themed("primary-shadow") },
        "on-primary": themed("on-primary"),
        macaw: { DEFAULT: themed("macaw"), shadow: themed("macaw-shadow") },
        cardinal: { DEFAULT: themed("cardinal"), shadow: themed("cardinal-shadow") },
        selected: {
          bg: themed("selected-bg"),
          line: themed("selected-line"),
          ink: themed("selected-ink"),
        },
        correct: {
          bg: themed("correct-bg"),
          line: themed("correct-line"),
          ink: themed("correct-ink"),
        },
        wrong: { bg: themed("wrong-bg"), line: themed("wrong-line"), ink: themed("wrong-ink") },
        // fixed brand colours
        owl: { DEFAULT: "#58CC02", dark: "#46A302" },
        bee: { DEFAULT: "#FFC800", dark: "#E5A000" },
        fox: "#FF9600",
        gem: "#1CB0F6",
        heart: "#FF4B4B",
        beetle: "#CE82FF",
        super: { DEFAULT: "#3C4DFF", shadow: "#2B36B3" },
      },
      fontFamily: {
        sans: ["var(--font-nunito)", "ui-rounded", "system-ui", "sans-serif"],
      },
      maxWidth: {
        lesson: "1000px",
        exercise: "632px", // 600px of content + 16px gutters
      },
      keyframes: {
        "bounce-soft": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        pop: {
          "0%": { transform: "scale(0.85)", opacity: "0" },
          "60%": { transform: "scale(1.04)", opacity: "1" },
          "100%": { transform: "scale(1)" },
        },
        "slide-up": {
          "0%": { transform: "translateY(100%)" },
          "100%": { transform: "translateY(0)" },
        },
        "fade-in": { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        "rise-in": {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shake: {
          "0%, 100%": { transform: "translateX(0)" },
          "20%, 60%": { transform: "translateX(-6px)" },
          "40%, 80%": { transform: "translateX(6px)" },
        },
        "pulse-ring": {
          "0%": { transform: "scale(0.6)", opacity: "0.9" },
          "100%": { transform: "scale(1.9)", opacity: "0" },
        },
        sparkle: {
          "0%, 100%": { transform: "scale(0.6) rotate(0deg)", opacity: "0.4" },
          "50%": { transform: "scale(1.1) rotate(20deg)", opacity: "1" },
        },
        flicker: {
          "0%, 100%": { transform: "scale(1) rotate(-2deg)" },
          "50%": { transform: "scale(1.06) rotate(2deg)" },
        },
        peek: {
          "0%": { transform: "translateY(100%)" },
          "100%": { transform: "translateY(18%)" },
        },
      },
      animation: {
        "bounce-soft": "bounce-soft 1.4s ease-in-out infinite",
        pop: "pop 0.25s ease-out both",
        "slide-up": "slide-up 0.22s ease-out both",
        "fade-in": "fade-in 0.2s ease-out both",
        "rise-in": "rise-in 0.35s ease-out both",
        shake: "shake 0.35s ease-in-out",
        "pulse-ring": "pulse-ring 0.7s ease-out both",
        sparkle: "sparkle 1.6s ease-in-out infinite",
        flicker: "flicker 1.2s ease-in-out infinite",
        peek: "peek 0.45s cubic-bezier(0.2, 1.4, 0.4, 1) both",
      },
    },
  },
  plugins: [],
};

export default config;

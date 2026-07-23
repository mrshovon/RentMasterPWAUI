/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  // The toggle sets data-theme="dark" on <html>; light is the default (:root).
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI",
          "Roboto", "Helvetica Neue", "Arial", "sans-serif",
        ],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      colors: {
        // Semantic theme tokens — resolve to CSS vars in globals.css (light default / dark override).
        // The `<alpha-value>` placeholder lets Tailwind opacity modifiers work (e.g. bg-overlay/[0.04]).
        bg: "rgb(var(--bg) / <alpha-value>)",
        surface: "rgb(var(--surface) / <alpha-value>)",
        "surface-2": "rgb(var(--surface-2) / <alpha-value>)",
        overlay: "rgb(var(--overlay) / <alpha-value>)",
        line: "rgb(var(--line) / <alpha-value>)",
        scrim: "rgb(var(--scrim) / <alpha-value>)",
        heading: "rgb(var(--heading) / <alpha-value>)",
        fg: "rgb(var(--fg) / <alpha-value>)",
        muted: "rgb(var(--muted) / <alpha-value>)",
        subtle: "rgb(var(--subtle) / <alpha-value>)",
        faint: "rgb(var(--faint) / <alpha-value>)",
        primary: "rgb(var(--primary) / <alpha-value>)",
        accent: "rgb(var(--accent) / <alpha-value>)",
        success: "rgb(var(--success) / <alpha-value>)",
        warning: "rgb(var(--warning) / <alpha-value>)",
        danger: "rgb(var(--danger) / <alpha-value>)",
        "btn-ink": "rgb(var(--btn-ink) / <alpha-value>)",
        // Back-compat alias — the brand accent now points at the primary token.
        brand: {
          DEFAULT: "rgb(var(--primary) / <alpha-value>)",
          soft: "rgb(var(--accent) / <alpha-value>)",
        },
      },
      boxShadow: {
        glow: "0 0 0 1px rgb(var(--primary) / 0.15), 0 12px 40px -12px rgb(var(--primary) / 0.35)",
        card: "var(--shadow-card)",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(.96) translateY(8px)" },
          "100%": { opacity: "1", transform: "scale(1) translateY(0)" },
        },
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "toast-in": {
          "0%": { opacity: "0", transform: "translateX(16px) scale(.98)" },
          "100%": { opacity: "1", transform: "translateX(0) scale(1)" },
        },
      },
      animation: {
        "fade-in": "fade-in .2s ease-out",
        "scale-in": "scale-in .18s cubic-bezier(.16,1,.3,1)",
        "slide-up": "slide-up .3s cubic-bezier(.16,1,.3,1) both",
        "toast-in": "toast-in .25s cubic-bezier(.16,1,.3,1) both",
      },
    },
  },
  plugins: [],
};

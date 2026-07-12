/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
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
        // Semantic accents mapped to the brand.
        brand: {
          DEFAULT: "#6366f1",
          soft: "#818cf8",
        },
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(99,102,241,0.15), 0 12px 40px -12px rgba(99,102,241,0.35)",
        card: "0 1px 2px rgba(0,0,0,0.3), 0 8px 24px -12px rgba(0,0,0,0.5)",
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

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "var(--color-primary-50)",
          100: "var(--color-primary-100)",
          200: "var(--color-primary-200)",
          300: "var(--color-primary-300)",
          400: "var(--color-primary-400)",
          500: "var(--color-primary-500)",
          600: "var(--color-primary-600)",
          700: "var(--color-primary-700)",
          800: "var(--color-primary-800)",
          900: "var(--color-primary-900)",
        },
        brand: {
          brown: "var(--color-brand-brown)",
          tan: "var(--color-brand-tan)",
          cream: "var(--color-brand-cream)",
        },
        gold: {
          DEFAULT: "var(--color-accent)",
          light: "var(--color-gold-light)",
          hover: "var(--color-accent-hover)",
        },
        navbar: {
          bg: "var(--color-navbar-bg)",
          text: "var(--color-navbar-text)",
        },
        footer: {
          bg: "var(--color-footer-bg)",
          text: "var(--color-footer-text)",
          accent: "var(--color-footer-accent)",
          muted: "var(--color-footer-muted)",
          border: "var(--color-footer-border)",
        },
        btn: {
          primary: "var(--color-button-primary-bg)",
          "primary-text": "var(--color-button-primary-text)",
          "primary-hover": "var(--color-button-primary-hover)",
        },
        success: "var(--color-success)",
        error: "var(--color-error)",
        warning: "var(--color-warning)",
        info: "var(--color-info)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "'DM Sans'", "system-ui", "sans-serif"],
        serif: ["var(--font-playfair)", "'Cormorant Garamond'", "Georgia", "serif"],
        mono: ["var(--font-dm-mono)", "'Space Mono'", "monospace"],
      },
      spacing: {
        xs: "0.5rem",
        sm: "0.75rem",
        md: "1rem",
        lg: "1.5rem",
        xl: "2rem",
        "2xl": "3rem",
        "3xl": "4rem",
      },
      borderRadius: {
        sm: "2px",
        md: "4px",
        lg: "6px",
        xl: "8px",
      },
      boxShadow: {
        sm: "0 1px 2px 0 rgba(0, 0, 0, 0.03)",
        md: "0 2px 8px -2px rgba(0, 0, 0, 0.06)",
        lg: "0 8px 24px -6px rgba(0, 0, 0, 0.08)",
        xl: "0 16px 40px -8px rgba(0, 0, 0, 0.1)",
        "2xl": "0 24px 60px -12px rgba(0, 0, 0, 0.12)",
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-in-out",
        "slide-up": "slideUp 0.3s ease-out",
        "scale-in": "scaleIn 0.2s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        scaleIn: {
          "0%": { transform: "scale(0.95)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};

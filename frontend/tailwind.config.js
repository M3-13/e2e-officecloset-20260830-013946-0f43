/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#12100D",
        fg: "#F4EEE3",
        accent: "#D4AF37",
        line: "#3B342B",
        muted: "#9C9284",
      },
      fontFamily: {
        serif: [
          "Georgia",
          "'Palatino Linotype'",
          "'Book Antiqua'",
          "'Times New Roman'",
          "serif",
        ],
      },
      borderRadius: {
        sm: "4px",
        md: "8px",
        lg: "16px",
        pill: "999px",
      },
      spacing: {
        0: "4px",
        1: "8px",
        2: "12px",
        3: "16px",
        4: "24px",
        5: "32px",
        6: "48px",
      },
      transitionDuration: {
        DEFAULT: "180ms",
      },
    },
  },
  plugins: [],
};

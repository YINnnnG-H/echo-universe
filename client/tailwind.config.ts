import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        mist: "#F7F3EE",
        paper: "#FFFCF7",
        ink: "#2C2C2C",
        sage: "#B7C9B5",
        clay: "#D4A373",
        shell: "#E8DCD9",
        fog: "#E6E3DD"
      },
      boxShadow: {
        soft: "0 12px 36px rgba(77, 58, 43, 0.08)",
        lift: "0 18px 48px rgba(77, 58, 43, 0.14)"
      },
      borderRadius: {
        card: "16px",
        pill: "999px"
      },
      backgroundImage: {
        grain:
          "radial-gradient(circle at 1px 1px, rgba(44, 44, 44, 0.03) 1px, transparent 0)"
      }
    }
  },
  plugins: []
} satisfies Config;

import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"], // Enable dark mode via class
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      screens: {
        xs: "475px", // Small screen breakpoint for responsive design
      },
      colors: {
        // Light Theme: Blue and White
        primary: {
          "100": "#D0E8FF", // Light Blue (background or light accents)
          DEFAULT: "#0056B3", // Deeper Blue (main interactive color)
        },
        secondary: "#00B5D8", // Cyan (accent color for buttons, highlights)
        background: "#F9FAFB", // Very light blue/white background for light mode
        text: "#1A1A1A", // Dark Gray (text color for light theme)
        
        // Dark Theme: Black and Dark Blue
        dark: {
          background: "#141414", // Black background for dark mode
          text: "#F1F1F1", // Light gray text for dark mode (high contrast)
          primary: "#1E3A8A", // Dark Blue (primary color for dark mode)
          secondary: "#00B5D8", // Cyan (interactive elements like buttons in dark mode)
          muted: "#2A2A2A", // Dark gray for muted text or less important areas
        },

        // Additional support for other base colors
        white: "#FFFFFF", // White (for dark theme text or backgrounds)
        black: "#000000", // Black (for dark theme text or background)
      },
      fontFamily: {
        "work-sans": ["var(--font-work-sans)"], // Custom font (Work Sans)
      },
      borderRadius: {
        lg: "var(--radius)", // Custom large border radius
        md: "calc(var(--radius) - 2px)", // Medium border radius
        sm: "calc(var(--radius) - 4px)", // Small border radius
      },
      boxShadow: {
        100: "2px 2px 0px 0px rgb(0, 0, 0)", // Subtle shadow for normal mode (Black)
        200: "2px 2px 0px 2px rgb(0, 0, 0)", // Subtle shadow for normal mode (Black)
        300: "2px 2px 0px 2px rgb(0, 181, 216)", // Cyan shadow for interactive elements (Bright)
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"), // For animations and transitions
    require("@tailwindcss/typography"), // For better typography control
  ],
};

export default config;

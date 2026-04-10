// tailwind.config.js
module.exports = {
  content: ["./src/**/*.{html,ts}"],
  theme: {
    extend: {
      colors: {
        // Colores dinámicos vinculados a variables CSS
        primary: "var(--color-primary)",
        secondary: "var(--color-secondary)",
        tertiary: "var(--color-tertiary)",
        accent: "var(--color-accent)",
        text: "var(--color-text)",
        "text-secondary": "var(--color-text-secondary)",
        background: "var(--color-background)",
        "background-light": "var(--color-background-light)",
        surface: "var(--color-surface)",
        border: "var(--color-border)",
        success: "var(--color-success)",
        warning: "var(--color-warning)",
        error: "var(--color-error)",
        hover: "var(--color-hover)",
      },
    },
  },
  plugins: [],
};

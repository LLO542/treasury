import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext(undefined);

// Color presets with their HSL values for easy CSS variable injection
const COLOR_PRESETS = {
  blue: {
    name: "Blue",
    50: "199 89% 97%",
    100: "199 89% 94%",
    200: "199 89% 86%",
    300: "199 89% 74%",
    400: "199 89% 60%",
    500: "199 89% 48%",
    600: "199 89% 40%",
    700: "199 84% 33%",
    800: "199 77% 27%",
    900: "199 69% 24%",
  },
  red: {
    name: "Red",
    50: "0 86% 97%",
    100: "0 93% 94%",
    200: "0 96% 89%",
    300: "0 94% 82%",
    400: "0 91% 71%",
    500: "0 84% 60%",
    600: "0 72% 51%",
    700: "0 74% 42%",
    800: "0 70% 35%",
    900: "0 63% 31%",
  },
  green: {
    name: "Green",
    50: "138 76% 97%",
    100: "141 84% 93%",
    200: "141 79% 85%",
    300: "142 77% 73%",
    400: "142 69% 58%",
    500: "142 71% 45%",
    600: "142 76% 36%",
    700: "142 72% 29%",
    800: "143 64% 24%",
    900: "144 61% 20%",
  },
  purple: {
    name: "Purple",
    50: "270 100% 98%",
    100: "269 100% 95%",
    200: "269 100% 92%",
    300: "269 97% 85%",
    400: "270 95% 75%",
    500: "271 91% 65%",
    600: "271 81% 56%",
    700: "272 72% 47%",
    800: "273 67% 39%",
    900: "274 66% 32%",
  },
  orange: {
    name: "Orange",
    50: "33 100% 96%",
    100: "34 100% 92%",
    200: "32 98% 83%",
    300: "31 97% 72%",
    400: "27 96% 61%",
    500: "25 95% 53%",
    600: "21 90% 48%",
    700: "17 88% 40%",
    800: "15 79% 34%",
    900: "15 75% 28%",
  },
};

export { COLOR_PRESETS };

export function ThemeProvider({ children }) {
  // Initialize config from localStorage with defaults
  const [config, setConfig] = useState(() => {
    const savedTheme = localStorage.getItem("theme");
    const savedColor = localStorage.getItem("primaryColor");
    
    return {
      isDarkMode: savedTheme
        ? savedTheme === "dark"
        : window.matchMedia("(prefers-color-scheme: dark)").matches,
      primaryColor: savedColor && COLOR_PRESETS[savedColor] ? savedColor : "blue",
    };
  });

  // Apply dark mode
  useEffect(() => {
    const root = document.documentElement;
    if (config.isDarkMode) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [config.isDarkMode]);

  // Apply primary color via CSS variables
  useEffect(() => {
    const root = document.documentElement;
    const colorValues = COLOR_PRESETS[config.primaryColor];
    
    if (colorValues) {
      Object.entries(colorValues).forEach(([shade, value]) => {
        if (shade !== "name") {
          root.style.setProperty(`--color-primary-${shade}`, value);
        }
      });
      localStorage.setItem("primaryColor", config.primaryColor);
    }
  }, [config.primaryColor]);

  // IMPORTANT: Using spread operator to preserve other state values (C3 requirement)
  const toggleTheme = () => {
    setConfig((prev) => ({ ...prev, isDarkMode: !prev.isDarkMode }));
  };

  const setPrimaryColor = (color) => {
    if (COLOR_PRESETS[color]) {
      setConfig((prev) => ({ ...prev, primaryColor: color }));
    }
  };

  return (
    <ThemeContext.Provider
      value={{
        isDarkMode: config.isDarkMode,
        primaryColor: config.primaryColor,
        toggleTheme,
        setPrimaryColor,
        colorPresets: COLOR_PRESETS,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}

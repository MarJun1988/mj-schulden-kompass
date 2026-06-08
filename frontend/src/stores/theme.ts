import { defineStore } from "pinia";

export type ThemePreference = "light" | "dark" | "system";

const storageKey = "schuldkompass-theme";
const darkClassName = "app-dark";

const isThemePreference = (value: string | null): value is ThemePreference =>
  value === "light" || value === "dark" || value === "system";

const getStoredPreference = (): ThemePreference => {
  if (typeof window === "undefined") {
    return "system";
  }

  const stored = window.localStorage.getItem(storageKey);
  return isThemePreference(stored) ? stored : "system";
};

const systemPrefersDark = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;

export const useThemeStore = defineStore("theme", {
  state: () => ({
    preference: getStoredPreference(),
    systemDark: systemPrefersDark(),
  }),
  getters: {
    isDark: (state) =>
      state.preference === "dark" || (state.preference === "system" && state.systemDark),
  },
  actions: {
    setPreference(preference: ThemePreference) {
      this.preference = preference;
      window.localStorage.setItem(storageKey, preference);
      this.applyTheme();
    },
    applyTheme() {
      document.documentElement.classList.toggle(darkClassName, this.isDark);
      document.documentElement.style.colorScheme = this.isDark ? "dark" : "light";
    },
    init() {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const updateSystemTheme = (event: MediaQueryListEvent) => {
        this.systemDark = event.matches;
        this.applyTheme();
      };

      this.systemDark = mediaQuery.matches;
      mediaQuery.addEventListener("change", updateSystemTheme);
      this.applyTheme();
    },
  },
});

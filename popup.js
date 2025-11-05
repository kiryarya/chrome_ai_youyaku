const POPUP_STRINGS = {
  en: {
    title: "GPT Side Runner",
    description: "Open the settings page to manage prompt slots, hotkeys, and AI services.",
    button: "Open settings"
  },
  ja: {
    title: "GPT Side Runner",
    description: "スロット、ホットキー、AIサービスの設定を開きます。",
    button: "設定を開く"
  }
};

const DEFAULT_SETTINGS = {
  language: (() => {
    try {
      const lang = (chrome?.i18n?.getUILanguage?.() || navigator.language || "").toLowerCase();
      return lang.startsWith("ja") ? "ja" : "en";
    } catch {
      return "en";
    }
  })(),
  theme: "system"
};

const systemThemeQuery = window.matchMedia("(prefers-color-scheme: dark)");
let systemListenerAttached = false;

function sanitizeLanguage(value) {
  if (value === "ja") return "ja";
  if (value === "en") return "en";
  return DEFAULT_SETTINGS.language;
}

function sanitizeTheme(value) {
  return value === "dark" || value === "light" ? value : "system";
}

function addThemeListener(mediaQueryList, handler) {
  if (typeof mediaQueryList.addEventListener === "function") {
    mediaQueryList.addEventListener("change", handler);
  } else if (typeof mediaQueryList.addListener === "function") {
    mediaQueryList.addListener(handler);
  }
}

function removeThemeListener(mediaQueryList, handler) {
  if (typeof mediaQueryList.removeEventListener === "function") {
    mediaQueryList.removeEventListener("change", handler);
  } else if (typeof mediaQueryList.removeListener === "function") {
    mediaQueryList.removeListener(handler);
  }
}

function handleSystemThemeChange() {
  if (document.body.dataset.themeMode === "system") {
    document.body.dataset.theme = systemThemeQuery.matches ? "dark" : "light";
  }
}

function applyTheme(theme) {
  document.body.dataset.themeMode = theme;
  if (theme === "system") {
    document.body.dataset.theme = systemThemeQuery.matches ? "dark" : "light";
    if (!systemListenerAttached) {
      addThemeListener(systemThemeQuery, handleSystemThemeChange);
      systemListenerAttached = true;
    }
  } else {
    document.body.dataset.theme = theme;
    if (systemListenerAttached) {
      removeThemeListener(systemThemeQuery, handleSystemThemeChange);
      systemListenerAttached = false;
    }
  }
}

function applyStrings(strings) {
  document.title = strings.title;
  document.querySelectorAll("[data-i18n]").forEach((node) => {
    const key = node.dataset.i18n;
    if (!key || !(key in strings)) return;
    node.textContent = strings[key];
  });
}

async function init() {
  const { settings } = await chrome.storage.sync.get("settings");
  const language = sanitizeLanguage(settings?.language);
  const theme = sanitizeTheme(settings?.theme);

  const strings = POPUP_STRINGS[language] || POPUP_STRINGS.en;
  applyStrings(strings);
  applyTheme(theme);
}

document.addEventListener("DOMContentLoaded", () => {
  const button = document.getElementById("open-options");
  if (button) {
    button.addEventListener("click", () => {
      chrome.runtime.openOptionsPage();
      window.close();
    });
  }
  init();
});

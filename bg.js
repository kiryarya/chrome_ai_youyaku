// ====== Config / Defaults ======
const DEFAULT_SERVICE = "chatgpt";

const SERVICE_DEFINITIONS = {
  chatgpt: {
    label: "ChatGPT",
    supportsTemporary: true,
    buildUrl(prompt, { temporary } = {}) {
      const base = temporary ? "https://chatgpt.com/?temporary-chat=true" : "https://chatgpt.com/?";
      const separator = base.endsWith("?") ? "" : "&";
      return `${base}${separator}q=${encodeURIComponent(prompt)}`;
    }
  },
  perplexity: {
    label: "Perplexity",
    supportsTemporary: false,
    buildUrl(prompt) {
      return `https://www.perplexity.ai/search?q=${encodeURIComponent(prompt)}`;
    }
  },
  gemini: {
    label: "Gemini",
    supportsTemporary: false,
    buildUrl(prompt) {
      return `https://gemini.google.com/app?q=${encodeURIComponent(prompt)}`;
    }
  },
  grok: {
    label: "Grok",
    supportsTemporary: false,
    buildUrl(prompt) {
      return `https://grok.com/?q=${encodeURIComponent(prompt)}`;
    }
  }
};

const DEFAULT_LANGUAGE = (() => {
  try {
    const lang = (chrome?.i18n?.getUILanguage?.() || "").toLowerCase();
    return lang.startsWith("ja") ? "ja" : "en";
  } catch {
    return "en";
  }
})();

const DEFAULT_SETTINGS = {
  language: DEFAULT_LANGUAGE,
  theme: "system"
};

const FALLBACK_TITLES = {
  en: "this page",
  ja: "このページ"
};

const LANGUAGE_DEFAULT_SLOTS = {
  en: [
    {
      name: "Kid-friendly summary (JA)",
      template:
        "Summarize this page in Japanese for a grade-school student. Provide five bullet points.\n\nSelected text:\n{selection}\nURL: {url}\nTitle: {title}",
      widthRatio: 0.33,
      heightRatio: 0.95,
      position: "right",
      service: DEFAULT_SERVICE,
      temporary: true
    },
    {
      name: "Key points + conclusion (JA)",
      template:
        "Summarize the web page in Japanese in three key points followed by a short conclusion.\n\nSelected text:\n{selection}\nURL: {url}\nTitle: {title}",
      widthRatio: 0.33,
      heightRatio: 0.95,
      position: "right",
      service: DEFAULT_SERVICE,
      temporary: true
    },
    {
      name: "English summary (5 bullets)",
      template:
        "Summarize the page in English using five concise bullet points.\n\nSelected text:\n{selection}\nURL: {url}\nTitle: {title}",
      widthRatio: 0.33,
      heightRatio: 0.95,
      position: "right",
      service: DEFAULT_SERVICE,
      temporary: true
    }
  ],
  ja: [
    {
      name: "小学生向け要約",
      template:
        "このページを小学生向けにわかりやすくまとめてください。重要なポイントを5つの箇条書きで提示してください。\n\n選択中のテキスト:\n{selection}\nURL: {url}\nタイトル: {title}",
      widthRatio: 0.33,
      heightRatio: 0.95,
      position: "right",
      service: DEFAULT_SERVICE,
      temporary: true
    },
    {
      name: "要点3つ＋結論",
      template:
        "Webページの内容を重要な要点3つと簡潔な結論でまとめてください。\n\n選択中のテキスト:\n{selection}\nURL: {url}\nタイトル: {title}",
      widthRatio: 0.33,
      heightRatio: 0.95,
      position: "right",
      service: DEFAULT_SERVICE,
      temporary: true
    },
    {
      name: "英語要約（5つの箇条書き）",
      template:
        "Summarize the page in English using five concise bullet points.\n\n選択中のテキスト:\n{selection}\nURL: {url}\nTitle: {title}",
      widthRatio: 0.33,
      heightRatio: 0.95,
      position: "right",
      service: DEFAULT_SERVICE,
      temporary: true
    }
  ]
};

const SLOT_NAME_PREFIX = {
  en: "Slot ",
  ja: "スロット "
};

const PARENT_MENU_ID = "gpt_side_runner_root";


// ====== Utilities ======
const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

function cloneSlots(list) {
  return list.map((slot) => ({ ...slot }));
}

function buildPrompt(template, { url, title, selection }) {
  const safeSelection = String(selection ?? "");
  return String(template || "")
    .replaceAll("{url}", url)
    .replaceAll("{title}", title)
    .replaceAll("{selection}", safeSelection);
}

function sanitizeService(id) {
  return Object.prototype.hasOwnProperty.call(SERVICE_DEFINITIONS, id) ? id : DEFAULT_SERVICE;
}

function sanitizeLanguage(value) {
  if (value === "ja") return "ja";
  if (value === "en") return "en";
  return DEFAULT_LANGUAGE;
}

function sanitizeTheme(value) {
  return value === "dark" || value === "light" ? value : "system";
}

function sanitizeSettings(raw) {
  if (!raw || typeof raw !== "object") {
    return { ...DEFAULT_SETTINGS };
  }
  return {
    language: sanitizeLanguage(raw.language),
    theme: sanitizeTheme(raw.theme)
  };
}

async function getSettings() {
  const { settings } = await chrome.storage.sync.get("settings");
  return sanitizeSettings(settings);
}

function getDefaultsForLanguage(language) {
  const lang = sanitizeLanguage(language);
  const defaults = LANGUAGE_DEFAULT_SLOTS[lang] ?? LANGUAGE_DEFAULT_SLOTS.en;
  return cloneSlots(defaults);
}

function sanitizeSlots(slots, language = DEFAULT_SETTINGS.language) {
  const prefix = SLOT_NAME_PREFIX[sanitizeLanguage(language)] ?? SLOT_NAME_PREFIX.en;
  return slots.map((slot, index) => ({
    name: slot?.name || `${prefix}${index + 1}`,
    template: slot?.template ?? "",
    widthRatio: clamp(Number(slot?.widthRatio) || 0.33, 0.2, 0.8),
    heightRatio: clamp(Number(slot?.heightRatio) || 0.95, 0.5, 1),
    position: slot?.position === "left" ? "left" : "right",
    ...(() => {
      const serviceId = sanitizeService(slot?.service);
      const service = SERVICE_DEFINITIONS[serviceId];
      return {
        service: serviceId,
        temporary: service?.supportsTemporary ? Boolean(slot?.temporary ?? true) : false
      };
    })()
  }));
}


async function getSelectionFromTab(tabId) {
  if (typeof tabId !== "number") return "";
  try {
    const [result] = await chrome.scripting.executeScript({
      target: { tabId },
      func: () => window.getSelection?.().toString() || ""
    });
    const value = result?.result;
    return typeof value === "string" ? value : "";
  } catch {
    return "";
  }
}


// ====== Storage accessors ======
async function getSlots() {
  const { slots, settings } = await chrome.storage.sync.get(["slots", "settings"]);
  const sanitizedSettings = sanitizeSettings(settings);
  if (!Array.isArray(slots) || slots.length === 0) {
    const defaults = getDefaultsForLanguage(sanitizedSettings.language);
    await chrome.storage.sync.set({ slots: defaults, settings: sanitizedSettings });
    return defaults;
  }
  return sanitizeSlots(slots, sanitizedSettings.language);
}

async function getHotkeyMap() {
  const { hotkeyMap } = await chrome.storage.sync.get("hotkeyMap");
  return Array.isArray(hotkeyMap) && hotkeyMap.length === 3 ? hotkeyMap : [0, 1, 2];
}


// ====== Core runner ======
async function runSlot(index, selectionText = "") {
  const slots = await getSlots();
  if (!slots.length) return;
  const slot = slots[index] ?? slots[0];

  const settings = await getSettings();

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const here = tab?.url || "";
  const fallbackTitle = FALLBACK_TITLES[settings.language] ?? FALLBACK_TITLES.en;
  const title = tab?.title || fallbackTitle;

  let selection = typeof selectionText === "string" ? selectionText : "";
  if (!selection && typeof tab?.id === "number") {
    selection = await getSelectionFromTab(tab.id);
  }

  const prompt = buildPrompt(slot.template, { url: here, title, selection });
  const serviceId = sanitizeService(slot.service);
  const service = SERVICE_DEFINITIONS[serviceId] ?? SERVICE_DEFINITIONS[DEFAULT_SERVICE];
  const chatUrl = service.buildUrl(prompt, { temporary: Boolean(slot.temporary) });

  const current = await chrome.windows.getCurrent();
  const screenW = current.width ?? 1280;
  const screenH = current.height ?? 800;
  const leftBase = current.left ?? 0;
  const top = current.top ?? 0;

  const w = Math.round(screenW * slot.widthRatio);
  const h = Math.round(screenH * slot.heightRatio);
  const left = slot.position === "right" ? leftBase + (screenW - w) : leftBase;

  await chrome.windows.create({
    url: chatUrl,
    width: w,
    height: h,
    left,
    top,
    type: "popup"
  });
}


// ====== Context Menu ======
async function rebuildContextMenu() {
  try {
    await chrome.contextMenus.removeAll();
  } catch {}

  const slots = await getSlots();
  if (!slots.length) return;

  chrome.contextMenus.create({
    id: PARENT_MENU_ID,
    title: "GPT Side Runner",
    contexts: ["all"]
  });

  // add all slots to the menu
  slots.forEach((slot, index) => {
    chrome.contextMenus.create({
      id: `slot_${index}`,
      parentId: PARENT_MENU_ID,
      title: slot.name || `Slot ${index + 1}`,
      contexts: ["all"]
    });
  });
}


chrome.runtime.onInstalled.addListener(rebuildContextMenu);
chrome.runtime.onStartup.addListener(rebuildContextMenu);
chrome.storage.onChanged.addListener((changes) => {
  if (changes.slots) rebuildContextMenu();
});


chrome.contextMenus.onClicked.addListener(async (info) => {
  if (!info.menuItemId?.startsWith("slot_")) return;
  const idx = Number(info.menuItemId.split("_")[1]);
  const selected = typeof info.selectionText === "string" ? info.selectionText : "";
  await runSlot(idx, selected);
});


// ====== 3 Hotkeys -> arbitrary slots ======
chrome.commands.onCommand.addListener(async (cmd) => {
  const map = await getHotkeyMap();
  if (cmd === "run-hotkey-1") return runSlot(map[0] ?? 0);
  if (cmd === "run-hotkey-2") return runSlot(map[1] ?? 1);
  if (cmd === "run-hotkey-3") return runSlot(map[2] ?? 2);
});

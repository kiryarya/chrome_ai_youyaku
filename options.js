const clamp = (value, min, max) => Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : min;

const DEFAULT_SERVICE = "chatgpt";

const SERVICE_OPTIONS = [
  { id: "chatgpt", label: "ChatGPT", supportsTemporary: true },
  { id: "perplexity", label: "Perplexity", supportsTemporary: false },
  { id: "gemini", label: "Gemini", supportsTemporary: false },
  { id: "grok", label: "Grok", supportsTemporary: false }
];

const DETECTED_LANGUAGE = (() => {
  try {
    const lang = (chrome?.i18n?.getUILanguage?.() || navigator.language || "").toLowerCase();
    return lang.startsWith("ja") ? "ja" : "en";
  } catch {
    return (navigator.language || "").toLowerCase().startsWith("ja") ? "ja" : "en";
  }
})();

const DEFAULT_SETTINGS = {
  language: DETECTED_LANGUAGE,
  theme: "system"
};

const STRINGS = {
  en: {
    pageTitle: "GPT Side Runner Settings",
    title: "GPT Side Runner Settings",
    help: "Configure prompt slots, hotkeys, and the AI chat service used when a slot runs. Hotkeys can be assigned from vivaldi://extensions/shortcuts.",
    languageLabel: "Language",
    langEnglish: "English",
    langJapanese: "日本語",
    themeLabel: "Theme",
    themeOptionSystem: "Follow system setting",
    themeOptionLight: "Light",
    themeOptionDark: "Dark",
    hotkeyHeading: "Hotkey assignments (Alt+1 to Alt+3)",
    hotkey1Label: "Alt+1",
    hotkey2Label: "Alt+2",
    hotkey3Label: "Alt+3",
    slotNameLabel: "Name",
    slotNamePlaceholder: "Example: Quick summary",
    slotPromptLabel: "Prompt",
    promptPlaceholder: "Prompt template... (placeholders: {url}, {title}, {selection})",
    slotServiceLabel: "Service",
    slotWidthLabel: "Width (0.2-0.8)",
    slotHeightLabel: "Height (0.5-1.0)",
    slotSideLabel: "Side",
    slotSideLeft: "Left",
    slotSideRight: "Right",
    slotTemporaryLabel: "Use temporary chat",
    slotTemporaryUnsupported: "Temporary chat not available",
    slotMoveUp: "Up",
    slotMoveDown: "Down",
    slotDuplicate: "Duplicate",
    slotDelete: "Delete",
    promptSlotsHeading: "Prompt slots",
    addSlot: "Add slot",
    save: "Save",
    reset: "Reset to defaults",
    export: "Export",
    import: "Import",
    importHint: "Importing overwrites current slots and hotkeys.",
    savedNotification: "Saved.",
    resetNotification: "Reset to defaults.",
    importSuccess: "Settings imported.",
    importError: "Failed to import settings. Please check the file.",
    atLeastOneSlot: "At least one slot is required.",
    copySuffix: " (copy)",
    slotNamePrefix: "Slot "
  },
  ja: {
    pageTitle: "GPT Side Runner 設定",
    title: "GPT Side Runner 設定",
    help: "スロット、ホットキー、使用するAIサービスを設定できます。ホットキーの割り当ては vivaldi://extensions/shortcuts から行ってください。",
    languageLabel: "言語",
    langEnglish: "English",
    langJapanese: "日本語",
    themeLabel: "テーマ",
    themeOptionSystem: "システムに合わせる",
    themeOptionLight: "ライト",
    themeOptionDark: "ダーク",
    hotkeyHeading: "ホットキー割り当て（Alt+1 〜 Alt+3）",
    hotkey1Label: "Alt+1",
    hotkey2Label: "Alt+2",
    hotkey3Label: "Alt+3",
    slotNameLabel: "名称",
    slotNamePlaceholder: "例: クイック要約",
    slotPromptLabel: "プロンプト",
    promptPlaceholder: "プロンプトテンプレート...（利用可能なプレースホルダー: {url}, {title}, {selection}）",
    slotServiceLabel: "サービス",
    slotWidthLabel: "幅 (0.2-0.8)",
    slotHeightLabel: "高さ (0.5-1.0)",
    slotSideLabel: "表示位置",
    slotSideLeft: "左",
    slotSideRight: "右",
    slotTemporaryLabel: "テンポラリチャットを利用",
    slotTemporaryUnsupported: "テンポラリチャットは利用不可",
    slotMoveUp: "上へ",
    slotMoveDown: "下へ",
    slotDuplicate: "複製",
    slotDelete: "削除",
    promptSlotsHeading: "スロット一覧",
    addSlot: "スロットを追加",
    save: "保存",
    reset: "初期状態に戻す",
    export: "エクスポート",
    import: "インポート",
    importHint: "インポートすると現在のスロットとホットキーが上書きされます。",
    savedNotification: "保存しました。",
    resetNotification: "初期化しました。",
    importSuccess: "設定を読み込みました。",
    importError: "設定の読み込みに失敗しました。ファイルを確認してください。",
    atLeastOneSlot: "スロットは少なくとも1つ必要です。",
    copySuffix: "（複製）",
    slotNamePrefix: "スロット "
  }
};

const LANGUAGE_DEFAULT_SLOTS = {
  en: [
    {
      name: "Kid-friendly summary (JA)",
      template: "Summarize this page in Japanese for a grade-school student. Provide five bullet points.\n\nSelected text:\n{selection}\nURL: {url}\nTitle: {title}",
      widthRatio: 0.33,
      heightRatio: 0.95,
      position: "right",
      service: DEFAULT_SERVICE,
      temporary: true
    },
    {
      name: "Key points + conclusion (JA)",
      template: "Summarize the web page in Japanese in three key points followed by a short conclusion.\n\nSelected text:\n{selection}\nURL: {url}\nTitle: {title}",
      widthRatio: 0.33,
      heightRatio: 0.95,
      position: "right",
      service: DEFAULT_SERVICE,
      temporary: true
    },
    {
      name: "English summary (5 bullets)",
      template: "Summarize the page in English using five concise bullet points.\n\nSelected text:\n{selection}\nURL: {url}\nTitle: {title}",
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
      template: "このページを小学生向けにわかりやすくまとめてください。重要なポイントを5つの箇条書きで提示してください。\n\n選択中のテキスト:\n{selection}\nURL: {url}\nタイトル: {title}",
      widthRatio: 0.33,
      heightRatio: 0.95,
      position: "right",
      service: DEFAULT_SERVICE,
      temporary: true
    },
    {
      name: "要点3つ＋結論",
      template: "Webページの内容を重要な要点3つと簡潔な結論でまとめてください。\n\n選択中のテキスト:\n{selection}\nURL: {url}\nタイトル: {title}",
      widthRatio: 0.33,
      heightRatio: 0.95,
      position: "right",
      service: DEFAULT_SERVICE,
      temporary: true
    },
    {
      name: "英語要約（5つの箇条書き）",
      template: "Summarize the page in English using five concise bullet points.\n\n選択中のテキスト:\n{selection}\nURL: {url}\nTitle: {title}",
      widthRatio: 0.33,
      heightRatio: 0.95,
      position: "right",
      service: DEFAULT_SERVICE,
      temporary: true
    }
  ]
};

let currentSettings = { ...DEFAULT_SETTINGS };
let currentStrings = STRINGS[currentSettings.language] || STRINGS.en;
const systemThemeQuery = window.matchMedia("(prefers-color-scheme: dark)");
let systemThemeListenerAttached = false;


function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function sanitizeService(id) {
  return SERVICE_OPTIONS.some((service) => service.id === id) ? id : DEFAULT_SERVICE;
}

function serviceSupportsTemporary(id) {
  const service = SERVICE_OPTIONS.find((item) => item.id === id);
  return Boolean(service?.supportsTemporary);
}

function sanitizeLanguage(value) {
  if (value === "ja") return "ja";
  if (value === "en") return "en";
  return DETECTED_LANGUAGE;
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

function getStrings(language) {
  return STRINGS[language] || STRINGS.en;
}

function getDefaultSlots(language) {
  const lang = sanitizeLanguage(language);
  const defaults = LANGUAGE_DEFAULT_SLOTS[lang] || LANGUAGE_DEFAULT_SLOTS.en;
  return JSON.parse(JSON.stringify(defaults));
}

function sanitizeSlots(slots, language = currentSettings.language) {
  const strings = getStrings(sanitizeLanguage(language));
  return slots.map((slot, index) => ({
    name: slot?.name || `${strings.slotNamePrefix}${index + 1}`,
    template: slot?.template ?? "",
    widthRatio: clamp(Number(slot?.widthRatio) || 0.33, 0.2, 0.8),
    heightRatio: clamp(Number(slot?.heightRatio) || 0.95, 0.5, 1),
    position: slot?.position === "left" ? "left" : "right",
    ...(() => {
      const serviceId = sanitizeService(slot?.service);
      const supportsTemporary = serviceSupportsTemporary(serviceId);
      return {
        service: serviceId,
        temporary: supportsTemporary ? Boolean(slot?.temporary ?? true) : false
      };
    })()
  }));
}

function sanitizeHotkeyMap(map, slotCount) {
  const maxIndex = Math.max(slotCount - 1, 0);
  const fallback = [0, 1, 2].map((value) => clamp(value, 0, maxIndex));
  if (!Array.isArray(map) || map.length !== 3) {
    return fallback;
  }
  return map.map((value, index) => {
    const numericValue = Number(value);
    const sanitized = clamp(numericValue, 0, maxIndex);
    return Number.isFinite(numericValue) ? sanitized : fallback[index];
  });
}

function serviceSelectHtml(selectedId) {
  return SERVICE_OPTIONS.map((service) => {
    const selected = sanitizeService(selectedId) === service.id ? "selected" : "";
    return `<option value="${service.id}" ${selected}>${escapeHtml(service.label)}</option>`;
  }).join("");
}

function slotCard(index, data, strings) {
  const serviceId = sanitizeService(data.service);
  const temporarySupported = serviceSupportsTemporary(serviceId);
  const temporaryChecked = temporarySupported && Boolean(data.temporary);
  return `
<div class="slot" data-index="${index}">
  <div class="slot-head">
    <div class="row slot-row">
      <label>${escapeHtml(strings.slotNameLabel)}</label>
      <input type="text" name="name" value="${escapeHtml(data.name || `${strings.slotNamePrefix}${index + 1}`)}" placeholder="${escapeHtml(strings.slotNamePlaceholder)}" />
    </div>
    <div class="slot-actions">
      <button class="up">${escapeHtml(strings.slotMoveUp)}</button>
      <button class="down">${escapeHtml(strings.slotMoveDown)}</button>
      <button class="dup">${escapeHtml(strings.slotDuplicate)}</button>
      <button class="del">${escapeHtml(strings.slotDelete)}</button>
    </div>
  </div>
  <div class="row">
    <label>${escapeHtml(strings.slotPromptLabel)}</label>
    <textarea name="template" placeholder="${escapeHtml(strings.promptPlaceholder)}">${escapeHtml(data.template || "")}</textarea>
  </div>
  <div class="row dense">
    <label>${escapeHtml(strings.slotServiceLabel)}</label>
    <select name="service">
      ${serviceSelectHtml(data.service)}
    </select>
    <label>${escapeHtml(strings.slotWidthLabel)}</label>
    <input class="small" type="number" name="widthRatio" step="0.01" min="0.2" max="0.8" value="${data.widthRatio ?? 0.33}">
    <label>${escapeHtml(strings.slotHeightLabel)}</label>
    <input class="small" type="number" name="heightRatio" step="0.01" min="0.5" max="1" value="${data.heightRatio ?? 0.95}">
    <label>${escapeHtml(strings.slotSideLabel)}</label>
    <select name="position">
      <option value="left" ${data.position === "left" ? "selected" : ""}>${escapeHtml(strings.slotSideLeft)}</option>
      <option value="right" ${data.position !== "left" ? "selected" : ""}>${escapeHtml(strings.slotSideRight)}</option>
    </select>
    <label class="toggle">
      <input type="checkbox" name="temporary" ${temporaryChecked ? "checked" : ""} ${temporarySupported ? "" : "disabled"}>
      <span data-temporary-label>${escapeHtml(temporarySupported ? strings.slotTemporaryLabel : strings.slotTemporaryUnsupported)}</span>
    </label>
  </div>
</div>`;
}

function applyDocumentLanguage(language) {
  document.documentElement.lang = language;
}

function applyLocaleText(strings) {
  document.title = strings.pageTitle;
  document.querySelectorAll("[data-i18n]").forEach((node) => {
    const key = node.dataset.i18n;
    if (!key || !(key in strings)) return;
    node.textContent = strings[key];
  });
}

function handleSystemThemeChange() {
  if (document.body.dataset.themeMode === "system") {
    document.body.dataset.theme = systemThemeQuery.matches ? "dark" : "light";
  }
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

function applyTheme(theme) {
  document.body.dataset.themeMode = theme;
  if (theme === "system") {
    document.body.dataset.theme = systemThemeQuery.matches ? "dark" : "light";
    if (!systemThemeListenerAttached) {
      addThemeListener(systemThemeQuery, handleSystemThemeChange);
      systemThemeListenerAttached = true;
    }
  } else {
    document.body.dataset.theme = theme;
    if (systemThemeListenerAttached) {
      removeThemeListener(systemThemeQuery, handleSystemThemeChange);
      systemThemeListenerAttached = false;
    }
  }
}

function updateTemporaryToggle(slotNode) {
  const serviceSelect = slotNode.querySelector('select[name="service"]');
  const checkbox = slotNode.querySelector('input[name="temporary"]');
  const label = slotNode.querySelector("[data-temporary-label]");
  if (!serviceSelect || !checkbox || !label) return;
  const supported = serviceSupportsTemporary(serviceSelect.value);
  if (supported) {
    if (checkbox.dataset.lastSupportedValue) {
      checkbox.checked = checkbox.dataset.lastSupportedValue === "1";
      delete checkbox.dataset.lastSupportedValue;
    }
  } else {
    checkbox.dataset.lastSupportedValue = checkbox.checked ? "1" : "0";
    checkbox.checked = false;
  }
  checkbox.disabled = !supported;
  label.textContent = supported ? currentStrings.slotTemporaryLabel : currentStrings.slotTemporaryUnsupported;
}

function render(list, hotkeyMap) {
  const sanitizedSlots = sanitizeSlots(
    Array.isArray(list) && list.length ? list : getDefaultSlots(currentSettings.language),
    currentSettings.language
  );
  const sanitizedHotkeys = sanitizeHotkeyMap(
    Array.isArray(hotkeyMap) ? hotkeyMap : [0, 1, 2],
    sanitizedSlots.length
  );

  currentStrings = getStrings(currentSettings.language);
  applyDocumentLanguage(currentSettings.language);
  applyLocaleText(currentStrings);
  applyTheme(currentSettings.theme);

  const container = document.getElementById("slots");
  container.innerHTML = sanitizedSlots.map((slot, index) => slotCard(index, slot, currentStrings)).join("");

  container.querySelectorAll(".slot").forEach((node, index) => {
    node.querySelector(".up").addEventListener("click", () => moveSlot(index, -1));
    node.querySelector(".down").addEventListener("click", () => moveSlot(index, 1));
    node.querySelector(".dup").addEventListener("click", () => duplicateSlot(index));
    node.querySelector(".del").addEventListener("click", () => removeSlot(index));
    const serviceSelect = node.querySelector('select[name="service"]');
    if (serviceSelect) {
      serviceSelect.addEventListener("change", () => updateTemporaryToggle(node));
      updateTemporaryToggle(node);
    }
  });

  const selects = [document.getElementById("hk1"), document.getElementById("hk2"), document.getElementById("hk3")];
  selects.forEach((select, hotkeyIndex) => {
    select.innerHTML = sanitizedSlots
      .map((slot, optionIndex) => `<option value="${optionIndex}">${escapeHtml(slot.name || `${currentStrings.slotNamePrefix}${optionIndex + 1}`)}</option>`)
      .join("");
    select.value = String(sanitizedHotkeys[hotkeyIndex] ?? hotkeyIndex);
  });

  document.getElementById("language").value = currentSettings.language;
  document.getElementById("theme").value = currentSettings.theme;
}

function readSlotsFromUI() {
  return [...document.querySelectorAll(".slot")].map((node, index) => {
    const query = (name) => node.querySelector(`[name="${name}"]`);
    return {
      name: (query("name").value || `${currentStrings.slotNamePrefix}${index + 1}`).trim(),
      template: (query("template").value || "").trim(),
      widthRatio: clamp(parseFloat(query("widthRatio").value), 0.2, 0.8),
      heightRatio: clamp(parseFloat(query("heightRatio").value), 0.5, 1),
      position: query("position").value === "left" ? "left" : "right",
      service: sanitizeService(query("service").value),
      temporary: (() => {
        const field = query("temporary");
        return field && !field.disabled ? field.checked : false;
      })()
    };
  });
}

function readHotkeysFromUI() {
  const slotsCount = document.querySelectorAll(".slot").length || 1;
  const map = ["hk1", "hk2", "hk3"].map((id, index) => {
    const value = Number(document.getElementById(id).value);
    return clamp(Number.isFinite(value) ? value : index, 0, slotsCount - 1);
  });
  return sanitizeHotkeyMap(map, slotsCount);
}

function readSettingsFromUI() {
  const language = sanitizeLanguage(document.getElementById("language").value);
  const theme = sanitizeTheme(document.getElementById("theme").value);
  return { language, theme };
}

async function save() {
  const slots = sanitizeSlots(readSlotsFromUI(), currentSettings.language);
  const hotkeyMap = sanitizeHotkeyMap(readHotkeysFromUI(), slots.length);
  currentSettings = { ...currentSettings, ...readSettingsFromUI() };
  currentStrings = getStrings(currentSettings.language);

  await chrome.storage.sync.set({ slots, hotkeyMap, settings: currentSettings });
  render(slots, hotkeyMap);
  alert(currentStrings.savedNotification);
}

async function reset() {
  await chrome.storage.sync.remove(["slots", "hotkeyMap", "settings"]);
  currentSettings = { ...DEFAULT_SETTINGS };
  currentStrings = getStrings(currentSettings.language);
  const defaults = getDefaultSlots(currentSettings.language);
  render(defaults, [0, 1, 2]);
  alert(currentStrings.resetNotification);
}

function addSlot() {
  const slots = readSlotsFromUI();
  const hotkeyMap = readHotkeysFromUI();
  slots.push({
    name: `${currentStrings.slotNamePrefix}${slots.length + 1}`,
    template: "",
    widthRatio: 0.33,
    heightRatio: 0.95,
    position: "right",
    service: DEFAULT_SERVICE,
    temporary: serviceSupportsTemporary(DEFAULT_SERVICE)
  });
  render(slots, hotkeyMap);
}

function moveSlot(index, delta) {
  const slots = readSlotsFromUI();
  const hotkeyMap = readHotkeysFromUI();
  const nextIndex = index + delta;
  if (nextIndex < 0 || nextIndex >= slots.length) return;
  [slots[index], slots[nextIndex]] = [slots[nextIndex], slots[index]];
  render(slots, hotkeyMap);
}

function duplicateSlot(index) {
  const slots = readSlotsFromUI();
  const hotkeyMap = readHotkeysFromUI();
  const copy = JSON.parse(JSON.stringify(slots[index]));
  copy.name = `${copy.name}${currentStrings.copySuffix}`;
  slots.splice(index + 1, 0, copy);
  render(slots, hotkeyMap);
}

function removeSlot(index) {
  const slots = readSlotsFromUI();
  if (slots.length <= 1) {
    alert(currentStrings.atLeastOneSlot);
    return;
  }
  const hotkeyMap = readHotkeysFromUI();
  slots.splice(index, 1);
  render(slots, hotkeyMap);
}

function exportSettings() {
  const slots = sanitizeSlots(readSlotsFromUI(), currentSettings.language);
  const hotkeyMap = sanitizeHotkeyMap(readHotkeysFromUI(), slots.length);
  currentSettings = { ...currentSettings, ...readSettingsFromUI() };

  const payload = {
    version: 1,
    slots,
    hotkeyMap,
    settings: currentSettings
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `gpt-side-runner-${stamp}.json`;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function sanitizeImportedPayload(payload) {
  if (!payload || typeof payload !== "object") return null;
  const settings = sanitizeSettings(payload.settings);
  const slots = Array.isArray(payload.slots) && payload.slots.length
    ? sanitizeSlots(payload.slots, settings.language)
    : getDefaultSlots(settings.language);
  const hotkeyMap = sanitizeHotkeyMap(payload.hotkeyMap, slots.length);
  return { slots, hotkeyMap, settings };
}

function handleImport(files) {
  if (!files || !files.length) return;
  const file = files[0];
  const reader = new FileReader();
  reader.onload = async () => {
    try {
      const parsed = JSON.parse(reader.result);
      const sanitized = sanitizeImportedPayload(parsed);
      if (!sanitized) throw new Error("invalid");
      currentSettings = sanitized.settings;
      currentStrings = getStrings(currentSettings.language);
      render(sanitized.slots, sanitized.hotkeyMap);
      await chrome.storage.sync.set({
        slots: sanitized.slots,
        hotkeyMap: sanitized.hotkeyMap,
        settings: currentSettings
      });
      alert(currentStrings.importSuccess);
    } catch (error) {
      alert(currentStrings.importError);
    } finally {
      document.getElementById("import-file").value = "";
    }
  };
  reader.readAsText(file, "utf-8");
}

async function load() {
  const { slots, hotkeyMap, settings } = await chrome.storage.sync.get(["slots", "hotkeyMap", "settings"]);
  currentSettings = sanitizeSettings(settings);
  currentStrings = getStrings(currentSettings.language);
  const list = Array.isArray(slots) && slots.length ? slots : getDefaultSlots(currentSettings.language);
  const map = Array.isArray(hotkeyMap) && hotkeyMap.length === 3 ? hotkeyMap : [0, 1, 2];
  render(list, map);
}

window.addEventListener("DOMContentLoaded", () => {
  load();
  document.getElementById("save").addEventListener("click", save);
  document.getElementById("reset").addEventListener("click", reset);
  document.getElementById("add").addEventListener("click", addSlot);
  document.getElementById("export").addEventListener("click", exportSettings);
  document.getElementById("import").addEventListener("click", () => document.getElementById("import-file").click());
  document.getElementById("import-file").addEventListener("change", (event) => handleImport(event.target.files));
  document.getElementById("language").addEventListener("change", (event) => {
    currentSettings.language = sanitizeLanguage(event.target.value);
    currentStrings = getStrings(currentSettings.language);
    const slots = readSlotsFromUI();
    const hotkeyMap = readHotkeysFromUI();
    render(slots, hotkeyMap);
  });
  document.getElementById("theme").addEventListener("change", (event) => {
    currentSettings.theme = sanitizeTheme(event.target.value);
    applyTheme(currentSettings.theme);
  });
});

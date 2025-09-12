// js/lang.js
const STORAGE_KEY = "site_lang";
const LANG_CODE_MAP = { zh: "zh-Hant", en: "en", bm: "ms" };

let dict = {};
let current = localStorage.getItem(STORAGE_KEY) || "zh";

// 初始化
(async function initLang() {
  try {
    // 🔗 固定去 /lang/lang.json 抓字典
    const res = await fetch("lang/lang.json", { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    dict = await res.json();
  } catch (err) {
    console.warn("載入 lang/lang.json 失敗，改用內建字典：", err);
    dict = getFallbackDict();
  }

  // 語言校正
  if (!dict[current]) current = dict.en ? "en" : Object.keys(dict)[0] || "en";

  // 套用當前語言
  setLang(current);

  // 綁定按鈕
  document.querySelectorAll("[data-setlang]").forEach(btn => {
    btn.addEventListener("click", () => setLang(btn.dataset.setlang));
  });
})();

// 切換語言
function setLang(lang) {
  if (!dict || !dict[lang]) return;
  current = lang;
  localStorage.setItem(STORAGE_KEY, lang);
  document.documentElement.setAttribute("lang", LANG_CODE_MAP[lang] || lang);
  applyTranslations(document);
}

// 套用翻譯
function applyTranslations(root = document) {
  root.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    const val = dict[current]?.[key] ?? dict.en?.[key];
    if (val != null) el.textContent = val;
  });
}

// 內建最小字典 (fallback)
function getFallbackDict() {
  return {
    zh: { "zh_tw": "中文", "en": "英文", "bm": "馬來文" },
    en: { "zh_tw": "Chinese", "en": "English", "bm": "Malay" },
    bm: { "zh_tw": "Cina", "en": "Inggeris", "bm": "Bahasa Melayu" }
  };
}

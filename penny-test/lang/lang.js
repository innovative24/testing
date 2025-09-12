// js/lang.js — 固定 GH Pages 子路径 + 健壮处理
const STORAGE_KEY = "site_lang";
const LANG_CODE_MAP = { zh: "zh-Hant", en: "en", bm: "ms" };

let dict = {};
let current = localStorage.getItem(STORAGE_KEY) || "zh";

(async function initLang() {
  // 🔗 固定你的 GH Pages 子目录
  const LANG_JSON_URL = "/testing/penny-test/lang/lang.json";

  try {
    const res = await fetch(LANG_JSON_URL, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const ct = (res.headers.get("content-type") || "").toLowerCase();
    if (!ct.includes("application/json")) throw new Error(`Not JSON: ${ct}`);
    dict = await res.json();
    console.info("[i18n] 使用字典：", LANG_JSON_URL);
  } catch (err) {
    console.warn("載入 lang.json 失敗，改用內建字典：", err);
    dict = getFallbackDict();
  }

  if (!dict[current]) current = dict.en ? "en" : Object.keys(dict)[0] || "en";
  setLang(current);

  // 字典就绪后再绑定
  document.querySelectorAll("[data-setlang]").forEach(btn => {
    btn.addEventListener("click", () => setLang(btn.dataset.setlang));
  });
})();

function setLang(lang) {
  if (!dict || !dict[lang]) return;
  current = lang;
  localStorage.setItem(STORAGE_KEY, lang);
  document.documentElement.setAttribute("lang", LANG_CODE_MAP[lang] || lang);
  applyTranslations(document);
}

function applyTranslations(root = document) {
  root.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    const val = dict[current]?.[key] ?? dict.en?.[key];
    if (val != null) el.textContent = val;
  });
}

function getFallbackDict() {
  return {
    zh: { "zh_tw": "中文", "en": "英文", "bm": "馬來文" },
    en: { "zh_tw": "Chinese", "en": "English", "bm": "Malay" },
    bm: { "zh_tw": "Cina", "en": "Inggeris", "bm": "Bahasa Melayu" }
  };
}

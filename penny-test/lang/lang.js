// lang.js
const STORAGE_KEY = "site_lang";
const LANG_CODE_MAP = { zh: "zh-Hant", en: "en", bm: "ms" };

let dict = {};
let current = localStorage.getItem(STORAGE_KEY) || "zh";

(async function initLang() {
  // 以「腳本實際 URL」定位 lang.json（避免頁面子路徑不同帶來的 404）
  const scriptUrl = document.currentScript?.src || "";
  const baseUrl = scriptUrl
    ? scriptUrl.replace(/[^/]*$/, "") // 去掉檔名（保留最後一個 /）
    : (location.origin + location.pathname.replace(/[^/]*$/, ""));
  const LANG_JSON_URL = baseUrl + "lang.json";

  try {
    const res = await fetch(LANG_JSON_URL, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    dict = await res.json();
  } catch (err) {
    console.warn("載入 lang.json 失敗，改用內建字典：", err);
    dict = getFallbackDict();
  }

  if (!dict[current]) current = dict.en ? "en" : Object.keys(dict)[0] || "en";
  setLang(current);

  // 字典載入完成後再綁定按鈕
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

// 內建最小字典（抓不到外部 JSON 時使用）
function getFallbackDict() {
  return {
    zh: { "zh_tw": "中文", "en": "英文", "bm": "馬來文" },
    en: { "zh_tw": "Chinese", "en": "English", "bm": "Malay" },
    bm: { "zh_tw": "Cina", "en": "Inggeris", "bm": "Bahasa Melayu" }
  };
}

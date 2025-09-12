const STORAGE_KEY = "site_lang";
let current = localStorage.getItem(STORAGE_KEY) || "zh";

const LANG_CODE_MAP = { zh: "zh-Hant", en: "en", bm: "ms" }; // 或 "ms-MY"

function setLang(lang) {
  if (!dict || !dict[lang]) return;
  current = lang;
  localStorage.setItem(STORAGE_KEY, lang);
  document.documentElement.setAttribute("lang", LANG_CODE_MAP[lang] || lang);
  applyTranslations(document);
}

// 綁定按鈕
document.querySelectorAll("[data-setlang]").forEach(btn => {
  btn.addEventListener("click", () => setLang(btn.dataset.setlang));
});

// 首次載入
if (!dict?.[current]) current = "en";
document.documentElement.setAttribute("lang", LANG_CODE_MAP[current] || current);
applyTranslations(document);

function applyTranslations(root = document) {
  root.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    const val = dict[current]?.[key] ?? dict.en?.[key] ?? el.textContent;
    if (val != null) el.textContent = val;
  });
}

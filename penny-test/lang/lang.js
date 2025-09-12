const STORAGE_KEY = "site_lang";
const LANG_CODE_MAP = { zh: "zh-Hant", en: "en", bm: "ms" };
let dict = {};
let current = localStorage.getItem(STORAGE_KEY) || "zh";

initLang();

async function initLang() {
  const res = await fetch("lang.json");
  dict = await res.json();

  if (!dict[current]) current = "en";

  setLang(current);

  document.querySelectorAll("[data-setlang]").forEach(btn => {
    btn.addEventListener("click", () => setLang(btn.dataset.setlang));
  });
}

function setLang(lang) {
  if (!dict[lang]) return;
  current = lang;
  localStorage.setItem(STORAGE_KEY, lang);
  document.documentElement.setAttribute("lang", LANG_CODE_MAP[lang] || lang);
  applyTranslations(document);
}

function applyTranslations(root = document) {
  root.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    const val = dict[current]?.[key] ?? dict.en?.[key];
    if (val) el.textContent = val;
  });
}


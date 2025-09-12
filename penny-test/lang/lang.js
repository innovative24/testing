// lang.js
const STORAGE_KEY = "site_lang";
const LANG_CODE_MAP = { zh: "zh-Hant", en: "en", bm: "ms" }; // 馬來語用 ms 或 ms-MY

let dict = {};                           // 先給一個空物件
let current = localStorage.getItem(STORAGE_KEY) || "zh";

// 1) 載入 lang.json 後再初始化
loadDict().catch(err => console.error("load lang.json failed:", err));

async function loadDict() {
  const res = await fetch("lang.json", { cache: "no-store" });
  if (!res.ok) throw new Error(res.status + " " + res.statusText);
  dict = await res.json();

  // 沒有該語系就退到 en / 第一個可用語系
  if (!dict[current]) current = dict.en ? "en" : Object.keys(dict)[0];

  document.documentElement.setAttribute("lang", LANG_CODE_MAP[current] || current);
  applyTranslations(document);

  // 綁定語言按鈕（在字典載入後才綁）
  document.querySelectorAll("[data-setlang]").forEach(btn => {
    btn.addEventListener("click", () => setLang(btn.dataset.setlang));
  });
}

// 2) 切換語言
function setLang(lang) {
  if (!dict || !dict[lang]) return;     // 沒這個語系就不動
  current = lang;
  localStorage.setItem(STORAGE_KEY, lang);
  document.documentElement.setAttribute("lang", LANG_CODE_MAP[lang] || lang);
  applyTranslations(document);
}

// 3) 套用翻譯（支援文字與指定屬性）
function applyTranslations(root = document) {
  root.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    const text = dict[current]?.[key] ?? dict.en?.[key];
    if (text != null) el.textContent = text;
  });

  // 可選：若你有 data-i18n-attr="placeholder" 這類
  root.querySelectorAll("[data-i18n-attr]").forEach(el => {
    const key = el.getAttribute("data-i18n-attr");
    // 支援多屬性：data-i18n-attr="placeholder|aria-label"
    const [i18nKey, ...attrs] = key.split(";");
    const [k, attrStr] = i18nKey.includes("|") ? i18nKey.split("|") : [i18nKey, ""];
    const value = dict[current]?.[k] ?? dict.en?.[k];
    const attributes = (attrStr ? attrStr.split("|") : []).concat(attrs);
    if (value && attributes.length) {
      attributes.forEach(a => el.setAttribute(a, value));
    }
  });
}

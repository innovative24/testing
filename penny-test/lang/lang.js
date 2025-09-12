// js/lang.js ︱ Robust 版：多路徑嘗試 + JSON 檢查 + Fallback
const STORAGE_KEY = "site_lang";
const LANG_CODE_MAP = { zh: "zh-Hant", en: "en", bm: "ms" };

let dict = {};
let current = localStorage.getItem(STORAGE_KEY) || "zh";

(async function initLang() {
  // 1) 準備多個候選路徑（依序嘗試，任何一個成功就用）
  const curDir = location.pathname.replace(/[^/]*$/, ""); // 目前頁面所在資料夾
  const segs = location.pathname.split("/").filter(Boolean);
  const root1 = segs.length >= 1 ? `/${segs[0]}/` : `/`;
  const root2 = segs.length >= 2 ? `/${segs[0]}/${segs[1]}/` : root1;

  const candidates = [
    // 與頁面同層
    curDir + "lang.json",
    curDir + "lang/lang.json",
    // 專案根（支援一層或兩層路徑，如 /repo/ 或 /org/repo/）
    root1 + "lang/lang.json",
    root2 + "lang/lang.json",
    // 與腳本同層（最後一招）
    (document.currentScript?.src || "").replace(/[^/]*$/, "") + "lang.json",
  ].filter(Boolean);

  dict = await loadFirstJson(candidates) || getFallbackDict();

  if (!dict[current]) current = dict.en ? "en" : Object.keys(dict)[0] || "en";
  setLang(current);

  // 綁定按鈕（字典 OK 後再綁）
  document.querySelectorAll("[data-setlang]").forEach(btn => {
    btn.addEventListener("click", () => setLang(btn.dataset.setlang));
  });
})();

async function loadFirstJson(urls) {
  for (const url of urls) {
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) { console.warn(`[i18n] 404/HTTP ${res.status}:`, url); continue; }
      const ct = (res.headers.get("content-type") || "").toLowerCase();
      if (!ct.includes("application/json")) {
        console.warn(`[i18n] 非 JSON 回應（${ct}）：`, url);
        continue;
      }
      const data = await res.json();
      console.info("[i18n] 使用字典：", url);
      return data;
    } catch (err) {
      console.warn("[i18n] 載入失敗：", url, err);
    }
  }
  return null;
}

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

// 抓不到檔時的內建最小字典（避免整頁壞掉）
function getFallbackDict() {
  return {
    zh: { "zh_tw": "中文", "en": "英文", "bm": "馬來文" },
    en: { "zh_tw": "Chinese", "en": "English", "bm": "Malay" },
    bm: { "zh_tw": "Cina", "en": "Inggeris", "bm": "Bahasa Melayu" }
  };
}

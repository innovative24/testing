// /js/lang.js
document.addEventListener("DOMContentLoaded", () => {
  const log = (...a) => console.log("[i18n]", ...a);
  const err = (...a) => console.error("[i18n]", ...a);

  // 目前語言：統一用這個變數
  let currentLang = "zh";

  // 取得初始語言（網址 > localStorage > 瀏覽器語系）
  const params = new URLSearchParams(location.search);
  const fromQS = params.get("lang");
  const fromLS = localStorage.getItem("lang");
  const guess  = (navigator.language || "zh").toLowerCase().startsWith("zh") ? "zh" : "en";
  currentLang = fromQS || fromLS || guess;

  async function loadDict(code){
    const url = `./lang/${code}.json?v=${Date.now()}`; // 相對路徑最安全（GitHub Pages 子路徑OK）
    log("loading", url);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
    return res.json();
  }

  function applyDict(dict){
    let changed = 0;

    // 文字節點
    document.querySelectorAll("[data-i18n]").forEach(el => {
      const key = el.dataset.i18n;
      if (dict[key] != null) { el.textContent = dict[key]; changed++; }
    });

    // 屬性翻譯（placeholder / aria-label 等）
    document.querySelectorAll("[data-i18n-attr]").forEach(el => {
      const attrs = el.dataset.i18nAttr.split(",").map(s => s.trim());
      const key = el.dataset.i18n;
      if (dict[key] == null) return;
      attrs.forEach(a => el.setAttribute(a, dict[key]));
      changed++;
    });

    // <title> / <meta name="description">
    if (dict.page_title){ document.title = dict.page_title; changed++; }
    if (dict.page_desc){
      let m = document.querySelector('meta[name="description"]');
      if(!m){ m = document.createElement("meta"); m.setAttribute("name","description"); document.head.appendChild(m); }
      m.setAttribute("content", dict.page_desc);
      changed++;
    }

    log(`applied: ${changed} node(s) updated`);
  }

  function updateLangButtons(){
    document.querySelectorAll("[data-setlang]").forEach(b => {
      const active = b.dataset.setlang === currentLang;
      b.classList.toggle("active", active);
      b.setAttribute("aria-pressed", active ? "true" : "false");
    });
  }

  async function setLang(next){
    try{
      const dict = await loadDict(next);
      applyDict(dict);

      // 成功後才更新目前語言 + 狀態
      currentLang = next;
      localStorage.setItem("lang", currentLang);
      updateLangButtons();

      // 更新網址但不重整
      const url = new URL(location.href);
      url.searchParams.set("lang", currentLang);
      history.replaceState(null, "", url.toString());

      log("language set to", currentLang);
    }catch(e){
      err("failed to set language:", e);
    }
  }

  // 綁定切換（按鈕）
  document.querySelectorAll("[data-setlang]").forEach(btn => {
    btn.addEventListener("click", (ev) => {
      ev.preventDefault();
      const next = btn.dataset.setlang;
      setLang(next);
    });
  });

  // 首次載入
  setLang(currentLang);
});

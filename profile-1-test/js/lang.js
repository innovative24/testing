// /js/lang.js
document.addEventListener("DOMContentLoaded", async () => {
  const qs = new URLSearchParams(location.search);
  const fromQS = qs.get("lang");
  const fromLS = localStorage.getItem("lang");
  const guess  = (navigator.language || "zh").toLowerCase().startsWith("zh") ? "zh" : "en";
  let lang = fromQS || fromLS || guess;

  const apply = (dict) => {
    // 一般文字
    document.querySelectorAll("[data-i18n]").forEach(el => {
      const key = el.dataset.i18n;
      if (dict[key] != null) el.textContent = dict[key];
    });
    // 屬性翻譯（例如 placeholder）
    document.querySelectorAll("[data-i18n-attr]").forEach(el => {
      const attrs = el.dataset.i18nAttr.split(",").map(s => s.trim());
      const key = el.dataset.i18n;
      if (dict[key] == null) return;
      attrs.forEach(a => el.setAttribute(a, dict[key]));
    });
    // <title> 與 <meta name="description">
    if (dict.page_title) document.title = dict.page_title;
    if (dict.page_desc){
      let m = document.querySelector('meta[name="description"]');
      if (!m) { m = document.createElement("meta"); m.setAttribute("name","description"); document.head.appendChild(m); }
      m.setAttribute("content", dict.page_desc);
    }
  };

  async function loadAndApply(nextLang){
    try{
      const res = await fetch(`./lang/${nextLang}.json?v=${Date.now()}`);
      const dict = await res.json();
      lang = nextLang;
      localStorage.setItem("lang", lang);
      // 更新網址參數但不重整
      const url = new URL(location.href);
      url.searchParams.set("lang", lang);
      history.replaceState(null, "", url.toString());
      apply(dict);
      // 切換鈕的 active 樣式
      document.querySelectorAll("[data-setlang]").forEach(b => {
        b.classList.toggle("active", b.dataset.setlang === lang);
      });
    }catch(e){
      console.error("載入語言包失敗", e);
    }
  }

  // 綁定切換鈕
  document.querySelectorAll("[data-setlang]").forEach(btn => {
    btn.addEventListener("click", () => loadAndApply(btn.dataset.setlang));
  });

  // 首次載入
  loadAndApply(lang);
});

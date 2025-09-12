// pop-up.js — 空狀態、上傳視窗、插卡（含摘要+完整說明）、畫家篩選、雙 Lightbox
document.addEventListener("DOMContentLoaded", () => {
  const dlg       = document.getElementById("upload-dialog");
  const openBtn   = document.getElementById("open-upload");
  const emptyBtn  = document.getElementById("empty-upload");
  const form      = document.getElementById("upload-form");
  const gallery   = document.getElementById("gallery");

  const filterWrap = document.getElementById("artist-filter-wrap");
  const filterBar  = document.getElementById("artist-filter");
  const emptyArea  = document.getElementById("empty-state");

  const supportsDialog = typeof HTMLDialogElement === "function";

  // ---------- 上傳視窗 開/關 ----------
  function openDialog() {
    if (!dlg) return;
    if (supportsDialog && typeof dlg.showModal === "function") dlg.showModal();
    else { dlg.setAttribute("open",""); dlg.classList.add("fallback-open"); document.body.style.overflow="hidden"; }
  }
  function closeDialog() {
    if (!dlg) return;
    if (supportsDialog && typeof dlg.close === "function") dlg.close();
    else { dlg.removeAttribute("open"); dlg.classList.remove("fallback-open"); document.body.style.overflow=""; }
  }
  openBtn?.addEventListener("click", openDialog);
  emptyBtn?.addEventListener("click", openDialog);

  // 點背景關閉
  dlg?.addEventListener("click", (e) => {
    const rect = dlg.querySelector("form")?.getBoundingClientRect();
    const inside = rect && e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom;
    if (!inside) closeDialog();
  });
  // ✕ / 取消 永遠可點
  dlg?.querySelectorAll('button[value="cancel"], [data-close]').forEach(b=>{
    b.type="button";
    b.addEventListener("click", (e)=>{ e.preventDefault(); closeDialog(); });
  });

  // ---------- 空狀態切換 ----------
  function updateEmptyState(){
    const hasItems = !!gallery?.querySelector(".work");
    if (emptyArea) emptyArea.style.display = hasItems ? "none" : "";
    if (filterWrap) filterWrap.hidden = !hasItems;
  }
  updateEmptyState();

  // ---------- 詳細說明 Lightbox（自動建立一次） ----------
  let detailLb = document.getElementById("detail-lightbox");
  if (!detailLb) {
    detailLb = document.createElement("dialog");
    detailLb.id = "detail-lightbox";
    detailLb.innerHTML = `
      <div class="detail-box">
        <button type="button" class="lightbox-close" aria-label="關閉">✕</button>
        <h2 id="detail-title"></h2>
        <p class="byline" id="detail-artist"></p>
        <div id="detail-desc"></div>
      </div>
    `;
    document.body.appendChild(detailLb);
  }
  const dBox    = detailLb.querySelector(".detail-box");
  const dTitle  = detailLb.querySelector("#detail-title");
  const dArtist = detailLb.querySelector("#detail-artist");
  const dDesc   = detailLb.querySelector("#detail-desc");
  detailLb.querySelector(".lightbox-close")?.addEventListener("click", ()=> closeAny(detailLb));
  detailLb.addEventListener("click", (e) => {
    if (!dBox) return;
    const r = dBox.getBoundingClientRect();
    const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
    if (!inside) closeAny(detailLb);
  });

  // ---------- 圖片 Lightbox（只按「查看圖片」才開） ----------
  let imgLb = document.getElementById("img-lightbox");
  if (!imgLb) {
    imgLb = document.createElement("dialog");
    imgLb.id = "img-lightbox";
    imgLb.innerHTML = `
      <button type="button" class="lightbox-close" aria-label="關閉">✕</button>
      <img id="lightbox-img" alt="">
      <p class="caption" id="img-caption"></p>
    `;
    document.body.appendChild(imgLb);
  }
  const lbImg = imgLb.querySelector("#lightbox-img");
  const lbCap = imgLb.querySelector("#img-caption");
  imgLb.querySelector(".lightbox-close")?.addEventListener("click", ()=> closeAny(imgLb));
  imgLb.addEventListener("click", (e)=>{
    const rect = lbImg?.getBoundingClientRect();
    const inside = rect && e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom;
    if (!inside) closeAny(imgLb);
  });

  // ---------- 送出：插入新作品（縮圖 + 摘要 + 完整說明 + 兩顆按鈕） ----------
  if (form && gallery) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      e.stopImmediatePropagation();

      const $ = (sel) => form.querySelector(sel);
      const title   = ( $('input[name="title"]')?.value  || "" ).trim() || "未命名作品";
      const artist  = ( $('input[name="artist"]')?.value || $('input[name="tags"]')?.value || "" ).trim() || "未署名";
      const excerpt = ( $('textarea[name="excerpt"]')?.value || "" ).trim(); // 短摘要
      const detail  = ( $('textarea[name="detail"]')?.value  || "" ).trim(); // 完整說明
      const desc    = ( $('textarea[name="desc"]')?.value    || "" ).trim(); // 相容舊欄位
      const file    = $('input[name="file"]')?.files?.[0] || null;

      // 用 excerpt 或舊的 desc 作為卡片摘要
      const shortText = excerpt || desc || "";

      // 縮圖
      let thumbHTML = '<div class="thumb"></div>';
      let fullSrc = "";
      if (file?.type?.startsWith("image/")) {
        fullSrc = URL.createObjectURL(file);
        thumbHTML = `<div class="thumb"><img src="${escapeAttr(fullSrc)}" alt="${escapeHtml(title)}"></div>`;
      } else if (file) {
        const ext = (file.name.split(".").pop() || "FILE").toUpperCase();
        thumbHTML = `<div class="thumb" style="display:flex;align-items:center;justify-content:center;"><strong>${escapeHtml(ext)}</strong></div>`;
      }

      // 卡片 DOM：.desc 放摘要；.full（hidden）放完整說明
      const li = document.createElement("li");
      li.innerHTML = `
        <details class="work" data-artist="${escapeAttr(artist)}">
          <summary>
            ${thumbHTML}
            <h2 class="title">${escapeHtml(title)}</h2>
            <ul class="tags"><li class="artist-chip">${escapeHtml(artist)}</li></ul>
          </summary>
          <div class="meta">
            <p class="desc">${escapeHtml(shortText || "（無摘要）")}</p>
            <div class="full" hidden>${escapeHtml(detail)}</div>
            <div class="actions">
              <button type="button" class="btn btn-ghost btn-detail">詳細說明</button>
              ${ fullSrc
                  ? `<button type="button" class="btn btn-view btn-image" data-src="${escapeAttr(fullSrc)}" data-alt="${escapeAttr(title)}">查看圖片</button>`
                  : `<button type="button" class="btn btn-view btn-image" disabled title="此檔案非圖片">查看圖片</button>`
              }
            </div>
          </div>
        </details>
      `.trim();

      gallery.prepend(li);
      ensureArtistInFilter(artist);
      form.reset();

      try { dlg.returnValue = "submit"; } catch(_) {}
      closeDialog();
      updateEmptyState();
    }, { passive:false });
  }

  // ---------- 作品牆事件：詳細說明 / 查看圖片 ----------
  gallery?.addEventListener("click", (e) => {
    const imgBtn    = e.target.closest(".btn-image");
    const detailBtn = e.target.closest(".btn-detail");
    const details   = e.target.closest("details.work");

    if (imgBtn) {
      const src = imgBtn.dataset.src || "";
      const alt = imgBtn.dataset.alt || details?.querySelector(".title")?.textContent?.trim() || "";
      const artist = details?.getAttribute("data-artist") || "";
      if (src) openImgLightbox(src, alt, artist);
      return;
    }
    if (detailBtn) {
      if (!details) return;
      // 取資料
      const title  = details.querySelector(".title")?.textContent?.trim() || "";
      const artist = details.getAttribute("data-artist") || "";
      const full   = details.querySelector(".full")?.textContent?.trim()
                  || details.querySelector(".desc")?.textContent?.trim()
                  || "（無更多說明）";
      // 填入詳細說明彈窗
      if (dTitle)  dTitle.textContent  = title;
      if (dArtist) dArtist.textContent = artist ? `畫家：${artist}` : "";
      if (dDesc)   dDesc.textContent   = full;

      openDetailLightbox();
      return;
    }
  });

  // ---------- 畫家篩選 ----------
  filterBar?.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-filter]");
    if (!btn) return;

    filterBar.querySelectorAll("button[data-filter]").forEach(b => b.classList.remove("is-active"));
    btn.classList.add("is-active");

    const key = (btn.getAttribute("data-filter") || "*").trim().toLowerCase();
    const items = gallery.querySelectorAll(".work");
    if (!key || key === "*") { items.forEach(it => it.parentElement.style.display = ""); return; }

    items.forEach(it => {
      const artist = (it.getAttribute("data-artist") || "").trim().toLowerCase();
      it.parentElement.style.display = (artist === key) ? "" : "none";
    });
  });

  // 初始：若已有預置作品，把畫家補到篩選器
  Array.from(gallery?.querySelectorAll('.work[data-artist]') || [])
    .map(el => el.getAttribute('data-artist')?.trim())
    .filter(Boolean)
    .forEach(name => ensureArtistInFilter(name));

  function ensureArtistInFilter(name){
    if (!filterBar || !name) return;
    const norm = String(name).trim();
    const exists = Array.from(filterBar.querySelectorAll("button[data-filter]"))
      .some(b => (b.getAttribute("data-filter") || b.textContent || "")
        .trim().toLowerCase() === norm.toLowerCase());
    if (exists) return;

    const li = document.createElement("li");
    li.innerHTML = `<button type="button" data-filter="${escapeAttr(norm)}">${escapeHtml(norm)}</button>`;
    filterBar.appendChild(li);
  }

  // ---------- 開關 Lightbox 的小函式 ----------
  function openImgLightbox(src, alt="", artist=""){
    if (!imgLb || !lbImg) return;
    lbImg.src = src; lbImg.alt = alt;
    if (lbCap) lbCap.textContent = artist ? `${artist} — ${alt}` : alt;
    if (supportsDialog && typeof imgLb.showModal === "function") imgLb.showModal();
    else { imgLb.setAttribute("open",""); imgLb.classList.add("fallback-open"); document.body.style.overflow="hidden"; }
  }
  function openDetailLightbox(){
    if (supportsDialog && typeof detailLb.showModal === "function") detailLb.showModal();
    else { detailLb.setAttribute("open",""); detailLb.classList.add("fallback-open"); document.body.style.overflow="hidden"; }
  }
  function closeAny(d){
    if (supportsDialog && typeof d.close === "function") d.close();
    else { d.removeAttribute("open"); d.classList.remove("fallback-open"); document.body.style.overflow=""; }
  }

  // ---------- 工具 ----------
  function escapeHtml(s){return String(s).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#39;");}
  function escapeAttr(s){return escapeHtml(s).replaceAll("`","&#96;");}
});

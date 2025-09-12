// app.js
document.addEventListener("DOMContentLoaded", () => {
  // 1) 版尾年份自動更新
  const yearEl = document.querySelector("#year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  // 2) works.html 專用：上傳視窗 + 表單處理 + 類別篩選
  const uploadBtn = document.getElementById("open-upload");
  const uploadDlg = document.getElementById("upload-dialog");
  const uploadForm = document.getElementById("upload-form");
  const gallery = document.getElementById("gallery");
  const filterBar = document.getElementById("category-filter");

  // --- 2a. 開關上傳 dialog
  if (uploadBtn && uploadDlg) {
    uploadBtn.addEventListener("click", () => {
      if (typeof uploadDlg.showModal === "function") {
        uploadDlg.showModal();
      } else {
        // 不支援 <dialog> 的瀏覽器
        uploadDlg.setAttribute("open", "");
      }
    });

    // 允許按 ESC 關閉（原生支援），以及點 backdrop 關閉
    uploadDlg.addEventListener("click", (e) => {
      const rect = uploadDlg.querySelector("form").getBoundingClientRect();
      const clickedInDialog = (
        e.clientX >= rect.left && e.clientX <= rect.right &&
        e.clientY >= rect.top && e.clientY <= rect.bottom
      );
      if (!clickedInDialog) uploadDlg.close?.();
    });
  }



  // --- 2c. 類別篩選（根據 data-tags）
  if (filterBar && gallery) {
    filterBar.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-filter]");
      if (!btn) return;

      // 樣式切換
      filterBar.querySelectorAll("button[data-filter]").forEach(b => b.classList.remove("is-active"));
      btn.classList.add("is-active");

      const key = btn.getAttribute("data-filter"); // 例如 "*", "frontend", "UI/UX"
      const items = gallery.querySelectorAll(".work");

      if (!key || key === "*") {
        items.forEach(it => it.parentElement.style.display = "");
        return;
      }

      const needle = key.toLowerCase();
      items.forEach(it => {
        const tags = (it.getAttribute("data-tags") || "").toLowerCase();
        // 簡單包含判斷（可改為更嚴謹的 token 比對）
        const show = tags.split(",").map(s => s.trim()).includes(needle);
        it.parentElement.style.display = show ? "" : "none";
      });
    });
  }
});

// 轉義工具，避免插入使用者輸入造成 XSS
function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
function escapeAttr(str) {
  // 屬性值轉義（保守做法）
  return escapeHtml(str).replaceAll("`", "&#96;");
}

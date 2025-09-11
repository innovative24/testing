// js/menu.js
document.addEventListener("DOMContentLoaded", () => {
  const toggleBtn = document.querySelector(".nav-toggle");
  const nav = document.getElementById("site-nav");
  const navContainer = document.querySelector(".nav-container");
  if (!toggleBtn || !nav || !navContainer) return;

  // 動態建立遮罩
  let overlay = document.querySelector(".nav-overlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.className = "nav-overlay";
    overlay.setAttribute("hidden", "");
    document.body.appendChild(overlay);
  }

  const openMenu = () => {
    nav.classList.add("is-open");
    document.body.classList.add("menu-open");   // 若你有用來鎖住滾動，可加對應 CSS
    overlay.removeAttribute("hidden");
    toggleBtn.setAttribute("aria-expanded", "true");
  };
  const closeMenu = () => {
    nav.classList.remove("is-open");
    document.body.classList.remove("menu-open");
    overlay.setAttribute("hidden", "");
    toggleBtn.setAttribute("aria-expanded", "false");
  };
  const isOpen = () => nav.classList.contains("is-open");

  // 點按鈕：切換
  toggleBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    isOpen() ? closeMenu() : openMenu();
  });

  // 點選單連結：關閉
  nav.querySelectorAll("a").forEach(a => a.addEventListener("click", closeMenu));

  // 點遮罩：關閉
  overlay.addEventListener("click", closeMenu);

  // ESC：關閉
  window.addEventListener("keydown", (e) => { if (e.key === "Escape" && isOpen()) closeMenu(); });

  // 視窗放大到桌機：復位
  const MQ = window.matchMedia("(min-width: 860px)");
  const handleMQ = () => { if (MQ.matches) closeMenu(); };
  MQ.addEventListener ? MQ.addEventListener("change", handleMQ) : MQ.addListener(handleMQ);

  // 捲動時加深頂欄（可選）
  const header = document.querySelector("header");
  const onScroll = () => {
    if (!header) return;
    if (window.scrollY > 8) header.classList.add("is-scrolled");
    else header.classList.remove("is-scrolled");
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
});


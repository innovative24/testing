// 捲動時為 header 加上 is-scrolled，提升可讀性
document.addEventListener("DOMContentLoaded", () => {
  const header = document.querySelector("header");
  if (!header) return;

  const onScroll = () => {
    if (window.scrollY > 8) header.classList.add("is-scrolled");
    else header.classList.remove("is-scrolled");
  };
  onScroll();                      // 初始判斷
  window.addEventListener("scroll", onScroll, { passive: true });
});

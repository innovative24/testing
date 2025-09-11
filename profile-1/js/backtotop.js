// 回到頂部
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll('a[href="#top"]').forEach(a => {
    a.addEventListener("click", (e) => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });
});

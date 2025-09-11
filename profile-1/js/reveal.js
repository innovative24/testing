// 滾動進場動畫
document.addEventListener("DOMContentLoaded", () => {
  const nodes = document.querySelectorAll(".reveal");
  if (!nodes.length) return;

  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((ents) => {
      ents.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add("is-in");
          io.unobserve(e.target);
        }
      });
    }, { threshold: .12 });
    nodes.forEach(el => io.observe(el));
  } else {
    nodes.forEach(el => el.classList.add("is-in"));
  }
});

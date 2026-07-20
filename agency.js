(() => {
  const revealNodes = () => {
    const nodes = document.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window)) {
      nodes.forEach(node => node.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.16 });

    nodes.forEach(node => observer.observe(node));
  };

  const normalizePath = value => {
    const path = value.replace(/\/index\.html$/, "/").replace(/^\//, "");
    return path || "index.html";
  };

  const bindHeaderState = () => {
    const header = document.getElementById("site-header");
    if (!header) return;

    const current = normalizePath(window.location.pathname.split("/").pop() || "index.html");
    header.querySelectorAll(".bs-nav a").forEach(link => {
      const href = link.getAttribute("href") || "";
      const normalizedHref = normalizePath(href.split("#")[0]);
      const isCurrent = normalizedHref === current || (current === "index.html" && normalizedHref === "");
      link.toggleAttribute("aria-current", isCurrent);
    });

    const menuToggle = header.querySelector("#bs-mobile-menu-toggle");
    header.querySelectorAll(".bs-nav a").forEach(link => {
      link.addEventListener("click", () => {
        if (menuToggle) menuToggle.checked = false;
      });
    });
  };

  const init = () => {
    revealNodes();
    bindHeaderState();
  };

  document.addEventListener("site-header-loaded", bindHeaderState);

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

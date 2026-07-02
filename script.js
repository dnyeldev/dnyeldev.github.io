const header = document.querySelector("[data-header]");
const nav = document.querySelector("[data-nav]");
const navToggle = document.querySelector("[data-nav-toggle]");
const revealItems = document.querySelectorAll(".reveal");
const navLinks = document.querySelectorAll(".site-nav a[href*='#']");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const revealItem = (item) => {
  item.classList.add("is-visible");
  item.classList.remove("reveal-pending");
};

const closeNav = () => {
  if (!nav || !navToggle) return;
  nav.classList.remove("is-open");
  navToggle.setAttribute("aria-expanded", "false");
  document.body.classList.remove("nav-open");
};

const getHeaderOffset = () => (header ? header.offsetHeight : 0) + 22;

const getHashTarget = (hash) => {
  if (!hash || hash === "#") return null;
  return document.getElementById(hash.slice(1));
};

const scrollToHash = (hash, behavior = "smooth") => {
  const target = getHashTarget(hash);
  if (!target) return false;

  const top = Math.max(0, target.getBoundingClientRect().top + window.scrollY - getHeaderOffset());
  window.scrollTo({ top, behavior: prefersReducedMotion ? "auto" : behavior });
  return true;
};

const setActiveNav = (hash) => {
  navLinks.forEach((link) => {
    const url = new URL(link.href, window.location.href);
    const isSamePage = url.pathname === window.location.pathname;
    const isActive = isSamePage && url.hash === hash;
    link.classList.toggle("is-active", isActive);
    if (isActive) {
      link.setAttribute("aria-current", "true");
    } else {
      link.removeAttribute("aria-current");
    }
  });
};

const syncHeader = () => {
  if (!header) return;
  header.classList.toggle("is-scrolled", window.scrollY > 12);
};

const syncActiveSection = () => {
  const sectionIds = ["systems", "work", "process", "stack", "contact"];
  const probe = getHeaderOffset() + Math.round(window.innerHeight * 0.18);
  let activeHash = "";

  sectionIds.forEach((id) => {
    const section = document.getElementById(id);
    if (!section) return;

    const rect = section.getBoundingClientRect();
    if (rect.top <= probe && rect.bottom > probe) activeHash = `#${id}`;
  });

  setActiveNav(activeHash);
};

let activeSyncQueued = false;

const requestActiveSync = () => {
  if (activeSyncQueued) return;
  activeSyncQueued = true;
  window.requestAnimationFrame(() => {
    activeSyncQueued = false;
    syncActiveSection();
  });
};

if (nav && navToggle) {
  navToggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
    document.body.classList.toggle("nav-open", isOpen);
  });

  nav.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeNav));
}

document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener("click", (event) => {
    const hash = link.getAttribute("href");
    if (!hash || !getHashTarget(hash)) return;

    event.preventDefault();
    closeNav();
    history.pushState(null, "", hash);
    setActiveNav(hash);
    scrollToHash(hash);
  });
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeNav();
});

window.addEventListener(
  "scroll",
  () => {
    syncHeader();
    requestActiveSync();
  },
  { passive: true }
);
window.addEventListener("resize", requestActiveSync);
syncHeader();
syncActiveSection();

if (window.location.hash) {
  window.setTimeout(() => {
    if (scrollToHash(window.location.hash, "auto")) setActiveNav(window.location.hash);
  }, 80);
}

if (prefersReducedMotion) {
  revealItems.forEach(revealItem);
} else if ("IntersectionObserver" in window) {
  revealItems.forEach((item) => item.classList.add("reveal-pending"));

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          revealItem(entry.target);
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.14,
      rootMargin: "0px 0px -8% 0px",
    }
  );

  revealItems.forEach((item) => observer.observe(item));

  window.addEventListener(
    "load",
    () => {
      window.setTimeout(() => {
        revealItems.forEach((item) => {
          revealItem(item);
          observer.unobserve(item);
        });
      }, 1200);
    },
    { once: true }
  );
} else {
  revealItems.forEach(revealItem);
}

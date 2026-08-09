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

  const initHomePanels = () => {
    const stage = document.querySelector("[data-home-panel-stage]");
    if (!stage || stage.dataset.homePanelsInitialized) return;

    stage.dataset.homePanelsInitialized = "true";

    const panelOrder = [
      "home",
      "websites",
      "clean-sweep",
      "cocofilms",
      "david-bastida",
      "loyal-roofing",
      "cater-vegas",
      "whats-next",
      "footer"
    ];
    const panels = panelOrder
      .map(id => document.querySelector(`[data-home-panel="${id}"]`))
      .filter(Boolean);
    const progressButtons = Array.from(document.querySelectorAll("[data-home-panel-target]"));
    const focusableSelector = [
      "a[href]",
      "button:not([disabled])",
      "input:not([disabled])",
      "select:not([disabled])",
      "textarea:not([disabled])",
      "[tabindex]"
    ].join(",");
    const interactiveSelector = [
      "a",
      "button",
      "input",
      "select",
      "textarea",
      "label",
      "[role='button']",
      "[contenteditable='true']"
    ].join(",");
    const panelIds = panels.map(panel => panel.dataset.homePanel);
    const footerIndex = panelIds.indexOf("footer");
    const progressNav = document.querySelector("[data-home-panel-progress]");
    const siteHeader = document.getElementById("site-header");
    let activeIndex = Math.max(0, panelIds.indexOf(window.location.hash.replace("#", "")));
    let isLocked = false;
    let lockTimer = 0;
    let wheelDelta = 0;
    let wheelTimer = 0;
    let touchStartY = null;
    let touchScrollElement = null;
    let touchScrollTop = 0;

    const getPanelIndex = id => panelIds.indexOf(id);

    const isInteractiveTarget = target => (
      target instanceof Element && Boolean(target.closest(interactiveSelector))
    );

    const getScrollableAncestor = target => {
      let node = target instanceof Element ? target : null;

      while (node && node !== document.body) {
        const style = window.getComputedStyle(node);
        const canScroll = /(auto|scroll)/.test(style.overflowY) && node.scrollHeight > node.clientHeight + 2;

        if (canScroll) return node;
        node = node.parentElement;
      }

      return null;
    };

    const canScrollElement = (element, direction) => {
      if (!element) return false;
      if (direction > 0) return element.scrollTop + element.clientHeight < element.scrollHeight - 2;
      if (direction < 0) return element.scrollTop > 2;
      return false;
    };

    const setPanelFocusability = (panel, isActive) => {
      panel.setAttribute("aria-hidden", String(!isActive));

      if ("inert" in panel) {
        panel.inert = !isActive;
      }

      panel.querySelectorAll(focusableSelector).forEach(element => {
        if (isActive) {
          const originalTabindex = element.dataset.homePanelTabindex;

          if (!originalTabindex) return;
          if (originalTabindex === "none") {
            element.removeAttribute("tabindex");
          } else {
            element.setAttribute("tabindex", originalTabindex);
          }

          delete element.dataset.homePanelTabindex;
          return;
        }

        if (!element.dataset.homePanelTabindex) {
          element.dataset.homePanelTabindex = element.hasAttribute("tabindex")
            ? element.getAttribute("tabindex")
            : "none";
        }

        element.setAttribute("tabindex", "-1");
      });
    };

    const updateHash = (id, replace = false) => {
      const nextHash = `#${id}`;
      if (window.location.hash === nextHash) return;

      const nextUrl = `${window.location.pathname}${window.location.search}${nextHash}`;
      if (replace) {
        window.history.replaceState(null, "", nextUrl);
      } else {
        window.history.pushState(null, "", nextUrl);
      }
    };

    const updatePanels = () => {
      const activePanelId = panelIds[activeIndex] || "";
      const isTeaserActive = activePanelId === "whats-next";
      const showProgress = !isTeaserActive;

      stage.dataset.activeHomePanel = activePanelId;
      document.body.classList.toggle("is-home-panel-teaser-active", isTeaserActive);

      if (progressNav) {
        progressNav.setAttribute("aria-hidden", String(!showProgress));
      }

      if (siteHeader) {
        if (isTeaserActive) {
          siteHeader.setAttribute("aria-hidden", "true");
          if ("inert" in siteHeader) {
            siteHeader.inert = true;
          }
          if (siteHeader.contains(document.activeElement)) {
            document.activeElement.blur();
          }
        } else {
          siteHeader.removeAttribute("aria-hidden");
          if ("inert" in siteHeader) {
            siteHeader.inert = false;
          }
        }
      }

      panels.forEach((panel, index) => {
        const isActive = index === activeIndex;
        panel.classList.toggle("is-active", isActive);
        panel.classList.toggle("is-before", index < activeIndex);
        panel.classList.toggle("is-after", index > activeIndex);
        setPanelFocusability(panel, isActive);
      });

      progressButtons.forEach(button => {
        const isActive = getPanelIndex(button.dataset.homePanelTarget) === activeIndex;
        button.classList.toggle("is-active", isActive);
        if (showProgress) {
          button.removeAttribute("tabindex");
        } else {
          button.setAttribute("tabindex", "-1");
        }
        if (isActive) {
          button.setAttribute("aria-current", "true");
        } else {
          button.removeAttribute("aria-current");
        }
      });

    };

    const startLock = () => {
      isLocked = true;
      window.clearTimeout(lockTimer);
      lockTimer = window.setTimeout(() => {
        isLocked = false;
      }, 900);
    };

    const goToIndex = (nextIndex, options = {}) => {
      const boundedIndex = Math.max(0, Math.min(nextIndex, panels.length - 1));
      if (boundedIndex === activeIndex) return false;
      if (isLocked && !options.force) return false;

      activeIndex = boundedIndex;
      updatePanels();

      if (options.updateHash !== false) {
        updateHash(panelIds[activeIndex], Boolean(options.replaceHash));
      }

      if (!options.force) {
        startLock();
      }

      return true;
    };

    const goToPanel = (id, options = {}) => {
      const nextIndex = getPanelIndex(id);
      if (nextIndex < 0) return false;
      return goToIndex(nextIndex, options);
    };

    progressButtons.forEach(button => {
      button.addEventListener("click", () => {
        goToPanel(button.dataset.homePanelTarget || "");
      });
    });

    window.addEventListener("wheel", event => {
      if (isInteractiveTarget(event.target)) return;

      const direction = Math.sign(event.deltaY);
      const scrollableElement = getScrollableAncestor(event.target);

      if (canScrollElement(scrollableElement, direction)) return;

      event.preventDefault();
      if (isLocked || direction === 0) return;

      wheelDelta += event.deltaY;
      window.clearTimeout(wheelTimer);
      wheelTimer = window.setTimeout(() => {
        wheelDelta = 0;
      }, 180);

      if (Math.abs(wheelDelta) >= 90) {
        const nextDirection = wheelDelta > 0 ? 1 : -1;
        wheelDelta = 0;
        goToIndex(activeIndex + nextDirection);
      }
    }, { passive: false });

    window.addEventListener("keydown", event => {
      if (isInteractiveTarget(document.activeElement)) return;

      const forwardKeys = ["ArrowDown", "PageDown"];
      const backwardKeys = ["ArrowUp", "PageUp"];
      let direction = 0;

      if (forwardKeys.includes(event.key)) direction = 1;
      if (backwardKeys.includes(event.key)) direction = -1;
      if (event.key === " " || event.key === "Spacebar") direction = event.shiftKey ? -1 : 1;
      if (event.key === "Home") direction = -activeIndex;
      if (event.key === "End") direction = footerIndex - activeIndex;

      if (!direction) return;

      event.preventDefault();
      if (direction > 1 || direction < -1) {
        goToIndex(activeIndex + direction);
      } else {
        goToIndex(activeIndex + direction);
      }
    });

    window.addEventListener("touchstart", event => {
      if (isInteractiveTarget(event.target) || !event.changedTouches.length) {
        touchStartY = null;
        return;
      }

      touchStartY = event.changedTouches[0].clientY;
      touchScrollElement = getScrollableAncestor(event.target);
      touchScrollTop = touchScrollElement ? touchScrollElement.scrollTop : 0;
    }, { passive: true });

    window.addEventListener("touchend", event => {
      if (touchStartY === null || !event.changedTouches.length) return;

      const deltaY = touchStartY - event.changedTouches[0].clientY;
      const direction = deltaY > 0 ? 1 : -1;
      const canUseNativeScroll = touchScrollElement && (
        (direction > 0 && touchScrollTop + touchScrollElement.clientHeight < touchScrollElement.scrollHeight - 2) ||
        (direction < 0 && touchScrollTop > 2)
      );

      touchStartY = null;

      if (Math.abs(deltaY) < 54 || canUseNativeScroll) return;
      goToIndex(activeIndex + direction);
    }, { passive: true });

    window.addEventListener("hashchange", () => {
      const hashTarget = window.location.hash.replace("#", "");
      if (getPanelIndex(hashTarget) < 0) return;
      goToPanel(hashTarget, { force: true, updateHash: false });
    });

    updatePanels();
    updateHash(panelIds[activeIndex], true);
  };

  const init = () => {
    revealNodes();
    initHomePanels();
  };

  document.addEventListener("site-header-loaded", () => {
    initHomePanels();
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

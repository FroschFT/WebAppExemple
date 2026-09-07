(function ($) {
  "use strict";

  var sidebar = document.getElementById("accordionSidebar");
  var mobileToggle = document.getElementById("sidebarToggleTop");
  var desktopToggle = document.getElementById("sidebarToggle");
  var mobileClose = document.getElementById("sidebarCloseMobile");
  var backdrop = document.getElementById("sidebarBackdrop");
  var contentWrapper = document.getElementById("content-wrapper");
  var mobileQuery = window.matchMedia("(max-width: 767.98px)");
  var isMobile = mobileQuery.matches;
  var returnFocusAfterClose = false;
  var sidebarStateStorageKey = "sb-admin-sidebar-state";
  var desktopExpandedPreference;

  if (!sidebar || !mobileToggle) {
    return;
  }

  function readDesktopSidebarPreference() {
    try {
      var storedState = window.localStorage.getItem(sidebarStateStorageKey);

      if (storedState === "collapsed") {
        return false;
      }
      if (storedState === "expanded") {
        return true;
      }
    } catch (error) {
      console.warn("Unable to read the saved sidebar state.", error);
    }

    return true;
  }

  function saveDesktopSidebarPreference(expanded) {
    try {
      window.localStorage.setItem(
        sidebarStateStorageKey,
        expanded ? "expanded" : "collapsed"
      );
    } catch (error) {
      console.warn("Unable to save the sidebar state.", error);
    }
  }

  desktopExpandedPreference = readDesktopSidebarPreference();

  function isSidebarExpanded() {
    return !sidebar.classList.contains("toggled");
  }

  function hideSidebarPanels(immediate) {
    var panels = sidebar.querySelectorAll(".collapse.show");

    Array.prototype.forEach.call(panels, function (panel) {
      if (immediate) {
        panel.classList.remove("show");
        syncAccordionPanel(panel, false);
      } else {
        $(panel).collapse("hide");
      }
    });
  }

  function setToggleState(toggle, expanded, expandedLabel, collapsedLabel) {
    if (!toggle) {
      return;
    }

    var label = expanded ? expandedLabel : collapsedLabel;
    toggle.setAttribute("aria-expanded", String(expanded));
    toggle.setAttribute("aria-label", label);
    toggle.setAttribute("title", label);
  }

  function syncSidebarState() {
    var expanded = isSidebarExpanded();

    setToggleState(
      mobileToggle,
      expanded,
      "Close navigation",
      "Open navigation"
    );
    setToggleState(
      desktopToggle,
      expanded,
      "Collapse navigation",
      "Expand navigation"
    );
    setToggleState(
      mobileClose,
      expanded,
      "Close navigation",
      "Open navigation"
    );

    if (isMobile && !expanded) {
      sidebar.setAttribute("aria-hidden", "true");
      sidebar.setAttribute("inert", "");
    } else {
      sidebar.removeAttribute("aria-hidden");
      sidebar.removeAttribute("inert");
    }

    var mobileOpen = isMobile && expanded;
    document.body.classList.toggle("sidebar-mobile-open", mobileOpen);

    if (backdrop) {
      backdrop.hidden = !mobileOpen;
    }

    if (contentWrapper) {
      if (mobileOpen) {
        contentWrapper.setAttribute("aria-hidden", "true");
        contentWrapper.setAttribute("inert", "");
      } else {
        contentWrapper.removeAttribute("aria-hidden");
        contentWrapper.removeAttribute("inert");
      }
    }

    if (!expanded && returnFocusAfterClose) {
      mobileToggle.focus();
      returnFocusAfterClose = false;
    }
  }

  function syncAccordionPanel(panel, expanded) {
    var toggle = document.querySelector(
      '[aria-controls="' + panel.id + '"]'
    );

    if (!toggle || !toggle.classList.contains("sidebar-collapse-toggle")) {
      return;
    }

    toggle.setAttribute("aria-expanded", String(expanded));
    toggle.classList.toggle("collapsed", !expanded);
  }

  function syncAccordionState() {
    var panels = sidebar.querySelectorAll(".collapse[id]");

    Array.prototype.forEach.call(panels, function (panel) {
      syncAccordionPanel(panel, panel.classList.contains("show"));
    });
  }

  function setSidebarExpanded(expanded, immediate) {
    document.body.classList.toggle("sidebar-toggled", !expanded);
    sidebar.classList.toggle("toggled", !expanded);

    if (!expanded) {
      hideSidebarPanels(Boolean(immediate));
    }

    syncSidebarState();
  }

  function syncAfterVendorToggle() {
    window.requestAnimationFrame(function () {
      syncSidebarState();

      if (isMobile && isSidebarExpanded() && mobileClose) {
        mobileClose.focus();
      }
    });
  }

  mobileToggle.addEventListener("click", syncAfterVendorToggle);

  if (desktopToggle) {
    desktopToggle.addEventListener("click", function () {
      window.requestAnimationFrame(function () {
        desktopExpandedPreference = isSidebarExpanded();
        saveDesktopSidebarPreference(desktopExpandedPreference);
        syncSidebarState();
      });
    });
  }

  if (mobileClose) {
    mobileClose.addEventListener("click", function () {
      returnFocusAfterClose = true;
      mobileToggle.click();
    });
  }

  if (backdrop) {
    backdrop.addEventListener("click", function () {
      returnFocusAfterClose = true;
      mobileToggle.click();
    });
  }

  $(sidebar).find(".collapse").on("shown.bs.collapse", function () {
    syncAccordionPanel(this, true);
  });

  $(sidebar).find(".collapse").on("hidden.bs.collapse", function () {
    syncAccordionPanel(this, false);
  });

  document.addEventListener("keydown", function (event) {
    if (event.key !== "Escape") {
      return;
    }

    if (isMobile && isSidebarExpanded()) {
      returnFocusAfterClose = true;
      mobileToggle.click();
      return;
    }

    if (!isMobile && !isSidebarExpanded()) {
      var openPanel = sidebar.querySelector(".collapse.show");

      if (!openPanel) {
        return;
      }

      var panelToggle = sidebar.querySelector(
        '[aria-controls="' + openPanel.id + '"]'
      );

      hideSidebarPanels(false);

      if (panelToggle) {
        panelToggle.focus();
      }
    }
  });

  document.addEventListener("click", function (event) {
    if (isMobile) {
      if (
        !isSidebarExpanded() ||
        sidebar.contains(event.target) ||
        mobileToggle.contains(event.target)
      ) {
        return;
      }

      mobileToggle.click();
      return;
    }

    if (
      isSidebarExpanded() ||
      event.target.closest(".sidebar-collapse-toggle") ||
      event.target.closest(".sidebar .collapse.show")
    ) {
      return;
    }

    hideSidebarPanels(false);
  });

  window.addEventListener("resize", function () {
    var nextIsMobile = mobileQuery.matches;

    if (nextIsMobile === isMobile) {
      return;
    }

    isMobile = nextIsMobile;

    if (isMobile) {
      setSidebarExpanded(false, true);
    } else {
      setSidebarExpanded(desktopExpandedPreference, true);
    }
  });

  if (isMobile) {
    setSidebarExpanded(false, true);
  } else {
    setSidebarExpanded(desktopExpandedPreference, true);
  }

  syncAccordionState();
})(jQuery);

(function () {
  "use strict";

  var storageKey = "sb-admin-theme";
  var darkTheme = "dark";
  var lightTheme = "light";
  var root = document.documentElement;

  function isValidTheme(theme) {
    return theme === darkTheme || theme === lightTheme;
  }

  function getStoredTheme() {
    try {
      var theme = window.localStorage.getItem(storageKey);
      return isValidTheme(theme) ? theme : null;
    } catch (error) {
      console.warn("Unable to read the saved color theme.", error);
      return null;
    }
  }

  function storeTheme(theme) {
    try {
      window.localStorage.setItem(storageKey, theme);
    } catch (error) {
      console.warn("Unable to save the selected color theme.", error);
    }
  }

  function getSystemTheme() {
    if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
      return darkTheme;
    }

    return lightTheme;
  }

  function applyTheme(theme) {
    root.setAttribute("data-theme", theme);
  }

  function updateToggle() {
    var toggle = document.getElementById("themeToggle");

    if (!toggle) {
      return;
    }

    var isDark = root.getAttribute("data-theme") === darkTheme;
    var label = isDark ? "Switch to light mode" : "Switch to dark mode";

    toggle.setAttribute("aria-label", label);
    toggle.setAttribute("aria-pressed", String(isDark));
    toggle.setAttribute("title", label);
  }

  applyTheme(getStoredTheme() || getSystemTheme());

  document.addEventListener("DOMContentLoaded", function () {
    var toggle = document.getElementById("themeToggle");

    updateToggle();

    if (toggle) {
      toggle.addEventListener("click", function () {
        var theme = root.getAttribute("data-theme") === darkTheme ? lightTheme : darkTheme;

        applyTheme(theme);
        storeTheme(theme);
        updateToggle();
      });
    }

    if (window.matchMedia) {
      var systemTheme = window.matchMedia("(prefers-color-scheme: dark)");
      var handleSystemThemeChange = function (event) {
        if (!getStoredTheme()) {
          applyTheme(event.matches ? darkTheme : lightTheme);
          updateToggle();
        }
      };

      if (systemTheme.addEventListener) {
        systemTheme.addEventListener("change", handleSystemThemeChange);
      } else if (systemTheme.addListener) {
        systemTheme.addListener(handleSystemThemeChange);
      }
    }
  });

  window.addEventListener("storage", function (event) {
    if (event.key !== storageKey) {
      return;
    }

    applyTheme(isValidTheme(event.newValue) ? event.newValue : getSystemTheme());
    updateToggle();
  });
})();

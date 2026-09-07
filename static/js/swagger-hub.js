(function () {
  "use strict";

  var page = document.querySelector(".swagger-page");

  if (!page) {
    return;
  }

  var searchInput = document.getElementById("apiSearch");
  var clearSearchButton = document.getElementById("clearApiSearch");
  var environmentFilter = document.getElementById("apiEnvironmentFilter");
  var statusFilter = document.getElementById("apiStatusFilter");
  var clearFiltersButton = document.getElementById("clearApiFilters");
  var resultCount = document.getElementById("apiResultCount");
  var resultLabel = document.getElementById("apiResultLabel");
  var emptyState = document.getElementById("apiEmptyState");
  var serviceCards = page.querySelectorAll("[data-api-service]");
  var screenReaderStatus = document.getElementById("swaggerScreenReaderStatus");
  var copyStatus = document.getElementById("swaggerCopyStatus");
  var copyStatusTimer;

  function updateCatalog() {
    var query = searchInput.value.trim().toLowerCase();
    var environment = environmentFilter.value;
    var status = statusFilter.value;
    var visibleCount = 0;

    Array.prototype.forEach.call(serviceCards, function (card) {
      var searchValue = card.getAttribute("data-api-search").toLowerCase();
      var matchesQuery = !query || searchValue.indexOf(query) !== -1;
      var matchesEnvironment = environment === "all" ||
        card.getAttribute("data-api-environment") === environment;
      var matchesStatus = status === "all" ||
        card.getAttribute("data-api-status") === status;
      var isVisible = matchesQuery && matchesEnvironment && matchesStatus;

      card.hidden = !isVisible;

      if (isVisible) {
        visibleCount += 1;
      }
    });

    resultCount.textContent = visibleCount;
    resultLabel.textContent =
      "service" + (visibleCount === 1 ? "" : "s") + " shown";
    clearSearchButton.hidden = query.length === 0;
    emptyState.hidden = visibleCount !== 0;
    screenReaderStatus.textContent =
      visibleCount + " API service" + (visibleCount === 1 ? "" : "s") + " shown.";
  }

  function clearFilters() {
    searchInput.value = "";
    environmentFilter.value = "all";
    statusFilter.value = "all";
    updateCatalog();
    searchInput.focus();
  }

  function fallbackCopy(value) {
    return new Promise(function (resolve, reject) {
      var textArea = document.createElement("textarea");
      var copied;

      textArea.value = value;
      textArea.setAttribute("readonly", "");
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.select();

      try {
        copied = document.execCommand("copy");
      } catch (error) {
        textArea.remove();
        reject(error);
        return;
      }

      textArea.remove();

      if (copied) {
        resolve();
      } else {
        reject(new Error("The browser did not copy the value."));
      }
    });
  }

  function copyValue(value) {
    if (
      window.isSecureContext &&
      navigator.clipboard &&
      typeof navigator.clipboard.writeText === "function"
    ) {
      return navigator.clipboard.writeText(value);
    }

    return fallbackCopy(value);
  }

  function showCopyStatus(message) {
    if (!copyStatus) {
      return;
    }

    window.clearTimeout(copyStatusTimer);
    copyStatus.textContent = message;
    copyStatusTimer = window.setTimeout(function () {
      copyStatus.textContent = "";
    }, 2500);
  }

  if (serviceCards.length > 0) {
    searchInput.addEventListener("input", updateCatalog);
    environmentFilter.addEventListener("change", updateCatalog);
    statusFilter.addEventListener("change", updateCatalog);
    clearFiltersButton.addEventListener("click", clearFilters);
    clearSearchButton.addEventListener("click", function () {
      searchInput.value = "";
      updateCatalog();
      searchInput.focus();
    });

    searchInput.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && searchInput.value) {
        event.preventDefault();
        searchInput.value = "";
        updateCatalog();
      }
    });
  }

  page.addEventListener("click", function (event) {
    var copyButton = event.target.closest("[data-copy-value]");

    if (!copyButton || !page.contains(copyButton)) {
      return;
    }

    copyValue(copyButton.getAttribute("data-copy-value")).then(function () {
      showCopyStatus("Copied to clipboard.");
    }).catch(function (error) {
      console.error("Unable to copy the API URL.", error);
      showCopyStatus("Copy failed. Select the URL and copy it manually.");
    });
  });
})();

(function () {
  "use strict";

  var page = document.querySelector(".mcp-page");

  if (!page) {
    return;
  }

  var searchInput = document.getElementById("mcpSearch");
  var clearSearchButton = document.getElementById("clearMcpSearch");
  var transportFilter = document.getElementById("mcpTransportFilter");
  var statusFilter = document.getElementById("mcpStatusFilter");
  var clearFiltersButton = document.getElementById("clearMcpFilters");
  var toggleToolsButton = document.getElementById("toggleAllMcpTools");
  var toggleToolsLabel = toggleToolsButton.querySelector("span");
  var resultCount = document.getElementById("mcpResultCount");
  var resultLabel = document.getElementById("mcpResultLabel");
  var emptyState = document.getElementById("mcpEmptyState");
  var screenReaderStatus = document.getElementById("mcpScreenReaderStatus");
  var serverCards = page.querySelectorAll("[data-mcp-example]");

  function getVisibleToolDetails() {
    return Array.prototype.filter.call(
      page.querySelectorAll(".mcp-tool-details"),
      function (details) {
        return !details.closest("[data-mcp-example]").hidden;
      }
    );
  }

  function updateExpandButton() {
    var visibleDetails = getVisibleToolDetails();
    var allExpanded = visibleDetails.length > 0 &&
      visibleDetails.every(function (details) {
        return details.open;
      });

    toggleToolsButton.setAttribute("aria-pressed", String(allExpanded));
    toggleToolsLabel.textContent = allExpanded ? "Collapse tools" : "Expand tools";
    toggleToolsButton.title = toggleToolsLabel.textContent;
  }

  function updateCatalog() {
    var query = searchInput.value.trim().toLowerCase();
    var transport = transportFilter.value;
    var status = statusFilter.value;
    var visibleCount = 0;

    Array.prototype.forEach.call(serverCards, function (card) {
      var searchValue = card.getAttribute("data-mcp-search").toLowerCase();
      var matchesQuery = !query || searchValue.indexOf(query) !== -1;
      var matchesTransport = transport === "all" ||
        card.getAttribute("data-mcp-transport") === transport;
      var matchesStatus = status === "all" ||
        card.getAttribute("data-mcp-status") === status;
      var isVisible = matchesQuery && matchesTransport && matchesStatus;

      card.hidden = !isVisible;

      if (isVisible) {
        visibleCount += 1;
      }
    });

    resultCount.textContent = visibleCount;
    resultLabel.textContent =
      "example" + (visibleCount === 1 ? "" : "s") + " shown";
    clearSearchButton.hidden = query.length === 0;
    emptyState.hidden = visibleCount !== 0;
    screenReaderStatus.textContent =
      visibleCount + " MCP example" + (visibleCount === 1 ? "" : "s") + " shown.";
    updateExpandButton();
  }

  function clearFilters() {
    searchInput.value = "";
    transportFilter.value = "all";
    statusFilter.value = "all";
    updateCatalog();
    searchInput.focus();
  }

  searchInput.addEventListener("input", updateCatalog);
  transportFilter.addEventListener("change", updateCatalog);
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

  toggleToolsButton.addEventListener("click", function () {
    var visibleDetails = getVisibleToolDetails();
    var shouldExpand = visibleDetails.some(function (details) {
      return !details.open;
    });

    visibleDetails.forEach(function (details) {
      details.open = shouldExpand;
    });
    updateExpandButton();
  });

  page.addEventListener("toggle", function (event) {
    if (event.target.matches(".mcp-tool-details")) {
      updateExpandButton();
    }
  }, true);

  updateExpandButton();
})();

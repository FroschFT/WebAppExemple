(function () {
  "use strict";

  var canvas = document.getElementById("myRadarChart");

  if (!canvas || typeof Chart === "undefined") {
    return;
  }

  function getThemeColors() {
    var isDark = document.documentElement.getAttribute("data-theme") === "dark";

    return {
      text: isDark ? "#cbd5e1" : "#858796",
      grid: isDark ? "rgba(148, 163, 184, 0.28)" : "rgba(133, 135, 150, 0.25)",
      tooltipBackground: isDark ? "#1f2937" : "#ffffff",
      tooltipText: isDark ? "#f1f5f9" : "#5a5c69",
      tooltipBorder: isDark ? "#3b475a" : "#dddfeb"
    };
  }

  var themeColors = getThemeColors();
  var myRadarChart = new Chart(canvas, {
    type: "radar",
    data: {
      labels: [
        "Performance",
        "Reliability",
        "Usability",
        "Test coverage",
        "Security",
        "Maintainability"
      ],
      datasets: [
        {
          label: "Current release",
          data: [78, 86, 72, 68, 82, 74],
          backgroundColor: "rgba(78, 115, 223, 0.2)",
          borderColor: "#4e73df",
          borderWidth: 2,
          pointBackgroundColor: "#4e73df",
          pointBorderColor: "#ffffff",
          pointHoverBackgroundColor: "#ffffff",
          pointHoverBorderColor: "#4e73df",
          pointRadius: 3,
          pointHoverRadius: 4
        },
        {
          label: "Target profile",
          data: [90, 90, 90, 90, 90, 90],
          backgroundColor: "rgba(28, 200, 138, 0.12)",
          borderColor: "#1cc88a",
          borderDash: [5, 4],
          borderWidth: 2,
          pointBackgroundColor: "#1cc88a",
          pointBorderColor: "#ffffff",
          pointHoverBackgroundColor: "#ffffff",
          pointHoverBorderColor: "#1cc88a",
          pointRadius: 3,
          pointHoverRadius: 4
        }
      ]
    },
    options: {
      maintainAspectRatio: false,
      responsive: true,
      layout: {
        padding: {
          left: 10,
          right: 10,
          top: 5,
          bottom: 5
        }
      },
      legend: {
        position: "bottom",
        labels: {
          boxWidth: 12,
          fontColor: themeColors.text,
          padding: 16,
          usePointStyle: true
        }
      },
      scale: {
        angleLines: {
          color: themeColors.grid
        },
        gridLines: {
          color: themeColors.grid
        },
        pointLabels: {
          fontColor: themeColors.text,
          fontSize: 11
        },
        ticks: {
          beginAtZero: true,
          display: true,
          fontColor: themeColors.text,
          max: 100,
          min: 0,
          showLabelBackdrop: false,
          stepSize: 20
        }
      },
      tooltips: {
        backgroundColor: themeColors.tooltipBackground,
        bodyFontColor: themeColors.tooltipText,
        borderColor: themeColors.tooltipBorder,
        borderWidth: 1,
        caretPadding: 8,
        displayColors: true,
        titleFontColor: themeColors.tooltipText,
        xPadding: 12,
        yPadding: 10,
        callbacks: {
          label: function (tooltipItem, data) {
            var dataset = data.datasets[tooltipItem.datasetIndex];

            return dataset.label + ": " + tooltipItem.yLabel + "/100";
          }
        }
      }
    }
  });

  function updateChartTheme() {
    var colors = getThemeColors();
    var scale = myRadarChart.options.scale;
    var tooltips = myRadarChart.options.tooltips;

    myRadarChart.options.legend.labels.fontColor = colors.text;
    scale.angleLines.color = colors.grid;
    scale.gridLines.color = colors.grid;
    scale.pointLabels.fontColor = colors.text;
    scale.ticks.fontColor = colors.text;
    tooltips.backgroundColor = colors.tooltipBackground;
    tooltips.bodyFontColor = colors.tooltipText;
    tooltips.borderColor = colors.tooltipBorder;
    tooltips.titleFontColor = colors.tooltipText;
    myRadarChart.update();
  }

  if (typeof MutationObserver !== "undefined") {
    new MutationObserver(function (mutations) {
      var themeChanged = mutations.some(function (mutation) {
        return mutation.attributeName === "data-theme";
      });

      if (themeChanged) {
        updateChartTheme();
      }
    }).observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"]
    });
  }

  window.myRadarChart = myRadarChart;
})();

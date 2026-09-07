(function () {
  "use strict";

  var form = document.getElementById("exampleRequestForm");

  if (!form) {
    return;
  }

  var maxFileCount = 5;
  var maxFileSize = 10 * 1024 * 1024;
  var titleInput = document.getElementById("requestTitle");
  var calendarPanel = document.querySelector(".calendar-panel");
  var calendarGrid = document.getElementById("calendarGrid");
  var calendarMonthLabel = document.getElementById("calendarMonthLabel");
  var previousMonthButton = document.getElementById("previousMonth");
  var nextMonthButton = document.getElementById("nextMonth");
  var todayButton = document.getElementById("selectToday");
  var selectedDateInput = document.getElementById("selectedDate");
  var selectedDateLabel = document.getElementById("selectedDateLabel");
  var calendarError = document.getElementById("calendarError");
  var dropZone = document.getElementById("fileDropZone");
  var fileInput = document.getElementById("fileInput");
  var browseFilesButton = document.getElementById("browseFiles");
  var selectedFileList = document.getElementById("selectedFileList");
  var fileUploadError = document.getElementById("fileUploadError");
  var demoStatus = document.getElementById("formDemoStatus");
  var demoStatusText = document.getElementById("formDemoStatusText");
  var today = startOfDay(new Date());
  var visibleMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  var selectedDate = null;
  var selectedFiles = [];
  var dragDepth = 0;

  function startOfDay(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  function padNumber(value) {
    return String(value).padStart(2, "0");
  }

  function toIsoDate(date) {
    return date.getFullYear() + "-" +
      padNumber(date.getMonth() + 1) + "-" +
      padNumber(date.getDate());
  }

  function fromIsoDate(value) {
    var parts = value.split("-").map(Number);

    return new Date(parts[0], parts[1] - 1, parts[2]);
  }

  function isSameDate(firstDate, secondDate) {
    return firstDate &&
      secondDate &&
      firstDate.getFullYear() === secondDate.getFullYear() &&
      firstDate.getMonth() === secondDate.getMonth() &&
      firstDate.getDate() === secondDate.getDate();
  }

  function formatMonth(date) {
    return new Intl.DateTimeFormat([], {
      month: "long",
      year: "numeric"
    }).format(date);
  }

  function formatFullDate(date) {
    return new Intl.DateTimeFormat([], {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric"
    }).format(date);
  }

  function getDaysInMonth(date) {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  }

  function createEmptyCalendarCell() {
    var emptyCell = document.createElement("span");

    emptyCell.className = "calendar-empty";
    emptyCell.setAttribute("aria-hidden", "true");
    return emptyCell;
  }

  function createCalendarDay(date) {
    var dayButton = document.createElement("button");
    var isToday = isSameDate(date, today);
    var isSelected = isSameDate(date, selectedDate);

    dayButton.type = "button";
    dayButton.className = "calendar-day";
    dayButton.textContent = date.getDate();
    dayButton.setAttribute("data-calendar-date", toIsoDate(date));
    dayButton.setAttribute("role", "gridcell");
    dayButton.setAttribute("aria-label", formatFullDate(date));
    dayButton.setAttribute("aria-selected", String(isSelected));

    if (isToday) {
      dayButton.classList.add("is-today");
      dayButton.setAttribute("aria-current", "date");
    }

    if (isSelected) {
      dayButton.classList.add("is-selected");
    }

    return dayButton;
  }

  function renderCalendar(focusDate) {
    var firstDayOffset = new Date(
      visibleMonth.getFullYear(),
      visibleMonth.getMonth(),
      1
    ).getDay();
    var daysInMonth = getDaysInMonth(visibleMonth);

    calendarGrid.textContent = "";
    calendarMonthLabel.textContent = formatMonth(visibleMonth);

    for (var emptyIndex = 0; emptyIndex < firstDayOffset; emptyIndex += 1) {
      calendarGrid.appendChild(createEmptyCalendarCell());
    }

    for (var day = 1; day <= daysInMonth; day += 1) {
      calendarGrid.appendChild(createCalendarDay(new Date(
        visibleMonth.getFullYear(),
        visibleMonth.getMonth(),
        day
      )));
    }

    while (calendarGrid.children.length < 42) {
      calendarGrid.appendChild(createEmptyCalendarCell());
    }

    if (focusDate) {
      window.requestAnimationFrame(function () {
        var dayToFocus = calendarGrid.querySelector(
          "[data-calendar-date=\"" + toIsoDate(focusDate) + "\"]"
        );

        if (dayToFocus) {
          dayToFocus.focus();
        }
      });
    }
  }

  function selectDate(date, focusDate) {
    selectedDate = startOfDay(date);
    visibleMonth = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      1
    );
    selectedDateInput.value = toIsoDate(selectedDate);
    selectedDateLabel.textContent = formatFullDate(selectedDate);
    calendarError.hidden = true;
    calendarPanel.classList.remove("has-error");
    demoStatus.hidden = true;
    renderCalendar(focusDate ? selectedDate : null);
  }

  function changeVisibleMonth(offset) {
    visibleMonth = new Date(
      visibleMonth.getFullYear(),
      visibleMonth.getMonth() + offset,
      1
    );
    renderCalendar();
  }

  function moveSelectedDate(dayOffset) {
    var baseDate = selectedDate || today;
    var nextDate = new Date(
      baseDate.getFullYear(),
      baseDate.getMonth(),
      baseDate.getDate() + dayOffset
    );

    selectDate(nextDate, true);
  }

  function formatFileSize(size) {
    if (size < 1024) {
      return size + " B";
    }

    if (size < 1024 * 1024) {
      return (size / 1024).toFixed(1) + " KB";
    }

    return (size / (1024 * 1024)).toFixed(1) + " MB";
  }

  function getFileKey(file) {
    return [file.name, file.size, file.lastModified].join(":");
  }

  function getFileIcon(file) {
    if (file.type.indexOf("image/") === 0) {
      return "fas fa-file-image";
    }

    if (file.type === "application/pdf") {
      return "fas fa-file-pdf";
    }

    return "fas fa-file-alt";
  }

  function createFileListItem(file, index) {
    var listItem = document.createElement("li");
    var icon = document.createElement("span");
    var iconGlyph = document.createElement("i");
    var copy = document.createElement("span");
    var name = document.createElement("span");
    var size = document.createElement("span");
    var removeButton = document.createElement("button");
    var removeIcon = document.createElement("i");

    listItem.className = "file-list-item";
    icon.className = "file-list-icon";
    icon.setAttribute("aria-hidden", "true");
    iconGlyph.className = getFileIcon(file);
    copy.className = "file-list-copy";
    name.className = "file-list-name";
    name.textContent = file.name;
    size.className = "file-list-size";
    size.textContent = formatFileSize(file.size);
    removeButton.type = "button";
    removeButton.className = "file-remove-button";
    removeButton.setAttribute("data-file-index", String(index));
    removeButton.setAttribute("aria-label", "Remove " + file.name);
    removeButton.title = "Remove file";
    removeIcon.className = "fas fa-times";
    removeIcon.setAttribute("aria-hidden", "true");

    icon.appendChild(iconGlyph);
    copy.appendChild(name);
    copy.appendChild(size);
    removeButton.appendChild(removeIcon);
    listItem.appendChild(icon);
    listItem.appendChild(copy);
    listItem.appendChild(removeButton);

    return listItem;
  }

  function renderFiles() {
    selectedFileList.textContent = "";

    selectedFiles.forEach(function (file, index) {
      selectedFileList.appendChild(createFileListItem(file, index));
    });
  }

  function showFileError(message) {
    fileUploadError.textContent = message;
    fileUploadError.hidden = !message;
  }

  function addFiles(files) {
    var filesToAdd = Array.prototype.slice.call(files);
    var existingFileKeys = selectedFiles.map(getFileKey);
    var errors = [];

    filesToAdd.forEach(function (file) {
      var fileKey = getFileKey(file);

      if (selectedFiles.length >= maxFileCount) {
        if (errors.indexOf("You can select up to 5 files.") === -1) {
          errors.push("You can select up to 5 files.");
        }
        return;
      }

      if (file.size > maxFileSize) {
        errors.push(file.name + " is larger than 10 MB.");
        return;
      }

      if (existingFileKeys.indexOf(fileKey) !== -1) {
        errors.push(file.name + " is already selected.");
        return;
      }

      selectedFiles.push(file);
      existingFileKeys.push(fileKey);
    });

    renderFiles();
    showFileError(errors.join(" "));
    fileInput.value = "";
    demoStatus.hidden = true;
  }

  function removeFile(index) {
    if (index < 0 || index >= selectedFiles.length) {
      console.error("Unable to remove an unknown selected file.");
      return;
    }

    selectedFiles.splice(index, 1);
    renderFiles();
    showFileError("");
    demoStatus.hidden = true;
  }

  function resetDemoState() {
    selectedDate = null;
    visibleMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    selectedFiles = [];
    selectedDateInput.value = "";
    selectedDateLabel.textContent = "No date selected";
    calendarError.hidden = true;
    calendarPanel.classList.remove("has-error");
    fileInput.value = "";
    showFileError("");
    renderFiles();
    renderCalendar();
    form.classList.remove("was-validated");
    demoStatus.hidden = true;
  }

  calendarGrid.addEventListener("click", function (event) {
    var dayButton = event.target.closest("[data-calendar-date]");

    if (dayButton && calendarGrid.contains(dayButton)) {
      selectDate(
        fromIsoDate(dayButton.getAttribute("data-calendar-date")),
        true
      );
    }
  });

  calendarGrid.addEventListener("keydown", function (event) {
    if (!event.target.matches("[data-calendar-date]")) {
      return;
    }

    var dayOffsets = {
      ArrowLeft: -1,
      ArrowRight: 1,
      ArrowUp: -7,
      ArrowDown: 7
    };

    if (Object.prototype.hasOwnProperty.call(dayOffsets, event.key)) {
      event.preventDefault();
      selectedDate = fromIsoDate(
        event.target.getAttribute("data-calendar-date")
      );
      moveSelectedDate(dayOffsets[event.key]);
    }
  });

  previousMonthButton.addEventListener("click", function () {
    changeVisibleMonth(-1);
  });

  nextMonthButton.addEventListener("click", function () {
    changeVisibleMonth(1);
  });

  todayButton.addEventListener("click", function () {
    selectDate(today, true);
  });

  browseFilesButton.addEventListener("click", function () {
    fileInput.click();
  });

  fileInput.addEventListener("change", function () {
    addFiles(fileInput.files);
  });

  dropZone.addEventListener("dragenter", function (event) {
    event.preventDefault();
    dragDepth += 1;
    dropZone.classList.add("is-dragging");
  });

  dropZone.addEventListener("dragover", function (event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  });

  dropZone.addEventListener("dragleave", function (event) {
    event.preventDefault();
    dragDepth = Math.max(0, dragDepth - 1);

    if (dragDepth === 0) {
      dropZone.classList.remove("is-dragging");
    }
  });

  dropZone.addEventListener("drop", function (event) {
    event.preventDefault();
    dragDepth = 0;
    dropZone.classList.remove("is-dragging");
    addFiles(event.dataTransfer.files);
  });

  selectedFileList.addEventListener("click", function (event) {
    var removeButton = event.target.closest("[data-file-index]");

    if (removeButton && selectedFileList.contains(removeButton)) {
      removeFile(Number(removeButton.getAttribute("data-file-index")));
    }
  });

  Array.prototype.forEach.call(
    form.querySelectorAll(".form-control"),
    function (field) {
      field.addEventListener("input", function () {
        demoStatus.hidden = true;
      });
      field.addEventListener("change", function () {
        demoStatus.hidden = true;
      });
    }
  );

  form.addEventListener("reset", function () {
    window.setTimeout(resetDemoState, 0);
  });

  form.addEventListener("submit", function (event) {
    var fieldsAreValid;
    var dateIsValid;

    event.preventDefault();
    form.classList.add("was-validated");
    demoStatus.hidden = true;
    fieldsAreValid = form.checkValidity();
    dateIsValid = selectedDate !== null;
    calendarError.hidden = dateIsValid;
    calendarPanel.classList.toggle("has-error", !dateIsValid);

    if (!fieldsAreValid) {
      form.reportValidity();
    }

    if (fieldsAreValid && !dateIsValid) {
      calendarGrid.setAttribute("tabindex", "-1");
      calendarGrid.focus();
    }

    if (!fieldsAreValid || !dateIsValid) {
      return;
    }

    showFileError("");
    demoStatusText.textContent =
      "Validated \"" + titleInput.value.trim() + "\" for " +
      formatFullDate(selectedDate) + " with " +
      selectedFiles.length + " attachment" +
      (selectedFiles.length === 1 ? "" : "s") +
      ". No data was sent.";
    demoStatus.hidden = false;
  });

  renderCalendar();
})();

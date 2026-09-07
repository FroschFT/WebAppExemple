(function () {
  "use strict";

  var app = document.getElementById("agentApp");
  var dataElement = document.getElementById("agentSessionData");

  if (!app || !dataElement) {
    return;
  }

  var initialSessions;

  try {
    initialSessions = JSON.parse(dataElement.textContent);
  } catch (error) {
    console.error("Unable to load the agent session data.", error);
    return;
  }

  if (!Array.isArray(initialSessions) || initialSessions.length === 0) {
    console.error("The agent session data is missing or invalid.");
    return;
  }

  var sessionStorageKey = "sb-admin-agent-sessions";
  var selectionStorageKey = "sb-admin-agent-selection";
  var maxSessions = 50;
  var maxMessagesPerSession = 100;
  var maxMessageLength = 10000;
  var agentConfigured = app.getAttribute("data-agent-configured") === "true";
  var responseUrl = app.getAttribute("data-response-url");
  var sessionList = document.getElementById("agentSessionList");
  var sessionCount = document.getElementById("agentSessionCount");
  var sessionSearch = document.getElementById("agentSessionSearch");
  var clearSessionSearch = document.getElementById("clearAgentSessionSearch");
  var sessionNoResults = document.getElementById("agentSessionNoResults");
  var newSessionButton = document.getElementById("newAgentSession");
  var backButton = document.getElementById("agentBackButton");
  var activeSessionTitle = document.getElementById("activeAgentSessionTitle");
  var messageFeed = document.getElementById("agentMessageFeed");
  var messageForm = document.getElementById("agentMessageForm");
  var messageInput = document.getElementById("agentMessageInput");
  var sendMessageButton = document.getElementById("sendAgentMessage");
  var screenReaderStatus = document.getElementById("agentScreenReaderStatus");
  var activeSessionMenuButton = document.getElementById("activeAgentSessionMenu");
  var renameActiveSessionButton = document.getElementById("renameActiveAgentSession");
  var deleteActiveSessionButton = document.getElementById("deleteActiveAgentSession");
  var renameSessionForm = document.getElementById("renameAgentSessionForm");
  var renameSessionInput = document.getElementById("renameAgentSessionInput");
  var deleteSessionName = document.getElementById("deleteAgentSessionName");
  var confirmDeleteSessionButton = document.getElementById("confirmDeleteAgentSession");
  var sessions = loadStoredSessions() || normalizeSessions(initialSessions);
  var activeSessionId = getInitialSessionId();
  var respondingSessionId = null;
  var responseErrorsBySession = {};
  var sessionActionTargetId = null;

  function getStoredValue(key) {
    try {
      return window.localStorage.getItem(key);
    } catch (error) {
      console.warn("Unable to read saved agent session data.", error);
      return null;
    }
  }

  function setStoredValue(key, value) {
    try {
      window.localStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.warn("Unable to save agent session data in this browser.", error);
      return false;
    }
  }

  function normalizeMessages(messages) {
    if (!Array.isArray(messages)) {
      return [];
    }

    return messages.filter(function (message) {
      return message &&
        (message.role === "user" || message.role === "assistant") &&
        typeof message.content === "string" &&
        message.content.trim().length > 0 &&
        message.content.length <= maxMessageLength &&
        typeof message.time === "string";
    }).slice(-maxMessagesPerSession).map(function (message) {
      return {
        role: message.role,
        content: message.content,
        time: message.time
      };
    });
  }

  function normalizeSessions(candidateSessions) {
    var seenSessionIds = {};

    if (!Array.isArray(candidateSessions)) {
      return [];
    }

    return candidateSessions.filter(function (session) {
      var isValid = session &&
        typeof session.id === "string" &&
        /^[A-Za-z0-9][A-Za-z0-9_-]{0,99}$/.test(session.id) &&
        !seenSessionIds[session.id] &&
        typeof session.title === "string" &&
        session.title.trim().length > 0 &&
        typeof session.preview === "string" &&
        typeof session.time === "string" &&
        typeof session.date_label === "string";

      if (isValid) {
        seenSessionIds[session.id] = true;
      }

      return isValid;
    }).slice(0, maxSessions).map(function (session) {
      var messages = normalizeMessages(session.messages);
      var title = session.title.trim().slice(0, 80);

      return {
        id: session.id,
        title: title,
        preview: session.preview.slice(0, 1000),
        time: session.time.slice(0, 100),
        date_label: session.date_label.slice(0, 100),
        messages: messages,
        is_untitled: session.is_untitled === true ||
          (title === "New session" && messages.length === 0)
      };
    });
  }

  function loadStoredSessions() {
    var storedSessions = getStoredValue(sessionStorageKey);
    var parsedSessions;
    var normalizedSessions;

    if (!storedSessions) {
      return null;
    }

    try {
      parsedSessions = JSON.parse(storedSessions);
    } catch (error) {
      console.warn("Ignoring invalid saved agent sessions.", error);
      return null;
    }

    normalizedSessions = normalizeSessions(parsedSessions);

    if (normalizedSessions.length === 0) {
      console.warn("Ignoring saved agent sessions with an invalid format.");
      return null;
    }

    return normalizedSessions;
  }

  function saveSessions() {
    setStoredValue(sessionStorageKey, JSON.stringify(sessions));
  }

  function getSession(sessionId) {
    return sessions.find(function (session) {
      return session.id === sessionId;
    });
  }

  function getInitialSessionId() {
    var storedSessionId = getStoredValue(selectionStorageKey);
    var storedSessionExists = sessions.some(function (session) {
      return session.id === storedSessionId;
    });

    if (storedSessionExists) {
      return storedSessionId;
    }

    return app.getAttribute("data-active-session");
  }

  function createSessionActionButton(session, action, iconClass, label, modalId) {
    var button = document.createElement("button");
    var icon = document.createElement("i");

    button.type = "button";
    button.className = "dropdown-item agent-session-action";
    button.setAttribute("data-agent-session-action", action);
    button.setAttribute("data-session-id", session.id);
    button.setAttribute("data-toggle", "modal");
    button.setAttribute("data-target", modalId);

    if (action === "delete") {
      button.classList.add("agent-session-action--delete");
    }

    icon.className = iconClass + " fa-sm fa-fw mr-2";
    icon.setAttribute("aria-hidden", "true");
    button.appendChild(icon);
    button.appendChild(document.createTextNode(label));

    return button;
  }

  function createSessionRow(session) {
    var row = document.createElement("div");
    var button = document.createElement("button");
    var icon = document.createElement("span");
    var iconGlyph = document.createElement("i");
    var body = document.createElement("span");
    var titleRow = document.createElement("span");
    var previewRow = document.createElement("span");
    var title = document.createElement("span");
    var time = document.createElement("span");
    var preview = document.createElement("span");
    var options = document.createElement("div");
    var optionsButton = document.createElement("button");
    var optionsIcon = document.createElement("i");
    var optionsMenu = document.createElement("div");
    var isActive = session.id === activeSessionId;
    var optionsButtonId = "agent-session-menu-" + session.id;

    row.className = "agent-session-row" + (isActive ? " is-active" : "");
    row.setAttribute("data-session-row", session.id);
    row.setAttribute("role", "listitem");

    button.type = "button";
    button.className = "chat-conversation agent-session agent-session-select" +
      (isActive ? " is-active" : "");
    button.setAttribute("data-session-id", session.id);
    button.setAttribute("aria-pressed", String(isActive));

    icon.className = "agent-session-icon";
    icon.setAttribute("aria-hidden", "true");
    iconGlyph.className = "fas fa-comment-alt";
    icon.appendChild(iconGlyph);

    body.className = "chat-conversation-body";
    titleRow.className = "chat-conversation-row";
    previewRow.className = "chat-conversation-row";
    title.className = "chat-conversation-name";
    time.className = "chat-conversation-time";
    preview.className = "chat-conversation-preview";
    title.textContent = session.title;
    time.textContent = session.time;
    preview.textContent = session.preview;

    titleRow.appendChild(title);
    titleRow.appendChild(time);
    previewRow.appendChild(preview);
    body.appendChild(titleRow);
    body.appendChild(previewRow);
    button.appendChild(icon);
    button.appendChild(body);

    options.className = "dropdown agent-session-options";
    optionsButton.type = "button";
    optionsButton.className = "chat-icon-button agent-session-options-button";
    optionsButton.id = optionsButtonId;
    optionsButton.title = "Session options";
    optionsButton.setAttribute("data-toggle", "dropdown");
    optionsButton.setAttribute("aria-haspopup", "true");
    optionsButton.setAttribute("aria-expanded", "false");
    optionsButton.setAttribute("aria-label", "Options for " + session.title);
    optionsIcon.className = "fas fa-ellipsis-v";
    optionsIcon.setAttribute("aria-hidden", "true");
    optionsButton.appendChild(optionsIcon);

    optionsMenu.className =
      "dropdown-menu dropdown-menu-right shadow animated--fade-in";
    optionsMenu.setAttribute("aria-labelledby", optionsButtonId);
    optionsMenu.appendChild(createSessionActionButton(
      session,
      "rename",
      "fas fa-pen",
      "Rename",
      "#renameAgentSessionModal"
    ));
    optionsMenu.appendChild(createSessionActionButton(
      session,
      "delete",
      "fas fa-trash",
      "Delete",
      "#deleteAgentSessionModal"
    ));

    options.appendChild(optionsButton);
    options.appendChild(optionsMenu);
    row.appendChild(button);
    row.appendChild(options);

    return row;
  }

  function renderSessionList() {
    var query = sessionSearch.value.trim().toLowerCase();
    var visibleSessionCount = 0;

    sessionList.textContent = "";
    sessionCount.textContent = sessions.length;

    sessions.forEach(function (session) {
      var searchableText = (session.title + " " + session.preview).toLowerCase();

      if (searchableText.indexOf(query) === -1) {
        return;
      }

      sessionList.appendChild(createSessionRow(session));
      visibleSessionCount += 1;
    });

    clearSessionSearch.hidden = query.length === 0;
    sessionNoResults.hidden = visibleSessionCount !== 0;
    updateSessionActionAvailability();
  }

  function createProviderBanner() {
    var banner = document.createElement("div");
    var icon = document.createElement("span");
    var iconGlyph = document.createElement("i");
    var copy = document.createElement("span");
    var title = document.createElement("strong");
    var description = document.createElement("span");

    banner.className = "agent-provider-banner";
    banner.setAttribute("role", "status");
    icon.className = "agent-provider-banner-icon";
    icon.setAttribute("aria-hidden", "true");
    iconGlyph.className = "fas fa-plug";
    title.textContent = "Agent provider not connected";
    description.textContent =
      "The session workspace is ready. Register a provider to enable responses.";

    icon.appendChild(iconGlyph);
    copy.appendChild(title);
    copy.appendChild(description);
    banner.appendChild(icon);
    banner.appendChild(copy);

    return banner;
  }

  function createDateDivider(label) {
    var divider = document.createElement("div");
    var text = document.createElement("span");

    divider.className = "chat-date-divider";
    text.textContent = label;
    divider.appendChild(text);

    return divider;
  }

  function createMessageElement(message) {
    var isUser = message.role === "user";
    var row = document.createElement("div");
    var content = document.createElement("div");
    var bubble = document.createElement("div");
    var meta = document.createElement("div");
    var time = document.createElement("time");

    row.className = "chat-message chat-message--" +
      (isUser ? "outgoing" : "incoming");
    content.className = "chat-message-content";
    bubble.className = "chat-message-bubble";
    bubble.textContent = message.content;
    meta.className = "chat-message-meta";
    time.textContent = message.time;

    if (!isUser) {
      var avatar = document.createElement("span");
      var avatarIcon = document.createElement("i");
      var author = document.createElement("span");

      avatar.className = "chat-message-avatar agent-message-avatar";
      avatar.setAttribute("aria-hidden", "true");
      avatarIcon.className = "fas fa-robot";
      avatar.appendChild(avatarIcon);
      row.appendChild(avatar);

      author.className = "chat-message-author";
      author.textContent = "Agent";
      content.appendChild(author);
    }

    content.appendChild(bubble);
    meta.appendChild(time);
    content.appendChild(meta);
    row.appendChild(content);

    return row;
  }

  function createWelcomeState() {
    var welcome = document.createElement("div");
    var icon = document.createElement("span");
    var iconGlyph = document.createElement("i");
    var title = document.createElement("h3");
    var description = document.createElement("p");
    var suggestions = document.createElement("div");
    var suggestionPrompts = [
      "Summarize this project structure",
      "Plan the next application feature",
      "Help investigate a bug"
    ];

    welcome.className = "agent-welcome";
    icon.className = "agent-welcome-icon";
    icon.setAttribute("aria-hidden", "true");
    iconGlyph.className = "fas fa-robot";
    title.textContent = "Start a new agent session";
    description.textContent =
      "Keep each task in its own session so prompts and responses stay focused.";
    suggestions.className = "agent-suggestions";

    icon.appendChild(iconGlyph);
    welcome.appendChild(icon);
    welcome.appendChild(title);
    welcome.appendChild(description);

    suggestionPrompts.forEach(function (prompt) {
      var suggestion = document.createElement("button");

      suggestion.type = "button";
      suggestion.className = "agent-suggestion";
      suggestion.setAttribute("data-agent-suggestion", prompt);
      suggestion.textContent = prompt;
      suggestions.appendChild(suggestion);
    });

    welcome.appendChild(suggestions);
    return welcome;
  }

  function renderThread(session) {
    messageFeed.textContent = "";
    activeSessionTitle.textContent = session.title;
    messageFeed.setAttribute("aria-label", "Messages in " + session.title);
    activeSessionMenuButton.setAttribute(
      "aria-label",
      "Options for " + session.title
    );
    renameActiveSessionButton.setAttribute("data-session-id", session.id);
    deleteActiveSessionButton.setAttribute("data-session-id", session.id);

    if (!agentConfigured) {
      messageFeed.appendChild(createProviderBanner());
    }

    if (session.messages.length === 0) {
      messageFeed.appendChild(createWelcomeState());
    } else {
      messageFeed.appendChild(createDateDivider(session.date_label));
      session.messages.forEach(function (message) {
        messageFeed.appendChild(createMessageElement(message));
      });
    }

    if (respondingSessionId === session.id) {
      appendTypingIndicator();
    }

    if (responseErrorsBySession[session.id]) {
      appendResponseError(responseErrorsBySession[session.id]);
    }

    updateSessionActionAvailability();

    window.requestAnimationFrame(function () {
      messageFeed.scrollTop = messageFeed.scrollHeight;
    });
  }

  function setActiveSession(sessionId, shouldOpenSession) {
    var session = getSession(sessionId);

    if (!session) {
      console.error("Unable to select an unknown agent session: " + sessionId);
      return;
    }

    activeSessionId = sessionId;
    app.setAttribute("data-active-session", sessionId);
    setStoredValue(selectionStorageKey, sessionId);
    renderSessionList();
    renderThread(session);

    if (shouldOpenSession) {
      app.classList.add("chat-conversation-open");
    }
  }

  function clearSearch() {
    sessionSearch.value = "";
    renderSessionList();
    sessionSearch.focus();
  }

  function createSessionId() {
    return "session-" + Date.now().toString(36) + "-" +
      Math.random().toString(36).slice(2, 8);
  }

  function buildNewSession() {
    return {
      id: createSessionId(),
      title: "New session",
      preview: "Start a new conversation with the agent.",
      time: "Now",
      date_label: "Today",
      messages: [],
      is_untitled: true
    };
  }

  function createNewSession() {
    var newSession = buildNewSession();

    sessions.unshift(newSession);
    sessions = sessions.slice(0, maxSessions);
    sessionSearch.value = "";
    saveSessions();
    setActiveSession(newSession.id, true);
    messageInput.focus();
  }

  function updateSessionActionAvailability() {
    var deleteButtons = app.querySelectorAll(
      "[data-agent-session-action=\"delete\"]"
    );

    Array.prototype.forEach.call(deleteButtons, function (button) {
      var isResponding =
        button.getAttribute("data-session-id") === respondingSessionId;

      button.disabled = isResponding;
      button.title = isResponding
        ? "Wait for the agent response before deleting this session."
        : "";
    });
  }

  function hideSessionModal(selector) {
    if (
      window.jQuery &&
      window.jQuery.fn &&
      typeof window.jQuery.fn.modal === "function"
    ) {
      window.jQuery(selector).modal("hide");
      return;
    }

    console.error("Bootstrap modal support is unavailable.");
  }

  function prepareSessionAction(actionButton) {
    var sessionId = actionButton.getAttribute("data-session-id");
    var session = getSession(sessionId);
    var action = actionButton.getAttribute("data-agent-session-action");

    if (!session) {
      console.error("Unable to update an unknown agent session: " + sessionId);
      return;
    }

    sessionActionTargetId = sessionId;

    if (action === "rename") {
      renameSessionInput.value = session.title;
      renameSessionInput.setCustomValidity("");
      window.setTimeout(function () {
        renameSessionInput.focus();
        renameSessionInput.select();
      }, 250);
    }

    if (action === "delete") {
      deleteSessionName.textContent = session.title;
      confirmDeleteSessionButton.disabled =
        session.id === respondingSessionId;
    }
  }

  function renameTargetSession() {
    var session = getSession(sessionActionTargetId);
    var title = renameSessionInput.value.trim();

    if (!session) {
      console.error("The session selected for renaming is unavailable.");
      return;
    }

    if (!title || title.length > 80) {
      renameSessionInput.setCustomValidity(
        "Enter a session name between 1 and 80 characters."
      );
      renameSessionInput.reportValidity();
      return;
    }

    session.title = title;
    session.is_untitled = false;
    saveSessions();
    renderSessionList();

    if (session.id === activeSessionId) {
      renderThread(session);
    }

    hideSessionModal("#renameAgentSessionModal");
    screenReaderStatus.textContent = "Session renamed to " + title + ".";
    sessionActionTargetId = null;
  }

  function deleteTargetSession() {
    var session = getSession(sessionActionTargetId);
    var sessionIndex;
    var deletedSessionTitle;
    var wasActive;

    if (!session) {
      console.error("The session selected for deletion is unavailable.");
      return;
    }

    if (session.id === respondingSessionId) {
      screenReaderStatus.textContent =
        "Wait for the agent response before deleting this session.";
      return;
    }

    sessionIndex = sessions.indexOf(session);
    deletedSessionTitle = session.title;
    wasActive = session.id === activeSessionId;
    sessions.splice(sessionIndex, 1);
    delete responseErrorsBySession[session.id];

    if (sessions.length === 0) {
      sessions.push(buildNewSession());
    }

    if (wasActive) {
      activeSessionId =
        sessions[Math.min(sessionIndex, sessions.length - 1)].id;
    }

    saveSessions();
    hideSessionModal("#deleteAgentSessionModal");
    sessionActionTargetId = null;

    if (wasActive) {
      setActiveSession(activeSessionId, false);
    } else {
      renderSessionList();
    }

    screenReaderStatus.textContent =
      "Session " + deletedSessionTitle + " deleted.";
  }

  function resizeMessageInput() {
    messageInput.style.height = "auto";
    messageInput.style.height = Math.min(messageInput.scrollHeight, 120) + "px";
  }

  function updateComposerState() {
    var hasMessage = messageInput.value.trim().length > 0;

    messageInput.setCustomValidity("");
    sendMessageButton.disabled = !hasMessage || respondingSessionId !== null;
    messageForm.classList.toggle("is-waiting", respondingSessionId !== null);
    resizeMessageInput();
  }

  function formatCurrentTime() {
    return new Date().toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit"
    });
  }

  function createTitleFromPrompt(prompt) {
    var normalizedPrompt = prompt.replace(/\s+/g, " ").trim();

    if (normalizedPrompt.length <= 42) {
      return normalizedPrompt;
    }

    return normalizedPrompt.slice(0, 39) + "...";
  }

  function createPreview(content, prefix) {
    var normalizedContent = content.replace(/\s+/g, " ").trim();
    var preview = prefix + normalizedContent;

    return preview.length <= 90 ? preview : preview.slice(0, 87) + "...";
  }

  function appendTypingIndicator() {
    var row = document.createElement("div");
    var avatar = document.createElement("span");
    var avatarIcon = document.createElement("i");
    var bubble = document.createElement("div");
    var typing = document.createElement("span");

    row.className = "chat-message chat-message--incoming";
    row.setAttribute("data-agent-typing", "true");
    avatar.className = "chat-message-avatar agent-message-avatar";
    avatar.setAttribute("aria-hidden", "true");
    avatarIcon.className = "fas fa-robot";
    bubble.className = "chat-message-bubble";
    typing.className = "agent-typing";
    typing.setAttribute("aria-label", "Agent is responding");

    for (var index = 0; index < 3; index += 1) {
      typing.appendChild(document.createElement("span"));
    }

    avatar.appendChild(avatarIcon);
    bubble.appendChild(typing);
    row.appendChild(avatar);
    row.appendChild(bubble);
    messageFeed.appendChild(row);
    messageFeed.scrollTop = messageFeed.scrollHeight;
  }

  function appendResponseError(message) {
    var error = document.createElement("div");
    var icon = document.createElement("i");
    var text = document.createElement("span");

    error.className = "agent-response-error";
    error.setAttribute("role", "alert");
    icon.className = "fas fa-exclamation-circle";
    icon.setAttribute("aria-hidden", "true");
    text.textContent = message;
    error.appendChild(icon);
    error.appendChild(text);
    messageFeed.appendChild(error);
    messageFeed.scrollTop = messageFeed.scrollHeight;
    screenReaderStatus.textContent = message;
  }

  function parseAgentResponse(response) {
    return response.json().catch(function () {
      throw new Error("The agent service returned an unreadable response.");
    }).then(function (payload) {
      if (!response.ok) {
        var errorMessage = payload &&
          payload.error &&
          typeof payload.error.message === "string"
          ? payload.error.message
          : "The agent request failed.";

        throw new Error(errorMessage);
      }

      if (
        !payload ||
        !payload.message ||
        payload.message.role !== "assistant" ||
        typeof payload.message.content !== "string" ||
        !payload.message.content.trim() ||
        payload.message.content.length > maxMessageLength
      ) {
        throw new Error("The agent returned an invalid response.");
      }

      return payload.message.content.trim();
    });
  }

  function requestAgentReply(session) {
    var requestedSessionId = session.id;
    var payloadMessages = session.messages.slice(-maxMessagesPerSession).map(
      function (message) {
        return {
          role: message.role,
          content: message.content
        };
      }
    );

    respondingSessionId = requestedSessionId;
    updateComposerState();
    updateSessionActionAvailability();
    appendTypingIndicator();
    screenReaderStatus.textContent = "The agent is responding.";

    window.fetch(responseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        session_id: requestedSessionId,
        messages: payloadMessages
      })
    }).then(parseAgentResponse).then(function (content) {
      var requestedSession = getSession(requestedSessionId);
      var time = formatCurrentTime();

      if (!requestedSession) {
        throw new Error("The active agent session is no longer available.");
      }

      respondingSessionId = null;
      delete responseErrorsBySession[requestedSessionId];
      requestedSession.messages.push({
        role: "assistant",
        content: content,
        time: time
      });
      requestedSession.messages =
        requestedSession.messages.slice(-maxMessagesPerSession);
      requestedSession.preview = createPreview(content, "");
      requestedSession.time = time;
      requestedSession.date_label = "Today";
      saveSessions();
      renderSessionList();

      if (activeSessionId === requestedSessionId) {
        renderThread(requestedSession);
      }

      screenReaderStatus.textContent = "The agent responded.";
    }).catch(function (error) {
      console.error("The agent response request failed.", error);
      respondingSessionId = null;
      responseErrorsBySession[requestedSessionId] = error.message;

      if (activeSessionId === requestedSessionId) {
        renderThread(session);
      }

      screenReaderStatus.textContent =
        "The agent request failed in " + session.title + ". " + error.message;
    }).then(function () {
      updateComposerState();
      updateSessionActionAvailability();
    });
  }

  app.addEventListener("click", function (event) {
    var actionButton = event.target.closest("[data-agent-session-action]");
    var sessionButton = event.target.closest(".agent-session-select");

    if (actionButton && app.contains(actionButton)) {
      prepareSessionAction(actionButton);
      return;
    }

    if (sessionButton && sessionList.contains(sessionButton)) {
      setActiveSession(sessionButton.getAttribute("data-session-id"), true);
    }
  });

  sessionSearch.addEventListener("input", renderSessionList);
  sessionSearch.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && sessionSearch.value) {
      event.preventDefault();
      clearSearch();
    }
  });

  clearSessionSearch.addEventListener("click", clearSearch);
  newSessionButton.addEventListener("click", createNewSession);
  renameSessionForm.addEventListener("submit", function (event) {
    event.preventDefault();
    renameTargetSession();
  });
  confirmDeleteSessionButton.addEventListener("click", deleteTargetSession);

  backButton.addEventListener("click", function () {
    app.classList.remove("chat-conversation-open");
    sessionSearch.focus();
  });

  messageFeed.addEventListener("click", function (event) {
    var suggestion = event.target.closest("[data-agent-suggestion]");

    if (!suggestion) {
      return;
    }

    messageInput.value = suggestion.getAttribute("data-agent-suggestion");
    updateComposerState();
    messageInput.focus();
  });

  messageInput.addEventListener("input", updateComposerState);
  messageInput.addEventListener("keydown", function (event) {
    if (event.key === "Enter" && !event.shiftKey && !event.isComposing) {
      event.preventDefault();

      if (typeof messageForm.requestSubmit === "function") {
        messageForm.requestSubmit();
      } else {
        sendMessageButton.click();
      }
    }
  });

  messageForm.addEventListener("submit", function (event) {
    var content = messageInput.value.trim();
    var session = getSession(activeSessionId);
    var time;

    event.preventDefault();

    if (!content) {
      messageInput.setCustomValidity("Write a prompt before sending.");
      messageInput.reportValidity();
      return;
    }

    if (!session) {
      appendResponseError("The selected agent session is unavailable.");
      return;
    }

    time = formatCurrentTime();

    if (session.is_untitled) {
      session.title = createTitleFromPrompt(content);
      session.is_untitled = false;
    }

    session.messages.push({
      role: "user",
      content: content,
      time: time
    });
    session.messages = session.messages.slice(-maxMessagesPerSession);
    session.preview = createPreview(content, "You: ");
    session.time = time;
    session.date_label = "Today";
    delete responseErrorsBySession[session.id];
    saveSessions();
    renderSessionList();
    renderThread(session);

    messageInput.value = "";
    updateComposerState();

    if (!agentConfigured) {
      responseErrorsBySession[session.id] =
        "No agent provider is connected yet. Register a provider and reload this page to enable responses.";
      appendResponseError(responseErrorsBySession[session.id]);
      messageInput.focus();
      return;
    }

    requestAgentReply(session);
  });

  window.addEventListener("storage", function (event) {
    if (event.key === sessionStorageKey) {
      var storedSessions = loadStoredSessions();

      if (storedSessions) {
        sessions = storedSessions;

        if (!getSession(activeSessionId)) {
          activeSessionId = sessions[0].id;
        }

        renderSessionList();
        renderThread(getSession(activeSessionId));
      }
    }

    if (event.key === selectionStorageKey && getSession(event.newValue)) {
      setActiveSession(event.newValue, false);
    }
  });

  renderSessionList();
  setActiveSession(activeSessionId, false);
  updateComposerState();
})();

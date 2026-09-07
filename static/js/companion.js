(function () {
  "use strict";

  var app = document.getElementById("companionApp");
  var dataElement = document.getElementById("companionMessageData");

  if (!app || !dataElement) {
    return;
  }

  var seedMessages;

  try {
    seedMessages = JSON.parse(dataElement.textContent);
  } catch (error) {
    console.error("Unable to load the Companion message data.", error);
    return;
  }

  if (!Array.isArray(seedMessages)) {
    console.error("The Companion message data is invalid.");
    return;
  }

  var storageKey = "sb-admin-companion-messages";
  var maxMessages = 100;
  var maxMessageLength = 10000;
  var responseUrl = app.getAttribute("data-response-url");
  var sessionId = app.getAttribute("data-session-id");
  var avatarUrl = app.getAttribute("data-avatar-url");
  var agentConfigured = app.getAttribute("data-agent-configured") === "true";
  var messageFeed = document.getElementById("companionMessageFeed");
  var messageForm = document.getElementById("companionMessageForm");
  var messageInput = document.getElementById("companionMessageInput");
  var sendButton = document.getElementById("sendCompanionMessage");
  var openChatButton = document.getElementById("companionOpenChat");
  var backButton = document.getElementById("companionBackButton");
  var waveform = document.getElementById("companionWaveform");
  var voiceStatus = document.getElementById("companionVoiceStatus");
  var screenReaderStatus = document.getElementById("companionScreenReaderStatus");
  var localMessages = loadMessages();
  var isWaiting = false;
  var responseError = "";
  var voiceTimer;

  seedMessages = normalizeMessages(seedMessages);

  function normalizeMessages(messages) {
    return messages.filter(function (message) {
      return message &&
        (message.role === "user" || message.role === "assistant") &&
        typeof message.content === "string" &&
        message.content.trim().length > 0 &&
        message.content.length <= maxMessageLength &&
        typeof message.time === "string";
    }).slice(-maxMessages).map(function (message) {
      return {
        role: message.role,
        content: message.content.trim(),
        time: message.time
      };
    });
  }

  function getStoredValue() {
    try {
      return window.localStorage.getItem(storageKey);
    } catch (error) {
      console.warn("Unable to read saved Companion messages.", error);
      return null;
    }
  }

  function loadMessages() {
    var storedValue = getStoredValue();
    var parsedMessages;

    if (!storedValue) {
      return [];
    }

    try {
      parsedMessages = JSON.parse(storedValue);
    } catch (error) {
      console.warn("Ignoring invalid saved Companion messages.", error);
      return [];
    }

    return Array.isArray(parsedMessages)
      ? normalizeMessages(parsedMessages)
      : [];
  }

  function saveMessages() {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(localMessages));
    } catch (error) {
      console.warn("Unable to save Companion messages.", error);
    }
  }

  function getAllMessages() {
    return seedMessages.concat(localMessages);
  }

  function formatCurrentTime() {
    return new Date().toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit"
    });
  }

  function createDateDivider() {
    var divider = document.createElement("div");
    var label = document.createElement("span");

    divider.className = "chat-date-divider";
    label.textContent = "Today";
    divider.appendChild(label);
    return divider;
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
      "You can compose locally now. Register a provider to receive new replies.";

    icon.appendChild(iconGlyph);
    copy.appendChild(title);
    copy.appendChild(description);
    banner.appendChild(icon);
    banner.appendChild(copy);
    return banner;
  }

  function createMessage(message) {
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
      var avatar = document.createElement("img");
      var author = document.createElement("span");

      avatar.className = "chat-message-avatar";
      avatar.src = avatarUrl;
      avatar.alt = "";
      author.className = "chat-message-author";
      author.textContent = "Nova";
      row.appendChild(avatar);
      content.appendChild(author);
    }

    content.appendChild(bubble);
    meta.appendChild(time);
    content.appendChild(meta);
    row.appendChild(content);
    return row;
  }

  function createTypingIndicator() {
    var row = document.createElement("div");
    var avatar = document.createElement("img");
    var bubble = document.createElement("div");
    var typing = document.createElement("span");

    row.className = "chat-message chat-message--incoming";
    row.setAttribute("data-companion-typing", "true");
    avatar.className = "chat-message-avatar";
    avatar.src = avatarUrl;
    avatar.alt = "";
    bubble.className = "chat-message-bubble";
    typing.className = "agent-typing";
    typing.setAttribute("aria-label", "Nova is responding");

    for (var index = 0; index < 3; index += 1) {
      typing.appendChild(document.createElement("span"));
    }

    bubble.appendChild(typing);
    row.appendChild(avatar);
    row.appendChild(bubble);
    return row;
  }

  function createError(message) {
    var error = document.createElement("div");
    var icon = document.createElement("i");
    var copy = document.createElement("span");

    error.className = "agent-response-error";
    error.setAttribute("role", "alert");
    icon.className = "fas fa-exclamation-circle";
    icon.setAttribute("aria-hidden", "true");
    copy.textContent = message;
    error.appendChild(icon);
    error.appendChild(copy);
    return error;
  }

  function renderMessages() {
    messageFeed.textContent = "";

    if (!agentConfigured) {
      messageFeed.appendChild(createProviderBanner());
    }

    messageFeed.appendChild(createDateDivider());
    getAllMessages().forEach(function (message) {
      messageFeed.appendChild(createMessage(message));
    });

    if (isWaiting) {
      messageFeed.appendChild(createTypingIndicator());
    }

    if (responseError) {
      messageFeed.appendChild(createError(responseError));
    }

    window.requestAnimationFrame(function () {
      messageFeed.scrollTop = messageFeed.scrollHeight;
    });
  }

  function resizeInput() {
    messageInput.style.height = "auto";
    messageInput.style.height = Math.min(messageInput.scrollHeight, 120) + "px";
  }

  function updateComposer() {
    messageInput.setCustomValidity("");
    sendButton.disabled = isWaiting || messageInput.value.trim().length === 0;
    messageForm.classList.toggle("is-waiting", isWaiting);
    resizeInput();
  }

  function setVoiceState(state) {
    window.clearTimeout(voiceTimer);
    waveform.classList.toggle(
      "is-active",
      state === "speaking"
    );
    waveform.setAttribute("data-state", state);

    if (state === "thinking") {
      voiceStatus.textContent = "Thinking";
      waveform.setAttribute(
        "aria-label",
        "Voice waveform placeholder; waiting for the agent response"
      );
      return;
    }

    if (state === "speaking") {
      voiceStatus.textContent = "Voice preview";
      waveform.setAttribute(
        "aria-label",
        "Simulated voice waveform activity; no audio is playing"
      );
      voiceTimer = window.setTimeout(function () {
        setVoiceState("idle");
      }, 1800);
      return;
    }

    voiceStatus.textContent = "Placeholder";
    waveform.setAttribute(
      "aria-label",
      "Voice waveform placeholder; no audio is playing"
    );
  }

  function parseResponse(response) {
    return response.json().catch(function () {
      throw new Error("The agent service returned an unreadable response.");
    }).then(function (payload) {
      if (!response.ok) {
        var message = payload &&
          payload.error &&
          typeof payload.error.message === "string"
          ? payload.error.message
          : "The companion request failed.";

        throw new Error(message);
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

  function requestReply() {
    var history = getAllMessages().slice(-maxMessages).map(function (message) {
      return {
        role: message.role,
        content: message.content
      };
    });

    isWaiting = true;
    responseError = "";
    updateComposer();
    setVoiceState("thinking");
    renderMessages();
    screenReaderStatus.textContent = "Nova is responding.";

    window.fetch(responseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        session_id: sessionId,
        messages: history
      })
    }).then(parseResponse).then(function (content) {
      localMessages.push({
        role: "assistant",
        content: content,
        time: formatCurrentTime()
      });
      localMessages = localMessages.slice(-maxMessages);
      saveMessages();
      isWaiting = false;
      renderMessages();
      setVoiceState("speaking");
      screenReaderStatus.textContent = "Nova responded.";
    }).catch(function (error) {
      console.error("The companion response request failed.", error);
      isWaiting = false;
      responseError = error.message;
      setVoiceState("idle");
      renderMessages();
      screenReaderStatus.textContent = error.message;
    }).then(updateComposer);
  }

  messageInput.addEventListener("input", updateComposer);
  messageInput.addEventListener("keydown", function (event) {
    if (event.key === "Enter" && !event.shiftKey && !event.isComposing) {
      event.preventDefault();

      if (typeof messageForm.requestSubmit === "function") {
        messageForm.requestSubmit();
      } else {
        sendButton.click();
      }
    }
  });

  messageForm.addEventListener("submit", function (event) {
    var content = messageInput.value.trim();

    event.preventDefault();

    if (!content) {
      messageInput.setCustomValidity("Write a message before sending.");
      messageInput.reportValidity();
      return;
    }

    localMessages.push({
      role: "user",
      content: content,
      time: formatCurrentTime()
    });
    localMessages = localMessages.slice(-maxMessages);
    saveMessages();
    responseError = "";
    messageInput.value = "";
    updateComposer();
    renderMessages();

    if (!agentConfigured) {
      responseError =
        "No agent provider is connected yet. Register a provider and reload this page to receive replies.";
      renderMessages();
      screenReaderStatus.textContent = responseError;
      messageInput.focus();
      return;
    }

    requestReply();
  });

  openChatButton.addEventListener("click", function () {
    app.classList.add("chat-conversation-open");
    messageInput.focus();
  });

  backButton.addEventListener("click", function () {
    app.classList.remove("chat-conversation-open");
    openChatButton.focus();
  });

  window.addEventListener("storage", function (event) {
    if (event.key === storageKey) {
      localMessages = loadMessages();
      responseError = "";
      renderMessages();
    }
  });

  renderMessages();
  updateComposer();
  setVoiceState("idle");
})();

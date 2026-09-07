(function () {
  "use strict";

  var app = document.getElementById("chatApp");
  var dataElement = document.getElementById("chatData");

  if (!app || !dataElement) {
    return;
  }

  var conversations;

  try {
    conversations = JSON.parse(dataElement.textContent);
  } catch (error) {
    console.error("Unable to load the chat conversation data.", error);
    return;
  }

  if (!Array.isArray(conversations) || conversations.length === 0) {
    console.error("The chat conversation data is missing or invalid.");
    return;
  }

  var messageStorageKey = "sb-admin-chat-messages";
  var selectionStorageKey = "sb-admin-chat-selection";
  var conversationById = {};
  var conversationButtons = app.querySelectorAll("[data-conversation-id]");
  var conversationSearch = document.getElementById("conversationSearch");
  var clearConversationSearch = document.getElementById("clearConversationSearch");
  var conversationNoResults = document.getElementById("conversationNoResults");
  var activeConversationAvatar = document.getElementById("activeConversationAvatar");
  var activeConversationPresence = document.getElementById("activeConversationPresence");
  var activeConversationName = document.getElementById("activeConversationName");
  var activeConversationStatus = document.getElementById("activeConversationStatus");
  var messageFeed = document.getElementById("messageFeed");
  var messageForm = document.getElementById("messageForm");
  var messageInput = document.getElementById("messageInput");
  var sendMessageButton = document.getElementById("sendMessageButton");
  var chatBackButton = document.getElementById("chatBackButton");
  var maxStoredMessagesPerConversation = 100;
  var localMessages;
  var activeConversationId;

  conversations.forEach(function (conversation) {
    conversationById[conversation.id] = conversation;
  });

  localMessages = loadLocalMessages();
  activeConversationId = getInitialConversationId();

  function getStoredValue(key) {
    try {
      return window.localStorage.getItem(key);
    } catch (error) {
      console.warn("Unable to read saved chat data.", error);
      return null;
    }
  }

  function setStoredValue(key, value) {
    try {
      window.localStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.warn("Unable to save chat data in this browser.", error);
      return false;
    }
  }

  function loadLocalMessages() {
    var storedMessages = getStoredValue(messageStorageKey);
    var parsedMessages;
    var validMessages = {};

    if (!storedMessages) {
      return validMessages;
    }

    try {
      parsedMessages = JSON.parse(storedMessages);
    } catch (error) {
      console.warn("Ignoring invalid saved chat messages.", error);
      return validMessages;
    }

    if (!parsedMessages || typeof parsedMessages !== "object" || Array.isArray(parsedMessages)) {
      console.warn("Ignoring saved chat messages with an invalid format.");
      return validMessages;
    }

    Object.keys(parsedMessages).forEach(function (conversationId) {
      if (!conversationById[conversationId] || !Array.isArray(parsedMessages[conversationId])) {
        return;
      }

      validMessages[conversationId] = parsedMessages[conversationId].filter(function (message) {
        return message &&
          message.direction === "outgoing" &&
          typeof message.text === "string" &&
          message.text.length <= 1000 &&
          typeof message.time === "string" &&
          message.time.length <= 100;
      }).slice(-maxStoredMessagesPerConversation);
    });

    return validMessages;
  }

  function saveLocalMessages() {
    setStoredValue(messageStorageKey, JSON.stringify(localMessages));
  }

  function getInitialConversationId() {
    var savedConversationId = getStoredValue(selectionStorageKey);
    var defaultConversationId = app.getAttribute("data-active-conversation");
    var shouldOpenRequestedConversation =
      app.getAttribute("data-open-conversation") === "true";
    var isSavedConversationValid = conversations.some(function (conversation) {
      return conversation.id === savedConversationId;
    });

    if (shouldOpenRequestedConversation) {
      return defaultConversationId;
    }

    return isSavedConversationValid ? savedConversationId : defaultConversationId;
  }

  function createDateDivider(label) {
    var divider = document.createElement("div");
    var text = document.createElement("span");

    divider.className = "chat-date-divider";
    text.textContent = label;
    divider.appendChild(text);

    return divider;
  }

  function createMessageElement(message, conversation) {
    var direction = message.direction === "outgoing" ? "outgoing" : "incoming";
    var row = document.createElement("div");
    var content = document.createElement("div");
    var bubble = document.createElement("div");
    var meta = document.createElement("div");
    var time = document.createElement("time");

    row.className = "chat-message chat-message--" + direction;
    content.className = "chat-message-content";
    bubble.className = "chat-message-bubble";
    bubble.textContent = message.text;
    meta.className = "chat-message-meta";
    time.textContent = message.time;

    if (direction === "incoming") {
      var avatar = document.createElement("img");

      avatar.className = "chat-message-avatar";
      avatar.src = conversation.avatar_url;
      avatar.alt = "";
      row.appendChild(avatar);
    }

    if (message.sender) {
      var author = document.createElement("span");

      author.className = "chat-message-author";
      author.textContent = message.sender;
      content.appendChild(author);
    }

    content.appendChild(bubble);
    meta.appendChild(time);

    if (direction === "outgoing") {
      var deliveredIcon = document.createElement("i");

      deliveredIcon.className = "fas fa-check-double";
      deliveredIcon.setAttribute("aria-label", "Delivered");
      meta.appendChild(deliveredIcon);
    }

    content.appendChild(meta);
    row.appendChild(content);

    return row;
  }

  function renderMessages(conversation) {
    var savedMessages = localMessages[conversation.id] || [];

    messageFeed.textContent = "";
    messageFeed.appendChild(createDateDivider(conversation.date_label));

    conversation.messages.forEach(function (message) {
      messageFeed.appendChild(createMessageElement(message, conversation));
    });

    if (savedMessages.length > 0 && conversation.date_label !== "Today") {
      messageFeed.appendChild(createDateDivider("Today"));
    }

    savedMessages.forEach(function (message) {
      messageFeed.appendChild(createMessageElement(message, conversation));
    });

    window.requestAnimationFrame(function () {
      messageFeed.scrollTop = messageFeed.scrollHeight;
    });
  }

  function appendSentMessage(message, conversation, isFirstSavedMessage) {
    if (isFirstSavedMessage && conversation.date_label !== "Today") {
      messageFeed.appendChild(createDateDivider("Today"));
    }

    messageFeed.appendChild(createMessageElement(message, conversation));

    window.requestAnimationFrame(function () {
      messageFeed.scrollTop = messageFeed.scrollHeight;
    });
  }

  function markConversationAsRead(button) {
    var unreadBadge = button.querySelector(".chat-unread");

    if (unreadBadge) {
      unreadBadge.hidden = true;
    }
  }

  function setActiveConversation(conversationId, shouldOpenConversation) {
    var conversation = conversationById[conversationId];

    if (!conversation) {
      console.error("Unable to select an unknown conversation: " + conversationId);
      return;
    }

    activeConversationId = conversationId;
    app.setAttribute("data-active-conversation", conversationId);

    Array.prototype.forEach.call(conversationButtons, function (button) {
      var isActive = button.getAttribute("data-conversation-id") === conversationId;

      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-selected", String(isActive));

      if (isActive) {
        markConversationAsRead(button);
      }
    });

    activeConversationAvatar.src = conversation.avatar_url;
    activeConversationName.textContent = conversation.name;
    activeConversationStatus.textContent = conversation.status_label;
    activeConversationPresence.className =
      "chat-presence chat-presence--" + conversation.status;
    messageFeed.setAttribute("aria-label", "Messages with " + conversation.name);

    renderMessages(conversation);
    setStoredValue(selectionStorageKey, conversationId);

    if (shouldOpenConversation) {
      app.classList.add("chat-conversation-open");
    }
  }

  function updateSearchResults() {
    var query = conversationSearch.value.trim().toLowerCase();
    var visibleConversationCount = 0;

    Array.prototype.forEach.call(conversationButtons, function (button) {
      var matches = button.textContent.toLowerCase().indexOf(query) !== -1;

      button.hidden = !matches;
      if (matches) {
        visibleConversationCount += 1;
      }
    });

    clearConversationSearch.hidden = query.length === 0;
    conversationNoResults.hidden = visibleConversationCount !== 0;
  }

  function clearSearch() {
    conversationSearch.value = "";
    updateSearchResults();
    conversationSearch.focus();
  }

  function resizeMessageInput() {
    messageInput.style.height = "auto";
    messageInput.style.height = Math.min(messageInput.scrollHeight, 120) + "px";
  }

  function updateComposerState() {
    messageInput.setCustomValidity("");
    sendMessageButton.disabled = messageInput.value.trim().length === 0;
    resizeMessageInput();
  }

  function formatCurrentTime() {
    return new Date().toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit"
    });
  }

  function updateConversationPreview(conversationId, text, time) {
    var button = app.querySelector(
      "[data-conversation-id=\"" + conversationId + "\"]"
    );

    if (!button) {
      return;
    }

    button.querySelector(".chat-conversation-preview").textContent = "You: " + text;
    button.querySelector(".chat-conversation-time").textContent = time;
  }

  function restoreConversationPreviews() {
    conversations.forEach(function (conversation) {
      var savedMessages = localMessages[conversation.id] || [];
      var latestMessage = savedMessages[savedMessages.length - 1];

      if (latestMessage) {
        updateConversationPreview(
          conversation.id,
          latestMessage.text,
          latestMessage.time
        );
      }
    });
  }

  Array.prototype.forEach.call(conversationButtons, function (button) {
    button.addEventListener("click", function () {
      setActiveConversation(button.getAttribute("data-conversation-id"), true);
    });
  });

  conversationSearch.addEventListener("input", updateSearchResults);
  conversationSearch.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && conversationSearch.value) {
      event.preventDefault();
      clearSearch();
    }
  });

  clearConversationSearch.addEventListener("click", clearSearch);

  chatBackButton.addEventListener("click", function () {
    app.classList.remove("chat-conversation-open");
    conversationSearch.focus();
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
    var text = messageInput.value.trim();
    var isFirstSavedMessage;
    var time;
    var message;

    event.preventDefault();

    if (!text) {
      messageInput.setCustomValidity("Write a message before sending.");
      messageInput.reportValidity();
      return;
    }

    time = formatCurrentTime();
    message = {
      direction: "outgoing",
      text: text,
      time: time
    };

    if (!localMessages[activeConversationId]) {
      localMessages[activeConversationId] = [];
    }

    isFirstSavedMessage = localMessages[activeConversationId].length === 0;
    localMessages[activeConversationId].push(message);
    localMessages[activeConversationId] =
      localMessages[activeConversationId].slice(-maxStoredMessagesPerConversation);
    saveLocalMessages();
    updateConversationPreview(activeConversationId, text, time);
    appendSentMessage(
      message,
      conversationById[activeConversationId],
      isFirstSavedMessage
    );

    messageInput.value = "";
    updateComposerState();
    messageInput.focus();
  });

  window.addEventListener("storage", function (event) {
    if (event.key === messageStorageKey) {
      localMessages = loadLocalMessages();
      restoreConversationPreviews();
      renderMessages(conversationById[activeConversationId]);
    }

    if (event.key === selectionStorageKey && conversationById[event.newValue]) {
      setActiveConversation(event.newValue, false);
    }
  });

  restoreConversationPreviews();
  setActiveConversation(
    activeConversationId,
    app.getAttribute("data-open-conversation") === "true"
  );
  updateComposerState();
})();

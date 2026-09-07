(function () {
  "use strict";

  var game = document.getElementById("kanjiGame");
  var dataElement = document.getElementById("kanjiCardData");

  if (!game || !dataElement) {
    return;
  }

  var cards;

  try {
    cards = JSON.parse(dataElement.textContent);
  } catch (error) {
    console.error("Unable to load the Kanji card data.", error);
    return;
  }

  if (!Array.isArray(cards) || cards.length === 0) {
    console.error("The Kanji card data is missing or invalid.");
    return;
  }

  var validLevels = ["T5", "T4", "T3", "T2", "T1"];
  var preferenceStorageKey = "sb-admin-kanji-preferences";
  var setSelect = document.getElementById("kanjiSet");
  var sequenceSelect = document.getElementById("kanjiSequence");
  var restartButton = document.getElementById("restartKanjiRound");
  var characterElement = document.getElementById("currentKanji");
  var levelBadge = document.getElementById("kanjiLevelBadge");
  var progressLabel = document.getElementById("kanjiProgressLabel");
  var progress = document.getElementById("kanjiProgress");
  var progressBar = document.getElementById("kanjiProgressBar");
  var answerPrompt = document.getElementById("kanjiAnswerPrompt");
  var answer = document.getElementById("kanjiAnswer");
  var reading = document.getElementById("kanjiReading");
  var meaning = document.getElementById("kanjiMeaning");
  var revealButton = document.getElementById("revealKanjiAnswer");
  var revealIcon = document.getElementById("kanjiRevealIcon");
  var revealLabel = document.getElementById("kanjiRevealLabel");
  var nextButton = document.getElementById("nextKanji");
  var setSummary = document.getElementById("kanjiSetSummary");
  var sequenceHint = document.getElementById("kanjiSequenceHint");
  var screenReaderStatus = document.getElementById("kanjiScreenReaderStatus");
  var preferences = loadPreferences();
  var activeSet = preferences.set;
  var sequenceMode = preferences.sequence;
  var activePool = [];
  var deck = [];
  var position = 0;
  var answerRevealed = false;

  cards = cards.filter(function (card) {
    return card &&
      typeof card.character === "string" &&
      card.character.length > 0 &&
      typeof card.reading === "string" &&
      card.reading.length > 0 &&
      typeof card.meaning === "string" &&
      card.meaning.length > 0 &&
      validLevels.indexOf(card.level) !== -1;
  });

  if (cards.length === 0) {
    console.error("No valid Kanji cards are available.");
    return;
  }

  function getStoredPreferences() {
    try {
      return window.localStorage.getItem(preferenceStorageKey);
    } catch (error) {
      console.warn("Unable to read saved Kanji game preferences.", error);
      return null;
    }
  }

  function loadPreferences() {
    var storedPreferences = getStoredPreferences();
    var parsedPreferences;
    var defaultPreferences = {
      set: "T5",
      sequence: "ordered"
    };

    if (!storedPreferences) {
      return defaultPreferences;
    }

    try {
      parsedPreferences = JSON.parse(storedPreferences);
    } catch (error) {
      console.warn("Ignoring invalid saved Kanji game preferences.", error);
      return defaultPreferences;
    }

    if (!parsedPreferences || typeof parsedPreferences !== "object") {
      console.warn("Ignoring saved Kanji game preferences with an invalid format.");
      return defaultPreferences;
    }

    if (
      parsedPreferences.set !== "all" &&
      validLevels.indexOf(parsedPreferences.set) === -1
    ) {
      parsedPreferences.set = defaultPreferences.set;
    }

    if (
      parsedPreferences.sequence !== "ordered" &&
      parsedPreferences.sequence !== "random"
    ) {
      parsedPreferences.sequence = defaultPreferences.sequence;
    }

    return {
      set: parsedPreferences.set,
      sequence: parsedPreferences.sequence
    };
  }

  function savePreferences() {
    try {
      window.localStorage.setItem(preferenceStorageKey, JSON.stringify({
        set: activeSet,
        sequence: sequenceMode
      }));
    } catch (error) {
      console.warn("Unable to save Kanji game preferences.", error);
    }
  }

  function shuffle(items) {
    var shuffled = items.slice();

    for (var index = shuffled.length - 1; index > 0; index -= 1) {
      var randomIndex = Math.floor(Math.random() * (index + 1));
      var temporaryItem = shuffled[index];

      shuffled[index] = shuffled[randomIndex];
      shuffled[randomIndex] = temporaryItem;
    }

    return shuffled;
  }

  function createDeck(previousCharacter) {
    var nextDeck = sequenceMode === "random"
      ? shuffle(activePool)
      : activePool.slice();

    if (
      sequenceMode === "random" &&
      nextDeck.length > 1 &&
      nextDeck[0].character === previousCharacter
    ) {
      var replacementIndex = nextDeck.findIndex(function (card) {
        return card.character !== previousCharacter;
      });
      var firstCard = nextDeck[0];

      nextDeck[0] = nextDeck[replacementIndex];
      nextDeck[replacementIndex] = firstCard;
    }

    return nextDeck;
  }

  function setAnswerVisibility(visible, announce) {
    answerRevealed = visible;
    answerPrompt.hidden = visible;
    answer.hidden = !visible;
    revealButton.setAttribute("aria-pressed", String(visible));
    revealIcon.className = visible ? "fas fa-eye-slash" : "fas fa-eye";
    revealLabel.textContent = visible ? "Hide answer" : "Show answer";

    if (announce) {
      var card = deck[position];

      screenReaderStatus.textContent = visible
        ? "Answer: " + card.reading + ". " + card.meaning + "."
        : "Answer hidden.";
    }
  }

  function animateCharacter() {
    characterElement.classList.remove("is-changing");
    void characterElement.offsetWidth;
    characterElement.classList.add("is-changing");
  }

  function renderCard(announce) {
    var card = deck[position];
    var cardNumber = position + 1;
    var totalCards = deck.length;
    var progressPercent = cardNumber / totalCards * 100;
    var setLabel = activeSet === "all" ? "All sets" : activeSet;

    characterElement.textContent = card.character;
    levelBadge.textContent = card.level;
    reading.textContent = card.reading;
    meaning.textContent = card.meaning;
    progressLabel.textContent = "Card " + cardNumber + " of " + totalCards;
    progress.setAttribute("aria-valuemax", String(totalCards));
    progress.setAttribute("aria-valuenow", String(cardNumber));
    progressBar.style.width = progressPercent + "%";
    setSummary.textContent = setLabel + " \u00b7 " + totalCards + " cards";
    sequenceHint.textContent = sequenceMode === "random"
      ? "Every card appears once before reshuffling."
      : "Ordered from the start of the set.";
    nextButton.setAttribute(
      "aria-label",
      "Next Kanji after " + card.character
    );
    setAnswerVisibility(false, false);
    animateCharacter();

    if (announce) {
      screenReaderStatus.textContent =
        "Card " + cardNumber + " of " + totalCards + ": " + card.character + ".";
    }
  }

  function resetRound(announce) {
    var previousCard = deck[position];
    var previousCharacter = previousCard ? previousCard.character : null;

    activePool = cards.filter(function (card) {
      return activeSet === "all" || card.level === activeSet;
    });
    deck = createDeck(previousCharacter);
    position = 0;
    savePreferences();
    renderCard(announce);
  }

  function showNextCard() {
    var previousCharacter = deck[position].character;

    position += 1;

    if (position >= deck.length) {
      deck = createDeck(previousCharacter);
      position = 0;
    }

    renderCard(true);
  }

  function restoreControlValues() {
    var setOptionExists = Array.prototype.some.call(
      setSelect.options,
      function (option) {
        return option.value === activeSet;
      }
    );
    var sequenceOptionExists = Array.prototype.some.call(
      sequenceSelect.options,
      function (option) {
        return option.value === sequenceMode;
      }
    );

    if (!setOptionExists) {
      activeSet = "T5";
    }

    if (!sequenceOptionExists) {
      sequenceMode = "ordered";
    }

    setSelect.value = activeSet;
    sequenceSelect.value = sequenceMode;
  }

  revealButton.addEventListener("click", function () {
    setAnswerVisibility(!answerRevealed, true);
  });

  nextButton.addEventListener("click", showNextCard);

  restartButton.addEventListener("click", function () {
    resetRound(true);
  });

  setSelect.addEventListener("change", function () {
    activeSet = setSelect.value;
    resetRound(true);
  });

  sequenceSelect.addEventListener("change", function () {
    sequenceMode = sequenceSelect.value;
    resetRound(true);
  });

  document.addEventListener("keydown", function (event) {
    var target = event.target;
    var isInteractiveTarget = target.matches(
      "input, select, textarea, button, a, [contenteditable=\"true\"]"
    );

    if (
      event.defaultPrevented ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      isInteractiveTarget
    ) {
      return;
    }

    if (event.code === "Space") {
      event.preventDefault();
      setAnswerVisibility(!answerRevealed, true);
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      showNextCard();
    }
  });

  restoreControlValues();
  resetRound(false);
})();

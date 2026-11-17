const WORDS = {
  food: ["Pancakes", "Sushi", "Popcorn", "Watermelon", "Tacos", "Ice cream", "Avocado", "Pizza", "Dumplings", "Lemonade", "Brownie", "Cereal"],
  animals: ["Penguin", "Octopus", "Giraffe", "Dolphin", "Hedgehog", "Flamingo", "Turtle", "Koala", "Peacock", "Raccoon", "Jellyfish", "Llama"],
  locations: ["Aquarium", "Airport", "Camping", "Museum", "Lighthouse", "Rooftop", "Library", "Waterfall", "Movie theater", "Amusement park", "Bakery", "Beach", "Balboa Park", "San Diego Zoo", "La Jolla Cove", "Coronado Island", "Gaslamp Quarter", "Old Town San Diego", "Petco Park", "Sunset Cliffs", "USS Midway Museum", "Seaport Village", "Torrey Pines", "Mission Beach", "Cabrillo National Monument", "Liberty Public Market", "Stacks", "Cabana", "Barn", "Prison", "New York City", "London", "Paris", "Tokyo", "Rome", "Sydney", "Dubai", "Singapore", "Hong Kong", "Mexico City", "Rio de Janeiro", "Cairo", "Istanbul", "Seoul", "Bangkok", "Amsterdam", "Barcelona", "Los Angeles", "New Delhi", "Cape Town"],
  things: ["Umbrella", "Sunglasses", "Backpack", "Candle", "Alarm clock", "Roller skates", "Toothbrush", "Headphones", "Snow globe", "Flashlight", "Suitcase", "Slippers"],
  activities: ["Karaoke", "Gardening", "Skateboarding", "Baking", "Photography", "Kite flying", "Dancing", "Fishing", "Yoga", "Bowling", "Skiing", "Paddleboarding"]
};

const CATEGORY_LABELS = {
  food: "Food & drink",
  animals: "Animals",
  locations: "Locations",
  things: "Everyday things",
  activities: "Things to do",
  people: "People"
};

const MIN_PLAYERS = 3;
const MAX_PLAYERS = 20;

const screens = {
  setup: document.querySelector("#setup-screen"),
  deal: document.querySelector("#deal-screen"),
  discussion: document.querySelector("#discussion-screen"),
  result: document.querySelector("#result-screen")
};

const playerList = document.querySelector("#player-list");
const playerCount = document.querySelector("#player-count");
const setupError = document.querySelector("#setup-error");
const startButton = document.querySelector("#start-game");
const categorySelect = document.querySelector("#category-select");
const impostorCountSelect = document.querySelector("#impostor-count");
const peopleListField = document.querySelector("#people-list-field");
const peopleListInput = document.querySelector("#people-list-input");
const peopleListError = document.querySelector("#people-list-error");
const currentPlayerName = document.querySelector("#current-player-name");
const cardCategory = document.querySelector("#card-category");
const cardContent = document.querySelector("#card-content");
const cardHint = document.querySelector("#card-hint");
const secretCard = document.querySelector("#secret-card");
const revealCardButton = document.querySelector("#reveal-card");
const passPhoneButton = document.querySelector("#pass-phone");
const dealPosition = document.querySelector("#deal-position");

let players = ["sof", "mont", "meegs", "marj", "ava", "saff", "viv", "summz", "lior"];
let currentPlayerIndex = 0;
let impostorIndices = new Set();
let secretWord = "";
let secretCategory = "";
let cardIsRevealed = false;
let roundNumber = 1;

function getPeopleNames() {
  return peopleListInput.value.split(/\r?\n/).map((name) => name.trim()).filter(Boolean);
}

function setPeopleListError(message) {
  peopleListError.textContent = message;
  peopleListError.hidden = !message;
}

function syncPeopleCategory() {
  peopleListField.hidden = categorySelect.value !== "people";
}

function renderPlayers() {
  playerList.replaceChildren();

  players.forEach((name, index) => {
    const row = document.createElement("div");
    row.className = "player-row";

    const number = document.createElement("span");
    number.className = "player-number";
    number.textContent = String(index + 1).padStart(2, "0");

    const input = document.createElement("input");
    input.className = "player-input";
    input.type = "text";
    input.maxLength = 24;
    input.autocomplete = "off";
    input.value = name;
    input.placeholder = `Player ${index + 1}`;
    input.setAttribute("aria-label", `Player ${index + 1} name`);
    input.addEventListener("input", () => {
      players[index] = input.value;
      updatePlayerCount();
      clearSetupError();
    });

    const removeButton = document.createElement("button");
    removeButton.className = "remove-player";
    removeButton.type = "button";
    removeButton.textContent = "×";
    removeButton.setAttribute("aria-label", `Remove player ${index + 1}`);
    removeButton.disabled = players.length <= MIN_PLAYERS;
    removeButton.addEventListener("click", () => {
      players.splice(index, 1);
      renderPlayers();
    });

    row.append(number, input, removeButton);
    playerList.append(row);
  });

  document.querySelector("#add-player").disabled = players.length >= MAX_PLAYERS;
  document.querySelector("#add-player").setAttribute("aria-disabled", String(players.length >= MAX_PLAYERS));
  updatePlayerCount();
}

function updatePlayerCount() {
  playerCount.textContent = `${players.length} ${players.length === 1 ? "player" : "players"}`;
}

function clearSetupError() {
  setupError.hidden = true;
  setupError.textContent = "";
}

function showScreen(screenName) {
  Object.entries(screens).forEach(([name, screen]) => {
    screen.hidden = name !== screenName;
  });
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function getPlayerNames() {
  return players.map((name, index) => name.trim() || `Player ${index + 1}`);
}

function chooseWord() {
  const selectedCategory = categorySelect.value;
  const categoryKeys = selectedCategory === "all"
    ? [...Object.keys(WORDS), ...(getPeopleNames().length ? ["people"] : [])]
    : [selectedCategory];
  const category = categoryKeys[Math.floor(Math.random() * categoryKeys.length)];
  const wordList = category === "people" ? getPeopleNames() : WORDS[category];
  const word = wordList[Math.floor(Math.random() * wordList.length)];
  return { category, word };
}

function startRound() {
  const playerNames = getPlayerNames();
  const impostorCount = Number(impostorCountSelect.value);
  const requiredPlayers = Math.max(MIN_PLAYERS, impostorCount + 1);
  if (categorySelect.value === "people" && getPeopleNames().length === 0) {
    setPeopleListError("Add at least one name to play the People category.");
    peopleListInput.focus();
    return;
  }
  setPeopleListError("");
  if (playerNames.length < requiredPlayers) {
    setupError.textContent = `You need at least ${requiredPlayers} players for ${impostorCount} ${impostorCount === 1 ? "impostor" : "impostors"}.`;
    setupError.hidden = false;
    return;
  }

  players = playerNames;
  currentPlayerIndex = 0;
  const shuffledIndices = players.map((_, index) => index);
  for (let index = 0; index < impostorCount; index += 1) {
    const swapIndex = index + Math.floor(Math.random() * (shuffledIndices.length - index));
    [shuffledIndices[index], shuffledIndices[swapIndex]] = [shuffledIndices[swapIndex], shuffledIndices[index]];
  }
  impostorIndices = new Set(shuffledIndices.slice(0, impostorCount));
  ({ category: secretCategory, word: secretWord } = chooseWord());
  document.querySelector("#round-label").textContent = `ROUND ${String(roundNumber).padStart(2, "0")}`;
  setupDealCard();
  showScreen("deal");
}

function setupDealCard() {
  const isImpostor = impostorIndices.has(currentPlayerIndex);
  currentPlayerName.textContent = players[currentPlayerIndex];
  dealPosition.textContent = `PLAYER ${currentPlayerIndex + 1} OF ${players.length}`;
  cardCategory.textContent = CATEGORY_LABELS[secretCategory];
  cardContent.textContent = "Tap to reveal";
  cardHint.textContent = "Only you should look";
  secretCard.setAttribute("aria-label", `Tap to reveal ${players[currentPlayerIndex]}'s card`);
  secretCard.classList.remove("is-revealed", "is-impostor");
  cardIsRevealed = false;
  revealCardButton.hidden = false;
  passPhoneButton.hidden = true;

  const revealCard = () => {
    if (cardIsRevealed) return;
    cardIsRevealed = true;
    secretCard.classList.add("is-revealed");
    if (isImpostor) {
      secretCard.classList.add("is-impostor");
      cardContent.textContent = "You’re the impostor";
      cardHint.textContent = "Blend in. Don’t get caught.";
    } else {
      cardContent.textContent = secretWord;
      cardHint.textContent = "Keep it secret. Blend in.";
    }
    secretCard.setAttribute("aria-label", `Card revealed for ${players[currentPlayerIndex]}`);
    revealCardButton.hidden = true;
    passPhoneButton.hidden = false;
  };

  secretCard.onclick = revealCard;
  revealCardButton.onclick = revealCard;
}

function passPhone() {
  currentPlayerIndex += 1;
  if (currentPlayerIndex < players.length) {
    setupDealCard();
    document.querySelector("#deal-title").focus();
    return;
  }

  showScreen("discussion");
  document.querySelector("#reveal-impostor").focus();
}

function revealImpostor() {
  const impostorNames = players.filter((_, index) => impostorIndices.has(index));
  document.querySelector("#result-label").textContent = impostorNames.length === 1
    ? "THE IMPOSTOR WAS"
    : "THE IMPOSTORS WERE";
  document.querySelector("#impostor-names").textContent = impostorNames.join(", ");
  document.querySelector("#result-word").textContent = secretWord;
  document.querySelector("#result-category").textContent = CATEGORY_LABELS[secretCategory];
  showScreen("result");
  document.querySelector("#play-again").focus();
}

document.querySelector("#add-player").addEventListener("click", () => {
  if (players.length >= MAX_PLAYERS) return;
  players.push("");
  clearSetupError();
  renderPlayers();
  playerList.lastElementChild?.querySelector("input")?.focus();
});

document.querySelector("#back-to-setup").addEventListener("click", () => {
  roundNumber = 1;
  showScreen("setup");
});

startButton.addEventListener("click", startRound);
passPhoneButton.addEventListener("click", passPhone);
document.querySelector("#reveal-impostor").addEventListener("click", revealImpostor);

document.querySelector("#play-again").addEventListener("click", () => {
  roundNumber += 1;
  startRound();
});

document.querySelector("#new-game").addEventListener("click", () => {
  roundNumber = 1;
  showScreen("setup");
  playerList.querySelector("input")?.focus();
});

categorySelect.addEventListener("change", clearSetupError);
impostorCountSelect.addEventListener("change", clearSetupError);
categorySelect.addEventListener("change", syncPeopleCategory);
peopleListInput.addEventListener("input", () => {
  try {
    localStorage.setItem("odd-one-out-people", peopleListInput.value);
    setPeopleListError("");
  } catch (error) {
    setPeopleListError("Could not save this list in your browser. The names will be available only until you close this page.");
    console.error("Could not save the People list to local storage.", error);
  }
  clearSetupError();
});

try {
  peopleListInput.value = localStorage.getItem("odd-one-out-people") || "";
} catch (error) {
  setPeopleListError("Could not load a saved People list from this browser.");
  console.error("Could not load the People list from local storage.", error);
}

renderPlayers();
syncPeopleCategory();

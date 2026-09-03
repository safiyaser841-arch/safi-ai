const chat = document.getElementById("chat");
const messageInput = document.getElementById("messageInput");
const sendButton = document.getElementById("sendButton");
const clearButton = document.getElementById("clearButton");
const newChatButton = document.getElementById("newChatButton");

let messages = JSON.parse(localStorage.getItem("safiAI_messages")) || [];

function saveMessages() {
  localStorage.setItem("safiAI_messages", JSON.stringify(messages));
}

function addMessage(text, sender) {
  const message = document.createElement("div");
  message.className = `message ${sender}`;

  const avatar = document.createElement("div");
  avatar.className = "message-avatar";
  avatar.textContent = sender === "user" ? "Du" : "S";

  const content = document.createElement("div");
  content.className = "message-content";
  content.textContent = text;

  message.appendChild(avatar);
  message.appendChild(content);

  chat.appendChild(message);

  chat.scrollTop = chat.scrollHeight;
}

function showTyping() {
  const typing = document.createElement("div");
  typing.className = "message";
  typing.id = "typing";

  typing.innerHTML = `
    <div class="message-avatar">S</div>
    <div class="message-content">
      <div class="typing">
        <span></span>
        <span></span>
        <span></span>
      </div>
    </div>
  `;

  chat.appendChild(typing);
  chat.scrollTop = chat.scrollHeight;
}

function removeTyping() {
  const typing = document.getElementById("typing");

  if (typing) {
    typing.remove();
  }
}

function getAIResponse(text) {
  const message = text.toLowerCase();

  if (
    message.includes("hallo") ||
    message.includes("hi") ||
    message.includes("hey")
  ) {
    return "Hey! 👋 Ich bin Safi AI. Wie kann ich dir helfen?";
  }

  if (
    message.includes("wer bist du") ||
    message.includes("was bist du")
  ) {
    return "Ich bin Safi AI 🤖 – dein persönlicher KI-Assistent.";
  }

  if (
    message.includes("programmieren") ||
    message.includes("javascript") ||
    message.includes("html") ||
    message.includes("css") ||
    message.includes("code")
  ) {
    return "Klar! 💻 Ich kann dir beim Programmieren helfen. Sag mir einfach, was du bauen möchtest.";
  }

  if (
    message.includes("spiel") ||
    message.includes("game")
  ) {
    return "🎮 Eine Spielidee wäre zum Beispiel ein kleines PvP-Spiel mit Spielern, Bots, verschiedenen Waffen und Maps.";
  }

  if (
    message.includes("mathe") ||
    message.includes("mathematik") ||
    message.includes("rechnung")
  ) {
    return "🧮 Klar! Schick mir deine Matheaufgabe und ich erkläre dir den Rechenweg Schritt für Schritt.";
  }

  if (
    message.includes("übersetz") ||
    message.includes("translate") ||
    message.includes("englisch")
  ) {
    return "🌎 Klar! Schick mir den Text und sag mir, in welche Sprache du ihn übersetzen möchtest.";
  }

  if (
    message.includes("danke") ||
    message.includes("thx")
  ) {
    return "Gerne! 😎";
  }

  return "Ich bin gerade noch eine Demo-Version von Safi AI. 🤖 Du kannst mir trotzdem Fragen stellen – später können wir eine echte KI anschließen.";
}

function sendMessage(text = null) {
  const message = text || messageInput.value.trim();

  if (!message) {
    return;
  }

  const welcome = document.getElementById("welcome");

  if (welcome) {
    welcome.remove();
  }

  addMessage(message, "user");

  messages.push({
    text: message,
    sender: "user"
  });

  saveMessages();

  messageInput.value = "";
  messageInput.style.height = "auto";

  showTyping();

  setTimeout(() => {
    removeTyping();

    const response = getAIResponse(message);

    addMessage(response, "ai");

    messages.push({
      text: response,
      sender: "ai"
    });

    saveMessages();
  }, 700);
}

sendButton.addEventListener("click", () => {
  sendMessage();
});

messageInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    sendMessage();
  }
});

messageInput.addEventListener("input", () => {
  messageInput.style.height = "auto";
  messageInput.style.height =
    Math.min(messageInput.scrollHeight, 150) + "px";
});

document.querySelectorAll(".suggestion").forEach((button) => {
  button.addEventListener("click", () => {
    sendMessage(button.textContent.trim());
  });
});

clearButton.addEventListener("click", () => {
  localStorage.removeItem("safiAI_messages");
  messages = [];

  location.reload();
});

newChatButton.addEventListener("click", () => {
  localStorage.removeItem("safiAI_messages");
  messages = [];

  location.reload();
});

function loadMessages() {
  if (messages.length === 0) {
    return;
  }

  const welcome = document.getElementById("welcome");

  if (welcome) {
    welcome.remove();
  }

  messages.forEach((message) => {
    addMessage(message.text, message.sender);
  });
}

loadMessages();

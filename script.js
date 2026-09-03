const chat = document.getElementById("chat");
const messageInput = document.getElementById("messageInput");
const sendButton = document.getElementById("sendButton");
const clearButton = document.getElementById("clearButton");
const newChatButton = document.getElementById("newChatButton");

const SERVER_URL = "DEINE-RENDER-URL";

let messages = [];
let previousInteractionId = null;

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

  window.scrollTo({
    top: document.body.scrollHeight,
    behavior: "smooth"
  });
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

  window.scrollTo({
    top: document.body.scrollHeight,
    behavior: "smooth"
  });
}

function removeTyping() {
  const typing = document.getElementById("typing");

  if (typing) {
    typing.remove();
  }
}

async function sendMessage(text = null) {
  const message = text || messageInput.value.trim();

  if (!message) return;

  const welcome = document.getElementById("welcome");

  if (welcome) {
    welcome.remove();
  }

  addMessage(message, "user");

  messageInput.value = "";
  messageInput.style.height = "auto";

  sendButton.disabled = true;

  showTyping();

  try {
    const response = await fetch(`${SERVER_URL}/chat`, {
      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify({
        message: message,
        previousInteractionId: previousInteractionId
      })
    });

    const data = await response.json();

    removeTyping();

    if (!response.ok) {
      throw new Error(data.error || "Serverfehler");
    }

    addMessage(data.reply, "ai");

    previousInteractionId = data.interactionId;

  } catch (error) {
    removeTyping();

    console.error(error);

    addMessage(
      "❌ Ich konnte den KI-Server gerade nicht erreichen. Bitte versuche es gleich noch einmal.",
      "ai"
    );
  }

  sendButton.disabled = false;

  messageInput.focus();
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
  messages = [];
  previousInteractionId = null;

  location.reload();
});

newChatButton.addEventListener("click", () => {
  messages = [];
  previousInteractionId = null;

  location.reload();
});

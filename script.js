const messages = document.getElementById("messages");
const welcome = document.getElementById("welcome");
const input = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");

const newChatBtn = document.getElementById("newChatBtn");
const clearChatBtn = document.getElementById("clearChatBtn");

const attachBtn = document.getElementById("attachBtn");
const imageBtn = document.getElementById("imageBtn");

const fileInput = document.getElementById("fileInput");
const imageInput = document.getElementById("imageInput");

const filePreview = document.getElementById("filePreview");

const chatHistory = document.getElementById("chatHistory");

const accountBtn = document.getElementById("accountBtn");
const settingsBtn = document.getElementById("settingsBtn");

const accountModal = document.getElementById("accountModal");
const settingsModal = document.getElementById("settingsModal");

const themeBtn = document.getElementById("themeBtn");
const storageBtn = document.getElementById("storageBtn");

const mobileMenuBtn = document.getElementById("mobileMenuBtn");
const sidebar = document.querySelector(".sidebar");

let selectedFiles = [];

let chats = JSON.parse(
  localStorage.getItem("safi_chats") || "[]"
);

let currentChat = [];


/* =========================
   CHAT STORAGE
========================= */

function saveChats() {
  localStorage.setItem(
    "safi_chats",
    JSON.stringify(chats)
  );
}


/* =========================
   ADD MESSAGE
========================= */

function addMessage(text, type) {

  welcome.classList.add("hidden");

  const wrapper = document.createElement("div");
  wrapper.className = `message ${type}`;

  const avatar = document.createElement("div");
  avatar.className = "message-avatar";
  avatar.textContent =
    type === "user" ? "U" : "S";

  const body = document.createElement("div");

  const name = document.createElement("div");
  name.className = "message-name";
  name.textContent =
    type === "user"
      ? "Du"
      : "Safi AI";

  const content = document.createElement("div");
  content.className = "message-content";
  content.textContent = text;

  body.appendChild(name);
  body.appendChild(content);

  wrapper.appendChild(avatar);
  wrapper.appendChild(body);

  messages.appendChild(wrapper);

  messages.scrollTop =
    messages.scrollHeight;

  currentChat.push({
    role: type,
    text
  });
}


/* =========================
   SEND
========================= */

async function sendMessage() {

  const text = input.value.trim();

  if (!text && selectedFiles.length === 0) {
    return;
  }

  const files = [...selectedFiles];

  input.value = "";
  selectedFiles = [];

  updateFilePreview();

  addMessage(text, "user");

  const loading = document.createElement("div");

  loading.className = "message assistant";
  loading.id = "loading";

  loading.innerHTML = `
    <div class="message-avatar">S</div>
    <div>
      <div class="message-name">Safi AI</div>
      <div class="message-content">Denke nach...</div>
    </div>
  `;

  messages.appendChild(loading);

  messages.scrollTop =
    messages.scrollHeight;

  try {

    const formData = new FormData();

    formData.append(
      "message",
      text
    );

    for (const file of files) {
      formData.append(
        "files",
        file
      );
    }

    const response = await fetch(
      "/chat",
      {
        method: "POST",
        body: formData
      }
    );

    const data = await response.json();

    loading.remove();

    if (!response.ok) {
      throw new Error(
        data.error ||
        "Serverfehler"
      );
    }

    addMessage(
      data.response,
      "assistant"
    );

    saveCurrentChat();

  } catch (error) {

    loading.remove();

    addMessage(
      "Es ist ein Fehler aufgetreten: " +
      error.message,
      "assistant"
    );
  }
}


/* =========================
   SAVE CURRENT CHAT
========================= */

function saveCurrentChat() {

  if (
    currentChat.length === 0
  ) {
    return;
  }

  const firstUserMessage =
    currentChat.find(
      (m) => m.role === "user"
    );

  const title =
    firstUserMessage?.text
      ?.slice(0, 35) ||
    "Neuer Chat";

  chats.unshift({
    title,
    messages: currentChat
  });

  chats = chats.slice(0, 30);

  saveChats();

  renderHistory();
}


/* =========================
   HISTORY
========================= */

function renderHistory() {

  chatHistory.innerHTML = "";

  chats.forEach((chat) => {

    const item =
      document.createElement("div");

    item.className =
      "history-item";

    item.textContent =
      chat.title;

    chatHistory.appendChild(item);

  });
}


/* =========================
   NEW CHAT
========================= */

newChatBtn.addEventListener(
  "click",
  () => {

    currentChat = [];

    messages.innerHTML = "";

    welcome.classList.remove(
      "hidden"
    );

  }
);


/* =========================
   CLEAR
========================= */

clearChatBtn.addEventListener(
  "click",
  () => {

    currentChat = [];

    messages.innerHTML = "";

    welcome.classList.remove(
      "hidden"
    );

  }
);


/* =========================
   SEND BUTTON
========================= */

sendBtn.addEventListener(
  "click",
  sendMessage
);


/* =========================
   ENTER
========================= */

input.addEventListener(
  "keydown",
  (event) => {

    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {

      event.preventDefault();

      sendMessage();
    }

  }
);


/* =========================
   AUTO TEXTAREA
========================= */

input.addEventListener(
  "input",
  () => {

    input.style.height =
      "auto";

    input.style.height =
      Math.min(
        input.scrollHeight,
        150
      ) + "px";

  }
);


/* =========================
   FILES
========================= */

attachBtn.addEventListener(
  "click",
  () => fileInput.click()
);

imageBtn.addEventListener(
  "click",
  () => imageInput.click()
);


fileInput.addEventListener(
  "change",
  () => {

    selectedFiles.push(
      ...Array.from(
        fileInput.files
      )
    );

    updateFilePreview();

  }
);


imageInput.addEventListener(
  "change",
  () => {

    selectedFiles.push(
      ...Array.from(
        imageInput.files
      )
    );

    updateFilePreview();

  }
);


function updateFilePreview() {

  if (
    selectedFiles.length === 0
  ) {

    filePreview.textContent =
      "";

    return;
  }

  filePreview.textContent =
    selectedFiles
      .map(
        (file) =>
          "📎 " + file.name
      )
      .join(" • ");

}


/* =========================
   SUGGESTIONS
========================= */

document
  .querySelectorAll(".card")
  .forEach((card) => {

    card.addEventListener(
      "click",
      () => {

        input.value =
          card.dataset.prompt;

        input.focus();

      }
    );

  });


/* =========================
   ACCOUNT
========================= */

accountBtn.addEventListener(
  "click",
  () => {

    accountModal.classList.remove(
      "hidden"
    );

  }
);


/* =========================
   SETTINGS
========================= */

settingsBtn.addEventListener(
  "click",
  () => {

    settingsModal.classList.remove(
      "hidden"
    );

  }
);


/* =========================
   CLOSE MODALS
========================= */

document
  .querySelectorAll("[data-close]")
  .forEach((button) => {

    button.addEventListener(
      "click",
      () => {

        const id =
          button.dataset.close;

        document
          .getElementById(id)
          .classList.add(
            "hidden"
          );

      }
    );

  });


/* =========================
   THEME
========================= */

themeBtn.addEventListener(
  "click",
  () => {

    document.body.classList.toggle(
      "light"
    );

    const light =
      document.body.classList.contains(
        "light"
      );

    themeBtn.textContent =
      light ? "Hell" : "Dunkel";

    localStorage.setItem(
      "safi_theme",
      light ? "light" : "dark"
    );

  }
);


/* =========================
   STORAGE BUTTON
========================= */

storageBtn.addEventListener(
  "click",
  () => {

    const current =
      localStorage.getItem(
        "safi_storage"
      ) !== "off";

    localStorage.setItem(
      "safi_storage",
      current ? "off" : "on"
    );

    storageBtn.textContent =
      current ? "Aus" : "An";

  }
);


/* =========================
   MOBILE MENU
========================= */

mobileMenuBtn.addEventListener(
  "click",
  () => {

    sidebar.classList.toggle(
      "open"
    );

  }
);


/* =========================
   MICROPHONE
========================= */

const micBtn =
  document.getElementById(
    "micBtn"
  );

let recognition = null;

if (
  "webkitSpeechRecognition" in window ||
  "SpeechRecognition" in window
) {

  const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;

  recognition =
    new SpeechRecognition();

  recognition.lang = "de-DE";

  recognition.continuous = false;

  recognition.interimResults =
    false;

  recognition.onresult =
    (event) => {

      input.value =
        event.results[0][0]
          .transcript;

      input.focus();

    };

  recognition.onerror =
    () => {

      console.log(
        "Spracherkennung konnte nicht gestartet werden."
      );

    };

}


micBtn.addEventListener(
  "click",
  () => {

    if (!recognition) {

      alert(
        "Spracherkennung wird von diesem Browser nicht unterstützt."
      );

      return;
    }

    recognition.start();

  }
);


/* =========================
   LOAD SETTINGS
========================= */

const savedTheme =
  localStorage.getItem(
    "safi_theme"
  );

if (savedTheme === "light") {

  document.body.classList.add(
    "light"
  );

  themeBtn.textContent =
    "Hell";

}


const savedStorage =
  localStorage.getItem(
    "safi_storage"
  );

if (savedStorage === "off") {

  storageBtn.textContent =
    "Aus";

}


/* =========================
   START
========================= */

renderHistory();

console.log(
  "Safi AI Frontend gestartet."
);

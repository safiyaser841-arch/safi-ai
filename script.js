// ================================
// SAFI AI - SCRIPT
// ================================

const messageInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");
const messages = document.getElementById("messages");
const welcomeScreen = document.getElementById("welcomeScreen");

const newChatBtn = document.getElementById("newChatBtn");
const clearChatBtn = document.getElementById("clearChatBtn");
const chatHistory = document.getElementById("chatHistory");

const attachBtn = document.getElementById("attachBtn");
const imageBtn = document.getElementById("imageBtn");

const fileInput = document.getElementById("fileInput");
const imageInput = document.getElementById("imageInput");

const micBtn = document.getElementById("micBtn");

const mobileMenuBtn = document.getElementById("mobileMenuBtn");
const sidebar = document.getElementById("sidebar");

const accountBtn = document.getElementById("accountBtn");
const settingsBtn = document.getElementById("settingsBtn");

const accountModal = document.getElementById("accountModal");
const settingsModal = document.getElementById("settingsModal");

const loginTab = document.getElementById("loginTab");
const registerTab = document.getElementById("registerTab");

const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");

const accountMessage = document.getElementById("accountMessage");

const themeBtn = document.getElementById("themeBtn");
const storageBtn = document.getElementById("storageBtn");


// ================================
// STATE
// ================================

let chats = JSON.parse(
  localStorage.getItem("safi_chats") || "[]"
);

let currentChatId = localStorage.getItem(
  "safi_current_chat"
);

let selectedFiles = [];

let mediaRecorder = null;
let audioChunks = [];


// ================================
// INITIALISIERUNG
// ================================

function createChat() {
  const chat = {
    id: Date.now().toString(),
    title: "Neuer Chat",
    messages: []
  };

  chats.unshift(chat);

  currentChatId = chat.id;

  saveChats();
  renderChatHistory();
  renderCurrentChat();
}

function saveChats() {
  localStorage.setItem(
    "safi_chats",
    JSON.stringify(chats)
  );

  localStorage.setItem(
    "safi_current_chat",
    currentChatId || ""
  );
}

function getCurrentChat() {
  return chats.find(
    chat => chat.id === currentChatId
  );
}


// Wenn noch kein Chat existiert
if (!chats.length) {
  createChat();
} else if (
  !currentChatId ||
  !chats.some(chat => chat.id === currentChatId)
) {
  currentChatId = chats[0].id;

  saveChats();
}

renderChatHistory();
renderCurrentChat();


// ================================
// CHAT HISTORY
// ================================

function renderChatHistory() {
  chatHistory.innerHTML = "";

  chats.forEach(chat => {
    const item = document.createElement("div");

    item.className =
      "chat-item" +
      (chat.id === currentChatId ? " active" : "");

    item.textContent =
      chat.title || "Neuer Chat";

    item.title =
      chat.title || "Neuer Chat";

    item.addEventListener("click", () => {
      currentChatId = chat.id;

      saveChats();
      renderChatHistory();
      renderCurrentChat();

      sidebar.classList.remove("open");
    });

    chatHistory.appendChild(item);
  });
}


// ================================
// RENDER CHAT
// ================================

function renderCurrentChat() {
  const chat = getCurrentChat();

  if (!chat) {
    createChat();
    return;
  }

  messages.innerHTML = "";

  if (!chat.messages.length) {
    welcomeScreen.style.display = "block";
  } else {
    welcomeScreen.style.display = "none";

    chat.messages.forEach(message => {
      renderMessage(
        message.role,
        message.text,
        false
      );
    });
  }

  scrollToBottom();
}

function renderMessage(role, text, animate = true) {
  const wrapper = document.createElement("div");

  wrapper.className =
    `message ${role}`;

  if (!animate) {
    wrapper.style.animation = "none";
  }

  const avatar = document.createElement("div");

  avatar.className = "message-avatar";

  avatar.textContent =
    role === "user" ? "Du" : "S";


  const content = document.createElement("div");

  content.className = "message-content";

  content.textContent = text;


  wrapper.appendChild(avatar);
  wrapper.appendChild(content);

  messages.appendChild(wrapper);

  return wrapper;
}


// ================================
// SEND MESSAGE
// ================================

async function sendMessage(customText = null) {
  const text =
    customText !== null
      ? customText.trim()
      : messageInput.value.trim();

  if (!text && selectedFiles.length === 0) {
    return;
  }

  const chat = getCurrentChat();

  if (!chat) {
    createChat();
    return;
  }


  // Erste Nachricht wird zum Chatnamen
  if (
    chat.messages.length === 0 &&
    text
  ) {
    chat.title =
      text.length > 35
        ? text.substring(0, 35) + "..."
        : text;
  }


  // User-Nachricht speichern
  if (text) {
    chat.messages.push({
      role: "user",
      text
    });
  }

  saveChats();

  welcomeScreen.style.display = "none";


  if (text) {
    renderMessage("user", text);
  }


  messageInput.value = "";

  autoResizeTextarea();

  renderChatHistory();

  scrollToBottom();


  // Typing anzeigen
  const typing = createTypingIndicator();

  sendBtn.disabled = true;


  try {
    const formData = new FormData();

    formData.append(
      "message",
      text
    );


    selectedFiles.forEach(file => {
      formData.append(
        "files",
        file
      );
    });


    const response = await fetch(
      "/chat",
      {
        method: "POST",
        body: formData
      }
    );


    let data = null;

    try {
      data = await response.json();
    } catch {
      throw new Error(
        "Der Server hat keine gültige Antwort gesendet."
      );
    }


    if (!response.ok) {
      throw new Error(
        data?.error ||
        "Safi AI konnte nicht antworten."
      );
    }


    const answer =
      data.response ||
      data.text ||
      data.message;


    if (!answer) {
      throw new Error(
        "Safi AI hat keine Antwort erhalten."
      );
    }


    // Antwort speichern
    chat.messages.push({
      role: "assistant",
      text: answer
    });

    saveChats();


    // Typing entfernen
    typing.remove();


    // Antwort anzeigen
    renderMessage(
      "assistant",
      answer
    );

    scrollToBottom();


  } catch (error) {

    console.error(
      "Safi AI Fehler:",
      error
    );


    typing.remove();


    const errorText =
      error.message ||
      "Es ist ein unbekannter Fehler aufgetreten.";


    renderMessage(
      "assistant",
      "⚠️ " + errorText
    );


  } finally {

    selectedFiles = [];

    sendBtn.disabled = false;

    messageInput.focus();

  }
}


// ================================
// SEND BUTTON
// ================================

sendBtn.addEventListener(
  "click",
  () => {
    sendMessage();
  }
);


// ================================
// ENTER SENDEN
// ================================

messageInput.addEventListener(
  "keydown",
  event => {

    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {

      event.preventDefault();

      sendMessage();
    }

  }
);


// ================================
// TEXTAREA AUTO RESIZE
// ================================

messageInput.addEventListener(
  "input",
  autoResizeTextarea
);

function autoResizeTextarea() {

  messageInput.style.height = "auto";

  messageInput.style.height =
    Math.min(
      messageInput.scrollHeight,
      140
    ) + "px";
}


// ================================
// TYPING INDICATOR
// ================================

function createTypingIndicator() {

  const wrapper =
    document.createElement("div");

  wrapper.className =
    "message assistant";


  const avatar =
    document.createElement("div");

  avatar.className =
    "message-avatar";

  avatar.textContent = "S";


  const content =
    document.createElement("div");

  content.className =
    "message-content";


  const typing =
    document.createElement("div");

  typing.className =
    "typing";


  for (let i = 0; i < 3; i++) {

    const dot =
      document.createElement("span");

    typing.appendChild(dot);
  }


  content.appendChild(typing);

  wrapper.appendChild(avatar);
  wrapper.appendChild(content);

  messages.appendChild(wrapper);

  scrollToBottom();

  return wrapper;
}


// ================================
// SCROLL
// ================================

function scrollToBottom() {

  requestAnimationFrame(() => {

    const chatArea =
      document.getElementById("chatArea");

    chatArea.scrollTop =
      chatArea.scrollHeight;

  });
}


// ================================
// NEUER CHAT
// ================================

newChatBtn.addEventListener(
  "click",
  () => {

    createChat();

    messageInput.focus();

    sidebar.classList.remove("open");

  }
);


// ================================
// CHAT LEEREN
// ================================

clearChatBtn.addEventListener(
  "click",
  () => {

    const chat = getCurrentChat();

    if (!chat) return;


    chat.messages = [];

    chat.title = "Neuer Chat";

    saveChats();

    renderChatHistory();

    renderCurrentChat();

  }
);


// ================================
// SUGGESTIONS
// ================================

document
  .querySelectorAll(".suggestion-card")
  .forEach(button => {

    button.addEventListener(
      "click",
      () => {

        const prompt =
          button.dataset.prompt || "";

        messageInput.value =
          prompt;

        autoResizeTextarea();

        sendMessage();

      }
    );

  });


// ================================
// DATEI UPLOAD
// ================================

attachBtn.addEventListener(
  "click",
  () => {
    fileInput.click();
  }
);

fileInput.addEventListener(
  "change",
  () => {

    if (!fileInput.files.length) {
      return;
    }

    selectedFiles = [
      ...selectedFiles,
      ...Array.from(fileInput.files)
    ];

    showFileNotice(
      selectedFiles
    );

    fileInput.value = "";

  }
);


// ================================
// BILD UPLOAD
// ================================

imageBtn.addEventListener(
  "click",
  () => {
    imageInput.click();
  }
);

imageInput.addEventListener(
  "change",
  () => {

    if (!imageInput.files.length) {
      return;
    }

    selectedFiles = [
      ...selectedFiles,
      ...Array.from(imageInput.files)
    ];

    showFileNotice(
      selectedFiles
    );

    imageInput.value = "";

  }
);


// ================================
// DATEI ANZEIGEN
// ================================

function showFileNotice(files) {

  if (!files.length) return;

  const names =
    files
      .map(file => file.name)
      .join(", ");


  messageInput.placeholder =
    `${files.length} Datei(en) ausgewählt: ${names}`;

}


// ================================
// MIKROFON
// ================================

micBtn.addEventListener(
  "click",
  async () => {

    if (
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia
    ) {

      alert(
        "Dein Browser unterstützt keine Sprachaufnahme."
      );

      return;
    }


    if (mediaRecorder &&
        mediaRecorder.state === "recording") {

      mediaRecorder.stop();

      return;
    }


    try {

      const stream =
        await navigator.mediaDevices.getUserMedia({
          audio: true
        });


      audioChunks = [];


      mediaRecorder =
        new MediaRecorder(stream);


      mediaRecorder.ondataavailable =
        event => {

          if (event.data.size > 0) {
            audioChunks.push(
              event.data
            );
          }

        };


      mediaRecorder.onstop =
        () => {

          stream
            .getTracks()
            .forEach(track =>
              track.stop()
            );


          const blob =
            new Blob(
              audioChunks,
              {
                type:
                  mediaRecorder.mimeType ||
                  "audio/webm"
              }
            );


          const file =
            new File(
              [blob],
              "sprachaufnahme.webm",
              {
                type:
                  blob.type
              }
            );


          selectedFiles.push(file);

          showFileNotice(
            selectedFiles
          );


          micBtn.textContent = "🎙";

        };


      mediaRecorder.start();

      micBtn.textContent = "⏹";

    } catch (error) {

      console.error(
        "Mikrofon-Fehler:",
        error
      );

      alert(
        "Das Mikrofon konnte nicht aktiviert werden."
      );

    }

  }
);


// ================================
// MOBILE SIDEBAR
// ================================

mobileMenuBtn.addEventListener(
  "click",
  () => {

    sidebar.classList.toggle(
      "open"
    );

  }
);


// ================================
// ACCOUNT MODAL
// ================================

accountBtn.addEventListener(
  "click",
  () => {

    openModal(accountModal);

    sidebar.classList.remove("open");

  }
);


// ================================
// SETTINGS MODAL
// ================================

settingsBtn.addEventListener(
  "click",
  () => {

    openModal(settingsModal);

    sidebar.classList.remove("open");

  }
);


// ================================
// MODALS ÖFFNEN / SCHLIESSEN
// ================================

function openModal(modal) {

  modal.classList.add("show");

}

function closeModal(modal) {

  modal.classList.remove("show");

}


document
  .querySelectorAll("[data-close]")
  .forEach(button => {

    button.addEventListener(
      "click",
      () => {

        const id =
          button.dataset.close;

        const modal =
          document.getElementById(id);

        if (modal) {
          closeModal(modal);
        }

      }
    );

  });


document
  .querySelectorAll(".modal-overlay")
  .forEach(overlay => {

    overlay.addEventListener(
      "click",
      event => {

        if (
          event.target === overlay
        ) {

          closeModal(overlay);

        }

      }
    );

  });


// ================================
// ACCOUNT TABS
// ================================

loginTab.addEventListener(
  "click",
  () => {

    loginTab.classList.add(
      "active"
    );

    registerTab.classList.remove(
      "active"
    );

    loginForm.style.display =
      "block";

    registerForm.style.display =
      "none";

    accountMessage.textContent =
      "";

  }
);


registerTab.addEventListener(
  "click",
  () => {

    registerTab.classList.add(
      "active"
    );

    loginTab.classList.remove(
      "active"
    );

    loginForm.style.display =
      "none";

    registerForm.style.display =
      "block";

    accountMessage.textContent =
      "";

  }
);


// ================================
// LOGIN
// ================================

loginForm.addEventListener(
  "submit",
  event => {

    event.preventDefault();

    const email =
      document.getElementById(
        "loginEmail"
      ).value.trim();

    accountMessage.textContent =
      `Konto-Funktion für ${email} wird später mit dem Server verbunden.`;

  }
);


// ================================
// REGISTER
// ================================

registerForm.addEventListener(
  "submit",
  event => {

    event.preventDefault();

    accountMessage.textContent =
      "Die Konto-Funktion wird in der nächsten Version mit einer Datenbank verbunden.";

  }
);


// ================================
// THEME
// ================================

themeBtn.addEventListener(
  "click",
  () => {

    document.body.classList.toggle(
      "light-theme"
    );

    if (
      document.body.classList.contains(
        "light-theme"
      )
    ) {

      themeBtn.textContent =
        "Hell";

    } else {

      themeBtn.textContent =
        "Dunkel";

    }

  }
);


// ================================
// STORAGE
// ================================

storageBtn.addEventListener(
  "click",
  () => {

    const enabled =
      localStorage.getItem(
        "safi_storage_disabled"
      ) !== "true";


    if (enabled) {

      localStorage.setItem(
        "safi_storage_disabled",
        "true"
      );

      storageBtn.textContent =
        "Aus";

    } else {

      localStorage.setItem(
        "safi_storage_disabled",
        "false"
      );

      storageBtn.textContent =
        "Aktiv";

    }

  }
);


// ================================
// ESC SCHLIESST MODALS
// ================================

document.addEventListener(
  "keydown",
  event => {

    if (event.key !== "Escape") {
      return;
    }

    document
      .querySelectorAll(".modal-overlay.show")
      .forEach(modal => {

        closeModal(modal);

      });

  }
);


// ================================
// START
// ================================

messageInput.focus();

console.log(
  "🚀 Safi AI Frontend gestartet"
);

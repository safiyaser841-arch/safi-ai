/* =========================================================
   SAFI AI — FRONTEND
   ========================================================= */

const API_URL = "";

let currentChatId = null;
let chats = [];
let attachments = [];
let isRecording = false;
let mediaRecorder = null;
let audioChunks = [];

let accountMode = "login";


/* =========================================================
   ELEMENTS
   ========================================================= */

const messageInput = document.getElementById("messageInput");
const composer = document.getElementById("composer");
const messages = document.getElementById("messages");
const welcome = document.getElementById("welcome");

const chatHistory = document.getElementById("chatHistory");

const newChatButton = document.getElementById("newChatButton");
const newChatTop = document.getElementById("newChatTop");

const attachButton = document.getElementById("attachButton");
const imageButton = document.getElementById("imageButton");

const imageInput = document.getElementById("imageInput");
const fileInput = document.getElementById("fileInput");

const micButton = document.getElementById("micButton");

const sidebar = document.getElementById("sidebar");
const openSidebar = document.getElementById("openSidebar");
const closeSidebar = document.getElementById("closeSidebar");

const themeButton = document.getElementById("themeButton");

const attachmentPreview =
  document.getElementById("attachmentPreview");

const settingsButton =
  document.getElementById("settingsButton");

const accountButton =
  document.getElementById("accountButton");

const accountLabel =
  document.getElementById("accountLabel");

const accountModal =
  document.getElementById("accountModal");

const settingsModal =
  document.getElementById("settingsModal");

const accountForm =
  document.getElementById("accountForm");

const accountEmail =
  document.getElementById("accountEmail");

const accountPassword =
  document.getElementById("accountPassword");

const accountTitle =
  document.getElementById("accountTitle");

const accountSubtitle =
  document.getElementById("accountSubtitle");

const accountMessage =
  document.getElementById("accountMessage");

const switchAccountMode =
  document.getElementById("switchAccountMode");

const enterToSend =
  document.getElementById("enterToSend");

const darkMode =
  document.getElementById("darkMode");


/* =========================================================
   LOCAL STORAGE
   ========================================================= */

function loadLocalData() {
  try {
    const savedChats =
      localStorage.getItem("safi_chats");

    if (savedChats) {
      chats = JSON.parse(savedChats);
    }
  } catch (error) {
    console.error(
      "Chats konnten nicht geladen werden:",
      error
    );

    chats = [];
  }

  const savedTheme =
    localStorage.getItem("safi_theme");

  if (savedTheme === "dark") {
    document.body.classList.add("dark");

    if (darkMode) {
      darkMode.checked = true;
    }
  } else {
    if (darkMode) {
      darkMode.checked = false;
    }
  }

  updateAccountUI();
}


function saveLocalData() {
  try {
    localStorage.setItem(
      "safi_chats",
      JSON.stringify(chats)
    );
  } catch (error) {
    console.error(
      "Chats konnten nicht gespeichert werden:",
      error
    );
  }
}


/* =========================================================
   CHAT HISTORY
   ========================================================= */

function renderChatHistory() {
  chatHistory.innerHTML = "";

  if (!chats.length) {
    chatHistory.innerHTML = `
      <div class="empty-history">
        Noch keine Unterhaltungen
      </div>
    `;

    return;
  }

  chats.forEach((chat) => {
    const item =
      document.createElement("button");

    item.className = "history-item";

    if (chat.id === currentChatId) {
      item.classList.add("active");
    }

    item.innerHTML = `
      <span>○</span>
      <span class="history-title">
        ${escapeHTML(chat.title || "Neue Unterhaltung")}
      </span>
    `;

    item.addEventListener(
      "click",
      () => {
        openChat(chat.id);

        if (
          window.innerWidth <= 800 &&
          sidebar
        ) {
          sidebar.classList.remove("open");
        }
      }
    );

    chatHistory.appendChild(item);
  });
}


/* =========================================================
   NEW CHAT
   ========================================================= */

function createNewChat() {
  currentChatId =
    "chat_" +
    Date.now() +
    "_" +
    Math.random()
      .toString(36)
      .substring(2, 8);

  const chat = {
    id: currentChatId,
    title: "Neue Unterhaltung",
    messages: [],
    createdAt: Date.now()
  };

  chats.unshift(chat);

  saveLocalData();
  renderChatHistory();
  renderMessages();

  messageInput.focus();
}


function openChat(id) {
  const chat =
    chats.find((item) => item.id === id);

  if (!chat) {
    return;
  }

  currentChatId = id;

  renderChatHistory();
  renderMessages();
}


/* =========================================================
   CURRENT CHAT
   ========================================================= */

function getCurrentChat() {
  return chats.find(
    (chat) => chat.id === currentChatId
  );
}


function ensureCurrentChat() {
  if (!currentChatId) {
    createNewChat();
  }

  return getCurrentChat();
}


/* =========================================================
   RENDER MESSAGES
   ========================================================= */

function renderMessages() {
  messages.innerHTML = "";

  const chat = getCurrentChat();

  if (!chat || !chat.messages.length) {
    welcome.style.display = "block";
    return;
  }

  welcome.style.display = "none";

  chat.messages.forEach((message) => {
    renderMessage(
      message.role,
      message.text,
      false
    );
  });

  scrollToBottom();
}


function renderMessage(
  role,
  text,
  animate = true
) {
  const wrapper =
    document.createElement("div");

  wrapper.className =
    `message ${role}`;

  if (!animate) {
    wrapper.style.animation = "none";
  }

  const content =
    document.createElement("div");

  content.className =
    "message-content";

  const textElement =
    document.createElement("div");

  textElement.className =
    "message-text";

  textElement.textContent = text;

  content.appendChild(textElement);

  const actions =
    document.createElement("div");

  actions.className =
    "message-actions";

  if (role === "assistant") {
    const copyButton =
      document.createElement("button");

    copyButton.className =
      "message-action";

    copyButton.textContent =
      "▣";

    copyButton.title =
      "Antwort kopieren";

    copyButton.addEventListener(
      "click",
      async () => {
        try {
          await navigator.clipboard.writeText(
            text
          );

          copyButton.textContent = "✓";

          setTimeout(() => {
            copyButton.textContent = "▣";
          }, 1200);

        } catch (error) {
          console.error(error);
        }
      }
    );

    actions.appendChild(copyButton);
  }

  content.appendChild(actions);
  wrapper.appendChild(content);

  messages.appendChild(wrapper);

  return wrapper;
}


/* =========================================================
   SEND MESSAGE
   ========================================================= */

async function sendMessage() {
  const message =
    messageInput.value.trim();

  if (!message && !attachments.length) {
    return;
  }

  const chat =
    ensureCurrentChat();

  if (!chat) {
    return;
  }

  const displayMessage =
    message ||
    "Anhang wurde hinzugefügt.";

  chat.messages.push({
    role: "user",
    text: displayMessage,
    timestamp: Date.now()
  });

  if (
    chat.title === "Neue Unterhaltung" &&
    message
  ) {
    chat.title =
      message.substring(0, 35) +
      (message.length > 35 ? "…" : "");
  }

  saveLocalData();
  renderChatHistory();

  welcome.style.display = "none";

  messageInput.value = "";
  autoResize();

  renderMessage(
    "user",
    displayMessage
  );

  scrollToBottom();

  const typing =
    showTypingIndicator();

  try {
    const formData =
      new FormData();

    formData.append(
      "message",
      message
    );

    /*
      Attachments werden separat übertragen.
      Der Server kann daraus später
      Bilder / Dateien / Audio verarbeiten.
    */

    for (
      const attachment of attachments
    ) {
      formData.append(
        "files",
        attachment.file
      );
    }

    const response =
      await fetch(
        API_URL + "/chat",
        {
          method: "POST",
          body: formData
        }
      );

    removeTypingIndicator(typing);

    let data = {};

    try {
      data = await response.json();
    } catch {
      data = {};
    }

    if (!response.ok) {
      throw new Error(
        data.reply ||
        `Serverfehler ${response.status}`
      );
    }

    const reply =
      data.reply ||
      "Ich konnte leider keine Antwort erzeugen.";

    chat.messages.push({
      role: "assistant",
      text: reply,
      timestamp: Date.now()
    });

    saveLocalData();

    renderMessage(
      "assistant",
      reply
    );

    scrollToBottom();

  } catch (error) {
    removeTypingIndicator(typing);

    console.error(
      "Safi AI Fehler:",
      error
    );

    const errorText =
      getFriendlyError(error);

    chat.messages.push({
      role: "assistant",
      text: errorText,
      timestamp: Date.now()
    });

    saveLocalData();

    renderMessage(
      "assistant",
      errorText
    );

    scrollToBottom();

  } finally {
    attachments = [];

    renderAttachments();

    messageInput.focus();
  }
}


/* =========================================================
   ERROR HANDLING
   ========================================================= */

function getFriendlyError(error) {
  const text =
    error?.message || "";

  if (
    text.includes("Failed to fetch") ||
    text.includes("NetworkError")
  ) {
    return (
      "Safi AI konnte den Server gerade nicht erreichen. " +
      "Bitte versuche es gleich noch einmal."
    );
  }

  return (
    "Safi AI konnte die Anfrage gerade nicht verarbeiten. " +
    "Bitte versuche es noch einmal."
  );
}


/* =========================================================
   TYPING
   ========================================================= */

function showTypingIndicator() {
  const wrapper =
    document.createElement("div");

  wrapper.className =
    "message assistant";

  wrapper.id =
    "safiTyping";

  wrapper.innerHTML = `
    <div class="message-content">
      <div class="typing">
        <span></span>
        <span></span>
        <span></span>
      </div>
    </div>
  `;

  messages.appendChild(wrapper);

  scrollToBottom();

  return wrapper;
}


function removeTypingIndicator(element) {
  if (element) {
    element.remove();
  }
}


/* =========================================================
   SCROLL
   ========================================================= */

function scrollToBottom() {
  requestAnimationFrame(() => {
    const area =
      document.getElementById("chatArea");

    area.scrollTop =
      area.scrollHeight;
  });
}


/* =========================================================
   TEXTAREA
   ========================================================= */

function autoResize() {
  messageInput.style.height = "auto";

  messageInput.style.height =
    Math.min(
      messageInput.scrollHeight,
      180
    ) + "px";
}

messageInput.addEventListener(
  "input",
  autoResize
);


/* =========================================================
   ENTER TO SEND
   ========================================================= */

messageInput.addEventListener(
  "keydown",
  (event) => {

    if (
      event.key === "Enter" &&
      !event.shiftKey &&
      enterToSend.checked
    ) {
      event.preventDefault();

      composer.requestSubmit();
    }
  }
);


/* =========================================================
   FORM
   ========================================================= */

composer.addEventListener(
  "submit",
  (event) => {
    event.preventDefault();

    sendMessage();
  }
);


/* =========================================================
   SUGGESTIONS
   ========================================================= */

document
  .querySelectorAll(".suggestion")
  .forEach((button) => {

    button.addEventListener(
      "click",
      () => {

        messageInput.value =
          button.dataset.prompt || "";

        autoResize();

        messageInput.focus();
      }
    );

  });


/* =========================================================
   NEW CHAT BUTTONS
   ========================================================= */

newChatButton.addEventListener(
  "click",
  createNewChat
);

newChatTop.addEventListener(
  "click",
  createNewChat
);


/* =========================================================
   SIDEBAR
   ========================================================= */

openSidebar.addEventListener(
  "click",
  () => {
    sidebar.classList.add("open");
  }
);

closeSidebar.addEventListener(
  "click",
  () => {
    sidebar.classList.remove("open");
  }
);


/* =========================================================
   FILE UPLOAD
   ========================================================= */

attachButton.addEventListener(
  "click",
  () => {
    fileInput.click();
  }
);

imageButton.addEventListener(
  "click",
  () => {
    imageInput.click();
  }
);


fileInput.addEventListener(
  "change",
  () => {
    addFiles(
      Array.from(fileInput.files)
    );

    fileInput.value = "";
  }
);


imageInput.addEventListener(
  "change",
  () => {
    addFiles(
      Array.from(imageInput.files)
    );

    imageInput.value = "";
  }
);


function addFiles(files) {
  for (const file of files) {

    const exists =
      attachments.some(
        (item) =>
          item.file.name === file.name &&
          item.file.size === file.size
      );

    if (exists) {
      continue;
    }

    attachments.push({
      id:
        "file_" +
        Date.now() +
        Math.random(),

      file
    });
  }

  renderAttachments();
}


/* =========================================================
   ATTACHMENT PREVIEW
   ========================================================= */

function renderAttachments() {
  attachmentPreview.innerHTML = "";

  attachments.forEach(
    (attachment) => {

      const item =
        document.createElement("div");

      item.className =
        "preview-item";

      const name =
        document.createElement("span");

      name.textContent =
        attachment.file.name;

      const remove =
        document.createElement("button");

      remove.className =
        "preview-remove";

      remove.textContent = "×";

      remove.addEventListener(
        "click",
        () => {

          attachments =
            attachments.filter(
              (item) =>
                item.id !== attachment.id
            );

          renderAttachments();
        }
      );

      item.appendChild(name);
      item.appendChild(remove);

      attachmentPreview.appendChild(item);
    }
  );
}


/* =========================================================
   MICROPHONE
   ========================================================= */

micButton.addEventListener(
  "click",
  async () => {

    if (isRecording) {
      stopRecording();
      return;
    }

    await startRecording();
  }
);


async function startRecording() {
  try {

    if (
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia
    ) {
      alert(
        "Dein Browser unterstützt keine Sprachaufnahme."
      );

      return;
    }

    const stream =
      await navigator.mediaDevices.getUserMedia({
        audio: true
      });

    audioChunks = [];

    mediaRecorder =
      new MediaRecorder(stream);

    mediaRecorder.addEventListener(
      "dataavailable",
      (event) => {

        if (event.data.size > 0) {
          audioChunks.push(
            event.data
          );
        }
      }
    );

    mediaRecorder.addEventListener(
      "stop",
      () => {

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
            `safi-voice-${Date.now()}.webm`,
            {
              type:
                blob.type
            }
          );

        attachments.push({
          id:
            "voice_" +
            Date.now(),

          file
        });

        renderAttachments();

        stream
          .getTracks()
          .forEach(
            (track) => track.stop()
          );
      }
    );

    mediaRecorder.start();

    isRecording = true;

    micButton.classList.add(
      "recording"
    );

    micButton.title =
      "Aufnahme stoppen";

  } catch (error) {

    console.error(
      "Mikrofonfehler:",
      error
    );

    alert(
      "Das Mikrofon konnte nicht gestartet werden."
    );
  }
}


function stopRecording() {
  if (
    mediaRecorder &&
    mediaRecorder.state !== "inactive"
  ) {
    mediaRecorder.stop();
  }

  isRecording = false;

  micButton.classList.remove(
    "recording"
  );

  micButton.title =
    "Sprachaufnahme";
}


/* =========================================================
   THEME
   ========================================================= */

themeButton.addEventListener(
  "click",
  toggleTheme
);


function toggleTheme() {
  const dark =
    document.body.classList.toggle("dark");

  localStorage.setItem(
    "safi_theme",
    dark ? "dark" : "light"
  );

  darkMode.checked = dark;
}


darkMode.addEventListener(
  "change",
  () => {

    if (darkMode.checked) {
      document.body.classList.add("dark");

      localStorage.setItem(
        "safi_theme",
        "dark"
      );
    } else {
      document.body.classList.remove("dark");

      localStorage.setItem(
        "safi_theme",
        "light"
      );
    }
  }
);


/* =========================================================
   SETTINGS
   ========================================================= */

settingsButton.addEventListener(
  "click",
  () => {
    openModal(settingsModal);
  }
);


/* =========================================================
   ACCOUNT UI
   ========================================================= */

function updateAccountUI() {
  const user =
    localStorage.getItem(
      "safi_user_email"
    );

  if (user) {
    accountLabel.textContent =
      user;
  } else {
    accountLabel.textContent =
      "Anmelden";
  }
}


accountButton.addEventListener(
  "click",
  () => {
    openAccountModal();
  }
);


function openAccountModal() {
  const user =
    localStorage.getItem(
      "safi_user_email"
    );

  if (user) {

    accountTitle.textContent =
      "Dein Konto";

    accountSubtitle.textContent =
      user;

    accountForm.style.display =
      "none";

    switchAccountMode.textContent =
      "Abmelden";

  } else {

    accountMode = "login";

    accountTitle.textContent =
      "Bei Safi AI anmelden";

    accountSubtitle.textContent =
      "Speichere deine Unterhaltungen und Einstellungen.";

    accountForm.style.display =
      "flex";

    switchAccountMode.textContent =
      "Noch kein Konto? Registrieren";

    accountForm
      .querySelector("button")
      .textContent =
      "Anmelden";
  }

  accountMessage.textContent = "";

  openModal(accountModal);
}


/* =========================================================
   ACCOUNT MODE
   ========================================================= */

switchAccountMode.addEventListener(
  "click",
  async () => {

    const user =
      localStorage.getItem(
        "safi_user_email"
      );

    if (user) {

      localStorage.removeItem(
        "safi_user_email"
      );

      updateAccountUI();

      closeModal(accountModal);

      return;
    }

    if (accountMode === "login") {

      accountMode = "register";

      accountTitle.textContent =
        "Konto erstellen";

      accountSubtitle.textContent =
        "Erstelle deinen persönlichen Safi-AI-Account.";

      accountForm
        .querySelector("button")
        .textContent =
        "Registrieren";

      switchAccountMode.textContent =
        "Du hast bereits ein Konto? Anmelden";

    } else {

      accountMode = "login";

      accountTitle.textContent =
        "Bei Safi AI anmelden";

      accountSubtitle.textContent =
        "Speichere deine Unterhaltungen und Einstellungen.";

      accountForm
        .querySelector("button")
        .textContent =
        "Anmelden";

      switchAccountMode.textContent =
        "Noch kein Konto? Registrieren";
    }
  }
);


/* =========================================================
   ACCOUNT FORM
   ========================================================= */

accountForm.addEventListener(
  "submit",
  async (event) => {

    event.preventDefault();

    const email =
      accountEmail.value.trim();

    const password =
      accountPassword.value;

    if (!email || !password) {
      return;
    }

    accountMessage.textContent =
      "Bitte warten...";

    try {

      const endpoint =
        accountMode === "register"
          ? "/api/register"
          : "/api/login";

      const response =
        await fetch(
          API_URL + endpoint,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json"
            },

            body: JSON.stringify({
              email,
              password
            })
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
          "Anmeldung fehlgeschlagen."
        );
      }

      localStorage.setItem(
        "safi_user_email",
        email
      );

      if (data.token) {
        localStorage.setItem(
          "safi_token",
          data.token
        );
      }

      accountMessage.textContent =
        "Erfolgreich!";

      updateAccountUI();

      setTimeout(() => {
        closeModal(accountModal);
      }, 500);

    } catch (error) {

      /*
        Bis der Server die Account-Routen
        unterstützt, zeigen wir den Fehler
        sauber an.
      */

      console.error(
        "Account Fehler:",
        error
      );

      accountMessage.textContent =
        error.message ||
        "Konto konnte nicht verarbeitet werden.";
    }
  }
);


/* =========================================================
   MODALS
   ========================================================= */

document
  .querySelectorAll(
    "[data-close]"
  )
  .forEach((button) => {

    button.addEventListener(
      "click",
      () => {

        const id =
          button.dataset.close;

        const modal =
          document.getElementById(id);

        closeModal(modal);
      }
    );
  });


function openModal(modal) {
  modal.hidden = false;
}


function closeModal(modal) {
  modal.hidden = true;
}


document
  .querySelectorAll(".modal-overlay")
  .forEach((overlay) => {

    overlay.addEventListener(
      "click",
      (event) => {

        if (
          event.target === overlay
        ) {
          closeModal(overlay);
        }
      }
    );
  });


/* =========================================================
   ESCAPE
   ========================================================= */

document.addEventListener(
  "keydown",
  (event) => {

    if (event.key !== "Escape") {
      return;
    }

    document
      .querySelectorAll(".modal-overlay")
      .forEach((modal) => {
        closeModal(modal);
      });

    sidebar.classList.remove("open");
  }
);


/* =========================================================
   HTML ESCAPE
   ========================================================= */

function escapeHTML(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


/* =========================================================
   START
   ========================================================= */

loadLocalData();

renderChatHistory();

if (chats.length > 0) {
  currentChatId = chats[0].id;
}

renderMessages();

messageInput.focus();

console.log(
  "Safi AI Frontend geladen."
);

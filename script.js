const $ = (selector) =>
  document.querySelector(selector);

const $$ = (selector) =>
  document.querySelectorAll(selector);


/* =====================================================
   STATE
===================================================== */

let chats =
  JSON.parse(
    localStorage.getItem("safi_chats") || "[]"
  );

let currentChatId =
  localStorage.getItem("safi_current_chat");

let selectedFiles = [];

let isSending = false;

let mediaRecorder = null;
let audioChunks = [];
let isRecording = false;


/* =====================================================
   ELEMENTS
===================================================== */

const chatContent = $("#chatContent");
const chatHistory = $("#chatHistory");
const welcome = $("#welcome");

const messageInput = $("#messageInput");
const sendButton = $("#sendButton");

const fileInput = $("#fileInput");
const imageInput = $("#imageInput");

const attachments = $("#attachments");

const accountModal = $("#accountModal");
const settingsModal = $("#settingsModal");


/* =====================================================
   CHAT STORAGE
===================================================== */

function saveChats() {
  localStorage.setItem(
    "safi_chats",
    JSON.stringify(chats)
  );
}

function generateId() {
  return (
    Date.now().toString(36) +
    Math.random()
      .toString(36)
      .substring(2, 8)
  );
}

function createChat() {

  const chat = {
    id: generateId(),
    title: "Neue Unterhaltung",
    messages: []
  };

  chats.unshift(chat);

  currentChatId = chat.id;

  localStorage.setItem(
    "safi_current_chat",
    currentChatId
  );

  saveChats();

  renderHistory();
  renderChat();

  messageInput.focus();
}

function getCurrentChat() {

  let chat =
    chats.find(
      (item) => item.id === currentChatId
    );

  if (!chat) {

    createChat();

    chat =
      chats.find(
        (item) => item.id === currentChatId
      );
  }

  return chat;
}


/* =====================================================
   HISTORY
===================================================== */

function renderHistory() {

  chatHistory.innerHTML = "";

  if (!chats.length) {

    const empty =
      document.createElement("div");

    empty.className =
      "chat-history-item";

    empty.textContent =
      "Noch keine Unterhaltungen";

    empty.style.cursor = "default";
    empty.style.color = "#666";

    chatHistory.appendChild(empty);

    return;
  }

  chats.forEach((chat) => {

    const item =
      document.createElement("div");

    item.className =
      "chat-history-item";

    if (chat.id === currentChatId) {
      item.classList.add("active");
    }

    item.textContent =
      chat.title || "Neue Unterhaltung";

    item.addEventListener(
      "click",
      () => {

        currentChatId = chat.id;

        localStorage.setItem(
          "safi_current_chat",
          currentChatId
        );

        renderHistory();
        renderChat();

      }
    );

    chatHistory.appendChild(item);
  });
}


/* =====================================================
   RENDER CHAT
===================================================== */

function renderChat() {

  const chat = getCurrentChat();

  chatContent.innerHTML = "";

  if (!chat.messages.length) {

    chatContent.appendChild(
      createWelcome()
    );

    return;
  }

  chat.messages.forEach(
    (message) => {

      addMessageToDOM(
        message.role,
        message.content,
        false
      );

    }
  );

  scrollToBottom();
}


/* =====================================================
   WELCOME
===================================================== */

function createWelcome() {

  const div =
    document.createElement("div");

  div.className = "welcome";

  div.innerHTML = `
    <div class="welcome-small">
      INTELLIGENT ASSISTANT
    </div>

    <h1>
      Was möchtest<br>
      du wissen?
    </h1>

    <p>
      Schreibe Safi AI eine Nachricht.
      Du kannst außerdem Bilder, Dateien
      oder eine Sprachaufnahme hinzufügen.
    </p>

    <div class="suggestions">

      <button
        class="suggestion"
        data-prompt="Erkläre mir dieses Thema einfach und verständlich."
      >
        <strong>Etwas erklären</strong>
        <span>Ein Thema einfach verstehen</span>
      </button>

      <button
        class="suggestion"
        data-prompt="Hilf mir beim Programmieren und erkläre mir den Code Schritt für Schritt."
      >
        <strong>Programmieren</strong>
        <span>Code erstellen oder verstehen</span>
      </button>

      <button
        class="suggestion"
        data-prompt="Hilf mir bei meinen Hausaufgaben und erkläre den Lösungsweg."
      >
        <strong>Hausaufgaben</strong>
        <span>Schritt für Schritt lernen</span>
      </button>

      <button
        class="suggestion"
        data-prompt="Fasse mir die wichtigsten Punkte dieses Themas übersichtlich zusammen."
      >
        <strong>Zusammenfassen</strong>
        <span>Wichtige Informationen kompakt</span>
      </button>

    </div>
  `;

  div
    .querySelectorAll(".suggestion")
    .forEach((button) => {

      button.addEventListener(
        "click",
        () => {

          messageInput.value =
            button.dataset.prompt;

          autoResize();

          messageInput.focus();

        }
      );

    });

  return div;
}


/* =====================================================
   ADD MESSAGE
===================================================== */

function addMessageToDOM(
  role,
  content,
  scroll = true
) {

  const message =
    document.createElement("div");

  message.className =
    `message ${role}`;

  const avatar =
    document.createElement("div");

  avatar.className = "avatar";

  avatar.textContent =
    role === "user"
      ? "DU"
      : "S";

  const body =
    document.createElement("div");

  body.className = "message-body";

  const label =
    document.createElement("div");

  label.className =
    "message-label";

  label.textContent =
    role === "user"
      ? "Du"
      : "Safi AI";

  const text =
    document.createElement("div");

  text.className =
    "message-text";

  text.textContent = content;

  body.appendChild(label);
  body.appendChild(text);

  message.appendChild(avatar);
  message.appendChild(body);

  chatContent.appendChild(message);

  if (scroll) {
    scrollToBottom();
  }
}


/* =====================================================
   TYPING
===================================================== */

function showTyping() {

  const message =
    document.createElement("div");

  message.className =
    "message assistant";

  message.id =
    "typingMessage";

  message.innerHTML = `
    <div class="avatar">S</div>

    <div class="message-body">

      <div class="message-label">
        Safi AI
      </div>

      <div class="typing">
        <span></span>
        <span></span>
        <span></span>
      </div>

    </div>
  `;

  chatContent.appendChild(message);

  scrollToBottom();
}

function removeTyping() {

  const typing =
    $("#typingMessage");

  if (typing) {
    typing.remove();
  }
}


/* =====================================================
   SEND MESSAGE
===================================================== */

async function sendMessage() {

  if (isSending) return;

  const message =
    messageInput.value.trim();

  if (!message && !selectedFiles.length) {
    return;
  }

  const chat = getCurrentChat();

  if (!message && selectedFiles.length) {

    const names =
      selectedFiles
        .map((file) => file.name)
        .join(", ");

    chat.messages.push({
      role: "user",
      content: `Datei: ${names}`
    });

    addMessageToDOM(
      "user",
      `Datei: ${names}`
    );

  } else if (message) {

    chat.messages.push({
      role: "user",
      content: message
    });

    addMessageToDOM(
      "user",
      message
    );
  }

  if (
    chat.title ===
    "Neue Unterhaltung"
  ) {

    const title =
      message ||
      selectedFiles[0]?.name ||
      "Neue Unterhaltung";

    chat.title =
      title.length > 38
        ? title.substring(0, 38) + "..."
        : title;
  }

  saveChats();
  renderHistory();

  const formData =
    new FormData();

  formData.append(
    "message",
    message
  );

  /*
    WICHTIG:

    Wir senden die bisherige Unterhaltung
    jedes Mal mit.

    Dadurch verliert Safi AI nach 4–5
    Fragen nicht plötzlich den Kontext.
  */

  formData.append(
    "history",
    JSON.stringify(
      chat.messages
        .slice(-30)
        .map((item) => ({
          role: item.role,
          content: item.content
        }))
    )
  );

  selectedFiles.forEach(
    (file) => {

      formData.append(
        "files",
        file
      );

    }
  );

  messageInput.value = "";

  selectedFiles = [];

  renderAttachments();

  autoResize();

  isSending = true;

  sendButton.disabled = true;

  showTyping();

  try {

    const response =
      await fetch("/chat", {
        method: "POST",
        body: formData
      });

    let data;

    try {
      data =
        await response.json();
    } catch {
      throw new Error(
        "Der Server hat keine gültige Antwort zurückgegeben."
      );
    }

    if (!response.ok || !data.success) {

      throw new Error(
        data.error ||
        "Safi AI konnte die Anfrage nicht bearbeiten."
      );
    }

    removeTyping();

    chat.messages.push({
      role: "assistant",
      content: data.reply
    });

    saveChats();

    addMessageToDOM(
      "assistant",
      data.reply
    );

  } catch (error) {

    removeTyping();

    const errorMessage =
      `Es ist ein Fehler aufgetreten.\n\n${error.message}`;

    chat.messages.push({
      role: "assistant",
      content: errorMessage
    });

    saveChats();

    addMessageToDOM(
      "assistant",
      errorMessage
    );

  } finally {

    isSending = false;

    sendButton.disabled = false;

    messageInput.focus();
  }
}


/* =====================================================
   FILES
===================================================== */

function addFiles(files) {

  for (const file of files) {

    if (
      selectedFiles.length >= 5
    ) {
      break;
    }

    if (
      file.size >
      20 * 1024 * 1024
    ) {
      alert(
        `${file.name} ist größer als 20 MB.`
      );

      continue;
    }

    selectedFiles.push(file);
  }

  renderAttachments();
}

function renderAttachments() {

  attachments.innerHTML = "";

  selectedFiles.forEach(
    (file, index) => {

      const item =
        document.createElement("div");

      item.className =
        "attachment";

      const name =
        document.createElement("span");

      name.textContent =
        file.name;

      const remove =
        document.createElement("button");

      remove.textContent = "×";

      remove.addEventListener(
        "click",
        () => {

          selectedFiles.splice(
            index,
            1
          );

          renderAttachments();
        }
      );

      item.appendChild(name);
      item.appendChild(remove);

      attachments.appendChild(item);
    }
  );
}


/* =====================================================
   MICROPHONE
===================================================== */

async function toggleRecording() {

  if (isRecording) {

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
      (event) => {

        if (event.data.size > 0) {
          audioChunks.push(
            event.data
          );
        }
      };

    mediaRecorder.onstop =
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
            `sprachaufnahme-${Date.now()}.webm`,
            {
              type:
                blob.type
            }
          );

        addFiles([file]);

        stream
          .getTracks()
          .forEach(
            (track) =>
              track.stop()
          );

        isRecording = false;

        $("#micButton")
          .classList
          .remove("recording");

      };

    mediaRecorder.start();

    isRecording = true;

    $("#micButton")
      .classList
      .add("recording");

  } catch {

    alert(
      "Das Mikrofon konnte nicht aktiviert werden."
    );
  }
}


/* =====================================================
   TEXTAREA
===================================================== */

function autoResize() {

  messageInput.style.height =
    "auto";

  messageInput.style.height =
    Math.min(
      messageInput.scrollHeight,
      130
    ) + "px";
}

messageInput.addEventListener(
  "input",
  autoResize
);

messageInput.addEventListener(
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


/* =====================================================
   NEW CHAT
===================================================== */

$("#newChatButton")
  .addEventListener(
    "click",
    createChat
  );


/* =====================================================
   CLEAR CHAT
===================================================== */

$("#clearChatButton")
  .addEventListener(
    "click",
    () => {

      const chat =
        getCurrentChat();

      chat.messages = [];

      chat.title =
        "Neue Unterhaltung";

      saveChats();

      renderHistory();
      renderChat();

    }
  );


/* =====================================================
   FILE BUTTONS
===================================================== */

$("#attachButton")
  .addEventListener(
    "click",
    () => fileInput.click()
  );

$("#imageButton")
  .addEventListener(
    "click",
    () => imageInput.click()
  );

fileInput.addEventListener(
  "change",
  () => {

    addFiles(
      Array.from(
        fileInput.files
      )
    );

    fileInput.value = "";
  }
);

imageInput.addEventListener(
  "change",
  () => {

    addFiles(
      Array.from(
        imageInput.files
      )
    );

    imageInput.value = "";
  }
);


/* =====================================================
   SEND
===================================================== */

sendButton.addEventListener(
  "click",
  sendMessage
);


/* =====================================================
   MICROPHONE
===================================================== */

$("#micButton")
  .addEventListener(
    "click",
    toggleRecording
);


/* =====================================================
   MODALS
===================================================== */

function openModal(modal) {
  modal.classList.add("open");
}

function closeModal(modal) {
  modal.classList.remove("open");
}

$("#settingsButton")
  .addEventListener(
    "click",
    () => openModal(settingsModal)
  );

$("#accountButton")
  .addEventListener(
    "click",
    () => openModal(accountModal)
  );

$$("[data-close]")
  .forEach((button) => {

    button.addEventListener(
      "click",
      () => {

        const modal =
          $("#" +
            button.dataset.close);

        closeModal(modal);

      }
    );
  });

$$(".modal")
  .forEach((modal) => {

    modal.addEventListener(
      "click",
      (event) => {

        if (
          event.target === modal
        ) {
          closeModal(modal);
        }

      }
    );
  });


/* =====================================================
   THEME
===================================================== */

function updateThemeButton() {

  $("#themeButton").textContent =
    document.body.classList.contains("dark")
      ? "Hell"
      : "Dunkel";
}

$("#themeButton")
  .addEventListener(
    "click",
    () => {

      document.body
        .classList
        .toggle("dark");

      localStorage.setItem(
        "safi_theme",
        document.body.classList.contains("dark")
          ? "dark"
          : "light"
      );

      updateThemeButton();
    }
  );

if (
  localStorage.getItem(
    "safi_theme"
  ) === "dark"
) {
  document.body.classList.add("dark");
}

updateThemeButton();


/* =====================================================
   ACCOUNT
===================================================== */

let accountMode = "login";

function updateAccountUI() {

  const email =
    localStorage.getItem(
      "safi_user_email"
    );

  if (email) {

    $("#accountLoggedOut")
      .classList
      .add("hidden");

    $("#accountLoggedIn")
      .classList
      .remove("hidden");

    $("#loggedUserEmail")
      .textContent = email;

    $("#accountButtonText")
      .textContent = email;

  } else {

    $("#accountLoggedOut")
      .classList
      .remove("hidden");

    $("#accountLoggedIn")
      .classList
      .add("hidden");

    $("#accountButtonText")
      .textContent = "Anmelden";
  }
}

$("#loginTab")
  .addEventListener(
    "click",
    () => {

      accountMode = "login";

      $("#loginTab")
        .classList
        .add("active");

      $("#registerTab")
        .classList
        .remove("active");

      $("#accountSubmit")
        .textContent = "Anmelden";

    }
  );

$("#registerTab")
  .addEventListener(
    "click",
    () => {

      accountMode = "register";

      $("#registerTab")
        .classList
        .add("active");

      $("#loginTab")
        .classList
        .remove("active");

      $("#accountSubmit")
        .textContent = "Konto erstellen";

    }
  );

$("#accountSubmit")
  .addEventListener(
    "click",
    () => {

      const email =
        $("#emailInput")
          .value
          .trim();

      const password =
        $("#passwordInput")
          .value;

      if (!email || !password) {

        $("#accountMessage")
          .textContent =
          "Bitte E-Mail und Passwort eingeben.";

        return;
      }

      if (password.length < 4) {

        $("#accountMessage")
          .textContent =
          "Das Passwort muss mindestens 4 Zeichen haben.";

        return;
      }

      /*
        Lokale Anmeldung:
        Das Konto bleibt im Browser gespeichert.
      */

      localStorage.setItem(
        "safi_user_email",
        email
      );

      localStorage.setItem(
        "safi_user_logged_in",
        "true"
      );

      $("#accountMessage")
        .textContent =
        "Konto erfolgreich gespeichert.";

      updateAccountUI();

      setTimeout(
        () => closeModal(accountModal),
        600
      );
    }
  );

$("#logoutButton")
  .addEventListener(
    "click",
    () => {

      localStorage.removeItem(
        "safi_user_email"
      );

      localStorage.removeItem(
        "safi_user_logged_in"
      );

      updateAccountUI();

    }
  );

updateAccountUI();


/* =====================================================
   DELETE ALL CHATS
===================================================== */

$("#deleteAllChats")
  .addEventListener(
    "click",
    () => {

      if (
        !confirm(
          "Wirklich alle Unterhaltungen löschen?"
        )
      ) {
        return;
      }

      chats = [];

      currentChatId = null;

      localStorage.removeItem(
        "safi_chats"
      );

      localStorage.removeItem(
        "safi_current_chat"
      );

      createChat();

      closeModal(settingsModal);
    }
  );


/* =====================================================
   MOBILE MENU
===================================================== */

$("#mobileMenu")
  .addEventListener(
    "click",
    () => {

      $("#sidebar")
        .classList
        .toggle("open");

    }
  );


/* =====================================================
   SCROLL
===================================================== */

function scrollToBottom() {

  const container =
    $("#chatContainer");

  setTimeout(
    () => {

      container.scrollTo({
        top: container.scrollHeight,
        behavior: "smooth"
      });

    },
    20
  );
}


/* =====================================================
   START
===================================================== */

if (!chats.length) {

  createChat();

} else {

  if (!currentChatId) {
    currentChatId = chats[0].id;
  }

  renderHistory();
  renderChat();
}

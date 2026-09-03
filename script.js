const chat = document.getElementById("chat");
const messageInput = document.getElementById("messageInput");
const sendButton = document.getElementById("sendButton");
const micButton = document.getElementById("micButton");

const newChatButton = document.getElementById("newChatButton");

const loginButton = document.getElementById("loginButton");
const registerButton = document.getElementById("registerButton");
const topLoginButton = document.getElementById("topLoginButton");

const authModal = document.getElementById("authModal");
const closeModal = document.getElementById("closeModal");

const authTitle = document.getElementById("authTitle");
const authSubtitle = document.getElementById("authSubtitle");

const authSubmit = document.getElementById("authSubmit");

const switchAuth = document.getElementById("switchAuth");
const switchText = document.getElementById("switchText");

const registerNameContainer =
  document.getElementById("registerNameContainer");

const registerName =
  document.getElementById("registerName");

const email =
  document.getElementById("email");

const password =
  document.getElementById("password");

const themeButton =
  document.getElementById("themeButton");


// =====================================================
// DEINE RENDER SERVER URL
// =====================================================

const SERVER_URL = "DEINE-RENDER-URL";


// =====================================================
// CHAT
// =====================================================

let previousInteractionId = null;


function addMessage(text, sender) {

  const message = document.createElement("div");

  message.className = `message ${sender}`;

  const avatar = document.createElement("div");

  avatar.className = "message-avatar";

  avatar.textContent =
    sender === "user"
      ? "Du"
      : "S";

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

  const typing =
    document.getElementById("typing");

  if (typing) {
    typing.remove();
  }
}


// =====================================================
// SEND MESSAGE
// =====================================================

async function sendMessage(text = null) {

  const message =
    text || messageInput.value.trim();

  if (!message) return;


  const welcome =
    document.getElementById("welcome");

  if (welcome) {
    welcome.remove();
  }


  addMessage(message, "user");


  messageInput.value = "";

  messageInput.style.height = "auto";

  sendButton.disabled = true;

  showTyping();


  try {

    const response = await fetch(
      `${SERVER_URL}/chat`,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({
          message: message,
          previousInteractionId:
            previousInteractionId
        })
      }
    );


    const data = await response.json();


    removeTyping();


    if (!response.ok) {
      throw new Error(
        data.error || "Serverfehler"
      );
    }


    addMessage(
      data.reply,
      "ai"
    );


    previousInteractionId =
      data.interactionId;


  } catch (error) {

    removeTyping();

    console.error(error);


    addMessage(
      "❌ Safi AI konnte gerade keine Verbindung zum Server herstellen.",
      "ai"
    );

  }


  sendButton.disabled = false;

  messageInput.focus();
}


// =====================================================
// SEND BUTTON
// =====================================================

sendButton.addEventListener(
  "click",
  () => {
    sendMessage();
  }
);


// =====================================================
// ENTER
// =====================================================

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


// =====================================================
// TEXTAREA AUTO SIZE
// =====================================================

messageInput.addEventListener(
  "input",
  () => {

    messageInput.style.height =
      "auto";

    messageInput.style.height =
      Math.min(
        messageInput.scrollHeight,
        150
      ) + "px";

  }
);


// =====================================================
// SUGGESTIONS
// =====================================================

document
  .querySelectorAll(".suggestion")
  .forEach(button => {

    button.addEventListener(
      "click",
      () => {

        sendMessage(
          button.textContent.trim()
        );

      }
    );

  });


// =====================================================
// NEW CHAT
// =====================================================

newChatButton.addEventListener(
  "click",
  () => {

    previousInteractionId = null;

    location.reload();

  }
);


// =====================================================
// SPRACHEINGABE
// =====================================================

const SpeechRecognition =
  window.SpeechRecognition ||
  window.webkitSpeechRecognition;


let recognition = null;

let recording = false;


if (SpeechRecognition) {

  recognition =
    new SpeechRecognition();

  recognition.lang = "de-DE";

  recognition.continuous = false;

  recognition.interimResults = false;


  recognition.onstart = () => {

    recording = true;

    micButton.classList.add(
      "recording"
    );

  };


  recognition.onresult = event => {

    const transcript =
      event.results[0][0].transcript;

    messageInput.value =
      transcript;

    messageInput.focus();

  };


  recognition.onend = () => {

    recording = false;

    micButton.classList.remove(
      "recording"
    );

  };


  recognition.onerror = () => {

    recording = false;

    micButton.classList.remove(
      "recording"
    );

  };


  micButton.addEventListener(
    "click",
    () => {

      if (recording) {

        recognition.stop();

      } else {

        recognition.start();

      }

    }
  );

} else {

  micButton.addEventListener(
    "click",
    () => {

      alert(
        "Dein Browser unterstützt leider keine Spracheingabe."
      );

    }
  );

}


// =====================================================
// LOGIN / REGISTRIERUNG
// =====================================================

let registerMode = false;


function openLogin() {

  registerMode = false;

  authModal.classList.remove(
    "hidden"
  );

  authTitle.textContent =
    "Willkommen zurück";

  authSubtitle.textContent =
    "Melde dich bei deinem Safi AI Konto an.";

  authSubmit.textContent =
    "Anmelden";

  switchText.textContent =
    "Noch kein Konto?";

  switchAuth.textContent =
    "Registrieren";

  registerNameContainer.style.display =
    "none";
}


function openRegister() {

  registerMode = true;

  authModal.classList.remove(
    "hidden"
  );

  authTitle.textContent =
    "Erstelle dein Konto";

  authSubtitle.textContent =
    "Registriere dich kostenlos bei Safi AI.";

  authSubmit.textContent =
    "Konto erstellen";

  switchText.textContent =
    "Du hast bereits ein Konto?";

  switchAuth.textContent =
    "Anmelden";

  registerNameContainer.style.display =
    "block";
}


loginButton.addEventListener(
  "click",
  openLogin
);


topLoginButton.addEventListener(
  "click",
  openLogin
);


registerButton.addEventListener(
  "click",
  openRegister
);


closeModal.addEventListener(
  "click",
  () => {

    authModal.classList.add(
      "hidden"
    );

  }
);


authModal.addEventListener(
  "click",
  event => {

    if (
      event.target === authModal
    ) {

      authModal.classList.add(
        "hidden"
      );

    }

  }
);


switchAuth.addEventListener(
  "click",
  () => {

    if (registerMode) {

      openLogin();

    } else {

      openRegister();

    }

  }
);


// =====================================================
// DEMO LOGIN / REGISTRIERUNG
// =====================================================

authSubmit.addEventListener(
  "click",
  () => {

    const mail =
      email.value.trim();

    const pass =
      password.value.trim();


    if (!mail || !pass) {

      alert(
        "Bitte E-Mail und Passwort eingeben."
      );

      return;

    }


    if (registerMode) {

      const name =
        registerName.value.trim();


      if (!name) {

        alert(
          "Bitte gib deinen Namen ein."
        );

        return;

      }


      localStorage.setItem(
        "safiUser",
        JSON.stringify({
          name: name,
          email: mail
        })
      );


      alert(
        "Konto wurde erstellt!"
      );

    } else {

      localStorage.setItem(
        "safiUser",
        JSON.stringify({
          email: mail
        })
      );


      alert(
        "Du wurdest angemeldet!"
      );

    }


    authModal.classList.add(
      "hidden"
    );

    email.value = "";

    password.value = "";

    registerName.value = "";

  }
);


// =====================================================
// THEME
// =====================================================

themeButton.addEventListener(
  "click",
  () => {

    document.body.classList.toggle(
      "light-mode"
    );

  }
);

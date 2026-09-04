// ==========================================
// SAFI AI
// ==========================================


// ==========================================
// DEIN RENDER SERVER
// ==========================================
//
// HIER deine Render-URL eintragen.
//
// Beispiel:
// https://safi-ai-server-xxxx.onrender.com
//

const SERVER_URL =
  "DEINE-RENDER-URL";


// ==========================================
// ELEMENTE
// ==========================================

const chat =
  document.getElementById("chat");

const messageInput =
  document.getElementById("messageInput");

const sendButton =
  document.getElementById("sendButton");

const micButton =
  document.getElementById("micButton");

const newChatButton =
  document.getElementById("newChatButton");


// Login

const loginButton =
  document.getElementById("loginButton");

const registerButton =
  document.getElementById("registerButton");

const topLoginButton =
  document.getElementById("topLoginButton");


// Modal

const authModal =
  document.getElementById("authModal");

const closeModal =
  document.getElementById("closeModal");

const authTitle =
  document.getElementById("authTitle");

const authSubtitle =
  document.getElementById("authSubtitle");

const authSubmit =
  document.getElementById("authSubmit");

const switchAuth =
  document.getElementById("switchAuth");

const switchText =
  document.getElementById("switchText");

const nameContainer =
  document.getElementById("nameContainer");

const nameInput =
  document.getElementById("nameInput");

const emailInput =
  document.getElementById("emailInput");

const passwordInput =
  document.getElementById("passwordInput");

const themeButton =
  document.getElementById("themeButton");


// ==========================================
// CHAT MEMORY
// ==========================================

let previousInteractionId = null;


// ==========================================
// NACHRICHT ANZEIGEN
// ==========================================

function addMessage(text, sender) {

  const message =
    document.createElement("div");

  message.className =
    "message " + sender;


  const avatar =
    document.createElement("div");

  avatar.className =
    "message-avatar";

  avatar.textContent =
    sender === "user"
      ? "Du"
      : "S";


  const content =
    document.createElement("div");

  content.className =
    "message-content";

  content.textContent =
    text;


  message.appendChild(avatar);

  message.appendChild(content);

  chat.appendChild(message);


  chat.scrollTop =
    chat.scrollHeight;
}


// ==========================================
// TYPING
// ==========================================

function showTyping() {

  const typing =
    document.createElement("div");

  typing.className =
    "message";

  typing.id =
    "typing";


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

  chat.scrollTop =
    chat.scrollHeight;
}


function removeTyping() {

  const typing =
    document.getElementById("typing");

  if (typing) {

    typing.remove();

  }
}


// ==========================================
// KI NACHRICHT SENDEN
// ==========================================

async function sendMessage(text = null) {

  const message =
    text ||
    messageInput.value.trim();


  if (!message) {

    return;

  }


  // Welcome entfernen

  const welcome =
    document.getElementById("welcome");

  if (welcome) {

    welcome.remove();

  }


  // User Nachricht

  addMessage(
    message,
    "user"
  );


  // Input löschen

  messageInput.value = "";

  messageInput.style.height =
    "auto";


  sendButton.disabled =
    true;


  showTyping();


  try {

    const response =
      await fetch(
        SERVER_URL + "/chat",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body: JSON.stringify({

            message:
              message,

            previousInteractionId:
              previousInteractionId

          })

        }
      );


    const data =
      await response.json();


    removeTyping();


    if (!response.ok) {

      throw new Error(
        data.error ||
        "Serverfehler"
      );

    }


    // KI Antwort

    addMessage(
      data.reply,
      "ai"
    );


    // Conversation speichern

    previousInteractionId =
      data.interactionId;


  } catch (error) {

    console.error(
      "Safi AI Fehler:",
      error
    );


    removeTyping();


    addMessage(
      "❌ Safi AI konnte gerade keine Verbindung herstellen. Bitte versuche es noch einmal.",
      "ai"
    );

  }


  sendButton.disabled =
    false;

  messageInput.focus();

}


// ==========================================
// SEND BUTTON
// ==========================================

sendButton.addEventListener(
  "click",
  () => {

    sendMessage();

  }
);


// ==========================================
// ENTER
// ==========================================

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


// ==========================================
// TEXTAREA
// ==========================================

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


// ==========================================
// VORSCHLÄGE
// ==========================================

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


// ==========================================
// NEUER CHAT
// ==========================================

newChatButton.addEventListener(
  "click",
  () => {

    previousInteractionId =
      null;

    location.reload();

  }
);


// ==========================================
// SPRACHEINGABE
// ==========================================

const SpeechRecognition =
  window.SpeechRecognition ||
  window.webkitSpeechRecognition;


let recognition = null;

let recording = false;


if (SpeechRecognition) {

  recognition =
    new SpeechRecognition();


  recognition.lang =
    "de-DE";


  recognition.continuous =
    false;


  recognition.interimResults =
    false;


  recognition.onstart =
    () => {

      recording =
        true;

      micButton.classList.add(
        "recording"
      );

    };


  recognition.onresult =
    event => {

      const transcript =
        event.results[0][0]
          .transcript;


      messageInput.value =
        transcript;


      messageInput.focus();

    };


  recognition.onend =
    () => {

      recording =
        false;

      micButton.classList.remove(
        "recording"
      );

    };


  recognition.onerror =
    () => {

      recording =
        false;

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
        "Dein Browser unterstützt keine Spracheingabe."
      );

    }
  );

}


// ==========================================
// LOGIN
// ==========================================

let registerMode =
  false;


function openLogin() {

  registerMode =
    false;


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


  nameContainer.classList.add(
    "hidden"
  );

}


function openRegister() {

  registerMode =
    true;


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


  nameContainer.classList.remove(
    "hidden"
  );

}


// Buttons

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


// ==========================================
// MODAL SCHLIESSEN
// ==========================================

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


// ==========================================
// LOGIN <-> REGISTRIERUNG
// ==========================================

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


// ==========================================
// LOGIN / REGISTRIERUNG
// ==========================================

authSubmit.addEventListener(
  "click",
  () => {

    const email =
      emailInput.value.trim();

    const password =
      passwordInput.value.trim();


    if (
      !email ||
      !password
    ) {

      alert(
        "Bitte E-Mail und Passwort eingeben."
      );

      return;

    }


    if (registerMode) {

      const name =
        nameInput.value.trim();


      if (!name) {

        alert(
          "Bitte deinen Namen eingeben."
        );

        return;

      }


      localStorage.setItem(
        "safiUser",
        JSON.stringify({

          name:
            name,

          email:
            email

        })
      );


      alert(
        "Konto wurde erstellt!"
      );


    } else {

      localStorage.setItem(
        "safiUser",
        JSON.stringify({

          email:
            email

        })
      );


      alert(
        "Du wurdest angemeldet!"
      );

    }


    authModal.classList.add(
      "hidden"
    );


    emailInput.value = "";

    passwordInput.value = "";

    nameInput.value = "";

  }
);


// ==========================================
// THEME
// ==========================================

themeButton.addEventListener(
  "click",
  () => {

    document.body.classList.toggle(
      "light-theme"
    );

  }
);

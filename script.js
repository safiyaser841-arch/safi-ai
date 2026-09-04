// ============================================
// SAFI AI – SCRIPT
// ============================================

// DEINE RENDER-URL HIER EINTRAGEN
const SERVER_URL = "https://DEIN-SAFI-AI-SERVER.onrender.com";


// Elemente
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


// ============================================
// CHAT MEMORY
// ============================================

let previousInteractionId = null;


// ============================================
// NACHRICHT ANZEIGEN
// ============================================

function addMessage(text, sender) {

    const message = document.createElement("div");

    message.className = `message ${sender}`;

    const avatar = document.createElement("div");

    avatar.className = "message-avatar";

    avatar.textContent =
        sender === "user" ? "Du" : "S";

    const content = document.createElement("div");

    content.className = "message-content";

    content.textContent = text;

    message.appendChild(avatar);
    message.appendChild(content);

    chat.appendChild(message);

    chat.scrollTop = chat.scrollHeight;
}


// ============================================
// SCHREIB-ANIMATION
// ============================================

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


// ============================================
// NACHRICHT SENDEN
// ============================================

async function sendMessage(text = null) {

    const message =
        text || messageInput.value.trim();

    if (!message) {
        return;
    }


    // Willkommen entfernen
    const welcome =
        document.getElementById("welcome");

    if (welcome) {
        welcome.remove();
    }


    // Nutzer-Nachricht
    addMessage(message, "user");


    // Eingabe löschen
    messageInput.value = "";

    messageInput.style.height = "auto";


    // Button deaktivieren
    sendButton.disabled = true;


    // Schreibanimation
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


        const data =
            await response.json();


        removeTyping();


        if (!response.ok) {

            throw new Error(
                data.error ||
                "Serverfehler"
            );

        }


        // KI-Antwort
        addMessage(
            data.reply,
            "ai"
        );


        // Unterhaltung merken
        previousInteractionId =
            data.interactionId;


    } catch (error) {

        console.error(
            "Safi AI Fehler:",
            error
        );


        removeTyping();


        addMessage(
            "❌ Safi AI konnte gerade keine Verbindung herstellen. Bitte versuche es gleich noch einmal.",
            "ai"
        );

    }


    sendButton.disabled = false;

    messageInput.focus();
}


// ============================================
// SENDEN BUTTON
// ============================================

sendButton.addEventListener(
    "click",
    () => {
        sendMessage();
    }
);


// ============================================
// ENTER SENDEN
// ============================================

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


// ============================================
// TEXTFELD AUTOMATISCH VERGRÖSSERN
// ============================================

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


// ============================================
// VORSCHLÄGE
// ============================================

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


// ============================================
// NEUER CHAT
// ============================================

newChatButton.addEventListener(
    "click",
    () => {

        previousInteractionId = null;

        location.reload();

    }
);


// ============================================
// SPRACHEINGABE
// ============================================

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


    recognition.onresult = (event) => {

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


// ============================================
// LOGIN / REGISTRIERUNG
// ============================================

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


// ============================================
// MODAL SCHLIESSEN
// ============================================

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
    (event) => {

        if (
            event.target === authModal
        ) {

            authModal.classList.add(
                "hidden"
            );

        }

    }
);


// ============================================
// ZWISCHEN LOGIN UND REGISTRIERUNG
// ============================================

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


// ============================================
// LOGIN / REGISTRIERUNG DEMO
// ============================================

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


// ============================================
// THEME
// ============================================

themeButton.addEventListener(
    "click",
    () => {

        document.body.classList.toggle(
            "light-mode"
        );

    }
);

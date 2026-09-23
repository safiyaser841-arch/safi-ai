```js
// ===============================
// SAFI AI – CHAT SYSTEM
// ===============================

const API_URL = "https://safi-ai-server.onrender.com";

const chatInput =
    document.getElementById("chatInput") ||
    document.getElementById("messageInput") ||
    document.querySelector("textarea") ||
    document.querySelector("input[type='text']");

const sendButton =
    document.getElementById("sendButton") ||
    document.getElementById("sendBtn") ||
    document.querySelector("button[type='submit']");

const chatContainer =
    document.getElementById("chatMessages") ||
    document.getElementById("messages") ||
    document.querySelector(".chat-messages") ||
    document.querySelector(".messages");


// ===============================
// NACHRICHT ANZEIGEN
// ===============================

function addMessage(text, type = "ai") {
    if (!chatContainer) {
        console.error("Chat-Container wurde nicht gefunden.");
        return;
    }

    const message = document.createElement("div");

    message.className =
        type === "user"
            ? "message user-message"
            : "message ai-message";

    message.textContent = text;

    chatContainer.appendChild(message);

    chatContainer.scrollTop = chatContainer.scrollHeight;
}


// ===============================
// KI ANFRAGE
// ===============================

async function sendMessage() {
    if (!chatInput) {
        console.error("Chat-Eingabefeld wurde nicht gefunden.");
        return;
    }

    const message = chatInput.value.trim();

    if (!message) return;

    // User-Nachricht anzeigen
    addMessage(message, "user");

    // Eingabe leeren
    chatInput.value = "";

    // Ladeanzeige
    const loading = document.createElement("div");
    loading.className = "message ai-message loading";
    loading.textContent = "Safi denkt …";

    if (chatContainer) {
        chatContainer.appendChild(loading);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    try {
        console.log("Sende Nachricht an Safi AI:", message);

        const response = await fetch(`${API_URL}/chat`, {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                message: message
            })
        });

        console.log("Server Status:", response.status);

        // HTTP-Fehler
        if (!response.ok) {
            const errorText = await response.text();

            console.error(
                "Server-Fehler:",
                response.status,
                errorText
            );

            throw new Error(
                `Serverfehler ${response.status}`
            );
        }

        const data = await response.json();

        console.log("Antwort vom Server:", data);

        // Ladeanzeige entfernen
        loading.remove();

        // Verschiedene mögliche Antwortnamen akzeptieren
        const answer =
            data.reply ??
            data.response ??
            data.text ??
            data.message ??
            data.output ??
            data.answer;

        if (!answer) {
            console.error(
                "Server hat keine Antwort geliefert:",
                data
            );

            throw new Error(
                "Keine KI-Antwort vom Server erhalten."
            );
        }

        // KI-Antwort anzeigen
        addMessage(String(answer), "ai");

    } catch (error) {

        console.error("Safi AI Fehler:", error);

        loading.remove();

        addMessage(
            "Entschuldigung, ich konnte gerade keine Antwort erstellen. Bitte versuche es erneut.",
            "ai"
        );
    }
}


// ===============================
// SENDEN BUTTON
// ===============================

if (sendButton) {
    sendButton.addEventListener("click", (event) => {
        event.preventDefault();
        sendMessage();
    });
}


// ===============================
// ENTER ZUM SENDEN
// ===============================

if (chatInput) {
    chatInput.addEventListener("keydown", (event) => {

        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            sendMessage();
        }

    });
}


// ===============================
// DEBUG
// ===============================

console.log("Safi AI Chat-System geladen.");
console.log("API:", API_URL);
```

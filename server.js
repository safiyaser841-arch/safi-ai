import express from "express";
import cors from "cors";
import { GoogleGenAI } from "@google/genai";

const app = express();


// ==========================================
// EINSTELLUNGEN
// ==========================================

const PORT = process.env.PORT || 3000;


// ==========================================
// MIDDLEWARE
// ==========================================

app.use(cors());

app.use(
  express.json({
    limit: "1mb"
  })
);


// ==========================================
// GEMINI
// ==========================================

if (!process.env.GEMINI_API_KEY) {

  console.error(
    "FEHLER: GEMINI_API_KEY wurde nicht gefunden!"
  );

}

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});


// ==========================================
// STARTSEITE
// ==========================================

app.get("/", (req, res) => {

  res.json({
    status: "online",
    message: "Safi AI läuft!",
    version: "2.0.0"
  });

});


// ==========================================
// STATUS
// ==========================================

app.get("/status", (req, res) => {

  res.json({
    online: true,
    service: "Safi AI",
    model: "gemini-3.8-flash"
  });

});


// ==========================================
// CHAT
// ==========================================

app.post("/chat", async (req, res) => {

  try {

    const {
      message,
      previousInteractionId
    } = req.body;


    // Nachricht überprüfen

    if (
      !message ||
      typeof message !== "string" ||
      !message.trim()
    ) {

      return res.status(400).json({

        error:
          "Keine gültige Nachricht erhalten."

      });

    }


    // ======================================
    // GEMINI REQUEST
    // ======================================

    const request = {

      model:
        "gemini-3.8-flash",

      input:
        message.trim(),

      system_instruction:

        "Du bist Safi AI, ein intelligenter, " +
        "freundlicher und hilfreicher KI-Assistent. " +

        "Antworte standardmäßig auf Deutsch, " +
        "wenn der Nutzer Deutsch schreibt. " +

        "Antworte natürlich und verständlich. " +

        "Bei Mathematik zeige den Rechenweg " +
        "und erkläre ihn verständlich. " +

        "Bei Programmierung gib sauberen, " +
        "funktionierenden Code aus und erkläre " +
        "wichtige Teile kurz. " +

        "Wenn eine Frage unklar ist, stelle " +
        "eine kurze Rückfrage. " +

        "Versuche immer, die eigentliche Frage " +
        "des Nutzers direkt zu beantworten."

    };


    // ======================================
    // VORHERIGE UNTERHALTUNG
    // ======================================

    if (
      previousInteractionId &&
      typeof previousInteractionId === "string"
    ) {

      request.previous_interaction_id =
        previousInteractionId;

    }


    // ======================================
    // KI ANFRAGE
    // ======================================

    const interaction =
      await ai.interactions.create(
        request
      );


    // ======================================
    // ANTWORT
    // ======================================

    const reply =
      interaction.output_text ||
      "Ich konnte gerade keine Antwort erzeugen.";


    res.json({

      success: true,

      reply:
        reply,

      interactionId:
        interaction.id

    });


  } catch (error) {

    console.error(
      "Safi AI Fehler:",
      error
    );


    res.status(500).json({

      success: false,

      error:
        "Safi AI konnte gerade keine Antwort erzeugen."

    });

  }

});


// ==========================================
// 404
// ==========================================

app.use((req, res) => {

  res.status(404).json({

    error:
      "Diese Seite wurde nicht gefunden."

  });

});


// ==========================================
// SERVER START
// ==========================================

app.listen(
  PORT,
  () => {

    console.log(
      `Safi AI läuft auf Port ${PORT}`
    );

  }
);

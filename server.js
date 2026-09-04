import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";

const app = express();

const PORT = process.env.PORT || 3000;

// ==========================================
// DATEIPFADE
// ==========================================

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ==========================================
// MIDDLEWARE
// ==========================================

app.use(cors());

app.use(express.json({ limit: "1mb" }));

// Dateien aus dem Hauptordner laden
app.use(express.static(__dirname));

// ==========================================
// GEMINI
// ==========================================

let ai = null;

if (process.env.GEMINI_API_KEY) {
  ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
  });

  console.log("Gemini API ist verbunden.");
} else {
  console.error("WARNUNG: GEMINI_API_KEY fehlt.");
}

// ==========================================
// WEBSITE
// ==========================================

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// ==========================================
// STATUS
// ==========================================

app.get("/status", (req, res) => {
  res.json({
    online: true,
    service: "Safi AI",
    version: "3.0.0",
    gemini: ai !== null
  });
});

// ==========================================
// CHAT
// ==========================================

app.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;

    if (
      !message ||
      typeof message !== "string" ||
      !message.trim()
    ) {
      return res.status(400).json({
        success: false,
        error: "Keine gültige Nachricht erhalten."
      });
    }

    if (!ai) {
      return res.status(500).json({
        success: false,
        error: "GEMINI_API_KEY fehlt auf dem Server."
      });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",

      contents: message.trim(),

      config: {
        systemInstruction:
          "Du bist Safi AI, ein intelligenter, " +
          "freundlicher und hilfreicher KI-Assistent. " +
          "Antworte auf Deutsch, wenn der Nutzer Deutsch schreibt. " +
          "Antworte verständlich und direkt. " +
          "Bei Mathematik erkläre den Rechenweg. " +
          "Bei Programmierung gib sauberen Code aus."
      }
    });

    const reply =
      response.text ||
      "Ich konnte gerade keine Antwort erzeugen.";

    res.json({
      success: true,
      reply: reply
    });

  } catch (error) {

    console.error("Safi AI Fehler:", error);

    res.status(500).json({
      success: false,
      error: "Safi AI konnte gerade keine Antwort erzeugen."
    });
  }
});

// ==========================================
// 404
// ==========================================

app.use((req, res) => {
  res.status(404).json({
    error: "Diese Seite wurde nicht gefunden."
  });
});

// ==========================================
// SERVER START
// ==========================================

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Safi AI läuft auf Port ${PORT}`);
});

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

// Website-Dateien ausliefern
app.use(express.static(path.join(__dirname, "public")));

// ==========================================
// GEMINI
// ==========================================

const apiKey = process.env.GEMINI_API_KEY;

let ai = null;

if (!apiKey) {
  console.error("FEHLER: GEMINI_API_KEY wurde nicht gefunden!");
} else {
  ai = new GoogleGenAI({
    apiKey: apiKey
  });

  console.log("Gemini API wurde geladen.");
}

// ==========================================
// STARTSEITE
// ==========================================

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ==========================================
// STATUS
// ==========================================

app.get("/status", (req, res) => {
  res.json({
    online: true,
    service: "Safi AI",
    version: "3.0.0",
    gemini: !!ai
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
        error: "GEMINI_API_KEY wurde auf dem Server nicht eingerichtet."
      });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",

      contents: message.trim(),

      config: {
        systemInstruction:
          "Du bist Safi AI, ein intelligenter, freundlicher " +
          "und hilfreicher KI-Assistent. " +
          "Antworte standardmäßig auf Deutsch, wenn der Nutzer " +
          "Deutsch schreibt. " +
          "Antworte natürlich, verständlich und direkt. " +
          "Bei Mathematik erkläre den Rechenweg verständlich. " +
          "Bei Programmierung gib sauberen und funktionierenden " +
          "Code aus und erkläre wichtige Teile kurz. " +
          "Wenn eine Frage unklar ist, stelle eine kurze Rückfrage."
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
// FALLBACK
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

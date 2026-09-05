import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const PORT = process.env.PORT || 10000;
const API_KEY = process.env.GEMINI_API_KEY;

app.use(cors());
app.use(express.json({ limit: "1mb" }));

// ==========================================
// GEMINI
// ==========================================

let ai = null;

if (API_KEY) {
  ai = new GoogleGenAI({
    apiKey: API_KEY
  });

  console.log("Gemini API ist verbunden.");
} else {
  console.log("WARNUNG: GEMINI_API_KEY wurde nicht gefunden.");
}

// ==========================================
// FRONTEND
// ==========================================

app.use(express.static(__dirname));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// ==========================================
// STATUS
// ==========================================

app.get("/status", (req, res) => {
  res.json({
    online: true,
    message: "Safi AI läuft!",
    gemini: !!API_KEY,
    version: "3.0.0"
  });
});

// ==========================================
// CHAT
// ==========================================

app.post("/chat", async (req, res) => {
  try {
    const message = req.body?.message;

    if (!message || typeof message !== "string") {
      return res.status(400).json({
        reply: "Bitte schreibe eine Nachricht."
      });
    }

    if (!ai) {
      return res.status(500).json({
        reply: "Safi AI ist noch nicht mit Gemini verbunden."
      });
    }

    const cleanMessage = message.trim();

    if (!cleanMessage) {
      return res.status(400).json({
        reply: "Bitte schreibe eine Nachricht."
      });
    }

    console.log("Neue Nachricht:", cleanMessage);

    let response = null;
    let lastError = null;

    // Erstes Modell
    const models = [
      "gemini-3.7-flash",
      "gemini-3.8-flash"
    ];

    for (const model of models) {
      try {
        console.log(`Versuche Modell: ${model}`);

        response = await ai.models.generateContent({
          model: model,
          contents: [
            {
              role: "user",
              parts: [
                {
                  text:
                    `Du bist Safi AI, ein freundlicher und intelligenter KI-Assistent.

Regeln:
- Antworte auf Deutsch, wenn der Nutzer Deutsch schreibt.
- Antworte auf Englisch, wenn der Nutzer Englisch schreibt.
- Sei freundlich, klar und hilfreich.
- Schreibe keine unnötig langen Antworten.
- Wenn der Nutzer etwas nicht versteht, erkläre es einfach.
- Bei Programmierfragen darfst du vollständigen Code liefern.

Nutzer:
${cleanMessage}`
                }
              ]
            }
          ],
          config: {
            temperature: 0.7,
            maxOutputTokens: 2048
          }
        });

        if (response) {
          console.log(`Modell ${model} erfolgreich.`);
          break;
        }

      } catch (error) {
        lastError = error;

        console.log(
          `Modell ${model} fehlgeschlagen:`,
          error?.message || error
        );
      }
    }

    if (!response) {
      console.error("Alle Gemini-Modelle sind fehlgeschlagen.");
      console.error(lastError);

      return res.status(503).json({
        reply:
          "Safi AI kann gerade keine Antwort von Gemini bekommen. Bitte versuche es gleich noch einmal."
      });
    }

    const reply =
      response.text ||
      response?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "";

    if (!reply) {
      return res.status(500).json({
        reply: "Safi AI hat keine Antwort erhalten."
      });
    }

    console.log("Safi AI Antwort erhalten.");

    return res.json({
      reply: reply
    });

  } catch (error) {
    console.error("Safi AI Fehler:", error);

    return res.status(500).json({
      reply:
        "Es ist ein Fehler aufgetreten. Bitte versuche es noch einmal."
    });
  }
});

// ==========================================
// 404
// ==========================================

app.use((req, res) => {
  res.status(404).json({
    error: "Route nicht gefunden"
  });
});

// ==========================================
// SERVER START
// ==========================================

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Safi AI läuft auf Port ${PORT}`);
});

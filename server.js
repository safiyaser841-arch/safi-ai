import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";
import { GoogleGenAI } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 10000;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 15 * 1024 * 1024
  }
});

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Frontend aus demselben Ordner ausliefern
app.use(express.static(__dirname));


// ================================
// STATUS
// ================================

app.get("/status", (req, res) => {
  res.json({
    ok: true,
    online: true,
    app: "Safi AI",
    version: "3.0.0"
  });
});

app.get("/health", (req, res) => {
  res.json({
    ok: true,
    game: "Safi AI"
  });
});


// ================================
// CHAT
// ================================

app.post("/chat", upload.array("files", 5), async (req, res) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: "GEMINI_API_KEY fehlt auf dem Server."
      });
    }

    const message = String(req.body.message || "").trim();

    if (!message && (!req.files || req.files.length === 0)) {
      return res.status(400).json({
        error: "Bitte schreibe eine Nachricht."
      });
    }

    const parts = [];

    if (message) {
      parts.push({
        text: message
      });
    }

    // Dateien / Bilder an Gemini weitergeben
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const mimeType = file.mimetype || "application/octet-stream";

        parts.push({
          inlineData: {
            mimeType,
            data: file.buffer.toString("base64")
          }
        });
      }
    }

    const systemInstruction = `
Du bist Safi AI, ein moderner, hilfreicher KI-Assistent.

Antworte auf Deutsch, wenn der Nutzer Deutsch schreibt.
Antworte auf Englisch, wenn der Nutzer Englisch schreibt.

Sei freundlich, direkt und verständlich.
Bei Programmierfragen darfst du vollständigen Code liefern.
Wenn der Nutzer etwas nicht versteht, erkläre es einfach Schritt für Schritt.

Du bist nicht ChatGPT. Du bist Safi AI.
`;

    let lastError = null;

    // Mehrere Versuche verhindern zufällige Fehler bei kurzzeitigen
    // Server-/API-Problemen.
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: [
            {
              role: "user",
              parts
            }
          ],
          config: {
            systemInstruction
          }
        });

        const text =
          response.text ||
          response.candidates?.[0]?.content?.parts
            ?.map(part => part.text || "")
            .join("") ||
          "";

        if (!text.trim()) {
          throw new Error("Gemini hat keine Antwort zurückgegeben.");
        }

        return res.json({
          ok: true,
          response: text
        });

      } catch (error) {
        lastError = error;

        console.error(
          `Gemini-Versuch ${attempt}/3 fehlgeschlagen:`,
          error?.message || error
        );

        if (attempt < 3) {
          await new Promise(resolve =>
            setTimeout(resolve, 1000 * attempt)
          );
        }
      }
    }

    console.error("Gemini endgültig fehlgeschlagen:", lastError);

    return res.status(503).json({
      error:
        "Safi AI konnte gerade keine Verbindung zur KI herstellen. Bitte versuche es gleich noch einmal."
    });

  } catch (error) {
    console.error("Chat-Fehler:", error);

    return res.status(500).json({
      error: "Interner Serverfehler."
    });
  }
});


// ================================
// FALLBACK FÜR FRONTEND
// ================================

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});


// ================================
// SERVER START
// ================================

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Safi AI läuft auf Port ${PORT}`);
  console.log("🤖 Gemini API ist verbunden.");
});

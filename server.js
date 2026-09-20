import express from "express";
import cors from "cors";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 10000;

const ai = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY
    })
  : null;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 15 * 1024 * 1024
  }
});

// -------------------------
// Middleware
// -------------------------

app.use(cors());

app.use(
  express.json({
    limit: "10mb"
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "10mb"
  })
);

// -------------------------
// Frontend
// -------------------------

app.use(express.static(__dirname));

// -------------------------
// Status
// -------------------------

app.get("/status", (req, res) => {
  res.json({
    ok: true,
    app: "Safi AI",
    version: "5.0.0",
    online: true,
    gemini: Boolean(process.env.GEMINI_API_KEY)
  });
});

app.get("/health", (req, res) => {
  res.json({
    ok: true
  });
});

// -------------------------
// Chat
// -------------------------

app.post("/chat", upload.array("files", 5), async (req, res) => {
  try {
    if (!ai) {
      return res.status(500).json({
        error: "GEMINI_API_KEY fehlt auf Render."
      });
    }

    const message = String(req.body.message || "").trim();
    const files = req.files || [];

    if (!message && files.length === 0) {
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

    for (const file of files) {
      parts.push({
        inlineData: {
          mimeType: file.mimetype,
          data: file.buffer.toString("base64")
        }
      });
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",

      contents: [
        {
          role: "user",
          parts
        }
      ],

      config: {
        systemInstruction: `
Du bist Safi AI.

Du bist ein moderner persönlicher KI-Assistent.

Antworte auf Deutsch, wenn der Nutzer Deutsch schreibt.
Antworte auf Englisch, wenn der Nutzer Englisch schreibt.

Sei freundlich, direkt und verständlich.

Bei Programmierfragen kannst du vollständigen Code liefern.

Hilf beim Lernen, Programmieren, Schreiben,
Planen und bei allgemeinen Fragen.

Wenn Dateien oder Bilder hochgeladen werden,
analysiere deren Inhalt so gut wie möglich.

Behaupte niemals, etwas getan zu haben,
wenn du es nicht wirklich getan hast.

Dein Name ist Safi AI.
`
      }
    });

    const text =
      response.text ||
      response.candidates?.[0]?.content?.parts
        ?.map((part) => part.text || "")
        .join("") ||
      "";

    if (!text.trim()) {
      return res.status(500).json({
        error: "Safi AI hat keine Antwort erhalten."
      });
    }

    res.json({
      ok: true,
      response: text
    });

  } catch (error) {
    console.error("CHAT ERROR:", error);

    res.status(500).json({
      error: "Safi AI konnte gerade nicht antworten."
    });
  }
});

// -------------------------
// Frontend-Fallback
// -------------------------
// KEIN app.get("*")!
// Dadurch vermeiden wir den Express-5-Fehler.

app.use((req, res) => {
  res.sendFile(
    path.join(__dirname, "index.html")
  );
});

// -------------------------
// Start
// -------------------------

app.listen(PORT, "0.0.0.0", () => {
  console.log("");
  console.log("==============================");
  console.log("🚀 SAFI AI");
  console.log(`🌐 Port: ${PORT}`);
  console.log(
    `🤖 Gemini: ${
      process.env.GEMINI_API_KEY ? "OK" : "FEHLT"
    }`
  );
  console.log("==============================");
  console.log("");
});

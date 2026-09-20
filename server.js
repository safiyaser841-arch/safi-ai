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

// ===============================
// MIDDLEWARE
// ===============================

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

// ===============================
// STATIC FILES
// ===============================

app.use(express.static(__dirname));

// ===============================
// FILE UPLOAD
// ===============================

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 15 * 1024 * 1024
  }
});

// ===============================
// STATUS
// ===============================

app.get("/status", (req, res) => {
  res.json({
    ok: true,
    online: true,
    app: "Safi AI",
    version: "4.0.0"
  });
});

app.get("/health", (req, res) => {
  res.json({
    ok: true,
    service: "Safi AI"
  });
});

// ===============================
// CHAT
// ===============================

app.post("/chat", upload.array("files", 5), async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.error("GEMINI_API_KEY fehlt.");

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

    const ai = new GoogleGenAI({
      apiKey: apiKey
    });

    const parts = [];

    // Nachricht
    if (message) {
      parts.push({
        text: message
      });
    }

    // Dateien / Bilder
    for (const file of files) {
      parts.push({
        inlineData: {
          mimeType: file.mimetype || "application/octet-stream",
          data: file.buffer.toString("base64")
        }
      });
    }

    const systemInstruction = `
Du bist Safi AI, ein moderner persönlicher KI-Assistent.

Dein Name ist Safi AI.

Wenn der Nutzer Deutsch schreibt, antworte auf Deutsch.
Wenn der Nutzer Englisch schreibt, antworte auf Englisch.

Sei freundlich, direkt und verständlich.

Bei Programmierfragen darfst du vollständigen Code schreiben.

Wenn der Nutzer Bilder oder Dateien hochlädt,
analysiere sie so gut wie möglich.

Wenn etwas unklar ist, sage ehrlich, dass es unklar ist.

Du sollst nicht behaupten, etwas gemacht zu haben,
wenn du es nicht wirklich gemacht hast.

Du bist Safi AI.
`;

    let lastError = null;

    // Bis zu 3 Versuche
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(
          `Safi AI: Anfrage wird verarbeitet (${attempt}/3)`
        );

        const result = await ai.models.generateContent({
          model: "gemini-2.5-flash",

          contents: [
            {
              role: "user",
              parts: parts
            }
          ],

          config: {
            systemInstruction: systemInstruction
          }
        });

        const answer =
          result.text ||
          result.candidates?.[0]?.content?.parts
            ?.map((part) => part.text || "")
            .join("") ||
          "";

        if (!answer.trim()) {
          throw new Error(
            "Gemini hat keine Antwort zurückgegeben."
          );
        }

        console.log("Safi AI: Antwort erfolgreich.");

        return res.json({
          ok: true,
          response: answer
        });

      } catch (error) {
        lastError = error;

        console.error(
          `Gemini Fehler ${attempt}/3:`,
          error?.message || error
        );

        if (attempt < 3) {
          await new Promise((resolve) => {
            setTimeout(resolve, attempt * 1000);
          });
        }
      }
    }

    console.error(
      "Safi AI: Alle Gemini-Versuche fehlgeschlagen.",
      lastError
    );

    return res.status(503).json({
      error:
        "Safi AI konnte die KI gerade nicht erreichen. Bitte versuche es erneut."
    });

  } catch (error) {
    console.error("Chat Server Fehler:", error);

    return res.status(500).json({
      error: "Interner Serverfehler."
    });
  }
});

// ===============================
// 404 / FRONTEND FALLBACK
// ===============================

app.use((req, res) => {
  res.sendFile(
    path.join(__dirname, "index.html")
  );
});

// ===============================
// SERVER START
// ===============================

app.listen(PORT, "0.0.0.0", () => {
  console.log("--------------------------------");
  console.log("🚀 Safi AI Server gestartet");
  console.log(`🌐 Port: ${PORT}`);
  console.log("🤖 Gemini API bereit");
  console.log("--------------------------------");
});

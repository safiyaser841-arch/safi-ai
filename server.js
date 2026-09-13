import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs/promises";
import os from "os";
import crypto from "crypto";
import multer from "multer";
import { GoogleGenAI } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 10000;

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error("❌ GEMINI_API_KEY fehlt!");
}

const ai = GEMINI_API_KEY
  ? new GoogleGenAI({ apiKey: GEMINI_API_KEY })
  : null;

// --------------------------------------------------
// MIDDLEWARE
// --------------------------------------------------

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024,
    files: 5,
  },
});

// --------------------------------------------------
// BASIC ROUTES
// --------------------------------------------------

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/status", (req, res) => {
  res.json({
    online: true,
    service: "Safi AI",
    version: "3.0.0",
    gemini: Boolean(GEMINI_API_KEY),
    time: new Date().toISOString(),
  });
});

app.get("/health", (req, res) => {
  res.json({
    ok: true,
    game: "Safi AI",
  });
});

// --------------------------------------------------
// HELPERS
// --------------------------------------------------

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getErrorStatus(error) {
  return (
    error?.status ||
    error?.statusCode ||
    error?.response?.status ||
    500
  );
}

function isRetryableError(error) {
  const status = getErrorStatus(error);

  const text = String(
    error?.message ||
      error?.error ||
      ""
  ).toLowerCase();

  return (
    status === 408 ||
    status === 429 ||
    status === 500 ||
    status === 502 ||
    status === 503 ||
    status === 504 ||
    text.includes("timeout") ||
    text.includes("temporarily") ||
    text.includes("unavailable") ||
    text.includes("overloaded") ||
    text.includes("rate limit") ||
    text.includes("resource exhausted")
  );
}

// --------------------------------------------------
// GEMINI REQUEST MIT RETRIES
// --------------------------------------------------

async function createInteraction(input, previousInteractionId = null) {
  if (!ai) {
    throw new Error("Gemini API ist nicht konfiguriert.");
  }

  const models = [
    "gemini-3.8-flash",
    "gemini-3.7-flash",
  ];

  let lastError = null;

  for (const model of models) {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const options = {
          model,
          input,
        };

        if (previousInteractionId) {
          options.previous_interaction_id =
            previousInteractionId;
        }

        const result = await ai.interactions.create(options);

        return result;
      } catch (error) {
        lastError = error;

        console.error(
          `Gemini Fehler | Modell: ${model} | Versuch: ${
            attempt + 1
          }`,
          error?.message || error
        );

        if (!isRetryableError(error)) {
          break;
        }

        await sleep(800 * Math.pow(2, attempt));
      }
    }
  }

  throw lastError || new Error("Gemini-Anfrage fehlgeschlagen.");
}

// --------------------------------------------------
// FILE → GEMINI INPUT
// --------------------------------------------------

async function uploadFileToGemini(file) {
  const tempName = `${crypto.randomUUID()}-${file.originalname}`;
  const tempPath = path.join(os.tmpdir(), tempName);

  try {
    await fs.writeFile(tempPath, file.buffer);

    const uploaded = await ai.files.upload({
      file: tempPath,
      config: {
        mimeType: file.mimetype,
      },
    });

    return uploaded;
  } finally {
    try {
      await fs.unlink(tempPath);
    } catch {
      // Datei war bereits gelöscht
    }
  }
}

function getGeminiFileType(mimeType) {
  if (mimeType.startsWith("image/")) {
    return "image";
  }

  if (mimeType.startsWith("audio/")) {
    return "audio";
  }

  if (mimeType.startsWith("video/")) {
    return "video";
  }

  return "document";
}

// --------------------------------------------------
// CHAT
// --------------------------------------------------

app.post("/chat", upload.array("files", 5), async (req, res) => {
  try {
    if (!GEMINI_API_KEY) {
      return res.status(500).json({
        success: false,
        error: "GEMINI_API_KEY ist auf dem Server nicht gesetzt.",
      });
    }

    const message =
      typeof req.body.message === "string"
        ? req.body.message.trim()
        : "";

    const previousInteractionId =
      typeof req.body.previousInteractionId === "string"
        ? req.body.previousInteractionId.trim()
        : null;

    const files = req.files || [];

    if (!message && files.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Bitte schreibe eine Nachricht oder füge eine Datei hinzu.",
      });
    }

    // ----------------------------------------------
    // INPUT AUFBAUEN
    // ----------------------------------------------

    const input = [];

    if (message) {
      input.push({
        type: "text",
        text: message,
      });
    }

    // ----------------------------------------------
    // DATEIEN HOCHLADEN
    // ----------------------------------------------

    for (const file of files) {
      try {
        console.log(
          `📎 Datei wird verarbeitet: ${file.originalname}`
        );

        const uploaded = await uploadFileToGemini(file);

        if (!uploaded?.uri) {
          console.warn(
            `⚠️ Keine Gemini-URI für ${file.originalname}`
          );
          continue;
        }

        const type = getGeminiFileType(file.mimetype);

        input.push({
          type,
          uri: uploaded.uri,
          mime_type:
            uploaded.mimeType || file.mimetype,
        });
      } catch (fileError) {
        console.error(
          `❌ Datei konnte nicht verarbeitet werden: ${file.originalname}`,
          fileError
        );

        return res.status(400).json({
          success: false,
          error: `Die Datei "${file.originalname}" konnte nicht verarbeitet werden.`,
        });
      }
    }

    // ----------------------------------------------
    // GEMINI
    // ----------------------------------------------

    const interaction = await createInteraction(
      input,
      previousInteractionId
    );

    const outputText =
      interaction?.output_text ||
      interaction?.output
        ?.filter((item) => item?.type === "text")
        ?.map((item) => item?.text || "")
        ?.join("\n") ||
      "";

    if (!outputText.trim()) {
      return res.status(502).json({
        success: false,
        error: "Safi AI hat keine Textantwort zurückgegeben.",
      });
    }

    console.log("✅ Safi AI Antwort erfolgreich");

    return res.json({
      success: true,
      reply: outputText,
      interactionId:
        interaction?.id || null,
      model:
        interaction?.model || null,
    });
  } catch (error) {
    console.error("❌ CHAT FEHLER:", error);

    const status = getErrorStatus(error);

    if (status === 429) {
      return res.status(429).json({
        success: false,
        error:
          "Safi AI ist gerade stark ausgelastet. Bitte versuche es gleich noch einmal.",
      });
    }

    if (status === 401 || status === 403) {
      return res.status(500).json({
        success: false,
        error:
          "Der Gemini API-Schlüssel funktioniert nicht korrekt.",
      });
    }

    return res.status(500).json({
      success: false,
      error:
        "Safi AI konnte die Anfrage gerade nicht verarbeiten. Bitte versuche es erneut.",
    });
  }
});

// --------------------------------------------------
// 404
// --------------------------------------------------

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Route nicht gefunden.",
  });
});

// --------------------------------------------------
// GLOBAL ERROR HANDLER
// --------------------------------------------------

app.use((error, req, res, next) => {
  console.error("❌ SERVER ERROR:", error);

  if (error instanceof multer.MulterError) {
    return res.status(400).json({
      success: false,
      error:
        error.code === "LIMIT_FILE_SIZE"
          ? "Die Datei ist zu groß. Maximal 20 MB."
          : "Die Datei konnte nicht hochgeladen werden.",
    });
  }

  res.status(500).json({
    success: false,
    error: "Interner Serverfehler.",
  });
});

// --------------------------------------------------
// SERVER START
// --------------------------------------------------

app.listen(PORT, () => {
  console.log("");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("        🤖 SAFI AI");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`🚀 Safi AI läuft auf Port ${PORT}`);
  console.log(`🌐 Umgebung: ${process.env.NODE_ENV || "production"}`);
  console.log(
    `🔑 Gemini API: ${GEMINI_API_KEY ? "verbunden" : "FEHLT"}`
  );
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("");
});

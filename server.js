```js
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";

const app = express();

const PORT = process.env.PORT || 3000;

// ==========================================
// DATEIPFAD
// ==========================================

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ==========================================
// MIDDLEWARE
// ==========================================

app.use(cors());

app.use(
  express.json({
    limit: "1mb"
  })
);

// HTML, CSS und JS aus dem Hauptordner laden
app.use(express.static(__dirname));

// ==========================================
// GEMINI
// ==========================================

let ai = null;

if (!process.env.GEMINI_API_KEY) {

  console.error(
    "FEHLER: GEMINI_API_KEY fehlt!"
  );

} else {

  ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
  });

  console.log(
    "Gemini API ist verbunden."
  );
}

// ==========================================
// STARTSEITE
// ==========================================

app.get("/", (req, res) => {

  res.sendFile(
    path.join(__dirname, "index.html")
  );

});

// ==========================================
// STATUS
// ==========================================

app.get("/status", (req, res) => {

  res.json({
    online: true,
    service: "Safi AI",
    version: "3.1.0",
    gemini: ai !== null
  });

});

// ==========================================
// GEMINI ANFRAGE
// ==========================================

async function generateAnswer(message) {

  const models = [
    "gemini-3.5-flash",
    "gemini-3.1-flash-lite"
  ];

  let lastError = null;

  for (const model of models) {

    for (let attempt = 1; attempt <= 2; attempt++) {

      try {

        console.log(
          `Safi AI: ${model} - Versuch ${attempt}`
        );

        const response =
          await ai.models.generateContent({

            model: model,

            contents: message,

            config: {

              systemInstruction:
                "Du bist Safi AI, ein intelligenter, " +
                "freundlicher und hilfreicher KI-Assistent. " +

                "Antworte auf Deutsch, wenn der Nutzer " +
                "Deutsch schreibt. " +

                "Antworte natürlich, verständlich und direkt. " +

                "Bei Mathematik erkläre den Rechenweg " +
                "verständlich. " +

                "Bei Programmierung gib sauberen und " +
                "funktionierenden Code aus. " +

                "Wenn eine Frage unklar ist, stelle " +
                "eine kurze Rückfrage."

            }

          });

        const text = response.text;

        if (text && text.trim()) {

          console.log(
            `Safi AI Antwort erfolgreich mit ${model}`
          );

          return text.trim();

        }

        throw new Error(
          "Gemini hat keine Textantwort zurückgegeben."
        );

      } catch (error) {

        lastError = error;

        console.error(
          `${model} Versuch ${attempt} fehlgeschlagen:`,
          error?.message || error
        );

        // Bei vorübergehender Überlastung kurz warten
        if (
          error?.status === 503 ||
          error?.code === 503
        ) {

          await new Promise(
            resolve => setTimeout(resolve, 1200)
          );

        } else {

          break;

        }

      }

    }

  }

  throw lastError ||
    new Error("Keine Gemini-Antwort erhalten.");

}

// ==========================================
// CHAT
// ==========================================

app.post("/chat", async (req, res) => {

  try {

    const message =
      req.body?.message;


    // Nachricht überprüfen

    if (
      !message ||
      typeof message !== "string" ||
      !message.trim()
    ) {

      return res.status(400).json({

        success: false,

        error:
          "Bitte gib eine Nachricht ein."

      });

    }


    // API prüfen

    if (!ai) {

      return res.status(500).json({

        success: false,

        error:
          "GEMINI_API_KEY ist auf dem Server nicht eingerichtet."

      });

    }


    // KI fragen

    const reply =
      await generateAnswer(
        message.trim()
      );


    // Antwort senden

    return res.json({

      success: true,

      reply: reply

    });

  } catch (error) {

    console.error(
      "Safi AI Fehler:",
      error
    );


    return res.status(500).json({

      success: false,

      error:
        "Die KI ist momentan nicht verfügbar. Bitte versuche es gleich noch einmal."

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
  "0.0.0.0",
  () => {

    console.log(
      `Safi AI läuft auf Port ${PORT}`
    );

  }
);
```

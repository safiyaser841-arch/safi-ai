```js
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";

const app = express();

const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


// ==========================================
// MIDDLEWARE
// ==========================================

app.use(cors());

app.use(express.json({ limit: "1mb" }));

// index.html, style.css und script.js
// liegen direkt im Hauptordner
app.use(express.static(__dirname));


// ==========================================
// GEMINI
// ==========================================

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error("❌ GEMINI_API_KEY fehlt!");
}

const ai = apiKey
  ? new GoogleGenAI({
      apiKey: apiKey
    })
  : null;


// ==========================================
// WEBSITE
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
    gemini: ai !== null
  });
});


// ==========================================
// CHAT
// ==========================================

app.post("/chat", async (req, res) => {

  try {

    const message = req.body?.message;

    console.log(
      "📩 Nachricht:",
      message
    );


    // Nachricht prüfen

    if (
      typeof message !== "string" ||
      !message.trim()
    ) {

      return res.status(400).json({
        success: false,
        error: "Keine Nachricht erhalten."
      });

    }


    // API-Key prüfen

    if (!ai) {

      return res.status(500).json({
        success: false,
        error:
          "GEMINI_API_KEY ist nicht eingerichtet."
      });

    }


    console.log(
      "🤖 Anfrage an Gemini..."
    );


    // ======================================
    // GEMINI
    // ======================================

    const response =
      await ai.models.generateContent({

        model: "gemini-3.8-flash",

        contents: message.trim(),

        config: {

          systemInstruction:
            "Du bist Safi AI, ein intelligenter, " +
            "freundlicher und hilfreicher KI-Assistent. " +
            "Antworte auf Deutsch, wenn der Nutzer Deutsch schreibt. " +
            "Antworte klar, natürlich und direkt. " +
            "Bei Mathematik erkläre den Rechenweg. " +
            "Bei Programmierung gib funktionierenden Code aus. " +
            "Du darfst auch normale Fragen über Alltag, Schule, " +
            "Technik und Wissen beantworten."

        }

      });


    const reply = response.text;


    console.log(
      "✅ Gemini hat geantwortet."
    );


    if (
      !reply ||
      !reply.trim()
    ) {

      return res.status(500).json({
        success: false,
        error:
          "Gemini hat keine Antwort zurückgegeben."
      });

    }


    // Antwort an Website

    return res.json({

      success: true,

      reply: reply.trim()

    });


  } catch (error) {

    console.error(
      "❌ SAFI AI FEHLER:",
      error
    );


    return res.status(500).json({

      success: false,

      error:
        "Die KI ist momentan nicht erreichbar."

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
      `🚀 Safi AI läuft auf Port ${PORT}`
    );

    console.log(
      `🌐 Port: ${PORT}`
    );

    console.log(
      `🔑 Gemini: ${ai ? "verbunden" : "fehlt"}`
    );

  }
);
```


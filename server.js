import express from "express";
import cors from "cors";
import { GoogleGenAI } from "@google/genai";

const app = express();

app.use(cors());
app.use(express.json());

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

app.get("/", (req, res) => {
  res.json({
    status: "online",
    message: "Safi AI Server läuft!"
  });
});

app.post("/chat", async (req, res) => {
  try {
    const message = req.body.message;

    if (!message || !message.trim()) {
      return res.status(400).json({
        error: "Keine Nachricht erhalten."
      });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: message,
      config: {
        systemInstruction:
          "Du bist Safi AI, ein freundlicher, hilfreicher KI-Assistent. Antworte klar, verständlich und auf Deutsch, wenn der Nutzer Deutsch schreibt."
      }
    });

    res.json({
      reply: response.text
    });

  } catch (error) {
    console.error("KI-Fehler:", error);

    res.status(500).json({
      error: "Safi AI konnte gerade keine Antwort erstellen."
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Safi AI Server läuft auf Port ${PORT}`);
});

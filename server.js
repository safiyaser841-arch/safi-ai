import express from "express";
import cors from "cors";
import { GoogleGenAI } from "@google/genai";

const app = express();

app.use(cors());
app.use(express.json({ limit: "1mb" }));

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

app.get("/", (req, res) => {
  res.json({
    status: "online",
    message: "Safi AI läuft!"
  });
});

app.post("/chat", async (req, res) => {
  try {
    const { message, previousInteractionId } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        error: "Keine Nachricht erhalten."
      });
    }

    const request = {
      model: "gemini-3.8-flash",

      input: message,

      system_instruction:
        "Du bist Safi AI, ein intelligenter, freundlicher und hilfreicher KI-Assistent. " +
        "Antworte standardmäßig auf Deutsch, wenn der Nutzer Deutsch schreibt. " +
        "Erkläre schwierige Dinge verständlich. " +
        "Bei Programmierung gib sauberen, funktionierenden Code und erkläre ihn. " +
        "Bei Mathe zeige den Rechenweg. " +
        "Wenn eine Frage unklar ist, stelle eine kurze Rückfrage. " +
        "Antworte natürlich und hilfreich."
    };

    if (previousInteractionId) {
      request.previous_interaction_id = previousInteractionId;
    }

    const interaction = await ai.interactions.create(request);

    res.json({
      reply: interaction.output_text || "Ich konnte gerade keine Antwort erzeugen.",
      interactionId: interaction.id
    });

  } catch (error) {
    console.error("Safi AI Fehler:", error);

    res.status(500).json({
      error: "Die KI konnte gerade nicht antworten."
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Safi AI läuft auf Port ${PORT}`);
});

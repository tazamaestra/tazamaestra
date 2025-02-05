import OpenAI from "openai";
import express from 'express';
const router = express.Router();
const openai = new OpenAI();

router.post('/api/v1/assistants', async (req, res) => {
  const { instructions, name, tools, model } = req.body;
  try {
    const assistant = await openai.beta.assistants.create({
      instructions: instructions,
      name: name,
      tools: tools,
      model: model
    });

    res.json(assistant);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Exportamos la función directamente, no como un objeto
export const assistantRoute = router;

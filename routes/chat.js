import express from 'express';
import OpenAI from 'openai';

const router = express.Router();

// Helper function to clean API key
function cleanApiKey(apiKey) {
  if (!apiKey) return '';
  const cleaned = apiKey.replace(/^Bearer\s+/i, '').trim();
  console.log('API Key length:', cleaned.length);
  console.log('API Key starts with:', cleaned.substring(0, 7) + '...');
  return cleaned;
}

// POST /api/v1/chat/thread
router.post('/thread', async (req, res) => {
  try {
    const { apiKey: rawApiKey, assistantId } = req.body;

    console.log('Contenido completo del req.body:', req.body);
    console.log('Received request to create thread:', {
      hasApiKey: !!rawApiKey,
      apiKeyLength: rawApiKey?.length,
      assistantId,
      contentType: req.headers['content-type']
    });

    if (!rawApiKey || !assistantId) {
      return res.status(400).json({
        error: 'API key y assistant ID son requeridos'
      });
    }

    const apiKey = cleanApiKey(rawApiKey);

    if (!apiKey.startsWith('sk-')) {
      return res.status(401).json({
        error: 'API key inválida: debe comenzar con sk-'
      });
    }

    try {
      const openai = new OpenAI({ apiKey });

      // Verificar que el asistente existe
      const assistant = await openai.beta.assistants.retrieve(assistantId);
      console.log('Assistant verified:', assistant.id);

      // Crear el thread
      const thread = await openai.beta.threads.create();
      console.log('Thread created:', thread.id);

      res.json({ threadId: thread.id });
    } catch (openaiError) {
      console.error('OpenAI API error:', {
        status: openaiError.status,
        message: openaiError.message,
        type: openaiError.type
      });

      if (openaiError.status === 401) {
        return res.status(401).json({
          error: 'API key inválida'
        });
      }

      if (openaiError.status === 404) {
        return res.status(404).json({
          error: 'Asistente no encontrado'
        });
      }

      throw openaiError;
    }
  } catch (error) {
    console.error('Error creating thread:', error);
    res.status(500).json({
      error: 'Error al crear el hilo de chat',
      details: error.message
    });
  }
});

// POST /api/chat/message
router.post('/message', async (req, res) => {
  try {
    const { apiKey: rawApiKey, assistantId, threadId, message } = req.body;

    if (!rawApiKey || !assistantId || !threadId || !message) {
      return res.status(400).json({
        error: 'Faltan campos requeridos'
      });
    }

    const apiKey = cleanApiKey(rawApiKey);
    const openai = new OpenAI({ apiKey });

    // Agregar el mensaje del usuario al hilo
    await openai.beta.threads.messages.create(threadId, {
      role: 'user',
      content: message
    });

    // Ejecutar el asistente
    const run = await openai.beta.threads.runs.create(threadId, {
      assistant_id: assistantId
    });

    // Esperar a que el asistente termine de procesar
    let runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id);
    while (runStatus.status !== 'completed') {
      if (runStatus.status === 'failed') {
        throw new Error('Error al procesar el mensaje');
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
      runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id);
    }

    // Obtener los mensajes del hilo
    const messages = await openai.beta.threads.messages.list(threadId);
    const lastMessage = messages.data[0];

    res.json({
      role: lastMessage.role,
      content: lastMessage.content[0].text.value
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({
      error: 'Error al enviar el mensaje',
      details: error.message
    });
  }
});

export default router;

import express from 'express';
import cors from 'cors';
import { assistantRoute } from './routes/assistants.js';
import chatRouter from './routes/chat.js';


const app = express();
app.use(cors());
app.use(express.json());
// Rutas
app.use('/', assistantRoute);
app.use('/api/v1', chatRouter);

// Agregar manejo de errores básico
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('¡Algo salió mal!');
});

app.listen();

import express from 'express';
import cors from 'cors';
import { assistantRoute } from './routes/assistants.js';
import chatRouter from './routes/chat.js';
import dotenv from 'dotenv';


// Configuramos dotenv y guardamos el resultado
const result = dotenv.config();

// Verificamos si hubo error al cargar el .env
if (result.error) {
  console.log('Error al cargar .env:', result.error);
}
const port = process.env.PORT || 3000;
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

app.listen(port, () => {
  console.log(`Servidor corriendo en puerto ${port}`);
});

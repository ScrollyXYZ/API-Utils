import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import './src/config/database'; // Ensure the database connection is initialized
import routes from './src/routes/index';
import { buildCache, monitorIdCounter } from './src/cacheBuilder';
import './src/eventListener'; // Ensure event listener is initialized

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use('/api', routes);

app.get('/trigger-cache', async (req, res) => {
  await buildCache();
  res.send('Cache build process triggered.');
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  buildCache(); // Initial cache build when server starts
  monitorIdCounter(); // Start monitoring the idCounter
});

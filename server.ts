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
  try {
    await buildCache();
    res.send('Cache build process triggered.');
  } catch (error) {
    console.error('Error triggering cache build:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  monitorIdCounter(); // Start monitoring the idCounter
});

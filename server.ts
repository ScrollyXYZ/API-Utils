import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

import './src/config/database'; // Ensure the database connection is initialized
import { buildCache } from './src/cacheBuilder';
import './src/eventListener';
import routes from './src/routes/index';

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use('/api', routes);

app.get('/trigger-cache', async (req, res) => {
  console.log('Triggering cache build...');
  await buildCache();
  res.send('Cache build process triggered.');
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  buildCache(); // Build the initial cache when the server starts
});
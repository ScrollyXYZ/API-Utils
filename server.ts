import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import './config/database'; // Ensure the database connection is initialized
import { buildCache } from './src/cacheBuilder';
import './eventListener';
import routes from './src/routes/index';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use('/api', routes);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  buildCache(); // Build the initial cache when the server starts
});

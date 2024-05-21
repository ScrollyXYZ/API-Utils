import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

import { buildCache } from './src/cacheBuilder';
import './src/eventListener';
import routes from './src/routes/index';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/api', routes);

mongoose.set('strictQuery', true);
const mongoDBConnectionString = process.env.MONGODB_CONNECTION_STRING;

if (!mongoDBConnectionString) {
  console.error("MongoDB connection string is not defined in environment variables.");
  process.exit(1);
}

mongoose.connect(mongoDBConnectionString, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  buildCache(); // Build the initial cache when the server starts
});

import express from 'express';
import cors from 'cors';
import './config/database';
import router from './routes';
import './cacheBuilder';
import './eventListener';

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use('/api', router);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

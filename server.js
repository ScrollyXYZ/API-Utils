const express = require('express');
const cors = require('cors');
const mongoose = require('./src/database');
const routes = require('./src/routes');
require('./src/cacheBuilder'); // Start cache building
require('./src/eventListener'); // Start event listener

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use('/api', routes);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

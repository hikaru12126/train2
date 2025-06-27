require('dotenv').config();
const express = require('express');
const cors = require('cors');
const chatRouter = require('./routes/chat'); // routes/chat.js という構成

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api', chatRouter);

const PORT = 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Listening on port ${PORT}`);
});

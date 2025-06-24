require('dotenv').config(); // これが一番上！
const express = require('express');
const cors = require('cors');
const chatRouter = require('./routes/chat');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api', chatRouter);

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
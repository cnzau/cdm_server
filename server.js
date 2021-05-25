const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

const dbService = require('./dbService');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.get('/', (req, res) =>
  res.json({ msg: 'Chronic Disease Management system' })
);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server started on port: ${PORT}`));

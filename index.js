// index.js
const express = require('express');
const bodyParser = require('body-parser');
const trades = require('./data');

const app = express();
app.use(bodyParser.json());

app.post('/balance', (req, res) => {
  const { timestamp } = req.body;

  if (!timestamp) {
    return res.status(400).json({ error: 'Timestamp is required' });
  }

  const filteredTrades = trades.filter(trade => new Date(trade.timestamp) <= new Date(timestamp));

  // Calculate balance for each asset
  const balance = filteredTrades.reduce((acc, trade) => {
    if (!acc[trade.asset]) {
      acc[trade.asset] = 0;
    }
    acc[trade.asset] += trade.amount;
    return acc;
  }, {});

  res.json(balance);
});

const PORT = process.env.PORT || 5002;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

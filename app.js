const express = require('express');
const multer = require('multer');
const fs = require('fs');
const csv = require('csv-parser');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;

// MongoDB connection
mongoose.connect(process.env.MONGODB_URL);

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});

// Define the Trade schema
const tradeSchema = new mongoose.Schema({
  utcTime: { type: Date, required: true },
  operation: { type: String, required: true, enum: ['BUY', 'SELL'] },
  market: { type: String, required: true },
  baseCoin: { type: String, required: true },
  quoteCoin: { type: String, required: true },
  amount: { type: Number, required: true },
  price: { type: Number, required: true },
});

const Trade = mongoose.model('Trade', tradeSchema);

// Configure Multer for file upload
const upload = multer({ dest: 'uploads/' });

// Endpoint to upload and parse the CSV file
app.post('/upload-csv', upload.single('file'), (req, res) => {
    if (!req.file) {
      return res.status(400).send('No file uploaded.');
    }
  
    // Process the uploaded file
    const results = [];
    const buffer = req.file.buffer; // Access the file buffer
  
    // Use buffer to parse CSV
    const readableStream = require('stream').Readable.from(buffer);
    readableStream
      .pipe(csv())
      .on('data', (data) => {
        const [baseCoin, quoteCoin] = data.Market.split('/');
        results.push({
          utcTime: new Date(data.UTC_Time),
          operation: data.Operation.toUpperCase(),
          market: data.Market,
          baseCoin,
          quoteCoin,
          amount: parseFloat(data['Buy/Sell Amount']),
          price: parseFloat(data.Price),
        });
      })
      .on('end', async () => {
        try {
          await Trade.insertMany(results);
          res.status(200).send('CSV data has been saved to the database.');
        } catch (error) {
          console.error(error);
          res.status(500).send('Error saving data to the database.');
        }
      });
  });
  
// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

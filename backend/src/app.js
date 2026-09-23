const express = require('express');
const cors = require('cors');

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Health-check route
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'TalentTwin backend is running'
  });
});

module.exports = app;

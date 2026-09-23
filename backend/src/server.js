require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');

// Process-level error handling
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception! Shutting down...', err);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection! Shutting down...', err);
  process.exit(1);
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Connect to database first
    await connectDB();
    
    // Start Express server
    app.listen(PORT, () => {
      console.log(`Server is running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start the server due to database connection error.');
    process.exit(1);
  }
};

startServer();

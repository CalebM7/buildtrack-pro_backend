import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from './config/db.js';
import app from './app.js';

// Load environment variables from .env file
dotenv.config();

// Connect to the database
connectDB();

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`));

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.error(`Error: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});

// Handle graceful shutdown
const gracefulShutdown = (signal) => {
  process.on(signal, () => {
    console.log(`${signal} received: closing HTTP server`);
    server.close(() => {
      console.log('HTTP server closed');
      // Close DB connection
      mongoose.connection.close(false, () => {
        console.log('MongoDB connection closed');
        process.exit(0);
      });
    })
  })
}

['SIGINT', 'SIGTERM'].forEach(gracefulShutdown);
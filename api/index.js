// Vercel Serverless Function Entry Point
// This file exports the Express app for Vercel's serverless environment

const path = require('path');

// Set the correct path for requiring the server
// Since Vercel runs functions from the api directory, we need to go up one level
process.chdir(path.join(__dirname, '..'));

// Import the server
const app = require('../backend/server');

// Export for Vercel
module.exports = app;

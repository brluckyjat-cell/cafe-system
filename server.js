const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();

// Live Hosting Environments (Render, Railway, Heroku, Firebase) ke liye dynamic Port setup
const PORT = process.env.PORT || 3000;

// Security & Parsing Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve Public Static Frontend Assets
app.use(express.static(path.join(__dirname, 'public')));

// Health Check API (Cloud Servers & Uptime Monitoring ke liye)
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    app: 'Chai Ceremony Cafe Engine',
    timestamp: new Date().toISOString()
  });
});

// Explicit Route Handlers for Clean URLs
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/menu', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'menu.html'));
});

app.get('/order-tracking', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'order-tracking.html'));
});

app.get('/about', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'about.html'));
});

app.get('/contact', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'contact.html'));
});

// Wildcard Fallback Handler for SPA Routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Express Server
app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`☕ Chai Ceremony Cafe Server Live on Port ${PORT}`);
  console.log(`📍 Web Interface: http://localhost:${PORT}`);
  console.log(`👑 Theme: Royal Rajasthani + Modern Premium Cafe`);
  console.log(`====================================================`);
});

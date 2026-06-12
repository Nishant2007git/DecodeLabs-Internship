const express = require('express');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const authRoutes = require('./routes/auth');
const internshipRoutes = require('./routes/internships');
const applicationRoutes = require('./routes/applications');

const app = express();
const PORT = process.env.PORT || 3000;

// Body Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log incoming requests for admin visibility
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Serve Client Web Assets Statically
app.use(express.static(path.join(__dirname, '../frontend')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/internships', internshipRoutes);
app.use('/api/applications', applicationRoutes);

// Database User query console helper for Admin Space
app.get('/api/users', require('./middleware/authMiddleware'), async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin access only.' });
  }
  try {
    const db = require('./models/db');
    const result = await db.query('SELECT id, name, email, role, created_at FROM users');
    return res.status(200).json({ success: true, data: result.rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Fallback Route to serve Landing Page
app.use((req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Start Web Server
let startupErrorHandled = false;

function handleStartupError(error) {
  if (startupErrorHandled) return;
  startupErrorHandled = true;

  console.error('===============================================');
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use.`);
    console.error(`   Stop the existing server or set a different PORT in .env.`);
  } else {
    console.error('❌ Failed to start InternHub:', error.message);
  }
  console.error('===============================================');
  process.exitCode = 1;
}

const server = app.listen(PORT, (error) => {
  // Express 5 passes listen errors to this callback.
  if (error) {
    handleStartupError(error);
    return;
  }

  console.log(`===============================================`);
  console.log(`🚀 InternHub Web Application Listening on PORT: ${PORT}`);
  console.log(`🌍 Preview address: http://localhost:${PORT}`);
  console.log(`===============================================`);
});

server.on('error', (error) => {
  // Express 4 emits listen errors here.
  handleStartupError(error);
});

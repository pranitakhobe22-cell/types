require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const sequelize = require('./src/config/database');
const interviewRoutes = require('./src/routes/interviewRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.use('/api/interviews', interviewRoutes);

// Database Sync & Server Start
console.log("⏳ Synchronizing Database...");
sequelize.sync({ alter: true })
  .then(() => {
    console.log('✅ Database synchronized successfully.');
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 API Server running on http://localhost:${PORT}`);
      console.log(`📝 Documentation: http://localhost:${PORT}/api/docs (if available)`);
    });
  })
  .catch(err => {
    console.error('❌ Database synchronization failed:', err.message);
    process.exit(1);
  });

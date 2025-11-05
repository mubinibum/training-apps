const express = require('express')
const app = express()
const path = require('path')
require('dotenv').config();

app.disable('x-powered-by')

// Import Middleware
const logger = require('./middleware/logger')
app.use(logger)

// Dashboard
app.use('/', express.static(path.join(__dirname, 'public')));


// Export app SEBELUM listen
module.exports = app;

// Only start server when run directly (not during testing)
if (require.main === module) {
  const PORT = process.env.APP_PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Example app listening on port ${PORT}`);
  });
}
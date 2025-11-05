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

app.listen(process.env.APP_PORT, () => {
  console.log(`Example app listening on port ${process.env.APP_PORT}`)
})

module.exports = app
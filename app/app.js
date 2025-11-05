// app.js
const express = require('express');
const app = express();

// ... middleware dan routes lainnya ...

// Export app SEBELUM listen
module.exports = app;

// Hanya listen jika file dijalankan langsung (bukan saat testing)
if (require.main === module) {
  const PORT = process.env.APP_PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Example app listening on port ${PORT}`);
  });
}
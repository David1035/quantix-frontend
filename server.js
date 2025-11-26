// server.js
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// 1. Sirve todos los archivos estáticos de la carpeta actual (CSS, JS, imágenes, etc.)
app.use(express.static(__dirname));


app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Frontend corriendo en http://localhost:${PORT}`);
});
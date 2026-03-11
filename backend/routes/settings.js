const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

const { readDB, writeDB } = require('../database/db');
const { authMiddleware } = require('./auth');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads')),
  filename: (req, file, cb) => cb(null, 'logo-' + crypto.randomUUID() + path.extname(file.originalname))
});
const upload = multer({ storage });

router.get('/', (req, res) => {
  const db = readDB();
  res.json(db.settings);
});

router.put('/', authMiddleware, upload.single('logo'), (req, res) => {
  const db = readDB();
  const updates = { ...req.body };
  if (updates.minOrder) updates.minOrder = parseFloat(updates.minOrder);
  if (updates.deliveryFee) updates.deliveryFee = parseFloat(updates.deliveryFee);
  if (req.file) updates.logo = `/uploads/${req.file.filename}`;
  db.settings = { ...db.settings, ...updates };
  writeDB(db);
  res.json(db.settings);
});

module.exports = router;

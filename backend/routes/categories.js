const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { readDB, writeDB } = require('../database/db');
const { authMiddleware } = require('./auth');

router.get('/', (req, res) => {
  const db = readDB();
  res.json(db.categories.sort((a, b) => a.order - b.order));
});

router.post('/', authMiddleware, (req, res) => {
  const db = readDB();
  const { name, icon } = req.body;
  const cat = { id: uuidv4(), name, icon: icon || '🍽️', order: db.categories.length + 1 };
  db.categories.push(cat);
  writeDB(db);
  res.status(201).json(cat);
});

router.put('/:id', authMiddleware, (req, res) => {
  const db = readDB();
  const idx = db.categories.findIndex(c => c.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Categoria não encontrada' });
  db.categories[idx] = { ...db.categories[idx], ...req.body };
  writeDB(db);
  res.json(db.categories[idx]);
});

router.delete('/:id', authMiddleware, (req, res) => {
  const db = readDB();
  const idx = db.categories.findIndex(c => c.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Categoria não encontrada' });
  db.categories.splice(idx, 1);
  writeDB(db);
  res.json({ message: 'Categoria removida' });
});

module.exports = router;

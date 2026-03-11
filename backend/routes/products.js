const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

const { readDB, writeDB } = require('../database/db');
const { authMiddleware } = require('./auth');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads')),
  filename: (req, file, cb) => cb(null, crypto.randomUUID() + path.extname(file.originalname))
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// Get all products (public)
router.get('/', (req, res) => {
  const db = readDB();
  const { category } = req.query;
  let products = db.products.filter(p => p.available);
  if (category) products = products.filter(p => p.categoryId === category);
  res.json(products);
});

// Get all products for admin
router.get('/all', authMiddleware, (req, res) => {
  const db = readDB();
  res.json(db.products);
});

// Get single product
router.get('/:id', (req, res) => {
  const db = readDB();
  const product = db.products.find(p => p.id === req.params.id);
  if (!product) return res.status(404).json({ error: 'Produto não encontrado' });
  res.json(product);
});

// Create product
router.post('/', authMiddleware, upload.single('image'), (req, res) => {
  const db = readDB();
  const { name, description, price, categoryId, available, options, extras } = req.body;

  const product = {
    id: crypto.randomUUID(),
    name,
    description,
    price: parseFloat(price),
    categoryId,
    available: available !== 'false',
    image: req.file ? `/uploads/${req.file.filename}` : null,
    options: options ? JSON.parse(options) : [],
    extras: extras ? JSON.parse(extras) : []
  };

  db.products.push(product);
  writeDB(db);
  res.status(201).json(product);
});

// Update product
router.put('/:id', authMiddleware, upload.single('image'), (req, res) => {
  const db = readDB();
  const idx = db.products.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Produto não encontrado' });

  const { name, description, price, categoryId, available, options, extras } = req.body;
  const existing = db.products[idx];

  db.products[idx] = {
    ...existing,
    name: name || existing.name,
    description: description !== undefined ? description : existing.description,
    price: price !== undefined ? parseFloat(price) : existing.price,
    categoryId: categoryId || existing.categoryId,
    available: available !== undefined ? available !== 'false' : existing.available,
    image: req.file ? `/uploads/${req.file.filename}` : existing.image,
    options: options ? JSON.parse(options) : existing.options,
    extras: extras ? JSON.parse(extras) : existing.extras
  };

  writeDB(db);
  res.json(db.products[idx]);
});

// Delete product
router.delete('/:id', authMiddleware, (req, res) => {
  const db = readDB();
  const idx = db.products.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Produto não encontrado' });
  db.products.splice(idx, 1);
  writeDB(db);
  res.json({ message: 'Produto removido' });
});

module.exports = router;

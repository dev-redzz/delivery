const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { pool } = require('../database/db');
const { authMiddleware } = require('./auth');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads')),
  filename: (req, file, cb) => cb(null, crypto.randomUUID() + path.extname(file.originalname))
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// Public: available products
router.get('/', async (req, res) => {
  try {
    const { category } = req.query;
    let query = 'SELECT p.*, c.name as category_name, c.icon as category_icon FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.available = true';
    const params = [];
    if (category) { query += ' AND p.category_id = $1'; params.push(category); }
    query += ' ORDER BY p.created_at';
    const result = await pool.query(query, params);
    res.json(result.rows.map(formatProduct));
  } catch (e) { console.error(e); res.status(500).json({ error: 'Erro interno' }); }
});

// Admin: all products
router.get('/all', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id ORDER BY p.created_at');
    res.json(result.rows.map(formatProduct));
  } catch (e) { res.status(500).json({ error: 'Erro interno' }); }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM products WHERE id = $1', [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Produto não encontrado' });
    res.json(formatProduct(result.rows[0]));
  } catch (e) { res.status(500).json({ error: 'Erro interno' }); }
});

router.post('/', authMiddleware, upload.single('image'), async (req, res) => {
  const { name, description, price, categoryId, available, options, extras } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO products (name, description, price, category_id, available, image, options, extras) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *',
      [name, description, parseFloat(price), categoryId || null, available !== 'false',
       req.file ? `/uploads/${req.file.filename}` : null,
       options || '[]', extras || '[]']
    );
    res.status(201).json(formatProduct(result.rows[0]));
  } catch (e) { console.error(e); res.status(500).json({ error: 'Erro interno' }); }
});

router.put('/:id', authMiddleware, upload.single('image'), async (req, res) => {
  const { name, description, price, categoryId, available, options, extras } = req.body;
  try {
    const existing = await pool.query('SELECT * FROM products WHERE id = $1', [req.params.id]);
    if (!existing.rows[0]) return res.status(404).json({ error: 'Produto não encontrado' });
    const p = existing.rows[0];
    const result = await pool.query(
      `UPDATE products SET
        name = $1, description = $2, price = $3, category_id = $4,
        available = $5, image = $6, options = $7, extras = $8
       WHERE id = $9 RETURNING *`,
      [
        name || p.name,
        description !== undefined ? description : p.description,
        price !== undefined ? parseFloat(price) : p.price,
        categoryId || p.category_id,
        available !== undefined ? available !== 'false' : p.available,
        req.file ? `/uploads/${req.file.filename}` : p.image,
        options || JSON.stringify(p.options),
        extras || JSON.stringify(p.extras),
        req.params.id
      ]
    );
    res.json(formatProduct(result.rows[0]));
  } catch (e) { console.error(e); res.status(500).json({ error: 'Erro interno' }); }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM products WHERE id = $1 RETURNING id', [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Produto não encontrado' });
    res.json({ message: 'Produto removido' });
  } catch (e) { res.status(500).json({ error: 'Erro interno' }); }
});

function formatProduct(p) {
  return {
    id: p.id,
    name: p.name,
    description: p.description,
    price: parseFloat(p.price),
    categoryId: p.category_id,
    categoryName: p.category_name,
    categoryIcon: p.category_icon,
    image: p.image,
    available: p.available,
    options: typeof p.options === 'string' ? JSON.parse(p.options) : p.options,
    extras: typeof p.extras === 'string' ? JSON.parse(p.extras) : p.extras,
  };
}

module.exports = router;

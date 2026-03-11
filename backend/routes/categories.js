const express = require('express');
const router = express.Router();
const { pool } = require('../database/db');
const { authMiddleware } = require('./auth');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM categories ORDER BY "order"');
    res.json(result.rows);
  } catch (e) { res.status(500).json({ error: 'Erro interno' }); }
});

router.post('/', authMiddleware, async (req, res) => {
  const { name, icon } = req.body;
  try {
    const count = await pool.query('SELECT COUNT(*) FROM categories');
    const result = await pool.query(
      'INSERT INTO categories (name, icon, "order") VALUES ($1, $2, $3) RETURNING *',
      [name, icon || '🍽️', parseInt(count.rows[0].count) + 1]
    );
    res.status(201).json(result.rows[0]);
  } catch (e) { res.status(500).json({ error: 'Erro interno' }); }
});

router.put('/:id', authMiddleware, async (req, res) => {
  const { name, icon } = req.body;
  try {
    const result = await pool.query(
      'UPDATE categories SET name = COALESCE($1, name), icon = COALESCE($2, icon) WHERE id = $3 RETURNING *',
      [name, icon, req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Categoria não encontrada' });
    res.json(result.rows[0]);
  } catch (e) { res.status(500).json({ error: 'Erro interno' }); }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM categories WHERE id = $1 RETURNING id', [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Categoria não encontrada' });
    res.json({ message: 'Categoria removida' });
  } catch (e) { res.status(500).json({ error: 'Erro interno' }); }
});

module.exports = router;

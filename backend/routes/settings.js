const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { pool } = require('../database/db');
const { authMiddleware } = require('./auth');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads')),
  filename: (req, file, cb) => cb(null, 'logo-' + crypto.randomUUID() + path.extname(file.originalname))
});
const upload = multer({ storage });

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM settings WHERE id = 1');
    const s = result.rows[0] || {};
    res.json({
      name: s.name, phone: s.phone, address: s.address,
      logo: s.logo, logoLink: s.logo_link,
      openHours: s.open_hours, minOrder: parseFloat(s.min_order || 0),
      deliveryFee: parseFloat(s.delivery_fee || 0)
    });
  } catch (e) { res.status(500).json({ error: 'Erro interno' }); }
});

router.put('/', authMiddleware, upload.single('logo'), async (req, res) => {
  const { name, phone, address, openHours, deliveryFee, minOrder, logoLink } = req.body;
  try {
    const logo = req.file ? `/uploads/${req.file.filename}` : null;
    const result = await pool.query(`
      UPDATE settings SET
        name = COALESCE($1, name),
        phone = COALESCE($2, phone),
        address = COALESCE($3, address),
        open_hours = COALESCE($4, open_hours),
        delivery_fee = COALESCE($5, delivery_fee),
        min_order = COALESCE($6, min_order),
        logo_link = COALESCE($7, logo_link),
        logo = COALESCE($8, logo)
      WHERE id = 1 RETURNING *`,
      [name||null, phone||null, address||null, openHours||null,
       deliveryFee ? parseFloat(deliveryFee) : null,
       minOrder ? parseFloat(minOrder) : null,
       logoLink !== undefined ? logoLink : null, logo]
    );
    const s = result.rows[0];
    res.json({
      name: s.name, phone: s.phone, address: s.address,
      logo: s.logo, logoLink: s.logo_link,
      openHours: s.open_hours, minOrder: parseFloat(s.min_order),
      deliveryFee: parseFloat(s.delivery_fee)
    });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Erro interno' }); }
});

module.exports = router;

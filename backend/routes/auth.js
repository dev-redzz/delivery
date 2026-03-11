const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { readDB, writeDB } = require('../database/db');

const JWT_SECRET = process.env.JWT_SECRET || 'lanchonete_secret_2024';

// Login
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  const db = readDB();
  const user = db.users.find(u => u.email === email);
  if (!user) return res.status(401).json({ error: 'Credenciais inválidas' });

  const valid = bcrypt.compareSync(password, user.password);
  if (!valid) return res.status(401).json({ error: 'Credenciais inválidas' });

  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });
  res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
});

// Change password
router.put('/password', authMiddleware, (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const db = readDB();
  const user = db.users.find(u => u.id === req.userId);
  if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });

  const valid = bcrypt.compareSync(currentPassword, user.password);
  if (!valid) return res.status(401).json({ error: 'Senha atual incorreta' });

  user.password = bcrypt.hashSync(newPassword, 10);
  writeDB(db);
  res.json({ message: 'Senha alterada com sucesso' });
});

// Verify token
router.get('/verify', authMiddleware, (req, res) => {
  res.json({ valid: true });
});

function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Token não fornecido' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch (e) {
    res.status(401).json({ error: 'Token inválido' });
  }
}

module.exports = router;
module.exports.authMiddleware = authMiddleware;

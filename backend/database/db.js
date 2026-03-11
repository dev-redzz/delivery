const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function initDB() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS categories (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL,
        icon VARCHAR(10) DEFAULT '🍽️',
        "order" INTEGER DEFAULT 0
      );
      CREATE TABLE IF NOT EXISTS products (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(150) NOT NULL,
        description TEXT,
        price NUMERIC(10,2) NOT NULL,
        category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
        image VARCHAR(300),
        available BOOLEAN DEFAULT true,
        options JSONB DEFAULT '[]',
        extras JSONB DEFAULT '[]',
        created_at TIMESTAMP DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY DEFAULT 1,
        name VARCHAR(100) DEFAULT 'Burguer House',
        phone VARCHAR(20) DEFAULT '5511999999999',
        address TEXT DEFAULT '',
        logo VARCHAR(300),
        logo_link VARCHAR(300) DEFAULT '',
        open_hours VARCHAR(50) DEFAULT '18:00 - 23:00',
        min_order NUMERIC(10,2) DEFAULT 20.00,
        delivery_fee NUMERIC(10,2) DEFAULT 5.00
      );
    `);

    const existing = await client.query("SELECT id FROM users WHERE email = 'admin@lanchonete.com'");
    if (existing.rows.length === 0) {
      const hash = await bcrypt.hash('admin123', 10);
      await client.query("INSERT INTO users (name,email,password) VALUES ($1,$2,$3)", ['Administrador','admin@lanchonete.com',hash]);
      console.log('✅ Usuário admin criado');
    }

    await client.query("INSERT INTO settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING");

    const catCount = await client.query("SELECT COUNT(*) FROM categories");
    if (parseInt(catCount.rows[0].count) === 0) {
      for (const [name,icon,order] of [['Hambúrguer','🍔',1],['Batata Frita','🍟',2],['Pastéis','🥟',3],['Mistos','🥪',4],['Bebidas','🥤',5],['Combos','🎁',6]]) {
        await client.query('INSERT INTO categories (name,icon,"order") VALUES ($1,$2,$3)', [name,icon,order]);
      }
      console.log('✅ Categorias criadas');
    }

    const prodCount = await client.query("SELECT COUNT(*) FROM products");
    if (parseInt(prodCount.rows[0].count) === 0) {
      const catRows = await client.query('SELECT id, name FROM categories ORDER BY "order"');
      const catMap = {};
      catRows.rows.forEach(r => { catMap[r.name] = r.id; });
      const prods = [
        ['X-Burguer Clássico','Hambúrguer artesanal 180g, queijo cheddar, alface, tomate e molho especial',25.90,'Hambúrguer','[{"id":"opt1","name":"Ponto da Carne","type":"radio","required":true,"choices":[{"id":"c1","label":"Mal passado","price":0},{"id":"c2","label":"Ao ponto","price":0},{"id":"c3","label":"Bem passado","price":0}]}]','[{"id":"e1","label":"Carne extra","price":8},{"id":"e2","label":"Queijo extra","price":3},{"id":"e3","label":"Bacon","price":4},{"id":"e4","label":"Ovo frito","price":2.5}]'],
        ['X-Bacon Supreme','Hambúrguer duplo 360g, bacon crocante, cheddar, cebola caramelizada',38.90,'Hambúrguer','[]','[{"id":"e1","label":"Carne extra","price":8},{"id":"e2","label":"Bacon extra","price":4},{"id":"e3","label":"Queijo extra","price":3}]'],
        ['Batata Frita','Porção generosa de batatas fritas crocantes',15.90,'Batata Frita','[{"id":"opt2","name":"Tipo","type":"radio","required":true,"choices":[{"id":"c4","label":"Simples","price":0},{"id":"c5","label":"Com Cheddar","price":3},{"id":"c6","label":"Cheddar + Bacon","price":6}]}]','[]'],
        ['Pastel de Carne','Pastel crocante recheado com carne moída temperada',12.00,'Pastéis','[]','[{"id":"e5","label":"Queijo extra","price":2}]'],
        ['Misto Quente','Pão de forma, presunto e queijo grelhados na chapa',10.00,'Mistos','[]','[{"id":"e6","label":"Presunto extra","price":2},{"id":"e7","label":"Queijo extra","price":2}]'],
        ['Refrigerante Lata','Coca-Cola, Guaraná, Fanta ou Sprite 350ml',6.00,'Bebidas','[{"id":"opt3","name":"Sabor","type":"radio","required":true,"choices":[{"id":"c7","label":"Coca-Cola","price":0},{"id":"c8","label":"Guaraná","price":0},{"id":"c9","label":"Fanta Laranja","price":0},{"id":"c10","label":"Sprite","price":0}]}]','[]'],
        ['Combo Família','2 X-Burguer + 2 Batatas + 2 Refris',79.90,'Combos','[]','[]']
      ];
      for (const [name,desc,price,catName,options,extras] of prods) {
        await client.query('INSERT INTO products (name,description,price,category_id,options,extras) VALUES ($1,$2,$3,$4,$5,$6)',
          [name, desc, price, catMap[catName]||null, options, extras]);
      }
      console.log('✅ Produtos criados');
    }

    console.log('✅ Banco PostgreSQL pronto');
  } finally {
    client.release();
  }
}

module.exports = { pool, initDB };

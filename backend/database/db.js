const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_PATH = path.join(__dirname, 'data.json');

const defaultData = {
  users: [],
  categories: [
    { id: '1', name: 'Hambúrguer', icon: '🍔', order: 1 },
    { id: '2', name: 'Batata Frita', icon: '🍟', order: 2 },
    { id: '3', name: 'Pastéis', icon: '🥟', order: 3 },
    { id: '4', name: 'Mistos', icon: '🥪', order: 4 },
    { id: '5', name: 'Bebidas', icon: '🥤', order: 5 },
    { id: '6', name: 'Combos', icon: '🎁', order: 6 }
  ],
  products: [
    {
      id: '1',
      name: 'X-Burguer Clássico',
      description: 'Hambúrguer artesanal 180g, queijo cheddar, alface, tomate e molho especial',
      price: 25.90,
      categoryId: '1',
      image: null,
      available: true,
      options: [
        { id: 'opt1', name: 'Ponto da Carne', type: 'radio', required: true, choices: [
          { id: 'c1', label: 'Mal passado', price: 0 },
          { id: 'c2', label: 'Ao ponto', price: 0 },
          { id: 'c3', label: 'Bem passado', price: 0 }
        ]}
      ],
      extras: [
        { id: 'e1', label: 'Carne extra', price: 8.00 },
        { id: 'e2', label: 'Queijo extra', price: 3.00 },
        { id: 'e3', label: 'Bacon', price: 4.00 },
        { id: 'e4', label: 'Ovo frito', price: 2.50 }
      ]
    },
    {
      id: '2',
      name: 'X-Bacon Supreme',
      description: 'Hambúrguer duplo 360g, bacon crocante, cheddar, cebola caramelizada',
      price: 38.90,
      categoryId: '1',
      image: null,
      available: true,
      options: [],
      extras: [
        { id: 'e1', label: 'Carne extra', price: 8.00 },
        { id: 'e2', label: 'Bacon extra', price: 4.00 },
        { id: 'e3', label: 'Queijo extra', price: 3.00 }
      ]
    },
    {
      id: '3',
      name: 'Batata Frita',
      description: 'Porção generosa de batatas fritas crocantes',
      price: 15.90,
      categoryId: '2',
      image: null,
      available: true,
      options: [
        { id: 'opt2', name: 'Tipo', type: 'radio', required: true, choices: [
          { id: 'c4', label: 'Simples', price: 0 },
          { id: 'c5', label: 'Com Cheddar', price: 3.00 },
          { id: 'c6', label: 'Cheddar + Bacon', price: 6.00 }
        ]}
      ],
      extras: []
    },
    {
      id: '4',
      name: 'Pastel de Carne',
      description: 'Pastel crocante recheado com carne moída temperada',
      price: 12.00,
      categoryId: '3',
      image: null,
      available: true,
      options: [],
      extras: [
        { id: 'e5', label: 'Queijo extra', price: 2.00 }
      ]
    },
    {
      id: '5',
      name: 'Misto Quente',
      description: 'Pão de forma, presunto e queijo grelhados na chapa',
      price: 10.00,
      categoryId: '4',
      image: null,
      available: true,
      options: [],
      extras: [
        { id: 'e6', label: 'Presunto extra', price: 2.00 },
        { id: 'e7', label: 'Queijo extra', price: 2.00 }
      ]
    },
    {
      id: '6',
      name: 'Refrigerante Lata',
      description: 'Coca-Cola, Guaraná, Fanta ou Sprite 350ml',
      price: 6.00,
      categoryId: '5',
      image: null,
      available: true,
      options: [
        { id: 'opt3', name: 'Sabor', type: 'radio', required: true, choices: [
          { id: 'c7', label: 'Coca-Cola', price: 0 },
          { id: 'c8', label: 'Guaraná', price: 0 },
          { id: 'c9', label: 'Fanta Laranja', price: 0 },
          { id: 'c10', label: 'Sprite', price: 0 }
        ]}
      ],
      extras: []
    },
    {
      id: '7',
      name: 'Combo Família',
      description: '2 X-Burguer + 2 Batatas + 2 Refris',
      price: 79.90,
      categoryId: '6',
      image: null,
      available: true,
      options: [],
      extras: []
    }
  ],
  settings: {
    name: 'Burguer House',
    phone: '5511999999999',
    address: 'Rua das Delícias, 123',
    logo: null,
    logoLink: '',
    openHours: '18:00 - 23:00',
    minOrder: 20.00,
    deliveryFee: 5.00
  }
};

function initDB() {
  if (!fs.existsSync(DB_PATH)) {
    // Create admin user with hashed password
    const hashedPassword = bcrypt.hashSync('admin123', 10);
    defaultData.users.push({
      id: '1',
      email: 'admin@lanchonete.com',
      password: hashedPassword,
      name: 'Administrador'
    });
    fs.writeFileSync(DB_PATH, JSON.stringify(defaultData, null, 2));
    console.log('✅ Banco de dados criado com dados padrão');
  }
}

function readDB() {
  try {
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
  } catch (e) {
    return defaultData;
  }
}

function writeDB(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

module.exports = { initDB, readDB, writeDB };

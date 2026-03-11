# 🍔 Burguer House - Sistema de Delivery

Sistema completo de delivery com cardápio digital, carrinho de compras e painel administrativo. Pedidos são enviados diretamente para o WhatsApp da lanchonete.

---

## 📁 Estrutura do Projeto

```
delivery/
├── frontend/
│   ├── index.html        ← Site principal do delivery
│   ├── style.css         ← Estilos (estilo iFood)
│   ├── script.js         ← Lógica do cardápio e carrinho
│   └── images/           ← Imagens estáticas
│
├── backend/
│   ├── server.js         ← Servidor Express (entry point)
│   ├── database/
│   │   ├── db.js         ← Gerenciamento do banco de dados
│   │   └── data.json     ← Banco de dados JSON (gerado automaticamente)
│   ├── routes/
│   │   ├── auth.js       ← Autenticação (login, JWT)
│   │   ├── products.js   ← CRUD de produtos
│   │   ├── categories.js ← CRUD de categorias
│   │   └── settings.js   ← Configurações da lanchonete
│   └── uploads/          ← Imagens enviadas via upload
│
└── admin/
    ├── login.html        ← Página de login do painel admin
    ├── dashboard.html    ← Painel administrativo
    ├── admin.css         ← Estilos do painel
    └── admin.js          ← Lógica do painel admin
```

---

## 🚀 Como Rodar

### Pré-requisitos
- **Node.js** 18+ instalado → [nodejs.org](https://nodejs.org)

### Passos

```bash
# 1. Entre na pasta do backend
cd delivery/backend

# 2. Instale as dependências (só na primeira vez)
npm install

# 3. Inicie o servidor
node server.js
```

### Acessos
| Página         | URL                                      |
|----------------|------------------------------------------|
| 🍔 Site         | http://localhost:3000                    |
| 🔧 Admin       | http://localhost:3000/admin/login.html   |

### Login Padrão
```
Email: admin@lanchonete.com
Senha: admin123
```

---

## ⚙️ Configuração Inicial

1. Acesse o **painel admin** → **Configurações**
2. Configure:
   - **Nome** da lanchonete
   - **WhatsApp** (formato: `5511999999999` — DDI + DDD + número, sem espaços ou símbolos)
   - **Taxa de entrega** e **pedido mínimo**
   - **Logo** (upload de imagem)
   - **Link da logo** (URL opcional — ex: Instagram da lanchonete)

---

## 📱 Funcionalidades

### Frontend (Site do Cliente)
- ✅ Cardápio digital por categorias
- ✅ Filtro de categorias (scroll horizontal)
- ✅ Modal de produto com opções e extras
- ✅ Campo de observações por item (ex: "sem cebola")
- ✅ Carrinho lateral com controle de quantidade
- ✅ Finalização com endereço e forma de pagamento
- ✅ Envio do pedido formatado para WhatsApp
- ✅ Design responsivo (mobile, tablet, desktop)
- ✅ Animações suaves e notificações toast

### Painel Admin
- ✅ Login seguro com JWT
- ✅ Cadastro/edição/exclusão de produtos
- ✅ Upload de foto do produto
- ✅ Opções do produto (ex: ponto da carne — obrigatório)
- ✅ Extras com preço adicional (ex: +Bacon R$4,00)
- ✅ Cadastro de categorias com emoji
- ✅ Configurações gerais (nome, WhatsApp, logo, taxas)

---

## 💬 Formato da Mensagem WhatsApp

```
🍔 NOVO PEDIDO

📍 Endereço
Rua: Av. Paulista
Número: 1000
Bairro: Bela Vista

🛒 Pedido:

1x X-Burguer Clássico
   • Ao ponto
   + Bacon
   📝 sem cebola

1x Batata Frita
   • Com Cheddar

💰 Total: R$ 49,80
_(Subtotal: R$ 44,80 + Entrega: R$ 5,00)_

💳 Pagamento:
PIX
```

---

## 🛠️ Tecnologias

| Camada     | Tecnologia                           |
|------------|--------------------------------------|
| Frontend   | HTML5, CSS3, JavaScript puro         |
| Backend    | Node.js + Express                    |
| Banco      | JSON file (lowdb-style, sem deps)    |
| Auth       | JWT + bcrypt                         |
| Upload     | Multer                               |
| Design     | Google Fonts (Bebas Neue + Nunito)   |

---

## 🌐 Deploy

### Opção 1: Railway (recomendado — gratuito)
1. Crie conta em [railway.app](https://railway.app)
2. Conecte seu repositório GitHub
3. Configure variável de ambiente: `PORT=3000`
4. Deploy automático!

### Opção 2: Render
1. Crie conta em [render.com](https://render.com)
2. Novo serviço → Web Service
3. Root directory: `backend`
4. Start command: `node server.js`

### Opção 3: VPS (DigitalOcean, Linode)
```bash
# Instale pm2 para manter o servidor rodando
npm install -g pm2
cd delivery/backend
pm2 start server.js --name burguer-house
pm2 startup
pm2 save
```

---

## 🔒 Segurança

- Senhas criptografadas com bcrypt (salt 10)
- Autenticação via JWT com expiração de 24h
- Rotas admin protegidas por middleware de autenticação
- Uploads limitados a 5MB

---

## 📞 Suporte

Para alterar o número do WhatsApp, acesse:
**Admin → Configurações → WhatsApp**

O formato correto é apenas números: `5511999999999`
- `55` = Brasil
- `11` = DDD
- `999999999` = número (com 9 na frente para celular)

const API = '/api';  // Funciona tanto local quanto no Railway
let settings = {};
let categories = [];
let products = [];
let cart = [];
let currentProduct = null;
let modalQty = 1;

// ===== INIT =====
window.addEventListener('DOMContentLoaded', async () => {
  await loadAll();
  setTimeout(() => {
    document.getElementById('loader').classList.add('hidden');
  }, 1500);

  // Payment change field toggle
  document.querySelectorAll('input[name="payment"]').forEach(r => {
    r.addEventListener('change', () => {
      document.getElementById('changeField').style.display =
        r.value === 'Dinheiro' && r.checked ? 'block' : 'none';
    });
  });
});

async function loadAll() {
  try {
    [settings, categories, products] = await Promise.all([
      fetch(`${API}/settings`).then(r => r.json()),
      fetch(`${API}/categories`).then(r => r.json()),
      fetch(`${API}/products`).then(r => r.json())
    ]);
    applySettings();
    renderCategories();
    renderProducts();
  } catch (e) {
    console.error('Erro ao carregar dados:', e);
  }
}

function applySettings() {
  document.getElementById('storeName').textContent = settings.name || 'Burguer House';
  document.title = (settings.name || 'Burguer House') + ' - Delivery';

  const logoImg = document.getElementById('logoImg');
  const logoEmoji = document.getElementById('logoEmoji');
  const logoLink = document.getElementById('logoLink');

  if (settings.logo) {
    logoImg.src = `${settings.logo}`;
    logoImg.style.display = 'block';
    logoEmoji.style.display = 'none';
  }
  if (settings.logoLink) {
    logoLink.href = settings.logoLink;
  }

  document.getElementById('heroDeliveryFee').textContent =
    `🚀 Taxa: R$ ${(settings.deliveryFee || 0).toFixed(2).replace('.', ',')}`;
  document.getElementById('cartDelivery').textContent =
    `R$ ${(settings.deliveryFee || 0).toFixed(2).replace('.', ',')}`;
}

// ===== CATEGORIES =====
function renderCategories() {
  const bar = document.getElementById('categoriesBar');
  bar.innerHTML = `<button class="cat-btn active" onclick="filterCategory('all', this)">
    <span class="cat-icon">🍽️</span> Todos
  </button>`;
  categories.forEach(cat => {
    bar.innerHTML += `<button class="cat-btn" onclick="filterCategory('${cat.id}', this)">
      <span class="cat-icon">${cat.icon}</span> ${cat.name}
    </button>`;
  });
}

function filterCategory(id, btn) {
  document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  if (id === 'all') {
    document.querySelectorAll('.category-section').forEach(s => s.style.display = '');
  } else {
    document.querySelectorAll('.category-section').forEach(s => {
      s.style.display = s.dataset.catId === id ? '' : 'none';
    });
    // Scroll to section
    const section = document.querySelector(`.category-section[data-cat-id="${id}"]`);
    if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

// ===== PRODUCTS =====
function renderProducts() {
  const container = document.getElementById('productsContainer');
  container.innerHTML = '';

  const availableProducts = products.filter(p => p.available !== false);

  categories.forEach(cat => {
    const catProducts = availableProducts.filter(p => p.categoryId === cat.id);
    if (!catProducts.length) return;

    const section = document.createElement('div');
    section.className = 'category-section';
    section.dataset.catId = cat.id;

    section.innerHTML = `
      <h2 class="category-title">${cat.icon} ${cat.name}</h2>
      <div class="products-grid" id="grid-${cat.id}"></div>
    `;
    container.appendChild(section);

    const grid = section.querySelector(`#grid-${cat.id}`);
    catProducts.forEach(product => {
      grid.appendChild(createProductCard(product));
    });
  });
}

function createProductCard(product) {
  const card = document.createElement('div');
  card.className = 'product-card';

  const imgHtml = product.image
    ? `<img src="${product.image}" alt="${product.name}" loading="lazy">`
    : `<div class="product-emoji-fallback">${getCategoryEmoji(product.categoryId)}</div>`;

  card.innerHTML = `
    <div class="product-img-wrap">
      ${imgHtml}
      ${!product.available ? '<span class="unavailable-tag">Indisponível</span>' : ''}
    </div>
    <div class="product-body">
      <div class="product-name">${product.name}</div>
      <div class="product-desc">${product.description || ''}</div>
      <div class="product-footer">
        <span class="product-price">R$ ${product.price.toFixed(2).replace('.', ',')}</span>
        <button class="btn-add" onclick="openProductModal('${product.id}')" ${!product.available ? 'disabled' : ''}>
          + Adicionar
        </button>
      </div>
    </div>
  `;
  card.addEventListener('click', (e) => {
    if (!e.target.closest('.btn-add') && product.available) openProductModal(product.id);
  });
  return card;
}

function getCategoryEmoji(catId) {
  const cat = categories.find(c => c.id === catId);
  return cat ? cat.icon : '🍽️';
}

// ===== PRODUCT MODAL =====
function openProductModal(productId) {
  currentProduct = products.find(p => p.id === productId);
  if (!currentProduct) return;

  modalQty = 1;
  const modal = document.getElementById('productModal');
  const content = document.getElementById('modalContent');

  const imgHtml = currentProduct.image
    ? `<img src="${currentProduct.image}" alt="${currentProduct.name}" class="modal-product-img">`
    : `<div class="modal-product-emoji">${getCategoryEmoji(currentProduct.categoryId)}</div>`;

  let optionsHtml = '';
  if (currentProduct.options && currentProduct.options.length) {
    currentProduct.options.forEach(opt => {
      optionsHtml += `
        <div class="option-group">
          <div class="option-title">
            ${opt.name}
            ${opt.required ? '<span class="required-tag">Obrigatório</span>' : ''}
          </div>
          <div class="option-choices">
            ${opt.choices.map((c, i) => `
              <div class="option-choice ${i === 0 && opt.required ? 'selected' : ''}" onclick="selectOption(this, '${opt.id}', '${c.id}')">
                <label>
                  <input type="radio" name="opt_${opt.id}" value="${c.id}" ${i === 0 && opt.required ? 'checked' : ''} style="display:none">
                  <span>${c.label}</span>
                  <span class="option-price ${c.price === 0 ? 'free' : ''}">${c.price > 0 ? '+R$ ' + c.price.toFixed(2).replace('.', ',') : 'Incluso'}</span>
                </label>
              </div>
            `).join('')}
          </div>
        </div>`;
    });
  }

  let extrasHtml = '';
  if (currentProduct.extras && currentProduct.extras.length) {
    extrasHtml = `
      <div class="option-group">
        <div class="option-title">Extras</div>
        <div class="extras-list">
          ${currentProduct.extras.map(e => `
            <div class="extra-item" onclick="toggleExtra(this, '${e.id}', ${e.price})">
              <label>
                <input type="checkbox" value="${e.id}" style="display:none">
                <span>${e.label}</span>
                <span class="extra-price">+R$ ${e.price.toFixed(2).replace('.', ',')}</span>
              </label>
            </div>
          `).join('')}
        </div>
      </div>`;
  }

  content.innerHTML = `
    ${imgHtml}
    <div class="modal-product-name">${currentProduct.name}</div>
    <div class="modal-product-desc">${currentProduct.description || ''}</div>
    <div class="modal-product-price">R$ ${currentProduct.price.toFixed(2).replace('.', ',')}</div>
    ${optionsHtml}
    ${extrasHtml}
    <div class="obs-group">
      <label>🗒️ Observações / Retirar ingrediente</label>
      <textarea id="itemObs" rows="2" placeholder="Ex: sem cebola, sem tomate..."></textarea>
    </div>
    <div class="modal-footer">
      <div class="qty-control-modal">
        <button class="qty-btn-modal" onclick="changeModalQty(-1)">−</button>
        <span class="qty-num-modal" id="modalQtyNum">1</span>
        <button class="qty-btn-modal" onclick="changeModalQty(1)">+</button>
      </div>
      <button class="btn-add-cart" onclick="addToCart()">
        <span>Adicionar ao carrinho</span>
        <span class="btn-price" id="modalBtnPrice">R$ ${currentProduct.price.toFixed(2).replace('.', ',')}</span>
      </button>
    </div>
  `;

  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
  updateModalPrice();
}

function closeModal() {
  document.getElementById('productModal').classList.remove('open');
  document.body.style.overflow = '';
  currentProduct = null;
}

function selectOption(el, optId, choiceId) {
  el.closest('.option-choices').querySelectorAll('.option-choice').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
  el.querySelector('input').checked = true;
  updateModalPrice();
}

function toggleExtra(el, extraId, price) {
  el.classList.toggle('selected');
  const cb = el.querySelector('input');
  cb.checked = !cb.checked;
  updateModalPrice();
}

function changeModalQty(delta) {
  modalQty = Math.max(1, modalQty + delta);
  document.getElementById('modalQtyNum').textContent = modalQty;
  updateModalPrice();
}

function updateModalPrice() {
  if (!currentProduct) return;
  let total = currentProduct.price;

  // Options price
  if (currentProduct.options) {
    currentProduct.options.forEach(opt => {
      const selected = document.querySelector(`input[name="opt_${opt.id}"]:checked`);
      if (selected) {
        const choice = opt.choices.find(c => c.id === selected.value);
        if (choice) total += choice.price;
      }
    });
  }

  // Extras price
  document.querySelectorAll('.extra-item.selected').forEach(el => {
    const cb = el.querySelector('input');
    const extra = currentProduct.extras.find(e => e.id === cb.value);
    if (extra) total += extra.price;
  });

  total *= modalQty;
  const btn = document.getElementById('modalBtnPrice');
  if (btn) btn.textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;
}

// ===== CART =====
function addToCart() {
  if (!currentProduct) return;

  let selectedOptions = [];
  let extras = [];
  let totalAdd = currentProduct.price;

  // Validate required options
  if (currentProduct.options) {
    for (const opt of currentProduct.options) {
      if (opt.required) {
        const selected = document.querySelector(`input[name="opt_${opt.id}"]:checked`);
        if (!selected) { showToast('⚠️ Selecione: ' + opt.name); return; }
        const choice = opt.choices.find(c => c.id === selected.value);
        if (choice) {
          selectedOptions.push({ name: opt.name, choice: choice.label, price: choice.price });
          totalAdd += choice.price;
        }
      } else {
        const selected = document.querySelector(`input[name="opt_${opt.id}"]:checked`);
        if (selected) {
          const choice = opt.choices.find(c => c.id === selected.value);
          if (choice) {
            selectedOptions.push({ name: opt.name, choice: choice.label, price: choice.price });
            totalAdd += choice.price;
          }
        }
      }
    }
  }

  // Extras
  document.querySelectorAll('.extra-item.selected').forEach(el => {
    const cb = el.querySelector('input');
    const extra = currentProduct.extras.find(e => e.id === cb.value);
    if (extra) {
      extras.push({ id: extra.id, label: extra.label, price: extra.price });
      totalAdd += extra.price;
    }
  });

  const obs = document.getElementById('itemObs')?.value || '';

  const cartItem = {
    id: Date.now().toString(),
    productId: currentProduct.id,
    name: currentProduct.name,
    price: totalAdd,
    basePrice: currentProduct.price,
    qty: modalQty,
    options: selectedOptions,
    extras,
    obs
  };

  cart.push(cartItem);
  updateCart();
  closeModal();
  showToast('✅ ' + currentProduct.name + ' adicionado!');
}

function removeFromCart(itemId) {
  cart = cart.filter(i => i.id !== itemId);
  updateCart();
}

function changeQty(itemId, delta) {
  const item = cart.find(i => i.id === itemId);
  if (!item) return;
  item.qty = Math.max(1, item.qty + delta);
  if (item.qty === 0) removeFromCart(itemId);
  else updateCart();
}

function updateCart() {
  const count = cart.reduce((s, i) => s + i.qty, 0);
  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const delivery = settings.deliveryFee || 0;
  const total = subtotal + delivery;

  document.getElementById('cartCount').textContent = count;
  document.getElementById('cartHeaderTotal').textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;
  document.getElementById('cartSubtotal').textContent = `R$ ${subtotal.toFixed(2).replace('.', ',')}`;
  document.getElementById('cartTotal').textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;
  document.getElementById('checkoutTotal').textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;

  const itemsDiv = document.getElementById('cartItems');
  const footer = document.getElementById('cartFooter');

  if (cart.length === 0) {
    itemsDiv.innerHTML = `<div class="cart-empty"><span>🛒</span><p>Seu carrinho está vazio</p><small>Adicione itens para começar</small></div>`;
    footer.style.display = 'none';
    return;
  }

  footer.style.display = 'block';
  itemsDiv.innerHTML = cart.map(item => {
    const details = [
      ...item.options.map(o => o.choice),
      ...item.extras.map(e => '+ ' + e.label),
      item.obs ? `📝 ${item.obs}` : ''
    ].filter(Boolean).join(' · ');

    return `
      <div class="cart-item">
        <div class="cart-item-info">
          <div class="cart-item-name">${item.name}</div>
          ${details ? `<div class="cart-item-details">${details}</div>` : ''}
          <div class="cart-item-price">R$ ${(item.price * item.qty).toFixed(2).replace('.', ',')}</div>
          <div class="qty-control">
            <button class="qty-btn" onclick="changeQty('${item.id}', -1)">−</button>
            <span class="qty-num">${item.qty}</span>
            <button class="qty-btn" onclick="changeQty('${item.id}', 1)">+</button>
          </div>
        </div>
        <button onclick="removeFromCart('${item.id}')" style="background:none;border:none;cursor:pointer;color:#ccc;font-size:1.1rem;align-self:flex-start;">🗑️</button>
      </div>
    `;
  }).join('');
}

function toggleCart() {
  document.getElementById('cartSidebar').classList.toggle('open');
  document.getElementById('cartOverlay').classList.toggle('open');
  document.body.style.overflow =
    document.getElementById('cartSidebar').classList.contains('open') ? 'hidden' : '';
}

// ===== CHECKOUT =====
function openCheckout() {
  if (cart.length === 0) { showToast('⚠️ Carrinho vazio!'); return; }
  toggleCart();
  document.getElementById('checkoutModal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeCheckout() {
  document.getElementById('checkoutModal').classList.remove('open');
  document.body.style.overflow = '';
}

function sendToWhatsApp() {
  const street = document.getElementById('street').value.trim();
  const number = document.getElementById('number').value.trim();
  const neighborhood = document.getElementById('neighborhood').value.trim();
  const complement = document.getElementById('complement').value.trim();
  const payment = document.querySelector('input[name="payment"]:checked')?.value || 'PIX';
  const change = document.getElementById('changeAmount').value;
  const generalObs = document.getElementById('generalObs').value.trim();

  if (!street || !number || !neighborhood) {
    showToast('⚠️ Preencha o endereço completo!');
    return;
  }

  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const delivery = settings.deliveryFee || 0;
  const total = subtotal + delivery;

  let itemsText = cart.map(item => {
    let line = `${item.qty}x ${item.name}`;
    item.options.forEach(o => { line += `\n   • ${o.choice}`; });
    item.extras.forEach(e => { line += `\n   + ${e.label}`; });
    if (item.obs) line += `\n   📝 ${item.obs}`;
    return line;
  }).join('\n\n');

  let addressLine = `Rua: ${street}\nNúmero: ${number}\nBairro: ${neighborhood}`;
  if (complement) addressLine += `\nComplemento: ${complement}`;

  let paymentLine = payment;
  if (payment === 'Dinheiro' && change) paymentLine += ` (troco para R$ ${change})`;

  let message = `🍔 *NOVO PEDIDO*\n\n`;
  message += `📍 *Endereço*\n${addressLine}\n\n`;
  message += `🛒 *Pedido:*\n\n${itemsText}\n\n`;
  if (generalObs) message += `📝 *Observações gerais:*\n${generalObs}\n\n`;
  message += `💰 *Total: R$ ${total.toFixed(2).replace('.', ',')}*\n`;
  message += `_(Subtotal: R$ ${subtotal.toFixed(2).replace('.', ',')} + Entrega: R$ ${delivery.toFixed(2).replace('.', ',')})_\n\n`;
  message += `💳 *Pagamento:*\n${paymentLine}`;

  const phone = settings.phone || '5511999999999';
  const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank');

  // Reset
  cart = [];
  updateCart();
  closeCheckout();
  showToast('🎉 Pedido enviado!');
}

// ===== UTILS =====
function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2500);
}

// Close modals on overlay click
document.getElementById('productModal').addEventListener('click', function(e) {
  if (e.target === this) closeModal();
});
document.getElementById('checkoutModal').addEventListener('click', function(e) {
  if (e.target === this) closeCheckout();
});

const API = '/api';
let token = localStorage.getItem('adminToken');
let allProducts = [];
let allCategories = [];
let editingOptionsGroups = [];
let editingExtras = [];

// ===== AUTH CHECK =====
if (!token) window.location.href = '/admin/login.html';

fetch(`${API}/auth/verify`, { headers: { Authorization: 'Bearer ' + token } })
  .then(r => { if (!r.ok) logout(); else init(); });

function logout() {
  localStorage.removeItem('adminToken');
  window.location.href = '/admin/login.html';
}

async function init() {
  await Promise.all([loadProducts(), loadCategories(), loadSettings()]);
}

// ===== TOAST =====
function toast(msg) {
  const el = document.getElementById('toast-admin');
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 3000);
}

// ===== AUTH HEADERS =====
function authHeaders(extra = {}) {
  return { Authorization: 'Bearer ' + token, ...extra };
}

// ===== TABS =====
function showTab(tab, el) {
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('tab-' + tab).classList.add('active');
  el.classList.add('active');
}

// ===== PRODUCTS =====
async function loadProducts() {
  const res = await fetch(`${API}/products/all`, { headers: authHeaders() });
  allProducts = await res.json();
  renderProductsTable(allProducts);
}

function renderProductsTable(products) {
  const container = document.getElementById('productsTable');
  if (!products.length) {
    container.innerHTML = '<div class="empty-state"><span>📦</span><p>Nenhum produto cadastrado</p></div>';
    return;
  }
  container.innerHTML = `
    <div class="products-table">
      <div class="table-header">
        <span>Foto</span><span>Produto</span><span>Categoria</span>
        <span>Preço</span><span>Status</span><span>Ações</span>
      </div>
      ${products.map(p => {
        const cat = allCategories.find(c => c.id === p.categoryId);
        return `
          <div class="table-row">
            <div class="product-thumb">
              ${p.image ? `<img src="${p.image}" alt="${p.name}">` : (cat?.icon || '🍽️')}
            </div>
            <div class="product-info">
              <strong>${p.name}</strong>
              <span>${p.description ? p.description.substring(0, 60) + (p.description.length > 60 ? '…' : '') : ''}</span>
            </div>
            <span>${cat ? cat.icon + ' ' + cat.name : '—'}</span>
            <span><strong>R$ ${p.price.toFixed(2).replace('.', ',')}</strong></span>
            <span><span class="badge ${p.available ? 'badge-green' : 'badge-red'}">${p.available ? '✅ Ativo' : '❌ Inativo'}</span></span>
            <div class="actions">
              <button class="btn-icon" onclick="openProductForm('${p.id}')" title="Editar">✏️</button>
              <button class="btn-icon" onclick="deleteProduct('${p.id}', '${p.name}')" title="Excluir">🗑️</button>
            </div>
          </div>`;
      }).join('')}
    </div>`;
}

function filterProducts() {
  const q = document.getElementById('productSearch').value.toLowerCase();
  const filtered = allProducts.filter(p =>
    p.name.toLowerCase().includes(q) ||
    (p.description || '').toLowerCase().includes(q)
  );
  renderProductsTable(filtered);
}

function openProductForm(productId = null) {
  const modal = document.getElementById('productFormModal');
  editingOptionsGroups = [];
  editingExtras = [];

  // Fill category select
  const sel = document.getElementById('pf-category');
  sel.innerHTML = allCategories.map(c => `<option value="${c.id}">${c.icon} ${c.name}</option>`).join('');

  if (productId) {
    const p = allProducts.find(x => x.id === productId);
    if (!p) return;
    document.getElementById('productFormTitle').textContent = 'Editar Produto';
    document.getElementById('pf-id').value = p.id;
    document.getElementById('pf-name').value = p.name;
    document.getElementById('pf-desc').value = p.description || '';
    document.getElementById('pf-price').value = p.price;
    document.getElementById('pf-category').value = p.categoryId;
    document.getElementById('pf-available').value = p.available.toString();

    if (p.image) {
      document.getElementById('imgPreview').src = p.image;
      document.getElementById('imgPreviewWrap').style.display = 'block';
    } else {
      document.getElementById('imgPreviewWrap').style.display = 'none';
    }

    editingOptionsGroups = JSON.parse(JSON.stringify(p.options || []));
    editingExtras = JSON.parse(JSON.stringify(p.extras || []));
  } else {
    document.getElementById('productFormTitle').textContent = 'Novo Produto';
    document.getElementById('pf-id').value = '';
    document.getElementById('pf-name').value = '';
    document.getElementById('pf-desc').value = '';
    document.getElementById('pf-price').value = '';
    document.getElementById('pf-available').value = 'true';
    document.getElementById('pf-image').value = '';
    document.getElementById('imgPreviewWrap').style.display = 'none';
  }

  renderOptionsBuilder();
  renderExtrasBuilder();
  modal.classList.add('open');
}

function closeProductForm() {
  document.getElementById('productFormModal').classList.remove('open');
}

function previewImage(input) {
  if (input.files && input.files[0]) {
    const reader = new FileReader();
    reader.onload = e => {
      document.getElementById('imgPreview').src = e.target.result;
      document.getElementById('imgPreviewWrap').style.display = 'block';
    };
    reader.readAsDataURL(input.files[0]);
  }
}

// OPTIONS BUILDER
function addOptionGroup() {
  editingOptionsGroups.push({
    id: 'opt_' + Date.now(),
    name: '',
    type: 'radio',
    required: false,
    choices: [{ id: 'c_' + Date.now(), label: '', price: 0 }]
  });
  renderOptionsBuilder();
}

function removeOptionGroup(idx) {
  editingOptionsGroups.splice(idx, 1);
  renderOptionsBuilder();
}

function addChoice(groupIdx) {
  editingOptionsGroups[groupIdx].choices.push({ id: 'c_' + Date.now(), label: '', price: 0 });
  renderOptionsBuilder();
}

function removeChoice(groupIdx, choiceIdx) {
  editingOptionsGroups[groupIdx].choices.splice(choiceIdx, 1);
  renderOptionsBuilder();
}

function renderOptionsBuilder() {
  const container = document.getElementById('optionsContainer');
  container.innerHTML = editingOptionsGroups.map((grp, gi) => `
    <div class="option-group-builder">
      <div class="option-group-header">
        <input type="text" placeholder="Nome do grupo (ex: Ponto da Carne)"
          value="${grp.name}" oninput="editingOptionsGroups[${gi}].name = this.value">
        <label style="display:flex;align-items:center;gap:6px;font-weight:700;font-size:0.82rem;white-space:nowrap;">
          <input type="checkbox" ${grp.required ? 'checked' : ''}
            onchange="editingOptionsGroups[${gi}].required = this.checked">
          Obrigatório
        </label>
        <button class="btn-sm" onclick="removeOptionGroup(${gi})" style="background:rgba(234,29,44,0.1);color:#EA1D2C;">✕</button>
      </div>
      <div class="choices-list">
        ${grp.choices.map((c, ci) => `
          <div class="choice-row">
            <input type="text" placeholder="Opção (ex: Com Cheddar)"
              value="${c.label}" oninput="editingOptionsGroups[${gi}].choices[${ci}].label = this.value">
            <input type="number" class="price-in" placeholder="Preço extra"
              value="${c.price}" step="0.50" oninput="editingOptionsGroups[${gi}].choices[${ci}].price = parseFloat(this.value)||0">
            <button class="btn-icon" onclick="removeChoice(${gi}, ${ci})">✕</button>
          </div>
        `).join('')}
      </div>
      <button class="btn-sm" onclick="addChoice(${gi})">+ Adicionar opção</button>
    </div>
  `).join('') || '<p style="color:#aaa;font-size:0.85rem;padding:8px 0;">Nenhuma opção adicionada</p>';
}

// EXTRAS BUILDER
function addExtra() {
  editingExtras.push({ id: 'e_' + Date.now(), label: '', price: 0 });
  renderExtrasBuilder();
}

function removeExtra(idx) {
  editingExtras.splice(idx, 1);
  renderExtrasBuilder();
}

function renderExtrasBuilder() {
  const container = document.getElementById('extrasContainer');
  container.innerHTML = editingExtras.length ?
    `<div class="extras-list-builder">
      ${editingExtras.map((e, i) => `
        <div class="extra-row">
          <input type="text" placeholder="Nome do extra (ex: Bacon)"
            value="${e.label}" oninput="editingExtras[${i}].label = this.value">
          <input type="number" class="price-in" placeholder="Preço"
            value="${e.price}" step="0.50" oninput="editingExtras[${i}].price = parseFloat(this.value)||0">
          <button class="btn-icon" onclick="removeExtra(${i})">✕</button>
        </div>
      `).join('')}
    </div>` :
    '<p style="color:#aaa;font-size:0.85rem;padding:8px 0;">Nenhum extra adicionado</p>';
}

async function saveProduct() {
  const id = document.getElementById('pf-id').value;
  const name = document.getElementById('pf-name').value.trim();
  const price = document.getElementById('pf-price').value;
  const categoryId = document.getElementById('pf-category').value;

  if (!name || !price || !categoryId) { toast('⚠️ Preencha os campos obrigatórios'); return; }

  const formData = new FormData();
  formData.append('name', name);
  formData.append('description', document.getElementById('pf-desc').value);
  formData.append('price', price);
  formData.append('categoryId', categoryId);
  formData.append('available', document.getElementById('pf-available').value);
  formData.append('options', JSON.stringify(editingOptionsGroups));
  formData.append('extras', JSON.stringify(editingExtras));

  const imgFile = document.getElementById('pf-image').files[0];
  if (imgFile) formData.append('image', imgFile);

  try {
    const url = id ? `${API}/products/${id}` : `${API}/products`;
    const method = id ? 'PUT' : 'POST';
    const res = await fetch(url, { method, headers: authHeaders(), body: formData });
    if (!res.ok) throw new Error();
    toast(id ? '✅ Produto atualizado!' : '✅ Produto criado!');
    closeProductForm();
    await loadProducts();
  } catch (e) {
    toast('❌ Erro ao salvar produto');
  }
}

async function deleteProduct(id, name) {
  if (!confirm(`Excluir "${name}"?`)) return;
  const res = await fetch(`${API}/products/${id}`, { method: 'DELETE', headers: authHeaders() });
  if (res.ok) { toast('🗑️ Produto removido'); loadProducts(); }
  else toast('❌ Erro ao remover');
}

// ===== CATEGORIES =====
async function loadCategories() {
  const res = await fetch(`${API}/categories`);
  allCategories = await res.json();
  renderCategoriesList();
}

function renderCategoriesList() {
  const container = document.getElementById('categoriesList');
  if (!allCategories.length) {
    container.innerHTML = '<div class="empty-state"><span>🏷️</span><p>Nenhuma categoria</p></div>';
    return;
  }
  container.innerHTML = `<div class="categories-grid">
    ${allCategories.map(cat => `
      <div class="category-card">
        <div class="cat-info">
          <span class="cat-emoji">${cat.icon}</span>
          <span class="cat-name">${cat.name}</span>
        </div>
        <div class="cat-actions">
          <button class="btn-icon" onclick="openCategoryForm('${cat.id}')">✏️</button>
          <button class="btn-icon" onclick="deleteCategory('${cat.id}', '${cat.name}')">🗑️</button>
        </div>
      </div>
    `).join('')}
  </div>`;
}

function openCategoryForm(catId = null) {
  const modal = document.getElementById('categoryFormModal');
  if (catId) {
    const cat = allCategories.find(c => c.id === catId);
    if (!cat) return;
    document.getElementById('catFormTitle').textContent = 'Editar Categoria';
    document.getElementById('cf-id').value = cat.id;
    document.getElementById('cf-name').value = cat.name;
    document.getElementById('cf-icon').value = cat.icon;
  } else {
    document.getElementById('catFormTitle').textContent = 'Nova Categoria';
    document.getElementById('cf-id').value = '';
    document.getElementById('cf-name').value = '';
    document.getElementById('cf-icon').value = '';
  }
  modal.classList.add('open');
}

function closeCategoryForm() {
  document.getElementById('categoryFormModal').classList.remove('open');
}

async function saveCategory() {
  const id = document.getElementById('cf-id').value;
  const name = document.getElementById('cf-name').value.trim();
  const icon = document.getElementById('cf-icon').value.trim() || '🍽️';
  if (!name) { toast('⚠️ Digite o nome da categoria'); return; }

  const url = id ? `${API}/categories/${id}` : `${API}/categories`;
  const method = id ? 'PUT' : 'POST';
  const res = await fetch(url, {
    method, headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, icon })
  });
  if (res.ok) {
    toast(id ? '✅ Categoria atualizada!' : '✅ Categoria criada!');
    closeCategoryForm();
    await loadCategories();
  } else toast('❌ Erro ao salvar categoria');
}

async function deleteCategory(id, name) {
  if (!confirm(`Excluir categoria "${name}"?`)) return;
  const res = await fetch(`${API}/categories/${id}`, { method: 'DELETE', headers: authHeaders() });
  if (res.ok) { toast('🗑️ Categoria removida'); loadCategories(); }
  else toast('❌ Erro ao remover');
}

// ===== SETTINGS =====
async function loadSettings() {
  const res = await fetch(`${API}/settings`);
  const s = await res.json();
  document.getElementById('set-name').value = s.name || '';
  document.getElementById('set-phone').value = s.phone || '';
  document.getElementById('set-address').value = s.address || '';
  document.getElementById('set-hours').value = s.openHours || '';
  document.getElementById('set-delivery').value = s.deliveryFee || '';
  document.getElementById('set-minorder').value = s.minOrder || '';
  document.getElementById('set-logolink').value = s.logoLink || '';

  if (s.logo) {
    document.getElementById('currentLogo').src = s.logo;
    document.getElementById('currentLogo').style.display = 'block';
    document.getElementById('noLogoText').style.display = 'none';
  }
}

async function saveSettings() {
  const formData = new FormData();
  formData.append('name', document.getElementById('set-name').value);
  formData.append('phone', document.getElementById('set-phone').value);
  formData.append('address', document.getElementById('set-address').value);
  formData.append('openHours', document.getElementById('set-hours').value);
  formData.append('deliveryFee', document.getElementById('set-delivery').value);
  formData.append('minOrder', document.getElementById('set-minorder').value);
  formData.append('logoLink', document.getElementById('set-logolink').value);

  const logoFile = document.getElementById('set-logo').files[0];
  if (logoFile) formData.append('logo', logoFile);

  const res = await fetch(`${API}/settings`, { method: 'PUT', headers: authHeaders(), body: formData });
  if (res.ok) toast('✅ Configurações salvas!');
  else toast('❌ Erro ao salvar configurações');
}

// Close modals on overlay click
document.querySelectorAll('.modal-overlay').forEach(m => {
  m.addEventListener('click', e => { if (e.target === m) m.classList.remove('open'); });
});

// Customer Portal Logic (app.js) - Chai Ceremony Cafe

let menuData = [];
let categoriesData = [];
let cart = [];
let activeCategory = "All";
let searchQuery = "";
let selectedDiningType = "Dine-In";
let packagingFee = 10;
let trackingListener = null;

const CURRENT_MENU_VER = "v3_the_cafe";

document.addEventListener("DOMContentLoaded", () => {
  forceUpdateMenuIfNewVersion();
  initCustomerApp();
  setupEventListeners();
  setupMultiTabSync();
});

// Bug 1 Fix: Safe version update that never overwrites existing custom admin edits
function forceUpdateMenuIfNewVersion() {
  const existingProds = localStorage.getItem("ccc_products");
  if (localStorage.getItem("ccc_menu_version") !== CURRENT_MENU_VER || !existingProds) {
    localStorage.setItem("ccc_menu_version", CURRENT_MENU_VER);

    if (!existingProds && typeof DEFAULT_MENU_ITEMS !== 'undefined') {
      menuData = DEFAULT_MENU_ITEMS;
      localStorage.setItem("ccc_products", JSON.stringify(menuData));
      try {
        const seedObj = {};
        DEFAULT_MENU_ITEMS.forEach(item => { seedObj[item.id] = item; });
        db.ref("products").set(seedObj);
      } catch(e){}
    }

    const existingCats = localStorage.getItem("ccc_categories");
    if (!existingCats && typeof DEFAULT_CATEGORIES !== 'undefined') {
      categoriesData = DEFAULT_CATEGORIES;
      localStorage.setItem("ccc_categories", JSON.stringify(categoriesData));
      try { db.ref("categories").set(DEFAULT_CATEGORIES); } catch(e){}
    }
  }
}

function initCustomerApp() {
  loadCartFromStorage();
  listenToSettings();
  listenToCategories();
  listenToProducts();
  checkActiveOrderTracking();
}

// Bug 9 Fix: Multi-tab synchronization across browser tabs
function setupMultiTabSync() {
  window.addEventListener('storage', (e) => {
    if (e.key === 'ccc_products' && e.newValue) {
      try { menuData = JSON.parse(e.newValue); renderMenu(); } catch(err){}
    }
    if (e.key === 'ccc_categories' && e.newValue) {
      try { categoriesData = JSON.parse(e.newValue); renderCategories(); } catch(err){}
    }
    if (e.key === 'ccc_settings' && e.newValue) {
      try { applySettingsUI(JSON.parse(e.newValue)); } catch(err){}
    }
  });
}

// 1. Settings Listener
function listenToSettings() {
  db.ref("settings").on("value", (snapshot) => {
    const data = snapshot.val() || (typeof DEFAULT_SETTINGS !== 'undefined' ? DEFAULT_SETTINGS : {});
    localStorage.setItem("ccc_settings", JSON.stringify(data));
    applySettingsUI(data);
  });
}

function applySettingsUI(data) {
  const nameEl = document.getElementById("cafe-name");
  const tagEl = document.getElementById("cafe-tagline");
  const logoEl = document.getElementById("cafe-logo");
  const addrEl = document.getElementById("footer-address");
  const phoneEl = document.getElementById("footer-phone");

  if (nameEl) nameEl.innerText = data.cafeName || "THE CAFE";
  if (tagEl) tagEl.innerText = data.tagline || "Fresh Brews & Delicious Bites";
  if (logoEl) logoEl.src = data.logoUrl || "https://cdn-icons-png.flaticon.com/512/924/924514.png";
  if (addrEl) addrEl.innerText = data.address || "";
  if (phoneEl) phoneEl.innerText = "Contact: " + (data.contactPhone || "");
  
  packagingFee = Number(data.packagingCharge) || 10;
  const packVal = document.getElementById("packaging-val");
  if (packVal) packVal.innerText = `₹${packagingFee}`;
  updateCartTotals();
}

// 2. Categories Listener
function listenToCategories() {
  db.ref("categories").on("value", (snapshot) => {
    if (snapshot.exists()) {
      categoriesData = snapshot.val();
      localStorage.setItem("ccc_categories", JSON.stringify(categoriesData));
      renderCategories();
    } else {
      const localCats = localStorage.getItem("ccc_categories");
      if (localCats) {
        try { categoriesData = JSON.parse(localCats); renderCategories(); } catch(e){}
      }
    }
  });
}

// 3. Products Listener
function listenToProducts() {
  db.ref("products").on("value", (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.val();
      menuData = Object.keys(data).map(key => ({ id: key, ...data[key] }));
      localStorage.setItem("ccc_products", JSON.stringify(menuData));
      renderMenu();
    } else {
      const localProds = localStorage.getItem("ccc_products");
      if (localProds) {
        try { menuData = JSON.parse(localProds); renderMenu(); } catch(e){}
      }
    }
  });
}

// Render Categories
function renderCategories() {
  const container = document.getElementById("category-pills");
  if (!container) return;
  container.innerHTML = "";
  
  const cats = (Array.isArray(categoriesData) && categoriesData.length > 0) ? categoriesData : (typeof DEFAULT_CATEGORIES !== 'undefined' ? DEFAULT_CATEGORIES : ["All"]);

  cats.forEach(cat => {
    const btn = document.createElement("button");
    btn.className = `pill-btn ${cat === activeCategory ? 'active' : ''}`;
    btn.innerText = cat;
    btn.onclick = () => {
      activeCategory = cat;
      const titleEl = document.getElementById("current-category-title");
      if (titleEl) titleEl.innerText = cat === "All" ? "Royal Menu" : cat;
      renderCategories();
      renderMenu();
    };
    container.appendChild(btn);
  });
}

// Render Menu
function renderMenu() {
  const container = document.getElementById("menu-grid");
  if (!container) return;
  container.innerHTML = "";

  const filtered = menuData.filter(item => {
    const matchCategory = activeCategory === "All" || item.category === activeCategory;
    const matchSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchCategory && matchSearch;
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted);">
        <i class="fa-solid fa-mug-hot" style="font-size: 2.5rem; color: var(--royal-gold); margin-bottom: 10px;"></i>
        <p>No delicious items found matching your search.</p>
      </div>`;
    return;
  }

  filtered.forEach(item => {
    const cartItem = cart.find(c => c.id === item.id);
    const qty = cartItem ? cartItem.qty : 0;

    const card = document.createElement("div");
    card.className = "product-card";
    card.innerHTML = `
      <div class="card-img-wrap">
        <img src="${item.image}" alt="${item.title}" class="product-img" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=600&q=80'">
        <div class="veg-badge ${item.isVeg ? 'veg' : 'non-veg'}">
          <div class="dot"></div>
        </div>
        <span class="stock-tag ${item.inStock ? 'in-stock' : 'out-stock'}">
          ${item.inStock ? 'In Stock' : 'Out of Stock'}
        </span>
      </div>
      <div class="card-details">
        <div>
          <h3 class="product-title">${item.title}</h3>
          <p class="product-desc">${item.description || ''}</p>
        </div>
        <div class="card-footer">
          <span class="price-tag">₹${item.price}</span>
          ${!item.inStock ? `<span style="font-size:0.75rem; color:var(--accent-red); font-weight:600;">Unavailable</span>` : 
            qty === 0 ? `<button class="add-btn" onclick="addToCart('${item.id}')">+ ADD</button>` :
            `<div class="qty-control">
              <button class="qty-btn" onclick="updateQty('${item.id}', -1)">-</button>
              <span class="qty-val">${qty}</span>
              <button class="qty-btn" onclick="updateQty('${item.id}', 1)">+</button>
             </div>`
          }
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

// Cart Logic
function addToCart(productId) {
  const product = menuData.find(p => p.id === productId);
  if (!product || !product.inStock) return;

  const existing = cart.find(c => c.id === productId);
  if (existing) {
    existing.qty++;
  } else {
    cart.push({ id: product.id, title: product.title, price: product.price, qty: 1 });
  }
  saveCartAndSync();
}

function updateQty(productId, change) {
  const index = cart.findIndex(c => c.id === productId);
  if (index !== -1) {
    cart[index].qty += change;
    if (cart[index].qty <= 0) {
      cart.splice(index, 1);
    }
  }
  saveCartAndSync();
}

function saveCartAndSync() {
  localStorage.setItem("ccc_cart", JSON.stringify(cart));
  renderMenu();
  updateCartTotals();
  renderCartModal();
}

function loadCartFromStorage() {
  const saved = localStorage.getItem("ccc_cart");
  if (saved) {
    try { cart = JSON.parse(saved); } catch(e) { cart = []; }
  }
  updateCartTotals();
}

function updateCartTotals() {
  const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const grandTotal = totalItems > 0 ? subtotal + packagingFee : 0;

  const countEl = document.getElementById("cart-count");
  const itemsTextEl = document.getElementById("cart-items-text");
  const totalPriceEl = document.getElementById("cart-total-price");
  const subtotalValEl = document.getElementById("subtotal-val");
  const grandTotalValEl = document.getElementById("grand-total-val");

  if (countEl) countEl.innerText = totalItems;
  if (itemsTextEl) itemsTextEl.innerText = `${totalItems} Item${totalItems > 1 ? 's' : ''}`;
  if (totalPriceEl) totalPriceEl.innerText = `₹${grandTotal}`;
  if (subtotalValEl) subtotalValEl.innerText = `₹${subtotal}`;
  if (grandTotalValEl) grandTotalValEl.innerText = `₹${grandTotal}`;

  const floatingBar = document.getElementById("floating-cart");
  if (floatingBar) {
    if (totalItems > 0) {
      floatingBar.classList.remove("hidden");
    } else {
      floatingBar.classList.add("hidden");
    }
  }
}

function renderCartModal() {
  const container = document.getElementById("cart-items-container");
  if (!container) return;
  container.innerHTML = "";

  if (cart.length === 0) {
    container.innerHTML = `<p style="text-align:center; color:var(--text-muted); padding:20px;">Your royal cart is empty!</p>`;
    return;
  }

  cart.forEach(item => {
    const row = document.createElement("div");
    row.className = "cart-item-row";
    row.innerHTML = `
      <div class="cart-item-info">
        <div class="item-name">${item.title}</div>
        <div class="item-single-price">₹${item.price} x ${item.qty}</div>
      </div>
      <div class="cart-item-right">
        <div class="qty-control">
          <button class="qty-btn" onclick="updateQty('${item.id}', -1)">-</button>
          <span class="qty-val">${item.qty}</span>
          <button class="qty-btn" onclick="updateQty('${item.id}', 1)">+</button>
        </div>
        <span style="font-weight:700; color:var(--primary-terracotta); width:50px; text-align:right;">₹${item.price * item.qty}</span>
      </div>
    `;
    container.appendChild(row);
  });
}

function selectDining(type) {
  selectedDiningType = type;
  const dineInTile = document.getElementById("opt-dinein");
  const takeawayTile = document.getElementById("opt-takeaway");
  const tableGroup = document.getElementById("table-no-group");
  const tableInput = document.getElementById("cust-table");

  if (type === "Dine-In") {
    if (dineInTile) dineInTile.classList.add("selected");
    if (takeawayTile) takeawayTile.classList.remove("selected");
    if (tableGroup) tableGroup.style.display = "block";
    if (tableInput) tableInput.required = true;
  } else {
    if (takeawayTile) takeawayTile.classList.add("selected");
    if (dineInTile) dineInTile.classList.remove("selected");
    if (tableGroup) tableGroup.style.display = "none";
    if (tableInput) tableInput.required = false;
  }
}

function submitOrder(e) {
  e.preventDefault();
  if (cart.length === 0) {
    alert("Please add items to cart before ordering!");
    return;
  }

  const name = document.getElementById("cust-name").value.trim();
  const phone = document.getElementById("cust-phone").value.trim();
  const notes = document.getElementById("cust-notes").value.trim();
  const tableNo = selectedDiningType === "Dine-In" ? document.getElementById("cust-table").value.trim() : "N/A";

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const totalAmount = subtotal + packagingFee;
  const orderId = "CCC-" + Math.floor(100000 + Math.random() * 900000);

  const newOrder = {
    orderId: orderId,
    timestamp: Date.now(),
    customerName: name,
    customerPhone: phone,
    diningType: selectedDiningType,
    tableNo: tableNo,
    notes: notes,
    items: cart,
    subtotal: subtotal,
    packagingFee: packagingFee,
    totalAmount: totalAmount,
    status: "Received"
  };

  let savedOrders = [];
  try { savedOrders = JSON.parse(localStorage.getItem("ccc_orders")) || []; } catch(e){}
  savedOrders.push(newOrder);
  localStorage.setItem("ccc_orders", JSON.stringify(savedOrders));

  try { db.ref("orders/" + orderId).set(newOrder); } catch(e){}

  cart = [];
  saveCartAndSync();
  closeCheckoutModal();
  closeCartModal();

  localStorage.setItem("ccc_active_order_id", orderId);
  openTrackingModal();
  startLiveOrderTracking(orderId);
}

function startLiveOrderTracking(orderId) {
  if (trackingListener) {
    try { db.ref("orders/" + trackingListener).off(); } catch(e){}
  }
  trackingListener = orderId;

  const msgEl = document.getElementById("no-order-tracker-msg");
  const contentEl = document.getElementById("active-tracker-content");
  const trackIdEl = document.getElementById("track-order-id");

  if (msgEl) msgEl.style.display = "none";
  if (contentEl) contentEl.style.display = "block";
  if (trackIdEl) trackIdEl.innerText = `#${orderId}`;

  try {
    const savedOrders = JSON.parse(localStorage.getItem("ccc_orders")) || [];
    const localOrder = savedOrders.find(o => o.orderId === orderId);
    if (localOrder) {
      const trackDiningEl = document.getElementById("track-dining-type");
      if (trackDiningEl) trackDiningEl.innerText = `${localOrder.diningType} ${localOrder.tableNo !== 'N/A' ? '(Table #' + localOrder.tableNo + ')' : ''}`;
      updateStepperUI(localOrder.status);
    }
  } catch(e){}

  db.ref("orders/" + orderId).on("value", (snapshot) => {
    if (!snapshot.exists()) return;
    const data = snapshot.val();
    const trackDiningEl = document.getElementById("track-dining-type");
    if (trackDiningEl) trackDiningEl.innerText = `${data.diningType} ${data.tableNo !== 'N/A' ? '(Table #' + data.tableNo + ')' : ''}`;
    updateStepperUI(data.status);
  });
}

function updateStepperUI(status) {
  const steps = ["step-received", "step-preparing", "step-ready", "step-completed"];
  let cancelBanner = document.getElementById("track-cancelled-banner");
  if (cancelBanner) cancelBanner.remove();

  if (status === "Cancelled") {
    steps.forEach(s => {
      const el = document.getElementById(s);
      if (el) el.classList.remove("active", "completed");
    });

    const activeContent = document.getElementById("active-tracker-content");
    if (activeContent) {
      const banner = document.createElement("div");
      banner.id = "track-cancelled-banner";
      banner.style.cssText = "background:#EF4444; color:white; padding:12px; border-radius:10px; text-align:center; font-weight:700; margin-bottom:16px;";
      banner.innerHTML = `<i class="fa-solid fa-circle-xmark"></i> Order Cancelled by Cafe`;
      activeContent.insertBefore(banner, activeContent.children[1]);
    }
    return;
  }

  steps.forEach(s => {
    const el = document.getElementById(s);
    if (el) el.classList.remove("active", "completed");
  });

  if (status === "Received") {
    document.getElementById("step-received").classList.add("active");
  } else if (status === "Preparing") {
    document.getElementById("step-received").classList.add("completed");
    document.getElementById("step-preparing").classList.add("active");
  } else if (status === "Ready") {
    document.getElementById("step-received").classList.add("completed");
    document.getElementById("step-preparing").classList.add("completed");
    document.getElementById("step-ready").classList.add("active");
  } else if (status === "Completed") {
    document.getElementById("step-received").classList.add("completed");
    document.getElementById("step-preparing").classList.add("completed");
    document.getElementById("step-ready").classList.add("completed");
    document.getElementById("step-completed").classList.add("completed");
  }
}

function checkActiveOrderTracking() {
  const savedOrderId = localStorage.getItem("ccc_active_order_id");
  if (savedOrderId) {
    startLiveOrderTracking(savedOrderId);
  }
}

function setupEventListeners() {
  const sInput = document.getElementById("search-input");
  if (sInput) {
    sInput.addEventListener("input", (e) => {
      searchQuery = e.target.value;
      renderMenu();
    });
  }

  const openCartBtn = document.getElementById("open-cart-btn");
  if (openCartBtn) {
    openCartBtn.addEventListener("click", () => {
      renderCartModal();
      document.getElementById("cart-modal").classList.add("active");
    });
  }

  const proceedBtn = document.getElementById("proceed-checkout-btn");
  if (proceedBtn) {
    proceedBtn.addEventListener("click", () => {
      if (cart.length === 0) return;
      document.getElementById("cart-modal").classList.remove("active");
      document.getElementById("checkout-modal").classList.add("active");
    });
  }

  const chkForm = document.getElementById("checkout-form");
  if (chkForm) {
    chkForm.addEventListener("submit", submitOrder);
  }

  const topTrackBtn = document.getElementById("top-track-btn");
  if (topTrackBtn) {
    topTrackBtn.addEventListener("click", () => {
      openTrackingModal();
    });
  }
}

function closeCartModal() {
  const modal = document.getElementById("cart-modal");
  if (modal) modal.classList.remove("active");
}

function closeCheckoutModal() {
  const modal = document.getElementById("checkout-modal");
  if (modal) modal.classList.remove("active");
}

function openTrackingModal() {
  const modal = document.getElementById("tracking-modal");
  if (modal) modal.classList.add("active");
}

function closeTrackingModal() {
  const modal = document.getElementById("tracking-modal");
  if (modal) modal.classList.remove("active");
}


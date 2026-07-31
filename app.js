// Customer Portal Logic (app.js)

let menuData = [];
let categoriesData = [];
let cart = [];
let activeCategory = "All";
let searchQuery = "";
let selectedDiningType = "Dine-In";
let packagingFee = 10;
let trackingListener = null;

document.addEventListener("DOMContentLoaded", () => {
  initCustomerApp();
  setupEventListeners();
});

function initCustomerApp() {
  loadCartFromStorage();
  listenToSettings();
  listenToCategories();
  listenToProducts();
  checkActiveOrderTracking();
}

// 1. Settings Listener
function listenToSettings() {
  db.ref("settings").on("value", (snapshot) => {
    const data = snapshot.val() || DEFAULT_SETTINGS;
    if (!snapshot.exists()) {
      db.ref("settings").set(DEFAULT_SETTINGS);
    }
    document.getElementById("cafe-name").innerText = data.cafeName;
    document.getElementById("cafe-tagline").innerText = data.tagline;
    document.getElementById("cafe-logo").src = data.logoUrl;
    document.getElementById("footer-address").innerText = data.address;
    document.getElementById("footer-phone").innerText = "Contact: " + data.contactPhone;
    packagingFee = Number(data.packagingCharge) || 10;
    document.getElementById("packaging-val").innerText = `₹${packagingFee}`;
    updateCartTotals();
  });
}

// 2. Categories Listener
function listenToCategories() {
  db.ref("categories").on("value", (snapshot) => {
    if (!snapshot.exists()) {
      db.ref("categories").set(DEFAULT_CATEGORIES);
      categoriesData = DEFAULT_CATEGORIES;
    } else {
      categoriesData = snapshot.val();
    }
    renderCategories();
  });
}

// 3. Products Listener
function listenToProducts() {
  db.ref("products").on("value", (snapshot) => {
    if (!snapshot.exists()) {
      // Seed Database with initial menu items
      const seedObj = {};
      DEFAULT_MENU_ITEMS.forEach(item => {
        seedObj[item.id] = item;
      });
      db.ref("products").set(seedObj);
      menuData = DEFAULT_MENU_ITEMS;
    } else {
      const data = snapshot.val();
      menuData = Object.keys(data).map(key => ({ id: key, ...data[key] }));
    }
    renderMenu();
  });
}

// Render Categories
function renderCategories() {
  const container = document.getElementById("category-pills");
  container.innerHTML = "";
  categoriesData.forEach(cat => {
    const btn = document.createElement("button");
    btn.className = `pill-btn ${cat === activeCategory ? 'active' : ''}`;
    btn.innerText = cat;
    btn.onclick = () => {
      activeCategory = cat;
      document.getElementById("current-category-title").innerText = cat === "All" ? "Royal Menu" : cat;
      renderCategories();
      renderMenu();
    };
    container.appendChild(btn);
  });
}

// Render Menu
function renderMenu() {
  const container = document.getElementById("menu-grid");
  container.innerHTML = "";

  const filtered = menuData.filter(item => {
    const matchCategory = activeCategory === "All" || item.category === activeCategory;
    const matchSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        item.description.toLowerCase().includes(searchQuery.toLowerCase());
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
        <img src="${item.image}" alt="${item.title}" class="product-img" loading="lazy">
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
          <p class="product-desc">${item.description}</p>
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

  document.getElementById("cart-count").innerText = totalItems;
  document.getElementById("cart-items-text").innerText = `${totalItems} Item${totalItems > 1 ? 's' : ''}`;
  document.getElementById("cart-total-price").innerText = `₹${grandTotal}`;

  document.getElementById("subtotal-val").innerText = `₹${subtotal}`;
  document.getElementById("grand-total-val").innerText = `₹${grandTotal}`;

  const floatingBar = document.getElementById("floating-cart");
  if (totalItems > 0) {
    floatingBar.classList.remove("hidden");
  } else {
    floatingBar.classList.add("hidden");
  }
}

// Render Cart Modal List
function renderCartModal() {
  const container = document.getElementById("cart-items-container");
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

// Dining Type Selection
function selectDining(type) {
  selectedDiningType = type;
  const dineInTile = document.getElementById("opt-dinein");
  const takeawayTile = document.getElementById("opt-takeaway");
  const tableGroup = document.getElementById("table-no-group");
  const tableInput = document.getElementById("cust-table");

  if (type === "Dine-In") {
    dineInTile.classList.add("selected");
    takeawayTile.classList.remove("selected");
    tableGroup.style.display = "block";
    tableInput.required = true;
  } else {
    takeawayTile.classList.add("selected");
    dineInTile.classList.remove("selected");
    tableGroup.style.display = "none";
    tableInput.required = false;
  }
}

// Submit Order
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
    status: "Received" // Statuses: Received -> Preparing -> Ready -> Completed / Cancelled
  };

  db.ref("orders/" + orderId).set(newOrder, (error) => {
    if (error) {
      alert("Order placement failed: " + error.message);
    } else {
      // Clear Cart
      cart = [];
      saveCartAndSync();
      closeCheckoutModal();
      closeCartModal();

      // Save Order ID for live tracking
      localStorage.setItem("ccc_active_order_id", orderId);
      openTrackingModal();
      startLiveOrderTracking(orderId);
    }
  });
}

// Live Order Tracking Listener
function startLiveOrderTracking(orderId) {
  if (trackingListener) {
    db.ref("orders/" + trackingListener).off();
  }
  trackingListener = orderId;

  document.getElementById("no-order-tracker-msg").style.display = "none";
  document.getElementById("active-tracker-content").style.display = "block";
  document.getElementById("track-order-id").innerText = `#${orderId}`;

  db.ref("orders/" + orderId).on("value", (snapshot) => {
    if (!snapshot.exists()) return;
    const data = snapshot.val();
    
    document.getElementById("track-dining-type").innerText = `${data.diningType} ${data.tableNo !== 'N/A' ? '(Table #' + data.tableNo + ')' : ''}`;

    const status = data.status;
    updateStepperUI(status);
  });
}

function updateStepperUI(status) {
  const steps = ["step-received", "step-preparing", "step-ready", "step-completed"];
  steps.forEach(s => {
    const el = document.getElementById(s);
    el.classList.remove("active", "completed");
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

// Event Listeners setup
function setupEventListeners() {
  document.getElementById("search-input").addEventListener("input", (e) => {
    searchQuery = e.target.value;
    renderMenu();
  });

  document.getElementById("open-cart-btn").addEventListener("click", () => {
    renderCartModal();
    document.getElementById("cart-modal").classList.add("active");
  });

  document.getElementById("proceed-checkout-btn").addEventListener("click", () => {
    if (cart.length === 0) return;
    document.getElementById("cart-modal").classList.remove("active");
    document.getElementById("checkout-modal").classList.add("active");
  });

  document.getElementById("checkout-form").addEventListener("submit", submitOrder);

  document.getElementById("top-track-btn").addEventListener("click", () => {
    openTrackingModal();
  });
}

function closeCartModal() {
  document.getElementById("cart-modal").classList.remove("active");
}

function closeCheckoutModal() {
  document.getElementById("checkout-modal").classList.remove("active");
}

function openTrackingModal() {
  document.getElementById("tracking-modal").classList.add("active");
}

function closeTrackingModal() {
  document.getElementById("tracking-modal").classList.remove("active");
}

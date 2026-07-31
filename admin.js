// Admin Dashboard Logic (admin.js)

let adminOrders = [];
let adminProducts = [];
let adminCategories = [];
let knownOrderIds = new Set();
let isAudioInitialized = false;

document.addEventListener("DOMContentLoaded", () => {
  setupAdminAuth();
  checkSession();
  startClock();
  setupAdminForms();
  setupRealtimeAutoSync();
});

// Real-time Storage Listener for instant multi-tab sync without page refresh
function setupRealtimeAutoSync() {
  window.addEventListener('storage', (e) => {
    if (e.key === 'ccc_orders' || e.key === 'ccc_products' || e.key === 'ccc_categories') {
      syncDataFromLocal();
    }
  });

  // Polling fallback every 2 seconds
  setInterval(() => {
    syncDataFromLocal();
  }, 2000);
}

function syncDataFromLocal() {
  try {
    const savedOrders = JSON.parse(localStorage.getItem("ccc_orders")) || [];
    
    // Check for NEW incoming order to play 3-sec sound
    if (knownOrderIds.size > 0) {
      const hasNewOrder = savedOrders.some(o => !knownOrderIds.has(o.orderId));
      if (hasNewOrder) {
        playOrderNotificationTone();
      }
    }
    
    savedOrders.forEach(o => knownOrderIds.add(o.orderId));
    adminOrders = savedOrders;
    renderOrdersStream();
    calculateKPIs();
    calculateAnalytics();
  } catch(e){}
}

// 3-Second Royal Notification Tone Generator (Web Audio Synthesizer)
function playOrderNotificationTone() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const now = ctx.currentTime;

    // Chime Note 1
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(659.25, now);
    gain1.gain.setValueAtTime(0.3, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 1.0);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 1.0);

    // Chime Note 2
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(830.61, now + 0.4);
    gain2.gain.setValueAtTime(0.4, now + 0.4);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 2.0);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.4);
    osc2.stop(now + 2.0);

    // Chime Note 3 (Holds sound till 3 Seconds)
    const osc3 = ctx.createOscillator();
    const gain3 = ctx.createGain();
    osc3.type = 'sine';
    osc3.frequency.setValueAtTime(987.77, now + 0.8);
    gain3.gain.setValueAtTime(0.5, now + 0.8);
    gain3.gain.exponentialRampToValueAtTime(0.001, now + 3.0);
    osc3.connect(gain3);
    gain3.connect(ctx.destination);
    osc3.start(now + 0.8);
    osc3.stop(now + 3.0);
  } catch(e) {}
}

// Smart Image Auto-Detector based on Item Title & Category
function autoDetectProductImage(title, category) {
  const text = (title + " " + category).toLowerCase();

  if (text.includes("chai") || text.includes("tea") || text.includes("kulhad")) {
    return "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=600&q=80";
  } else if (text.includes("coffee") || text.includes("latte") || text.includes("cappuccino")) {
    return "https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=600&q=80";
  } else if (text.includes("pizza") || text.includes("paneer")) {
    return "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80";
  } else if (text.includes("burger")) {
    return "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80";
  } else if (text.includes("patty") || text.includes("patties") || text.includes("puff") || text.includes("samosa")) {
    return "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80";
  } else if (text.includes("dessert") || text.includes("kulfi") || text.includes("falooda") || text.includes("sweet") || text.includes("ice cream")) {
    return "https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=600&q=80";
  } else if (text.includes("drink") || text.includes("soda") || text.includes("lime") || text.includes("shake") || text.includes("beverage") || text.includes("cold")) {
    return "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80";
  } else if (text.includes("cigarette") || text.includes("smoke")) {
    return "https://images.unsplash.com/photo-1527061011665-3652c757a4d4?auto=format&fit=crop&w=600&q=80";
  }

  return "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=600&q=80";
}

// Clock
function startClock() {
  setInterval(() => {
    const el = document.getElementById("live-clock");
    if (el) {
      const now = new Date();
      el.innerText = now.toLocaleTimeString() + " | Live Sync";
    }
  }, 1000);
}

// Authentication & Session
function setupAdminAuth() {
  const form = document.getElementById("admin-login-form");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = document.getElementById("admin-email").value.trim();
    const password = document.getElementById("admin-password").value.trim();

    if (email === "admin@chaiceremony.com" && password === "admin123") {
      sessionStorage.setItem("ccc_admin_auth", "true");
      unlockAdminDashboard();
    } else {
      alert("Invalid Admin Credentials!");
    }
  });
}

function checkSession() {
  if (sessionStorage.getItem("ccc_admin_auth") === "true") {
    unlockAdminDashboard();
  }
}

function unlockAdminDashboard() {
  const loginScreen = document.getElementById("admin-login-screen");
  const dashContainer = document.getElementById("admin-dashboard-container");

  if (loginScreen) loginScreen.style.display = "none";
  if (dashContainer) dashContainer.style.display = "block";

  initAdminDashboard();
}

function adminLogout() {
  sessionStorage.removeItem("ccc_admin_auth");
  window.location.reload();
}

// Tab Switching
function switchAdminTab(tabName, btnElement) {
  document.querySelectorAll(".admin-tab-btn").forEach(btn => btn.classList.remove("active"));
  document.querySelectorAll(".admin-section").forEach(sec => sec.classList.remove("active"));

  if (btnElement) {
    btnElement.classList.add("active");
  }
  const targetSection = document.getElementById(`tab-${tabName}`);
  if (targetSection) targetSection.classList.add("active");
}

// Init Realtime Sync
function initAdminDashboard() {
  listenToLiveOrders();
  listenToAdminProducts();
  listenToAdminCategories();
  listenToAdminSettings();
}

// 1. Live Orders Sync
function listenToLiveOrders() {
  syncDataFromLocal();

  db.ref("orders").on("value", (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.val();
      const updatedOrders = Object.keys(data).map(key => ({ ...data[key] }));
      
      // Check for new order for sound
      if (knownOrderIds.size > 0) {
        const hasNew = updatedOrders.some(o => !knownOrderIds.has(o.orderId));
        if (hasNew) playOrderNotificationTone();
      }
      
      updatedOrders.forEach(o => knownOrderIds.add(o.orderId));
      adminOrders = updatedOrders;
      localStorage.setItem("ccc_orders", JSON.stringify(adminOrders));
      renderOrdersStream();
      calculateKPIs();
      calculateAnalytics();
    }
  });
}

function renderOrdersStream() {
  const container = document.getElementById("orders-stream-container");
  if (!container) return;
  container.innerHTML = "";

  const sorted = [...adminOrders].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

  if (sorted.length === 0) {
    container.innerHTML = `<p style="grid-column: 1/-1; color: #A39485; text-align: center; padding: 40px;">No incoming orders yet.</p>`;
    return;
  }

  sorted.forEach(order => {
    const dateStr = new Date(order.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const itemsListHtml = (order.items || []).map(i => `
      <div style="display:flex; justify-content:space-between; font-size:0.8rem; margin-bottom:2px;">
        <span>${i.qty}x ${i.title}</span>
        <span>₹${i.price * i.qty}</span>
      </div>
    `).join("");

    const card = document.createElement("div");
    card.className = "admin-order-card";
    card.innerHTML = `
      <div class="admin-order-header">
        <div>
          <strong style="color:var(--royal-gold); font-size:0.95rem;">${order.orderId}</strong>
          <div style="font-size:0.7rem; color:#A39485;">${dateStr} • ${order.diningType} ${order.tableNo !== 'N/A' ? '(Table #' + order.tableNo + ')' : ''}</div>
        </div>
        <span class="status-badge-pill status-${(order.status || 'received').toLowerCase()}">${order.status}</span>
      </div>

      <div>
        <div style="font-size:0.85rem; font-weight:700; color:#FFF;">${order.customerName} (${order.customerPhone})</div>
        ${order.notes ? `<div style="font-size:0.75rem; color:#F59E0B; font-style:italic; margin-top:2px;">Note: "${order.notes}"</div>` : ''}
      </div>

      <div style="background:rgba(0,0,0,0.2); padding:8px; border-radius:6px;">
        ${itemsListHtml}
        <div style="border-top:1px dashed rgba(212,175,55,0.3); margin-top:6px; padding-top:4px; display:flex; justify-content:space-between; font-weight:700; color:var(--royal-gold); font-size:0.88rem;">
          <span>Total:</span>
          <span>₹${order.totalAmount}</span>
        </div>
      </div>

      <div class="action-btn-group">
        ${order.status === 'Received' ? `<button class="btn-status-action btn-prep" onclick="updateOrderStatus('${order.orderId}', 'Preparing')">Start Preparing</button>` : ''}
        ${order.status === 'Preparing' ? `<button class="btn-status-action btn-ready" onclick="updateOrderStatus('${order.orderId}', 'Ready')">Mark Ready</button>` : ''}
        ${order.status === 'Ready' ? `<button class="btn-status-action btn-complete" onclick="updateOrderStatus('${order.orderId}', 'Completed')">Complete</button>` : ''}
        ${order.status !== 'Completed' && order.status !== 'Cancelled' ? `<button class="btn-status-action btn-cancel" onclick="updateOrderStatus('${order.orderId}', 'Cancelled')">Cancel</button>` : ''}
      </div>
    `;
    container.appendChild(card);
  });
}

function updateOrderStatus(orderId, newStatus) {
  const index = adminOrders.findIndex(o => o.orderId === orderId);
  if (index !== -1) {
    adminOrders[index].status = newStatus;
    localStorage.setItem("ccc_orders", JSON.stringify(adminOrders));
    renderOrdersStream();
    calculateKPIs();
    calculateAnalytics();
  }
  try { db.ref("orders/" + orderId).update({ status: newStatus }); } catch(e){}
}

// KPI Calculations
function calculateKPIs() {
  const todayStart = new Date().setHours(0,0,0,0);
  const todayOrders = adminOrders.filter(o => (o.timestamp || 0) >= todayStart);

  const totalSalesToday = todayOrders
    .filter(o => o.status !== "Cancelled")
    .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  const pendingCount = adminOrders.filter(o => ["Received", "Preparing", "Ready"].includes(o.status)).length;
  const completedCount = todayOrders.filter(o => o.status === "Completed").length;

  const salesEl = document.getElementById("kpi-sales");
  const countEl = document.getElementById("kpi-orders-count");
  const pendingEl = document.getElementById("kpi-pending");
  const completedEl = document.getElementById("kpi-completed");

  if (salesEl) salesEl.innerText = `₹${totalSalesToday}`;
  if (countEl) countEl.innerText = todayOrders.length;
  if (pendingEl) pendingEl.innerText = pendingCount;
  if (completedEl) completedEl.innerText = completedCount;
}

// 2. Admin Products CRUD
function listenToAdminProducts() {
  const localProds = localStorage.getItem("ccc_products");
  if (localProds) {
    try {
      adminProducts = JSON.parse(localProds);
      renderAdminProductsTable();
    } catch(e){}
  } else {
    adminProducts = DEFAULT_MENU_ITEMS;
    localStorage.setItem("ccc_products", JSON.stringify(adminProducts));
    renderAdminProductsTable();
  }

  db.ref("products").on("value", (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.val();
      adminProducts = Object.keys(data).map(key => ({ id: key, ...data[key] }));
      localStorage.setItem("ccc_products", JSON.stringify(adminProducts));
      renderAdminProductsTable();
    }
  });
}

function renderAdminProductsTable() {
  const tbody = document.getElementById("products-table-body");
  if (!tbody) return;
  tbody.innerHTML = "";

  adminProducts.forEach(prod => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><img src="${prod.image}" style="width:40px; height:40px; border-radius:6px; object-fit:cover;"></td>
      <td style="font-weight:600; color:#FFF;">${prod.title}</td>
      <td>${prod.category}</td>
      <td style="color:var(--royal-gold); font-weight:700;">₹${prod.price}</td>
      <td>${prod.isVeg ? '<span style="color:#22C55E;">Veg</span>' : '<span style="color:#EF4444;">Non-Veg</span>'}</td>
      <td>
        <button class="table-action-btn" style="background:${prod.inStock ? '#10B981':'#EF4444'}; color:white;" onclick="toggleStock('${prod.id}', ${!prod.inStock})">
          ${prod.inStock ? 'In Stock' : 'Out of Stock'}
        </button>
      </td>
      <td>
        <button class="table-action-btn btn-edit" onclick="editProduct('${prod.id}')"><i class="fa-solid fa-pen"></i></button>
        <button class="table-action-btn btn-delete" onclick="deleteProduct('${prod.id}')"><i class="fa-solid fa-trash"></i></button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function toggleStock(productId, newStatus) {
  const index = adminProducts.findIndex(p => p.id === productId);
  if (index !== -1) {
    adminProducts[index].inStock = newStatus;
    localStorage.setItem("ccc_products", JSON.stringify(adminProducts));
    renderAdminProductsTable();
  }
  try { db.ref("products/" + productId).update({ inStock: newStatus }); } catch(e){}
}

function deleteProduct(productId) {
  if (confirm("Are you sure you want to delete this product?")) {
    adminProducts = adminProducts.filter(p => p.id !== productId);
    localStorage.setItem("ccc_products", JSON.stringify(adminProducts));
    renderAdminProductsTable();
    try { db.ref("products/" + productId).remove(); } catch(e){}
  }
}

function openAddProductModal() {
  document.getElementById("product-modal-title").innerText = "Add New Product";
  document.getElementById("product-form").reset();
  document.getElementById("prod-id").value = "";
  populateCategorySelect();
  document.getElementById("product-modal").classList.add("active");
}

function editProduct(productId) {
  const prod = adminProducts.find(p => p.id === productId);
  if (!prod) return;

  document.getElementById("product-modal-title").innerText = "Edit Product";
  document.getElementById("prod-id").value = prod.id;
  document.getElementById("prod-title").value = prod.title;
  document.getElementById("prod-price").value = prod.price;
  document.getElementById("prod-desc").value = prod.description || "";
  document.getElementById("prod-veg").value = prod.isVeg ? "true" : "false";

  populateCategorySelect(prod.category);
  document.getElementById("product-modal").classList.add("active");
}

function populateCategorySelect(selectedCat = "") {
  const select = document.getElementById("prod-category");
  if (!select) return;
  select.innerHTML = "";
  
  const cats = (Array.isArray(adminCategories) && adminCategories.length > 0) ? adminCategories : DEFAULT_CATEGORIES;
  
  cats.filter(c => c !== "All").forEach(cat => {
    const opt = document.createElement("option");
    opt.value = cat;
    opt.innerText = cat;
    if (cat === selectedCat) opt.selected = true;
    select.appendChild(opt);
  });
}

function closeProductModal() {
  document.getElementById("product-modal").classList.remove("active");
}

// 3. Admin Categories CRUD
function listenToAdminCategories() {
  const localCats = localStorage.getItem("ccc_categories");
  if (localCats) {
    try {
      adminCategories = JSON.parse(localCats);
      renderAdminCategoriesTable();
    } catch(e){}
  } else {
    adminCategories = DEFAULT_CATEGORIES;
    localStorage.setItem("ccc_categories", JSON.stringify(adminCategories));
    renderAdminCategoriesTable();
  }

  db.ref("categories").on("value", (snapshot) => {
    if (snapshot.exists()) {
      adminCategories = snapshot.val();
      localStorage.setItem("ccc_categories", JSON.stringify(adminCategories));
      renderAdminCategoriesTable();
    }
  });
}

function renderAdminCategoriesTable() {
  const tbody = document.getElementById("categories-table-body");
  if (!tbody) return;
  tbody.innerHTML = "";

  if (Array.isArray(adminCategories)) {
    adminCategories.forEach((cat) => {
      if (cat === "All") return;
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td style="color:#FFF; font-weight:600;">${cat}</td>
        <td>
          <button class="table-action-btn btn-delete" onclick="deleteCategoryByName('${cat}')"><i class="fa-solid fa-trash"></i> Delete</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }
}

function deleteCategoryByName(catName) {
  if (confirm(`Delete "${catName}" category?`)) {
    adminCategories = adminCategories.filter(c => c !== catName);
    localStorage.setItem("ccc_categories", JSON.stringify(adminCategories));
    renderAdminCategoriesTable();
    try { db.ref("categories").set(adminCategories); } catch(e){}
  }
}

// 4. Analytics Calculations
function calculateAnalytics() {
  const now = Date.now();
  const dayMs = 86400000;

  const validOrders = adminOrders.filter(o => o.status === "Completed");

  const dailySales = validOrders
    .filter(o => (now - (o.timestamp || 0)) <= dayMs)
    .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  const weeklySales = validOrders
    .filter(o => (now - (o.timestamp || 0)) <= (7 * dayMs))
    .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  const monthlySales = validOrders
    .filter(o => (now - (o.timestamp || 0)) <= (30 * dayMs))
    .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  const itemCounts = {};
  validOrders.forEach(o => {
    if (Array.isArray(o.items)) {
      o.items.forEach(i => {
        if (i && i.title) {
          itemCounts[i.title] = (itemCounts[i.title] || 0) + (Number(i.qty) || 1);
        }
      });
    }
  });

  let topItem = "N/A";
  let maxQty = 0;
  Object.keys(itemCounts).forEach(title => {
    if (itemCounts[title] > maxQty) {
      maxQty = itemCounts[title];
      topItem = `${title} (${maxQty} sold)`;
    }
  });

  const dailyEl = document.getElementById("report-daily-sales");
  const weeklyEl = document.getElementById("report-weekly-sales");
  const monthlyEl = document.getElementById("report-monthly-sales");
  const topEl = document.getElementById("report-top-item");

  if (dailyEl) dailyEl.innerText = `₹${dailySales}`;
  if (weeklyEl) weeklyEl.innerText = `₹${weeklySales}`;
  if (monthlyEl) monthlyEl.innerText = `₹${monthlySales}`;
  if (topEl) topEl.innerText = topItem;
}

// 5. Settings CRUD
function listenToAdminSettings() {
  const localSet = localStorage.getItem("ccc_settings");
  if (localSet) {
    try {
      const data = JSON.parse(localSet);
      populateSettingsForm(data);
    } catch(e){}
  }

  db.ref("settings").on("value", (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.val();
      localStorage.setItem("ccc_settings", JSON.stringify(data));
      populateSettingsForm(data);
    }
  });
}

function populateSettingsForm(data) {
  const nameEl = document.getElementById("set-cafe-name");
  const tagEl = document.getElementById("set-tagline");
  const logoEl = document.getElementById("set-logo-url");
  const addrEl = document.getElementById("set-address");
  const phoneEl = document.getElementById("set-phone");
  const packEl = document.getElementById("set-packaging");

  if (nameEl) nameEl.value = data.cafeName || "";
  if (tagEl) tagEl.value = data.tagline || "";
  if (logoEl) logoEl.value = data.logoUrl || "";
  if (addrEl) addrEl.value = data.address || "";
  if (phoneEl) phoneEl.value = data.contactPhone || "";
  if (packEl) packEl.value = data.packagingCharge || 0;
}

// Setup Form Listeners
function setupAdminForms() {
  const prodForm = document.getElementById("product-form");
  if (prodForm) {
    prodForm.addEventListener("submit", (e) => {
      e.preventDefault();
      
      const prodIdInput = document.getElementById("prod-id").value;
      const id = prodIdInput ? prodIdInput : ("prod_" + Date.now());
      
      const existingProd = adminProducts.find(p => p.id === id);
      const inStockVal = existingProd ? (existingProd.inStock !== undefined ? Boolean(existingProd.inStock) : true) : true;

      const titleVal = (document.getElementById("prod-title").value || "").trim();
      const catVal = document.getElementById("prod-category").value || "Chai";
      const priceVal = Number(document.getElementById("prod-price").value) || 0;
      const descVal = (document.getElementById("prod-desc").value || "").trim();
      const isVegVal = document.getElementById("prod-veg").value === "true";

      if (!titleVal || priceVal <= 0) {
        alert("Please enter a valid title and price!");
        return;
      }

      // Auto Assign Image using Smart Auto-Detector
      const autoImage = autoDetectProductImage(titleVal, catVal);

      const newProd = {
        id: id,
        title: titleVal,
        category: catVal,
        price: priceVal,
        image: autoImage,
        description: descVal,
        isVeg: isVegVal,
        inStock: inStockVal
      };

      // Guaranteed Local Storage Save
      const existingIdx = adminProducts.findIndex(p => p.id === id);
      if (existingIdx !== -1) {
        adminProducts[existingIdx] = newProd;
      } else {
        adminProducts.push(newProd);
      }
      localStorage.setItem("ccc_products", JSON.stringify(adminProducts));
      renderAdminProductsTable();
      closeProductModal();
      alert("Product saved successfully!");

      // Firebase Try
      try { db.ref("products/" + id).set(newProd); } catch(err){}
    });
  }

  const catForm = document.getElementById("add-category-form");
  if (catForm) {
    catForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const catInput = document.getElementById("new-cat-input");
      const val = catInput.value.trim();
      if (val && !adminCategories.includes(val)) {
        adminCategories.push(val);
        localStorage.setItem("ccc_categories", JSON.stringify(adminCategories));
        renderAdminCategoriesTable();
        catInput.value = "";
        try { db.ref("categories").set(adminCategories); } catch(e){}
      }
    });
  }

  const setForm = document.getElementById("settings-form");
  if (setForm) {
    setForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const updated = {
        cafeName: document.getElementById("set-cafe-name").value.trim(),
        tagline: document.getElementById("set-tagline").value.trim(),
        logoUrl: document.getElementById("set-logo-url").value.trim(),
        address: document.getElementById("set-address").value.trim(),
        contactPhone: document.getElementById("set-phone").value.trim(),
        packagingCharge: Number(document.getElementById("set-packaging").value)
      };

      localStorage.setItem("ccc_settings", JSON.stringify(updated));
      alert("Cafe Settings updated successfully!");
      try { db.ref("settings").set(updated); } catch(e){}
    });
  }
}


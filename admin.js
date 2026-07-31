// Admin Dashboard Logic (admin.js)

let adminOrders = [];
let adminProducts = [];
let adminCategories = [];

document.addEventListener("DOMContentLoaded", () => {
  setupAdminAuth();
  startClock();
  setupAdminForms();
});

// Clock
function startClock() {
  setInterval(() => {
    const now = new Date();
    document.getElementById("live-clock").innerText = now.toLocaleTimeString() + " | Live Sync";
  }, 1000);
}

// Authentication
function setupAdminAuth() {
  document.getElementById("admin-login-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const email = document.getElementById("admin-email").value;
    const password = document.getElementById("admin-password").value;

    // Simple Admin Auth / Firebase Auth integration
    if (email === "admin@chaiceremony.com" && password === "admin123") {
      document.getElementById("admin-login-modal").classList.remove("active");
      initAdminDashboard();
    } else {
      alert("Invalid Admin Credentials!");
    }
  });
}

function adminLogout() {
  window.location.reload();
}

// Tab Switching
function switchAdminTab(tabName) {
  document.querySelectorAll(".admin-tab-btn").forEach(btn => btn.classList.remove("active"));
  document.querySelectorAll(".admin-section").forEach(sec => sec.classList.remove("active"));

  event.currentTarget.classList.add("active");
  document.getElementById(`tab-${tabName}`).classList.add("active");
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
  db.ref("orders").on("value", (snapshot) => {
    if (!snapshot.exists()) {
      adminOrders = [];
    } else {
      const data = snapshot.val();
      adminOrders = Object.keys(data).map(key => ({ ...data[key] }));
    }
    renderOrdersStream();
    calculateKPIs();
    calculateAnalytics();
  });
}

function renderOrdersStream() {
  const container = document.getElementById("orders-stream-container");
  container.innerHTML = "";

  // Sort by latest timestamp
  const sorted = [...adminOrders].sort((a, b) => b.timestamp - a.timestamp);

  if (sorted.length === 0) {
    container.innerHTML = `<p style="grid-column: 1/-1; color: #A39485; text-align: center; padding: 40px;">No incoming orders yet.</p>`;
    return;
  }

  sorted.forEach(order => {
    const dateStr = new Date(order.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const itemsListHtml = order.items.map(i => `
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
        <span class="status-badge-pill status-${order.status.toLowerCase()}">${order.status}</span>
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
  db.ref("orders/" + orderId).update({ status: newStatus });
}

// KPI Calculations
function calculateKPIs() {
  const todayStart = new Date().setHours(0,0,0,0);
  const todayOrders = adminOrders.filter(o => o.timestamp >= todayStart);

  const totalSalesToday = todayOrders
    .filter(o => o.status !== "Cancelled")
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const pendingCount = adminOrders.filter(o => ["Received", "Preparing", "Ready"].includes(o.status)).length;
  const completedCount = todayOrders.filter(o => o.status === "Completed").length;

  document.getElementById("kpi-sales").innerText = `₹${totalSalesToday}`;
  document.getElementById("kpi-orders-count").innerText = todayOrders.length;
  document.getElementById("kpi-pending").innerText = pendingCount;
  document.getElementById("kpi-completed").innerText = completedCount;
}

// 2. Admin Products CRUD
function listenToAdminProducts() {
  db.ref("products").on("value", (snapshot) => {
    if (!snapshot.exists()) return;
    const data = snapshot.val();
    adminProducts = Object.keys(data).map(key => ({ id: key, ...data[key] }));
    renderAdminProductsTable();
  });
}

function renderAdminProductsTable() {
  const tbody = document.getElementById("products-table-body");
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
  db.ref("products/" + productId).update({ inStock: newStatus });
}

function deleteProduct(productId) {
  if (confirm("Are you sure you want to delete this product?")) {
    db.ref("products/" + productId).remove();
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
  document.getElementById("prod-image").value = prod.image;
  document.getElementById("prod-desc").value = prod.description || "";
  document.getElementById("prod-veg").value = prod.isVeg ? "true" : "false";

  populateCategorySelect(prod.category);
  document.getElementById("product-modal").classList.add("active");
}

function populateCategorySelect(selectedCat = "") {
  const select = document.getElementById("prod-category");
  select.innerHTML = "";
  adminCategories.filter(c => c !== "All").forEach(cat => {
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
  db.ref("categories").on("value", (snapshot) => {
    if (!snapshot.exists()) return;
    adminCategories = snapshot.val();
    renderAdminCategoriesTable();
  });
}

function renderAdminCategoriesTable() {
  const tbody = document.getElementById("categories-table-body");
  tbody.innerHTML = "";

  adminCategories.forEach((cat, index) => {
    if (cat === "All") return;
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td style="color:#FFF; font-weight:600;">${cat}</td>
      <td>
        <button class="table-action-btn btn-delete" onclick="deleteCategory(${index})"><i class="fa-solid fa-trash"></i> Delete</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function deleteCategory(index) {
  if (confirm("Delete this category?")) {
    const updated = [...adminCategories];
    updated.splice(index, 1);
    db.ref("categories").set(updated);
  }
}

// 4. Analytics Calculations
function calculateAnalytics() {
  const now = Date.now();
  const dayMs = 86400000;

  const validOrders = adminOrders.filter(o => o.status === "Completed");

  const dailySales = validOrders
    .filter(o => (now - o.timestamp) <= dayMs)
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const weeklySales = validOrders
    .filter(o => (now - o.timestamp) <= (7 * dayMs))
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const monthlySales = validOrders
    .filter(o => (now - o.timestamp) <= (30 * dayMs))
    .reduce((sum, o) => sum + o.totalAmount, 0);

  // Best Selling Item Calculation
  const itemCounts = {};
  validOrders.forEach(o => {
    o.items.forEach(i => {
      itemCounts[i.title] = (itemCounts[i.title] || 0) + i.qty;
    });
  });

  let topItem = "N/A";
  let maxQty = 0;
  Object.keys(itemCounts).forEach(title => {
    if (itemCounts[title] > maxQty) {
      maxQty = itemCounts[title];
      topItem = `${title} (${maxQty} sold)`;
    }
  });

  document.getElementById("report-daily-sales").innerText = `₹${dailySales}`;
  document.getElementById("report-weekly-sales").innerText = `₹${weeklySales}`;
  document.getElementById("report-monthly-sales").innerText = `₹${monthlySales}`;
  document.getElementById("report-top-item").innerText = topItem;
}

// 5. Settings CRUD
function listenToAdminSettings() {
  db.ref("settings").on("value", (snapshot) => {
    if (!snapshot.exists()) return;
    const data = snapshot.val();
    document.getElementById("set-cafe-name").value = data.cafeName;
    document.getElementById("set-tagline").value = data.tagline;
    document.getElementById("set-logo-url").value = data.logoUrl;
    document.getElementById("set-address").value = data.address;
    document.getElementById("set-phone").value = data.contactPhone;
    document.getElementById("set-packaging").value = data.packagingCharge;
  });
}

// Setup Form Listeners
function setupAdminForms() {
  // Save Product Form
  document.getElementById("product-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const id = document.getElementById("prod-id").value || ("prod_" + Date.now());
    const newProd = {
      id: id,
      title: document.getElementById("prod-title").value.trim(),
      category: document.getElementById("prod-category").value,
      price: Number(document.getElementById("prod-price").value),
      image: document.getElementById("prod-image").value.trim(),
      description: document.getElementById("prod-desc").value.trim(),
      isVeg: document.getElementById("prod-veg").value === "true",
      inStock: true
    };

    db.ref("products/" + id).set(newProd, (err) => {
      if (!err) {
        closeProductModal();
      } else {
        alert("Error saving product: " + err.message);
      }
    });
  });

  // Add Category Form
  document.getElementById("add-category-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const catInput = document.getElementById("new-cat-input");
    const val = catInput.value.trim();
    if (val && !adminCategories.includes(val)) {
      const updated = [...adminCategories, val];
      db.ref("categories").set(updated, () => {
        catInput.value = "";
      });
    }
  });

  // Save Settings Form
  document.getElementById("settings-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const updated = {
      cafeName: document.getElementById("set-cafe-name").value.trim(),
      tagline: document.getElementById("set-tagline").value.trim(),
      logoUrl: document.getElementById("set-logo-url").value.trim(),
      address: document.getElementById("set-address").value.trim(),
      contactPhone: document.getElementById("set-phone").value.trim(),
      packagingCharge: Number(document.getElementById("set-packaging").value)
    };

    db.ref("settings").set(updated, (err) => {
      if (!err) alert("Cafe Settings updated successfully!");
    });
  });
}

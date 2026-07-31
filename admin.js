// Admin Dashboard Logic (admin.js) - Royal Rajasthani Theme

let adminOrders = [];
let adminProducts = [];
let adminCategories = [];
let knownOrderIds = new Set();
let pageLoadTime = Date.now();
let isAudioUnlocked = false;
let wakeLock = null;

const CURRENT_MENU_VER = "v2_the_cafe";

// 3-Second High Quality Ringtone Audio with Continuous Looping
const notificationAudio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
notificationAudio.loop = true;

document.addEventListener("DOMContentLoaded", () => {
  forceUpdateMenuIfNewVersion();
  setupAdminAuth();
  checkSession();
  startClock();
  setupAdminForms();
  bindGlobalUnlockEvents();
  setupBackgroundKeepAlive();
});

// Force update menu data when new menu version is deployed
function forceUpdateMenuIfNewVersion() {
  if (localStorage.getItem("ccc_menu_version") !== CURRENT_MENU_VER) {
    localStorage.removeItem("ccc_products");
    localStorage.removeItem("ccc_categories");
    localStorage.setItem("ccc_menu_version", CURRENT_MENU_VER);

    if (typeof DEFAULT_MENU_ITEMS !== 'undefined') {
      adminProducts = DEFAULT_MENU_ITEMS;
      localStorage.setItem("ccc_products", JSON.stringify(adminProducts));
      
      try {
        const seedObj = {};
        DEFAULT_MENU_ITEMS.forEach(item => { seedObj[item.id] = item; });
        db.ref("products").set(seedObj);
      } catch(e){}
    }

    if (typeof DEFAULT_CATEGORIES !== 'undefined') {
      adminCategories = DEFAULT_CATEGORIES;
      localStorage.setItem("ccc_categories", JSON.stringify(adminCategories));
      
      try {
        db.ref("categories").set(DEFAULT_CATEGORIES);
      } catch(e){}
    }
  }
}

// Background Anti-Sleep & Wake Lock Engine
async function requestWakeLock() {
  try {
    if ('wakeLock' in navigator) {
      wakeLock = await navigator.wakeLock.request('screen');
    }
  } catch (err) {}
}

function setupBackgroundKeepAlive() {
  // Page Visibility API Handler (Triggers instantly when tab comes from background to foreground)
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      requestWakeLock();
      
      // Auto-reconnect Firebase Cloud
      try {
        db.goOnline();
      } catch(e){}

      // Instant Resync
      syncDataFromLocal();
      evaluateAudioLoop();
    }
  });

  // Firebase Realtime Reconnection Listener
  try {
    db.ref(".info/connected").on("value", (snap) => {
      const liveClockEl = document.getElementById("live-clock");
      if (snap.val() === true) {
        if (liveClockEl) liveClockEl.style.color = "#A39485";
      } else {
        if (liveClockEl) liveClockEl.style.color = "#EF4444";
        try { db.goOnline(); } catch(e){}
      }
    });
  } catch(e){}
}

// Unlock Audio Context on User Touch/Click
function unlockAudioSystem() {
  if (!isAudioUnlocked) {
    notificationAudio.play().then(() => {
      notificationAudio.pause();
      notificationAudio.currentTime = 0;
      isAudioUnlocked = true;
      evaluateAudioLoop();
    }).catch(e => {});
  }
}

function bindGlobalUnlockEvents() {
  const unlocker = () => {
    unlockAudioSystem();
    requestWakeLock();
    document.removeEventListener('click', unlocker);
    document.removeEventListener('touchstart', unlocker);
  };
  document.addEventListener('click', unlocker);
  document.addEventListener('touchstart', unlocker);
}

// Single Instance Audio Loop Evaluator
function evaluateAudioLoop() {
  const hasUnacceptedOrder = adminOrders.some(o => o.status === 'Received');
  
  if (hasUnacceptedOrder) {
    playOrderNotificationTone();
  } else {
    stopOrderNotificationTone();
  }
}

// Play Tone
function playOrderNotificationTone() {
  try {
    if (notificationAudio.paused) {
      notificationAudio.currentTime = 0;
      const playPromise = notificationAudio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => playSynthesizerChime());
      }
    }
  } catch(e) {
    playSynthesizerChime();
  }
}

// Stop Tone
function stopOrderNotificationTone() {
  try {
    notificationAudio.pause();
    notificationAudio.currentTime = 0;
  } catch(e){}
}

// Synthesizer Chime Fallback
function playSynthesizerChime() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(587.33, now);
    osc.frequency.setValueAtTime(880, now + 0.3);
    osc.frequency.setValueAtTime(1174.66, now + 0.7);

    gain.gain.setValueAtTime(0.8, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 3.0);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 3.0);
  } catch(e){}
}

// Push Banner Notification
function requestNotificationPermission() {
  if ("Notification" in window && Notification.permission !== "granted") {
    Notification.requestPermission();
  }
}

function sendPushNotification(orderId, customerName) {
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification("🔔 NEW ORDER RECEIVED!", {
      body: `Order #${orderId} from ${customerName}`,
      icon: "https://cdn-icons-png.flaticon.com/512/924/924514.png",
      requireInteraction: true
    });
  }
}

// Clock
function startClock() {
  setInterval(() => {
    const el = document.getElementById("live-clock");
    if (el) {
      const now = new Date();
      el.innerText = now.toLocaleTimeString() + " | Live Sync Active";
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
      unlockAudioSystem();
      requestWakeLock();
      requestNotificationPermission();
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

// Init Realtime Firebase Sync
function initAdminDashboard() {
  listenToLiveOrders();
  listenToAdminProducts();
  listenToAdminCategories();
}

function syncDataFromLocal() {
  try {
    const savedOrders = JSON.parse(localStorage.getItem("ccc_orders")) || [];
    adminOrders = savedOrders;
    adminOrders.forEach(o => knownOrderIds.add(o.orderId));
    renderOrdersStream();
    calculateKPIs();
    calculateAnalytics();
  } catch(e){}
}

// 1. Live Orders Listener
function listenToLiveOrders() {
  syncDataFromLocal();

  const ordersRef = db.ref("orders");

  ordersRef.on("child_added", (snapshot) => {
    const order = snapshot.val();
    if (!order || !order.orderId) return;

    if (!knownOrderIds.has(order.orderId)) {
      knownOrderIds.add(order.orderId);
      
      const existingIdx = adminOrders.findIndex(o => o.orderId === order.orderId);
      if (existingIdx === -1) {
        adminOrders.unshift(order);
      } else {
        adminOrders[existingIdx] = order;
      }

      localStorage.setItem("ccc_orders", JSON.stringify(adminOrders));
      renderOrdersStream();
      calculateKPIs();
      calculateAnalytics();

      if (order.timestamp && order.timestamp > (pageLoadTime - 10000)) {
        evaluateAudioLoop();
        sendPushNotification(order.orderId, order.customerName || "Customer");
      }
    }
  });

  ordersRef.on("child_changed", (snapshot) => {
    const updatedOrder = snapshot.val();
    if (!updatedOrder || !updatedOrder.orderId) return;

    const idx = adminOrders.findIndex(o => o.orderId === updatedOrder.orderId);
    if (idx !== -1) {
      adminOrders[idx] = updatedOrder;
      localStorage.setItem("ccc_orders", JSON.stringify(adminOrders));
      renderOrdersStream();
      calculateKPIs();
      calculateAnalytics();
      evaluateAudioLoop();
    }
  });
}

// iPhone Slide to Accept Handler
function handleSlideAccept(sliderInput, orderId) {
  if (sliderInput.value >= 85) {
    updateOrderStatus(orderId, 'Preparing');
  }
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

    const isNewIncoming = (order.status === 'Received');

    const card = document.createElement("div");
    card.className = "admin-order-card";
    card.style.border = isNewIncoming ? "2px solid #22C55E" : "1px solid var(--border-gold)";

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

      ${isNewIncoming ? `
        <!-- iPhone Call Pickup Slide-to-Accept -->
        <div class="ios-slider-box">
          <span class="ios-slider-text">Slide to Accept Order ➔</span>
          <input type="range" min="0" max="100" value="0" class="ios-range-input" oninput="handleSlideAccept(this, '${order.orderId}')">
        </div>
        <button class="btn-status-action btn-cancel" style="margin-top:6px; width:100%;" onclick="updateOrderStatus('${order.orderId}', 'Cancelled')">Cancel Order</button>
      ` : `
        <!-- Standard Order Action Stream -->
        <div class="action-btn-group">
          ${order.status === 'Preparing' ? `<button class="btn-status-action btn-ready" onclick="updateOrderStatus('${order.orderId}', 'Ready')">Mark Ready</button>` : ''}
          ${order.status === 'Ready' ? `<button class="btn-status-action btn-complete" onclick="updateOrderStatus('${order.orderId}', 'Completed')">Complete Order</button>` : ''}
          ${order.status !== 'Completed' && order.status !== 'Cancelled' ? `<button class="btn-status-action btn-cancel" onclick="updateOrderStatus('${order.orderId}', 'Cancelled')">Cancel</button>` : ''}
        </div>
      `}
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
    evaluateAudioLoop();
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

// Smart Image Auto-Detector
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
  } else if (text.includes("dessert") || text.includes("kulfi") || text.includes("falooda") || text.includes("sweet")) {
    return "https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=600&q=80";
  } else if (text.includes("drink") || text.includes("soda") || text.includes("lime") || text.includes("cold")) {
    return "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80";
  }

  return "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=600&q=80";
}

// 2. Admin Products CRUD
function listenToAdminProducts() {
  const localProds = localStorage.getItem("ccc_products");
  if (localProds) {
    try {
      adminProducts = JSON.parse(localProds);
      renderAdminProductsTable();
    } catch(e){}
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
      const catVal = document.getElementById("prod-category").value || "Tea Special";
      const priceVal = Number(document.getElementById("prod-price").value) || 0;
      const descVal = (document.getElementById("prod-desc").value || "").trim();
      const isVegVal = document.getElementById("prod-veg").value === "true";

      if (!titleVal || priceVal <= 0) {
        alert("Please enter a valid title and price!");
        return;
      }

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
}

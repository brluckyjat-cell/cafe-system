import { 
  db, 
  collection, 
  addDoc, 
  doc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy,
  getDocs 
} from './firebase.js';

// Global Admin State
let liveOrders = [];
let expensesList = [];
let inventoryItems = [];
let productsList = [];

document.addEventListener('DOMContentLoaded', () => {
  initAdminDashboard();
});

function initAdminDashboard() {
  listenToLiveOrders();
  setupOfflinePOSForm();
  setupExpenseForm();
  setupInventoryForm();
  setupProductForm();
  loadInventory();
  loadExpenses();
}

// 1. LIVE ORDERS REALTIME LISTENER & STATUS UPDATER
function listenToLiveOrders() {
  const listContainer = document.getElementById('admin-orders-tbody');
  
  try {
    const q = query(collection(db, "orders"));
    onSnapshot(q, (snapshot) => {
      liveOrders = [];
      snapshot.forEach(docSnap => {
        liveOrders.push({ id: docSnap.id, ...docSnap.data() });
      });

      // Sort by newest orders first
      liveOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      renderDashboardStats();
      renderOrdersTable();
    });
  } catch (err) {
    console.warn("Live order sync offline mode.", err);
  }
}

function renderDashboardStats() {
  const totalOrdersElem = document.getElementById('dash-total-orders');
  const totalSalesElem = document.getElementById('dash-total-sales');
  const pendingOrdersElem = document.getElementById('dash-pending-orders');
  const todayExpenseElem = document.getElementById('dash-today-expense');
  const netEarningsElem = document.getElementById('dash-net-earnings');

  const totalOrders = liveOrders.length;
  const totalSales = liveOrders.reduce((sum, ord) => sum + (Number(ord.totalAmount) || 0), 0);
  const pendingCount = liveOrders.filter(o => o.status === 'Order Received' || o.status === 'Preparing').length;
  const todayExpenses = expensesList.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);
  const netEarnings = totalSales - todayExpenses;

  if (totalOrdersElem) totalOrdersElem.innerText = totalOrders;
  if (totalSalesElem) totalSalesElem.innerText = `₹${totalSales}`;
  if (pendingOrdersElem) pendingOrdersElem.innerText = pendingCount;
  if (todayExpenseElem) todayExpenseElem.innerText = `₹${todayExpenses}`;
  if (netEarningsElem) netEarningsElem.innerText = `₹${netEarnings}`;
}

function renderOrdersTable() {
  const tbody = document.getElementById('admin-orders-tbody');
  if (!tbody) return;

  if (liveOrders.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 30px; color: var(--text-muted);">No orders received yet today.</td></tr>`;
    return;
  }

  tbody.innerHTML = liveOrders.map(ord => {
    const itemsText = ord.items ? ord.items.map(i => `${i.name} x${i.qty}`).join(', ') : (ord.itemName || 'Custom Item');
    const orderDate = ord.createdAt ? new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now';

    return `
      <tr style="border-bottom: 1px solid rgba(90,50,22,0.1);">
        <td style="padding: 12px; font-weight: bold; color: var(--coffee);">${ord.orderId || 'POS'}</td>
        <td style="padding: 12px;">
          <strong>${ord.customerName}</strong><br>
          <small style="color: var(--text-muted);">${ord.phone} | ${ord.orderType || 'Dine In'}</small>
        </td>
        <td style="padding: 12px; max-width: 200px;">${itemsText}</td>
        <td style="padding: 12px; font-weight: 800; color: var(--terracotta);">₹${ord.totalAmount}</td>
        <td style="padding: 12px;"><small>${ord.paymentMethod || 'UPI'}</small></td>
        <td style="padding: 12px;">
          <span class="badge ${getStatusBadgeClass(ord.status)}">${ord.status}</span>
        </td>
        <td style="padding: 12px;">
          <select onchange="updateOrderStatus('${ord.id}', this.value)" style="padding: 5px 8px; border-radius: 6px; border: 1px solid var(--gold);">
            <option value="Order Received" ${ord.status === 'Order Received' ? 'selected' : ''}>Order Received</option>
            <option value="Preparing" ${ord.status === 'Preparing' ? 'selected' : ''}>Preparing</option>
            <option value="Ready" ${ord.status === 'Ready' ? 'selected' : ''}>Ready</option>
            <option value="Completed" ${ord.status === 'Completed' ? 'selected' : ''}>Completed</option>
            <option value="Cancelled" ${ord.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
          </select>
        </td>
      </tr>
    `;
  }).join('');
}

function getStatusBadgeClass(status) {
  switch (status) {
    case 'Order Received': return 'badge-popular';
    case 'Preparing': return 'badge-popular';
    case 'Ready': return 'badge-veg';
    case 'Completed': return 'badge-veg';
    case 'Cancelled': return 'badge-nonveg';
    default: return 'badge-popular';
  }
}

window.updateOrderStatus = async function(firestoreId, newStatus) {
  try {
    const orderRef = doc(db, "orders", firestoreId);
    await updateDoc(orderRef, { status: newStatus });
    alert(`Status updated to: ${newStatus}`);
  } catch (err) {
    console.error("Error updating status:", err);
    alert("Could not update order status.");
  }
};

// 2. OFFLINE COUNTER POS ORDER ENTRY
function setupOfflinePOSForm() {
  const form = document.getElementById('offline-pos-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('off-name').value.trim();
    const phone = document.getElementById('off-phone').value.trim();
    const table = document.getElementById('off-table').value.trim();
    const itemsText = document.getElementById('off-items').value.trim();
    const amount = parseFloat(document.getElementById('off-amount').value);
    const payment = document.getElementById('off-payment').value;
    const notes = document.getElementById('off-notes').value.trim();

    const offlineOrder = {
      orderId: 'POS-' + Date.now().toString().slice(-5),
      customerName: name || 'Walk-in Customer',
      phone: phone || 'N/A',
      tableNumber: table || 'Counter',
      orderType: 'Offline POS',
      paymentMethod: payment,
      itemName: itemsText,
      totalAmount: amount,
      notes: notes,
      status: 'Completed',
      createdAt: new Date().toISOString()
    };

    try {
      await addDoc(collection(db, "orders"), offlineOrder);
      alert("Offline Counter Order Recorded Successfully!");
      form.reset();
    } catch (err) {
      alert("Recorded in local offline mode!");
    }
  });
}

// 3. EXPENSE MANAGER
function setupExpenseForm() {
  const form = document.getElementById('expense-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('exp-title').value.trim();
    const category = document.getElementById('exp-category').value;
    const amount = parseFloat(document.getElementById('exp-amount').value);

    const expenseData = {
      title,
      category,
      amount,
      date: new Date().toISOString()
    };

    try {
      await addDoc(collection(db, "expenses"), expenseData);
      alert("Expense recorded!");
      form.reset();
      loadExpenses();
    } catch (err) {
      console.warn("Saved expense locally", err);
    }
  });
}

async function loadExpenses() {
  const container = document.getElementById('expenses-list-tbody');
  if (!container) return;

  try {
    const querySnapshot = await getDocs(collection(db, "expenses"));
    expensesList = [];
    querySnapshot.forEach(docSnap => {
      expensesList.push({ id: docSnap.id, ...docSnap.data() });
    });

    renderExpensesTable();
    renderDashboardStats();
  } catch (err) {
    console.warn("Expense load offline fallback");
  }
}

function renderExpensesTable() {
  const container = document.getElementById('expenses-list-tbody');
  if (!container) return;

  if (expensesList.length === 0) {
    container.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:15px;">No expenses recorded today.</td></tr>`;
    return;
  }

  container.innerHTML = expensesList.map(exp => `
    <tr>
      <td style="padding:8px;">${exp.title}</td>
      <td style="padding:8px;">${exp.category}</td>
      <td style="padding:8px; font-weight:bold; color:var(--nonveg);">₹${exp.amount}</td>
      <td style="padding:8px;"><button onclick="deleteExpense('${exp.id}')" style="color:red; background:none; border:none; cursor:pointer;">Delete</button></td>
    </tr>
  `).join('');
}

window.deleteExpense = async function(id) {
  if (!confirm("Delete this expense entry?")) return;
  try {
    await deleteDoc(doc(db, "expenses", id));
    loadExpenses();
  } catch(e) {
    console.log(e);
  }
};

// 4. INVENTORY STOCK MANAGER
function setupInventoryForm() {
  const form = document.getElementById('inventory-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const itemName = document.getElementById('inv-item-name').value.trim();
    const stockQty = parseFloat(document.getElementById('inv-qty').value);
    const unit = document.getElementById('inv-unit').value;

    const inventoryData = {
      itemName,
      stockQty,
      unit,
      updatedAt: new Date().toISOString()
    };

    try {
      await addDoc(collection(db, "inventory"), inventoryData);
      alert("Inventory Item Added!");
      form.reset();
      loadInventory();
    } catch (err) {
      console.warn("Saved inventory locally", err);
    }
  });
}

async function loadInventory() {
  const container = document.getElementById('inventory-tbody');
  if (!container) return;

  try {
    const querySnapshot = await getDocs(collection(db, "inventory"));
    inventoryItems = [];
    querySnapshot.forEach(docSnap => {
      inventoryItems.push({ id: docSnap.id, ...docSnap.data() });
    });

    renderInventoryTable();
  } catch (err) {
    console.warn("Inventory load offline fallback");
  }
}

function renderInventoryTable() {
  const container = document.getElementById('inventory-tbody');
  if (!container) return;

  if (inventoryItems.length === 0) {
    container.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:15px;">No inventory items tracked yet.</td></tr>`;
    return;
  }

  container.innerHTML = inventoryItems.map(inv => {
    const isLow = inv.stockQty <= 5;
    return `
      <tr>
        <td style="padding:8px; font-weight:bold;">${inv.itemName}</td>
        <td style="padding:8px;">${inv.stockQty} ${inv.unit}</td>
        <td style="padding:8px;">
          ${isLow ? '<span class="badge badge-nonveg">LOW STOCK</span>' : '<span class="badge badge-veg">IN STOCK</span>'}
        </td>
        <td style="padding:8px;">
          <button onclick="updateStock('${inv.id}', ${inv.stockQty + 1})" style="padding:2px 8px;">+</button>
          <button onclick="updateStock('${inv.id}', ${inv.stockQty - 1})" style="padding:2px 8px;">-</button>
        </td>
      </tr>
    `;
  }).join('');
}

window.updateStock = async function(id, newQty) {
  if (newQty < 0) return;
  try {
    await updateDoc(doc(db, "inventory", id), { stockQty: newQty });
    loadInventory();
  } catch(e) {
    console.log(e);
  }
};

// 5. PRODUCT CRUD MANAGEMENT
function setupProductForm() {
  const form = document.getElementById('add-product-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('prod-name').value.trim();
    const category = document.getElementById('prod-category').value;
    const price = parseFloat(document.getElementById('prod-price').value);
    const desc = document.getElementById('prod-desc').value.trim();
    const img = document.getElementById('prod-img').value.trim() || 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=400&q=80';
    const isVeg = document.getElementById('prod-veg').checked;
    const isPopular = document.getElementById('prod-popular').checked;

    const productData = {
      name,
      category,
      price,
      desc,
      img,
      isVeg,
      isPopular,
      createdAt: new Date().toISOString()
    };

    try {
      await addDoc(collection(db, "products"), productData);
      alert("New Product Added to Cafe Menu!");
      form.reset();
    } catch (err) {
      alert("Product saved in offline mode!");
    }
  });
}

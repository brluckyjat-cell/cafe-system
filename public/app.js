import { db, collection, getDocs, addDoc } from './firebase.js';

// Application State
let cart = JSON.parse(localStorage.getItem('ccc_cart')) || [];
let productsList = [];

// Seed Products Fallback (Covers all required menu categories if Firestore is empty)
const defaultProducts = [
  { 
    id: '1', 
    name: 'Kulhad Masala Chai', 
    category: 'Chai & Coffee', 
    price: 30, 
    isVeg: true, 
    isPopular: true, 
    desc: 'Authentic Rajasthani spiced clay-pot tea brewed with freshly crushed ginger & spices.', 
    img: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=400&q=80' 
  },
  { 
    id: '2', 
    name: 'Kesar Elaichi Milk Chai', 
    category: 'Chai & Coffee', 
    price: 45, 
    isVeg: true, 
    isPopular: true, 
    desc: 'Rich saffron and green cardamom infused royal Rajasthani milk tea.', 
    img: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=400&q=80' 
  },
  { 
    id: '3', 
    name: 'Aloo Pyaz Mirchi Patties', 
    category: 'Patties', 
    price: 40, 
    isVeg: true, 
    isPopular: false, 
    desc: 'Crispy multi-layered puff pastry stuffed with spiced Jaipur potato filling.', 
    img: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=400&q=80' 
  },
  { 
    id: '4', 
    name: 'Royal Cheese Paneer Burger', 
    category: 'Burgers', 
    price: 90, 
    isVeg: true, 
    isPopular: true, 
    desc: 'Herbed veggie patty layered with melted cheese, paneer slice, and secret house sauce.', 
    img: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&q=80' 
  },
  { 
    id: '5', 
    name: 'Tandoori Paneer Pizza (8 Inch)', 
    category: 'Pizza', 
    price: 180, 
    isVeg: true, 
    isPopular: true, 
    desc: 'Hand-tossed thin crust pizza with marinated paneer cubes, paprika, and mozzarella.', 
    img: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=400&q=80' 
  },
  { 
    id: '6', 
    name: 'Bombay Masala Grill Sandwich', 
    category: 'Sandwich', 
    price: 75, 
    isVeg: true, 
    isPopular: false, 
    desc: 'Triple layer grilled sandwich filled with mint chutney, potato masala, and veggies.', 
    img: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=400&q=80' 
  },
  { 
    id: '7', 
    name: 'Peri Peri Crispy Fries', 
    category: 'French Fries', 
    price: 80, 
    isVeg: true, 
    isPopular: true, 
    desc: 'Golden potato fries tossed in tangy fiery Peri Peri spice blend.', 
    img: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=400&q=80' 
  },
  { 
    id: '8', 
    name: 'Kulhad Cold Coffee with Ice Cream', 
    category: 'Cold Drinks', 
    price: 95, 
    isVeg: true, 
    isPopular: true, 
    desc: 'Thick creamy blended cold coffee topped with vanilla scoop in traditional clay mug.', 
    img: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=400&q=80' 
  }
];

document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

function initApp() {
  renderCartBadge();
  setupEventListeners();
  loadProducts();
}

function setupEventListeners() {
  const cartBtn = document.getElementById('cart-toggle-btn');
  const closeCartBtn = document.getElementById('close-cart-btn');
  const overlay = document.getElementById('cart-overlay');
  
  if (cartBtn) cartBtn.addEventListener('click', () => toggleCartDrawer(true));
  if (closeCartBtn) closeCartBtn.addEventListener('click', () => toggleCartDrawer(false));
  if (overlay) overlay.addEventListener('click', () => toggleCartDrawer(false));

  const searchInput = document.getElementById('product-search');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => filterProducts(e.target.value));
  }
}

async function loadProducts() {
  const grid = document.getElementById('products-grid');
  if (!grid) return;

  try {
    const querySnapshot = await getDocs(collection(db, "products"));
    productsList = [];
    querySnapshot.forEach((docSnap) => {
      productsList.push({ id: docSnap.id, ...docSnap.data() });
    });

    if (productsList.length === 0) {
      productsList = defaultProducts;
    }

    renderProducts(productsList);
  } catch (err) {
    console.warn("Using fallback seed menu items.", err);
    productsList = defaultProducts;
    renderProducts(productsList);
  }
}

function renderProducts(items) {
  const grid = document.getElementById('products-grid');
  if (!grid) return;

  if (items.length === 0) {
    grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 50px 20px; color: var(--text-muted);">
      <h3>No items found matching your selection</h3>
      <p>Try searching for something else or change the category filter.</p>
    </div>`;
    return;
  }

  grid.innerHTML = items.map(item => `
    <div class="rajasthani-card product-card">
      <div class="product-img-wrapper">
        <img src="${item.img}" alt="${item.name}" class="product-img" loading="lazy">
        <div class="badge-container">
          <span class="badge ${item.isVeg ? 'badge-veg' : 'badge-nonveg'}">${item.isVeg ? 'VEG' : 'NON-VEG'}</span>
          ${item.isPopular ? '<span class="badge badge-popular">★ POPULAR</span>' : ''}
        </div>
      </div>
      <div class="product-details">
        <div>
          <h3 class="product-title">${item.name}</h3>
          <p class="product-desc">${item.desc}</p>
        </div>
        <div class="product-bottom">
          <div class="product-price">₹${item.price}</div>
          <button class="add-cart-btn" onclick="addToCart('${item.id}')">Add +</button>
        </div>
      </div>
    </div>
  `).join('');
}

window.filterCategory = function(category, element) {
  document.querySelectorAll('.category-chip').forEach(c => c.classList.remove('active'));
  if (element) {
    element.classList.add('active');
  } else if (event && event.target) {
    event.target.classList.add('active');
  }

  if (category === 'All') {
    renderProducts(productsList);
  } else {
    const filtered = productsList.filter(p => p.category === category);
    renderProducts(filtered);
  }
};

function filterProducts(searchTerm) {
  const term = searchTerm.toLowerCase().trim();
  const filtered = productsList.filter(p => 
    p.name.toLowerCase().includes(term) || 
    p.category.toLowerCase().includes(term) ||
    p.desc.toLowerCase().includes(term)
  );
  renderProducts(filtered);
}

window.addToCart = function(productId) {
  const product = productsList.find(p => p.id === productId);
  if (!product) return;

  const existing = cart.find(item => item.id === productId);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ ...product, qty: 1 });
  }

  saveCart();
  showToast(`Added ${product.name} to cart!`);
  toggleCartDrawer(true);
};

function saveCart() {
  localStorage.setItem('ccc_cart', JSON.stringify(cart));
  renderCartBadge();
  renderCartDrawer();
}

function renderCartBadge() {
  const count = cart.reduce((total, item) => total + item.qty, 0);
  const badge = document.getElementById('cart-count');
  if (badge) badge.innerText = count;
}

function toggleCartDrawer(forceOpen = false) {
  const drawer = document.getElementById('cart-drawer');
  const overlay = document.getElementById('cart-overlay');
  if (!drawer || !overlay) return;

  if (forceOpen === true) {
    drawer.classList.add('active');
    overlay.classList.add('active');
  } else {
    drawer.classList.toggle('active');
    overlay.classList.toggle('active');
  }
  renderCartDrawer();
}

function renderCartDrawer() {
  const container = document.getElementById('cart-items-container');
  const totalElem = document.getElementById('cart-total-amount');
  if (!container) return;

  if (cart.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 60px 20px; color: var(--text-muted);">
        <div style="font-size: 3rem; margin-bottom: 10px;">☕</div>
        <p style="font-weight: 600;">Your cart is empty.</p>
        <p style="font-size: 0.85rem; margin-top: 5px;">Explore our menu and add your favorite Rajasthani treats!</p>
      </div>`;
    if (totalElem) totalElem.innerText = '₹0';
    return;
  }

  let total = 0;
  container.innerHTML = cart.map((item, index) => {
    const itemTotal = item.price * item.qty;
    total += itemTotal;
    return `
      <div class="cart-item">
        <img src="${item.img}" class="cart-item-img" alt="${item.name}">
        <div class="cart-item-details">
          <div class="cart-item-title">${item.name}</div>
          <div class="cart-item-price">₹${item.price} x ${item.qty} = ₹${itemTotal}</div>
        </div>
        <div class="qty-control">
          <button class="qty-btn" onclick="updateQty(${index}, -1)">-</button>
          <span class="qty-val">${item.qty}</span>
          <button class="qty-btn" onclick="updateQty(${index}, 1)">+</button>
        </div>
      </div>
    `;
  }).join('');

  if (totalElem) totalElem.innerText = `₹${total}`;
}

window.updateQty = function(index, delta) {
  cart[index].qty += delta;
  if (cart[index].qty <= 0) {
    cart.splice(index, 1);
  }
  saveCart();
};

window.openCheckoutModal = function() {
  if (cart.length === 0) {
    showToast("Your cart is empty!");
    return;
  }
  toggleCartDrawer(false);
  const checkoutModal = document.getElementById('checkout-modal');
  if (checkoutModal) checkoutModal.classList.add('active');
};

window.closeCheckoutModal = function() {
  const checkoutModal = document.getElementById('checkout-modal');
  if (checkoutModal) checkoutModal.classList.remove('active');
};

window.processOrder = async function(e) {
  e.preventDefault();
  const nameInput = document.getElementById('cust-name');
  const phoneInput = document.getElementById('cust-phone');
  const typeSelect = document.getElementById('order-type');
  const tableInput = document.getElementById('table-no');
  const paymentSelect = document.getElementById('payment-method');

  const name = nameInput.value.trim();
  const phone = phoneInput.value.trim();
  const type = typeSelect ? typeSelect.value : 'Table';
  const table = tableInput ? tableInput.value.trim() : 'N/A';
  const payment = paymentSelect ? paymentSelect.value : 'UPI';

  // Indian Mobile Number Strict Validation (10 Digits starting with 6,7,8,9)
  const phoneRegex = /^[6-9]\d{9}$/;
  if (!phoneRegex.test(phone)) {
    showToast("Please enter a valid 10-digit Indian Mobile Number");
    return;
  }

  const orderId = 'CCC-' + Date.now().toString().slice(-6);
  const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

  const orderData = {
    orderId,
    customerName: name,
    phone,
    orderType: type,
    tableNumber: type === 'Table' ? (table || 'Table 1') : 'Parcel',
    paymentMethod: payment,
    items: cart,
    totalAmount,
    status: 'Order Received',
    createdAt: new Date().toISOString()
  };

  try {
    await addDoc(collection(db, "orders"), orderData);
  } catch (err) {
    console.warn("Firestore offline - storing local fallback order ID.", err);
  }

  localStorage.setItem('ccc_last_order', orderId);
  cart = [];
  saveCart();
  closeCheckoutModal();

  // Redirect to order tracking page
  window.location.href = `order-tracking.html?orderId=${orderId}`;
};

function showToast(msg) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerText = msg;
  container.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 3000);
}

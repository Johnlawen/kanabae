import './style.css';

// Cart State (Persist across pages)
let cart = JSON.parse(localStorage.getItem('alamiya_cart')) || [];

// Inject Cart Sidebar HTML
const cartContainer = document.getElementById('cart-sidebar-container');
if (cartContainer) {
  cartContainer.innerHTML = `
    <!-- Cart Sidebar -->
    <div class="cart-sidebar" id="cart-sidebar" style="right: auto; left: -400px; transition: left 0.4s cubic-bezier(0.77, 0, 0.175, 1);">
      <div class="cart-header">
        <h2>סל הקניות שלך</h2>
        <button class="close-cart" id="close-cart">&times;</button>
      </div>
      <div class="cart-items" id="cart-items">
        <!-- Items injected here -->
      </div>
      <div class="cart-footer">
        <div class="cart-total" style="display:flex; justify-content:space-between; font-weight:700; font-size:1.2rem; margin-bottom:1rem;">
          <span>סה"כ:</span>
          <span id="cart-total-price">₪0</span>
        </div>
        <button class="checkout-btn" style="width:100%; padding:1rem; background:var(--accent); color:#fff; border:none; border-radius:50px; font-weight:bold; cursor:pointer;">המשך לתשלום</button>
      </div>
    </div>
    <div class="cart-overlay" id="cart-overlay"></div>
  `;
}

// DOM Elements
const cartIcon = document.getElementById('cart-icon');
const cartSidebar = document.getElementById('cart-sidebar');
const closeCartBtn = document.getElementById('close-cart');
const cartOverlay = document.getElementById('cart-overlay');
const cartItemsContainer = document.getElementById('cart-items');
const cartCountElements = document.querySelectorAll('.cart-count');
const cartTotalPrice = document.getElementById('cart-total-price');
const addToCartButtons = document.querySelectorAll('.add-to-cart-btn');

// Toggle Cart Sidebar
function toggleCart() {
  if (cartSidebar.style.left === '0px') {
    cartSidebar.style.left = '-400px';
    cartOverlay.classList.remove('show');
    document.body.style.overflow = '';
  } else {
    cartSidebar.style.left = '0px';
    cartOverlay.classList.add('show');
    document.body.style.overflow = 'hidden';
  }
}

if (cartIcon) cartIcon.addEventListener('click', toggleCart);
if (closeCartBtn) closeCartBtn.addEventListener('click', toggleCart);
if (cartOverlay) cartOverlay.addEventListener('click', toggleCart);

// Save to LocalStorage
function saveCart() {
  localStorage.setItem('alamiya_cart', JSON.stringify(cart));
}

// Update Cart UI
function updateCartUI() {
  // Update badges
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  cartCountElements.forEach(el => el.textContent = totalItems);

  // Update total price
  const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  if (cartTotalPrice) {
    cartTotalPrice.textContent = `₪${totalPrice.toLocaleString()}`;
  }

  if (!cartItemsContainer) return;
  cartItemsContainer.innerHTML = '';
  
  if (cart.length === 0) {
    cartItemsContainer.innerHTML = '<p style="text-align:center; color:var(--text-muted); margin-top:2rem;">הסל שלך ריק כרגע.</p>';
    return;
  }

  cart.forEach(item => {
    const itemEl = document.createElement('div');
    itemEl.style.display = 'flex';
    itemEl.style.gap = '1rem';
    itemEl.style.paddingBottom = '1rem';
    itemEl.style.borderBottom = '1px solid var(--border-color)';
    itemEl.style.alignItems = 'center';

    itemEl.innerHTML = `
      <img src="${item.img}" alt="${item.name}" style="width:70px; height:70px; border-radius:8px; object-fit:cover;">
      <div style="flex:1;">
        <h4 style="font-size:1rem; margin-bottom:0.25rem;">${item.name}</h4>
        <div style="color:var(--accent); font-weight:600;">₪${item.price.toLocaleString()} x ${item.quantity}</div>
        <button class="remove-item" data-id="${item.id}" style="background:none; border:none; color:var(--text-muted); text-decoration:underline; font-size:0.85rem; cursor:pointer; margin-top:0.25rem;">הסר</button>
      </div>
    `;
    cartItemsContainer.appendChild(itemEl);
  });

  // Re-attach remove listeners
  document.querySelectorAll('.remove-item').forEach(btn => {
    btn.addEventListener('click', (e) => {
      removeFromCart(e.target.dataset.id);
    });
  });
}

// Add to Cart Logic
function addToCart(product) {
  const existingItem = cart.find(item => item.id === product.id);
  
  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({ ...product, quantity: 1 });
  }
  
  saveCart();
  updateCartUI();
  
  // Show sidebar when adding item
  if (cartSidebar && cartSidebar.style.left !== '0px') {
    toggleCart();
  }
}

// Remove from Cart
function removeFromCart(id) {
  cart = cart.filter(item => item.id !== id);
  saveCart();
  updateCartUI();
}

// Attach Event Listeners to Buttons
addToCartButtons.forEach(button => {
  button.addEventListener('click', (e) => {
    // Traverse up if they clicked the SVG inside the button
    const btn = e.target.closest('.add-to-cart-btn');
    if (!btn) return;

    const product = {
      id: btn.dataset.id,
      name: btn.dataset.name,
      price: parseInt(btn.dataset.price),
      img: btn.dataset.img
    };

    addToCart(product);
  });
});

// Initial Render
updateCartUI();

/* --- PDP (Product Details Page) Logic --- */

// Handle clicks on product cards to navigate to PDP
document.querySelectorAll('.product-card').forEach(card => {
  card.addEventListener('click', (e) => {
    // Ignore clicks on wishlist or add to cart buttons
    if (e.target.closest('.wishlist-btn') || e.target.closest('.add-to-cart-btn')) {
      return;
    }

    // Find the add-to-cart btn inside this card to extract data
    const btn = card.querySelector('.add-to-cart-btn');
    if (!btn) return;

    const product = {
      id: btn.dataset.id,
      name: btn.dataset.name,
      price: parseInt(btn.dataset.price),
      img: btn.dataset.img
    };

    // Save to sessionStorage
    sessionStorage.setItem('alamiya_current_product', JSON.stringify(product));
    
    // Redirect to PDP
    window.location.href = './product.html';
  });
});

// Initialize PDP if we are on the product.html page
if (window.location.pathname.includes('product.html')) {
  const currentProductJSON = sessionStorage.getItem('alamiya_current_product');
  
  if (currentProductJSON) {
    const product = JSON.parse(currentProductJSON);
    
    // Populate Data
    const titleEl = document.getElementById('pdp-title');
    const priceEl = document.getElementById('pdp-price');
    const crumbEl = document.getElementById('pdp-crumb-title');
    const mainImgEl = document.getElementById('pdp-main-image');
    
    if (titleEl) titleEl.textContent = product.name;
    if (crumbEl) crumbEl.textContent = product.name;
    if (priceEl) priceEl.textContent = `₪${product.price.toLocaleString()}`;
    if (mainImgEl) mainImgEl.src = product.img;
    
    // Also update all thumbnails to use this image as a placeholder for now
    document.querySelectorAll('.pdp-thumb').forEach(thumb => {
      thumb.src = product.img;
    });

    // Handle PDP Add to Cart Button
    const pdpAddBtn = document.getElementById('pdp-add-to-cart-btn');
    const qtyInput = document.getElementById('pdp-qty-input');
    
    if (pdpAddBtn && qtyInput) {
      pdpAddBtn.addEventListener('click', () => {
        const qty = parseInt(qtyInput.value) || 1;
        
        const existingItem = cart.find(item => item.id === product.id);
        if (existingItem) {
          existingItem.quantity += qty;
        } else {
          cart.push({ ...product, quantity: qty });
        }
        
        saveCart();
        updateCartUI();
        
        // Open Cart
        if (cartSidebar && cartSidebar.style.left !== '0px') {
          toggleCart();
        }
      });
    }
  }

  // Handle Quantity Selector +/-
  const btnMinus = document.getElementById('pdp-qty-minus');
  const btnPlus = document.getElementById('pdp-qty-plus');
  const qtyInput = document.getElementById('pdp-qty-input');
  
  if (btnMinus && btnPlus && qtyInput) {
    btnMinus.addEventListener('click', () => {
      let val = parseInt(qtyInput.value) || 1;
      if (val > 1) qtyInput.value = val - 1;
    });
    btnPlus.addEventListener('click', () => {
      let val = parseInt(qtyInput.value) || 1;
      qtyInput.value = val + 1;
    });
  }

  // Handle Color/Size Selections (Visual Only)
  document.querySelectorAll('.color-swatch').forEach(swatch => {
    swatch.addEventListener('click', (e) => {
      document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
      e.target.classList.add('active');
    });
  });
  
  document.querySelectorAll('.size-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
    });
  });

  // Handle Accordion
  document.querySelectorAll('.accordion-header').forEach(header => {
    header.addEventListener('click', () => {
      const item = header.parentElement;
      item.classList.toggle('active');
    });
  });
}

// Mobile Hamburger Menu
document.addEventListener('DOMContentLoaded', () => {
  const hamburgerIcons = document.querySelectorAll('.hamburger-icon');
  hamburgerIcons.forEach(hamburger => {
    hamburger.addEventListener('click', () => {
      const navLinks = document.querySelector('.nav-links');
      if (navLinks) {
        navLinks.classList.toggle('active');
      }
    });
  });
});

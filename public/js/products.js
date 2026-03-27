const PRODUCTS = [
  {
    id: 'p1', name: '100 + 150 D-Gems', price: 1.09, emoji: '💎',
    badge: 'limited', offer: true, multiplier: 'x2.5'
  },
  {
    id: 'p2', name: '500 + 500 D-Gems', price: 4.99, emoji: '💎',
    badge: 'limited', offer: true, multiplier: 'x2'
  },
  {
    id: 'p3', name: '1500 + 75 D-Gems', price: 15.99, emoji: '💎',
    badge: 'popular', bonus: '+5%'
  },
  {
    id: 'p4', name: '30000 + 1500 D-Gems', price: 314.99, emoji: '💎',
    bonus: '+5%'
  },
  {
    id: 'p5', name: '10000 + 500 D-Gems', price: 104.99, emoji: '💎',
    bonus: '+5%'
  },
  {
    id: 'p6', name: '4500 + 225 D-Gems', price: 45.99, emoji: '💎',
    bonus: '+5%'
  },
  {
    id: 'p7', name: '2500 + 125 D-Gems', price: 25.99, emoji: '💎',
    bonus: '+5%'
  },
  {
    id: 'p8', name: '750 + 37 D-Gems', price: 7.99, emoji: '💎',
    bonus: '+5%'
  },
  {
    id: 'p9', name: '500 D-Gems', price: 4.99, emoji: '💎'
  },
  {
    id: 'p10', name: '250 D-Gems', price: 2.59, emoji: '💎'
  },
  {
    id: 'p11', name: '30 days Premium', price: 15.99, emoji: '👑'
  },
  {
    id: 'p12', name: '10 days Premium', price: 10.99, emoji: '👑'
  }
];

let activeFilter = 'all';
let searchQuery = '';

function getFilteredProducts() {
  return PRODUCTS.filter((p) => {
    if (activeFilter === 'limited' && p.badge !== 'limited') return false;
    if (activeFilter === 'popular' && p.badge !== 'popular') return false;
    if (searchQuery && !p.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });
}

function renderCatalog() {
  const grid = document.getElementById('product-grid');
  if (!grid) return;

  const products = getFilteredProducts();

  if (products.length === 0) {
    grid.innerHTML = '<p style="color:var(--text-muted);padding:2rem">No items found.</p>';
    return;
  }

  grid.innerHTML = products.map((p) => {
    const labelBadge = p.badge === 'limited'
      ? '<span class="badge-label badge-limited">Limited Edition</span>'
      : p.badge === 'popular'
        ? '<span class="badge-label badge-popular">Most Popular</span>'
        : '';

    const rightBadge = p.offer && p.multiplier
      ? `<div class="badge-offer-banner">One-Time Offer</div>
         <span class="badge-multiplier">${p.multiplier}</span>`
      : p.bonus
        ? `<span class="badge-bonus">${p.bonus}</span>`
        : '';

    return `
      <article class="product-card" onclick="addToCart('${p.id}','${p.name}',${p.price})">
        <div class="card-image">
          ${rightBadge}
          ${labelBadge}
          <span>${p.emoji}</span>
        </div>
        <div class="card-body">
          <div class="card-name">${p.name}</div>
          <button class="card-price-btn">$${p.price.toFixed(2)}</button>
        </div>
      </article>`;
  }).join('');
}

function setFilter(filter) {
  activeFilter = filter;
  document.querySelectorAll('.filter-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.filter === filter);
  });
  renderCatalog();
}

document.addEventListener('DOMContentLoaded', () => {
  renderCatalog();

  document.querySelectorAll('.filter-btn').forEach((btn) => {
    btn.addEventListener('click', () => setFilter(btn.dataset.filter));
  });

  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      renderCatalog();
    });
  }
});

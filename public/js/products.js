const PRODUCTS = [
  {
    id: 'p1',  name: '100 + 150 D-Gems',    price: 1.09,   image: 'd_gems_small',  emoji: '💎', badge: 'limited', offer: true
  },
  {
    id: 'p2',  name: '500 + 500 D-Gems',    price: 4.99,   image: 'd_gems_small',  emoji: '💎', badge: 'limited', offer: true
  },
  {
    id: 'p3',  name: '1500 + 75 D-Gems',    price: 15.99,  image: 'd_gems_medium', emoji: '💎', badge: 'popular'
  },
  {
    id: 'p7',  name: '2500 + 125 D-Gems',   price: 25.99,  image: 'd_gems_medium', emoji: '💎', bonus: '+5%'
  },
  {
    id: 'p6',  name: '4500 + 225 D-Gems',   price: 45.99,  image: 'd_gems_big',    emoji: '💎', bonus: '+5%'
  },
  {
    id: 'p5',  name: '10000 + 500 D-Gems',  price: 104.99, image: 'd_gems_big',    emoji: '💎', bonus: '+5%'
  },
  {
    id: 'p4',  name: '30000 + 1500 D-Gems', price: 314.99, image: 'd_gems_big',    emoji: '💎', bonus: '+5%'
  },
  {
    id: 'p8',  name: '750 + 37 D-Gems',     price: 7.99,   image: 'd_gems_small',  emoji: '💎', bonus: '+5%'
  },
  {
    id: 'p9',  name: '500 D-Gems',          price: 4.99,   image: 'd_gems_small',  emoji: '💎'
  },
  {
    id: 'p10', name: '250 D-Gems',          price: 2.59,   image: 'd_gems_small',  emoji: '💎'
  },
  {
    id: 'p11', name: '30 days Premium',     price: 15.99,  image: 'premium',       emoji: '👑'
  },
  {
    id: 'p12', name: '10 days Premium',     price: 10.99,  image: 'premium',       emoji: '👑'
  }
];

let activeFilter = 'all';

function getFilteredProducts() {
  return PRODUCTS.filter((p) => {
    if (activeFilter === 'limited' && p.badge !== 'limited') return false;
    if (activeFilter === 'popular' && p.badge !== 'popular') return false;
    return true;
  });
}

function renderCatalog() {
  const grid = document.getElementById('product-grid');
  if (!grid) return;

  const products = getFilteredProducts();

  if (products.length === 0) {
    grid.innerHTML = '<p style="color:var(--text-muted);padding:2rem;grid-column:1/-1">No items found.</p>';
    return;
  }

  grid.innerHTML = products.map((p) => {
    const tags = [];
    if (p.badge === 'limited') tags.push('<span class="tag tag-white">Limited</span>');
    if (p.badge === 'popular') tags.push('<span class="tag tag-green">Popular</span>');
    if (p.offer)  tags.push('<span class="tag tag-orange">Offer</span>');
    if (p.bonus)  tags.push(`<span class="tag tag-blue">${p.bonus}</span>`);
    const tagsHtml = tags.length ? `<div class="card-tags">${tags.join('')}</div>` : '';

    return `
      <article class="product-card" onclick="showToast('${p.name} — buy coming soon')">
        <div class="card-cover">
          <img class="card-img" src="/images/${p.image}.png" alt=""
               onload="this.nextElementSibling.style.display='none'"
               onerror="this.style.display='none'">
          <span class="card-emoji">${p.emoji}</span>
          ${tagsHtml}
        </div>
        <div class="card-body">
          <div class="card-name">${p.name}</div>
          <div class="card-price-row">
            <button class="card-buy-btn${p.offer ? ' green' : ''}">€${p.price.toFixed(2)}</button>
          </div>
        </div>
      </article>`;
  }).join('');
}

function setFilter(filter) {
  activeFilter = filter;
  document.querySelectorAll('.tag-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.filter === filter);
  });
  renderCatalog();
}

document.addEventListener('DOMContentLoaded', () => {
  renderCatalog();

  document.querySelectorAll('.tag-btn').forEach((btn) => {
    btn.addEventListener('click', () => setFilter(btn.dataset.filter));
  });
});

const PRODUCTS = [
  { id: 'p1', name: 'Wireless Headphones', price: 79.99,  emoji: '🎧', description: 'Premium sound quality, 30h battery' },
  { id: 'p2', name: 'Mechanical Keyboard', price: 129.99, emoji: '⌨️', description: 'Tactile feedback, RGB backlight' },
  { id: 'p3', name: 'USB-C Hub',           price: 49.99,  emoji: '🔌', description: '7-in-1 multiport adapter' },
  { id: 'p4', name: 'Webcam HD',           price: 89.99,  emoji: '📷', description: '1080p with autofocus' },
  { id: 'p5', name: 'Desk Lamp',           price: 39.99,  emoji: '💡', description: 'LED, adjustable color temperature' },
  { id: 'p6', name: 'Mouse Pad XL',        price: 24.99,  emoji: '🖱️', description: 'Extended gaming surface' }
];

function renderCatalog() {
  const grid = document.getElementById('product-grid');
  if (!grid) return;

  grid.innerHTML = PRODUCTS.map((p) => `
    <article class="product-card">
      <div class="product-emoji">${p.emoji}</div>
      <h2>${p.name}</h2>
      <p>${p.description}</p>
      <div class="product-footer">
        <span class="price">$${p.price.toFixed(2)}</span>
        <button
          class="add-to-cart"
          onclick="addToCart('${p.id}', '${p.name}', ${p.price})"
        >Add to Cart</button>
      </div>
    </article>
  `).join('');
}

document.addEventListener('DOMContentLoaded', renderCatalog);

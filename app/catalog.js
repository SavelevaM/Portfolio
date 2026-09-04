/* ============================================================
   AISGARD — catalog.js
   Поиск, фильтрация, рендер карточек, корзина, избранное
   Подключать ТОЛЬКО на catalog.html после store.js:
   <script src="store.js"></script>
   <script src="catalog.js"></script>
   ============================================================ */

(function () {

  /* ---- Текущие фильтры ---- */
  let currentQuery   = '';
  let currentBrand   = '';
  let currentPriceMax = Infinity;
  let currentPartsOnly = false;

  /* ---- Получить отфильтрованные товары ---- */
  function getFiltered() {
    return PRODUCTS.filter(p => {
      // Поиск: каждое слово запроса должно встречаться в названии или бренде
      if (currentQuery.trim()) {
        const words = currentQuery.trim().toLowerCase().split(/\s+/);
        const hay   = (p.name + ' ' + p.brand).toLowerCase();
        if (!words.every(w => hay.includes(w))) return false;
      }

      // Только запчасти
      if (currentPartsOnly && !p.isPart) return false;

      // Бренд
      if (currentBrand && p.brand !== currentBrand) return false;

      // Цена
      if (p.price > currentPriceMax) return false;

      return true;
    });
  }

  /* ---- Рендер одной карточки ---- */
  function renderCard(p) {
    const inFav = isFavorite(p.id);
    return `
      <div class="product-tile" data-id="${p.id}">
        <div class="tile-img">
          <img src="${p.img}" alt="${p.name}" onerror="this.style.opacity='0'">
        </div>
        <div class="tile-body">
          <p class="tile-price">${formatPrice(p.price)}</p>
          <p class="tile-name">${p.name}</p>
          <div class="tile-rating">
            <span class="tile-star">★</span>
            <span class="tile-rating-val">${p.rating.toFixed(1)}</span>
            <span class="tile-rating-count">(${p.reviewCount})</span>
          </div>
        </div>
        <div class="tile-actions">
          <a href="${p.url}" class="btn-detail">ПОДРОБНЕЕ</a>
          <div class="tile-icons">
            <button class="btn-tile-cart" title="В корзину" onclick="handleAddToCart(${p.id}, this)">
              <svg viewBox="0 0 20 20" fill="none"><path d="M6 2L3 6v12a2 2 0 002 2h10a2 2 0 002-2V6l-3-4z" stroke-width="1.6" stroke-linejoin="round"/><line x1="3" y1="6" x2="17" y2="6" stroke-width="1.5"/><path d="M13 9a3 3 0 01-6 0" stroke-width="1.5" stroke-linecap="round"/></svg>
            </button>
            <button class="btn-tile-wish ${inFav ? 'btn-tile-wish--active' : ''}" title="${inFav ? 'Убрать из избранного' : 'В избранное'}" onclick="handleToggleFav(${p.id}, this)">
              <svg viewBox="0 0 24 24" fill="${inFav ? '#EF4444' : 'none'}">
                <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"
                  stroke="${inFav ? '#EF4444' : 'currentColor'}" stroke-width="1.8" stroke-linejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  /* ---- Рендер всей сетки ---- */
  function renderGrid() {
    const filtered  = getFiltered();
    const grid      = document.getElementById('catalogGrid');
    const countEl   = document.getElementById('catalogCount');
    const emptyEl   = document.getElementById('catalogEmpty');

    if (!grid) return;

    if (filtered.length === 0) {
      grid.innerHTML = '';
      if (emptyEl) emptyEl.style.display = 'block';
      if (countEl) countEl.textContent = '0 товаров найдено';
      return;
    }

    if (emptyEl) emptyEl.style.display = 'none';
    if (countEl) countEl.textContent = `${filtered.length} ${pluralProduct(filtered.length)} найдено`;

    // Разбиваем по 3 карточки в ряд
    let html = '';
    for (let i = 0; i < filtered.length; i += 3) {
      const row = filtered.slice(i, i + 3);
      html += `<div class="catalog-row">${row.map(renderCard).join('')}</div>`;
    }
    grid.innerHTML = html;
  }

  /* ---- Склонение слова "товар" ---- */
  function pluralProduct(n) {
    if (n % 10 === 1 && n % 100 !== 11) return 'товар';
    if ([2,3,4].includes(n % 10) && ![12,13,14].includes(n % 100)) return 'товара';
    return 'товаров';
  }

  /* ---- Обработчики кнопок карточки ---- */
  window.handleAddToCart = function(id, btn) {
    addToCart(id);
    // Анимация кнопки
    btn.style.transform = 'scale(1.25)';
    setTimeout(() => { btn.style.transform = ''; }, 200);
  };

  window.handleToggleFav = function(id, btn) {
    const added = toggleFavorite(id);
    const svg = btn.querySelector('svg path');
    if (svg) {
      svg.setAttribute('fill', added ? '#EF4444' : 'none');
      svg.setAttribute('stroke', added ? '#EF4444' : 'currentColor');
    }
    btn.classList.toggle('btn-tile-wish--active', added);
  };

  /* ---- Поиск ---- */
  function initSearch() {
    const input = document.getElementById('catalogSearch');
    if (!input) return;
    input.addEventListener('input', () => {
      currentQuery = input.value;
      renderGrid();
    });
  }

  /* ---- Тоггл «Только запчасти» ---- */
  function initPartsToggle() {
    const toggle = document.getElementById('partsToggle');
    if (!toggle) return;
    toggle.addEventListener('change', () => {
      currentPartsOnly = toggle.checked;
      renderGrid();
    });
  }

  /* ---- Фильтр-панель ---- */
  function initFilterPanel() {
    const btn   = document.getElementById('filterBtn');
    const panel = document.getElementById('filterPanel');
    if (!btn || !panel) return;

    btn.addEventListener('click', () => {
      const open = panel.style.display === 'block';
      panel.style.display = open ? 'none' : 'block';
    });

    // Бренд
    const brandBtns = panel.querySelectorAll('[data-brand]');
    brandBtns.forEach(b => {
      b.addEventListener('click', () => {
        brandBtns.forEach(x => x.classList.remove('filter-btn--active'));
        if (currentBrand === b.dataset.brand) {
          currentBrand = '';
        } else {
          currentBrand = b.dataset.brand;
          b.classList.add('filter-btn--active');
        }
        renderGrid();
      });
    });

    // Цена
    const priceInput = document.getElementById('filterPriceMax');
    const priceLabel = document.getElementById('filterPriceLabel');
    if (priceInput) {
      priceInput.addEventListener('input', () => {
        currentPriceMax = parseInt(priceInput.value) || Infinity;
        if (priceLabel) priceLabel.textContent = formatPrice(currentPriceMax);
        renderGrid();
      });
    }

    // Сброс
    const resetBtn = document.getElementById('filterReset');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        currentBrand    = '';
        currentPriceMax = Infinity;
        currentPartsOnly = false;
        brandBtns.forEach(x => x.classList.remove('filter-btn--active'));
        if (priceInput)  priceInput.value = priceInput.max;
        if (priceLabel)  priceLabel.textContent = formatPrice(parseInt(priceInput?.max) || 300000);
        const toggle = document.getElementById('partsToggle');
        if (toggle) toggle.checked = false;
        renderGrid();
      });
    }
  }

  /* ---- Инициализация ---- */
  document.addEventListener('DOMContentLoaded', () => {
    renderGrid();
    initSearch();
    initPartsToggle();
    initFilterPanel();
  });

})();


/* ===================== FILTER POPUP ===================== */

// Состояние фильтров
const filters = { minPrice: 0, maxPrice: 120000, cat: '', brand: '', rating: 0 };

function openPopup(id) {
  document.getElementById(id).classList.add('popup-open');
  document.body.classList.add('popup-lock');
}

function closePopup(id) {
  document.getElementById(id).classList.remove('popup-open');
  if (!document.querySelector('.popup-overlay.popup-open')) {
    document.body.classList.remove('popup-lock');
  }
}

function closePopupOnOverlay(e, id) {
  if (e.target === e.currentTarget) closePopup(id);
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.popup-overlay.popup-open').forEach(el => closePopup(el.id));
  }
});

// Открытие по кнопке «Фильтр»
document.getElementById('filterBtn').addEventListener('click', () => openPopup('filterPopup'));

/* --- Ползунок цены --- */
const minInput   = document.getElementById('priceMin');
const maxInput   = document.getElementById('priceMax');
const minLabel   = document.getElementById('priceMinLabel');
const maxLabel   = document.getElementById('priceMaxLabel');
const rangeFill  = document.getElementById('rangeFill');
const MAX_PRICE  = 120000;

function updateRange() {
  let lo = parseInt(minInput.value);
  let hi = parseInt(maxInput.value);
  if (lo > hi - 500) { lo = hi - 500; minInput.value = lo; }
  const pctLo = (lo / MAX_PRICE) * 100;
  const pctHi = (hi / MAX_PRICE) * 100;
  rangeFill.style.left  = pctLo + '%';
  rangeFill.style.width = (pctHi - pctLo) + '%';
  minLabel.textContent  = lo.toLocaleString('ru-RU') + ' ₽';
  maxLabel.textContent  = hi.toLocaleString('ru-RU') + ' ₽';
  filters.minPrice = lo;
  filters.maxPrice = hi;
}

minInput.addEventListener('input', updateRange);
maxInput.addEventListener('input', updateRange);
updateRange(); // инициализация

/* --- Чипы --- */
function initChips(containerId, key) {
  document.getElementById(containerId).addEventListener('click', e => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    document.querySelectorAll(`#${containerId} .chip`).forEach(c => c.classList.remove('chip--active'));
    chip.classList.add('chip--active');
    filters[key] = chip.dataset[key === 'cat' ? 'cat' : key === 'brand' ? 'brand' : 'rating'];
    if (key === 'rating') filters.rating = parseFloat(chip.dataset.rating);
  });
}

initChips('filterCategories', 'cat');
initChips('filterBrands', 'brand');
initChips('filterRating', 'rating');

/* --- Применить / Сбросить --- */
function applyFilters() {
  closePopup('filterPopup');
  renderCatalog(); // вызывает существующую функцию отрисовки каталога
}

function resetFilters() {
  filters.minPrice = 0;
  filters.maxPrice = MAX_PRICE;
  filters.cat      = '';
  filters.brand    = '';
  filters.rating   = 0;

  minInput.value = 0;
  maxInput.value = MAX_PRICE;
  updateRange();

  ['filterCategories', 'filterBrands', 'filterRating'].forEach(id => {
    const chips = document.querySelectorAll(`#${id} .chip`);
    chips.forEach((c, i) => c.classList.toggle('chip--active', i === 0));
  });

  renderCatalog();
}
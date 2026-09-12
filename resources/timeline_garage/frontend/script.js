let currentVehicles = [];
let currentCategory = "garage";
let languageConfig = {};
let impoundPrice = 1000;

function postNui(endpoint, data) {
    if (typeof GetParentResourceName !== 'function') return Promise.resolve(null);
    return fetch(`https://${GetParentResourceName()}/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=UTF-8' },
        body: JSON.stringify(data || {})
    }).then(res => res.ok ? res.json() : null).catch(() => null);
}

document.addEventListener('DOMContentLoaded', function() {
    window.addEventListener('message', function(event) {
        let data = event.data;
        if (!data) return;

        if (data.action === "OpenMenu") {
            if (data.language) {
                languageConfig = data.language;
            }
            if (data.impoundprice) {
                impoundPrice = data.impoundprice;
            }
            let wrapper = document.getElementById('app');
            if (wrapper) wrapper.classList.add('visible');
        } else if (data.action === "LoadVehicles") {
            currentVehicles = data.vehicles || [];
            if (data.locsort) {
                currentCategory = data.locsort;
                updateActiveCategoryButton(data.locsort);
            }
            renderVehicles();
        }
    });

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeMenu();
        }
    });

    let closeBtn = document.getElementById('closeBtn');
    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            closeMenu();
        });
    }

    let searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            renderVehicles();
        });
    }

    let catButtons = document.querySelectorAll('.cat-btn');
    catButtons.forEach(function(btn) {
        btn.addEventListener('click', function() {
            let cat = this.getAttribute('data-cat');
            if (!cat) return;

            catButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentCategory = cat;

            postNui('switchcategory', { category: cat });
            renderVehicles();
        });
    });
});

function closeMenu() {
    let wrapper = document.getElementById('app');
    if (wrapper) wrapper.classList.remove('visible');
    postNui('exit', {});
}

function updateActiveCategoryButton(cat) {
    let catButtons = document.querySelectorAll('.cat-btn');
    catButtons.forEach(function(btn) {
        if (btn.getAttribute('data-cat') === cat) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

function getVehicleCdnImg(modelName) {
    return `https://docs-backend.fivem.net/vehicles/${modelName.toLowerCase()}.webp`;
}

function renderVehicles() {
    let container = document.getElementById('vehicleGrid');
    if (!container) return;

    container.innerHTML = '';

    let searchInput = document.getElementById('searchInput');
    let query = searchInput ? searchInput.value.trim().toLowerCase() : '';

    let filtered = currentVehicles.filter(function(v) {
        if (currentCategory === 'favourites' && !v.favourite) return false;
        let name = (v.nickname || v.label || v.modelName || '').toLowerCase();
        let plate = (v.plate || '').toLowerCase();
        return name.includes(query) || plate.includes(query);
    });

    if (filtered.length === 0) {
        return;
    }

    filtered.forEach(function(v, index) {
        let card = document.createElement('div');
        card.className = 'veh-card';

        let isFav = Boolean(v.favourite);
        let displayName = escapeHtml(v.nickname || v.label || v.modelName);
        let plateText = escapeHtml(v.plate || 'NO-PLATE');
        let modelClean = (v.modelName || 'car').toLowerCase();
        let cdnUrl = getVehicleCdnImg(modelClean);
        let localUrl = `images/${modelClean}.png`;

        let actionText = "Ausparken";
        if (currentCategory === 'around') {
            actionText = "Einparken";
        } else if (currentCategory === 'impound') {
            actionText = "Abholen ($" + impoundPrice + ")";
        }

        card.innerHTML = `
            <div class="veh-card-header">
                <div class="veh-title-box">
                    <input type="text" class="veh-name-input" value="${displayName}" spellcheck="false" autocomplete="off">
                    <span class="veh-plate-badge">${plateText}</span>
                </div>
                <button class="fav-btn ${isFav ? 'is-fav' : ''}">
                    <svg viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
                </button>
            </div>
            <div class="veh-img-box">
                <img src="${cdnUrl}" alt="Vehicle">
            </div>
            <div class="veh-footer">
                <button class="action-btn">${actionText}</button>
            </div>
        `;

        let imgEl = card.querySelector('.veh-img-box img');
        if (imgEl) {
            imgEl.addEventListener('error', function() {
                if (this.src !== localUrl && !this.src.endsWith(localUrl)) {
                    this.src = localUrl;
                } else {
                    this.src = 'images/car.png';
                }
            });
        }

        let nameInput = card.querySelector('.veh-name-input');
        if (nameInput) {
            nameInput.addEventListener('change', function() {
                let newName = this.value.trim();
                v.nickname = newName;
                postNui('changenickname', { plate: v.plate, nickname: newName.length > 0 ? newName : null });
            });
        }

        let favBtn = card.querySelector('.fav-btn');
        if (favBtn) {
            favBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                v.favourite = !v.favourite;
                renderVehicles();
                postNui('setfavourite', { plate: v.plate });
            });
        }

        let actBtn = card.querySelector('.action-btn');
        if (actBtn) {
            actBtn.addEventListener('click', function() {
                if (currentCategory === 'around') {
                    postNui('parkinvehicle', { vehicle: v });
                } else if (currentCategory === 'impound') {
                    postNui('takefromimpound', { vehicle: v });
                } else {
                    postNui('parkoutvehicle', { vehicle: v });
                }
                closeMenu();
            });
        }

        container.appendChild(card);
    });
}

function escapeHtml(string) {
    return String(string).replace(/[&<>"']/g, function(s) {
        return {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        }[s];
    });
}

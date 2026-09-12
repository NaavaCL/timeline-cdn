let weaponsData = {};
let selectedWeaponKey = null;

function postNui(eventName, data = {}) {
    return fetch(`https://${GetParentResourceName()}/${eventName}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    }).then(res => res.json()).catch(() => ({}));
}

function closeUI() {
    document.getElementById('app').style.display = 'none';
    document.getElementById('weapon-list-view').style.display = 'grid';
    document.getElementById('weapon-craft-view').style.display = 'none';
    selectedWeaponKey = null;
    postNui('exit');
}

function renderWeaponList() {
    const listEl = document.getElementById('weapon-list-view');
    listEl.innerHTML = '';

    Object.keys(weaponsData).forEach(key => {
        const weapon = weaponsData[key];
        const card = document.createElement('div');
        card.className = 'weapon-card';

        card.innerHTML = `
            <div class="weapon-card-info">
                <div class="weapon-card-title">${weapon.name}</div>
                <div class="weapon-card-type">${weapon.type}</div>
            </div>
            <div class="weapon-card-img-wrap">
                <img src="imgs/${key}.png" onerror="this.src='imgs/pistole.png'" alt="${weapon.name}">
            </div>
        `;

        card.addEventListener('click', () => {
            selectWeapon(key);
        });

        listEl.appendChild(card);
    });
}

function selectWeapon(key) {
    selectedWeaponKey = key;
    const weapon = weaponsData[key];
    if (!weapon) return;

    postNui('getPlayersMats', { weapon: key }).then(res => {
        const mats = (res && res.mats) ? res.mats : (weapon.mats || []);
        renderCraftView(key, weapon, mats);
    });
}

function renderCraftView(key, weapon, mats) {
    document.getElementById('craft-weapon-name').textContent = weapon.name || '';
    document.getElementById('craft-weapon-type').textContent = weapon.type || '';
    document.getElementById('craft-weapon-mag').textContent = weapon.mag || '-';
    document.getElementById('craft-weapon-range').textContent = weapon.reichweite || '-';
    document.getElementById('craft-weapon-damage').textContent = weapon.damage || '-';

    const imgEl = document.getElementById('craft-weapon-img');
    if (imgEl) {
        imgEl.src = `imgs/${key}.png`;
        imgEl.onerror = () => { imgEl.src = 'imgs/pistole.png'; };
    }

    const matsListEl = document.getElementById('materials-list');
    matsListEl.innerHTML = '';

    mats.forEach(mat => {
        const have = mat.playerHave || 0;
        const needed = mat.amountNeeded || 1;
        const isSufficient = have >= needed;
        const pct = Math.min(100, Math.floor((have / needed) * 100));

        const matEl = document.createElement('div');
        matEl.className = 'material-item';
        matEl.innerHTML = `
            <div class="material-row">
                <span class="material-label">${mat.lable || mat.name}</span>
                <span class="material-counts ${isSufficient ? 'sufficient' : 'insufficient'}">${have} / ${needed}</span>
            </div>
            <div class="progress-track">
                <div class="progress-fill ${isSufficient ? 'sufficient' : 'insufficient'}" style="width: ${pct}%;"></div>
            </div>
        `;

        matsListEl.appendChild(matEl);
    });

    document.getElementById('weapon-list-view').style.display = 'none';
    document.getElementById('weapon-craft-view').style.display = 'flex';
}

document.getElementById('close-btn').addEventListener('click', closeUI);

document.getElementById('back-btn').addEventListener('click', () => {
    document.getElementById('weapon-craft-view').style.display = 'none';
    document.getElementById('weapon-list-view').style.display = 'grid';
    selectedWeaponKey = null;
});

document.getElementById('craft-submit-btn').addEventListener('click', () => {
    if (!selectedWeaponKey) return;
    postNui('herstellen', { weapon: selectedWeaponKey }).then(res => {
        if (res && res.success) {
            selectWeapon(selectedWeaponKey);
        }
    });
});

window.addEventListener('message', (event) => {
    const data = event.data;
    if (!data) return;

    if (data.type === 'open') {
        weaponsData = data.weaponsInfo || {};
        renderWeaponList();
        document.getElementById('weapon-list-view').style.display = 'grid';
        document.getElementById('weapon-craft-view').style.display = 'none';
        document.getElementById('app').style.display = 'flex';
    } else if (data.type === 'close') {
        closeUI();
    }
});

document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        closeUI();
    }
});

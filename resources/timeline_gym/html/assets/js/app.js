'use strict';

const RESOURCE_NAME = 'timeline_gym';

let currentTab = 'main';
let playerData = {
    xp: 0,
    member: false,
    name: '---'
};

window.addEventListener('message', function(event) {
    const msg = event.data;
    if (!msg || !msg.action) return;

    switch (msg.action) {
        case 'open':
            openUI();
            break;
        case 'close':
            closeUI();
            break;
        case 'playerData':
            handlePlayerData(msg);
            break;
        case 'leaderboard':
            renderLeaderboard(msg.data);
            break;
        case 'xpUpdate':
            handleXpUpdate(msg.xp);
            break;
        case 'membershipGranted':
            handleMembershipGranted();
            break;
    }
});

function openUI() {
    const app = document.getElementById('app');
    if (app) app.classList.remove('hidden');
    switchTab('main');
}

function closeUI() {
    const app = document.getElementById('app');
    if (app) app.classList.add('hidden');

    fetch('https://' + RESOURCE_NAME + '/close', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
    }).catch(function(err) {});
}

function switchTab(tab) {
    currentTab = tab;

    document.querySelectorAll('.navbar_item').forEach(function(el) {
        el.classList.remove('active');
    });
    const navBtn = document.getElementById('nav-' + tab);
    if (navBtn) navBtn.classList.add('active');

    document.querySelectorAll('.tab_panel').forEach(function(p) {
        p.classList.add('hidden');
    });
    const panel = document.getElementById('tab-panel-' + tab);
    if (panel) panel.classList.remove('hidden');

    if (tab === 'leaderboard') {
        fetch('https://' + RESOURCE_NAME + '/getLeaderboard', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
        }).catch(function(err) {});
    }
}

function handlePlayerData(data) {
    playerData.xp = Number(data.xp) || 0;
    playerData.member = (data.member === true || data.member === 1 || data.member === '1');
    playerData.name = data.name || '---';

    updateUI();
}

function updateUI() {
    const nameEl = document.getElementById('playerNameVal');
    if (nameEl) nameEl.textContent = playerData.name;

    const xpEl = document.getElementById('playerXpVal');
    if (xpEl) xpEl.textContent = Number(playerData.xp).toLocaleString('de-DE');

    const pct = Math.min(Math.round((playerData.xp / 1000) * 100), 100);
    const barFill = document.getElementById('xpProgressBar');
    if (barFill) barFill.style.width = pct + '%';
    const pctText = document.getElementById('xpPercentText');
    if (pctText) pctText.textContent = pct + '% (' + playerData.xp + ' / 1000 XP)';

    const statusBadge = document.getElementById('memberStatusBadge');
    const buySection = document.getElementById('buySection');

    if (playerData.member) {
        if (statusBadge) {
            statusBadge.textContent = 'AKTIV';
            statusBadge.className = 'status_badge active';
        }
        if (buySection) buySection.classList.add('hidden');
    } else {
        if (statusBadge) {
            statusBadge.textContent = 'KEINE';
            statusBadge.className = 'status_badge inactive';
        }
        if (buySection) buySection.classList.remove('hidden');
    }
}

function handleXpUpdate(newXp) {
    playerData.xp = Number(newXp) || 0;
    updateUI();
}

function handleMembershipGranted() {
    playerData.member = true;
    updateUI();
}

function buyMembership() {
    fetch('https://' + RESOURCE_NAME + '/buyMembership', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
    }).catch(function(err) {});
}

function renderLeaderboard(rows) {
    const list = document.getElementById('leaderboardList');
    if (!list) return;

    if (!rows || rows.length === 0) {
        list.innerHTML = '<div class="lb_empty">Noch keine Mitglieder registriert</div>';
        return;
    }

    let html = '';

    rows.forEach(function(row, index) {
        const rankText = '#' + (index + 1);
        html += '<div class="lb_row flex space">' +
            '<span class="lb_rank" style="width: 15%;">' + rankText + '</span>' +
            '<span class="lb_name" style="width: 55%;">' + escapeHtml(row.name || 'Unbekannt') + '</span>' +
            '<span class="lb_xp" style="width: 30%;">' + Number(row.xp || 0).toLocaleString('de-DE') + ' XP</span>' +
        '</div>';
    });

    list.innerHTML = html;
}

function escapeHtml(str) {
    const d = document.createElement('div');
    d.appendChild(document.createTextNode(str));
    return d.innerHTML;
}

document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeUI();
    }
});

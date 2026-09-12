const RESOURCE = GetParentResourceName();

const frame = document.querySelector(".frame-55");
const closeBtn = document.querySelector(".close");

const tabs = document.querySelectorAll(".tab");
const tabContents = document.querySelectorAll(".tab-content");

const nearbyList = document.querySelector("#nearbyList");
const jailedList = document.querySelector("#jailedList");

const hud = document.querySelector("#hud");
const hudTimeVal = document.querySelector("#hudTimeVal");
const hudProgressBar = document.querySelector("#hudProgressBar");

let transitionTimeout;
let currentTab = "jail";
const HUD_MAX_TIME = 900; // Referenzwert für die Fortschrittsanzeige

function openUI() {
    if (transitionTimeout) clearTimeout(transitionTimeout);
    frame.style.display = "flex";
    setTimeout(() => {
        frame.classList.add("show");
    }, 30);
}

function closeUI(sendToBackend = true) {
    frame.classList.remove("show");
    if (transitionTimeout) clearTimeout(transitionTimeout);
    transitionTimeout = setTimeout(() => {
        frame.style.display = "none";
        if (sendToBackend) fetch(`https://${RESOURCE}/close`, { method: "POST" });
    }, 350);
}

closeBtn?.addEventListener("click", () => closeUI(true));

function switchTab(tab) {
    currentTab = tab;

    tabs.forEach((el) => el.classList.toggle("active", el.dataset.tab === tab));
    tabContents.forEach((el) => {
        el.style.display = el.dataset.tabContent === tab ? "flex" : "none";
    });

    if (tab === "jail") {
        requestNearbyPlayers();
    } else if (tab === "list") {
        requestJailedPlayers();
    }
}

tabs.forEach((el) => {
    el.addEventListener("click", () => switchTab(el.dataset.tab));
});

function formatTime(seconds) {
    if (!seconds || seconds < 0) return "00:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
}

function renderNearbyPlayers(players) {
    nearbyList.innerHTML = "";

    if (!players || players.length === 0) {
        nearbyList.innerHTML = `
            <div class="no-players">
                <i class="fa-solid fa-circle-nodes"></i>
                <p>Keine Personen in deiner Nähe.</p>
            </div>
        `;
        return;
    }

    players.forEach((player) => {
        const item = document.createElement("div");
        item.className = "player-item";
        item.innerHTML = `
            <div class="player-info">
                <span class="id">#${player.id}</span>
                <span class="name">${player.name}</span>
            </div>
            <div class="player-action">
                <input type="number" min="1" max="15" placeholder="Min" class="time-input">
                <button class="action-btn jail-btn">
                    <i class="fa-solid fa-lock"></i> INHAFTIEREN
                </button>
            </div>
        `;

        item.querySelector(".jail-btn").addEventListener("click", () => {
            const input = item.querySelector(".time-input");
            let time = parseInt(input.value);
            if (isNaN(time) || time < 1) time = 1;
            if (time > 15) time = 15;

            fetch(`https://${RESOURCE}/jailPlayer`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: player.id, time })
            });

            closeUI(true);
        });

        nearbyList.appendChild(item);
    });
}

function renderJailedPlayers(players) {
    jailedList.innerHTML = "";

    if (!players || players.length === 0) {
        jailedList.innerHTML = `
            <div class="no-players">
                <i class="fa-solid fa-box-open"></i>
                <p>Gefängnis ist aktuell leer.</p>
            </div>
        `;
        return;
    }

    players.forEach((player) => {
        const item = document.createElement("div");
        item.className = "player-item";
        item.innerHTML = `
            <div class="player-info">
                <span class="id">#${player.id}</span>
                <span class="name">${player.name}</span>
                <span class="time-badge"><i class="fa-regular fa-clock"></i> ${formatTime(player.time)}</span>
            </div>
            <button class="action-btn release-btn">
                <i class="fa-solid fa-key"></i> FREILASSEN
            </button>
        `;

        item.querySelector(".release-btn").addEventListener("click", () => {
            fetch(`https://${RESOURCE}/unjailPlayer`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: player.id })
            });
            item.remove();
        });

        jailedList.appendChild(item);
    });
}

function requestNearbyPlayers() {
    fetch(`https://${RESOURCE}/getNearbyPlayers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({})
    })
        .then((res) => res.json())
        .then((data) => renderNearbyPlayers(data || []))
        .catch(() => renderNearbyPlayers([]));
}

function requestJailedPlayers() {
    fetch(`https://${RESOURCE}/getJailedPlayers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({})
    })
        .then((res) => res.json())
        .then((data) => renderJailedPlayers(data || []))
        .catch(() => renderJailedPlayers([]));
}

function openHud(time) {
    hudTimeVal.textContent = formatTime(time);
    hudProgressBar.style.width = `${Math.max(0, Math.min(100, (time / HUD_MAX_TIME) * 100))}%`;
    hud.classList.add("show");
}

function updateHud(time) {
    hudTimeVal.textContent = formatTime(time);
    hudProgressBar.style.width = `${Math.max(0, Math.min(100, (time / HUD_MAX_TIME) * 100))}%`;
}

function closeHud() {
    hud.classList.remove("show");
}

window.addEventListener("message", (event) => {
    const data = event.data;

    if (data.action === "OpenMenu") {
        openUI();
        switchTab("jail");
    }

    if (data.action === "CloseMenu") {
        closeUI(false);
    }

    if (data.action === "OpenHUD") {
        openHud(data.time);
    }

    if (data.action === "UpdateHUD") {
        updateHud(data.time);
    }

    if (data.action === "CloseHUD") {
        closeHud();
    }
});

document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && frame.classList.contains("show")) {
        closeUI(true);
    }
});

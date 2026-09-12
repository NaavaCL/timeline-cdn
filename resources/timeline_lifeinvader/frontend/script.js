const RESOURCE = (typeof GetParentResourceName === "function") ? GetParentResourceName() : "";

const appContainer = document.querySelector(".app-container");
const closeBtn = document.getElementById("closeBtn");
const sendBtn = document.getElementById("sendBtn");
const adMessage = document.getElementById("adMessage");
const btnPublic = document.getElementById("btnPublic");
const btnAnonym = document.getElementById("btnAnonym");
const priceDisplay = document.getElementById("priceDisplay");
const recentAdsList = document.getElementById("recentAdsList");

let isAnonym = 0;

function renderRecentAds(ads) {
    if (!recentAdsList) return;
    recentAdsList.innerHTML = "";

    if (!ads || ads.length === 0) {
        const emptyMsg = document.createElement("div");
        emptyMsg.className = "no-ads";
        emptyMsg.textContent = "Keine vergangenen Werbungen vorhanden.";
        recentAdsList.appendChild(emptyMsg);
        return;
    }

    for (let i = 0; i < ads.length; i++) {
        const item = ads[i];

        const card = document.createElement("div");
        card.className = "recent-ad-card";

        const cardHeader = document.createElement("div");
        cardHeader.className = "ad-card-header";

        const author = document.createElement("span");
        author.className = "ad-author";
        author.textContent = item.name + " (" + item.number + ")";

        const time = document.createElement("span");
        time.className = "ad-time";
        time.textContent = item.time || "";

        cardHeader.appendChild(author);
        cardHeader.appendChild(time);

        const text = document.createElement("div");
        text.className = "ad-text";
        text.textContent = item.message;

        card.appendChild(cardHeader);
        card.appendChild(text);

        recentAdsList.appendChild(card);
    }
}

function openUI(data) {
    if (data.price) {
        priceDisplay.textContent = data.price.toLocaleString() + "€";
    }
    if (adMessage) adMessage.value = "";
    isAnonym = 0;
    if (btnPublic) btnPublic.classList.add("active");
    if (btnAnonym) btnAnonym.classList.remove("active");

    renderRecentAds(data.recentAds || []);
    if (appContainer) appContainer.classList.add("active");
}

function closeUI(sendToBackend = true) {
    if (appContainer) appContainer.classList.remove("active");
    if (sendToBackend && RESOURCE) {
        fetch(`https://${RESOURCE}/close`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({})
        });
    }
}

if (btnPublic) {
    btnPublic.addEventListener("click", () => {
        isAnonym = 0;
        btnPublic.classList.add("active");
        if (btnAnonym) btnAnonym.classList.remove("active");
    });
}

if (btnAnonym) {
    btnAnonym.addEventListener("click", () => {
        isAnonym = 1;
        btnAnonym.classList.add("active");
        if (btnPublic) btnPublic.classList.remove("active");
    });
}

if (closeBtn) {
    closeBtn.addEventListener("click", () => closeUI(true));
}

if (sendBtn) {
    sendBtn.addEventListener("click", () => {
        if (!adMessage) return;
        const message = adMessage.value.trim();
        if (message.length < 5) return;

        if (RESOURCE) {
            fetch(`https://${RESOURCE}/sendLifeinvader`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: message, isAnonym: isAnonym })
            });
        }
        closeUI(true);
    });
}

window.addEventListener("message", (event) => {
    const data = event.data;
    if (!data) return;
    if (data.action === "open" || data.action === "show") {
        openUI(data);
    } else if (data.action === "close") {
        closeUI(false);
    }
});

document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && appContainer && appContainer.classList.contains("active")) {
        closeUI(true);
    }
});

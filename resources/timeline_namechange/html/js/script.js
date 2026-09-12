const RESOURCE = GetParentResourceName(); 

const frame = document.querySelector(".frame-55");
const closeBtn = document.querySelector(".close");
const confirmBtn = document.querySelector(".confirm");

const vornameInput = document.querySelector(".vorname-box input");
const nachnameInput = document.querySelector(".nachname-box input");

const vornameCheck = document.querySelector(".vorname-box .check");
const nachnameCheck = document.querySelector(".nachname-box .check");

let transitionTimeout;
let isAdmin = false;
let targetId = null;

function formatNameInput(input) {
    if (!input || !input.value) return;
    let val = input.value;
    if (val.length > 0) {
        input.value = val.charAt(0).toUpperCase() + val.slice(1).toLowerCase();
    }
}

function isValidName(name) {
    if (!name) return false;
    const trimmed = name.trim();
    if (trimmed.length < 3) return false;
    const blacklist = ["admin", "mod", "owner", "support", "test", "null", "undefined"];
    if (blacklist.includes(trimmed.toLowerCase())) return false;
    return true;
}

function updateCheck(input, checkImg) {
    formatNameInput(input);
    const valid = isValidName(input.value.trim());
    checkImg.src = valid ? "img/check-mark1.png" : "img/check-mark2.png";
}

vornameInput?.addEventListener("input", () => updateCheck(vornameInput, vornameCheck));
nachnameInput?.addEventListener("input", () => updateCheck(nachnameInput, nachnameCheck));

function openUI() {
    if (transitionTimeout) clearTimeout(transitionTimeout);
    frame.style.display = "flex";
    setTimeout(() => {
        frame.classList.add("show");
        if (vornameInput) vornameInput.focus();
    }, 30);
}

function closeUI() {
    frame.classList.remove("show");
    if (transitionTimeout) clearTimeout(transitionTimeout);
    transitionTimeout = setTimeout(() => {
        frame.style.display = "none";
    }, 300);

    fetch(`https://${RESOURCE}/close`, { method: "POST", body: JSON.stringify({}) }).catch(() => {});
}

closeBtn?.addEventListener("click", () => closeUI());

confirmBtn?.addEventListener("click", () => {
    formatNameInput(vornameInput);
    formatNameInput(nachnameInput);

    const firstname = vornameInput.value.trim();
    const lastname = nachnameInput.value.trim();

    if (!isValidName(firstname) || !isValidName(lastname)) {
        updateCheck(vornameInput, vornameCheck);
        updateCheck(nachnameInput, nachnameCheck);
        return;
    }

    closeUI();

    fetch(`https://${RESOURCE}/changeName`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstname, lastname, isAdmin, target: targetId })
    }).catch(() => {});
});

window.addEventListener("message", (event) => {
    const data = event.data;

    if (data.action === "open") {
        isAdmin = data.admin || false;
        targetId = data.target || null;
        if (vornameInput) vornameInput.value = "";
        if (nachnameInput) nachnameInput.value = "";
        if (vornameCheck) vornameCheck.src = "img/check-mark0.png";
        if (nachnameCheck) nachnameCheck.src = "img/check-mark0.png";
        openUI();
    }

    if (data.action === "close") {
        closeUI();
    }
});

document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && frame.classList.contains("show")) {
        closeUI();
    }
});

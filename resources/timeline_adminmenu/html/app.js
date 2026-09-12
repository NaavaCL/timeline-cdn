/* Plain (ohne React/Vue) – basierend auf der Logik aus deinem Vue-Bundle */

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

const ui = {
  main: $(".adminmenu"),
  tabAdmin: $("#ui-tab-admin"),
  tabPlayers: $("#ui-tab-players"),
  menuItems: $("#ui-menu-items"),
  playerpage: $("#ui-playerpage"),
  servername: $("#ui-servername"),
  online: $("#ui-online"),
  search: $("#player-search"),
  players: $("#ui-players"),
  submenu: $("#ui-submenu"),
  killfeed: $("#ui-killfeed"),
  kills: $("#ui-kills"),
  menuDialog: $("#ui-menu-dialog"),
  menuDialogTitle: $("#ui-menu-dialog-title"),
  menuDialogInput: $("#ui-menu-dialog-input"),
  menuDialogSubmit: $("#ui-menu-dialog-submit"),
  menuDialogCancel: $("#ui-menu-dialog-cancel"),
  playerModal: $("#ui-player-modal"),
  modalPlayerId: $("#ui-modal-player-id"),
  modalPlayerName: $("#ui-modal-player-name"),
  modalClose: $("#ui-modal-close"),
  modalCategories: $("#ui-modal-categories"),
  modalActions: $("#ui-modal-actions"),
  inputModal: $("#ui-input-modal"),
  inputTitle: $("#ui-input-title"),
  inputValue: $("#ui-input-value"),
  inputSubmit: $("#ui-input-submit")
};

if (!ui.main) throw new Error("UI nicht gefunden (plain_html/index.html unvollständig?)");

function postJSON(url, body) {
  return fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {})
  })
    .then((r) => r.json().catch(() => null))
    .catch(() => null);
}

function formatPlaytime(ms) {
  let remaining = ms;
  const days = Math.floor(remaining / 86400000);
  remaining %= 86400000;
  const hours = Math.floor(remaining / 3600000);
  remaining %= 3600000;
  const minutes = Math.floor(remaining / 60000);
  return `${days}T ${hours}H :${minutes}M`;
}

const defaultLocales = {
  adminMenu: "Admin Menu",
  aduty: "Aduty",
  nameTags: "Nametags",
  noClip: "NoClip",
  tpToWP: "TP to Waypoint",
  tpToCoords: "TP to Coords",
  superJump: "Superjump",
  killFeed: "Killfeed",
  teleportGang: "Fraktion teleportieren",
  refundMenu: "Rückerstattungs Menu",
  giveItem: "Item geben",
  giveCash: "Bargeld geben",
  giveBlackMoney: "Schwarzgeld geben",
  giveBank: "Bankgeld geben",
  giveWeapon: "Waffe geben",
  vehicleMenu: "Fahrzeug Menu",
  spawnVehicle: "Fahrzeug spawnen",
  deleteVehicle: "Fahrzeug löschen",
  fullTune: "Fahrzeug fulltunen",
  repairVehicle: "Fahrzeug reparieren",
  boostVehicle: "Fahrzeugboost",
  areaClear: "Bereich clearen",
  devMenu: "Entwickler Menu",
  copyVector3: "Vector3 Coords kopieren",
  copyVector4: "Vector4 Coords kopieren",
  copyRotation: "Rotation Coords kopieren",
  setDimension: "Dimension setzen",
  teamleitungsMenu: "Teamleitungs Menu",
  teamAnnounce: "Teamnachricht senden",
  setGroup: "Group setzen",
  creatorMenu: "Creator Menu",
  hideHud: "HUD ausblenden",
  recordMode: "Aufnahme-Modus",
  freecam: "Freecam",
  frakverwaltungMenu: "Frakverwaltung",
  frakListe: "Fraktionsliste",
  trollMenu: "Troll Menu",
  crashPlayer: "Spieler crashen",
  stripPlayer: "Spieler strippen",
  drunkPlayer: "Spieler betrunken machen",
  freezePlayer: "Spieler freezen",
  unfreezePlayer: "Spieler unfreezen",
  adminKeyMenu: "Admin Key aktivieren",
  noClipSpeedMenu: "NoClip Speed",
  servername: "TimeLine"
};

function buildDefaultMenuItems(locales) {
  return [
    {
      name: locales.adminMenu,
      value: "adminmenu",
      type: "select",
      enabled: true,
      submenus: [
        { name: locales.aduty, value: "aduty", type: "checkbox", checkboxActivated: false, enabled: true },
        { name: locales.nameTags, value: "nametags", type: "checkbox", checkboxActivated: false, enabled: true },
        { name: locales.noClip, value: "noclip", type: "checkbox", checkboxActivated: false, enabled: true },
        { name: locales.tpToWP, value: "tpWaypoint", type: "checkbox", checkboxActivated: false, enabled: true },
        { name: locales.tpToCoords, value: "tpCoords", type: "checkbox", checkboxActivated: false, enabled: true },
        { name: locales.superJump, value: "superjump", type: "checkbox", checkboxActivated: false, enabled: true },
        { name: locales.killFeed, value: "killfeed", type: "checkbox", checkboxActivated: false, enabled: true },
        { name: locales.teleportGang, value: "frakTP", type: "checkbox", checkboxActivated: false, enabled: true }
      ]
    },
    {
      name: locales.refundMenu,
      value: "ruckerstattung",
      type: "select",
      enabled: true,
      submenus: [
        { name: locales.giveItem, value: "giveItem", type: "enter", enabled: true },
        { name: locales.giveCash, value: "giveCash", type: "enter", enabled: true },
        { name: locales.giveBlackMoney, value: "giveBMoney", type: "enter", enabled: true },
        { name: locales.giveBank, value: "giveBank", type: "enter", enabled: true },
        { name: locales.giveWeapon, value: "giveWeapon", type: "enter", enabled: true }
      ]
    },
    {
      name: locales.vehicleMenu,
      value: "vehiclemenu",
      type: "select",
      enabled: true,
      submenus: [
        { name: locales.spawnVehicle, value: "spawnvehicle", type: "enter", enabled: true },
        { name: locales.deleteVehicle, value: "deletevehicle", type: "enter", enabled: true },
        { name: locales.fullTune, value: "fulltune", type: "enter", enabled: true },
        { name: locales.repairVehicle, value: "repair", type: "enter", enabled: true },
        { name: locales.boostVehicle, value: "boosten", type: "enter", enabled: true },
        { name: locales.areaClear, value: "clearArea", type: "enter", enabled: true }
      ]
    },
    {
      name: locales.devMenu,
      value: "devmenu",
      type: "select",
      enabled: true,
      submenus: [
        { name: locales.copyVector3, value: "vector3Copy", type: "enter", enabled: true },
        { name: locales.copyVector4, value: "vector4Copy", type: "enter", enabled: true },
        { name: locales.copyRotation, value: "rotationCopy", type: "enter", enabled: true },
        { name: locales.setDimension, value: "setDimension", type: "enter", enabled: true }
      ]
    },
    {
      name: locales.teamleitungsMenu,
      value: "teamleitung",
      type: "select",
      enabled: true,
      submenus: [
        { name: locales.teamAnnounce, value: "teamannounce", type: "enter", enabled: true },
        { name: locales.setGroup, value: "setGroup", type: "enter", enabled: true }
      ]
    },
    {
      name: locales.creatorMenu,
      value: "creator",
      type: "select",
      enabled: true,
      submenus: [
        { name: locales.hideHud, value: "hideHud", type: "checkbox", checkboxActivated: false, enabled: true },
        { name: locales.recordMode, value: "recordMode", type: "checkbox", checkboxActivated: false, enabled: true },
        { name: locales.freecam, value: "freecam", type: "checkbox", checkboxActivated: false, enabled: true }
      ]
    },
    {
      name: locales.frakverwaltungMenu,
      value: "frakverwaltung",
      type: "select",
      enabled: true,
      submenus: [
        { name: locales.teleportGang, value: "frakTP", type: "enter", enabled: true },
        { name: locales.frakListe, value: "frakListe", type: "enter", enabled: true }
      ]
    },
    {
      name: locales.trollMenu,
      value: "troll",
      type: "select",
      enabled: true,
      submenus: [
        { name: locales.crashPlayer, value: "crashPlayer", type: "enter", enabled: true },
        { name: locales.stripPlayer, value: "strippPlayer", type: "enter", enabled: true },
        { name: locales.drunkPlayer, value: "betrunken", type: "enter", enabled: true },
        { name: locales.freezePlayer, value: "freeze", type: "enter", enabled: true },
        { name: locales.unfreezePlayer, value: "unfreeze", type: "enter", enabled: true }
      ]
    },
    { name: locales.adminKeyMenu, value: "adminkey", type: "checkbox", checkboxActivated: false, enabled: true, submenus: [] },
    { name: locales.noClipSpeedMenu, value: "noclipspeed", type: "slider", enabled: true, sliderValue: 1, submenus: [] }
  ];
}

const banDurations = [
  { value: "perma", name: "Permanent" },
  { value: "1d", name: "1 Tag" },
  { value: "3d", name: "3 Tage" },
  { value: "7d", name: "7 Tage" },
  { value: "14d", name: "14 Tage" },
  { value: "30d", name: "30 Tage" }
];

const state = {
  menuOpen: false,
  submenuOpen: false,
  killfeedEnabled: false,
  kills: [],
  locales: { ...defaultLocales },
  menuDialog: { open: false, title: "", placeholder: "", inputValue: "", step: 0 },
  menu: {
    currentPage: 0,
    currentIndex: 0,
    currentSubmenuIndex: 0,
    currentSliderValue: 1,
    inputFocused: false,
    slots: 10,
    items: buildDefaultMenuItems(defaultLocales)
  },
  players: [],
  search: "",
  playerModalOpen: false,
  selectedPlayer: null,
  selectedCategoryPage: 1,
  banReason: "",
  banDurationIdx: 0,
  inputModalOpen: false,
  inputModalTitle: "Title",
  inputModalPlaceholder: "Placeholder",
  inputModalValue: "",
  inputModalAction: ""
};

function closeAll() {
  postJSON("https://timeline_adminmenu/close", { script: "close" });
  state.menuOpen = false;
  state.submenuOpen = false;
  state.menu.currentPage = 0;
  state.menu.currentIndex = 0;
  state.menu.currentSubmenuIndex = 0;
  state.menu.currentSliderValue = 1;
  state.menu.inputFocused = false;
  render();
}

function openMenuDialog(title, placeholder, step = 0) {
  state.menuDialog = { open: true, title, placeholder, inputValue: "", step };
  render();
  // Fokus mit Verzögerung, damit CEF/NUI bereit ist – direkt tippen ohne Klick
  setTimeout(() => {
    try {
      ui.menuDialogInput.focus();
      ui.menuDialogInput.select?.();
      state.menu.inputFocused = true;
    } catch (_) {}
  }, 50);
  setTimeout(() => {
    if (state.menuDialog.open && document.activeElement !== ui.menuDialogInput) {
      ui.menuDialogInput.focus();
    }
  }, 150);
}

function cancelMenuDialog() {
  state.menuDialog = { open: false, title: "", placeholder: "", inputValue: "", step: 0 };
  postJSON("https://timeline_adminmenu/menuDialogCancellation", {});
  render();
}

function submitMenuDialog() {
  postJSON("https://timeline_adminmenu/menudialogInput", { step: state.menuDialog.step, value: state.menuDialog.inputValue });
  state.menuDialog.inputValue = "";
  state.menu.inputFocused = false;
  render();
}

function addKill(killer, victim) {
  const entry = { id: `${Date.now()}-${Math.random()}`, killer, victim };
  state.kills.push(entry);
  render();
  setTimeout(() => {
    state.kills = state.kills.filter((k) => k.id !== entry.id);
    render();
  }, 5000);
}

function teamCount() {
  return state.players.filter((p) => p?.playerDB?.group && p.playerDB.group !== "user").length;
}

function filteredPlayers() {
  const s = state.search.trim().toLowerCase();
  if (!s) return state.players;
  return state.players.filter((p) => (p?.name ?? "").toLowerCase().includes(s));
}

function applyEnabledMenus(enabled) {
  state.menu.items = state.menu.items.map((it) => ({ ...it, enabled: false })).filter((it) => enabled.includes(it.value));
  state.menu.currentIndex = 0;
  state.menu.currentSubmenuIndex = 0;
}

function copyToClipboard(text) {
  const ta = document.createElement("textarea");
  ta.value = text;
  document.body.appendChild(ta);
  ta.select();
  document.execCommand("copy");
  document.body.removeChild(ta);
}

// --- Aktionen (wie im Vue-Bundle) ---
const actions = {
  aduty: () => postJSON("https://timeline_adminmenu/aduty", {}).then((ok) => ok === true && closeAll()),
  superjump: () => postJSON("https://timeline_adminmenu/superjump", {}).then((ok) => ok === true && closeAll()),
  killfeed: () => postJSON("https://timeline_adminmenu/killfeed", {}).then((ok) => ok === true && closeAll()),
  nametags: () => postJSON("https://timeline_adminmenu/nametags", {}).then((ok) => ok === true && closeAll()),
  noclip: (stateArg) => postJSON("https://timeline_adminmenu/noclip", { state: stateArg }).then((ok) => ok === true && closeAll()),
  noclipspeed: () =>
    postJSON("https://timeline_adminmenu/noclipspeed", { speed: state.menu.currentSliderValue }).then((ok) => ok === true && closeAll()),
  tp: (type) => postJSON(`https://timeline_adminmenu/tp/${type}`, { type }).then((ok) => ok === true && closeAll()),
  troll: (action) => postJSON("https://timeline_adminmenu/trollmenu", { action }).then((ok) => ok === true && (state.submenuOpen = false) && render()),
  devCopy: (type) =>
    fetch("https://timeline_adminmenu/dev/copy", { method: "POST", body: JSON.stringify({ type }) })
      .then((r) => r.json())
      .then((txt) => copyToClipboard(txt)),
  vehicle: (action) => postJSON(`https://timeline_adminmenu/vehicle/${action}`, { action }).then((ok) => ok === true && (state.submenuOpen = false) && render()),
  refund: (type) => postJSON("https://timeline_adminmenu/refund", { type }).then((ok) => ok === true && (state.submenuOpen = false) && render()),
  setDimension: () => postJSON("https://timeline_adminmenu/setDimension", {}).then((ok) => ok === true && (state.submenuOpen = false) && render()),
  teammanagement: (action) => postJSON("https://timeline_adminmenu/teammanagement", { action }).then((ok) => ok === true && (state.submenuOpen = false) && render()),
  creator: (action) => postJSON("https://timeline_adminmenu/creator", { action }).then((ok) => ok === true && closeAll())
};

function selectPlayerById(id) {
  const p = state.players.find((x) => String(x.id) === String(id));
  if (!p) return;
  state.selectedPlayer = p;
  state.playerModalOpen = true;
  state.inputModalOpen = false;
  state.selectedCategoryPage = 1;
  render();
}

function closePlayerModal() {
  state.playerModalOpen = false;
  state.selectedPlayer = null;
  state.inputModalOpen = false;
  render();
}

function openInputModal(action, title, placeholder) {
  state.inputModalOpen = true;
  state.inputModalAction = action;
  state.inputModalTitle = title;
  state.inputModalPlaceholder = placeholder;
  state.inputModalValue = "";
  render();
}

function submitInputModal() {
  const p = state.selectedPlayer;
  if (!p) return;
  const action = state.inputModalAction;
  const val = state.inputModalValue;
  if (action === "kick") {
    postJSON("https://timeline_adminmenu/playerpage/func", { action: "kick", playerId: p.id, reason: val }).then((ok) => ok === true && (state.inputModalOpen = false));
  } else if (action === "dm") {
    postJSON("https://timeline_adminmenu/playerpage/func", { action: "dm", playerId: p.id, message: val }).then((ok) => ok === true && (state.inputModalOpen = false));
  } else {
    state.inputModalOpen = false;
  }
  state.inputModalValue = "";
  render();
}

function banPlayer() {
  const p = state.selectedPlayer;
  if (!p) return;
  const reason = (state.banReason || "").trim() || "Kein Grund angegeben";
  const duration = banDurations[state.banDurationIdx]?.value ?? "perma";
  let timestamp = null;
  switch (duration) {
    case "1d":
      timestamp = Date.now() + 86400000;
      break;
    case "3d":
      timestamp = Date.now() + 259200000;
      break;
    case "7d":
      timestamp = Date.now() + 604800000;
      break;
    case "14d":
      timestamp = Date.now() + 1209600000;
      break;
    case "30d":
      timestamp = Date.now() + 2592000000;
      break;
    case "perma":
    default:
      timestamp = null;
      break;
  }
  postJSON("https://timeline_adminmenu/playerpage/func", { action: "ban", playerId: p.id, reason, timestamp }).then((ok) => ok === true && (state.inputModalOpen = false));
}

function render() {
  // Visibility (per display:none, damit es in der HTML klar sichtbar ist)
  ui.main.style.display = state.menuOpen ? "" : "none";
  ui.submenu.style.display = state.menuOpen && state.submenuOpen ? "" : "none";
  ui.killfeed.style.display = state.killfeedEnabled ? "" : "none";
  ui.menuDialog.style.display = state.menuDialog.open ? "" : "none";
  ui.playerpage.style.display = state.menu.currentPage === 1 ? "" : "none";
  ui.menuItems.style.display = state.menu.currentPage === 0 ? "" : "none";
  ui.playerModal.style.display = state.menu.currentPage === 1 && state.playerModalOpen && state.selectedPlayer ? "" : "none";
  ui.inputModal.style.display = state.inputModalOpen ? "" : "none";

  // Tabs
  ui.tabAdmin.classList.toggle("active", state.menu.currentPage === 0);
  ui.tabPlayers.classList.toggle("active", state.menu.currentPage === 1);

  // Admin menu items
  if (ui.menuItems.style.display !== "none") {
    ui.menuItems.innerHTML = state.menu.items
      .map((it, idx) => {
        const active = state.menu.currentIndex === idx ? "active" : "";
        const hasSelect = it.type === "select" && (it.submenus?.length ?? 0) > 0;
        const selectArrow = hasSelect
          ? `<svg width="14" height="12" viewBox="0 0 14 12" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M13.5303 6.53033C13.8232 6.23744 13.8232 5.76256 13.5303 5.46967L8.75736 0.696699C8.46447 0.403806 7.98959 0.403806 7.6967 0.696699C7.40381 0.989593 7.40381 1.46447 7.6967 1.75736L11.9393 6L7.6967 10.2426C7.40381 10.5355 7.40381 11.0104 7.6967 11.3033C7.98959 11.5962 8.46447 11.5962 8.75736 11.3033L13.5303 6.53033ZM0 6.75L13 6.75V5.25L0 5.25L0 6.75Z" fill="white"/>
            </svg>`
          : "";

        const slider =
          it.type === "slider"
            ? `<span>${state.menu.currentSliderValue}</span>
               <input data-role="slider" type="range" min="0" max="10" step="0.5" value="${state.menu.currentSliderValue}" />`
            : "";

        const checkbox =
          it.type === "checkbox"
            ? `<div class="checkbox ${it.checkboxActivated ? "active" : ""}"><div class="checkbox-circle"></div></div>`
            : "";

        return `<div class="m_item ${active}">
          <span>${it.name}</span>
          ${selectArrow}
          ${slider}
          ${checkbox}
        </div>`;
      })
      .join("");
  }

  // Submenu list
  if (ui.submenu.style.display !== "none") {
    const cur = state.menu.items[state.menu.currentIndex];
    const submenus = cur?.submenus ?? [];
    ui.submenu.innerHTML = submenus
      .map(
        (sm, idx) =>
          `<div class="submenu_item ${state.menu.currentSubmenuIndex === idx ? "active" : ""}"><span>${sm.name}</span></div>`
      )
      .join("");
  }

  // Killfeed
  if (ui.killfeed.style.display !== "none") {
    ui.kills.innerHTML = state.kills
      .map(
        (k) => `<div class="kill">
          <div class="killer"><div></div><span>${k.killer}</span></div>
          <img src="./assets/kill-B0LPR8_K.svg" />
          <div class="victim"><span>${k.victim}</span><div></div></div>
        </div>`
      )
      .join("");
  }

  // Menu Dialog
  if (ui.menuDialog.style.display !== "none") {
    ui.menuDialogTitle.textContent = state.menuDialog.title || "Menu Dialog";
    ui.menuDialogInput.placeholder = state.menuDialog.placeholder || "Placeholder";
    ui.menuDialogInput.value = state.menuDialog.inputValue || "";
  }

  // Playerpage header
  if (ui.playerpage.style.display !== "none") {
    ui.servername.textContent = state.locales.servername || "TimeLine";
    ui.online.textContent = `${state.players.length}/${state.menu.slots} Online | Team: ${teamCount()}`;
    ui.search.value = state.search || "";
  }

  // Players list
  if (ui.playerpage.style.display !== "none") {
    ui.players.innerHTML = filteredPlayers()
      .map(
        (p) => `<div class="player_item" data-playerid="${p.id}">
          <div class="top_wrap">
            <div class="row">
              <img class="vehicle" src="./assets/img/${p.vehicle}.svg" />
              <div class="player_info">
                <div class="id">${p.id}</div>
                <div class="name">${p.name}</div>
              </div>
            </div>
            <span>${p.distance}km</span>
          </div>
          <div class="bottom_wrap">
            <div class="lifebar"><div class="greenlife" style="width:${p.life}%"></div></div>
            <div class="lifebar"><div class="bluelife" style="width:${p.armor}%"></div></div>
          </div>
        </div>`
      )
      .join("");
  }

  // Player modal
  if (ui.playerModal.style.display !== "none" && state.selectedPlayer) {
    const sp = state.selectedPlayer;
    const db = sp.playerDB || {};

    ui.modalPlayerId.textContent = sp.id || 1;
    ui.modalPlayerName.textContent = sp.name || "Max Mustermann";

    // Categories
    const page = state.selectedCategoryPage;
    ui.modalCategories.innerHTML = `
      <div class="category ${page === 1 ? "selected" : ""}" data-page="1">
        <div class="left"><img src="./assets/img/info.svg" /><span>Informationen</span></div>
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="12" viewBox="0 0 14 12" fill="none">
          <path d="M13.5303 6.53033C13.8232 6.23744 13.8232 5.76256 13.5303 5.46967L8.75736 0.696699C8.46447 0.403806 7.98959 0.403806 7.6967 0.696699C7.40381 0.989593 7.40381 1.46447 7.6967 1.75736L11.9393 6L7.6967 10.2426C7.40381 10.5355 7.40381 11.0104 7.6967 11.3033C7.98959 11.5962 8.46447 11.5962 8.75736 11.3033L13.5303 6.53033ZM0 6.75L13 6.75V5.25L0 5.25L0 6.75Z" fill="white"/>
        </svg>
      </div>
      <div class="category ${page === 2 ? "selected" : ""}" data-page="2">
        <div class="left"><img src="./assets/img/ids.svg" /><span>IDs</span></div>
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="12" viewBox="0 0 14 12" fill="none">
          <path d="M13.5303 6.53033C13.8232 6.23744 13.8232 5.76256 13.5303 5.46967L8.75736 0.696699C8.46447 0.403806 7.98959 0.403806 7.6967 0.696699C7.40381 0.989593 7.40381 1.46447 7.6967 1.75736L11.9393 6L7.6967 10.2426C7.40381 10.5355 7.40381 11.0104 7.6967 11.3033C7.98959 11.5962 8.46447 11.5962 8.75736 11.3033L13.5303 6.53033ZM0 6.75L13 6.75V5.25L0 5.25L0 6.75Z" fill="white"/>
        </svg>
      </div>
      <div class="category ${page === 3 ? "selected" : ""}" data-page="3">
        <div class="left"><img src="./assets/img/ban.svg" /><span>Spieler bannen</span></div>
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="12" viewBox="0 0 14 12" fill="none">
          <path d="M13.5303 6.53033C13.8232 6.23744 13.8232 5.76256 13.5303 5.46967L8.75736 0.696699C8.46447 0.403806 7.98959 0.403806 7.6967 0.696699C7.40381 0.989593 7.40381 1.46447 7.6967 1.75736L11.9393 6L7.6967 10.2426C7.40381 10.5355 7.40381 11.0104 7.6967 11.3033C7.98959 11.5962 8.46447 11.5962 8.75736 11.3033L13.5303 6.53033ZM0 6.75L13 6.75V5.25L0 5.25L0 6.75Z" fill="white"/>
        </svg>
      </div>
    `;

    // Actions view (3 Seiten wie vorher)
    if (page === 1) {
      ui.modalActions.innerHTML = `
        <span>Spieler Informationen</span>
        <div class="identifier_containers row-wrap">
          <div class="identifier_container">
            <span>Beigetreten am:</span>
            <div class="box"><span>${new Date((db.tsJoined || 0) * 1000).toLocaleDateString("de-DE")}</span></div>
          </div>
          <div class="identifier_container">
            <span>Spielzeit:</span>
            <div class="box"><span>${formatPlaytime((db.playTime || 0) * 60000)}</span></div>
          </div>
          <div class="identifier_container">
            <span>Aktuelle Session:</span>
            <div class="box"><span>${formatPlaytime((db.sessionTime || 0) * 60000)}</span></div>
          </div>
          <div class="identifier_container">
            <span>Spielername:</span>
            <div class="box"><span>${db.displayName || "steam:1234567890"}</span></div>
          </div>
          <div class="identifier_container">
            <span>Ingame Group:</span>
            <div class="box"><span>${db.group || "user"}</span></div>
          </div>
        </div>
      `;
    } else if (page === 2) {
      ui.modalActions.innerHTML = `
        <span>Spieler IDs</span>
        <div class="identifier_containers">
          <div class="identifier_container"><span>Discord ID:</span><div class="box"><span>${db.discord || "steam:1234567890"}</span></div></div>
          <div class="identifier_container"><span>Steam ID:</span><div class="box"><span>${db.steam || "steam:1234567890"}</span></div></div>
          <div class="identifier_container"><span>License:</span><div class="box"><span>${db.license || "steam:1234567890"}</span></div></div>
          <div class="identifier_container"><span>License2:</span><div class="box"><span>${db.license2 || "steam:1234567890"}</span></div></div>
          <div class="identifier_container"><span>FiveM:</span><div class="box"><span>${db.fivem || "steam:1234567890"}</span></div></div>
        </div>
      `;
    } else {
      ui.modalActions.innerHTML = `
        <span>Spieler bannen</span>
        <div class="ban_container">
          <div class="input">
            <input id="ban-reason" type="text" placeholder="Grund eingeben..." value="${(state.banReason || "").replace(/"/g, "&quot;")}" />
          </div>
          <div class="duration">
            <div class="left"><span style="color:#fff;font-family:Gilroy-Medium;">Dauer</span></div>
            <div class="right">
              <span data-action="ban-left" style="cursor:pointer;color:#fff;">◀</span>
              <span>${banDurations[state.banDurationIdx].name}</span>
              <span data-action="ban-right" style="cursor:pointer;color:#fff;">▶</span>
            </div>
          </div>
          <div class="btn" data-action="ban"><span>Spieler bannen</span></div>
        </div>
      `;
    }

    ui.playerModal.classList.toggle("blurred", !!state.inputModalOpen);
  }

  // Input Modal
  if (ui.inputModal.style.display !== "none") {
    ui.inputTitle.textContent = state.inputModalTitle;
    ui.inputValue.placeholder = state.inputModalPlaceholder;
    ui.inputValue.value = state.inputModalValue || "";
  }
}

// --- Keybinds (wie im Bundle) ---
window.addEventListener("keydown", (e) => {
  if (!state.menuOpen) return;

  const menuItems = state.menu.items;
  const curItem = menuItems[state.menu.currentIndex];
  const submenus = curItem?.submenus ?? [];

  switch (e.key) {
    case "ArrowDown":
      if (state.submenuOpen) {
        state.menu.currentSubmenuIndex = (state.menu.currentSubmenuIndex + 1) % (submenus.length || 1);
      } else {
        state.menu.currentIndex = (state.menu.currentIndex + 1) % (menuItems.length || 1);
      }
      render();
      break;
    case "ArrowUp":
      if (state.submenuOpen) {
        if (state.menu.currentSubmenuIndex === 0) return;
        state.menu.currentSubmenuIndex -= 1;
      } else {
        if (state.menu.currentIndex === 0) return;
        state.menu.currentIndex -= 1;
      }
      render();
      break;
    case "ArrowRight":
      if (curItem?.type === "slider") {
        if (state.menu.currentSliderValue >= 10) return;
        state.menu.currentSliderValue += 0.5;
        actions.noclipspeed();
        render();
      }
      break;
    case "ArrowLeft":
      if (curItem?.type === "slider") {
        if (state.menu.currentSliderValue <= 0) return;
        state.menu.currentSliderValue -= 0.5;
        actions.noclipspeed();
        render();
      }
      break;
    case "Enter": {
      if (state.menu.currentPage === 1) return;
      if (state.menuDialog.open) {
        e.preventDefault();
        submitMenuDialog();
        return;
      }

      const value = state.submenuOpen ? submenus[state.menu.currentSubmenuIndex]?.value : curItem?.value;

      if (curItem?.type === "select" && submenus.length > 0) state.submenuOpen = true;
      if (curItem?.type === "checkbox") {
        curItem.checkboxActivated = !curItem.checkboxActivated;
        if (curItem.value === "adminkey") {
          postJSON("https://timeline_adminmenu/adminkey", { state: curItem.checkboxActivated });
        }
      }

      switch (value) {
        case "aduty":
          actions.aduty();
          break;
        case "noclip":
          actions.noclip(false);
          break;
        case "nametags":
          actions.nametags();
          break;
        case "tpWaypoint":
          actions.tp("waypoint");
          break;
        case "tpCoords":
          actions.tp("coords");
          break;
        case "superjump":
          actions.superjump();
          break;
        case "killfeed":
          actions.killfeed();
          break;
        case "frakTP":
          actions.tp("gang");
          break;
        case "hideHud":
          actions.creator("hideHud");
          break;
        case "recordMode":
          actions.creator("recordMode");
          break;
        case "freecam":
          actions.creator("freecam");
          break;
        case "frakListe":
          actions.teammanagement("frakListe");
          break;
        case "vector3Copy":
          actions.devCopy("vector3");
          break;
        case "vector4Copy":
          actions.devCopy("vector4");
          break;
        case "rotationCopy":
          actions.devCopy("rotation");
          break;
        case "setDimension":
          actions.setDimension();
          break;
        case "spawnvehicle":
          actions.vehicle("spawn");
          break;
        case "deletevehicle":
          actions.vehicle("delete");
          break;
        case "fulltune":
          actions.vehicle("fulltune");
          break;
        case "boosten":
          actions.vehicle("boosten");
          break;
        case "repair":
          actions.vehicle("repair");
          break;
        case "clearArea":
          actions.vehicle("clearArea");
          break;
        case "giveItem":
          actions.refund("item");
          break;
        case "giveCash":
          actions.refund("cash");
          break;
        case "giveBMoney":
          actions.refund("bmoney");
          break;
        case "giveBank":
          actions.refund("bank");
          break;
        case "giveWeapon":
          actions.refund("weapon");
          break;
        case "teamannounce":
          actions.teammanagement("announce");
          break;
        case "setGroup":
          actions.teammanagement("group");
          break;
        case "crashPlayer":
          actions.troll("crash");
          break;
        case "strippPlayer":
          actions.troll("stripp");
          break;
        case "betrunken":
          actions.troll("betrunken");
          break;
        case "freeze":
          actions.troll("freeze");
          break;
        case "unfreeze":
          actions.troll("unfreeze");
          break;
        default:
          break;
      }

      render();
      break;
    }
    case "Backspace":
      if (state.menuDialog.open) {
        e.preventDefault();
        cancelMenuDialog();
        return;
      }
      if (state.submenuOpen) {
        state.submenuOpen = false;
        state.menu.currentSubmenuIndex = 0;
        render();
      } else {
        if (state.menu.inputFocused) return;
        closeAll();
      }
      break;
    case "Escape":
      if (state.menuDialog.open) {
        e.preventDefault();
        cancelMenuDialog();
        return;
      }
      if (state.inputModalOpen) {
        state.inputModalOpen = false;
        render();
        return;
      }
      closeAll();
      break;
    case "Tab":
      if (state.menu.currentPage === 0) {
        state.menu.currentPage = 1;
        postJSON("https://timeline_adminmenu/getPlayerPage", {}).then((data) => {
          if (Array.isArray(data)) state.players = data;
          render();
        });
      } else {
        state.menu.currentPage = 0;
        postJSON("https://timeline_adminmenu/switchPage0", {});
        render();
      }
      break;
    default:
      break;
  }
});

// --- window.message (wie im Bundle) ---
window.addEventListener("message", (ev) => {
  const a = ev.data;
  if (!a || typeof a !== "object") return;

  switch (a.script) {
    case "close":
      state.menuOpen = false;
      state.submenuOpen = false;
      state.menu.currentPage = 0;
      state.menu.currentIndex = 0;
      state.menu.currentSubmenuIndex = 0;
      state.menu.currentSliderValue = 1;
      render();
      break;
    case "adminmenu":
      switch (a.type) {
        case "openMenu":
          applyEnabledMenus(a.enabledMenus || []);
          state.menuOpen = true;
          state.submenuOpen = false;
          render();
          break;
        case "setLocales":
          state.locales = a.locales || { ...defaultLocales };
          state.menu.slots = a.slots ?? state.menu.slots;
          state.menu.items = buildDefaultMenuItems(state.locales);
          render();
          break;
        case "toggleKillfeed":
          state.killfeedEnabled = !!a.state;
          render();
          break;
        case "addKill":
          addKill(a.killer, a.victim);
          break;
        case "setPlayers":
          state.players = a.players || [];
          render();
          break;
        default:
          break;
      }
      break;
    case "menudialog":
      switch (a.type) {
        case "open":
          openMenuDialog(a.title, a.placeholder, a.step || 0);
          break;
        case "close":
          state.menuDialog = { open: false, title: "", placeholder: "", inputValue: "", step: 0 };
          render();
          break;
        default:
          break;
      }
      break;
    default:
      break;
  }
});

// ---- Static event bindings (einmalig) ----
ui.search.addEventListener("input", (e) => {
  state.search = e.target.value;
  render();
});
ui.search.addEventListener("focus", () => (state.menu.inputFocused = true));
ui.search.addEventListener("blur", () => (state.menu.inputFocused = false));

ui.menuDialogInput.addEventListener("input", (e) => {
  state.menuDialog.inputValue = e.target.value;
});
ui.menuDialogInput.addEventListener("focus", () => (state.menu.inputFocused = true));
ui.menuDialogInput.addEventListener("blur", () => (state.menu.inputFocused = false));

ui.menuDialogSubmit.addEventListener("click", submitMenuDialog);
ui.menuDialogCancel.addEventListener("click", cancelMenuDialog);

// Klick auf Dialog (außer Buttons) → Fokus auf Input für direktes Tippen
ui.menuDialog.addEventListener("click", (e) => {
  if (state.menuDialog.open && !e.target.closest(".button")) {
    ui.menuDialogInput.focus();
  }
});

ui.modalClose.addEventListener("click", closePlayerModal);
ui.inputValue.addEventListener("input", (e) => {
  state.inputModalValue = e.target.value;
});
ui.inputValue.addEventListener("focus", () => (state.menu.inputFocused = true));
ui.inputValue.addEventListener("blur", () => (state.menu.inputFocused = false));
ui.inputSubmit.addEventListener("click", submitInputModal);

// Delegation für dynamische Bereiche
document.addEventListener("click", (e) => {
  const t = e.target;

  // Player item click
  const playerEl = t?.closest?.(".player_item[data-playerid]");
  if (playerEl) {
    selectPlayerById(playerEl.getAttribute("data-playerid"));
    return;
  }

  // Category click
  const catEl = t?.closest?.(".category[data-page]");
  if (catEl) {
    state.selectedCategoryPage = Number(catEl.getAttribute("data-page"));
    render();
    return;
  }

  // Ban duration / ban button (data-action)
  const actionEl = t?.closest?.("[data-action]");
  if (actionEl) {
    const a = actionEl.getAttribute("data-action");
    if (a === "ban-left") {
      state.banDurationIdx = Math.max(0, state.banDurationIdx - 1);
      render();
    } else if (a === "ban-right") {
      state.banDurationIdx = Math.min(banDurations.length - 1, state.banDurationIdx + 1);
      render();
    } else if (a === "ban") {
      // ban reason input sitzt im modalActions html
      const br = $("#ban-reason");
      if (br) state.banReason = br.value;
      banPlayer();
    }
    return;
  }
});

document.addEventListener("input", (e) => {
  if (e.target?.id === "ban-reason") {
    state.banReason = e.target.value;
  }
});

// initial
render();


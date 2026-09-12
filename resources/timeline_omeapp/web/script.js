let tvClient = null;

let initInterval = null;
let isInitializing = false;
let uiBound = false;

let isShuttingDown = false;

const RECONNECT_INTERVAL_MS = 500;
let SERVER_URL = "";
fetch(`https://${GetParentResourceName()}/getConfig`, {method:"POST",body:"{}"}).then(r=>r.json()).then(c=>{SERVER_URL=(c&&c.serverUrl)||""; window.TIMELINE_OME_WS_URL=SERVER_URL;}).catch(()=>{});

// "ws://127.0.0.1:3000";

let joinMode = "join";

function startInitInterval() {
  if (initInterval) return;

  console.log("Polling again...")
  initInterval = setInterval(() => {
    try {
      if (isShuttingDown) return
      if (typeof CorTVClient !== "function") return;

      if (tvClient && tvClient.isConnected) {
        stopInitInterval();
        return;
      }

      load();
    } catch (e) {
      console.error("Init interval error:", e);
    }
  }, RECONNECT_INTERVAL_MS);
}

function stopInitInterval() {
  if (!initInterval) return;
  clearInterval(initInterval);
  initInterval = null;
}

async function initializeCorleoneTV() {
  if (isInitializing) return;
  isInitializing = true;

  if (!tvClient) {
    if (typeof CorTVClient !== "function") {
      console.warn("TimeLine TVClient is not loaded yet");
      isInitializing = false;
      return;
    }

    tvClient = new CorTVClient(SERVER_URL);
  }

  try {
    await tvClient.connect();
    console.log("TimeLine TV initialized");
  } catch (err) {
    console.error("Failed to initialize TimeLine TV:", err);
  } finally {
    isInitializing = false;
  }
}

function getButtons() {
  return {
    joinButton: document.querySelector(".join-button"),
    leaveButton: document.querySelector(".leave-button"),
    switchButton: document.querySelector(".switch")
  };
}

function setButtonState({ joinDisabled, leaveDisabled, switchDisabled }) {
  const { joinButton, leaveButton, switchButton } = getButtons();

  if (joinButton != null && typeof joinDisabled === "boolean") {
    joinButton.disabled = joinDisabled;
  }
  if (leaveButton != null && typeof leaveDisabled === "boolean") {
    leaveButton.disabled = leaveDisabled;
  }
  if (switchButton != null && typeof switchDisabled === "boolean") {
    switchButton.disabled = switchDisabled;
  }
}

function bindUIEventsOnce() {
  if (uiBound) return;
  uiBound = true;

  const { joinButton, leaveButton, switchButton } = getButtons();
  const volumeSlider = document.querySelector(".slider");
  const volumeText = document.querySelector(".volume");

  if (joinButton) {
    joinButton.addEventListener("click", () => {
      if (!tvClient || !tvClient.isConnected) {
        console.warn("Join clicked but not connected");
        return;
      }

      if (joinMode === "join") {
        tvClient.joinQueue();
      } else {
        tvClient.skipMatch();
      }
    });

  }

  if (leaveButton) {
    leaveButton.addEventListener("click", () => {
      if (!tvClient) return;
      try {
        tvClient.leaveRoom();
        tvClient.leaveQueue();
      } catch (e) {
        console.error("Error leaving room/queue:", e);
      }
    });
  }

  if (switchButton) {
    switchButton.addEventListener("click", () =>
      fetch(`https://${GetParentResourceName()}/switchSelfieMode`, { method: "POST", body: "{}" }));
  }

  if (volumeSlider && volumeText) {
    volumeSlider.addEventListener("input", (e) => {
      const value = Number(e.target.value || 0);

      volumeSlider.style.background =
        `linear-gradient(to right, ` +
        `#ED0CF6 0%, #ED0CF6 ${value}%, ` +
        `rgba(255, 255, 255, 0.15) ${value}%, ` +
        `rgba(255, 255, 255, 0.15) 100%)`;

      volumeText.textContent = `${value}%`;

      fetch(`https://${GetParentResourceName()}/setVolume`, { method: "POST", body: JSON.stringify({ volume: value }) });

      if (tvClient) {
        try {
          tvClient.setVolume(value);
        } catch (err) {
          console.error("Error setting volume:", err);
        }
      }
    });
  }
}

async function load() {
  if (tvClient && tvClient.isConnected) {
    bindUIEventsOnce();
    return;
  }

  await initializeCorleoneTV();

  if (tvClient && tvClient.isConnected) {
    bindUIEventsOnce();
    stopInitInterval();
  }
}

const debugPrint = (...args) => console.log("[DEBUG]", ...args);

window.onWaitingForMatch = () => {
  setButtonState({ joinDisabled: true, leaveDisabled: false, switchDisabled: false });
  debugPrint("onWaitingForMatch");
};

window.onMatched = () => {
  joinMode = "skip";

  const { joinButton } = getButtons();
  if (joinButton) joinButton.textContent = "Nächste";

  setButtonState({ joinDisabled: false, leaveDisabled: false });
  debugPrint("onMatched: joinMode=skip");
};

window.onLeft = () => {
  joinMode = "join";

  const { joinButton } = getButtons();
  if (joinButton) joinButton.textContent = "Betreten";

  setButtonState({ joinDisabled: false, leaveDisabled: false });
  debugPrint("onLeft → joinMode=join");
};


window.onPeerLeft = () => {
  setButtonState({ joinDisabled: false, leaveDisabled: false, switchDisabled: false });

  setTimeout(() => {
    if (tvClient && tvClient.isConnected) {
      tvClient.joinQueue();
    }
  }, 1000);

    const { joinButton } = getButtons();
  if (joinButton) joinButton.textContent = "Betreten";

  debugPrint("onPeerLeft - rejoining queue");
};

window.onDisconnected = () => {
  setButtonState({ joinDisabled: true, leaveDisabled: true, switchDisabled: false });

  if (isShuttingDown) {
    debugPrint("onDisconnected but app is shutting down – no reconnect");
    return;
  }

  debugPrint(
    "onDisconnected - server closed connection, starting connection interval"
  );
  startInitInterval();
};

window.onConnected = () => {
  setButtonState({ joinDisabled: false, leaveDisabled: true, switchDisabled: false });
  debugPrint("onConnected");
};

window.onError = (errorMessage) => {
  console.error("Error:", errorMessage);
};

startInitInterval();

if (typeof CorTVClient !== "undefined") {
  load();
}
async function cleanup() {
  isShuttingDown = true;
  stopInitInterval();

  if (tvClient) {
    try {
      tvClient.disconnect()
      await tvClient.cleanup();

      tvClient = null;
    } catch (e) {
      console.error("Error during tvClient cleanup:", e);
    }
  }

  setButtonState({ joinDisabled: false, leaveDisabled: false });
}

// onSettingsChange?.((settings) => {
//   let theme = settings.display.theme;
//   document.getElementsByClassName("app")[0].dataset.theme = theme;
// });

// getSettings?.().then((settings) => {
//   let theme = settings.display.theme;
//   document.getElementsByClassName("app")[0].dataset.theme = theme;
// });

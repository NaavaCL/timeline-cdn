class CorTVClient {
  constructor(serverUrl) {
    this.serverUrl = serverUrl;
    this.userId = null;
    this.userServerId = null;

    this.ws = null;
    this.device = null;
    this.sendTransport = null;
    this.recvTransport = null;
    this.producers = new Map();
    this.consumers = new Map();
    this.gameStream = null;
    this.remoteStream = null;
    this.isConnected = false;
    this.messageHandlers = new Map();
    this._localPlaceholderEl = null;
    this.gameCanvas = document.getElementById("localCanvas");
    this.gameRender = null;
    this.captureActive = false;
    this.pendingProducers = [];

    this._rafId = null;
    this._remoteStatusEl = null;

    this._ensureServerId().catch((err) => {
      console.error("[CorTV] Failed to ensure serverId on init:", err);
    });
  }

  setLocalPlaceholderVisible(visible) {
    if (!this.localPlaceholder) return;
    this.localPlaceholder.style.display = visible ? "flex" : "none";
  }

  _ensureLocalPlaceholder() {
    const all = document.querySelectorAll("#localPlaceholder");
    if (all.length > 0) {
      const primary = all[0];
      for (let i = 1; i < all.length; i++) {
        try {
          all[i].remove();
        } catch (e) {
          console.warn("Failed to remove extra localPlaceholder:", e);
        }
      }

      this._localPlaceholderEl = primary;
      if (document.body.contains(primary)) {
        return primary;
      }
    }

    if (this._localPlaceholderEl && document.body.contains(this._localPlaceholderEl)) {
      return this._localPlaceholderEl;
    }

    const phoneCameras = document.querySelector(".phone-cameras");
    if (!phoneCameras) {
      console.warn("[CorTV] .phone-cameras container not found for local placeholder");
      return null;
    }

    let topCamera = phoneCameras.querySelector(".camera:not(.bot)");
    if (!topCamera) {
      topCamera = document.createElement("div");
      topCamera.className = "camera";
      phoneCameras.insertBefore(topCamera, phoneCameras.firstChild || null);
    }

    if (getComputedStyle(topCamera).position === "static") {
      topCamera.style.position = "relative";
    }

    const el = document.createElement("div");
    el.id = "localPlaceholder";
    el.style.position = "absolute";
    el.style.inset = "0";
    el.style.display = "flex";
    el.style.flexDirection = "column";
    el.style.alignItems = "center";
    el.style.justifyContent = "center";
    el.style.textAlign = "center";
    el.style.padding = "1.2rem";
    el.style.fontSize = "1.4vh";
    el.style.color = "rgba(255,255,255,0.85)";
    el.style.pointerEvents = "none";
    el.style.whiteSpace = "pre-line";

    const icon = document.createElement("div");
    icon.textContent = "▶";
    icon.style.fontSize = "2.2vh";
    icon.style.marginBottom = "0.6rem";
    icon.style.opacity = "0.8";

    const title = document.createElement("div");
    title.textContent = "Bereit, wenn du es bist";
    title.style.fontWeight = "600";
    title.style.marginBottom = "0.3rem";

    const subtitle = document.createElement("div");
    subtitle.textContent = "Drücke auf „Betreten“, um TimeLine TV zu starten.";
    subtitle.style.fontSize = "1.2vh";
    subtitle.style.opacity = "0.8";

    el.appendChild(icon);
    el.appendChild(title);
    el.appendChild(subtitle);

    topCamera.appendChild(el);
    this._localPlaceholderEl = el;
    return el;
  }

  setLocalPlaceholderVisible(visible) {
    const el = this._ensureLocalPlaceholder();
    if (!el) return;
    el.style.display = visible ? "flex" : "none";
  }

  async _ensureServerId(force = false) {
    if (!force && this.userServerId) {
      return this.userServerId;
    }

    if (this._serverIdPromise && !force) {
      return this._serverIdPromise;
    }

    this._serverIdPromise = (async () => {
      try {
        const res = await fetch(`https://${GetParentResourceName()}/getServerId`, {
          method: "POST",
          body: "{}",
        });

        if (!res.ok) {
          throw new Error(`getServerId HTTP ${res.status}`);
        }

        const serverId = await res.json();
        this.userServerId = serverId;
        this.userId = String(serverId);
        console.log("[CorTV] Fetched serverId from backend:", serverId);

        return this.userServerId;
      } catch (err) {
        console.error("[CorTV] _ensureServerId failed:", err);
        this.userServerId = null;
        return null;
      } finally {
        this._serverIdPromise = null;
      }
    })();

    return this._serverIdPromise;
  }

  getOrCreateGameCanvas() {
    if (this.gameCanvas && document.body.contains(this.gameCanvas)) {
      return this.gameCanvas;
    }

    let canvas = document.getElementById("localCanvas");
    if (canvas && document.body.contains(canvas)) {
      this.gameCanvas = canvas;
      return this.gameCanvas;
    }

    const phoneCameras = document.querySelector(".phone-cameras");
    if (!phoneCameras) {
      console.warn("[CorTV] .phone-cameras container not found, cannot recreate #localCanvas");
      this.gameCanvas = null;
      return null;
    }

    let topCamera = phoneCameras.querySelector(".camera:not(.bot)");
    if (!topCamera) {
      topCamera = document.createElement("div");
      topCamera.className = "camera";
      phoneCameras.insertBefore(topCamera, phoneCameras.firstChild || null);
    } else {
      topCamera.innerHTML = "";
    }

    canvas = document.createElement("canvas");
    canvas.id = "localCanvas";
    canvas.className = "camera-canvas";
    canvas.width = 50;
    canvas.height = 50;

    topCamera.appendChild(canvas);

    this.gameCanvas = canvas;
    return this.gameCanvas;
  }


  async connect() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.warn("connect() called but ws is already open.");
      this.isConnected = true;
      return;
    }

    this.setRemoteStatus('Verbindung zum Server wird hergestellt')

    return new Promise((resolve, reject) => {
      (async () => {
        try {
          await this._ensureServerId();

          let url = `${this.serverUrl}?userId=${encodeURIComponent(this.userId)}`;

          try {
            this.ws = new WebSocket(url);
          } catch (err) {
            console.error("Failed to create WebSocket:", err);
            throw err;
          }

          this.ws.onopen = () => {
            console.log("Connected to TimeLine TV Server");
            this.isConnected = true;
            this.setupMessageHandlers();
            this.setRemoteStatus("Nicht in Warteschlange");
            if (window.onConnected) {
              window.onConnected();
            }

            resolve();
          };

          this.ws.onerror = (error) => {
            console.error("WebSocket error:", error);
            reject(error);
          };

          this.ws.onclose = () => {
            console.log("Disconnected from TimeLine TV Server");
            this.isConnected = false;
            this.cleanup();
            this.setRemoteStatus("Nicht verbunden");

            if (window.onDisconnected) {
              try {
                window.onDisconnected();
              } catch (e) {
                console.error("onDisconnected handler error:", e);
              }
            }
          };
        } catch (err) {
          reject(err);
        }
      })();
    });
  }

  skipMatch() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn("[CorTV] skipMatch called but WS not open");
      return;
    }

    console.log("[CorTV] Skipping current match");
    this.send({ type: "skip_match" });

    this.cleanup({ preserveLocalPreview: true });
    this.setRemoteStatus("Suche nächsten Spieler...");
    if (window.onWaitingForMatch) {
      window.onWaitingForMatch()
    }
  }


  setupMessageHandlers() {
    if (!this.ws) return;

    this.ws.onmessage = async (event) => {
      let message;
      try {
        message = JSON.parse(event.data);
      } catch (e) {
        console.error("Failed to parse WS message:", e, event.data);
        return;
      }

      if (!message || !message.type) {
        console.warn("Unknown WS message shape:", message);
        return;
      }

      console.log("Received message: ", message.type);

      if (this.messageHandlers.has(message.type)) {
        const handlers = this.messageHandlers.get(message.type);
        handlers.forEach((handler) => {
          try {
            handler(message);
          } catch (e) {
            console.error("Message handler error:", e);
          }
        });
      }

      switch (message.type) {
        case "waiting":
          this.onWaiting();
          break;

        case "matched":
          await this.onMatched(message);
          break;

        case "newProducer":
          await this.onNewProducer(message);
          break;

        case "transportCreated":

          break;

        case "transportConnected":

          break;

        case "produced":

          break;

        case "consumed":
          await this.onConsumed(message);
          break;

        case "peerLeft":
          this.onPeerLeft();
          break;

        case "leftQueue":
          window.onLeft();
          break;

        case "queueTimeout":
          this.onQueueTimeout(message);
          break;

        case "error":
          this.onError(message);
          break;
        default:
          console.log("Unknown message type:", message.type)
      }
    };
  }

  _ensureRemoteStatusOverlay() {
    const allOverlays = document.querySelectorAll("#remoteStatusOverlay");
    if (allOverlays.length > 0) {
      const primary = allOverlays[0];
      for (let i = 1; i < allOverlays.length; i++) {
        try {
          allOverlays[i].remove();
          console.log("removing overlay at index", i)
        } catch (e) {
          console.warn("Failed to remove extra remoteStatusOverlay:", e);
        }
      }

      this._remoteStatusEl = primary;
      console.log("primary", primary, document.body.contains(primary))
      if (document.body.contains(primary)) {
        return primary;
      }
    }

    if (this._remoteStatusEl && document.body.contains(this._remoteStatusEl)) {
      return this._remoteStatusEl;
    }

    const cameraBot = document.querySelector(".camera.bot");
    if (!cameraBot) {
      console.warn("camera.bot container not found for status overlay");
      return null;
    }

    if (getComputedStyle(cameraBot).position === "static") {
      cameraBot.style.position = "relative";
    }

    const el = document.createElement("div");
    el.id = "remoteStatusOverlay";
    el.style.position = "absolute";
    el.style.inset = "0";
    el.style.display = "flex";
    el.style.alignItems = "center";
    el.style.justifyContent = "center";
    el.style.textAlign = "center";
    el.style.fontSize = "1.4vh";
    el.style.color = "rgba(255,255,255,0.85)";
    el.style.pointerEvents = "none";
    el.style.padding = "1.2rem";
    el.style.whiteSpace = "pre-line";

    cameraBot.appendChild(el);
    this._remoteStatusEl = el;
    console.log("assigned", this._remoteStatusEl)
    return el;
  }

  onQueueTimeout(message) {
    console.log("Queue timeout from server:", message);

    this.captureActive = false;

    if (this.gameRender && typeof this.gameRender.pause === "function") {
      try {
        this.gameRender.pause();
      } catch (e) {
        console.error("Error pausing gameRender on timeout:", e);
      }
    }

    this.setCameraCanvasDisplay("none");

    this.setRemoteStatus(
      "Kein Spieler gefunden.\nVersuch es später nochmal."
    );

    if (window.onLeft) {
      try {
        window.onLeft();
      } catch (e) {
        console.error("onLeft handler error:", e);
      }
    }
  }


  setRemoteStatus(text) {
    const el = this._ensureRemoteStatusOverlay();
    if (!el) return;

    if (!text) {
      el.style.display = "none";
      el.innerHTML = "";
      return;
    }

    el.style.display = "flex";
    el.innerHTML = "";
    const isWaiting = /warte|verbinde|suche/i.test(text);

    if (isWaiting) {
      const wrapper = document.createElement("div");
      wrapper.style.display = "flex";
      wrapper.style.alignItems = "center";
      wrapper.style.justifyContent = "center";
      wrapper.style.gap = "0.8rem";
      wrapper.style.whiteSpace = "pre-line";

      const spinner = document.createElement("div");
      spinner.className = "cortv-spinner";

      const label = document.createElement("span");
      label.textContent = text;

      wrapper.appendChild(spinner);
      wrapper.appendChild(label);
      el.appendChild(wrapper);
    } else {
      const label = document.createElement("span");
      label.style.whiteSpace = "pre-line";
      label.textContent = text;
    }
  }

  _clearRemoteCanvas() {
    const canvas = document.getElementById("remoteCanvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  async joinQueue() {
    if (!this.isConnected || !this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error("Cannot join queue: not connected to server");
      this.setRemoteStatus("Server nicht verbunden");
      return;
    }

    this.send({ type: "join_queue" });
    console.log("Joined matching queue");
    this.setRemoteStatus("Warte auf anderen Spieler ...");

    if (this.gameRender) {
      this.gameRender.resume();
    }

    if (window.onWaitingForMatch) {
      window.onWaitingForMatch();
    }

    this.setLocalPlaceholderVisible(false);
    this.setCameraCanvasDisplay("block");

    const canvas = this.getOrCreateGameCanvas();
    console.log("joinQueue canvas check:", canvas, document.getElementById("localCanvas"));

    if (canvas) {
      this.gameRender = components.createGameRender(canvas);
      document.querySelectorAll(".camera-canvas").forEach((c) => {
        c.style.width = "100%";
        c.style.height = "100%";
      });

      this.setCameraCanvasDisplay("block");
    } else {
      console.warn("[CorTV] joinQueue: could not obtain game canvas");
    }
  }

  leaveQueue() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.send({ type: "leave_queue" });
    console.log("Left matching queue");
    this.setRemoteStatus("Nicht in Warteschlange");
    this.setLocalPlaceholderVisible(true);
  }

  leaveRoom() {
    try {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.send({ type: "leave_room" });
      }
      console.log("Left room");
    } catch (e) {
      console.error("Error leaving room:", e);
    } finally {
      this.cleanup();
    }
  }


  async onMatched(message) {
    console.log("Matched with peer!");
    this.setRemoteStatus("Verbinde...");

    try {
      await this.initializeDevice(message.rtpCapabilities);
      await this.createTransports();
      await this.setupGameRenderer();
      await this.produce();

      this.setRemoteStatus("Verbunden\nwarte auf Bild ...");

      if (window.onMatched) {
        window.onMatched();
      }
    } catch (error) {
      this.setRemoteStatus("Verbindung fehlgeschlagen");
      console.error("Error during match setup:", error);
      if (window.onError) {
        window.onError("Failed to establish connection");
      }
    }
  }

  async initializeDevice(rtpCapabilities) {
    try {
      console.log(1)
      this.device = new mediasoupClient.Device();
      console.log(rtpCapabilities)
      await this.device.load({ routerRtpCapabilities: rtpCapabilities });
      console.log("Device initialized");
    } catch (error) {
      console.error("Failed to initialize device:", error);
      throw error;
    }
  }

  async createTransports() {
    if (!this.device) throw new Error("Device not initialized");

    try {
      this.send({ type: "createWebRtcTransport", direction: "send" });
      const sendTransportData = await this.waitForMessage("transportCreated");
      console.log(sendTransportData, "sendTransportData")
      this.sendTransport = this.device.createSendTransport({
        id: sendTransportData.id,
        iceParameters: sendTransportData.iceParameters,
        iceCandidates: sendTransportData.iceCandidates,
        dtlsParameters: sendTransportData.dtlsParameters,
      });
      this.sendTransport.on("connect", async ({ dtlsParameters }, callback, errback) => {
        try {
          console.log("[sendTransport] connect", this.sendTransport.id);
          this.send({
            type: "connectWebRtcTransport",
            transportId: this.sendTransport.id,
            dtlsParameters,
          });
          await this.waitForMessage("transportConnected");
          callback();
        } catch (error) {
          console.error("Send transport connect error:", error);
          errback(error);
        }
      });

      this.sendTransport.on("connectionstatechange", (state) => {
        console.log("[sendTransport] state:", state);
      });


      this.sendTransport.on(
        "produce",
        async ({ kind, rtpParameters }, callback, errback) => {
          try {
            this.send({
              type: "produce",
              transportId: this.sendTransport.id,
              kind,
              rtpParameters,
            });
            const response = await this.waitForMessage("produced");
            callback({ id: response.producerId });
          } catch (error) {
            console.error("Send transport produce error:", error);
            errback(error);
          }
        }
      );

      this.send({ type: "createWebRtcTransport", direction: "recv" });
      const recvTransportData = await this.waitForMessage("transportCreated");
      console.log(recvTransportData, "data of recvTransport")
      this.recvTransport = this.device.createRecvTransport({
        id: recvTransportData.id,
        iceParameters: recvTransportData.iceParameters,
        iceCandidates: recvTransportData.iceCandidates,
        dtlsParameters: recvTransportData.dtlsParameters,
      });

      this.recvTransport.on("connectionstatechange", (state) => {
        console.log("[recvTransport] connectionstatechange:", state);
      });


      this.recvTransport.on("connect", async ({ dtlsParameters }, callback, errback) => {
        try {
          console.log("[recvTransport] connect", this.recvTransport.id);
          this.send({
            type: "connectWebRtcTransport",
            transportId: this.recvTransport.id,
            dtlsParameters,
          });
          await this.waitForMessage("transportConnected");
          callback();
        } catch (error) {
          console.error("Receive transport connect error:", error);
          errback(error);
        }
      });

      if (this.pendingProducers.length > 0) {
        console.log(
          `Processing ${this.pendingProducers.length} queued producers`
        );
        const queued = [...this.pendingProducers];
        this.pendingProducers = [];
        for (const msg of queued) {
          await this.onNewProducer(msg);
        }
      }
    } catch (error) {
      console.error("Failed to create transports:", error);
      throw error;
    }
  }

  async setupGameRenderer() {
    try {
      this.captureActive = true;

      const captureFrame = async () => {
        if (!this.captureActive) return;

        try {
          const canvas = this.getOrCreateGameCanvas();
          if (!canvas) {
            console.warn("[CorTV] #localCanvas not in DOM yet, retrying...");
            this._rafId = requestAnimationFrame(captureFrame);
            return;
          }

          if (this.gameRender) {
            this.gameRender.resume();
            this.setCameraCanvasDisplay("block");
            return;
          }

          this.gameRender = components.createGameRender(canvas);
          document.querySelectorAll(".camera-canvas").forEach((canvas) => {
            canvas.style.width = "100%";
            canvas.style.height = "100%";
          });
        } catch (error) {
          console.error("Error capturing game frame:", error);
        }
      };

      await captureFrame();

      const canvas = this.getOrCreateGameCanvas();
      if (!canvas.width || !canvas.height) {
        canvas.width = 70;
        canvas.height = 70;
      }
      const videoStream = canvas.captureStream(30);

      this.gameStream = new MediaStream();

      const videoTracks = videoStream.getVideoTracks();
      if (videoTracks.length > 0) {
        this.gameStream.addTrack(videoTracks[0]);
      }

      const localVideo = document.getElementById("localVideo");
      if (localVideo) {
        localVideo.srcObject = this.gameStream;
        localVideo.muted = true;
        try {
          await localVideo.play();
        } catch (e) {
          console.warn("localVideo.play() failed (probably autoplay):", e);
        }
      }

      console.log("Game renderer initialized successfully");
      return this.gameStream;
    } catch (error) {
      console.error("Failed to setup game renderer:", error);
      throw error;
    }
  }

  async produce() {
    try {
      if (!this.gameStream) {
        throw new Error("Game stream not initialized");
      }
      if (!this.sendTransport) {
        throw new Error("Send transport not created");
      }

      const videoTrack = this.gameStream.getVideoTracks()[0];
      if (videoTrack) {
        const videoProducer = await this.sendTransport.produce({
          track: videoTrack,
        });
        this.producers.set("video", videoProducer);
        console.log("Video producer created (game screen)");
      }

      const audioTrack = this.gameStream.getAudioTracks()[0];
      if (audioTrack) {
        const audioProducer = await this.sendTransport.produce({
          track: audioTrack,
        });
        this.producers.set("audio", audioProducer);
        console.log("Audio producer created (microphone)");
      }

      console.log("Started producing game stream");
    } catch (error) {
      console.error("Failed to produce media:", error);
      throw error;
    }
  }

  async onNewProducer(message) {
    console.log("New producer from peer:", message);

    if (!this.recvTransport || !this.device) {
      console.log("Recv transport not ready yet, queuing producer");
      this.pendingProducers.push(message);
      return;
    }

    try {
      this.send({
        type: "consume",
        transportId: this.recvTransport.id,
        producerId: message.producerId,
        rtpCapabilities: this.device.rtpCapabilities,
      });
    } catch (error) {
      console.error("Failed to request consumption:", error);
    }
  }

  async onConsumed(message) {
    try {
      if (!this.recvTransport) {
        console.warn("Received consumed message but recvTransport is null");
        return;
      }

      // --- Create consumer and attach track ---
      const consumer = await this.recvTransport.consume({
        id: message.consumerId,
        producerId: message.producerId,
        kind: message.kind,
        rtpParameters: message.rtpParameters,
      });
      this.consumers.set(message.consumerId, consumer);

      if (!this.remoteStream) this.remoteStream = new MediaStream();
      for (const t of this.remoteStream.getTracks()) {
  if (t.kind === consumer.kind) {
    this.remoteStream.removeTrack(t);
    try { t.stop(); } catch {}
  }
}

this.remoteStream.addTrack(consumer.track);

      console.log(
        "Remote stream updated:",
        this.remoteStream
          .getTracks()
          .map(
            (t) => `${t.kind}:${t.readyState}:${t.muted ? "muted" : "unmuted"}`
          )
      );
      console.log("Consumer flags:", {
        kind: consumer.kind,
        paused: consumer.paused,
        producerPaused: consumer.producerPaused,
      });

      // --- AUDIO path ---
      if (message.kind === "audio") {
        const audioEl = document.getElementById("remoteAudio");
        if (audioEl) {
          audioEl.srcObject = this.remoteStream;
          audioEl.autoplay = true;
          try {
            await audioEl.play();
            console.log("Audio playback started");
          } catch (err) {
            console.warn("Audio autoplay blocked:", err);
          }
        }
        return;
      }

      // --- VIDEO path ---
      const hiddenVideo = document.getElementById("remoteVideoBridge");
      const canvas = document.getElementById("remoteCanvas");
      if (!hiddenVideo || !canvas) {
        console.error("remoteVideoBridge or remoteCanvas missing in DOM");
        return;
      }

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        console.error("❌ Could not get 2D context from remoteCanvas");
        return;
      }

      // IMPORTANT: make sure the hidden video is *not* display:none
      // Put it offscreen but visible so browsers will decode frames.
      hiddenVideo.style.position = "absolute";
      hiddenVideo.style.left = "-9999px";
      hiddenVideo.style.top = "0";
      hiddenVideo.style.width = "1px";
      hiddenVideo.style.height = "1px";
      hiddenVideo.style.display = "block"; // ensure not 'none'

      hiddenVideo.srcObject = this.remoteStream;
      hiddenVideo.muted = true;
      hiddenVideo.playsInline = true;
      hiddenVideo.autoplay = true;

      console.log(
        "Attached MediaStream to remoteVideoBridge:",
        this.remoteStream
      );
      console.log("Initial video state:", {
        paused: hiddenVideo.paused,
        readyState: hiddenVideo.readyState,
        videoWidth: hiddenVideo.videoWidth,
        videoHeight: hiddenVideo.videoHeight,
      });

      // --- Wait for track to actually deliver frames (onunmute) ---
      const track = consumer.track;
      const waitForUnmute = () =>
        new Promise((resolve) => {
          if (!track.muted && track.readyState === "live") {
            resolve();
          } else {
            console.log("Waiting for track to unmute / go live…", {
              muted: track.muted,
              readyState: track.readyState,
            });
            const onUnmute = () => {
              console.log("Track unmuted");
              track.removeEventListener("unmute", onUnmute);
              resolve();
            };
            track.addEventListener("unmute", onUnmute, { once: true });
          }
        });

      // As a safety net, try to resume the consumer if it reports paused
      if (consumer.paused || consumer.producerPaused) {
        try {
          await consumer.resume();
          console.log("▶consumer.resume() called");

          if (consumer.kind === "video") {
            consumer.on("layerschange", (layers) => {
              console.log(`Consumer ${consumer.id} layers:`, layers);
            });
          }
        } catch (e) {
          console.warn("consumer.resume() failed (often harmless):", e);
        }
      }

      await waitForUnmute();

      // --- Drawing function ---
      const startDrawing = () => {
        if (this._rafId) cancelAnimationFrame(this._rafId);

        const draw = () => {
          if (hiddenVideo.readyState >= 2) {
            if (
              hiddenVideo.videoWidth &&
              hiddenVideo.videoHeight &&
              (canvas.width !== hiddenVideo.videoWidth ||
                canvas.height !== hiddenVideo.videoHeight)
            ) {
              canvas.width = hiddenVideo.videoWidth;
              canvas.height = hiddenVideo.videoHeight;
              console.log(
                `Canvas resized to ${canvas.width}x${canvas.height}`
              );
            }
            ctx.drawImage(hiddenVideo, 0, 0, canvas.width, canvas.height);
          }
          this._rafId = requestAnimationFrame(draw);
        };

        console.log("🎨 Starting draw loop…");
        draw();
      };

      // Prefer event-based kick
      const onVideoReady = () => {
        console.log(
          "remoteVideoBridge ready/play event fired:",
          hiddenVideo.readyState
        );
        hiddenVideo.removeEventListener("playing", onVideoReady);
        hiddenVideo.removeEventListener("loadeddata", onVideoReady);
        startDrawing();
        this.setRemoteStatus(null);
      };
      hiddenVideo.addEventListener("playing", onVideoReady);
      hiddenVideo.addEventListener("loadeddata", onVideoReady);

      // Try to play after track is live (and force a .load() first)
      //hiddenVideo.load();

      const playWithTimeout = async (el, ms = 5000) => {
        let timer;
        const timeout = new Promise((_, reject) => {
          timer = setTimeout(() => reject(new Error("play() timeout")), ms);
        });
        try {
          await Promise.race([el.play(), timeout]);
        } finally {
          clearTimeout(timer);
        }
      };

      const tryPlayWithRetries = async (retries = 5) => {
        for (let i = 0; i < retries; i++) {
          try {
            if (hiddenVideo.readyState < 2) {
              await new Promise((r) => setTimeout(r, 100));
            }

            await playWithTimeout(hiddenVideo, 5000); // <– use this
            console.log("🎬 video.play() resolved");
            return true;
          } catch (e) {
            if (e.message === "play() timeout") {
              console.warn("play() promise never settled (no frames?)", e);
              return false;
            }
            if (e.name === "AbortError") {
              console.warn("play() aborted:", e);
              return false;
            }
            console.warn(`Autoplay blocked (attempt ${i + 1}/${retries})`, e);
            await new Promise((r) => setTimeout(r, 300));
          }
        }
        return false;
      };

      setTimeout(async () => {
        console.log(
          "Attempting video.play(), readyState:",
          hiddenVideo.readyState
        );
        const ok = await tryPlayWithRetries();
        if (!ok) {
          console.warn("Waiting for user gesture to start playback…");
          const resume = async () => {
            try {
              await hiddenVideo.play();
              startDrawing();
              this.setRemoteStatus(null);
            } catch (err2) {
              console.error("video.play() still failing:", err2);
            } finally {
              document.removeEventListener("click", resume);
              document.removeEventListener("keydown", resume);
            }
          };
          document.addEventListener("click", resume, { once: true });
          document.addEventListener("keydown", resume, { once: true });
        } else if (hiddenVideo.readyState >= 2) {
          startDrawing();
          this.setRemoteStatus(null);
        }
      }, 250);
    } catch (error) {
      console.error("❌ Failed to consume media:", error);
    }
  }

  onPeerLeft() {
    console.log("Peer left the room");

    this.setRemoteStatus("Der andere Spieler hat verlassen.\nSuche neuen Partner ...");
    this._clearRemoteCanvas();

    if (window.onWaitingForMatch) {
      window.onWaitingForMatch()
    }

    this.cleanup({ preserveLocalPreview: true });

    if (window.onPeerLeft) {
      window.onPeerLeft();
    }
  }

  onTransportCreated(message) {
    this.resolveMessagePromise("transportCreated", message.data);
  }

  onTransportConnected() {
    this.resolveMessagePromise("transportConnected", true);
  }

  onProduced(message) {
    this.resolveMessagePromise("produced", message);
  }

  onError(message) {
    console.error("Server error:", message.error);
    this.setRemoteStatus("Serverfehler:\n" + (message.error || "Unbekannt"));
    if (window.onError) {
      window.onError(message.error);
    }

    console.log(message.missingId, "missingId")
    if (message.missingId) {
      fetch(`https://${GetParentResourceName()}/getServerId`, {
        method: "POST",
        body: "{}"
      }).then(res => res.json()).then(res => {
        this.userServerId = res;
      })
    }
  }

  waitForMessage(type) {
    return new Promise((resolve) => {
      if (!this.messageHandlers.has(type)) {
        this.messageHandlers.set(type, []);
      }

      const handler = (message) => {
        const handlers = this.messageHandlers.get(type);
        const index = handlers.indexOf(handler);
        if (index > -1) {
          handlers.splice(index, 1);
        }
        resolve(message.data || message);
      };

      this.messageHandlers.get(type).push(handler);
    });
  }

  resolveMessagePromise(type, data) {
    if (this.messageHandlers.has(type)) {
      const handlers = this.messageHandlers.get(type);
      handlers.forEach((handler) => handler({ data }));
    }
  }

  send(data) {
    if (!this.ws) {
      console.error("WebSocket not initialized");
      return;
    }
    if (this.ws.readyState !== WebSocket.OPEN) {
      console.error("WebSocket not connected, readyState:", this.ws.readyState);
      return;
    }
    try {
      this.ws.send(JSON.stringify(data));
    } catch (e) {
      console.error("Failed to send message on WebSocket:", e);
    }
  }

  setVolume(volume) {
    const remoteVideo = document.getElementById("remoteVideo");
    if (remoteVideo) {
      remoteVideo.volume = volume / 100;
    }
  }

  toggleMute() {
    const audioProducer = this.producers.get("audio");
    if (audioProducer) {
      if (audioProducer.paused) {
        audioProducer.resume();
        return false;
      } else {
        audioProducer.pause();
        return true;
      }
    }
    return false;
  }

  async cleanup(options = {}) {
    const preserveLocalPreview = options?.preserveLocalPreview === true;

    console.log("Cleaning up...", { preserveLocalPreview });

    this.captureActive = false;
    if (this._rafId) {
      try { cancelAnimationFrame(this._rafId); } catch (e) { }
      this._rafId = null;
    }

    if (this.remoteStream) {
      try { this.remoteStream.getTracks().forEach((t) => t.stop()); } catch (e) { }
      this.remoteStream = null;
    }

    this.producers.forEach((p) => { try { p.close(); } catch (e) { } });
    this.producers.clear();

    this.consumers.forEach((c) => { try { c.close(); } catch (e) { } });
    this.consumers.clear();

    if (this.sendTransport) {
      try { this.sendTransport.close(); } catch (e) { }
      this.sendTransport = null;
    }
    if (this.recvTransport) {
      try { this.recvTransport.close(); } catch (e) { }
      this.recvTransport = null;
    }

    const hiddenVideo = document.getElementById("remoteVideoBridge");
    const remoteVideo = document.getElementById("remoteVideo");
    if (remoteVideo) remoteVideo.srcObject = null;
    if (hiddenVideo) hiddenVideo.srcObject = null;

    this._clearRemoteCanvas();
    this.device = null;
    this.pendingProducers = [];
    this.messageHandlers.clear();

    if (!preserveLocalPreview) {
      if (this.gameStream) {
        try { this.gameStream.getTracks().forEach((t) => t.stop()); } catch (e) { }
        this.gameStream = null;
      }

      if (this.gameRender) {
        try {
          if (typeof this.gameRender.pause === "function") this.gameRender.pause();
        } catch (e) { }
        this.gameRender = null;
      }

      this.setCameraCanvasDisplay("none");
      this.setLocalPlaceholderVisible(true);

      const localVideo = document.getElementById("localVideo");
      if (localVideo) localVideo.srcObject = null;

      this.gameCanvas = null;
    } else {
      this.setLocalPlaceholderVisible(false);
      this.setCameraCanvasDisplay("block");
    }

    console.log("cleaned up");
  }


  setCameraCanvasDisplay(display) {
    document.querySelectorAll(".camera-canvas").forEach((canvas) => {
      canvas.style.display = display;
    });
  }

  disconnect() {
    try {
      console.log(this.ws, "Disconnecting")
      if (this.ws) {
        this.ws.close();
      }
    } catch (e) {
      console.error("Error closing WebSocket:", e);
    } finally {
      this.ws = null;
      // this.cleanup();
    }
  }
}
function formatTime(seconds) {
    if (typeof seconds !== 'number' || isNaN(seconds) || seconds < 0) {
        return "00:00";
    }
    let minutes = Math.floor(seconds / 60);
    let remainingSeconds = seconds % 60;
    
    let minutesStr = minutes < 10 ? "0" + minutes : minutes;
    let secondsStr = remainingSeconds < 10 ? "0" + remainingSeconds : remainingSeconds;
    
    return minutesStr + ":" + secondsStr;
}

window.addEventListener('message', function(event) {
    let data = event.data;

    if (data.action === "show") {
        document.getElementById("hud").style.display = "flex";
    }

    if (data.action === "hide") {
        document.getElementById("hud").style.display = "none";
    }

    if (data.action === "update") {
        if (data.time !== undefined) {
            document.getElementById("time").innerText = formatTime(data.time);
        }
        if (data.players !== undefined) {
            document.getElementById("players").innerText = data.players;
        }
        if (data.kills !== undefined) {
            document.getElementById("kills").innerText = data.kills;
        }
    }
});

if (window.location.protocol === 'file:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    console.log("Lootdrop HUD running in browser preview mode.");
    
    document.body.style.backgroundColor = "#222222";
    
    document.getElementById("hud").style.display = "flex";
    
    let testTime = 180; // 3 Minuten
    let testPlayers = 4;
    let testKills = 1;
    
    function refreshSimulation() {
        document.getElementById("time").innerText = formatTime(testTime);
        document.getElementById("players").innerText = testPlayers;
        document.getElementById("kills").innerText = testKills;
    }
    
    refreshSimulation();
    
    setInterval(function() {
        if (testTime > 0) {
            testTime--;
        } else {
            testTime = 180; // Reset auf 3 Minuten
        }
        
        if (Math.random() > 0.93) {
            let change = Math.random() > 0.5 ? 1 : -1;
            testPlayers = Math.max(1, testPlayers + change);
        }
        
        if (Math.random() > 0.98) {
            testKills++;
        }
        
        refreshSimulation();
    }, 1000);
}
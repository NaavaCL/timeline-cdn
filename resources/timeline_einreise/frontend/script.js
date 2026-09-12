let isSubmitting = false;
let currentStaffPlayers = [];
let selectedPlayerId = null;

const UI_BASE_WIDTH = 1920;
const UI_BASE_HEIGHT = 1080;

function applyUiScale() {
    let scaler = document.getElementById('ui-scaler');
    if (!scaler) return;

    let scaleX = window.innerWidth / UI_BASE_WIDTH;
    let scaleY = window.innerHeight / UI_BASE_HEIGHT;
    let scale = Math.min(scaleX, scaleY);

    scaler.style.transform = 'scale(' + scale + ')';
}

function safeGetParentResourceName() {
    if (typeof GetParentResourceName === 'function') {
        try {
            return GetParentResourceName();
        } catch (e) {
            return 'timeline_einreise';
        }
    }
    return 'timeline_einreise';
}

window.addEventListener('resize', applyUiScale);

document.addEventListener('DOMContentLoaded', function() {
    applyUiScale();

    window.addEventListener('message', function(event) {
        let data = event.data;
        if (data.action === "open") {
            openPanel(data);
        } else if (data.action === "close") {
            closePanel();
        } else if (data.action === "openStaff") {
            openStaffPanel(data.players);
        } else if (data.action === "closeStaff") {
            closeStaffPanel();
        } else if (data.action === "updateStaffList") {
            updateStaffList(data.players);
        }
    });

    window.addEventListener('wheel', function(e) {
        let wrapper = document.querySelector('.panel-wrapper');
        if (wrapper && wrapper.classList.contains('visible')) {
            let res = safeGetParentResourceName();
            if (e.deltaY < 0) {
                fetch(`https://${res}/zoomIn`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({})
                }).catch(function() {});
            } else if (e.deltaY > 0) {
                fetch(`https://${res}/zoomOut`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({})
                }).catch(function() {});
            }
        }
    });

    let closeBtn = document.getElementById('closeBtn');
    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            let res = safeGetParentResourceName();
            fetch(`https://${res}/closeUI`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({})
            }).catch(function() {});
            closePanel();
        });
    }

    let genderCards = document.querySelectorAll('.gender-card');
    genderCards.forEach(function(card) {
        card.addEventListener('click', function() {
            genderCards.forEach(c => c.classList.remove('active'));
            this.classList.add('active');

            let gender = this.getAttribute('data-gender');
            let res = safeGetParentResourceName();

            fetch(`https://${res}/changeGender`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ gender: gender })
            }).catch(function() {});

            validateForm();
        });
    });

    let heightInput = document.getElementById('height');
    if (heightInput) {
        heightInput.addEventListener('input', function() {
            let val = this.value;
            let heightValue = document.getElementById('heightValue');
            if (heightValue) heightValue.textContent = val;
            validateForm();
        });
    }

    let inputs = ['firstname', 'lastname', 'dateofbirth'];
    inputs.forEach(function(id) {
        let el = document.getElementById(id);
        if (el) {
            el.addEventListener('input', function() {
                validateField(this);
                validateForm();
            });
            el.addEventListener('change', function() {
                validateField(this);
                validateForm();
            });
        }
    });

    let checkbox = document.getElementById('acceptRules');
    if (checkbox) {
        checkbox.addEventListener('change', function() {
            validateForm();
        });
    }

    let submitBtn = document.getElementById('submitBtn');
    if (submitBtn) {
        submitBtn.addEventListener('click', function(e) {
            e.preventDefault();
            if (isSubmitting || this.disabled) return;
            submitForm();
        });
    }

    let staffCloseBtn = document.getElementById('staffCloseBtn');
    if (staffCloseBtn) {
        staffCloseBtn.addEventListener('click', function() {
            let res = safeGetParentResourceName();
            fetch(`https://${res}/closeStaffUI`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({})
            }).catch(function() {});
            closeStaffPanel();
        });
    }

    let searchInput = document.getElementById('staffSearchInput');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            filterStaffPlayerList(this.value.trim().toLowerCase());
        });
    }

    let btnApprove = document.getElementById('btnApprove');
    if (btnApprove) {
        btnApprove.addEventListener('click', function() {
            if (!selectedPlayerId) return;
            let targetId = selectedPlayerId;
            let res = safeGetParentResourceName();

            fetch(`https://${res}/staffApprove`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ targetId: targetId })
            }).catch(function() {});

            currentStaffPlayers = currentStaffPlayers.filter(p => p.id != targetId);
            selectedPlayerId = null;
            renderStaffPlayerList(currentStaffPlayers);

            let emptyMsg = document.getElementById('staffEmptyMsg');
            let details = document.getElementById('staffDetails');
            if (emptyMsg) emptyMsg.style.display = 'block';
            if (details) details.style.display = 'none';
        });
    }

    let btnSkin = document.getElementById('btnSkin');
    if (btnSkin) {
        btnSkin.addEventListener('click', function() {
            if (!selectedPlayerId) return;
            let res = safeGetParentResourceName();
            fetch(`https://${res}/staffSkin`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ targetId: selectedPlayerId })
            }).catch(function() {});
        });
    }

    let btnClear = document.getElementById('btnClear');
    if (btnClear) {
        btnClear.addEventListener('click', function() {
            if (!selectedPlayerId) return;
            let targetId = selectedPlayerId;
            let res = safeGetParentResourceName();

            fetch(`https://${res}/staffClearChar`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ targetId: targetId })
            }).catch(function() {});

            currentStaffPlayers = currentStaffPlayers.filter(p => p.id != targetId);
            selectedPlayerId = null;
            renderStaffPlayerList(currentStaffPlayers);

            let emptyMsg = document.getElementById('staffEmptyMsg');
            let details = document.getElementById('staffDetails');
            if (emptyMsg) emptyMsg.style.display = 'block';
            if (details) details.style.display = 'none';
        });
    }

    if (typeof GetParentResourceName !== 'function' && window.location.protocol === 'file:') {
        let sampleRules = [
            { title: '§1 Respektvolles Verhalten', text: 'Jeder Spieler hat sich höflich und respektvoll zu verhalten.' },
            { title: '§2 FailRP & RDM', text: 'FailRP und grundloses Töten (RDM) sind strengstens verboten.' },
            { title: '§3 Wert des Lebens', text: 'Schütze dein Leben in jeder Situation so gut wie möglich.' }
        ];
        openPanel({
            rulesTitle: 'TIMELINE REGELWERK',
            minHeight: 140,
            maxHeight: 220,
            defaultHeight: 175,
            rules: sampleRules
        });
    }
});

function openPanel(data) {

    if (data.rulesTitle) {
        let el = document.getElementById('rulesTitle');
        if (el) el.textContent = data.rulesTitle;
    }

    let heightInput = document.getElementById('height');
    if (heightInput) {
        if (data.minHeight) heightInput.min = data.minHeight;
        if (data.maxHeight) heightInput.max = data.maxHeight;
        if (data.defaultHeight) {
            heightInput.value = data.defaultHeight;
            let heightValue = document.getElementById('heightValue');
            if (heightValue) heightValue.textContent = data.defaultHeight;
        }
    }

    if (data.rules && Array.isArray(data.rules)) {
        renderRules(data.rules);
    }

    resetForm();
    let wrapper = document.querySelector('.panel-wrapper');
    if (wrapper) wrapper.classList.add('visible');
}

function closePanel() {
    let wrapper = document.querySelector('.panel-wrapper');
    if (wrapper) wrapper.classList.remove('visible');
    isSubmitting = false;
}

function openStaffPanel(players) {
    currentStaffPlayers = players || [];
    selectedPlayerId = null;
    renderStaffPlayerList(currentStaffPlayers);

    let emptyMsg = document.getElementById('staffEmptyMsg');
    let details = document.getElementById('staffDetails');
    if (emptyMsg) emptyMsg.style.display = 'block';
    if (details) details.style.display = 'none';

    let wrapper = document.getElementById('staffApp');
    if (wrapper) wrapper.classList.add('visible');
}

function closeStaffPanel() {
    let wrapper = document.getElementById('staffApp');
    if (wrapper) wrapper.classList.remove('visible');
    selectedPlayerId = null;
}

function updateStaffList(players) {
    currentStaffPlayers = players || [];
    let searchInput = document.getElementById('staffSearchInput');
    let query = searchInput ? searchInput.value.trim().toLowerCase() : '';

    let filtered = currentStaffPlayers.filter(function(p) {
        return p.name.toLowerCase().includes(query) || String(p.id).includes(query);
    });
    renderStaffPlayerList(filtered);

    if (selectedPlayerId) {
        let found = currentStaffPlayers.find(p => p.id == selectedPlayerId);
        if (found) {
            selectStaffPlayer(found);
        } else {
            selectedPlayerId = null;
            let emptyMsg = document.getElementById('staffEmptyMsg');
            let details = document.getElementById('staffDetails');
            if (emptyMsg) emptyMsg.style.display = 'block';
            if (details) details.style.display = 'none';
        }
    } else {
        let emptyMsg = document.getElementById('staffEmptyMsg');
        let details = document.getElementById('staffDetails');
        if (emptyMsg) emptyMsg.style.display = 'block';
        if (details) details.style.display = 'none';
    }
}

function renderStaffPlayerList(players) {
    let container = document.getElementById('staffPlayerList');
    if (!container) return;
    container.innerHTML = '';

    if (!players || players.length === 0) {
        container.innerHTML = '<div style="color:#777; font-size:12px; text-align:center; padding:10px;">Keine un-eingereisten Spieler online</div>';
        return;
    }

    players.forEach(function(p) {
        let item = document.createElement('div');
        item.className = 'staff-player-item';
        if (selectedPlayerId && p.id == selectedPlayerId) {
            item.classList.add('active');
        }

        item.innerHTML = `
            <span class="item-pname">${escapeHtml(p.name)}</span>
            <span class="item-pid">ID #${p.id}</span>
        `;

        item.addEventListener('click', function() {
            document.querySelectorAll('.staff-player-item').forEach(el => el.classList.remove('active'));
            item.classList.add('active');
            selectStaffPlayer(p);
        });

        container.appendChild(item);
    });
}

function filterStaffPlayerList(query) {
    if (!query) {
        renderStaffPlayerList(currentStaffPlayers);
        return;
    }

    let filtered = currentStaffPlayers.filter(function(p) {
        return p.name.toLowerCase().includes(query) || String(p.id).includes(query);
    });

    renderStaffPlayerList(filtered);
}

function selectStaffPlayer(p) {
    selectedPlayerId = p.id;

    let emptyMsg = document.getElementById('staffEmptyMsg');
    let details = document.getElementById('staffDetails');
    if (emptyMsg) emptyMsg.style.display = 'none';
    if (details) details.style.display = 'flex';

    let dName = document.getElementById('detailName');
    let dId = document.getElementById('detailId');
    let dFname = document.getElementById('detailFname');
    let dLname = document.getElementById('detailLname');
    let dDob = document.getElementById('detailDob');
    let dTime = document.getElementById('detailSessionTime');

    if (dName) dName.textContent = p.name;
    if (dId) dId.textContent = 'ID #' + p.id;
    if (dFname) dFname.textContent = p.firstname;
    if (dLname) dLname.textContent = p.lastname;
    if (dDob) dDob.textContent = p.dateofbirth;
    if (dTime) dTime.textContent = p.sessionTime;
}

function renderRules(rules) {
    let container = document.getElementById('rulesContainer');
    if (!container) return;
    container.innerHTML = '';

    rules.forEach(function(rule) {
        let div = document.createElement('div');
        div.className = 'rule-item';
        div.innerHTML = `
            <div class="rule-item-title">${escapeHtml(rule.title)}</div>
            <div class="rule-item-text">${escapeHtml(rule.text)}</div>
        `;
        container.appendChild(div);
    });
}

function validateField(input) {
    let id = input.id;
    let val = input.value.trim();
    let isValid = false;

    if (id === 'firstname' || id === 'lastname') {
        isValid = val.length >= 2 && /^[a-zA-ZÄöüÄÖÜßs -]+$/.test(val);
    } else if (id === 'dateofbirth') {
        isValid = /^\d{2}\.\d{2}\.\d{4}$/.test(val);
        if (isValid) {
            let parts = val.split('.');
            let day = parseInt(parts[0], 10);
            let month = parseInt(parts[1], 10);
            let year = parseInt(parts[2], 10);
            let currentYear = new Date().getFullYear();
            isValid = day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 1900 && year <= (currentYear - 16);
        }
    }

    let statusId = id === 'dateofbirth' ? 'dobStatus' : id + 'Status';
    let statusEl = document.getElementById(statusId);
    if (statusEl) {
        if (isValid) {
            statusEl.classList.add('valid');
            statusEl.classList.remove('invalid');
        } else {
            statusEl.classList.remove('valid');
            if (val.length > 0) {
                statusEl.classList.add('invalid');
            } else {
                statusEl.classList.remove('invalid');
            }
        }
    }

    return isValid;
}

function validateForm() {
    let activeCard = document.querySelector('.gender-card.active');
    let genderValid = activeCard !== null;

    let fnStatus = document.getElementById('firstnameStatus');
    let fnValid = fnStatus ? fnStatus.classList.contains('valid') : false;

    let lnStatus = document.getElementById('lastnameStatus');
    let lnValid = lnStatus ? lnStatus.classList.contains('valid') : false;

    let dobStatus = document.getElementById('dobStatus');
    let dobValid = dobStatus ? dobStatus.classList.contains('valid') : false;

    let checkbox = document.getElementById('acceptRules');
    let rulesChecked = checkbox ? checkbox.checked : false;

    let allValid = genderValid && fnValid && lnValid && dobValid && rulesChecked;
    let submitBtn = document.getElementById('submitBtn');
    if (submitBtn) {
        submitBtn.disabled = !allValid;
    }
}

function resetForm() {
    let genderCards = document.querySelectorAll('.gender-card');
    genderCards.forEach(c => c.classList.remove('active'));
    let maleCard = document.getElementById('genderMale');
    if (maleCard) maleCard.classList.add('active');

    let fn = document.getElementById('firstname');
    let ln = document.getElementById('lastname');
    let dob = document.getElementById('dateofbirth');

    if (fn) fn.value = '';
    if (ln) ln.value = '';
    if (dob) dob.value = '';

    ['firstnameStatus', 'lastnameStatus', 'dobStatus'].forEach(function(sId) {
        let el = document.getElementById(sId);
        if (el) {
            el.classList.remove('valid');
            el.classList.remove('invalid');
        }
    });

    let checkbox = document.getElementById('acceptRules');
    if (checkbox) checkbox.checked = false;

    let submitBtn = document.getElementById('submitBtn');
    if (submitBtn) submitBtn.disabled = true;

    isSubmitting = false;
}

function submitForm() {
    isSubmitting = true;

    let activeCard = document.querySelector('.gender-card.active');
    let sexVal = activeCard ? activeCard.getAttribute('data-gender') : 'm';

    let fn = document.getElementById('firstname');
    let ln = document.getElementById('lastname');
    let dob = document.getElementById('dateofbirth');
    let height = document.getElementById('height');

    let payload = {
        firstname: fn ? fn.value.trim() : '',
        lastname: ln ? ln.value.trim() : '',
        dateofbirth: dob ? dob.value.trim() : '',
        sex: sexVal,
        height: height ? parseInt(height.value, 10) : 175
    };

    let res = safeGetParentResourceName();
    fetch(`https://${res}/registerIdentity`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    }).catch(function() {});
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

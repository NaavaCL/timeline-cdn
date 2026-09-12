const RESOURCE = GetParentResourceName();

const frame    = document.getElementById('app');
const btnClose = document.getElementById('btnClose');
const btnStart = document.getElementById('btnStart');
const btnStop  = document.getElementById('btnStop');

const tabs        = document.querySelectorAll('.tab');
const tabContents = document.querySelectorAll('.tab-content');

let transitionTimeout;

function openUI() {
    if (transitionTimeout) clearTimeout(transitionTimeout);
    frame.style.display = 'flex';
    setTimeout(() => frame.classList.add('active'), 30);
    switchTab('info');
}

function closeUI(sendToBackend) {
    frame.classList.remove('active');
    if (transitionTimeout) clearTimeout(transitionTimeout);
    transitionTimeout = setTimeout(() => {
        frame.style.display = 'none';
        if (sendToBackend) post('close');
    }, 350);
}

function switchTab(tab) {
    tabs.forEach(el => el.classList.toggle('active', el.dataset.tab === tab));
    tabContents.forEach(el => {
        el.style.display = el.dataset.tabContent === tab ? 'flex' : 'none';
    });
}

tabs.forEach(el => el.addEventListener('click', () => switchTab(el.dataset.tab)));

function post(name, payload) {
    fetch('https://' + RESOURCE + '/' + name, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=UTF-8' },
        body: JSON.stringify(payload || {})
    });
}

window.addEventListener('message', function(event) {
    var data = event.data;
    if (data.action === 'show') {
        if (data.state) {
            openUI();
        } else {
            closeUI(false);
        }
    }
});

btnClose && btnClose.addEventListener('click', function() { closeUI(true); });
btnStart && btnStart.addEventListener('click', function() { post('startJob'); });
btnStop  && btnStop.addEventListener('click',  function() { post('stopJob'); });

document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && frame.classList.contains('active')) {
        closeUI(true);
    }
});

function switcherInit(el) {
    const switchery = new Switchery(el, {
        color: '#1296db',
        size: 'small'
    });
}

const el1 = document.querySelector('#check-active');
if (localStorage.serverlog_activeOn === 'on' || typeof localStorage.serverlog_activeOn === 'undefined') {
    el1.checked = true;
}
switcherInit(el1);

const el2 = document.querySelector('#check-signal');
if (localStorage.serverlog_signalOn === 'on' || typeof localStorage.serverlog_signalOn === 'undefined') {
    el2.checked = true;
}
switcherInit(el2);

const el3 = document.querySelector('#check-cache');
if (localStorage.serverlog_cacheOn === 'on') {
    el3.checked = true;
}
switcherInit(el3);

document.querySelector('#check-active')
    .addEventListener('change', evt => {
        const active = evt.target.checked;
        if (active) {
            chrome.browserAction.setIcon({ path: 'icon.png' });
        } else {
            chrome.browserAction.setIcon({ path: 'icon_inactive.png' });
        }
        localStorage.serverlog_activeOn = active ? 'on' : 'off';
    });

document.querySelector('#check-signal')
    .addEventListener('change', evt => {
        const signal = evt.target.checked;
        localStorage.serverlog_signalOn = signal ? 'on' : 'off';
    });

document.querySelector('#check-cache')
    .addEventListener('change', evt => {
        const cache = evt.target.checked;
        localStorage.serverlog_cacheOn = cache ? 'on' : 'off';
    });

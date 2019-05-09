function localizeHtmlPage() {
    // Localize by replacing __MSG_***__ meta tags
    var objects = document.getElementsByTagName('html');
    for (var j = 0; j < objects.length; j++) {
        var obj = objects[j];

        var valStrH = obj.innerHTML.toString();
        var valNewH = valStrH.replace(/__MSG_(\w+)__/g, function (match, v1) {
            return v1 ? chrome.i18n.getMessage(v1) : "";
        });

        if (valNewH != valStrH) {
            obj.innerHTML = valNewH;
        }
    }
}

localizeHtmlPage();

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

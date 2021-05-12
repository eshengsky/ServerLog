(function () {
    const getEl = document.querySelector.bind(document);

    require.config({ paths: { 'vs': './monaco-editor/min/vs' } });

    // Set monaco to Chinese if UI locale is zh-CN, otherwise use default lang (en-US)
    if (chrome.i18n.getUILanguage() === 'zh-CN') {
        require.config({
            'vs/nls': {
                availableLanguages: {
                    '*': 'zh-cn'
                }
            }
        });
    }

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

    const mutationCb = mutationsList => {
        mutationsList.forEach(list => {
            const nodes = list.addedNodes;
            nodes.forEach(node => {
                const editors = node.querySelectorAll('.editor');
                if (editors && editors.length) {
                    for (let i = 0; i < editors.length; i++) {
                        const editor = editors[i];
                        let text = decodeURIComponent(editor.previousElementSibling.textContent);
                        if (text) {
                            editor.previousElementSibling.textContent = '';
                            try {
                                text = JSON.stringify(JSON.parse(text), null, 4);
                            } catch (err) { }
                            require(['vs/editor/editor.main'], () => {
                                monaco.editor.defineTheme('serverlogTheme', {
                                    base: 'vs',
                                    inherit: true,
                                    rules: [],
                                    colors: {
                                        'editor.background': '#f6f8fa',
                                    }
                                });

                                const mnc = monaco.editor.create(editor, {
                                    language: 'json',
                                    value: text,
                                    // contextmenu: false,
                                    scrollBeyondLastLine: false,
                                    fontSize: 13,
                                    dragAndDrop: false,
                                    automaticLayout: true,
                                    theme: 'serverlogTheme'
                                });

                                // Format code
                                setTimeout(() => {
                                    mnc.getAction('editor.action.formatDocument').run().then(() => {
                                        // After formatted, set readonly
                                        mnc.updateOptions({
                                            readOnly: true
                                        });
                                    });
                                }, 200);
                            });
                        }
                    }

                }
            });
        });
    }

    // Listen for new logs
    const observer = new MutationObserver(mutationCb);
    observer.observe(getEl('#logs'), {
        attributes: false,
        childList: true,
        subtree: false
    });

    // disable contextmenu
    window.document.addEventListener('contextmenu', e => {
        // e.preventDefault();
    });

    getEl('#btnWhat')
        .addEventListener('click', () => {
            let url = 'https://github.com/eshengsky/ServerLog/tree/master/chrome-extension-server-log#secret-key';
            if (chrome.i18n.getUILanguage() === 'zh-CN') {
                url = 'https://github.com/eshengsky/ServerLog/tree/master/chrome-extension-server-log/README_zh.md#secret-key';
            }
            chrome.tabs.create({ url });
        });

    getEl('#btnSave')
        .addEventListener('click', () => {
            const el = getEl('#extkey');
            const key = el.value.trim();
            if (!key) {
                return el.focus();
            }
            localStorage.serverlog_key = key;
            document.body.classList.remove('enterKey');
        });

    getEl('#clear')
        .addEventListener('click', () => {
            getEl('#logs')
                .innerHTML = '';
            getEl('#total-count')
                .textContent = '0';
            getEl('#filter-info')
                .textContent = '';
        });

    getEl('#settings')
        .addEventListener('click', () => {
            const el = document.querySelector('#extkey');
            el.value = localStorage.serverlog_key;
            document.body.classList.add('enterKey');
            el.focus();
        });

    const filterLogs = function () {
        const keyword = getEl('#search')
            .value.replace(/(^\s*)|(\s*$)/g, '');
        const selectLevel = getEl('.level-wrap .active')
            .id;
        let hiddenCount = 0;
        document.querySelectorAll('#logs li.log-li')
            .forEach(li => {
                // Check level
                let matchLevel = true;
                const logLevel = li.classList.length > 0 ? li.classList[0] : 'info';
                switch (selectLevel) {
                    case 'warn':
                        if (logLevel !== 'warn' && logLevel !== 'error') {
                            matchLevel = false;
                        }
                        break;
                    case 'error':
                        if (logLevel !== 'error') {
                            matchLevel = false;
                        }
                        break;
                    default:
                }

                if (li.textContent.toLowerCase()
                    .indexOf(keyword.toLowerCase()) >= 0 && matchLevel) {
                    li.style.display = '';
                } else {
                    li.style.display = 'none';
                    hiddenCount++;
                }
            });

        // If no filter result
        const totalCount = Number(getEl('#total-count').textContent);
        if (totalCount > 0 && totalCount === hiddenCount) {
            getEl('#no-data').style.display = 'block';
        } else {
            getEl('#no-data').style.display = 'none';
        }

        if (hiddenCount > 0) {
            getEl('#filter-info')
                .textContent = ` (${hiddenCount} ${chrome.i18n.getMessage("hiddenByFilter")})`;
        } else {
            getEl('#filter-info')
                .textContent = '';
        }
    };

    getEl('#search')
        .addEventListener('input', () => {
            filterLogs();
        });

    getEl('.level-wrap')
        .addEventListener('click', e => {
            const target = e.target;
            if (target.id) {
                document.querySelectorAll('.level-wrap div')
                    .forEach(el => el.classList.remove('active'));
                target.classList.add('active');
                filterLogs();
            }
        });

    getEl('#logs')
        .addEventListener('click', e => {
            if (e.target.classList.contains('copy')) {
                e.target.classList.remove('copy');
                e.target.classList.add('copied');
                const logContentEl = e.target.previousElementSibling;
                const time = logContentEl.querySelector('.time').textContent;
                const reqId = logContentEl.querySelector('.reqId').textContent;
                let log = e.target.previousElementSibling.textContent;
                log = log.replace(time, `[${time}] `).replace(reqId, `${reqId} `);
                copyTextToClipboard(log);
                e.target.textContent = chrome.i18n.getMessage("copied");
                setTimeout(() => {
                    e.target.textContent = chrome.i18n.getMessage("copy");
                    e.target.classList.remove('copied');
                    e.target.classList.add('copy');
                }, 800);
            } else if (e.target.classList.contains('link')) {
                // Redirect when press Ctrl / Command
                if (e.ctrlKey || e.metaKey) {
                    chrome.tabs.create({ url: e.target.dataset.link });
                }
            } else if (e.target.classList.contains('full-link') || e.target.classList.contains('iconfull-screen') || e.target.classList.contains('span-full')) {
                // Full screen
                let respContent = e.target.parentElement.parentElement;
                if (!e.target.classList.contains('full-link')) {
                    respContent = e.target.parentElement.parentElement.parentElement;
                }
                if (respContent.classList.contains('resp-content')) {
                    if (!respContent.classList.contains('full')) {
                        document.body.classList.add('noscroll');
                        respContent.classList.add('full');
                        respContent.querySelector('.editor').style.height = (window.innerHeight - 34) + 'px';
                        respContent.querySelector('.full-link span').textContent = chrome.i18n.getMessage("exitfull");
                    } else {
                        respContent.classList.remove('full');
                        respContent.querySelector('.editor').style.height = '180px';
                        respContent.querySelector('.full-link span').textContent = chrome.i18n.getMessage("full");
                        document.body.classList.remove('noscroll');
                    }
                }
            }
        });

    getEl('#logs')
        .addEventListener('mouseover', e => {
            if (e.target.classList.contains('link')) {
                // Show hand when press Ctrl
                if (e.ctrlKey || e.metaKey) {
                    e.target.style.cursor = 'pointer';
                }
            }
        });

    getEl('#logs')
        .addEventListener('mouseout', e => {
            if (e.target.classList.contains('link')) {
                e.target.style.cursor = 'text';
            }
        });

    getEl('footer')
        .addEventListener('click', e => {
            if (e.target.id === 'check-now') {
                checkUpdate();
            }
        });

    const versionStr = chrome.runtime.getManifest().version;
    const currVersionNumber = getNumVersion(versionStr);
    const version = `v${versionStr}`;
    getEl('#curr-version').innerHTML = `<a href="https://github.com/eshengsky/ServerLog/releases/tag/${version}" target="_blank">${version}</a>`;

    checkUpdate();

    function noUpdate() {
        getEl('#update-info').classList.add('has-check');
        getEl('#update-info').classList.add('no-update');
        getEl('#update-info').innerHTML = `${chrome.i18n.getMessage("noUpdates")} <i class="iconfont iconupdate" id="check-now" title="${chrome.i18n.getMessage("checkUpdates")}"></i>`;
    }

    function checkUpdate() {
        getEl('#update-info').classList.remove('has-check');
        getEl('#update-info').innerHTML = chrome.i18n.getMessage("checkUpdating");
        const startTime = Date.now();
        const timeout = 2000;
        const xhr = new XMLHttpRequest();
        function done() {
            try {
                const data = JSON.parse(xhr.responseText);
                data.sort((v1, v2) => {
                    return getNumVersion(v2.tag_name) - getNumVersion(v1.tag_name)
                });
                const latestVersion = data[0].tag_name;
                const latestVersionNumber = getNumVersion(data[0].tag_name);
                if (latestVersionNumber > currVersionNumber) {
                    // Has updates
                    getEl('#update-info').classList.add('has-update');
                    getEl('#update-info').innerHTML = `<a href="https://github.com/eshengsky/ServerLog/releases/tag/${latestVersion}" target="_blank">${chrome.i18n.getMessage("checkedNew")}${latestVersion}</a>`;
                } else {
                    // No updates
                    noUpdate();
                }
            } catch (err) {
                noUpdate();
            }

        }
        xhr.onreadystatechange = function () {
            if (xhr.readyState === XMLHttpRequest.DONE) {
                if (xhr.status >= 200 && xhr.status < 400) {
                    const endTime = Date.now();
                    const diff = endTime - startTime;
                    if (diff < timeout) {
                        setTimeout(() => {
                            done();
                        }, timeout - diff);
                    } else {
                        done();
                    }
                }
            }
        };
        xhr.open('GET', 'https://api.github.com/repos/eshengsky/ServerLog/releases', true);
        xhr.send();
    }

    function getNumVersion(version) {
        return Number(version.replace('v', '').replace(/\./g, ''));
    }

    function copyTextToClipboard(text) {
        const textArea = document.createElement('textarea');
        textArea.style.position = 'fixed';
        textArea.style.top = 0;
        textArea.style.left = 0;

        textArea.style.width = '2em';
        textArea.style.height = '2em';

        textArea.style.padding = 0;

        textArea.style.border = 'none';
        textArea.style.outline = 'none';
        textArea.style.boxShadow = 'none';

        textArea.style.background = 'transparent';


        textArea.value = text;

        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        try {
            document.execCommand('copy');
        } catch (err) {
        }

        document.body.removeChild(textArea);
    }
}());

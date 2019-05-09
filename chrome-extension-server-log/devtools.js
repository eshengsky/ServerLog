let PanelWindow;
const pageRefs = [];
chrome.devtools.network.onRequestFinished.addListener(requestHandler);

function requestHandler(request) {
    if (!PanelWindow) {
        return;
    }
    try {
        const headers = request.response.headers;

        // Check if response header contains X-Server-Log
        const headerLog = headers.find(item =>

            // HTTP: X-Server-Log, HTTPS: x-server-log
            item.name.toLowerCase() === 'x-server-log-data'
        );

        let logArr;
        let fragment;
        const keyword = PanelWindow.document.querySelector('#search')
            .value.replace(/(^\s*)|(\s*$)/g, '');
        const selectLevel = PanelWindow.document.querySelector('.level-wrap .active')
            .id;

        try {
            const record = localStorage.serverlog_activeOn;
            if ((typeof record === 'undefined' || record === 'on') && localStorage.serverlog_key && headerLog) {
                logArr = JSON.parse(LZString.decompressFromEncodedURIComponent(headerLog.value));
                fragment = document.createDocumentFragment();

                // Check if preserve logs
                const currentPage = request.pageref;
                if (pageRefs.indexOf(currentPage) === -1) {
                    pageRefs.push(currentPage);
                    const preserveOn = PanelWindow.document.querySelector('#check-preserve')
                        .checked;

                    // If new navigator or reload page, cancel code fullscreen and noscroll
                    const fulled = PanelWindow.document.querySelector('.resp-content.full');
                    if (fulled) {
                        fulled.classList.remove('full');
                        PanelWindow.document.body.classList.remove('noscroll');
                    }

                    if (!preserveOn) {
                        // clear logs
                        PanelWindow.document.querySelector('#logs')
                            .innerHTML = '';
                        PanelWindow.document.querySelector('#total-count')
                            .textContent = '0';
                        PanelWindow.document.querySelector('#filter-info')
                            .textContent = '';
                    }
                }

                logArr.forEach(logObj => {
                    let child = document.createElement('div');
                    let msgStr = logObj.message;
                    const type = logObj.type ? logObj.type.toLowerCase() : 'info';

                    if (!msgStr) {
                        return;
                    }

                    // Get reqId, lazy match
                    let reqId = '-';
                    if (/^{.+?} /.test(msgStr)) {
                        const matched = msgStr.match(/^{(.+?)} /);
                        if (matched.length === 2) {
                            reqId = matched[1];
                            msgStr = msgStr.replace(matched[0], '');
                        }
                    }

                    // Get object
                    const tempObj = {};
                    if (/###([\s\S]+?)###/g.test(msgStr)) {
                        const matchedArr = msgStr.match(/###([\s\S]+?)###/g);
                        if (matchedArr) {
                            matchedArr.forEach((str, index) => {
                                const matched = str.match(/###([\s\S]+?)###/);
                                if (matched.length === 2) {
                                    const dataToReplace = `
                                    <div class="resp-content">
                                        <span class="resp-title">
                                            <a class="btn-link full-link"><i class="iconfont iconfull-screen"></i><span class="span-full">${chrome.i18n.getMessage("full")}</span></a>
                                        </span> 
                                        <pre style="display: none;"><code>${encodeURIComponent(matched[1])}</code></pre>
                                        <div class="editor"></div>
                                    </div>`;

                                    const key = `$serverlogFormatData${index}`;
                                    tempObj[key] = dataToReplace;
                                    msgStr = msgStr.replace(matched[0], key);
                                }
                            });
                        }
                    }

                    // put request url to last
                    if (/\(URL: (.+)\)$/.test(msgStr)) {
                        const matchedLink = msgStr.match(/\(URL: (.+)\)$/);
                        if (matchedLink.length === 2) {
                            msgStr = msgStr.replace(matchedLink[0], `<span class="req-uri"><i class="iconfont iconlink"></i> ${matchedLink[1]}</span>`);
                        }
                    }

                    // wrap link into ankle
                    const linkMatch = msgStr.match(/(https?:\/\/|www\.)[-a-zA-Z0-9@:%_\+.~#?&//=\u4e00-\u9fa5]+/g);
                    if (linkMatch && linkMatch.length > 0) {
                        linkMatch.forEach(link => {
                            msgStr = msgStr.replace(link, `<span class="link" data-link="${link}" title="${chrome.i18n.getMessage("withCtrl")}">${link}</span>`);
                        });
                    }

                    if (Object.keys(tempObj).length) {
                        for (let key in tempObj) {
                            msgStr = msgStr.replace(key, tempObj[key]);
                        }
                    }

                    // Filter by level
                    let matchLevel = true;
                    switch (selectLevel) {
                        case 'warn':
                            if (type !== 'warn' && type !== 'error') {
                                matchLevel = false;
                            }
                            break;
                        case 'error':
                            if (type !== 'error') {
                                matchLevel = false;
                            }
                            break;
                        default:
                    }

                    // Filter by keyword
                    let style = '';
                    if ((logObj.time.indexOf(keyword) >= 0 ||
                        logObj.type.indexOf(keyword) >= 0 ||
                        (logObj.category || '')
                            .indexOf(keyword) >= 0 ||
                        msgStr.indexOf(keyword) >= 0) &&
                        matchLevel) {
                        style = '';
                    } else {
                        style = 'display: none;';
                    }

                    const html = [
                        `<li class="${type} log-li" style="${style}">`,
                        `<div class="log-content"><div class="log-title"><span class="time">${logObj.time}</span><span class="reqId">${chrome.i18n.getMessage("reqId")}: ${reqId}</span></div>`,
                        `<div class="log-body"><span class="type" style="display: none;">[${logObj.type}]</span>`
                    ];

                    if (logObj.category) {
                        html.push(
                            `<span class="category">${logObj.category}</span> `);
                    }

                    html.push(
                        '<span class="split">- </span>',
                        `${msgStr}</div></div>`,
                        `<button class="copy" title="${chrome.i18n.getMessage("copy")}">${chrome.i18n.getMessage("copy")}</button>`,
                        '</li>');

                    child.innerHTML = html.join('');
                    child = child.firstChild;
                    fragment.appendChild(child);
                });

                setTimeout(() => {
                    const logsDom = PanelWindow.document.querySelector('#logs');

                    // Insert fragment into dom
                    logsDom.appendChild(fragment);

                    // Remove first logs when logs are too much
                    const maxLogs = 999;
                    const totalNodes = logsDom.querySelectorAll('.log-li')
                        .length;
                    if (totalNodes > maxLogs) {
                        for (let i = 0; i < (totalNodes - maxLogs); i++) {
                            logsDom.removeChild(logsDom.children[0]);
                        }
                    }

                    // Set logs amount
                    PanelWindow.document.querySelector('#total-count')
                        .textContent = totalNodes;

                    let hiddenCount = 0;
                    const lis = Array.prototype.slice.call(PanelWindow.document.querySelectorAll('#logs li.log-li'));
                    lis.forEach(li => {
                        if (li.style.display === 'none') {
                            hiddenCount++;
                        }
                    });

                    // No data
                    if (totalNodes > 0 && totalNodes === hiddenCount) {
                        PanelWindow.document.querySelector('#no-data')
                            .style.display = 'block';
                    } else {
                        PanelWindow.document.querySelector('#no-data')
                            .style.display = 'none';
                    }

                    if (hiddenCount > 0) {
                        PanelWindow.document.querySelector('#filter-info')
                            .textContent = ` (${hiddenCount} ${chrome.i18n.getMessage("hiddenByFilter")})`;
                    } else {
                        PanelWindow.document.querySelector('#filter-info')
                            .textContent = '';
                    }

                    // Auto scroll
                    const scollOn = PanelWindow.document.querySelector('#check-scroll')
                        .checked;
                    if (scollOn) {
                        PanelWindow.scrollTo(0, PanelWindow.document.body.scrollHeight);
                    }
                }, 0);
            }
        } catch (e) {
            console.error(e);
        }
    } catch (e) {
        console.error(e);
    }
}

chrome.devtools.panels.create('ServerLog',
    '',
    'panel.html',
    panel => {
        panel.onShown.addListener(panelWindow => {
            PanelWindow = panelWindow;

            // check if key is set
            if (!localStorage.serverlog_key) {
                panelWindow.document.body.classList.add('enterKey');
                panelWindow.document.querySelector('#extkey').focus();
            }
        });
    });

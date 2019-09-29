const reqHeaderName = 'X-Request-Server-Log';
chrome.webRequest.onBeforeSendHeaders.addListener(details => {
    // Add request headers with secret key
    const existsServerLog = details.requestHeaders.some(header => header.name === reqHeaderName);
    if (!existsServerLog) {
        if ((localStorage.serverlog_activeOn === 'on' || typeof localStorage.serverlog_activeOn === 'undefined') && localStorage.serverlog_key) {
            details.requestHeaders.push({
                name: reqHeaderName,
                value: localStorage.serverlog_key
            });
        }
    }
    return { requestHeaders: details.requestHeaders };
}, { urls: ['<all_urls>'] }, ['blocking', 'requestHeaders']);


const resHeaderName = 'X-Server-Log-Data';
chrome.webRequest.onHeadersReceived.addListener(details => {
    if (localStorage.serverlog_console === 'on' || typeof localStorage.serverlog_console === 'undefined') {
        const serverLogData = details.responseHeaders.find(header => header.name === resHeaderName);
        if (serverLogData) {
            const logArr = JSON.parse(LZString.decompressFromEncodedURIComponent(serverLogData.value));
            chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                const tabId = tabs[0] && tabs[0].id;
                if (tabId === details.tabId) {
                    //FIXME: Maybe now the content script is not ready, so message will not received correctly. It's my guess
                    setTimeout(() => {
                        chrome.tabs.sendMessage(tabId, {
                            serverLogData: logArr
                        });
                    }, 200);
                }
            });
        }
    }
}, { urls: ['<all_urls>'] }, ['responseHeaders']);


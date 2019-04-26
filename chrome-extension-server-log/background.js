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

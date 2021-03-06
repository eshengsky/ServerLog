chrome.runtime.onMessage.addListener(details => {
    const logArr = details.serverLogData;
    if (Array.isArray(logArr)) {
        logArr.forEach(logObj => {
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

            // Get reqUrl
            let reqUrl = '';
            if (/\(URL: (.+)\)$/.test(msgStr)) {
                const matchedLink = msgStr.match(/\(URL: (.+)\)$/);
                if (matchedLink.length === 2) {
                    reqUrl = matchedLink[1];
                    msgStr = msgStr.replace(matchedLink[0], '');
                }
            }

            // handle whitespace and breakline
            msgStr = msgStr.replace(/<br>/g, '\n').replace(/&nbsp;/g, ' ');

            // handle JSON object
            let msgArr = [msgStr];
            if (/###([\s\S]+?)###/g.test(msgStr)) {
                const msgArrTemp = [];
                const arr = msgStr.split(/(###[\s\S]+?###)/);
                arr.forEach(item => {
                    if (/^###([\s\S]+?)###$/.test(item)) {
                        const jsonStr = item.substring(3, item.length - 3);
                        try {
                            msgArrTemp.push(JSON.parse(jsonStr));
                        } catch (err) {
                            msgArrTemp.push(item);
                        }
                    } else {
                        msgArrTemp.push(item);
                    }
                });
                msgArr = msgArrTemp;
            }

            const time = new Date(logObj.time);
            const timeStr = `${time.getHours()}:${time.getMinutes()}:${time.getSeconds()}.${time.getMilliseconds()}`;

            let color = '';
            switch (type) {
                case 'warn':
                    color = 'orange';
                    break;
                case 'error':
                    color = 'red';
                    break;
                default:
                    color = 'DodgerBlue';
            }
            let categoryName = '';
            if (logObj.category) {
                categoryName = ` ${logObj.category}`;
            }
            console[type]('%cServerLog', `font-weight: normal; color: #ffffff; background: ${color}; padding: 1px 6px; border-radius: 30px;`, `[${timeStr}]${categoryName} -`, ...msgArr);
        });
    }
});

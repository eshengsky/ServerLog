const os = require('os');
const util = require('util');
const moment = require('moment');
const lzstring = require('lz-string');
const chalk = require('chalk');

const reqHeaderName = 'X-Request-Server-Log';
const resHeaderName = 'X-Server-Log-Data';
const defaultCategoryName = 'normal';

// let Error support JSON serialize
if (!('toJSON' in Error.prototype)) {
    Object.defineProperty(Error.prototype, 'toJSON', {
        value() {
            const alt = {};
            Object.getOwnPropertyNames(this).forEach(function (key) {
                alt[key] = this[key];
            }, this);

            return alt;
        },
        configurable: true,
        writable: true
    });
}

// let Function support JSON serialize
if (!('toJSON' in Function.prototype)) {
    Object.defineProperty(Function.prototype, 'toJSON', {
        value() {
            return `[Function ${this.name}] ${String(this)}`;
        },
        configurable: true,
        writable: true
    });
}

function getFullUrl(req) {
    return `${req.protocol}://${req.get('Host')}${req.originalUrl}`;
}

function Logger(options, category = defaultCategoryName) {
    this.options = options;
    this.category = category;
}

Logger.prototype = {
    // print only in console
    _log2Console: function (level, args, now = moment().format('YYYY-MM-DD HH:mm:ss.SSS')) {
        if (args.length > 1) {
            const lastParam = args[args.length - 1];
            if (lastParam && lastParam.constructor && lastParam.constructor.name === 'IncomingMessage') {
                const req = args.pop();

                if (req.__id) {
                    let reqIdStr = `{${req.__id}}`;
                    if (this.options.colors) {
                        reqIdStr = chalk.grey(reqIdStr);
                    }
                    args.unshift(reqIdStr);
                }
                args.push(`(URL: ${getFullUrl(req)})`);
            }
        }
        let prefix = [`[${now}]`, `[${level.toUpperCase()}]`, this.category, '-'].join(' ');
        if (this.options.colors) {
            switch (level) {
                case 'error':
                    prefix = chalk.red(prefix);
                    break;
                case 'warn':
                    prefix = chalk.yellow(prefix);
                    break;
                default:
                    prefix = chalk.blue(prefix);
            }
        }

        const newArgs = [];
        args.forEach(msg => {
            if (typeof msg === 'object' && !(msg instanceof Error)) {
                const inspectOpt = {
                    depth: null
                }
                if (this.options.colors) {
                    inspectOpt.colors = true;
                }
                newArgs.push(util.inspect(msg, inspectOpt));
            } else {
                newArgs.push(msg);
            }
        });

        console.log(prefix, ...newArgs);
    },

    // print only in Chrome extension
    _log2Extension: function (level, args, now = moment().format('YYYY-MM-DD HH:mm:ss.SSS'), separateCall = true) {
        if (!this.options.enableChromeExtension) {
            if (separateCall) {
                this._log2Console('warn', ['The setting enableChromeExtension is not set to true, cannot output in extension.']);
            }
            return;
        }
        if (args.length > 1) {
            const lastParam = args[args.length - 1];
            if (lastParam && lastParam.constructor && lastParam.constructor.name === 'IncomingMessage') {
                const req = args.pop();

                if (req.__id) {
                    args.unshift(`{${req.__id}}`);
                }
                args.push(`(URL: ${getFullUrl(req)})`);

                // check chrome extension secret key
                if (req.get(reqHeaderName) === this.options.chromeExtensionKey) {
                    try {
                        // 响应头设置
                        const currentHeader = req.res.get(resHeaderName);

                        // 将数组转为字符串形式显示
                        let msgStr = '';
                        args.forEach((msg, index) => {
                            // 错误对象
                            if (msg instanceof Error) {
                                if (msg.stack.indexOf(msg.message) >= 0) {
                                    msgStr += msg.stack.replace(/\n/g, '<br>')
                                        .replace(/ /g, '&nbsp;');
                                } else {
                                    msgStr += `${msg.message}<br>${msg.stack.replace(/\n/g, '<br>')
                                        .replace(/ /g, '&nbsp;')}`;
                                }
                            } else if (typeof msg === 'object') {
                                msgStr += `###${JSON.stringify(msg)}###`;
                            } else {
                                msgStr += String(msg);
                            }

                            if (args.length - 1 !== index) {
                                msgStr += ' ';
                            }
                        });

                        const msgArr = [{
                            time: now,
                            type: level,
                            category: this.category,
                            message: msgStr
                        }];

                        let msgToSet = '';
                        if (currentHeader) {
                            let updateHeader = JSON.parse(lzstring.decompressFromEncodedURIComponent(currentHeader));
                            updateHeader.push(msgArr[0]);
                            msgToSet = lzstring.compressToEncodedURIComponent(JSON.stringify(updateHeader));
                        } else {
                            msgToSet = lzstring.compressToEncodedURIComponent(JSON.stringify(msgArr));
                        }

                        // nginx对响应头长度做了限制，如果大于79k就仅返回一行提示
                        if (msgToSet.length > 79 * 1024) {
                            req.res.set(resHeaderName, lzstring.compressToEncodedURIComponent(JSON.stringify([{
                                time: now,
                                type: 'warn',
                                category: 'Server Log',
                                message: `日志太多了 (${parseInt(msgToSet.length / 1024)}KB)，暂不支持直接展示，请登录服务器查看！`
                            }])));
                        } else {
                            req.res.set(resHeaderName, msgToSet);
                        }
                    } catch (e) {
                        console.error(e);
                    }
                }
            }
        }
    },

    // print both in console and Chrome extension
    _log: function (level, args) {
        const now = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        const cloned = [...args];
        this._log2Console(level, cloned, now);
        this._log2Extension(level, args, now, false);
    }
}

const logLevels = ['info', 'warn', 'error'];
logLevels.forEach(level => {
    Logger.prototype[level] = function (...args) {
        this._log(level, args);
    }

    Logger.prototype[`${level}C`] = function (...args) {
        this._log2Console(level, args);
    }

    Logger.prototype[`${level}E`] = function (...args) {
        this._log2Extension(level, args);
    }
});

module.exports = Logger;

const util = require('util');
const moment = require('moment');
const lzstring = require('lz-string');
const stringify = require('json-stringify-safe');
const chalk = require('chalk');

const reqHeaderName = 'X-Request-Server-Log';
const resHeaderName = 'X-Server-Log-Data';
const breakLineReg = new RegExp('\n', 'g');

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

/**
 * @constructor
 *
 * @param {*} options
 * @param {*} category
 */
function Logger(options, category) {
    this.options = options;
    this.category = category;
}

Logger.prototype = {
    _log2Console: function (level, args, now = moment().format('YYYY-MM-DD HH:mm:ss.SSS')) {
        if (!args.length) {
            args.push(undefined);
        } else if (args.length > 1) {
            const lastParam = args[args.length - 1];
            if (lastParam && lastParam.constructor && lastParam.constructor.name === 'IncomingMessage') {
                const req = args.pop();

                if (req.__id) {
                    let reqIdStr = `{${req.__id}}`;
                    if (this.options.console.colors) {
                        reqIdStr = chalk.grey(reqIdStr);
                    }
                    args.unshift(reqIdStr);
                }

                if (this.options.console.appendUrl) {
                    args.push(`(URL: ${getFullUrl(req)})`);
                }
            }
        }

        const newArgs = [];
        args.forEach(msg => {
            if (typeof msg === 'object') {
                if (msg instanceof Error) {
                    let errStr = msg.message;
                    if (msg.stack) {
                        errStr = msg.stack;
                    }
                    if (this.options.console.forceSingleLine) {
                        errStr = errStr.replace(breakLineReg, ' ');
                    }
                    newArgs.push(errStr);
                } else {
                    const inspectOpt = {
                        depth: null
                    }
                    if (this.options.console.colors) {
                        inspectOpt.colors = true;
                    }
                    if (this.options.console.forceSingleLine) {
                        inspectOpt.breakLength = Infinity;
                    }
                    newArgs.push(util.inspect(msg, inspectOpt));
                }
            } else {
                newArgs.push(msg);
            }
        });

        let prefix = [`[${now}]`, `[${level.toUpperCase()}]`, this.category, '-'].join(' ');
        if (this.options.console.colors) {
            switch (level) {
                case 'error':
                    prefix = chalk.red(prefix);
                    break;
                case 'warn':
                    prefix = chalk.yellow(prefix);
                    break;
                default:
                    prefix = chalk.cyan(prefix);
            }
        }

        console.log(prefix, ...newArgs);
    },

    // print only in Chrome extension
    _log2Extension: function (level, args, now = moment().format('YYYY-MM-DD HH:mm:ss.SSS'), separateCall = true) {
        if (!this.options.extension.enable) {
            if (separateCall) {
                this._log2Console('warn', ['The setting extension.enable is not set to true, cannot output in extension.']);
            }
            return;
        }

        if (!args.length) {
            args.push(undefined);
        } else if (args.length > 1) {
            const lastParam = args[args.length - 1];
            if (lastParam && lastParam.constructor && lastParam.constructor.name === 'IncomingMessage') {
                const req = args.pop();

                if (req.__id) {
                    args.unshift(`{${req.__id}}`);
                }
                args.push(`(URL: ${getFullUrl(req)})`);

                // check chrome extension secret key
                if (req.get(reqHeaderName) === this.options.extension.key) {
                    try {
                        // 响应头设置
                        const currentHeader = req.res.get(resHeaderName);

                        // 将数组转为字符串形式显示
                        let msgStr = '';
                        args.forEach((msg, index) => {
                            // 错误对象
                            if (msg instanceof Error) {
                                if (msg.stack.indexOf(msg.message) >= 0) {
                                    msgStr += msg.stack.replace(breakLineReg, '<br>')
                                        .replace(/ /g, '&nbsp;');
                                } else {
                                    msgStr += `${msg.message}<br>${msg.stack.replace(breakLineReg, '<br>')
                                        .replace(/ /g, '&nbsp;')}`;
                                }
                            } else if (typeof msg === 'object') {
                                msgStr += `###${stringify(msg)}###`;
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

                        // nginx对响应头长度做了限制，如果大于设定值就仅返回一行提示
                        if (msgToSet.length > this.options.extension.maxLength) {
                            req.res.set(resHeaderName, lzstring.compressToEncodedURIComponent(JSON.stringify([{
                                time: now,
                                type: 'warn',
                                category: 'Server Log',
                                message: `日志太多了 (${parseInt(msgToSet.length / 1024)}KB)，暂不支持直接展示！`
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

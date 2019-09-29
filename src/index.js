const shortid = require('shortid');
const { Logger, ServerLogSuffix } = require('./logger');

const reqIdName = 'X-Request-Id';
const loggers = [];

// the default options
let options = {
    console: {
        colors: true,
        depth: 8,
        appendUrl: true,
        forceSingleLine: false
    },
    extension: {
        enable: true,
        key: 'yourownsecretkey',
        maxLength: 80
    }
};

const logLevels = ['info', 'warn', 'error'];
const originalLogger = {};
const originalConLogger = {};
const originalExtLogger = {};
logLevels.forEach(level => {
    originalLogger[level] = Logger.prototype[level];
    originalConLogger[level] = Logger.prototype[`${level}C`];
    originalExtLogger[level] = Logger.prototype[`${level}E`];
});

/**
 * set options
 *
 * @param {object} cfg - options object
 */
function config(cfg) {
    options = Object.assign(options, cfg);
}

/**
 * the middleware for registering serverlog to each request
 *
 * @returns {function}
 */
function middleware() {
    return (req, res, next) => {
        // Set unique request id to combine logs
        const reqId = req.query.__id || req.get(reqIdName) || shortid.generate();
        req.__id = reqId;
        res.setHeader(reqIdName, reqId);

        const serverLogSuffix = new ServerLogSuffix(req, res);

        // rewrite logger.xxx to append req object
        logLevels.forEach(level => {
            Logger.prototype[level] = function (...args) {
                if (!args.length) {
                    args.push(undefined);
                }
                args.push(serverLogSuffix);
                originalLogger[level].apply(this, args);
            };

            Logger.prototype[`${level}C`] = function (...args) {
                if (!args.length) {
                    args.push(undefined);
                }
                args.push(serverLogSuffix);
                originalConLogger[level].apply(this, args);
            };

            Logger.prototype[`${level}E`] = function (...args) {
                if (!args.length) {
                    args.push(undefined);
                }
                args.push(serverLogSuffix);
                originalExtLogger[level].apply(this, args);
            };
        });

        next();
    }
}

/**
 * create logger instance
 *
 * @param {string} [category='normal'] - current category name
 * @returns {Logger}
 */
function getLogger(category = 'normal') {
    let instance = loggers[category];
    if (!instance) {
        instance = new Logger(options, category);
    }
    return instance;
}

module.exports = {
    config,
    middleware,
    getLogger
}

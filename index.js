const uuid = require('uuid');
const Logger = require('./logger');

const reqIdName = 'X-Request-Id';
const loggers = [];
let options = {
    colors: true,
    enableChromeExtension: true,
    chromeExtensionKey: 'yourownsecretkey'
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

function config(cfg) {
    options = Object.assign(options, cfg);
}

function middleware() {
    return (req, res, next) => {
        // Set unique request id to combine logs
        const reqId = req.query.__id || req.get(reqIdName) || uuid.v1();
        req.__id = reqId;
        res.locals.__id = reqId;
        res.setHeader(reqIdName, reqId);

        // rewrite logger.xxx to append req object
        logLevels.forEach(level => {
            Logger.prototype[level] = function (...args) {
                const lastParam = args[args.length - 1];
                if (!(lastParam && lastParam.constructor && lastParam.constructor.name === 'IncomingMessage')) {
                    args.push(req);
                }
                originalLogger[level].apply(this, args);
            };

            Logger.prototype[`${level}C`] = function (...args) {
                const lastParam = args[args.length - 1];
                if (!(lastParam && lastParam.constructor && lastParam.constructor.name === 'IncomingMessage')) {
                    args.push(req);
                }
                originalConLogger[level].apply(this, args);
            };

            Logger.prototype[`${level}E`] = function (...args) {
                const lastParam = args[args.length - 1];
                if (!(lastParam && lastParam.constructor && lastParam.constructor.name === 'IncomingMessage')) {
                    args.push(req);
                }
                originalExtLogger[level].apply(this, args);
            };
        });

        next();
    }
}

function getLogger(category) {
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

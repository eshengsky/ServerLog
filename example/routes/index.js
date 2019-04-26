const express = require('express');
const router = express.Router();
const request = require('request');
const serverlog = require('../../index');
const logger = serverlog.getLogger('home');

router.get('/', (req, res) => {
    logger.info('This is an info log.');
    
    let undef;
    logger.warn('This is a warning log.', 'Take care, undef value is:', undef);

    try {
        foo.bar();
    } catch (err) {
        logger.error('This is an error log. Error:', err);
    }

    const arr = [1, 2, "some string", {
        name: 'Sky'
    }];
    function greet (name) {
        logger.info(name);
    }
    const obj = {
        foo: 'Hello Server Log!',
        bar: 123,
        baz: false,
        arr,
        greet,
        obj: {
            a: {
                b: {
                    c: {
                        d: {
                            e: {
                                f: {
                                    g: 'nested object'
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    logger.info('Log an array:', arr, 'then log a complex object:', obj);

    request({
        url: 'https://api.github.com/search/repositories?q=log',
        timeout: 3000,
        headers: {
            'User-Agent': 'Mozilla'
        }
    }, (err, resp, body) => {
        if (err) {
            logger.error('get data failed, err:', err);
        } else if (resp.statusCode === 200) {
            // log full response body in extension
            logger.infoE('get some data from Github:', JSON.parse(body));

            // simplely log in console
            logger.infoC('get some data from Github, please view response in Chrome extension.');
        } else {
            logger.error('get data failed, statusCode:', resp.statusCode);
        }

        res.send('Hello Server Log!');
    })
});

module.exports = router;

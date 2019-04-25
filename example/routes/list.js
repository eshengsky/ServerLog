const express = require('express');
const router = express.Router();
const serverlog = require('../../index');
const logger = serverlog.getLogger('list');

router.get('/', (req, res) => {
    try {
        JSON.parse();
    } catch (err) {
        logger.error('This is an error log. Error:', err);
    }
    res.send('Product list.');
});

module.exports = router;

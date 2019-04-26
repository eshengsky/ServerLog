const express = require('express');
const router = express.Router();
const serverlog = require('../../index');
const logger = serverlog.getLogger();

router.get('/', (req, res) => {
    logger.info(req);
    res.send('Product list.');
});

module.exports = router;

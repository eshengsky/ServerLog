const express = require('express');
const app = express();
const serverlog = require('../index');
serverlog.config({
    console: {
        colors: true,
        depth: null,
        appendUrl: true,
        forceSingleLine: false
    },
    extension: {
        enable: true,
        key: '111'
    }
})
app.use(serverlog.middleware());
const logger = serverlog.getLogger();

app.use('/list', require('./routes/list'));

app.use('/', require('./routes/index'));

app.listen(3000, () => {
    logger.info('Demo server is listening on 3000 port.');
});

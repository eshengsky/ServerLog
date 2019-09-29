const express = require('express');
const app = express();
const serverlog = require('../src/index');
serverlog.config({
    console: {
        colors: true,
        depth: 8,
        appendUrl: true,
        forceSingleLine: false
    },
    extension: {
        enable: true,
        key: '111',
        maxLength: 80
    }
})
app.use(serverlog.middleware());
const logger = serverlog.getLogger();

app.use('/', require('./routes/index'));

app.listen(3000, () => {
    logger.info('Example server is running! URL: http://localhost:3000');
});

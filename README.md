# ServerLog

[中文文档](https://github.com/eshengsky/ServerLog/blob/master/README_zh.md)

A simple, practical, and innovative Node.js log library that enables you to view logs in Chrome dev tools.

ServerLog contains the following features:

* Friendly log output format;
* Support `info`, `warn`, `error` 3 log levels, as simple as possible API design;
* By registering [Express](http://expressjs.com/) middleware, can automatically attach the request URL to the end of the log;
* The log generated by the same batch request generates a [Request ID](#request-id) to facilitate the association and filtering of the logs; 
* The accompanying Chrome extension allows you to view logs in Chrome dev tools.

## Preview

* Output to terminal:

![image](https://raw.githubusercontent.com/eshengsky/ServerLog/master/preview_console_en.png)

* Output to Chrome extension:

![image](https://raw.githubusercontent.com/eshengsky/ServerLog/master/chrome-extension-server-log/preview_ext_en.png)

## Get started

### Install

```bash
> npm i --save serverlog-node
```

### Usage

```js
const serverlog = require('serverlog-node');
const logger = serverlog.getLogger('home');

logger.info('Something to log...');
```

If you are using [Express](http://expressjs.com/) framework, you can get following functionality by registering middleware:
* Automatically add request ID in the request log.
* Automatically add the current URL in the request log.
* Send the request log to the Chrome extension, where you can view the logs in the dev tools (F12).

```js
const express = require('express');
const app = express();
const serverlog = require('serverlog-node');
const logger = serverlog.getLogger();

app.use(serverlog.middleware());

app.use((req, res) => {
    logger.info('Something to log within request...');
    res.send('Hello World!');
});
```

## Chrome extension

It's easier to view logs using the accompanying Chrome extension.

https://github.com/eshengsky/ServerLog/tree/master/chrome-extension-server-log

## Api

## serverlog

### config(Options)

Overwrite the default settings with the incoming Options.

`Options`: parameters object.

```js
serverlog.config({
    console: {
        colors: true,
        depth: null,
        appendUrl: true,
        forceSingleLine: false
    },
    extension: {
        enable: true,
        key: 'yourownsecretkey'
    }
});
```

The full parameters supported are as follows:

<table>
    <tr>
        <th>Property name</th>
        <th>Description</th>
        <th>Type</th>
        <th>Default</th>
    </tr>
    <tr>
        <td>console.colors</td>
        <td>Enable colors</td>
        <td>boolean</td>
        <td>true</td>
    </tr>
    <tr>
        <td>console.depth</td>
        <td>The parsing depth of the object, see here <a href="https://nodejs.org/dist/latest-v10.x/docs/api/util.html#util_util_inspect_object_options">util.inspect</a></td>
        <td>number</td>
        <td>null</td>
    </tr>
    <tr>
        <td>console.appendUrl</td>
        <td>Automatically attach the current request URL to the end of the log</td>
        <td>boolean</td>
        <td>true</td>
    </tr>
    <tr>
        <td>console.forceSingleLine</td>
        <td>Force each log to not wrap</td>
        <td>boolean</td>
        <td>false</td>
    </tr>
    <tr>
        <td>extension.enable</td>
        <td>Enable Chrome extension functions</td>
        <td>boolean</td>
        <td>true</td>
    </tr>
    <tr>
        <td>extension.key</td>
        <td>The key set here will not output the log until the same as the secret key set in the Chrome extension</td>
        <td>string</td>
        <td>yourownsecretkey</td>
    </tr>
    <tr>
        <td>extension.maxLength</td>
        <td>Max length of logs, in kb units</td>
        <td>number</td>
        <td>80</td>
    </tr>
</table>

### middleware()

Registers log middleware that supports frameworks that are compatible with [Express](http://expressjs.com/) middleware.

```js
app.use(serverlog.middleware());
```

### getLogger(categoryName)

Create and return a [logger](https://github.com/eshengsky/ServerLog/blob/master/README_zh.md#logger) instance.

`categoryName`: String, log category name, default: normal.

## logger

### info(arg1, arg2, ...args)

Logs an info log that can be passed in to any type, any number of parameters.

```js
logger.info('This is an info log.');
```

### warn(arg1, arg2, ...args)

Logs an warning log that can be passed in to any type, any number of parameters.

```js
let undef;
logger.warn('This is a warning log.', 'Take care, undef value is:', undef);
```

### error(arg1, arg2, ...args)

Logs an error log that can be passed in to any type, any number of parameters.

```js
try {
    foo.bar();
} catch (err) {
    logger.error('This is an error log. Error:', err);
}
```

### infoC(arg1, arg2, ...args), warnC(arg1, arg2, ...args), errorC(arg1, arg2, ...args)

Output only the corresponding logs to the terminal.

### infoE(arg1, arg2, ...args), warnE(arg1, arg2, ...args), errorE(arg1, arg2, ...args)

Output only the corresponding logs to the Chrome extension.

```js
// Print the full file content in the Chrome extension
logger.infoE('read data from local file:', JSON.parse(data));

// Just print a little in console
logger.infoC('read data from local file, please view data in Chrome extension.');
```

## Request ID

### What is request ID

After registered middleware, all the logs associated with the request contain a request ID by default. In the same request, the request ID for all logs must be the same, and the request ID must be different in different requests.

For example, when user A accesses the index.html process ServerLog prints 10 logs, the request ID for the 10 logs are the same, and user B also accesses the page, resulting in 10 logs, which must also have the same request ID, but different from the request ID of User A 。

### Main role

Lets you be able to correlate all the logs you need in a large number of logs, as long as you know the request ID of one log.

### How to find request ID

When you can navigate to a log related to a request, between the category name of log and the contents of the log, is the request ID. For example, the following `Ra8dx5lAL`:

```
[2019-05-08 15:23:06.911] [INFO] home - {Ra8dx5lAL} This is an info log. (URL: http://localhost:3000/)
```

If you can listen to a network request for a page, the response header `X-Request-Id` is the request ID:

```
X-Request-Id: Ra8dx5lAL
```

## Persistence

ServerLog only output to [stdout](https://nodejs.org/dist/latest-v10.x/docs/api/process.html#process_process_stdout) and [stderr](https://nodejs.org/dist/latest-v10.x/docs/api/process.html#process_process_stderr), does not provide the ability to log persistence, but you can do so in other ways:

* Use PM2

If you deploy your project with [PM2](https://pm2.io/), logs will automatically save to the disk file. You can use PM2's own [log management](https://pm2.io/doc/en/runtime/guide/log-management/) function to achieve log viewing, rotate, and so on.

By default, log file saved into `$HOME/.pm2/logs` directory.

* Common

In a Linux environment, it is easy to redirect the output to a file with very simple commands, such as:

```bash
node server.js > logfile.txt
```

Specific can be referred [here](https://askubuntu.com/questions/420981/how-do-i-save-terminal-output-to-a-file)。

## License
MIT License

Copyright (c) 2019 孙正华 Sky

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

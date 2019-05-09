# ServerLog
简单、实用、创新的 node.js 日志库，支持在 Chrome 扩展程序中查看请求日志。

ServerLog 包含了如下特性：

* 友好的日志输出格式；
* 支持 `info`，`warn`，`error` 3 种日志级别，尽可能简单的 api 设计；
* 通过注册 [Express](http://expressjs.com/) 中间件，可以自动附加请求 URL 到日志末尾；
* 同一批次请求产生的日志，会生成一个 [请求ID](#请求ID)，方便日志的关联和筛选；
* 配套的 Chrome 扩展程序允许你在开发者工具中查看日志。

## 预览

* 输出到终端：

![image](https://raw.githubusercontent.com/eshengsky/ServerLog/master/preview_console_zh.png)

* 输出到 Chrome 扩展：

![image](https://raw.githubusercontent.com/eshengsky/ServerLog/master/chrome-extension-server-log/preview_ext_zh.png)

## 快速开始

### 安装

```bash
> npm i --save serverlog-node
```

### 使用

```js
const serverlog = require('serverlog-node');
const logger = serverlog.getLogger('home');

logger.info('Something to log...');
```

如果你使用的是 [Express](http://expressjs.com/) 框架，你还可以通过注册中间件的方式，获得更多的功能：
* 在请求日志中自动添加请求 ID
* 在请求日志中自动添加当前的 URL
* 将请求日志发送到 Chrome 扩展程序，你可以在 F12 开发者工具中查看日志

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

## Chrome 扩展程序

使用配套的 Chrome 扩展程序，查看日志更方便。

https://github.com/eshengsky/ServerLog/tree/master/chrome-extension-server-log

## Api

## serverlog

### config(Options)

使用传入的 Options 覆盖默认设置。

`Options`: 参数对象。

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

支持的全部参数如下：

<table>
    <tr>
        <th>属性名</th>
        <th>说明</th>
        <th>值类型</th>
        <th>默认值</th>
    </tr>
    <tr>
        <td>console.colors</td>
        <td>启用彩色日志</td>
        <td>boolean</td>
        <td>true</td>
    </tr>
    <tr>
        <td>console.depth</td>
        <td>对象的解析深度，详见 <a href="https://nodejs.org/dist/latest-v10.x/docs/api/util.html#util_util_inspect_object_options">util.inspect</a></td>
        <td>number</td>
        <td>null</td>
    </tr>
    <tr>
        <td>console.appendUrl</td>
        <td>自动将当前请求URL附加到日志末尾</td>
        <td>boolean</td>
        <td>true</td>
    </tr>
    <tr>
        <td>console.forceSingleLine</td>
        <td>强制每条日志不换行</td>
        <td>boolean</td>
        <td>false</td>
    </tr>
    <tr>
        <td>extension.enable</td>
        <td>是否启用在 Chrome 扩展程序中查看日志</td>
        <td>boolean</td>
        <td>true</td>
    </tr>
    <tr>
        <td>extension.key</td>
        <td>此处设置的key要和扩展程序中设置的 secret key 一样时，才会输出日志</td>
        <td>string</td>
        <td>yourownsecretkey</td>
    </tr>
</table>

### middleware()

注册日志中间件，支持与 [Express](http://expressjs.com/) 中间件兼容的框架。

```js
app.use(serverlog.middleware());
```

### getLogger(categoryName)

创建并返回一个 [logger](https://github.com/eshengsky/ServerLog/blob/master/README_zh.md#logger) 实例。

`categoryName`: 字符串，日志种类名称，默认值：normal.

## logger

### info(arg1, arg2, ...args)

记录一条信息日志，可以传入任意类型、任意数量的参数。

```js
logger.info('This is an info log.');
```

### warn(arg1, arg2, ...args)

记录一条警告日志，可以传入任意类型、任意数量的参数。

```js
let undef;
logger.warn('This is a warning log.', 'Take care, undef value is:', undef);
```

### error(arg1, arg2, ...args)

记录一条错误日志，可以传入任意类型、任意数量的参数。

```js
try {
    foo.bar();
} catch (err) {
    logger.error('This is an error log. Error:', err);
}
```

### infoC(arg1, arg2, ...args), warnC(arg1, arg2, ...args), errorC(arg1, arg2, ...args)

只向终端输出相应日志。

### infoE(arg1, arg2, ...args), warnE(arg1, arg2, ...args), errorE(arg1, arg2, ...args)

只向 Chrome 扩展输出相应日志。

```js
// 在 Chrome 扩展中打印完整文件内容
logger.infoE('read data from local file:', JSON.parse(data));

// Console 中只记录一行
logger.infoC('read data from local file, please view data in Chrome extension.');
```

## 请求ID

### 什么是请求ID

在注册了中间件后，所有的与请求相关的日志，默认都包含一个请求 ID。在同一次请求中，所有日志的请求 ID 一定相同；在不同请求中，请求 ID 一定不同。

例如：用户甲访问 index.html 过程中 ServerLog 打印了 10 条日志，这 10 条日志的请求 ID 是相同的；用户乙也访问了该页面，同样产生了 10 条日志，这些日志的请求 ID 也一定是相同的，但和用户甲的请求 ID 不同。

### 主要作用

让你能够在大量日志中，只要知道了一条日志的请求 ID，就可以关联你所需要的全部的日志。

### 如何查看请求ID

当你可以定位到一条请求相关的日志，在日志的种类和日志内容之间的，就是请求 ID。例如下面的 `Ra8dx5lAL`:

```
[2019-05-08 15:23:06.911] [INFO] home - {Ra8dx5lAL} This is an info log. (URL: http://localhost:3000/)
```

如果你可以监听页面的网络请求，则响应头 `X-Request-Id` 即是请求 ID：

```
X-Request-Id: Ra8dx5lAL
```

## 许可
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

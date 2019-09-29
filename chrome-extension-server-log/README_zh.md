# chrome-extension-server-log

Chrome 浏览器扩展插件，用于在 Chrome 开发者工具和 Console 中查看服务端日志。

功能特色：

* 良好的日志查看体验；
* 只会展示与你相关的日志，其他人产生的日志不会输出到你的开发者工具中。
* 你现在可以在浏览器控制台中同时查看客户端和服务端的日志了。

此扩展程序是 [ServerLog](https://github.com/eshengsky/ServerLog) 日志库的一部分，但并非仅适用于 ServerLog。在理解如下 [基本原理](#基本原理) 后，你可以尝试创建自己的日志库或改造现有的日志库，以适配此扩展。

## 预览

* 打印到 Chrome 扩展：

![image](https://raw.githubusercontent.com/eshengsky/ServerLog/master/chrome-extension-server-log/preview_ext_zh.png)

* 打印到浏览器 Console：

![image](https://raw.githubusercontent.com/eshengsky/ServerLog/master/chrome-extension-server-log/preview_console.png)

## 安装

[从Chrome网上应用商店安装](https://chrome.google.com/webstore/detail/serverlog/ghmhlknahaejhdlobgpaoocmjlhgmcci)

如果你无法访问 Chrome 应用商店，也可以按如下步骤下载安装：

1. 在 [Release](https://github.com/eshengsky/ServerLog/releases) 下载并解压缩；
2. 在 Chrome 浏览器地址栏输入 [chrome://extensions/](chrome://extensions/) 进入扩展页面，勾选"开发者模式"；
3. 将下载后的 `chrome-extension-server-log` 文件夹拖到页面中，点击"添加扩展程序"按钮；
4. 按 F12 打开开发者工具，点击 `ServerLog` 面板，后端日志将会展示在这里。

## 什么是 secret key

为安全起见，扩展程序中设置的 secret key，会和服务端的 key 做一个比对，只有完全一样时，才会输出日志到扩展中。

服务端默认的 key 值是 `yourownsecretkey`。

## 基本原理

1. 安装扩展程序后，扩展会自动添加请求头 `X-Request-Server-Log`，它的值是用户在扩展中配置的secret key；
2. 服务端根据上述请求头的值判断是否是合法用户；
3. 若是合法用户，服务端按照 [约定](#约定)，将日志插入响应头 `X-Server-Log-Data` 中；
4. 扩展会监听 Network 中接收到的网络请求，解析 `X-Server-Log-Data` 的值并将得到的日志信息输出到开发者工具的 `ServerLog` 面板中。

## 约定

服务器端可以使用任何语言或技术，只需要遵循如下约定：

1. 日志集合必须是一个数组，该数组元素为对象，每一个对象代表一条日志，对象可以包含 `time`、`type`、`message` 3个必须属性和 `category` 1个可选属性，分别表示记录时间、日志级别（info、warn、error）、日志内容、日志种类，其中 `message` 必须是数组类型。

    示例：
    ```js
    [{
        "time": "2017-07-01 09:30:00.200",
        "type": "info",
        "message": ["hello", "world"]
    }, {
        "time": "2017-07-01 09:30:01.300",
        "type": "error",
        "category": "home",
        "message": ["error occurs！"]
    }]
    ```

2. 数组需要转为字符串类型，并使用 [lz-string](http://pieroxy.net/blog/pages/lz-string/index.html) 库进行压缩以减少体积。

    示例（JavaScript）：
    ```js
    const result = lzstring.compressToEncodedURIComponent(JSON.stringify(logArr));
    ```

3. 上述结果需要放在响应头 `X-Server-Log-Data` 中。

## 许可
MIT License
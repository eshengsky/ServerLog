# chrome-extension-server-log

[中文文档](https://github.com/eshengsky/ServerLog/blob/master/chrome-extension-server-log/README_zh.md)

Chrome browser extension, used to view server side logs in Chrome dev tools and Console panel.

Functional features:

* Good log viewing experience.
* Only the logs associated with you will be displayed, and the logs generated by others will not be exported to your dev tools.
* You can now view both the client and server side logs in the browser Console.

This extension is part of [ServerLog](https://github.com/eshengsky/ServerLog), but it's not just for ServerLog. After understaing the [Basic principles](#basic-principles), you can try to create your own log library or modify the existing library to adapt to this extension.

## Preview

* Print in Chrome extension:

![image](https://raw.githubusercontent.com/eshengsky/ServerLog/master/chrome-extension-server-log/preview_ext_en.png)

* Print in browser Console：

![image](https://raw.githubusercontent.com/eshengsky/ServerLog/master/chrome-extension-server-log/preview_console.png)

## Install

[Install from Chrome Web Store](https://chrome.google.com/webstore/detail/serverlog/ghmhlknahaejhdlobgpaoocmjlhgmcci)

If you can't access the Chrome Web Store, you can download and install it as follows:

1. Download and decompress from [Release](https://github.com/eshengsky/ServerLog/releases) page.
2. Press [chrome://extensions/](chrome://extensions/) in Chrome browser address bar to go to the extension page, and check "Developer mode".
3. Drag the downloaded `chrome-extension-server-log` folder onto the page and click the "Add Extension Program" button.
4. Press `Ctrl+Shift+I` to open the dev tools, click `ServerLog` tab, set [Secret Key](https://github.com/eshengsky/ServerLog/tree/master/chrome-extension-server-log#secret-key).

## Secret Key

For security reasons, to prevent unauthorized users from viewing the server log, the key set in the extension will be sent to the server for verification. Only when it is exactly the same will the log be output to the extension.

On server side, set `extension.key` in [config](https://github.com/eshengsky/ServerLog/blob/master/README_zh.md#configoptions) as the key of current service:
```js
serverlog.config({
    extension: {
        enable: true,
        key: 'my_secret_key_123'
    }
});
```

In the extension panel, click the 'key' icon, add a line `my_secret_key_123`, click Save, then you can receive the log of the above server.

If you do not know the secret key of the service, please consult the administrator of the service.

### Note

* If you want to view logs for multiple services, you can add multiple keys by wrapping in the extension.
* In service the default key is `yourownsecretkey`.
* As with passwords, it is recommended to periodically modify the secret key of all services.

## Basic principles

1. After the extension is installed, the extension automatically adds the request header `X-Request-Server-Log`, its value is the secret key configured by the user in the extension, ​​separated by semicolons if there are multiple keys.
2. The server determines whether it is a legitimate user based on the value of the above request header;
3. In the case of a legitimate user, the server inserts the logs into the response header `X-Server-Log-Data` in accordance with [Conventions](#conventions).
4. The extension listens for network requests received in Network, parses the values of `X-Server-Log-Data`, and outputs the obtained log information to the `ServerLog` Panel of the dev tools.

## Conventions

The server side can use any language or technology and simply follow the following conventions:

1. The log collection must be an array, the array element is an object, each object represents a log, and the object can contain `time`, `type`, `message` the 3 required properties, and `category` an optional property, representing the recording times, log levels (info, warn, error), log content, log type, where `message` must be an array type.

    Example:
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

2. Arrays need to be converted to string types and compressed using the [lz-string](http://pieroxy.net/blog/pages/lz-string/index.html) library to reduce volume.

    Example (JavaScript):
    ```js
    const result = lzstring.compressToEncodedURIComponent(JSON.stringify(logArr));
    ```

3. The above results need to be placed in the response header `X-Server-Log-Data`.

## License
MIT License
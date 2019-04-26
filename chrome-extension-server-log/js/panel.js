(function () {
    const getEl = document.querySelector.bind(document);

    require.config({ paths: { 'vs': './monaco-editor/min/vs' } });
    require.config({
        'vs/nls': {
            availableLanguages: {
                '*': 'zh-cn'
            }
        }
    });

    const mutationCb = mutationsList => {
        mutationsList.forEach(list => {
            const nodes = list.addedNodes;
            nodes.forEach(node => {
                const editors = node.querySelectorAll('.editor');
                if (editors && editors.length) {
                    for (let i = 0; i < editors.length; i++) {
                        const editor = editors[i];
                        let text = decodeURIComponent(editor.previousElementSibling.textContent);
                        if (text) {
                            editor.previousElementSibling.textContent = '';
                            let lang = 'html';
                            try {
                                text = JSON.stringify(JSON.parse(text), null, 4);
                                lang = 'json';
                            } catch (err) {
                                // console.error('接口返回不是JSON格式！', err);
                                lang = 'html';
                            }
                            require(['vs/editor/editor.main'], () => {
                                monaco.editor.defineTheme('serverlogTheme', {
                                    base: 'vs',
                                    inherit: true,
                                    rules: [],
                                    colors: {
                                        'editor.background': '#f6f8fa',
                                    }
                                });

                                const mnc = monaco.editor.create(editor, {
                                    language: lang,
                                    value: text,
                                    // contextmenu: false,
                                    scrollBeyondLastLine: false,
                                    fontSize: 13,
                                    dragAndDrop: false,
                                    automaticLayout: true,
                                    theme: 'serverlogTheme'
                                });

                                // 格式化代码
                                setTimeout(() => {
                                    mnc.getAction('editor.action.formatDocument').run().then(() => {
                                        // 格式化结束之后，再去设置只读
                                        mnc.updateOptions({
                                            readOnly: true
                                        });
                                    });
                                }, 200);
                            });
                        }
                    }

                }
            });
        });
    }

    // 监听新的日志
    const observer = new MutationObserver(mutationCb);
    observer.observe(getEl('#logs'), {
        attributes: false,
        childList: true,
        subtree: false
    });

    // 禁用右键
    window.document.addEventListener('contextmenu', e => {
        // e.preventDefault();
    });

    getEl('#clear')
        .addEventListener('click', () => {
            getEl('#logs')
                .innerHTML = '';
            getEl('#total-count')
                .textContent = '0';
            getEl('#filter-info')
                .textContent = '';
        });

    const filterLogs = function () {
        const keyword = getEl('#search')
            .value.replace(/(^\s*)|(\s*$)/g, '');
        const selectLevel = getEl('.level-wrap .active')
            .id;
        let hiddenCount = 0;
        document.querySelectorAll('#logs li.log-li')
            .forEach(li => {
                // 判断 level
                let matchLevel = true;
                const logLevel = li.classList.length > 0 ? li.classList[0] : 'info';
                switch (selectLevel) {
                    case 'warn':
                        if (logLevel !== 'warn' && logLevel !== 'error') {
                            matchLevel = false;
                        }
                        break;
                    case 'error':
                        if (logLevel !== 'error') {
                            matchLevel = false;
                        }
                        break;
                    default:
                }

                if (li.textContent.toLowerCase()
                    .indexOf(keyword.toLowerCase()) >= 0 && matchLevel) {
                    li.style.display = '';
                } else {
                    li.style.display = 'none';
                    hiddenCount++;
                }
            });

        // 没有筛选结果时提示
        const totalCount = Number(getEl('#total-count').textContent);
        if (totalCount > 0 && totalCount === hiddenCount) {
            getEl('#no-data').style.display = 'block';
        } else {
            getEl('#no-data').style.display = 'none';
        }

        if (hiddenCount > 0) {
            getEl('#filter-info')
                .textContent = `（${hiddenCount}条日志被筛选隐藏）`;
        } else {
            getEl('#filter-info')
                .textContent = '';
        }
    };

    getEl('#search')
        .addEventListener('input', () => {
            filterLogs();
        });

    getEl('.level-wrap')
        .addEventListener('click', e => {
            const target = e.target;
            if (e.target.id) {
                document.querySelectorAll('.level-wrap div')
                    .forEach(el => el.classList.remove('active'));
                e.target.classList.add('active');
                filterLogs();
            }
        });

    getEl('#logs')
        .addEventListener('click', e => {
            if (e.target.classList.contains('copy')) {
                e.target.classList.remove('copy');
                e.target.classList.add('copied');
                const logContentEl = e.target.previousElementSibling;
                const time = logContentEl.querySelector('.time').textContent;
                const reqId = logContentEl.querySelector('.reqId').textContent;
                let log = e.target.previousElementSibling.textContent;
                log = log.replace(time, `[${time}] `).replace(reqId, `${reqId} `);
                copyTextToClipboard(log);
                e.target.textContent = '已完成';
                setTimeout(() => {
                    e.target.textContent = '复制';
                    e.target.classList.remove('copied');
                    e.target.classList.add('copy');
                }, 800);
            } else if (e.target.classList.contains('link')) {
                // 按住Ctrl键才跳转
                if (e.ctrlKey) {
                    chrome.tabs.create({ url: e.target.dataset.link });
                }
            } else if (e.target.classList.contains('full-link') || e.target.classList.contains('icon-full-screen') || e.target.classList.contains('span-full')) {
                // 代码全屏
                let respContent = e.target.parentElement.parentElement;
                if (!e.target.classList.contains('full-link')) {
                    respContent = e.target.parentElement.parentElement.parentElement;
                }
                if (respContent.classList.contains('resp-content')) {
                    if (!respContent.classList.contains('full')) {
                        document.body.classList.add('noscroll');
                        respContent.classList.add('full');
                        respContent.querySelector('.editor').style.height = (window.innerHeight - 34) + 'px';
                        respContent.querySelector('.full-link span').textContent = '退出全屏';
                    } else {
                        respContent.classList.remove('full');
                        respContent.querySelector('.editor').style.height = '180px';
                        respContent.querySelector('.full-link span').textContent = '全屏';
                        document.body.classList.remove('noscroll');
                    }
                }
            }
        });

    getEl('#logs')
        .addEventListener('mouseover', e => {
            if (e.target.classList.contains('link')) {
                // 按住Ctrl键显示手状
                if (e.ctrlKey) {
                    e.target.style.cursor = 'pointer';
                }
            }
        });

    getEl('#logs')
        .addEventListener('mouseout', e => {
            if (e.target.classList.contains('link')) {
                e.target.style.cursor = 'text';
            }
        });

    getEl('footer')
        .addEventListener('click', e => {
            if (e.target.id === 'check-now') {
                checkUpdate();
            }
        });

    const currVersionNumber = getNumVersion(chrome.app.getDetails().version);
    const version = `v${chrome.app.getDetails().version}`;
    getEl('#curr-version').innerHTML = `<a href="http://10.200.5.103/h5_tools/chrome-extension-server-log/tags/${version}" target="_blank">${version}</a>`;

    checkUpdate();

    function checkUpdate() {
        getEl('#update-info').classList.remove('has-check');
        getEl('#update-info').innerHTML = '检查更新中...';
        const startTime = Date.now();
        const timeout = 2000;
        const xhr = new XMLHttpRequest();
        function done() {
            const data = JSON.parse(xhr.responseText);
            data.sort((v1, v2) => {
                return getNumVersion(v2.name) - getNumVersion(v1.name)
            });
            const latestVersion = data[0].name;
            const latestVersionNumber = getNumVersion(data[0].name);
            if (latestVersionNumber > currVersionNumber) {
                // 有更新
                getEl('#update-info').classList.add('has-update');
                getEl('#update-info').innerHTML = `<a href="http://10.200.5.103/h5_tools/chrome-extension-server-log/tags/${latestVersion}" target="_blank">检测到新版本${latestVersion}</a>`;
            } else {
                // 没有更新
                getEl('#update-info').classList.add('has-check');
                getEl('#update-info').classList.add('no-update');
                getEl('#update-info').innerHTML = '没有更新版本 <i class="iconfont icon-update" id="check-now" title="检查更新"></i>';
            }
        }
        xhr.onreadystatechange = function () {
            if (xhr.readyState === XMLHttpRequest.DONE) {
                if (xhr.status >= 200 && xhr.status < 400) {
                    const endTime = Date.now();
                    const diff = endTime - startTime;
                    if (diff < timeout) {
                        setTimeout(() => {
                            done();
                        }, timeout - diff);
                    } else {
                        done();
                    }
                }
            }
        };
        xhr.open('GET', 'http://10.200.5.103/api/v3/projects/608/repository/tags?private_token=s8bzXudzKMAumApMqYXS', true);
        xhr.send();
    }

    function getNumVersion(version) {
        return Number(version.replace('v', '').replace(/\./g, ''));
    }

    function copyTextToClipboard(text) {
        const textArea = document.createElement('textarea');
        textArea.style.position = 'fixed';
        textArea.style.top = 0;
        textArea.style.left = 0;

        textArea.style.width = '2em';
        textArea.style.height = '2em';

        textArea.style.padding = 0;

        textArea.style.border = 'none';
        textArea.style.outline = 'none';
        textArea.style.boxShadow = 'none';

        textArea.style.background = 'transparent';


        textArea.value = text;

        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        try {
            document.execCommand('copy');
        } catch (err) {
            console.error('复制出错了！', err);
        }

        document.body.removeChild(textArea);
    }
}());

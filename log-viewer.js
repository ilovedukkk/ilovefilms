/**
 * Логгер для просмотра логов в интерфейсе
 * Перехватывает console.log, console.warn, console.error
 */

(function () {
    const MAX_LOGS = 200;
    const logs = [];
    const origLog = console.log;
    const origWarn = console.warn;
    const origError = console.error;

    function formatArgs(args) {
        return Array.from(args).map(arg => {
            if (typeof arg === 'object') {
                try {
                    return JSON.stringify(arg, null, 2);
                } catch (e) {
                    return String(arg);
                }
            }
            return String(arg);
        }).join(' ');
    }

    function addLog(type, args) {
        const message = formatArgs(args);
        const time = new Date().toLocaleTimeString('ru-RU', { hour12: false });
        logs.unshift({ type, message, time }); // добавляем в начало
        if (logs.length > MAX_LOGS) logs.pop();

        // Обновляем UI, если открыто
        updateLogUI();
    }

    console.log = function (...args) {
        origLog.apply(console, args);
        addLog('info', args);
    };

    console.warn = function (...args) {
        origWarn.apply(console, args);
        addLog('warning', args);
    };

    console.error = function (...args) {
        origError.apply(console, args);
        addLog('error', args);
    };

    // Генерируем CSS
    const style = document.createElement('style');
    style.textContent = `
        .log-viewer-modal {
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,0.85);
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.2s;
        }
        .log-viewer-modal.show {
            opacity: 1;
            pointer-events: auto;
        }
        .log-viewer-content {
            width: 90%;
            max-width: 800px;
            height: 80vh;
            background: #1e1e1e;
            border-radius: 8px;
            display: flex;
            flex-direction: column;
            border: 1px solid #333;
            box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        }
        .log-viewer-header {
            padding: 16px;
            border-bottom: 1px solid #333;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .log-viewer-title {
            font-size: 18px;
            font-weight: bold;
            color: #fff;
        }
        .log-viewer-close, .log-viewer-clear {
            background: #333;
            color: #fff;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            margin-left: 8px;
        }
        .log-viewer-close:hover, .log-viewer-clear:hover {
            background: #444;
        }
        .log-viewer-body {
            flex: 1;
            overflow-y: auto;
            padding: 16px;
            font-family: monospace;
            font-size: 13px;
        }
        .log-item {
            padding: 4px 0;
            border-bottom: 1px solid #2a2a2a;
            word-break: break-all;
            white-space: pre-wrap;
        }
        .log-time {
            color: #888;
            margin-right: 8px;
        }
        .log-info { color: #a0c2e0; }
        .log-warning { color: #d0b050; }
        .log-error { color: #e06c75; }
    `;
    document.head.appendChild(style);

    // DOM элементы
    const modal = document.createElement('div');
    modal.className = 'log-viewer-modal';
    modal.innerHTML = `
        <div class="log-viewer-content">
            <div class="log-viewer-header">
                <div class="log-viewer-title">Журнал работы (Логи)</div>
                <div>
                    <button class="log-viewer-clear">Очистить</button>
                    <button class="log-viewer-close">Закрыть</button>
                </div>
            </div>
            <div class="log-viewer-body" id="log-viewer-body">
                <!-- Логи -->
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    const logBody = modal.querySelector('#log-viewer-body');
    const btnClose = modal.querySelector('.log-viewer-close');
    const btnClear = modal.querySelector('.log-viewer-clear');

    function updateLogUI() {
        if (!modal.classList.contains('show')) return;
        
        logBody.innerHTML = '';
        logs.forEach(log => {
            const div = document.createElement('div');
            div.className = 'log-item log-' + log.type;
            div.innerHTML = '<span class="log-time">[' + log.time + ']</span>' + escapeHtml(log.message);
            logBody.appendChild(div);
        });
    }

    function escapeHtml(unsafe) {
        return unsafe
             .replace(/&/g, "&amp;")
             .replace(/</g, "&lt;")
             .replace(/>/g, "&gt;")
             .replace(/"/g, "&quot;")
             .replace(/'/g, "&#039;");
    }

    function showLogs() {
        modal.classList.add('show');
        updateLogUI();
    }

    function hideLogs() {
        modal.classList.remove('show');
    }

    btnClose.addEventListener('click', hideLogs);
    btnClear.addEventListener('click', () => {
        logs.length = 0;
        updateLogUI();
    });

    // Добавляем слушатель для закрытия по Esc/Back
    document.addEventListener('keydown', (e) => {
        if (!modal.classList.contains('show')) return;
        
        // Перехватываем Back или Esc
        const key = e.key || '';
        const code = Number(e.keyCode || e.which || 0);
        if (key === 'Escape' || key === 'Backspace' || key === 'GoBack' || key === 'Back' || code === 8 || code === 27 || code === 461 || code === 10009) {
            e.preventDefault();
            e.stopPropagation();
            hideLogs();
        }
    }, true);

    // Регистрируем расширение в Lampa
    if (window.Lampa) {
        Lampa.addButton('Отладка: Логи', 'fa-solid fa-terminal', showLogs);
        console.log('[LogViewer] Запущено и готово к работе');
    }

})();

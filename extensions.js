/**
 * =========================================================================
 * ilovefilms — Система расширений (Lampa-style)
 * =========================================================================
 * Глобальный объект Lampa — API для расширений.
 * Расширения — это JS-файлы, загружаемые по URL, которые могут:
 *   - Подписываться на события приложения
 *   - Добавлять категории в меню
 *   - Регистрировать парсеры торрентов
 *   - Добавлять кнопки на страницу фильма
 *   - Использовать рендер карточек
 */

(function () {
    'use strict';

    // ==================== Event Bus ====================
    const _listeners = {};

    function on(event, callback) {
        if (!_listeners[event]) _listeners[event] = [];
        _listeners[event].push(callback);
    }

    function off(event, callback) {
        if (!_listeners[event]) return;
        _listeners[event] = _listeners[event].filter(cb => cb !== callback);
    }

    function emit(event, data) {
        if (!_listeners[event]) return;
        _listeners[event].forEach(cb => {
            try {
                cb(data);
            } catch (e) {
                console.error(`[Extensions] Ошибка в обработчике "${event}":`, e);
            }
        });
    }

    // ==================== Custom Categories ====================
    const _customCategories = [];

    function addCategory(config) {
        // config: { name: string, icon?: string, fetchFn: async () => items[] }
        if (!config || !config.name || !config.fetchFn) {
            console.error('[Extensions] addCategory: нужны name и fetchFn');
            return;
        }
        _customCategories.push({
            name: config.name,
            icon: config.icon || 'fa-solid fa-puzzle-piece',
            fetchFn: config.fetchFn
        });
        emit('category:added', config);
    }

    function getCustomCategories() {
        return _customCategories;
    }

    // ==================== Custom Parsers ====================
    const _customParsers = [];

    function addParser(config) {
        // config: { name: string, url: string, searchFn?: async (query) => results[] }
        if (!config || !config.name) {
            console.error('[Extensions] addParser: нужен name');
            return;
        }
        _customParsers.push(config);
        emit('parser:added', config);
    }

    function getCustomParsers() {
        return _customParsers;
    }

    // ==================== Custom Buttons (Details Page) ====================
    const _customButtons = [];

    function addButton(config) {
        // config: { label: string, icon?: string, onClick: (movieData) => void }
        if (!config || !config.label || !config.onClick) {
            console.error('[Extensions] addButton: нужны label и onClick');
            return;
        }
        _customButtons.push(config);
        emit('button:added', config);
    }

    function getCustomButtons() {
        return _customButtons;
    }

    // ==================== Extension Manager ====================
    const STORAGE_KEY = 'extensions';

    function getInstalledExtensions() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
        } catch {
            return [];
        }
    }

    function saveExtensions(list) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    }

    /**
     * Загрузить расширение по URL (инжект <script>)
     * @param {string} url
     * @returns {Promise<boolean>}
     */
    function loadExtension(url) {
        return new Promise((resolve) => {
            // Проверяем, не загружено ли уже
            if (document.querySelector(`script[data-extension-url="${url}"]`)) {
                console.log(`[Extensions] Уже загружено: ${url}`);
                resolve(true);
                return;
            }

            const script = document.createElement('script');
            script.src = url;
            script.dataset.extensionUrl = url;
            script.async = true;

            script.onload = () => {
                console.log(`[Extensions] ✅ Загружено: ${url}`);
                emit('extension:loaded', { url });
                resolve(true);
            };

            script.onerror = () => {
                console.error(`[Extensions] ❌ Не удалось загрузить: ${url}`);
                emit('extension:error', { url });
                resolve(false);
            };

            document.head.appendChild(script);
        });
    }

    /**
     * Добавить расширение (сохранить + загрузить)
     */
    async function installExtension(url, name) {
        const list = getInstalledExtensions();

        // Проверяем дубликат
        if (list.find(ext => ext.url === url)) {
            console.log(`[Extensions] Уже установлено: ${url}`);
            return false;
        }

        const success = await loadExtension(url);

        list.push({
            url: url,
            name: name || extractName(url),
            enabled: true,
            addedAt: Date.now(),
            status: success ? 'ok' : 'error'
        });

        saveExtensions(list);
        emit('extensions:changed', list);
        return success;
    }

    /**
     * Удалить расширение
     */
    function removeExtension(url) {
        let list = getInstalledExtensions();
        list = list.filter(ext => ext.url !== url);
        saveExtensions(list);

        // Удаляем script из DOM
        const script = document.querySelector(`script[data-extension-url="${url}"]`);
        if (script) script.remove();

        emit('extensions:changed', list);
    }

    /**
     * Включить/выключить расширение
     */
    function toggleExtension(url, enabled) {
        const list = getInstalledExtensions();
        const ext = list.find(e => e.url === url);
        if (ext) {
            ext.enabled = enabled;
            saveExtensions(list);
            emit('extensions:changed', list);
        }
    }

    /**
     * Загрузить все включённые расширения
     */
    async function loadAllExtensions() {
        const list = getInstalledExtensions();
        const enabledList = list.filter(ext => ext.enabled);

        console.log(`[Extensions] Загрузка ${enabledList.length} расширений...`);

        for (const ext of enabledList) {
            const success = await loadExtension(ext.url);
            ext.status = success ? 'ok' : 'error';
        }

        saveExtensions(list);
        emit('extensions:allLoaded', list);
    }

    /**
     * Извлечь имя из URL
     */
    function extractName(url) {
        try {
            const parts = url.split('/');
            const fileName = parts[parts.length - 1] || parts[parts.length - 2];
            return fileName.replace(/\.js$/, '') || url;
        } catch {
            return url;
        }
    }

    // ==================== Утилиты для расширений ====================

    /**
     * Показать уведомление (toast)
     */
    function showNotification(text, duration) {
        duration = duration || 3000;
        const toast = document.createElement('div');
        toast.className = 'ext-toast';
        toast.textContent = text;
        document.body.appendChild(toast);

        requestAnimationFrame(() => toast.classList.add('show'));

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }

    // ==================== Глобальный API ====================
    window.Lampa = {
        // Информация
        manifest: {
            name: 'ilovefilms',
            version: '1.0.0',
            platform: 'web'
        },

        // Event Bus
        on,
        off,
        emit,

        // Расширение функционала
        addCategory,
        addParser,
        addButton,

        // Чтение зарегистрированных данных расширений
        getCustomCategories,
        getCustomParsers,
        getCustomButtons,

        // Менеджер расширений
        install: installExtension,
        remove: removeExtension,
        toggle: toggleExtension,
        list: getInstalledExtensions,
        loadAll: loadAllExtensions,

        // Утилиты
        notify: showNotification,

        // Хранилище для расширений (каждое может использовать свой ключ)
        storage: {
            get(key) {
                try {
                    return JSON.parse(localStorage.getItem('ext_' + key));
                } catch {
                    return null;
                }
            },
            set(key, value) {
                localStorage.setItem('ext_' + key, JSON.stringify(value));
            },
            remove(key) {
                localStorage.removeItem('ext_' + key);
            }
        }
    };

    console.log('[Extensions] Lampa API инициализирован');
})();

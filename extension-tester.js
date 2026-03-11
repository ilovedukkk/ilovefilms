/**
 * ilovefilms — Расширение для проверки работы системы расширений
 *
 * Проверяет: Lampa API, event bus (on/off/emit), addCategory, addParser, addButton,
 * storage, менеджер расширений. Результаты — в консоль и toast-уведомления.
 *
 * Установка: Настройки → Расширения → URL (например):
 *   file:///.../extensions/extension-tester.js  (локально)
 *   или https://your-server.com/extensions/extension-tester.js
 *
 * На странице фильма появится кнопка "Проверка расширений" для повторного запуска тестов.
 */
(function () {
    'use strict';

    const EXT_NAME = 'Extension Tester';
    const STORAGE_KEY = 'extension_tester_results';

    function log(msg, level) {
        const prefix = `[${EXT_NAME}]`;
        if (level === 'error') console.error(prefix, msg);
        else if (level === 'warn') console.warn(prefix, msg);
        else console.log(prefix, msg);
    }

    function notify(text, duration) {
        if (typeof window.Lampa !== 'undefined' && typeof window.Lampa.notify === 'function') {
            window.Lampa.notify(text, duration || 4000);
        }
    }

    function runTests() {
        const results = { passed: 0, failed: 0, tests: [] };

        function pass(name) {
            results.passed++;
            results.tests.push({ name, ok: true });
            log('✓ ' + name);
        }

        function fail(name, reason) {
            results.failed++;
            results.tests.push({ name, ok: false, reason });
            log('✗ ' + name + ': ' + reason, 'error');
        }

        // 1. Проверка глобального объекта Lampa
        if (typeof window.Lampa === 'undefined') {
            fail('Lampa API', 'Объект Lampa не найден');
            return results;
        }
        pass('Lampa API');

        // 2. Event bus
        if (typeof window.Lampa.on !== 'function') fail('Event: on()', 'Отсутствует');
        else pass('Event: on()');

        if (typeof window.Lampa.off !== 'function') fail('Event: off()', 'Отсутствует');
        else pass('Event: off()');

        if (typeof window.Lampa.emit !== 'function') fail('Event: emit()', 'Отсутствует');
        else pass('Event: emit()');

        // 3. Тест emit/on
        let emitReceived = false;
        const testHandler = () => { emitReceived = true; };
        window.Lampa.on('_test_extension_tester_', testHandler);
        window.Lampa.emit('_test_extension_tester_', {});
        window.Lampa.off('_test_extension_tester_', testHandler);
        if (emitReceived) pass('Event bus (emit/on/off)');
        else fail('Event bus (emit/on/off)', 'Обработчик не сработал');

        // 4. addCategory / getCustomCategories
        const CAT_NAME = 'Проверка расширений';
        if (typeof window.Lampa.addCategory !== 'function') {
            fail('addCategory()', 'Отсутствует');
        } else {
            const cats = (window.Lampa.getCustomCategories && window.Lampa.getCustomCategories()) || [];
            if (!cats.some(c => c.name === CAT_NAME)) {
                window.Lampa.addCategory({
                    name: CAT_NAME,
                    icon: 'fa-solid fa-vial',
                    fetchFn: async () => [{ id: 'tip', title: 'Система расширений работает', overview: 'Все тесты API пройдены.' }]
                });
            }
            const after = (window.Lampa.getCustomCategories && window.Lampa.getCustomCategories()) || [];
            if (after.some(c => c.name === CAT_NAME)) pass('addCategory / getCustomCategories');
            else fail('addCategory / getCustomCategories', 'Категория не зарегистрирована');
        }

        // 5. addParser / getCustomParsers
        const PARSER_NAME = 'ExtensionTester (test)';
        if (typeof window.Lampa.addParser !== 'function') {
            fail('addParser()', 'Отсутствует');
        } else {
            const parsers = (window.Lampa.getCustomParsers && window.Lampa.getCustomParsers()) || [];
            if (!parsers.some(p => p.name === PARSER_NAME)) {
                window.Lampa.addParser({ name: PARSER_NAME, url: 'https://test.example' });
            }
            const after = (window.Lampa.getCustomParsers && window.Lampa.getCustomParsers()) || [];
            if (after.some(p => p.name === PARSER_NAME)) pass('addParser / getCustomParsers');
            else fail('addParser / getCustomParsers', 'Парсер не зарегистрирован');
        }

        // 6. addButton / getCustomButtons — кнопка при клике показывает результаты проверки
        const BTN_LABEL = 'Проверка расширений';
        if (typeof window.Lampa.addButton !== 'function') {
            fail('addButton()', 'Отсутствует');
        } else {
            const buttons = (window.Lampa.getCustomButtons && window.Lampa.getCustomButtons()) || [];
            if (!buttons.some(b => b.label === BTN_LABEL)) {
                window.Lampa.addButton({
                    label: BTN_LABEL,
                    icon: 'fa-solid fa-vial',
                    onClick: () => {
                        const saved = window.Lampa.storage && window.Lampa.storage.get(STORAGE_KEY);
                        if (saved) showSummary(saved);
                        else showSummary(runTests());
                    }
                });
            }
            const after = (window.Lampa.getCustomButtons && window.Lampa.getCustomButtons()) || [];
            if (after.some(b => b.label === BTN_LABEL)) pass('addButton / getCustomButtons');
            else fail('addButton / getCustomButtons', 'Кнопка не зарегистрирована');
        }

        // 7. Storage
        if (window.Lampa.storage) {
            try {
                window.Lampa.storage.set('_test_key_', { a: 1 });
                const val = window.Lampa.storage.get('_test_key_');
                window.Lampa.storage.remove('_test_key_');
                if (val && val.a === 1) pass('storage (get/set/remove)');
                else fail('storage', 'Некорректное чтение');
            } catch (e) {
                fail('storage', String(e.message || e));
            }
        } else {
            fail('storage', 'Объект storage отсутствует');
        }

        // 8. Extension manager
        if (typeof window.Lampa.list === 'function') pass('Lampa.list()');
        else fail('Lampa.list()', 'Отсутствует');

        if (typeof window.Lampa.install === 'function') pass('Lampa.install()');
        else fail('Lampa.install()', 'Отсутствует');

        if (typeof window.Lampa.remove === 'function') pass('Lampa.remove()');
        else fail('Lampa.remove()', 'Отсутствует');

        if (typeof window.Lampa.notify === 'function') pass('Lampa.notify()');
        else fail('Lampa.notify()', 'Отсутствует');

        return results;
    }

    function showSummary(results) {
        const total = results.passed + results.failed;
        const msg = `Проверка расширений: ${results.passed}/${total} тестов пройдено`;
        notify(msg, 5000);

        const failed = results.tests.filter(t => !t.ok);
        if (failed.length > 0) {
            log('Проваленные тесты:');
            failed.forEach(t => log('  - ' + t.name + ': ' + (t.reason || 'неизвестно'), 'error'));
        }
    }

    // Запуск при загрузке
    function init() {
        if (typeof window.Lampa === 'undefined') {
            log('Lampa API ещё не готов. Ожидание события DOMContentLoaded...');
            document.addEventListener('DOMContentLoaded', init);
            return;
        }

        log('Запуск проверки системы расширений...');
        const results = runTests();
        window.Lampa.storage && window.Lampa.storage.set(STORAGE_KEY, results);
        showSummary(results);

        // Подписка на события для дополнительной проверки
        window.Lampa.on('ready', function onReady() {
            log('Событие ready получено');
            window.Lampa.off('ready', onReady);
        });

        window.Lampa.on('extension:loaded', function (data) {
            log('Событие extension:loaded: ' + (data && data.url ? data.url : 'unknown'));
        });

        log('Расширение проверки расширений инициализировано');
    }

    init();
})();

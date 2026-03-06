// Конфигурация API
const API_KEY = 'fd2c701686807e04fcfd87e3daa2da3b';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/';

// Базовые параметры: ключ API и русский язык
const DEFAULT_PARAMS = `?api_key=${API_KEY}&language=ru-RU`;

// Кэширование ссылок на DOM элементы, чтобы не искать их при каждом рендере
// DOM элементы инициализируются лениво (после DOMContentLoaded)
let domElements = {};

function initDomElements() {
    domElements = {
        heroSection: document.getElementById('hero-section'),
        heroTitle: document.getElementById('hero-title'),
        heroOverview: document.getElementById('hero-overview'),
        heroBackdrop: document.getElementById('hero-backdrop'),
        carouselSection1: document.querySelectorAll('.carousel-section')[0],
        carouselSection2: document.querySelectorAll('.carousel-section')[1],
        popularContainer: document.getElementById('popular-movies'),
        topRatedContainer: document.getElementById('top-rated-movies'),
        
        // Элементы страницы фильма
        detailsPage: document.getElementById('details-page'),
        detailsBackdrop: document.getElementById('details-backdrop'),
        detailsPoster: document.getElementById('details-poster'),
        detailsTitle: document.getElementById('details-title'),
        detailsOriginalTitle: document.getElementById('details-original-title'),
        detailsRating: document.getElementById('details-rating'),
        detailsYear: document.getElementById('details-year'),
        detailsRuntime: document.getElementById('details-runtime'),
        detailsGenres: document.getElementById('details-genres'),
        detailsOverview: document.getElementById('details-overview'),
        detailsCast: document.getElementById('details-cast'),
        btnWatch: document.getElementById('btn-watch'),
        btnBack: document.getElementById('btn-back'),
        similarContainer: document.getElementById('similar-movies')
    };
}

// Глобальное состояние приложения
const appState = {
    currentView: 'home', // 'home', 'movie', 'tv'
    lastFocusedCard: null // Для возврата фокуса после закрытия страницы фильма
};

// Настройки пользователя
const userSettings = {
    imageQuality: localStorage.getItem('imageQuality') || 'high',
    torrServerHost: localStorage.getItem('torrServerHost') || 'http://127.0.0.1:8090',
    preferredParser: localStorage.getItem('preferredParser') || 'https://jac.red'
};

// Список парсеров Jackett с фолбеком
const JACKETT_PARSERS = [
    'https://jac.red',
    'https://ru.jacred.pro',
    'https://jr.maxvol.pro'
];
const JACKETT_API_PATH = '/api/v2.0/indexers/all/results';

/**
 * Возвращает правильный размер изображения для TMDB на основе настроек качества
 * @param {string} type 'poster' или 'backdrop'
 * @returns {string} url part like 'w500' 
 */
function getImageSize(type) {
    const quality = userSettings.imageQuality;
    if (type === 'poster') {
        if (quality === 'high') return 'w500';
        if (quality === 'medium') return 'w342';
        return 'w185';
    } else { // backdrop
        if (quality === 'high') return 'original';
        if (quality === 'medium') return 'w780';
        return 'w300';
    }
}

/**
 * Базовая функция для сетевых запросов к TMDB
 * @param {string} endpoint - Путь к API (например, /movie/popular)
 * @returns {Promise<Array>} Массив фильмов
 */
async function fetchMovies(endpoint) {
    try {
        const response = await fetch(`${BASE_URL}${endpoint}${DEFAULT_PARAMS}`);
        if (!response.ok) {
            throw new Error(`HTTP ошибка: ${response.status}`);
        }
        const data = await response.json();
        return data.results;
    } catch (error) {
        console.error('Ошибка загрузки данных:', error);
        return [];
    }
}

/**
 * Отрисовка главного баннера
 * @param {Object} item - Объект фильма или сериала
 */
function renderHero(item) {
    if (!item) return;
    
    domElements.heroTitle.textContent = item.title || item.name;
    domElements.heroOverview.textContent = item.overview || 'Описание пока отсутствует.';
    
    if (item.backdrop_path) {
        const backdropSize = getImageSize('backdrop');
        const imageUrl = `${IMAGE_BASE_URL}${backdropSize}${item.backdrop_path}`;
        domElements.heroBackdrop.style.backgroundImage = `url('${imageUrl}')`;
    }
}

/**
 * Создание карточки фильма (Apple TV Style)
 * @param {Object} movie - Объект фильма
 * @returns {HTMLElement}
 */
function createMovieCard(movie) {
    const card = document.createElement('div');
    card.classList.add('movie-card');
    card.tabIndex = 0;

    const posterSize = getImageSize('poster');
    const posterPath = movie.poster_path 
        ? `${IMAGE_BASE_URL}${posterSize}${movie.poster_path}` 
        : 'https://via.placeholder.com/240x360?text=No+Poster';

    const year = (movie.release_date || movie.first_air_date || '').substring(0, 4);
    const title = movie.title || movie.name;

    card.innerHTML = `
        <div class="card-inner">
            <img src="${posterPath}" alt="${title}" class="movie-poster" loading="lazy">
        </div>
        <div class="card-info-below">
            <h3 class="card-title">${title}</h3>
            <div class="card-meta">
                <span class="rating"><i class="fa-solid fa-star"></i> ${movie.vote_average ? movie.vote_average.toFixed(1) : 'NR'}</span>
                <span>${year}</span>
            </div>
        </div>
    `;
    
    const selectMovie = () => {
        openDetailsPage(movie);
    };

    card.addEventListener('click', selectMovie);
    card.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            appState.lastFocusedCard = card; // Запоминаем откуда открыли
            selectMovie();
        }
    });

    // Дебаунс для авто-обновления Hero при фокусе пультом или наведении мыши
    const handleFocus = () => {
        // Не обновляем Hero, если открыта страница фильма
        if (!domElements.detailsPage.classList.contains('hidden')) return;
        
        if (window.heroUpdateTimeout) {
            clearTimeout(window.heroUpdateTimeout);
        }
        window.heroUpdateTimeout = setTimeout(() => {
            renderHero(movie);
        }, 500);
    };

    card.addEventListener('focus', handleFocus);
    card.addEventListener('mouseenter', handleFocus);

    return card;
}

/**
 * Заполнение карусели списком фильмов
 * @param {Array} movies - Массив фильмов
 * @param {HTMLElement} container - DOM контейнер карусели
 */
function renderCarousel(movies, container) {
    if (!movies || !movies.length) return;
    
    container.innerHTML = ''; // Очистка перед добавлением (на случай обновления)
    
    // Используем DocumentFragment для минимизации перерисовок (reflow)
    const fragment = document.createDocumentFragment();
    
    movies.forEach(movie => {
        // Добавляем только фильмы с постерами, чтобы избежать пустых карточек
        if (movie.poster_path) {
            const card = createMovieCard(movie);
            fragment.appendChild(card);
        }
    });
    
    container.appendChild(fragment);
}

/**
 * Открытие страницы деталей (SPA Overlay)
 */
async function openDetailsPage(item) {
    // Показываем оверлей
    domElements.detailsPage.classList.remove('hidden');
    document.body.style.overflow = 'hidden'; // Запрет скролла основной страницы
    
    // Предзаполнение базовых данных для мгновенного отклика
    domElements.detailsTitle.textContent = item.title || item.name;
    domElements.detailsOverview.textContent = item.overview || 'Загрузка...';
    
    const posterSize = getImageSize('poster');
    const backdropSize = getImageSize('backdrop');
    
    if (item.poster_path) domElements.detailsPoster.src = `${IMAGE_BASE_URL}${posterSize}${item.poster_path}`;
    if (item.backdrop_path) domElements.detailsBackdrop.style.backgroundImage = `url('${IMAGE_BASE_URL}${backdropSize}${item.backdrop_path}')`;
    
    // Фокус на кнопку "Смотреть" для ТВ-пультов
    if (domElements.btnWatch) {
        // Отвязываем старый обработчик и создаём новый для текущего фильма
        const newBtnWatch = domElements.btnWatch.cloneNode(true);
        domElements.btnWatch.replaceWith(newBtnWatch);
        domElements.btnWatch = newBtnWatch;
        
        newBtnWatch.addEventListener('click', () => {
            const query = (item.title || item.name);
            openTorrentSearch(query);
        });
        newBtnWatch.focus();
    }

    // Определяем тип контента
    const isTv = !!item.name;
    const type = isTv ? 'tv' : 'movie';
    
    // Запрашиваем полные данные
    try {
        const response = await fetch(`${BASE_URL}/${type}/${item.id}${DEFAULT_PARAMS}&append_to_response=credits,similar`);
        const fullData = await response.json();
        
        // Обновляем UI полными данными
        domElements.detailsOriginalTitle.textContent = fullData.original_title || fullData.original_name || '';
        domElements.detailsRating.innerHTML = `<i class="fa-solid fa-star"></i> ${fullData.vote_average ? fullData.vote_average.toFixed(1) : 'NR'}`;
        
        const releaseStr = fullData.release_date || fullData.first_air_date;
        domElements.detailsYear.textContent = releaseStr ? releaseStr.substring(0, 4) : '';
        
        const runtime = fullData.runtime || (fullData.episode_run_time && fullData.episode_run_time[0]);
        domElements.detailsRuntime.textContent = runtime ? `${runtime} мин.` : '';
        
        // Жанры (как простой список через запятую)
        if (fullData.genres) {
            domElements.detailsGenres.textContent = fullData.genres.map(g => g.name).join(', ');
        }
        
        // Актеры (В ролях)
        if (fullData.credits && fullData.credits.cast) {
            domElements.detailsCast.textContent = fullData.credits.cast.slice(0, 6).map(a => a.name).join(', ');
        } else {
            domElements.detailsCast.textContent = 'Нет данных';
        }
        
        // Похожие (рендерим в карусель внутри страницы фильма)
        if (fullData.similar && fullData.similar.results) {
            renderCarousel(fullData.similar.results, domElements.similarContainer);
        }
        
    } catch (error) {
        console.error('Ошибка загрузки деталей:', error);
    }
}

/**
 * Закрытие страницы деталей
 */
function closeDetailsPage() {
    domElements.detailsPage.classList.add('hidden');
    document.body.style.overflow = ''; // Возвращаем скролл
    
    // Возвращаем фокус на карточку, с которой открыли, если она есть
    if (appState.lastFocusedCard) {
        appState.lastFocusedCard.focus();
        appState.lastFocusedCard = null;
    }
}

// Обработчик Esc/Backspace для закрытия страницы деталей
function setupDetailsPageHandlers() {
    if (domElements.btnBack) {
        domElements.btnBack.addEventListener('click', closeDetailsPage);
    }
    document.addEventListener('keydown', (e) => {
        if (!domElements.detailsPage.classList.contains('hidden')) {
            // Игнорируем, если фокус в инпуте
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            if (e.key === 'Escape' || e.key === 'Backspace') {
                e.preventDefault();
                closeDetailsPage();
            }
        }
    });
}

/**
 * Обновление главной страницы в зависимости от категории
 */
async function loadCategory(category) {
    // Очищаем текущие данные
    domElements.popularContainer.innerHTML = '';
    domElements.topRatedContainer.innerHTML = '';
    
    const titles = domElements.carouselSection1.querySelector('.carousel-title');
    const titles2 = domElements.carouselSection2.querySelector('.carousel-title');

    let fetchPromises = [];
    
    if (category === 'movies') {
        titles.innerHTML = '<i class="fa-solid fa-fire"></i> Популярные фильмы';
        titles2.innerHTML = '<i class="fa-solid fa-star"></i> Топ рейтинга';
        fetchPromises = [
            fetchMovies('/movie/popular'),
            fetchMovies('/movie/top_rated')
        ];
    } else if (category === 'tv') {
        titles.innerHTML = '<i class="fa-solid fa-fire"></i> Популярные сериалы';
        titles2.innerHTML = '<i class="fa-solid fa-star"></i> Топ сериалов';
        fetchPromises = [
            fetchMovies('/tv/popular'),
            fetchMovies('/tv/top_rated')
        ];
    } else {
        // Home
        titles.innerHTML = '<i class="fa-solid fa-fire"></i> В тренде (Фильмы)';
        titles2.innerHTML = '<i class="fa-solid fa-tv"></i> Популярные сериалы';
        fetchPromises = [
            fetchMovies('/trending/movie/week'),
            fetchMovies('/tv/popular')
        ];
    }

    const [list1, list2] = await Promise.all(fetchPromises);
    
    if (list1 && list1.length > 0) {
        renderHero(list1[0]);
    }
    
    renderCarousel(list1, domElements.popularContainer);
    renderCarousel(list2, domElements.topRatedContainer);
}

/**
 * Инициализация верхнего меню (Top Nav)
 */
function setupTopNav() {
    const navItems = document.querySelectorAll('.nav-item');
    
    navItems.forEach(item => {
        const handleClick = () => {
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
            
            const text = item.textContent.trim();
            if (text === 'Фильмы') {
                loadCategory('movies');
            } else if (text === 'Сериалы') {
                loadCategory('tv');
            } else if (text === 'Главная') {
                loadCategory('home');
            }
        };

        item.addEventListener('click', handleClick);
        item.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleClick();
        });
    });
}

/**
 * Инициализация модалки настроек
 */
function setupSettings() {
    const btnSettings = document.getElementById('btn-settings');
    const settingsModal = document.getElementById('settings-modal');
    const btnCloseSettings = document.getElementById('btn-close-settings');
    const qualityBtns = document.querySelectorAll('.settings-btn');
    
    if (!btnSettings || !settingsModal) return;

    // Открыть модалку
    const openSettings = () => {
        settingsModal.classList.remove('hidden');
        // Обновить активную кнопку
        qualityBtns.forEach(btn => {
            if (btn.dataset.quality === userSettings.imageQuality) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        const activeBtn = document.querySelector('.settings-btn.active');
        if (activeBtn) activeBtn.focus();
    };

    btnSettings.addEventListener('click', openSettings);
    btnSettings.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') openSettings();
    });

    // Закрыть модалку
    const closeSettings = () => {
        settingsModal.classList.add('hidden');
        btnSettings.focus();
    };

    btnCloseSettings.addEventListener('click', closeSettings);
    btnCloseSettings.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') closeSettings();
    });

    // Выбор качества
    qualityBtns.forEach(btn => {
        const setQuality = () => {
            const quality = btn.dataset.quality;
            userSettings.imageQuality = quality;
            localStorage.setItem('imageQuality', quality);
            
            // Визуально обновить кнопки
            qualityBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Перезагрузить текущую категорию для применения новых картинок
            const activeNav = document.querySelector('.nav-item.active');
            if (activeNav) {
                const text = activeNav.textContent.trim();
                if (text === 'Фильмы') loadCategory('movies');
                else if (text === 'Сериалы') loadCategory('tv');
                else loadCategory('home');
            }
            
            setTimeout(closeSettings, 300); // Автозакрытие
        };

        btn.addEventListener('click', setQuality);
        btn.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') setQuality();
        });
    });

    // Обработка клавиш в модалке (Esc/Backspace)
    settingsModal.addEventListener('keydown', (e) => {
        // Игнорируем, если фокус в инпуте при нажатии Backspace
        if (e.key === 'Backspace' && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) {
            return;
        }

        if (e.key === 'Escape' || e.key === 'Backspace') {
            e.preventDefault();
            closeSettings();
        }
    });
    
    // TorrServer address
    const inputTorrServer = document.getElementById('input-torrserver');
    if (inputTorrServer) {
        inputTorrServer.value = userSettings.torrServerHost;
        inputTorrServer.addEventListener('change', () => {
            const val = inputTorrServer.value.trim();
            if (val) {
                userSettings.torrServerHost = val;
                localStorage.setItem('torrServerHost', val);
            }
        });
    }
    
    // Выбор парсера
    const parserBtns = document.querySelectorAll('#parser-options .settings-btn');
    parserBtns.forEach(btn => {
        if (btn.dataset.parser === userSettings.preferredParser) {
            btn.classList.add('active');
        }
        
        const selectParser = () => {
            const parser = btn.dataset.parser;
            userSettings.preferredParser = parser;
            localStorage.setItem('preferredParser', parser);
            parserBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        };
        
        btn.addEventListener('click', selectParser);
        btn.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') selectParser();
        });
    });
}

/**
 * =========================================================================
 * Поиск торрентов через Jackett (jac.red) и воспроизведение через TorrServer
 * =========================================================================
 */

/**
 * Поиск торрентов через один парсер
 */
async function tryParser(parserHost, query) {
    const url = `${parserHost}${JACKETT_API_PATH}?apikey=&query=${encodeURIComponent(query)}&_=${Date.now()}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000); // 8сек таймаут
    
    try {
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeout);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        return data.Results || [];
    } catch (error) {
        clearTimeout(timeout);
        console.warn(`Парсер ${parserHost} не ответил:`, error.message);
        return null; // null = ошибка
    }
}

/**
 * Поиск торрентов с фолбеком по всем парсерам
 * @param {string} query
 * @param {function} onStatusUpdate - коллбэк для обновления статуса
 * @returns {Promise<{results: Array|null, usedParser: string|null}>}
 */
async function searchTorrents(query, onStatusUpdate) {
    // Сортируем: preferred парсер первым, остальные после
    const ordered = [userSettings.preferredParser, ...JACKETT_PARSERS.filter(p => p !== userSettings.preferredParser)];
    
    for (const parser of ordered) {
        if (onStatusUpdate) {
            const host = parser.replace('https://', '');
            onStatusUpdate(`<i class="fa-solid fa-spinner fa-spin"></i> Пробуем ${host}...`);
        }
        
        const results = await tryParser(parser, query);
        if (results !== null) {
            return { results, usedParser: parser };
        }
    }
    
    return { results: null, usedParser: null }; // Все парсеры отказали
}

/**
 * Форматирование размера файла
 */
function formatFileSize(bytes) {
    if (!bytes) return '?';
    const gb = bytes / (1024 * 1024 * 1024);
    if (gb >= 1) return gb.toFixed(2) + ' ГБ';
    const mb = bytes / (1024 * 1024);
    return mb.toFixed(0) + ' МБ';
}

/**
 * Открыть модалку с поиском торрентов
 */
async function openTorrentSearch(query) {
    const modal = document.getElementById('torrent-modal');
    const status = document.getElementById('torrent-status');
    const list = document.getElementById('torrent-list');
    const title = document.getElementById('torrent-modal-title');
    
    if (!modal) return;
    
    // Показать модалку в состоянии загрузки
    modal.classList.remove('hidden');
    title.textContent = query;
    status.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Ищем раздачи...';
    status.style.display = 'flex';
    list.innerHTML = '';
    
    // Поиск с фолбеком
    const { results, usedParser } = await searchTorrents(query, (html) => {
        status.innerHTML = html;
    });
    
    if (results === null) {
        status.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Ни один парсер не ответил. Проверьте интернет.';
        return;
    }
    
    if (results.length === 0) {
        status.innerHTML = '<i class="fa-solid fa-circle-info"></i> Раздачи не найдены.';
        return;
    }
    
    // Показываем, какой парсер ответил
    const parserName = usedParser ? usedParser.replace('https://', '') : '';
    status.innerHTML = `<i class="fa-solid fa-check"></i> Найдено ${results.length} раздач (${parserName})`;
    status.style.display = 'flex';
    
    // Сортируем по сидам
    results.sort((a, b) => (b.Seeders || 0) - (a.Seeders || 0));
    
    renderTorrentResults(results, list);
}

/**
 * Рендер списка торрентов
 */
function renderTorrentResults(results, container) {
    const fragment = document.createDocumentFragment();
    
    results.forEach(torrent => {
        const magnetUri = torrent.MagnetUri;
        if (!magnetUri) return; // Пропускаем если нет магнета
        
        const item = document.createElement('div');
        item.classList.add('torrent-item');
        item.tabIndex = 0;
        
        item.innerHTML = `
            <div class="torrent-item-info">
                <div class="torrent-item-title" title="${torrent.Title || ''}">${torrent.Title || 'Без названия'}</div>
                <div class="torrent-item-meta">
                    <span>${formatFileSize(torrent.Size)}</span>
                    <span class="seeds"><i class="fa-solid fa-arrow-up"></i> ${torrent.Seeders || 0}</span>
                    <span class="leeches"><i class="fa-solid fa-arrow-down"></i> ${torrent.Peers || 0}</span>
                </div>
            </div>
            <div class="torrent-item-play"><i class="fa-solid fa-play"></i></div>
        `;
        
        const play = () => playTorrent(magnetUri, torrent.Title);
        item.addEventListener('click', play);
        item.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') play();
        });
        
        fragment.appendChild(item);
    });
    
    container.appendChild(fragment);
}

/**
 * Воспроизведение торрента через TorrServer
 * Стратегия: HTML5 video → iframe fallback → внешний плеер
 */

// Текущий URL стрима (для кнопок «Внешний плеер» и «Копировать»)
let currentStreamUrl = '';

function playTorrent(magnetUri, title) {
    const host = userSettings.torrServerHost;
    const streamUrl = `${host}/stream/fname?link=${encodeURIComponent(magnetUri)}&index=0&play`;
    currentStreamUrl = streamUrl;
    
    const playerModal = document.getElementById('player-modal');
    const video = document.getElementById('video-player');
    const iframePlayer = document.getElementById('iframe-player');
    const playerTitle = document.getElementById('player-title');
    const playerLoading = document.getElementById('player-loading');
    
    if (!playerModal || !video) {
        window.open(streamUrl, '_blank');
        return;
    }
    
    // Сбрасываем состояние
    video.classList.remove('hidden');
    iframePlayer.classList.add('hidden');
    iframePlayer.src = '';
    
    playerModal.classList.remove('hidden');
    playerTitle.textContent = title || 'Воспроизведение';
    
    // Показываем загрузку
    if (playerLoading) {
        playerLoading.classList.remove('hidden');
        playerLoading.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i><span>Подключение к TorrServer...</span>';
    }
    
    video.src = streamUrl;

    // Когда видео начинает играть — формат поддерживается!
    video.onplaying = () => {
        if (playerLoading) playerLoading.classList.add('hidden');
    };
    
    // Получили метаданные — значит TorrServer ответил и формат поддерживается частично
    video.onloadedmetadata = () => {
        if (playerLoading) playerLoading.classList.add('hidden');
    };
    
    video.onerror = () => {
        const err = video.error;
        
        if (err && err.code === 4) {
            // MEDIA_ERR_SRC_NOT_SUPPORTED — формат не поддерживается браузером
            // Пробуем iframe (иногда работает для некоторых форматов)
            console.log('HTML5 video не поддерживает формат, пробуем iframe...');
            
            video.pause();
            video.removeAttribute('src');
            video.classList.add('hidden');
            
            // Показываем iframe с прямой ссылкой
            iframePlayer.classList.remove('hidden');
            iframePlayer.src = streamUrl;
            
            // Когда iframe загрузится — скрываем оверлей (видео уже играет за ним)
            iframePlayer.onload = () => {
                if (playerLoading) playerLoading.classList.add('hidden');
            };
            
            // Подстраховка: скрываем через 2 сек в любом случае
            setTimeout(() => {
                if (playerLoading) playerLoading.classList.add('hidden');
            }, 2000);
            
        } else {
            // Ошибка сети или TorrServer недоступен
            if (playerLoading) {
                playerLoading.innerHTML = `
                    <i class="fa-solid fa-triangle-exclamation"></i>
                    <span>Не удалось загрузить видео.<br>Проверьте, запущен ли TorrServer по адресу:<br><code style="color: var(--accent-blue)">${host}</code></span>
                    <div class="player-error-actions">
                        <button class="btn-secondary-action" onclick="window.open('${host}', '_blank')">
                            <i class="fa-solid fa-globe"></i> Открыть TorrServer
                        </button>
                    </div>
                `;
                playerLoading.classList.remove('hidden');
            }
        }
    };

    video.play().catch(() => {
        console.log('Autoplay заблокирован, ждём нажатия play');
    });
}

/**
 * Закрытие плеера (полный сброс)
 */
function closePlayer() {
    const playerModal = document.getElementById('player-modal');
    const video = document.getElementById('video-player');
    const iframePlayer = document.getElementById('iframe-player');
    const playerLoading = document.getElementById('player-loading');
    
    if (video) {
        video.pause();
        video.removeAttribute('src');
        video.load(); // сброс
        video.classList.remove('hidden');
    }
    if (iframePlayer) {
        iframePlayer.src = '';
        iframePlayer.classList.add('hidden');
    }
    if (playerLoading) {
        playerLoading.classList.add('hidden');
    }
    if (playerModal) {
        playerModal.classList.add('hidden');
    }
    
    currentStreamUrl = '';
}

/**
 * Инициализация обработчиков торрент-модалки и плеера
 */
function setupTorrentHandlers() {
    const btnCloseTorrents = document.getElementById('btn-close-torrents');
    const torrentModal = document.getElementById('torrent-modal');
    const btnClosePlayer = document.getElementById('btn-close-player');
    const btnPlayerExternal = document.getElementById('btn-player-external');
    const btnPlayerCopy = document.getElementById('btn-player-copy');
    
    if (btnCloseTorrents && torrentModal) {
        btnCloseTorrents.addEventListener('click', () => torrentModal.classList.add('hidden'));
    }
    
    if (btnClosePlayer) {
        btnClosePlayer.addEventListener('click', closePlayer);
    }
    
    // Кнопка «Внешний плеер»
    if (btnPlayerExternal) {
        btnPlayerExternal.addEventListener('click', () => {
            if (currentStreamUrl) {
                window.open(currentStreamUrl, '_blank');
            }
        });
    }
    
    // Кнопка «Копировать ссылку»
    if (btnPlayerCopy) {
        btnPlayerCopy.addEventListener('click', () => {
            if (currentStreamUrl) {
                navigator.clipboard.writeText(currentStreamUrl).then(() => {
                    const span = btnPlayerCopy.querySelector('span');
                    const originalText = span.textContent;
                    span.textContent = 'Скопировано!';
                    btnPlayerCopy.classList.add('copied');
                    setTimeout(() => {
                        span.textContent = originalText;
                        btnPlayerCopy.classList.remove('copied');
                    }, 2000);
                });
            }
        });
    }
    
    // Esc/Backspace для закрытия торрент-модалки и плеера
    document.addEventListener('keydown', (e) => {
        // Игнорируем, если фокус в инпуте
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

        const playerModal = document.getElementById('player-modal');
        if (e.key === 'Escape' || e.key === 'Backspace') {
            if (playerModal && !playerModal.classList.contains('hidden')) {
                e.preventDefault();
                closePlayer();
            } else if (torrentModal && !torrentModal.classList.contains('hidden')) {
                e.preventDefault();
                torrentModal.classList.add('hidden');
            }
        }
    });
}

/**
 * Глобальный перехват Backspace для предотвращения навигации назад в браузере
 */
function setupGlobalKeyHandlers() {
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace') {
            const target = e.target;
            // Разрешаем Backspace только в полях ввода
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
                return;
            }
            
            // Если мы не в инпуте, блокируем навигацию браузера
            e.preventDefault();
            
            // Если нет открытых модалок, можно реализовать какую-то логику "назад" 
            // (например, возвращение к предыдущей категории), но пока просто блокируем.
        }
    });
}

/**
 * Главная функция инициализации приложения
 */
function initApp() {
    initDomElements();
    setupTopNav();
    setupSettings();
    setupDetailsPageHandlers();
    setupTorrentHandlers();
    setupGlobalKeyHandlers();
    loadCategory('home'); // Загружаем микс по умолчанию
}

/**
 * Управление фокусом (Spatial Navigation) для ТВ пультов
 */
document.addEventListener('keydown', (e) => {
    const isInput = e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA';
    
    // Если мы в инпуте, разрешаем стандартное поведение для всех клавиш, 
    // кроме ArrowUp/ArrowDown (чтобы можно было выйти из инпутов вверх/вниз)
    if (isInput && !['ArrowUp', 'ArrowDown'].includes(e.key)) return;

    if (['Enter', 'Escape', 'Backspace'].includes(e.key)) return;

    const isDetailsOpen = !domElements.detailsPage.classList.contains('hidden');
    const container = isDetailsOpen ? domElements.detailsPage : document;
    
    // Включаем навигацию по кнопкам, карточкам и ИНПУТАМ
    const focusableElements = Array.from(container.querySelectorAll('button, .movie-card, .nav-item, .nav-btn, .settings-btn, input')).filter(el => {
        return el.offsetWidth > 0 && el.offsetHeight > 0;
    });

    const currentFocus = document.activeElement;
    
    // Если фокус где-то в неизвестном месте, ставим на первый доступный
    if (!focusableElements.includes(currentFocus)) {
        if (focusableElements.length > 0) focusableElements[0].focus();
        return;
    }

    const currentIndex = focusableElements.indexOf(currentFocus);
    let nextIndex = -1;
    const currentRect = currentFocus.getBoundingClientRect();

    if (e.key === 'ArrowRight') nextIndex = currentIndex + 1;
    else if (e.key === 'ArrowLeft') nextIndex = currentIndex - 1;
    else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        let bestDistance = Infinity;
        focusableElements.forEach((el, index) => {
            if (el === currentFocus) return;
            const rect = el.getBoundingClientRect();
            
            if (e.key === 'ArrowDown' && rect.top <= currentRect.bottom) return;
            if (e.key === 'ArrowUp' && rect.bottom >= currentRect.top) return;

            const dist = Math.sqrt(
                Math.pow((rect.left + rect.width / 2) - (currentRect.left + currentRect.width / 2), 2) +
                Math.pow((rect.top + rect.height / 2) - (currentRect.top + currentRect.height / 2), 2)
            );

            if (dist < bestDistance) {
                bestDistance = dist;
                nextIndex = index;
            }
        });
    }

    if (nextIndex >= 0 && nextIndex < focusableElements.length) {
        e.preventDefault();
        focusableElements[nextIndex].focus();
        focusableElements[nextIndex].scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'center'
        });
    }
});

// Запускаем инициализацию сразу после построения DOM дерева
document.addEventListener('DOMContentLoaded', initApp);

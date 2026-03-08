// РљРѕРЅС„РёРіСѓСЂР°С†РёСЏ API
const API_KEY = 'fd2c701686807e04fcfd87e3daa2da3b';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/';
const APP_SETTINGS_KEY = 'appSettings';
const WATCHLIST_STORAGE_KEY = 'watchlistItems';
const HISTORY_STORAGE_KEY = 'viewHistoryItems';
const USER_RATINGS_STORAGE_KEY = 'userRatings';

// Р‘Р°Р·РѕРІС‹Рµ РїР°СЂР°РјРµС‚СЂС‹: РєР»СЋС‡ API Рё СЂСѓСЃСЃРєРёР№ СЏР·С‹Рє
const DEFAULT_PARAMS = `?api_key=${API_KEY}&language=ru-RU`;

// РљСЌС€РёСЂРѕРІР°РЅРёРµ СЃСЃС‹Р»РѕРє РЅР° DOM СЌР»РµРјРµРЅС‚С‹, С‡С‚РѕР±С‹ РЅРµ РёСЃРєР°С‚СЊ РёС… РїСЂРё РєР°Р¶РґРѕРј СЂРµРЅРґРµСЂРµ
// DOM СЌР»РµРјРµРЅС‚С‹ РёРЅРёС†РёР°Р»РёР·РёСЂСѓСЋС‚СЃСЏ Р»РµРЅРёРІРѕ (РїРѕСЃР»Рµ DOMContentLoaded)
let domElements = {};

function initDomElements() {
    const homeSections = ['primary', 'secondary', 'tertiary', 'quaternary', 'quinary'].map((name) => ({
        key: name,
        section: document.getElementById(`section-${name}`),
        title: document.querySelector(`#section-${name} .carousel-title`),
        container: document.getElementById(`carousel-${name}`)
    }));

    domElements = {
        heroSection: document.getElementById('hero-section'),
        heroTitle: document.getElementById('hero-title'),
        heroOverview: document.getElementById('hero-overview'),
        heroBackdrop: document.getElementById('hero-backdrop'),
        heroBadge: document.getElementById('hero-badge'),
        heroQuality: document.getElementById('hero-quality'),
        heroType: document.getElementById('hero-type'),
        heroYear: document.getElementById('hero-year'),
        heroRating: document.getElementById('hero-rating'),
        homeSections,
        
        // Р­Р»РµРјРµРЅС‚С‹ СЃС‚СЂР°РЅРёС†С‹ С„РёР»СЊРјР°
        detailsPage: document.getElementById('details-page'),
        detailsBackdrop: document.getElementById('details-backdrop'),
        detailsPoster: document.getElementById('details-poster'),
        detailsTitle: document.getElementById('details-title'),
        detailsOriginalTitle: document.getElementById('details-original-title'),
        detailsRating: document.getElementById('details-rating'),
        detailsKpRating: document.getElementById('details-kp-rating'),
        detailsYear: document.getElementById('details-year'),
        detailsRuntime: document.getElementById('details-runtime'),
        detailsGenres: document.getElementById('details-genres'),
        detailsOverview: document.getElementById('details-overview'),
        detailsCast: document.getElementById('details-cast'),
        detailsUserRating: document.getElementById('details-user-rating'),
        detailsUserRatingActions: document.getElementById('details-user-rating-actions'),
        btnUserRatingClear: document.getElementById('btn-user-rating-clear'),
        detailsActions: document.querySelector('.details-actions'),
        btnWatch: document.getElementById('btn-watch'),
        btnWatchlist: document.getElementById('btn-watchlist'),
        btnBack: document.getElementById('btn-back'),
        similarContainer: document.getElementById('similar-movies'),
        jackettPage: document.getElementById('jackett-page'),
        btnBackJackett: document.getElementById('btn-back-jackett'),
        btnOpenJackett: document.getElementById('btn-open-jackett'),
        jackettStatus: document.getElementById('jackett-status'),
        jackettQueryInput: document.getElementById('input-jackett-query'),
        btnJackettTest: document.getElementById('btn-jackett-test'),
        btnJackettOpenSearch: document.getElementById('btn-jackett-open-search'),
        inputKinopoiskKey: document.getElementById('input-kinopoisk-key'),
        torrentFilterQuery: document.getElementById('torrent-filter-query'),
        torrentFilterQuality: document.getElementById('torrent-filter-quality'),
        torrentFilterSeeders: document.getElementById('torrent-filter-seeders'),
        torrentFilterSort: document.getElementById('torrent-filter-sort')
    };
}

// Р“Р»РѕР±Р°Р»СЊРЅРѕРµ СЃРѕСЃС‚РѕСЏРЅРёРµ РїСЂРёР»РѕР¶РµРЅРёСЏ
const appState = {
    currentView: 'home', // 'home', 'movie', 'tv'
    currentHeroItem: null,
    lastFocusedCard: null, // Р”Р»СЏ РІРѕР·РІСЂР°С‚Р° С„РѕРєСѓСЃР° РїРѕСЃР»Рµ Р·Р°РєСЂС‹С‚РёСЏ СЃС‚СЂР°РЅРёС†С‹ С„РёР»СЊРјР°
    lastActiveElement: null,
    tvMode: false,
    returnToSettingsFromJackett: false,
    torrentResults: [],
    currentDetailsItem: null
};

function loadAppSettings() {
    let saved = {};
    try {
        saved = JSON.parse(localStorage.getItem(APP_SETTINGS_KEY)) || {};
    } catch {
        saved = {};
    }

    const hasPlayerTarget = Object.prototype.hasOwnProperty.call(saved, 'playerTarget');

    return {
        imageQuality: saved.imageQuality || localStorage.getItem('imageQuality') || 'high',
        torrServerHost: saved.torrServerHost || localStorage.getItem('torrServerHost') || 'http://127.0.0.1:8090',
        preferredParser: saved.preferredParser || localStorage.getItem('preferredParser') || 'https://jac.red',
        kinopoiskApiKey: saved.kinopoiskApiKey || '',
        playerTarget: hasPlayerTarget ? saved.playerTarget : (isProbablyMediaStationXEnvironment() ? 'msx' : 'internal'),
        torrentFilterQuery: saved.torrentFilterQuery || '',
        torrentFilterQuality: saved.torrentFilterQuality || 'all',
        torrentFilterSeeders: saved.torrentFilterSeeders || '0',
        torrentFilterSort: saved.torrentFilterSort || 'seeders'
    };
}

const userSettings = loadAppSettings();

// РЎРїРёСЃРѕРє РїР°СЂСЃРµСЂРѕРІ Jackett СЃ С„РѕР»Р±РµРєРѕРј
const JACKETT_PARSERS = [
    'https://jac.red',
    'https://ru.jacred.pro',
    'https://jr.maxvol.pro'
];
const JACKETT_API_PATH = '/api/v2.0/indexers/all/results';
const TV_FOCUSABLE_SELECTOR = [
    'button:not([disabled])',
    '.movie-card',
    '.nav-item',
    '.nav-btn',
    '.settings-btn:not([disabled])',
    '.torrent-item',
    '.ext-item-remove',
    'input:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])'
].join(', ');

function isProbablyMediaStationXEnvironment() {
    const userAgent = navigator.userAgent || '';
    return /Media Station X|MediaStationX/i.test(userAgent) || window.location.search.includes('platform=msx');
}

function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (char) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    }[char]));
}

function showAppNotification(text) {
    if (window.Lampa && typeof Lampa.notify === 'function') {
        Lampa.notify(text);
        return;
    }

    console.log(text);
}

function persistUserSettings() {
    localStorage.setItem(APP_SETTINGS_KEY, JSON.stringify(userSettings));
    localStorage.setItem('imageQuality', userSettings.imageQuality);
    localStorage.setItem('torrServerHost', userSettings.torrServerHost);
    localStorage.setItem('preferredParser', userSettings.preferredParser);
}

function buildMsxPlayerUrl(streamUrl, title) {
    const url = new URL('msx-player.html', window.location.href);
    url.searchParams.set('src', streamUrl);
    if (title) {
        url.searchParams.set('title', title);
    }
    url.searchParams.set('return', window.location.href);
    return url.toString();
}

function openMsxPlayer(streamUrl, title, sameTab = false) {
    if (!streamUrl) return;

    const url = buildMsxPlayerUrl(streamUrl, title);
    if (sameTab) {
        window.location.assign(url);
        return;
    }

    window.open(url, '_blank');
}

function getUserRatings() {
    try {
        return JSON.parse(localStorage.getItem(USER_RATINGS_STORAGE_KEY)) || {};
    } catch {
        return {};
    }
}

function saveUserRatings(ratings) {
    localStorage.setItem(USER_RATINGS_STORAGE_KEY, JSON.stringify(ratings));
}

function isTextInputElement(element) {
    return !!element && (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA' || element.isContentEditable);
}

function rememberActiveElement() {
    const activeElement = document.activeElement;
    if (activeElement && activeElement !== document.body) {
        appState.lastActiveElement = activeElement;
    }
}

function clearTvFocus() {
    document.querySelectorAll('.tv-focused').forEach((element) => {
        element.classList.remove('tv-focused');
    });
}

function isElementVisible(element) {
    if (!element || !(element instanceof HTMLElement)) return false;
    if (element.classList.contains('hidden')) return false;
    if (element.closest('.hidden')) return false;

    const style = window.getComputedStyle(element);
    if (style.display === 'none' || style.visibility === 'hidden') return false;

    return element.offsetWidth > 0 || element.offsetHeight > 0 || element.getClientRects().length > 0;
}

function enableTvMode() {
    if (appState.tvMode) return;

    appState.tvMode = true;
    document.body.classList.add('tv-mode');
}

function disableTvMode() {
    appState.tvMode = false;
    document.body.classList.remove('tv-mode');
    clearTvFocus();
}

function scrollElementIntoView(element) {
    if (!element) return;

    const container = element.closest('.carousel-container, .torrent-list, .nav-links, .settings-content, .torrent-content, .details-page');
    if (container) {
        element.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
            inline: 'center'
        });
        return;
    }

    element.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest'
    });
}

function applyTvFocus(element, options = {}) {
    if (!element || !isElementVisible(element)) return;

    const { scroll = true } = options;
    clearTvFocus();
    element.classList.add('tv-focused');
    element.focus({ preventScroll: true });

    if (scroll) {
        scrollElementIntoView(element);
    }
}

function restorePreviousFocus(fallbackElement) {
    const candidate = fallbackElement || appState.lastFocusedCard || appState.lastActiveElement;
    if (candidate && document.contains(candidate) && isElementVisible(candidate)) {
        applyTvFocus(candidate, { scroll: false });
    }
}

function getNavigationRoot() {
    const playerModal = document.getElementById('player-modal');
    if (playerModal && !playerModal.classList.contains('hidden')) return playerModal;

    const torrentModal = document.getElementById('torrent-modal');
    if (torrentModal && !torrentModal.classList.contains('hidden')) return torrentModal;

    if (domElements.jackettPage && !domElements.jackettPage.classList.contains('hidden')) {
        return domElements.jackettPage;
    }

    const settingsModal = document.getElementById('settings-modal');
    if (settingsModal && !settingsModal.classList.contains('hidden')) return settingsModal;

    if (domElements.detailsPage && !domElements.detailsPage.classList.contains('hidden')) {
        return domElements.detailsPage;
    }

    return document;
}

function getFocusableElements(root = getNavigationRoot()) {
    return Array.from(root.querySelectorAll(TV_FOCUSABLE_SELECTOR)).filter((element) => {
        if (!isElementVisible(element)) return false;
        if (element.closest('[aria-hidden="true"]')) return false;
        return true;
    });
}

function getSiblingFocusGroup(element) {
    if (!element) return [];

    const containers = [
        '.hero-buttons',
        '.nav-links',
        '.nav-actions',
        '.details-actions',
        '.player-actions',
        '.settings-options',
        '.jackett-actions',
        '.torrent-filters',
        '.ext-add-row',
        '.torrent-header'
    ];

    for (const selector of containers) {
        const container = element.closest(selector);
        if (container) {
            return getFocusableElements(container);
        }
    }

    if (element.matches('.movie-card')) {
        const container = element.closest('.carousel-container');
        return container ? getFocusableElements(container).filter((item) => item.matches('.movie-card')) : [];
    }

    if (element.matches('.torrent-item')) {
        const container = element.closest('.torrent-list');
        return container ? getFocusableElements(container).filter((item) => item.matches('.torrent-item')) : [];
    }

    return [];
}

function moveWithinGroup(currentElement, direction) {
    const group = getSiblingFocusGroup(currentElement);
    if (group.length < 2) return null;

    const index = group.indexOf(currentElement);
    if (index === -1) return null;

    if (direction === 'left' && index > 0) return group[index - 1];
    if (direction === 'right' && index < group.length - 1) return group[index + 1];
    if (direction === 'up' && index > 0 && currentElement.matches('.settings-btn, .torrent-item')) return group[index - 1];
    if (direction === 'down' && index < group.length - 1 && currentElement.matches('.settings-btn, .torrent-item')) return group[index + 1];

    return null;
}

function getDirectionalScore(fromRect, toRect, direction) {
    const fromCenterX = fromRect.left + fromRect.width / 2;
    const fromCenterY = fromRect.top + fromRect.height / 2;
    const toCenterX = toRect.left + toRect.width / 2;
    const toCenterY = toRect.top + toRect.height / 2;
    const dx = toCenterX - fromCenterX;
    const dy = toCenterY - fromCenterY;

    if (direction === 'right' && dx <= 6) return Infinity;
    if (direction === 'left' && dx >= -6) return Infinity;
    if (direction === 'down' && dy <= 6) return Infinity;
    if (direction === 'up' && dy >= -6) return Infinity;

    const primary = direction === 'left' || direction === 'right' ? Math.abs(dx) : Math.abs(dy);
    const secondary = direction === 'left' || direction === 'right' ? Math.abs(dy) : Math.abs(dx);
    const distance = Math.sqrt(dx * dx + dy * dy);

    return primary + secondary * 2.5 + distance * 0.15;
}

function findNextFocusable(currentElement, direction, focusableElements) {
    const groupedTarget = moveWithinGroup(currentElement, direction);
    if (groupedTarget) return groupedTarget;

    const currentRect = currentElement.getBoundingClientRect();
    let bestCandidate = null;
    let bestScore = Infinity;

    focusableElements.forEach((candidate) => {
        if (candidate === currentElement) return;

        const score = getDirectionalScore(currentRect, candidate.getBoundingClientRect(), direction);
        if (score < bestScore) {
            bestScore = score;
            bestCandidate = candidate;
        }
    });

    return bestCandidate;
}

function getMediaType(item) {
    if (item.media_type === 'tv') return 'tv';
    if (item.media_type === 'movie') return 'movie';
    return item.name && !item.title ? 'tv' : 'movie';
}

function getFavoriteKey(item) {
    return `${getMediaType(item)}:${item.id}`;
}

function getUserRating(item) {
    const ratings = getUserRatings();
    return ratings[getFavoriteKey(item)] || null;
}

function setUserRating(item, rating) {
    const ratings = getUserRatings();
    const key = getFavoriteKey(item);

    if (rating == null) {
        delete ratings[key];
    } else {
        ratings[key] = {
            rating,
            updatedAt: Date.now()
        };
    }

    saveUserRatings(ratings);
}

function getWatchlist() {
    try {
        const current = JSON.parse(localStorage.getItem(WATCHLIST_STORAGE_KEY));
        if (Array.isArray(current)) return current;
        const migrated = JSON.parse(localStorage.getItem('favoriteItems')) || [];
        if (Array.isArray(migrated) && migrated.length) {
            localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(migrated));
            return migrated;
        }
        return [];
    } catch {
        return [];
    }
}

function saveWatchlist(items) {
    localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(items));
}

function getViewHistory() {
    try {
        return JSON.parse(localStorage.getItem(HISTORY_STORAGE_KEY)) || [];
    } catch {
        return [];
    }
}

function saveViewHistory(items) {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(items));
}

function isFavorite(item) {
    return getWatchlist().some((favorite) => favorite.key === getFavoriteKey(item));
}

function updateHeroFavoriteButton() {
    const btn = document.getElementById('btn-add-list-hero');
    const currentItem = appState.currentHeroItem;
    if (!btn) return;
    if (!currentItem) {
        btn.innerHTML = '<i class="fa-solid fa-plus"></i>';
        btn.setAttribute('aria-label', 'Добавить в «Буду смотреть»');
        btn.title = 'Добавить в «Буду смотреть»';
        return;
    }

    const favorite = isFavorite(currentItem);
    btn.innerHTML = favorite
        ? '<i class="fa-solid fa-check"></i>'
        : '<i class="fa-solid fa-plus"></i>';
    btn.setAttribute('aria-label', favorite ? 'Убрать из «Буду смотреть»' : 'Добавить в «Буду смотреть»');
    btn.title = favorite ? 'Убрать из «Буду смотреть»' : 'Добавить в «Буду смотреть»';
}

function updateDetailsWatchlistButton(item) {
    if (!domElements.btnWatchlist || !item) return;

    const favorite = isFavorite(item);
    domElements.btnWatchlist.innerHTML = favorite
        ? '<i class="fa-solid fa-check"></i> В списке'
        : '<i class="fa-solid fa-bookmark"></i> Буду смотреть';
    domElements.btnWatchlist.classList.toggle('active', favorite);
}

function toggleFavorite(item) {
    const favorites = getWatchlist();
    const itemKey = getFavoriteKey(item);
    const existingIndex = favorites.findIndex((favorite) => favorite.key === itemKey);

    if (existingIndex >= 0) {
        favorites.splice(existingIndex, 1);
        saveWatchlist(favorites);
        updateHeroFavoriteButton();
        showAppNotification('Удалено из списка «Буду смотреть»');
        if (['home', 'discover', 'watchlist'].includes(appState.currentView)) {
            loadCategory(appState.currentView);
        }
        return;
    }

    favorites.push({
        key: itemKey,
        id: item.id,
        type: getMediaType(item),
        title: item.title || item.name || 'Без названия',
        poster_path: item.poster_path || null,
        addedAt: Date.now()
    });
    saveWatchlist(favorites);
    updateHeroFavoriteButton();
    showAppNotification('Добавлено в «Буду смотреть»');
    if (['home', 'discover', 'watchlist'].includes(appState.currentView)) {
        loadCategory(appState.currentView);
    }
}

function addToViewHistory(item) {
    if (!item || !item.id) return;

    const history = getViewHistory();
    const entryKey = getFavoriteKey(item);
    const filtered = history.filter((entry) => entry.key !== entryKey);
    filtered.unshift({
        key: entryKey,
        id: item.id,
        type: getMediaType(item),
        title: item.title || item.name || 'Без названия',
        poster_path: item.poster_path || null,
        backdrop_path: item.backdrop_path || null,
        vote_average: item.vote_average || 0,
        release_date: item.release_date || item.first_air_date || '',
        overview: item.overview || '',
        watchedAt: Date.now()
    });

    saveViewHistory(filtered.slice(0, 48));
    if (['home', 'discover', 'history'].includes(appState.currentView)) {
        loadCategory(appState.currentView);
    }
}

function getHomeSection(index) {
    return domElements.homeSections[index] || null;
}

function setSectionContent(index, title, items) {
    const section = getHomeSection(index);
    if (!section || !section.title || !section.container) return;

    section.title.textContent = title;
    renderCarousel(items, section.container);
}

function normalizeStoredItem(item) {
    return {
        ...item,
        media_type: item.media_type || item.type || getMediaType(item)
    };
}

async function fetchRecommendationsForItems(items) {
    const seeds = items.slice(0, 3);
    const results = [];

    for (const item of seeds) {
        const type = getMediaType(item);
        try {
            const response = await fetch(`${BASE_URL}/${type}/${item.id}/recommendations${DEFAULT_PARAMS}`);
            if (!response.ok) continue;
            const data = await response.json();
            (data.results || []).forEach((result) => {
                const key = getFavoriteKey(result);
                if (!results.some((entry) => getFavoriteKey(entry) === key)) {
                    results.push({ ...result, media_type: type });
                }
            });
        } catch (error) {
            console.warn('Не удалось загрузить рекомендации:', error.message);
        }
    }

    return results.slice(0, 20);
}

/**
 * Р’РѕР·РІСЂР°С‰Р°РµС‚ РїСЂР°РІРёР»СЊРЅС‹Р№ СЂР°Р·РјРµСЂ РёР·РѕР±СЂР°Р¶РµРЅРёСЏ РґР»СЏ TMDB РЅР° РѕСЃРЅРѕРІРµ РЅР°СЃС‚СЂРѕРµРє РєР°С‡РµСЃС‚РІР°
 * @param {string} type 'poster' РёР»Рё 'backdrop'
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
 * Р‘Р°Р·РѕРІР°СЏ С„СѓРЅРєС†РёСЏ РґР»СЏ СЃРµС‚РµРІС‹С… Р·Р°РїСЂРѕСЃРѕРІ Рє TMDB
 * @param {string} endpoint - РџСѓС‚СЊ Рє API (РЅР°РїСЂРёРјРµСЂ, /movie/popular)
 * @returns {Promise<Array>} РњР°СЃСЃРёРІ С„РёР»СЊРјРѕРІ
 */
async function fetchMovies(endpoint) {
    try {
        const response = await fetch(`${BASE_URL}${endpoint}${DEFAULT_PARAMS}`);
        if (!response.ok) {
            throw new Error(`HTTP РѕС€РёР±РєР°: ${response.status}`);
        }
        const data = await response.json();
        return data.results;
    } catch (error) {
        console.error('РћС€РёР±РєР° Р·Р°РіСЂСѓР·РєРё РґР°РЅРЅС‹С…:', error);
        return [];
    }
}

function getLatestWatchlistItems(limit = 20) {
    return getWatchlist()
        .sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0))
        .slice(0, limit)
        .map(normalizeStoredItem);
}

function getLatestHistoryItems(limit = 20) {
    return getViewHistory()
        .sort((a, b) => (b.watchedAt || 0) - (a.watchedAt || 0))
        .slice(0, limit)
        .map(normalizeStoredItem);
}

async function buildSectionsForCategory(category) {
    const historyItems = getLatestHistoryItems();
    const watchlistItems = getLatestWatchlistItems();
    let recommendationSeed = historyItems.length ? historyItems : watchlistItems;
    let recommendations = recommendationSeed.length
        ? await fetchRecommendationsForItems(recommendationSeed)
        : await fetchMovies('/trending/movie/week');

    if (category === 'movies') {
        const [popular, topRated, nowPlaying, upcoming] = await Promise.all([
            fetchMovies('/movie/popular'),
            fetchMovies('/movie/top_rated'),
            fetchMovies('/movie/now_playing'),
            fetchMovies('/movie/upcoming')
        ]);
        return [
            { title: 'Популярные фильмы', items: popular },
            { title: 'Топ фильмов', items: topRated },
            { title: 'Сейчас в релизе', items: nowPlaying },
            { title: 'Скоро выйдут', items: upcoming },
            { title: 'Буду смотреть', items: watchlistItems }
        ];
    }

    if (category === 'tv') {
        const [popular, topRated, airingToday, onTheAir] = await Promise.all([
            fetchMovies('/tv/popular'),
            fetchMovies('/tv/top_rated'),
            fetchMovies('/tv/airing_today'),
            fetchMovies('/tv/on_the_air')
        ]);
        return [
            { title: 'Популярные сериалы', items: popular },
            { title: 'Топ сериалов', items: topRated },
            { title: 'Сегодня в эфире', items: airingToday },
            { title: 'Сейчас идут', items: onTheAir },
            { title: 'История просмотра', items: historyItems }
        ];
    }

    if (category === 'discover') {
        const [trendingMovies, trendingTv] = await Promise.all([
            fetchMovies('/trending/movie/week'),
            fetchMovies('/trending/tv/week')
        ]);
        return [
            { title: 'Рекомендации для вас', items: recommendations },
            { title: 'Фильмы недели', items: trendingMovies },
            { title: 'Сериалы недели', items: trendingTv },
            { title: 'История просмотра', items: historyItems },
            { title: 'Буду смотреть', items: watchlistItems }
        ];
    }

    if (category === 'history') {
        const [popular, recommendationsFromHistory] = await Promise.all([
            fetchMovies('/movie/popular'),
            historyItems.length ? fetchRecommendationsForItems(historyItems) : fetchMovies('/trending/movie/week')
        ]);
        return [
            { title: 'Вы уже смотрели', items: historyItems },
            { title: 'На основе истории', items: recommendationsFromHistory },
            { title: 'Фильмы, которые сейчас обсуждают', items: popular },
            { title: 'Продолжить исследовать', items: await fetchMovies('/tv/popular') },
            { title: 'Буду смотреть', items: watchlistItems }
        ];
    }

    if (category === 'watchlist') {
        const [popularMovies, popularTv, recommendationsFromWatchlist] = await Promise.all([
            fetchMovies('/movie/popular'),
            fetchMovies('/tv/popular'),
            watchlistItems.length ? fetchRecommendationsForItems(watchlistItems) : fetchMovies('/trending/movie/week')
        ]);
        return [
            { title: 'Буду смотреть', items: watchlistItems },
            { title: 'Рекомендации по списку', items: recommendationsFromWatchlist },
            { title: 'Популярные фильмы', items: popularMovies },
            { title: 'Популярные сериалы', items: popularTv },
            { title: 'История просмотра', items: historyItems }
        ];
    }

    const [trendingMovies, popularTv, nowPlaying, topRatedMovies] = await Promise.all([
        fetchMovies('/trending/movie/week'),
        fetchMovies('/tv/popular'),
        fetchMovies('/movie/now_playing'),
        fetchMovies('/movie/top_rated')
    ]);

    return [
        { title: 'В тренде сейчас', items: trendingMovies },
        { title: 'Популярные сериалы', items: popularTv },
        { title: 'Рекомендации для вас', items: recommendations },
        { title: 'История просмотра', items: historyItems.length ? historyItems : nowPlaying },
        { title: 'Буду смотреть', items: watchlistItems.length ? watchlistItems : topRatedMovies }
    ];
}

/**
 * РћС‚СЂРёСЃРѕРІРєР° РіР»Р°РІРЅРѕРіРѕ Р±Р°РЅРЅРµСЂР°
 * @param {Object} item - РћР±СЉРµРєС‚ С„РёР»СЊРјР° РёР»Рё СЃРµСЂРёР°Р»Р°
 */
function renderHero(item) {
    if (!item) return;

    appState.currentHeroItem = item;

    const title = item.title || item.name;
    const releaseDate = item.release_date || item.first_air_date || '';
    const year = releaseDate ? releaseDate.substring(0, 4) : 'Без даты';
    const rating = item.vote_average ? item.vote_average.toFixed(1) : 'NR';
    const kpRating = item.kpRating ? Number(item.kpRating).toFixed(1) : null;
    const userRating = getUserRating(item);
    const isTv = !!item.name && !item.title;
    const itemYear = parseInt(year, 10);
    const currentYear = new Date().getFullYear();
    const isFresh = Number.isFinite(itemYear) && itemYear >= currentYear - 1;

    domElements.heroTitle.textContent = title;
    domElements.heroOverview.textContent = item.overview || 'Описание пока отсутствует.';

    if (item.backdrop_path) {
        const backdropSize = getImageSize('backdrop');
        const imageUrl = `${IMAGE_BASE_URL}${backdropSize}${item.backdrop_path}`;
        domElements.heroBackdrop.style.backgroundImage = `url('${imageUrl}')`;
    } else {
        domElements.heroBackdrop.style.backgroundImage = 'none';
    }

    if (domElements.heroBadge) {
        domElements.heroBadge.textContent = isFresh ? 'Новинка' : 'Хит недели';
        domElements.heroBadge.classList.remove('hidden');
    }

    if (domElements.heroQuality) {
        domElements.heroQuality.textContent = isTv ? 'Сериал' : 'Фильм';
        domElements.heroQuality.style.opacity = '1';
    }

    if (domElements.heroType) {
        domElements.heroType.textContent = isTv ? 'Сериал' : 'Фильм';
    }

    if (domElements.heroYear) {
        domElements.heroYear.textContent = year;
    }

    if (domElements.heroRating) {
        const chunks = [];
        chunks.push(item.vote_average ? `<i class="fa-solid fa-star"></i> ${rating} TMDB` : 'TMDB NR');
        if (kpRating) chunks.push(`KP ${kpRating}`);
        if (userRating && userRating.rating) chunks.push(`Моя ${userRating.rating}/10`);
        domElements.heroRating.innerHTML = chunks.join(' · ');
    }

    updateHeroFavoriteButton();
}

function renderHeroPlaceholder(title, description) {
    appState.currentHeroItem = null;
    domElements.heroTitle.textContent = title;
    domElements.heroOverview.textContent = description;
    domElements.heroBackdrop.style.backgroundImage = 'none';
    domElements.heroBadge.classList.add('hidden');
    domElements.heroQuality.style.opacity = '0';
    domElements.heroType.textContent = 'Каталог';
    domElements.heroYear.textContent = '--';
    domElements.heroRating.textContent = 'TMDB NR';
    updateHeroFavoriteButton();
}

function updateDetailsUserRatingUI(item) {
    if (!domElements.detailsUserRatingActions || !domElements.detailsUserRating) return;

    const rating = item ? getUserRating(item) : null;
    domElements.detailsUserRating.textContent = rating ? `${rating.rating}/10` : 'Не оценено';

    domElements.detailsUserRatingActions.querySelectorAll('.btn-user-rating').forEach((button) => {
        const value = Number(button.dataset.rating);
        button.classList.toggle('active', !!rating && value === rating.rating);
    });
}

async function fetchKinopoiskRating(item) {
    if (!userSettings.kinopoiskApiKey) return null;

    const title = item.title || item.name || item.original_title || item.original_name;
    if (!title) return null;

    const year = Number((item.release_date || item.first_air_date || '').substring(0, 4)) || null;
    const endpoint = `https://kinopoiskapiunofficial.tech/api/v2.1/films/search-by-keyword?keyword=${encodeURIComponent(title)}&page=1`;

    try {
        const response = await fetch(endpoint, {
            headers: {
                'X-API-KEY': userSettings.kinopoiskApiKey,
                'Content-Type': 'application/json'
            }
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        const films = data.films || [];
        if (!films.length) return null;

        const normalizedTitle = title.toLowerCase();
        const bestMatch = films.find((film) => {
            const candidateYear = Number(String(film.year || '').substring(0, 4)) || null;
            const candidateTitle = String(film.nameRu || film.nameEn || film.nameOriginal || '').toLowerCase();
            const yearMatches = !year || !candidateYear || Math.abs(candidateYear - year) <= 1;
            const titleMatches = candidateTitle.includes(normalizedTitle) || normalizedTitle.includes(candidateTitle);
            return yearMatches && titleMatches;
        }) || films[0];

        return bestMatch.rating || bestMatch.ratingImdb || null;
    } catch (error) {
        console.warn('Не удалось получить рейтинг Кинопоиска:', error.message);
        return null;
    }
}

/**
 * РЎРѕР·РґР°РЅРёРµ РєР°СЂС‚РѕС‡РєРё С„РёР»СЊРјР° (Apple TV Style)
 * @param {Object} movie - РћР±СЉРµРєС‚ С„РёР»СЊРјР°
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
            <img src="${posterPath}" alt="${escapeHtml(title)}" class="movie-poster" loading="lazy">
        </div>
        <div class="card-info-below">
            <h3 class="card-title">${escapeHtml(title)}</h3>
            <div class="card-meta">
                <span class="rating"><i class="fa-solid fa-star"></i> ${movie.vote_average ? movie.vote_average.toFixed(1) : 'NR'}</span>
                <span>${escapeHtml(year)}</span>
            </div>
        </div>
    `;
    
    const selectMovie = () => {
        appState.lastFocusedCard = card;
        openDetailsPage(movie);
    };

    card.addEventListener('click', selectMovie);
    card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            appState.lastFocusedCard = card; // Р—Р°РїРѕРјРёРЅР°РµРј РѕС‚РєСѓРґР° РѕС‚РєСЂС‹Р»Рё
            selectMovie();
        }
    });

    // Р”РµР±Р°СѓРЅСЃ РґР»СЏ Р°РІС‚Рѕ-РѕР±РЅРѕРІР»РµРЅРёСЏ Hero РїСЂРё С„РѕРєСѓСЃРµ РїСѓР»СЊС‚РѕРј РёР»Рё РЅР°РІРµРґРµРЅРёРё РјС‹С€Рё
    const handleFocus = () => {
        // РќРµ РѕР±РЅРѕРІР»СЏРµРј Hero, РµСЃР»Рё РѕС‚РєСЂС‹С‚Р° СЃС‚СЂР°РЅРёС†Р° С„РёР»СЊРјР°
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
 * Р—Р°РїРѕР»РЅРµРЅРёРµ РєР°СЂСѓСЃРµР»Рё СЃРїРёСЃРєРѕРј С„РёР»СЊРјРѕРІ
 * @param {Array} movies - РњР°СЃСЃРёРІ С„РёР»СЊРјРѕРІ
 * @param {HTMLElement} container - DOM РєРѕРЅС‚РµР№РЅРµСЂ РєР°СЂСѓСЃРµР»Рё
 */
function renderCarousel(movies, container) {
    container.innerHTML = ''; // РћС‡РёСЃС‚РєР° РїРµСЂРµРґ РґРѕР±Р°РІР»РµРЅРёРµРј (РЅР° СЃР»СѓС‡Р°Р№ РѕР±РЅРѕРІР»РµРЅРёСЏ)
    if (!movies || !movies.length) {
        container.innerHTML = '<div class="carousel-empty">Ничего не найдено.</div>';
        return;
    }
    
    // РСЃРїРѕР»СЊР·СѓРµРј DocumentFragment РґР»СЏ РјРёРЅРёРјРёР·Р°С†РёРё РїРµСЂРµСЂРёСЃРѕРІРѕРє (reflow)
    const fragment = document.createDocumentFragment();
    
    movies.forEach(movie => {
        // Р”РѕР±Р°РІР»СЏРµРј С‚РѕР»СЊРєРѕ С„РёР»СЊРјС‹ СЃ РїРѕСЃС‚РµСЂР°РјРё, С‡С‚РѕР±С‹ РёР·Р±РµР¶Р°С‚СЊ РїСѓСЃС‚С‹С… РєР°СЂС‚РѕС‡РµРє
        if (movie.poster_path) {
            const card = createMovieCard(movie);
            fragment.appendChild(card);
        }
    });

    if (!fragment.childNodes.length) {
        container.innerHTML = '<div class="carousel-empty">Подходящих карточек не найдено.</div>';
        return;
    }

    container.appendChild(fragment);
}

function resetDetailsContent(item) {
    const title = item.title || item.name || 'Без названия';
    const releaseStr = item.release_date || item.first_air_date || '';
    const posterSize = getImageSize('poster');
    const backdropSize = getImageSize('backdrop');

    domElements.detailsTitle.textContent = title;
    domElements.detailsOriginalTitle.textContent = item.original_title || item.original_name || '';
    domElements.detailsRating.innerHTML = item.vote_average
        ? `<i class="fa-solid fa-star"></i> ${item.vote_average.toFixed(1)}`
        : 'NR';
    domElements.detailsYear.textContent = releaseStr ? releaseStr.substring(0, 4) : '----';
    domElements.detailsRuntime.textContent = '-- мин';
    domElements.detailsGenres.textContent = 'Нет данных';
    domElements.detailsOverview.textContent = item.overview || 'Описание пока отсутствует.';
    domElements.detailsCast.textContent = 'Нет данных';
    if (domElements.detailsKpRating) {
        domElements.detailsKpRating.textContent = userSettings.kinopoiskApiKey ? 'Загрузка...' : 'Нужен API key';
    }
    domElements.similarContainer.innerHTML = '';
    domElements.detailsPoster.alt = title;
    domElements.detailsPoster.src = item.poster_path
        ? `${IMAGE_BASE_URL}${posterSize}${item.poster_path}`
        : 'https://via.placeholder.com/320x480?text=No+Poster';
    domElements.detailsBackdrop.style.backgroundImage = item.backdrop_path
        ? `url('${IMAGE_BASE_URL}${backdropSize}${item.backdrop_path}')`
        : 'none';
    updateDetailsWatchlistButton(item);
    updateDetailsUserRatingUI(item);
}

function renderExtensionButtons(item) {
    if (!domElements.detailsActions) return;

    domElements.detailsActions
        .querySelectorAll('.btn-extension-action')
        .forEach((button) => button.remove());

    if (!window.Lampa || typeof Lampa.getCustomButtons !== 'function') {
        return;
    }

    Lampa.getCustomButtons().forEach((config) => {
        const button = document.createElement('button');
        button.className = 'btn btn-glass btn-extension-action';
        button.tabIndex = 0;
        button.type = 'button';

        if (config.icon) {
            button.innerHTML = `<i class="${escapeHtml(config.icon)}"></i> <span>${escapeHtml(config.label)}</span>`;
        } else {
            button.textContent = config.label;
        }

        button.addEventListener('click', () => {
            try {
                config.onClick(item);
            } catch (error) {
                console.error('[Extensions] Ошибка кнопки расширения:', error);
                showAppNotification('Кнопка расширения завершилась с ошибкой');
            }
        });

        domElements.detailsActions.appendChild(button);
    });
}

/**
 * РћС‚РєСЂС‹С‚РёРµ СЃС‚СЂР°РЅРёС†С‹ РґРµС‚Р°Р»РµР№ (SPA Overlay)
 */
async function openDetailsPage(item) {
    rememberActiveElement();
    appState.currentDetailsItem = item;

    // РџРѕРєР°Р·С‹РІР°РµРј РѕРІРµСЂР»РµР№
    domElements.detailsPage.classList.remove('hidden');
    document.body.style.overflow = 'hidden'; // Р—Р°РїСЂРµС‚ СЃРєСЂРѕР»Р»Р° РѕСЃРЅРѕРІРЅРѕР№ СЃС‚СЂР°РЅРёС†С‹
    
    // Р­РјРёС‚РёРј СЃРѕР±С‹С‚РёРµ РґР»СЏ СЂР°СЃС€РёСЂРµРЅРёР№
    if (window.Lampa) Lampa.emit('details:open', item);
    
    resetDetailsContent(item);
    renderExtensionButtons(item);
    
    // Р¤РѕРєСѓСЃ РЅР° РєРЅРѕРїРєСѓ "РЎРјРѕС‚СЂРµС‚СЊ" РґР»СЏ РўР’-РїСѓР»СЊС‚РѕРІ
    if (domElements.btnWatch) {
        // РћС‚РІСЏР·С‹РІР°РµРј СЃС‚Р°СЂС‹Р№ РѕР±СЂР°Р±РѕС‚С‡РёРє Рё СЃРѕР·РґР°С‘Рј РЅРѕРІС‹Р№ РґР»СЏ С‚РµРєСѓС‰РµРіРѕ С„РёР»СЊРјР°
        const newBtnWatch = domElements.btnWatch.cloneNode(true);
        domElements.btnWatch.replaceWith(newBtnWatch);
        domElements.btnWatch = newBtnWatch;
        
        newBtnWatch.addEventListener('click', () => {
            const query = (item.title || item.name);
            openTorrentSearch(query);
        });
        applyTvFocus(newBtnWatch, { scroll: false });
    }

    if (domElements.btnWatchlist) {
        const newBtnWatchlist = domElements.btnWatchlist.cloneNode(true);
        domElements.btnWatchlist.replaceWith(newBtnWatchlist);
        domElements.btnWatchlist = newBtnWatchlist;
        updateDetailsWatchlistButton(item);
        newBtnWatchlist.addEventListener('click', () => {
            toggleFavorite(item);
            updateDetailsWatchlistButton(item);
        });
    }

    if (domElements.detailsUserRatingActions) {
        domElements.detailsUserRatingActions.querySelectorAll('.btn-user-rating[data-rating]').forEach((button) => {
            const newButton = button.cloneNode(true);
            button.replaceWith(newButton);
            newButton.addEventListener('click', () => {
                setUserRating(item, Number(newButton.dataset.rating));
                updateDetailsUserRatingUI(item);
                renderHero(item);
                showAppNotification('Ваша оценка сохранена');
            });
        });
        const clearButton = document.getElementById('btn-user-rating-clear');
        if (clearButton) {
            const newClearButton = clearButton.cloneNode(true);
            clearButton.replaceWith(newClearButton);
            domElements.btnUserRatingClear = newClearButton;
            newClearButton.addEventListener('click', () => {
                setUserRating(item, null);
                updateDetailsUserRatingUI(item);
                renderHero(item);
                showAppNotification('Ваша оценка удалена');
            });
        }
        updateDetailsUserRatingUI(item);
    }

    // РћРїСЂРµРґРµР»СЏРµРј С‚РёРї РєРѕРЅС‚РµРЅС‚Р°
    const type = getMediaType(item);
    
    // Р—Р°РїСЂР°С€РёРІР°РµРј РїРѕР»РЅС‹Рµ РґР°РЅРЅС‹Рµ
    try {
        const response = await fetch(`${BASE_URL}/${type}/${item.id}${DEFAULT_PARAMS}&append_to_response=credits,similar`);
        if (!response.ok) {
            throw new Error(`HTTP ошибка: ${response.status}`);
        }
        const fullData = await response.json();
        
        // РћР±РЅРѕРІР»СЏРµРј UI РїРѕР»РЅС‹РјРё РґР°РЅРЅС‹РјРё
        domElements.detailsTitle.textContent = fullData.title || fullData.name || item.title || item.name || 'Без названия';
        domElements.detailsOriginalTitle.textContent = fullData.original_title || fullData.original_name || '';
        domElements.detailsRating.innerHTML = `<i class="fa-solid fa-star"></i> ${fullData.vote_average ? fullData.vote_average.toFixed(1) : 'NR'}`;
        
        const releaseStr = fullData.release_date || fullData.first_air_date;
        domElements.detailsYear.textContent = releaseStr ? releaseStr.substring(0, 4) : '';
        
        const runtime = fullData.runtime || (fullData.episode_run_time && fullData.episode_run_time[0]);
        domElements.detailsRuntime.textContent = runtime ? `${runtime} мин.` : '';
        domElements.detailsOverview.textContent = fullData.overview || item.overview || 'Описание пока отсутствует.';
        
        // Р–Р°РЅСЂС‹ (РєР°Рє РїСЂРѕСЃС‚РѕР№ СЃРїРёСЃРѕРє С‡РµСЂРµР· Р·Р°РїСЏС‚СѓСЋ)
        if (fullData.genres) {
            domElements.detailsGenres.textContent = fullData.genres.map(g => g.name).join(', ');
        } else {
            domElements.detailsGenres.textContent = 'Нет данных';
        }
        
        // РђРєС‚РµСЂС‹ (Р’ СЂРѕР»СЏС…)
        if (fullData.credits && fullData.credits.cast) {
            domElements.detailsCast.textContent = fullData.credits.cast.slice(0, 6).map(a => a.name).join(', ');
        } else {
            domElements.detailsCast.textContent = 'Нет данных';
        }
        
        // РџРѕС…РѕР¶РёРµ (СЂРµРЅРґРµСЂРёРј РІ РєР°СЂСѓСЃРµР»СЊ РІРЅСѓС‚СЂРё СЃС‚СЂР°РЅРёС†С‹ С„РёР»СЊРјР°)
        if (fullData.similar && fullData.similar.results) {
            renderCarousel(fullData.similar.results, domElements.similarContainer);
        } else {
            domElements.similarContainer.innerHTML = '<div class="carousel-empty">Похожие фильмы не найдены.</div>';
        }

        const kpRating = await fetchKinopoiskRating(fullData);
        if (domElements.detailsKpRating) {
            domElements.detailsKpRating.textContent = kpRating ? `${kpRating}` : (userSettings.kinopoiskApiKey ? 'Нет данных' : 'Нужен API key');
        }
        if (kpRating) {
            renderHero({ ...fullData, kpRating, media_type: type });
        }

    } catch (error) {
        console.error('РћС€РёР±РєР° Р·Р°РіСЂСѓР·РєРё РґРµС‚Р°Р»РµР№:', error);
    }
}

/**
 * Р—Р°РєСЂС‹С‚РёРµ СЃС‚СЂР°РЅРёС†С‹ РґРµС‚Р°Р»РµР№
 */
function closeDetailsPage() {
    domElements.detailsPage.classList.add('hidden');
    document.body.style.overflow = ''; // Р’РѕР·РІСЂР°С‰Р°РµРј СЃРєСЂРѕР»Р»
    appState.currentDetailsItem = null;
    
    // Р’РѕР·РІСЂР°С‰Р°РµРј С„РѕРєСѓСЃ РЅР° РєР°СЂС‚РѕС‡РєСѓ, СЃ РєРѕС‚РѕСЂРѕР№ РѕС‚РєСЂС‹Р»Рё, РµСЃР»Рё РѕРЅР° РµСЃС‚СЊ
    if (appState.lastFocusedCard) {
        restorePreviousFocus(appState.lastFocusedCard);
        appState.lastFocusedCard = null;
        appState.lastActiveElement = null;
        return;
    }

    restorePreviousFocus();
    appState.lastActiveElement = null;
}

// РћР±СЂР°Р±РѕС‚С‡РёРє Esc/Backspace РґР»СЏ Р·Р°РєСЂС‹С‚РёСЏ СЃС‚СЂР°РЅРёС†С‹ РґРµС‚Р°Р»РµР№
function setupDetailsPageHandlers() {
    if (domElements.btnBack) {
        domElements.btnBack.addEventListener('click', closeDetailsPage);
    }
    document.addEventListener('keydown', (e) => {
        if (!domElements.detailsPage.classList.contains('hidden')) {
            // РРіРЅРѕСЂРёСЂСѓРµРј, РµСЃР»Рё С„РѕРєСѓСЃ РІ РёРЅРїСѓС‚Рµ
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            if (e.key === 'Escape' || e.key === 'Backspace') {
                e.preventDefault();
                closeDetailsPage();
            }
        }
    });
}

/**
 * РћР±РЅРѕРІР»РµРЅРёРµ РіР»Р°РІРЅРѕР№ СЃС‚СЂР°РЅРёС†С‹ РІ Р·Р°РІРёСЃРёРјРѕСЃС‚Рё РѕС‚ РєР°С‚РµРіРѕСЂРёРё
 */
async function loadCategory(category) {
    appState.currentView = category;
    
    // Р­РјРёС‚РёРј СЃРѕР±С‹С‚РёРµ РґР»СЏ СЂР°СЃС€РёСЂРµРЅРёР№
    if (window.Lampa) Lampa.emit('category:change', category);

    const sections = await buildSectionsForCategory(category);
    const heroSource = sections.flatMap((section) => section.items || []).find(Boolean);
    if (heroSource) {
        renderHero(heroSource);
    } else {
        renderHeroPlaceholder('Пока пусто', 'Добавьте фильмы в «Буду смотреть» или начните смотреть что-нибудь, чтобы появились рекомендации и история.');
    }

    sections.forEach((section, index) => {
        setSectionContent(index, section.title, section.items || []);
    });
}

/**
 * РРЅРёС†РёР°Р»РёР·Р°С†РёСЏ РІРµСЂС…РЅРµРіРѕ РјРµРЅСЋ (Top Nav)
 */
function setupTopNav() {
    const navItems = document.querySelectorAll('.nav-item');
    
    navItems.forEach(item => {
        const handleClick = () => {
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
            appState.currentView = item.dataset.category || 'home';
            
            loadCategory(item.dataset.category || 'home');
        };

        item.addEventListener('click', handleClick);
        item.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') handleClick();
        });
    });
}

async function runSearch(query) {
    const normalizedQuery = query.trim();
    if (!normalizedQuery) return;
    appState.currentView = 'search';
    setSectionContent(0, `Результаты: ${normalizedQuery}`, []);
    setSectionContent(1, 'Сериалы и фильмы', []);
    setSectionContent(2, 'Рекомендации', []);
    setSectionContent(3, 'История просмотра', getLatestHistoryItems());
    setSectionContent(4, 'Буду смотреть', getLatestWatchlistItems());

    try {
        const response = await fetch(`${BASE_URL}/search/multi${DEFAULT_PARAMS}&query=${encodeURIComponent(normalizedQuery)}&include_adult=false`);
        if (!response.ok) {
            throw new Error(`HTTP ошибка: ${response.status}`);
        }

        const data = await response.json();
        const results = (data.results || []).filter((item) => item.media_type === 'movie' || item.media_type === 'tv');
        const movies = results.filter((item) => item.media_type === 'movie');
        const shows = results.filter((item) => item.media_type === 'tv');
        const primary = movies.length ? movies : results;
        const secondary = shows.length && movies.length ? shows : results.slice(primary.length);
        const recommendations = results[0]
            ? await fetchRecommendationsForItems([results[0]])
            : [];

        if (results.length > 0) {
            renderHero(results[0]);
        } else {
            renderHeroPlaceholder('Ничего не найдено', 'Попробуйте другой запрос или откройте рекомендации на главной странице.');
        }

        setSectionContent(0, `Результаты: ${normalizedQuery}`, primary);
        setSectionContent(1, 'Сериалы и фильмы', secondary);
        setSectionContent(2, 'Похожие рекомендации', recommendations);
        setSectionContent(3, 'История просмотра', getLatestHistoryItems());
        setSectionContent(4, 'Буду смотреть', getLatestWatchlistItems());
    } catch (error) {
        console.error('Ошибка поиска:', error);
        setSectionContent(0, `Результаты: ${normalizedQuery}`, []);
        setSectionContent(1, 'Ошибка поиска', []);
        setSectionContent(2, 'Попробуйте снова', []);
    }
}

function setupHeroActions() {
    const btnSearch = document.getElementById('btn-search');
    const btnWatchHero = document.getElementById('btn-watch-hero');
    const btnDetailsHero = document.getElementById('btn-details-hero');
    const btnAddListHero = document.getElementById('btn-add-list-hero');

    const bindAction = (element, action) => {
        if (!element) return;
        element.addEventListener('click', action);
    };

    const withHeroItem = (callback) => {
        if (!appState.currentHeroItem) {
            showAppNotification('Подборка ещё загружается');
            return;
        }

        callback(appState.currentHeroItem);
    };

    bindAction(btnSearch, async () => {
        const query = window.prompt('Введите название фильма или сериала');
        if (query && query.trim()) {
            await runSearch(query);
        }
    });

    bindAction(btnWatchHero, () => {
        withHeroItem((item) => openTorrentSearch(item.title || item.name || ''));
    });

    bindAction(btnDetailsHero, () => {
        withHeroItem((item) => openDetailsPage(item));
    });

    bindAction(btnAddListHero, () => {
        withHeroItem((item) => toggleFavorite(item));
    });
}

function syncParserButtonsState() {
    document.querySelectorAll('#jackett-parser-options .settings-btn').forEach((button) => {
        button.classList.toggle('active', button.dataset.parser === userSettings.preferredParser);
    });
}

function setJackettStatus(html) {
    if (!domElements.jackettStatus) return;
    domElements.jackettStatus.innerHTML = html;
}

function closeJackettPage() {
    if (!domElements.jackettPage) return;

    domElements.jackettPage.classList.add('hidden');

    if (appState.returnToSettingsFromJackett) {
        const settingsModal = document.getElementById('settings-modal');
        settingsModal.classList.remove('hidden');
        appState.returnToSettingsFromJackett = false;
        if (domElements.btnOpenJackett) {
            applyTvFocus(domElements.btnOpenJackett, { scroll: false });
        }
        return;
    }

    restorePreviousFocus();
    appState.lastActiveElement = null;
}

function openJackettPage(options = {}) {
    const { fromSettings = false } = options;
    if (!domElements.jackettPage) return;

    rememberActiveElement();
    appState.returnToSettingsFromJackett = fromSettings;

    if (fromSettings) {
        const settingsModal = document.getElementById('settings-modal');
        settingsModal.classList.add('hidden');
    }

    domElements.jackettPage.classList.remove('hidden');
    syncParserButtonsState();
    setJackettStatus('Выберите парсер и выполните тест поиска.');

    const firstActive = document.querySelector('#jackett-parser-options .settings-btn.active') || domElements.btnBackJackett;
    if (firstActive) {
        applyTvFocus(firstActive, { scroll: false });
    }
}

async function runJackettTestSearch() {
    if (!domElements.jackettQueryInput) return;

    const query = domElements.jackettQueryInput.value.trim();
    if (!query) {
        setJackettStatus('Введите название фильма или сериала для проверки.');
        applyTvFocus(domElements.jackettQueryInput, { scroll: false });
        return;
    }

    const selectedParser = userSettings.preferredParser.replace(/^https?:\/\//, '');
    setJackettStatus(`<i class="fa-solid fa-spinner fa-spin"></i> Проверяем ${escapeHtml(selectedParser)}...`);

    const results = await tryParser(userSettings.preferredParser, query);
    if (results === null) {
        setJackettStatus(`<strong>${escapeHtml(selectedParser)}</strong> не ответил. Проверьте сеть или попробуйте другой парсер.`);
        return;
    }

    if (!results.length) {
        setJackettStatus(`<strong>${escapeHtml(selectedParser)}</strong> ответил, но по запросу <strong>${escapeHtml(query)}</strong> ничего не найдено.`);
        return;
    }

    const topResult = results[0];
    setJackettStatus(`
        <strong>${escapeHtml(selectedParser)}</strong> ответил успешно.<br>
        Найдено раздач: <strong>${results.length}</strong><br>
        Лучшая по сиду: <strong>${escapeHtml(topResult.Title || 'Без названия')}</strong><br>
        Сиды: <strong>${topResult.Seeders || 0}</strong>
    `);
}

function setupJackettPage() {
    const parserBtns = document.querySelectorAll('#jackett-parser-options .settings-btn');
    if (!domElements.jackettPage || !domElements.btnOpenJackett) return;

    domElements.btnOpenJackett.addEventListener('click', () => openJackettPage({ fromSettings: true }));

    if (domElements.btnBackJackett) {
        domElements.btnBackJackett.addEventListener('click', closeJackettPage);
    }

    parserBtns.forEach((button) => {
        if (button.dataset.parser === userSettings.preferredParser) {
            button.classList.add('active');
        }

        button.addEventListener('click', () => {
            userSettings.preferredParser = button.dataset.parser;
            persistUserSettings();
            syncParserButtonsState();
            setJackettStatus(`Основной парсер изменён на <strong>${escapeHtml(button.dataset.parser.replace(/^https?:\/\//, ''))}</strong>.`);
        });
    });

    if (domElements.btnJackettTest) {
        domElements.btnJackettTest.addEventListener('click', runJackettTestSearch);
    }

    if (domElements.btnJackettOpenSearch) {
        domElements.btnJackettOpenSearch.addEventListener('click', () => {
            const query = domElements.jackettQueryInput ? domElements.jackettQueryInput.value.trim() : '';
            if (!query) {
                setJackettStatus('Введите запрос, чтобы открыть поиск раздач.');
                return;
            }
            openTorrentSearch(query);
        });
    }

    if (domElements.jackettQueryInput) {
        domElements.jackettQueryInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                runJackettTestSearch();
            }
        });
    }

    domElements.jackettPage.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' || e.key === 'Backspace') {
            if (isTextInputElement(e.target) && e.key === 'Backspace') return;
            e.preventDefault();
            closeJackettPage();
        }
    });
}

/**
 * РРЅРёС†РёР°Р»РёР·Р°С†РёСЏ РјРѕРґР°Р»РєРё РЅР°СЃС‚СЂРѕРµРє
 */
function setupSettings() {
    const btnSettings = document.getElementById('btn-settings');
    const settingsModal = document.getElementById('settings-modal');
    const btnCloseSettings = document.getElementById('btn-close-settings');
    const qualityBtns = document.querySelectorAll('#quality-options .settings-btn');
    const playerTargetBtns = document.querySelectorAll('#player-target-options .settings-btn');
    
    if (!btnSettings || !settingsModal) return;

    const syncPlayerTargetButtons = () => {
        playerTargetBtns.forEach((btn) => {
            if (btn.dataset.playerTarget === userSettings.playerTarget) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    };

    // РћС‚РєСЂС‹С‚СЊ РјРѕРґР°Р»РєСѓ
    const openSettings = () => {
        rememberActiveElement();
        settingsModal.classList.remove('hidden');
        // РћР±РЅРѕРІРёС‚СЊ Р°РєС‚РёРІРЅСѓСЋ РєРЅРѕРїРєСѓ
        qualityBtns.forEach(btn => {
            if (btn.dataset.quality === userSettings.imageQuality) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        syncPlayerTargetButtons();
        const activeBtn = settingsModal.querySelector('.settings-btn.active');
        if (activeBtn) applyTvFocus(activeBtn, { scroll: false });
    };

    btnSettings.addEventListener('click', openSettings);

    // Р—Р°РєСЂС‹С‚СЊ РјРѕРґР°Р»РєСѓ
    const closeSettings = () => {
        settingsModal.classList.add('hidden');
        restorePreviousFocus(btnSettings);
        appState.lastActiveElement = null;
    };

    btnCloseSettings.addEventListener('click', closeSettings);

    // Р’С‹Р±РѕСЂ РєР°С‡РµСЃС‚РІР°
    qualityBtns.forEach(btn => {
        const setQuality = () => {
            const quality = btn.dataset.quality;
            userSettings.imageQuality = quality;
            persistUserSettings();
            
            // Р’РёР·СѓР°Р»СЊРЅРѕ РѕР±РЅРѕРІРёС‚СЊ РєРЅРѕРїРєРё
            qualityBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // РџРµСЂРµР·Р°РіСЂСѓР·РёС‚СЊ С‚РµРєСѓС‰СѓСЋ РєР°С‚РµРіРѕСЂРёСЋ РґР»СЏ РїСЂРёРјРµРЅРµРЅРёСЏ РЅРѕРІС‹С… РєР°СЂС‚РёРЅРѕРє
            const activeNav = document.querySelector('.nav-item.active');
            if (activeNav) {
                loadCategory(activeNav.dataset.category || 'home');
            }
            
            setTimeout(closeSettings, 300); // РђРІС‚РѕР·Р°РєСЂС‹С‚РёРµ
        };

        btn.addEventListener('click', setQuality);
    });

    playerTargetBtns.forEach((btn) => {
        btn.addEventListener('click', () => {
            const nextTarget = btn.dataset.playerTarget || 'internal';
            if (userSettings.playerTarget === nextTarget) return;

            userSettings.playerTarget = nextTarget;
            persistUserSettings();
            syncPlayerTargetButtons();
            showAppNotification(nextTarget === 'msx'
                ? 'Потоки будут открываться в режиме Media Station X'
                : 'Потоки будут открываться во встроенном плеере');
        });
    });

    // РћР±СЂР°Р±РѕС‚РєР° РєР»Р°РІРёС€ РІ РјРѕРґР°Р»РєРµ (Esc/Backspace)
    settingsModal.addEventListener('keydown', (e) => {
        // РРіРЅРѕСЂРёСЂСѓРµРј, РµСЃР»Рё С„РѕРєСѓСЃ РІ РёРЅРїСѓС‚Рµ РїСЂРё РЅР°Р¶Р°С‚РёРё Backspace
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
                persistUserSettings();
            }
        });
    }

    if (domElements.inputKinopoiskKey) {
        domElements.inputKinopoiskKey.value = userSettings.kinopoiskApiKey;
        domElements.inputKinopoiskKey.addEventListener('change', () => {
            userSettings.kinopoiskApiKey = domElements.inputKinopoiskKey.value.trim();
            persistUserSettings();
        });
    }

}

/**
 * =========================================================================
 * РџРѕРёСЃРє С‚РѕСЂСЂРµРЅС‚РѕРІ С‡РµСЂРµР· Jackett (jac.red) Рё РІРѕСЃРїСЂРѕРёР·РІРµРґРµРЅРёРµ С‡РµСЂРµР· TorrServer
 * =========================================================================
 */

/**
 * РџРѕРёСЃРє С‚РѕСЂСЂРµРЅС‚РѕРІ С‡РµСЂРµР· РѕРґРёРЅ РїР°СЂСЃРµСЂ
 */
async function tryParser(parserHost, query) {
    const url = `${parserHost}${JACKETT_API_PATH}?apikey=&query=${encodeURIComponent(query)}&_=${Date.now()}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000); // 8СЃРµРє С‚Р°Р№РјР°СѓС‚
    
    try {
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeout);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        return data.Results || [];
    } catch (error) {
        clearTimeout(timeout);
        console.warn(`РџР°СЂСЃРµСЂ ${parserHost} РЅРµ РѕС‚РІРµС‚РёР»:`, error.message);
        return null; // null = РѕС€РёР±РєР°
    }
}

/**
 * РџРѕРёСЃРє С‚РѕСЂСЂРµРЅС‚РѕРІ СЃ С„РѕР»Р±РµРєРѕРј РїРѕ РІСЃРµРј РїР°СЂСЃРµСЂР°Рј
 * @param {string} query
 * @param {function} onStatusUpdate - РєРѕР»Р»Р±СЌРє РґР»СЏ РѕР±РЅРѕРІР»РµРЅРёСЏ СЃС‚Р°С‚СѓСЃР°
 * @returns {Promise<{results: Array|null, usedParser: string|null}>}
 */
async function searchTorrents(query, onStatusUpdate) {
    const builtInParsers = JACKETT_PARSERS.map((url) => ({
        key: url,
        name: url.replace(/^https?:\/\//, ''),
        search: (value) => tryParser(url, value)
    }));
    const customParsers = window.Lampa && typeof Lampa.getCustomParsers === 'function'
        ? Lampa.getCustomParsers().filter((parser) => parser && (parser.searchFn || parser.url)).map((parser, index) => ({
            key: parser.url || parser.name || `custom-${index}`,
            name: parser.name || (parser.url ? parser.url.replace(/^https?:\/\//, '') : `custom-${index}`),
            search: parser.searchFn
                ? async (value) => {
                    try {
                        const result = await parser.searchFn(value);
                        return Array.isArray(result) ? result : [];
                    } catch (error) {
                        console.warn(`Парсер ${parser.name || parser.url || index} не ответил:`, error.message);
                        return null;
                    }
                }
                : (value) => tryParser(parser.url, value)
        }))
        : [];
    const parsers = [...builtInParsers, ...customParsers].sort((a, b) => {
        if (a.key === userSettings.preferredParser) return -1;
        if (b.key === userSettings.preferredParser) return 1;
        return 0;
    });

    for (const parser of parsers) {
        if (onStatusUpdate) {
            onStatusUpdate(`<i class="fa-solid fa-spinner fa-spin"></i> Пробуем ${escapeHtml(parser.name)}...`);
        }
        
        const results = await parser.search(query);
        if (results !== null) {
            return { results, usedParser: parser.name };
        }
    }
    
    return { results: null, usedParser: null }; // Р’СЃРµ РїР°СЂСЃРµСЂС‹ РѕС‚РєР°Р·Р°Р»Рё
}

/**
 * Р¤РѕСЂРјР°С‚РёСЂРѕРІР°РЅРёРµ СЂР°Р·РјРµСЂР° С„Р°Р№Р»Р°
 */
function formatFileSize(bytes) {
    if (!bytes) return '?';
    const gb = bytes / (1024 * 1024 * 1024);
    if (gb >= 1) return gb.toFixed(2) + ' ГБ';
    const mb = bytes / (1024 * 1024);
    return mb.toFixed(0) + ' МБ';
}

function getTorrentQualityMarker(title) {
    const normalized = String(title || '').toLowerCase();
    if (/(2160|4k|uhd)/.test(normalized)) return '2160';
    if (/1080/.test(normalized)) return '1080';
    if (/720/.test(normalized)) return '720';
    return 'other';
}

function syncTorrentFilterInputs() {
    if (domElements.torrentFilterQuery) domElements.torrentFilterQuery.value = userSettings.torrentFilterQuery;
    if (domElements.torrentFilterQuality) domElements.torrentFilterQuality.value = userSettings.torrentFilterQuality;
    if (domElements.torrentFilterSeeders) domElements.torrentFilterSeeders.value = userSettings.torrentFilterSeeders;
    if (domElements.torrentFilterSort) domElements.torrentFilterSort.value = userSettings.torrentFilterSort;
}

function applyTorrentFilters() {
    const list = document.getElementById('torrent-list');
    const status = document.getElementById('torrent-status');
    if (!list || !status) return;

    const query = userSettings.torrentFilterQuery.trim().toLowerCase();
    const quality = userSettings.torrentFilterQuality;
    const minSeeders = Number(userSettings.torrentFilterSeeders || 0);
    const sort = userSettings.torrentFilterSort;

    let filtered = [...appState.torrentResults].filter((torrent) => {
        const matchesQuery = !query || String(torrent.Title || '').toLowerCase().includes(query);
        const matchesQuality = quality === 'all' || getTorrentQualityMarker(torrent.Title) === quality;
        const matchesSeeders = (torrent.Seeders || 0) >= minSeeders;
        return matchesQuery && matchesQuality && matchesSeeders;
    });

    if (sort === 'size_desc') {
        filtered.sort((a, b) => (b.Size || 0) - (a.Size || 0));
    } else if (sort === 'size_asc') {
        filtered.sort((a, b) => (a.Size || 0) - (b.Size || 0));
    } else if (sort === 'title') {
        filtered.sort((a, b) => String(a.Title || '').localeCompare(String(b.Title || ''), 'ru'));
    } else {
        filtered.sort((a, b) => (b.Seeders || 0) - (a.Seeders || 0));
    }

    if (!filtered.length) {
        list.innerHTML = '<div class="carousel-empty">Ничего не найдено по текущим фильтрам.</div>';
        status.innerHTML = `<i class="fa-solid fa-filter-circle-xmark"></i> Подходящих раздач нет. Сбросьте фильтры или измените запрос.`;
        return;
    }

    renderTorrentResults(filtered, list);
    status.innerHTML = `<i class="fa-solid fa-filter"></i> Показано ${filtered.length} из ${appState.torrentResults.length} раздач`;
    const firstTorrent = list.querySelector('.torrent-item');
    if (firstTorrent && appState.tvMode) {
        applyTvFocus(firstTorrent, { scroll: true });
    }
}

/**
 * РћС‚РєСЂС‹С‚СЊ РјРѕРґР°Р»РєСѓ СЃ РїРѕРёСЃРєРѕРј С‚РѕСЂСЂРµРЅС‚РѕРІ
 */
async function openTorrentSearch(query) {
    const modal = document.getElementById('torrent-modal');
    const status = document.getElementById('torrent-status');
    const list = document.getElementById('torrent-list');
    const title = document.getElementById('torrent-modal-title');
    const btnCloseTorrents = document.getElementById('btn-close-torrents');
    
    if (!modal) return;
    rememberActiveElement();
    
    // РџРѕРєР°Р·Р°С‚СЊ РјРѕРґР°Р»РєСѓ РІ СЃРѕСЃС‚РѕСЏРЅРёРё Р·Р°РіСЂСѓР·РєРё
    modal.classList.remove('hidden');
    title.textContent = query;
    status.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Ищем раздачи...';
    status.style.display = 'flex';
    list.innerHTML = '';
    syncTorrentFilterInputs();
    appState.torrentResults = [];
    if (btnCloseTorrents) {
        applyTvFocus(btnCloseTorrents, { scroll: false });
    }
    
    // РџРѕРёСЃРє СЃ С„РѕР»Р±РµРєРѕРј
    const { results, usedParser } = await searchTorrents(query, (html) => {
        status.innerHTML = html;
    });
    
    if (results === null) {
        status.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Ни один парсер не ответил. Проверьте интернет.';
        appState.torrentResults = [];
        return;
    }
    
    if (results.length === 0) {
        status.innerHTML = '<i class="fa-solid fa-circle-info"></i> Раздачи не найдены.';
        appState.torrentResults = [];
        return;
    }
    
    // РџРѕРєР°Р·С‹РІР°РµРј, РєР°РєРѕР№ РїР°СЂСЃРµСЂ РѕС‚РІРµС‚РёР»
    const parserName = usedParser ? usedParser.replace('https://', '') : '';
    status.innerHTML = `<i class="fa-solid fa-check"></i> Найдено ${results.length} раздач (${parserName})`;
    status.style.display = 'flex';
    
    appState.torrentResults = results;
    applyTorrentFilters();
}

/**
 * Р РµРЅРґРµСЂ СЃРїРёСЃРєР° С‚РѕСЂСЂРµРЅС‚РѕРІ
 */
function renderTorrentResults(results, container) {
    container.innerHTML = '';
    const fragment = document.createDocumentFragment();
    
    results.forEach(torrent => {
        const magnetUri = torrent.MagnetUri;
        if (!magnetUri) return; // РџСЂРѕРїСѓСЃРєР°РµРј РµСЃР»Рё РЅРµС‚ РјР°РіРЅРµС‚Р°
        
        const item = document.createElement('div');
        item.classList.add('torrent-item');
        item.tabIndex = 0;
        
        item.innerHTML = `
            <div class="torrent-item-info">
                <div class="torrent-item-title" title="${escapeHtml(torrent.Title || '')}">${escapeHtml(torrent.Title || 'Без названия')}</div>
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
        item.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') play();
        });
        
        fragment.appendChild(item);
    });
    
    container.appendChild(fragment);
}

/**
 * Р’РѕСЃРїСЂРѕРёР·РІРµРґРµРЅРёРµ С‚РѕСЂСЂРµРЅС‚Р° С‡РµСЂРµР· TorrServer
 * РЎС‚СЂР°С‚РµРіРёСЏ: HTML5 video в†’ iframe fallback в†’ РІРЅРµС€РЅРёР№ РїР»РµРµСЂ
 */

// РўРµРєСѓС‰РёР№ URL СЃС‚СЂРёРјР° (РґР»СЏ РєРЅРѕРїРѕРє В«Р’РЅРµС€РЅРёР№ РїР»РµРµСЂВ» Рё В«РљРѕРїРёСЂРѕРІР°С‚СЊВ»)
let currentStreamUrl = '';
let currentMagnetUri = '';
let currentPlayerTitle = '';
let currentPlayerHistoryItem = null;
let hasRecordedCurrentPlaybackHistory = false;
let playerMode = 'html5';
let playerChromeTimeout = null;

function clearPlayerChromeTimer() {
    if (playerChromeTimeout) {
        clearTimeout(playerChromeTimeout);
        playerChromeTimeout = null;
    }
}

function isPlayerLoadingVisible() {
    const { loading } = getPlayerElements();
    return !!loading && !loading.classList.contains('hidden');
}

function recordCurrentPlaybackHistory() {
    if (hasRecordedCurrentPlaybackHistory || !currentPlayerHistoryItem) return;
    addToViewHistory(currentPlayerHistoryItem);
    hasRecordedCurrentPlaybackHistory = true;
}

function showPlayerChrome(scheduleHide = true) {
    const { modal, video } = getPlayerElements();
    if (!modal) return;

    modal.classList.remove('player-chrome-hidden');
    clearPlayerChromeTimer();

    if (!scheduleHide || isPlayerLoadingVisible() || (video && video.paused && playerMode === 'html5')) {
        return;
    }

    playerChromeTimeout = setTimeout(() => {
        if (!isPlayerLoadingVisible()) {
            modal.classList.add('player-chrome-hidden');
        }
    }, 10000);
}

function formatPlaybackTime(seconds) {
    if (!Number.isFinite(seconds) || seconds < 0) return '--:--';
    const totalSeconds = Math.floor(seconds);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    if (hours > 0) {
        return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }

    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function getPlayerElements() {
    return {
        modal: document.getElementById('player-modal'),
        video: document.getElementById('video-player'),
        iframe: document.getElementById('iframe-player'),
        title: document.getElementById('player-title'),
        loading: document.getElementById('player-loading'),
        statusBadge: document.getElementById('player-status-badge'),
        statusText: document.getElementById('player-status-text'),
        metaTime: document.getElementById('player-meta-time'),
        metaVolume: document.getElementById('player-meta-volume'),
        metaMode: document.getElementById('player-meta-mode'),
        btnToggle: document.getElementById('btn-player-toggle'),
        btnMute: document.getElementById('btn-player-mute'),
        btnRestart: document.getElementById('btn-player-restart'),
        btnFullscreen: document.getElementById('btn-player-fullscreen'),
        btnExternal: document.getElementById('btn-player-external'),
        btnMsx: document.getElementById('btn-player-msx'),
        btnCopy: document.getElementById('btn-player-copy'),
        btnClose: document.getElementById('btn-close-player')
    };
}

function setPlayerStatus(badge, text) {
    const { statusBadge, statusText } = getPlayerElements();
    if (statusBadge) statusBadge.textContent = badge;
    if (statusText) statusText.textContent = text;
}

function updatePlayerMeta() {
    const { video, metaTime, metaVolume, metaMode } = getPlayerElements();

    if (metaTime && video) {
        metaTime.textContent = `${formatPlaybackTime(video.currentTime)} / ${formatPlaybackTime(video.duration)}`;
    }

    if (metaVolume && video) {
        const volumeText = video.muted ? 'Без звука' : `Громкость ${Math.round(video.volume * 100)}%`;
        metaVolume.textContent = volumeText;
    }

    if (metaMode) {
        metaMode.textContent = playerMode === 'iframe' ? 'Iframe fallback' : 'HTML5';
    }
}

function updatePlayerButtonsState() {
    const { video, btnToggle, btnMute, btnFullscreen } = getPlayerElements();
    if (!video) return;

    if (btnToggle) {
        const paused = video.paused;
        btnToggle.classList.toggle('active', !paused);
        btnToggle.innerHTML = paused
            ? '<i class="fa-solid fa-play"></i><span>Играть</span>'
            : '<i class="fa-solid fa-pause"></i><span>Пауза</span>';
        btnToggle.title = paused ? 'Воспроизвести' : 'Пауза';
    }

    if (btnMute) {
        const muted = video.muted || video.volume === 0;
        btnMute.classList.toggle('active', muted);
        btnMute.innerHTML = muted
            ? '<i class="fa-solid fa-volume-xmark"></i><span>Без звука</span>'
            : '<i class="fa-solid fa-volume-high"></i><span>Звук</span>';
    }

    if (btnFullscreen) {
        const fullscreenActive = !!document.fullscreenElement;
        btnFullscreen.classList.toggle('active', fullscreenActive);
        btnFullscreen.innerHTML = fullscreenActive
            ? '<i class="fa-solid fa-compress"></i><span>Окно</span>'
            : '<i class="fa-solid fa-expand"></i><span>Экран</span>';
    }

    updatePlayerMeta();
}

function restartCurrentStream() {
    if (!currentMagnetUri) return;
    playTorrent(currentMagnetUri, currentPlayerTitle);
}

function togglePlayerPlayback() {
    const { video } = getPlayerElements();
    if (!video || playerMode !== 'html5') return;

    if (video.paused) {
        video.play().catch(() => {
            showAppNotification('Не удалось продолжить воспроизведение');
        });
    } else {
        video.pause();
    }
}

function togglePlayerMute() {
    const { video } = getPlayerElements();
    if (!video) return;

    video.muted = !video.muted;
    updatePlayerButtonsState();
    setPlayerStatus('Звук', video.muted ? 'Звук выключен' : `Громкость ${Math.round(video.volume * 100)}%`);
}

async function togglePlayerFullscreen() {
    const { modal } = getPlayerElements();
    if (!modal) return;

    try {
        if (document.fullscreenElement) {
            await document.exitFullscreen();
        } else {
            await modal.requestFullscreen();
        }
    } catch {
        showAppNotification('Полный экран недоступен');
    } finally {
        updatePlayerButtonsState();
    }
}

function seekPlayer(seconds) {
    const { video } = getPlayerElements();
    if (!video || playerMode !== 'html5' || !Number.isFinite(video.duration)) return;

    video.currentTime = Math.max(0, Math.min(video.duration, video.currentTime + seconds));
    updatePlayerMeta();
    setPlayerStatus('Перемотка', `${seconds > 0 ? '+' : ''}${seconds} сек`);
}

function adjustPlayerVolume(delta) {
    const { video } = getPlayerElements();
    if (!video) return;

    video.muted = false;
    video.volume = Math.max(0, Math.min(1, video.volume + delta));
    updatePlayerButtonsState();
    setPlayerStatus('Громкость', `${Math.round(video.volume * 100)}%`);
}

function bindPlayerVideoEvents() {
    const { video, loading } = getPlayerElements();
    if (!video) return;

    video.onplaying = () => {
        if (loading) loading.classList.add('hidden');
        recordCurrentPlaybackHistory();
        setPlayerStatus('Воспроизведение', 'Поток запущен');
        updatePlayerButtonsState();
        showPlayerChrome();
    };

    video.onpause = () => {
        setPlayerStatus('Пауза', 'Воспроизведение остановлено');
        updatePlayerButtonsState();
        showPlayerChrome(false);
    };

    video.onloadedmetadata = () => {
        if (loading) loading.classList.add('hidden');
        setPlayerStatus('Готово', 'Метаданные потока загружены');
        updatePlayerButtonsState();
        showPlayerChrome();
    };

    video.ontimeupdate = updatePlayerMeta;
    video.onvolumechange = updatePlayerButtonsState;
    video.onwaiting = () => {
        setPlayerStatus('Буферизация', 'Подгружаем данные потока...');
        showPlayerChrome(false);
    };
    video.onended = () => {
        setPlayerStatus('Завершено', 'Воспроизведение завершено');
        updatePlayerButtonsState();
        showPlayerChrome(false);
    };
}

function playTorrent(magnetUri, title) {
    const host = userSettings.torrServerHost.replace(/\/+$/, '');
    const streamUrl = `${host}/stream/fname?link=${encodeURIComponent(magnetUri)}&index=0&play`;
    currentStreamUrl = streamUrl;
    currentMagnetUri = magnetUri;
    currentPlayerTitle = title || 'Воспроизведение';
    currentPlayerHistoryItem = appState.currentDetailsItem ? { ...appState.currentDetailsItem } : null;
    hasRecordedCurrentPlaybackHistory = false;
    playerMode = 'html5';

    if (userSettings.playerTarget === 'msx') {
        recordCurrentPlaybackHistory();
        openMsxPlayer(streamUrl, currentPlayerTitle, true);
        return;
    }

    rememberActiveElement();
    
    const {
        modal: playerModal,
        video,
        iframe: iframePlayer,
        title: playerTitle,
        loading: playerLoading,
        btnClose: btnClosePlayer
    } = getPlayerElements();
    
    if (!playerModal || !video) {
        recordCurrentPlaybackHistory();
        window.open(streamUrl, '_blank');
        return;
    }
    
    // РЎР±СЂР°СЃС‹РІР°РµРј СЃРѕСЃС‚РѕСЏРЅРёРµ
    video.classList.remove('hidden');
    iframePlayer.classList.add('hidden');
    iframePlayer.src = '';
    
    playerModal.classList.remove('hidden');
    playerModal.classList.remove('player-chrome-hidden');
    playerTitle.textContent = currentPlayerTitle;
    if (btnClosePlayer) {
        applyTvFocus(btnClosePlayer, { scroll: false });
    }
    
    // РџРѕРєР°Р·С‹РІР°РµРј Р·Р°РіСЂСѓР·РєСѓ
    if (playerLoading) {
        playerLoading.classList.remove('hidden');
        playerLoading.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i><span>Подключение к TorrServer...</span>';
    }
    setPlayerStatus('Подключение', 'Открываем поток TorrServer...');
    video.currentTime = 0;
    if (video.volume === 0) {
        video.volume = 1;
    }
    updatePlayerButtonsState();
    
    video.src = streamUrl;
    bindPlayerVideoEvents();
    showPlayerChrome(false);
    
    video.onerror = () => {
        const err = video.error;
        
        if (err && err.code === 4) {
            // MEDIA_ERR_SRC_NOT_SUPPORTED вЂ” С„РѕСЂРјР°С‚ РЅРµ РїРѕРґРґРµСЂР¶РёРІР°РµС‚СЃСЏ Р±СЂР°СѓР·РµСЂРѕРј
            // РџСЂРѕР±СѓРµРј iframe (РёРЅРѕРіРґР° СЂР°Р±РѕС‚Р°РµС‚ РґР»СЏ РЅРµРєРѕС‚РѕСЂС‹С… С„РѕСЂРјР°С‚РѕРІ)
            console.log('HTML5 video не поддерживает формат, пробуем iframe...');
            
            video.pause();
            video.removeAttribute('src');
            video.classList.add('hidden');
            playerMode = 'iframe';
            setPlayerStatus('Fallback', 'HTML5 не поддержал формат, включаем iframe');
            updatePlayerButtonsState();
            
            // РџРѕРєР°Р·С‹РІР°РµРј iframe СЃ РїСЂСЏРјРѕР№ СЃСЃС‹Р»РєРѕР№
            iframePlayer.classList.remove('hidden');
            iframePlayer.src = streamUrl;
            
            // РљРѕРіРґР° iframe Р·Р°РіСЂСѓР·РёС‚СЃСЏ вЂ” СЃРєСЂС‹РІР°РµРј РѕРІРµСЂР»РµР№ (РІРёРґРµРѕ СѓР¶Рµ РёРіСЂР°РµС‚ Р·Р° РЅРёРј)
            iframePlayer.onload = () => {
                if (playerLoading) playerLoading.classList.add('hidden');
                recordCurrentPlaybackHistory();
                setPlayerStatus('Iframe', 'Поток открыт через встроенную страницу TorrServer');
                showPlayerChrome();
            };
            
            // РџРѕРґСЃС‚СЂР°С…РѕРІРєР°: СЃРєСЂС‹РІР°РµРј С‡РµСЂРµР· 2 СЃРµРє РІ Р»СЋР±РѕРј СЃР»СѓС‡Р°Рµ
            setTimeout(() => {
                if (playerLoading) playerLoading.classList.add('hidden');
            }, 2000);
            
        } else {
            // РћС€РёР±РєР° СЃРµС‚Рё РёР»Рё TorrServer РЅРµРґРѕСЃС‚СѓРїРµРЅ
            if (playerLoading) {
                playerLoading.innerHTML = `
                    <i class="fa-solid fa-triangle-exclamation"></i>
                    <span>Не удалось загрузить видео.<br>Проверьте, запущен ли TorrServer по адресу:<br><code style="color: var(--accent-red)">${escapeHtml(host)}</code></span>
                    <div class="player-error-actions">
                        <button class="btn-secondary-action" data-open-host="${escapeHtml(host)}">
                            <i class="fa-solid fa-globe"></i> Открыть TorrServer
                        </button>
                    </div>
                `;
                playerLoading.classList.remove('hidden');
                const openHostButton = playerLoading.querySelector('[data-open-host]');
                if (openHostButton) {
                    openHostButton.addEventListener('click', () => window.open(host, '_blank'));
                }
            }
            setPlayerStatus('Ошибка', 'Поток не удалось открыть');
            showPlayerChrome(false);
        }
    };

    video.play().catch(() => {
        console.log('Autoplay заблокирован, ждём нажатия play');
        setPlayerStatus('Ожидание', 'Нажмите Play или OK для запуска');
        updatePlayerButtonsState();
        showPlayerChrome();
    });
}

/**
 * Р—Р°РєСЂС‹С‚РёРµ РїР»РµРµСЂР° (РїРѕР»РЅС‹Р№ СЃР±СЂРѕСЃ)
 */
function closePlayer() {
    const { modal: playerModal, video, iframe: iframePlayer, loading: playerLoading } = getPlayerElements();
    
    if (video) {
        video.onplaying = null;
        video.onpause = null;
        video.onloadedmetadata = null;
        video.ontimeupdate = null;
        video.onvolumechange = null;
        video.onwaiting = null;
        video.onended = null;
        video.onerror = null;
        video.pause();
        video.removeAttribute('src');
        video.load(); // СЃР±СЂРѕСЃ
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
        playerModal.classList.remove('player-chrome-hidden');
        playerModal.classList.add('hidden');
    }
    if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
    }
    
    currentStreamUrl = '';
    currentMagnetUri = '';
    currentPlayerTitle = '';
    currentPlayerHistoryItem = null;
    hasRecordedCurrentPlaybackHistory = false;
    playerMode = 'html5';
    clearPlayerChromeTimer();
    setPlayerStatus('Подключение', 'Ожидание потока...');
    updatePlayerMeta();
    updatePlayerButtonsState();
    restorePreviousFocus();
    appState.lastActiveElement = null;
}

/**
 * РРЅРёС†РёР°Р»РёР·Р°С†РёСЏ РѕР±СЂР°Р±РѕС‚С‡РёРєРѕРІ С‚РѕСЂСЂРµРЅС‚-РјРѕРґР°Р»РєРё Рё РїР»РµРµСЂР°
 */
function setupTorrentHandlers() {
    const btnCloseTorrents = document.getElementById('btn-close-torrents');
    const torrentModal = document.getElementById('torrent-modal');
    const btnClosePlayer = document.getElementById('btn-close-player');
    const btnPlayerToggle = document.getElementById('btn-player-toggle');
    const btnPlayerMute = document.getElementById('btn-player-mute');
    const btnPlayerRestart = document.getElementById('btn-player-restart');
    const btnPlayerFullscreen = document.getElementById('btn-player-fullscreen');
    const btnPlayerExternal = document.getElementById('btn-player-external');
    const btnPlayerMsx = document.getElementById('btn-player-msx');
    const btnPlayerCopy = document.getElementById('btn-player-copy');
    const torrentFilterBindings = [
        { element: domElements.torrentFilterQuery, key: 'torrentFilterQuery', event: 'input' },
        { element: domElements.torrentFilterQuality, key: 'torrentFilterQuality', event: 'change' },
        { element: domElements.torrentFilterSeeders, key: 'torrentFilterSeeders', event: 'change' },
        { element: domElements.torrentFilterSort, key: 'torrentFilterSort', event: 'change' }
    ];
    
    if (btnCloseTorrents && torrentModal) {
        btnCloseTorrents.addEventListener('click', () => {
            torrentModal.classList.add('hidden');
            restorePreviousFocus();
            appState.lastActiveElement = null;
        });
    }

    torrentFilterBindings.forEach(({ element, key, event }) => {
        if (!element) return;
        element.value = userSettings[key];
        element.addEventListener(event, () => {
            userSettings[key] = element.value;
            persistUserSettings();
            applyTorrentFilters();
        });
    });
    
    if (btnClosePlayer) {
        btnClosePlayer.addEventListener('click', closePlayer);
    }

    if (btnPlayerToggle) {
        btnPlayerToggle.addEventListener('click', togglePlayerPlayback);
    }

    if (btnPlayerMute) {
        btnPlayerMute.addEventListener('click', togglePlayerMute);
    }

    if (btnPlayerRestart) {
        btnPlayerRestart.addEventListener('click', restartCurrentStream);
    }

    if (btnPlayerFullscreen) {
        btnPlayerFullscreen.addEventListener('click', togglePlayerFullscreen);
    }
    
    // РљРЅРѕРїРєР° В«Р’РЅРµС€РЅРёР№ РїР»РµРµСЂВ»
    if (btnPlayerExternal) {
        btnPlayerExternal.addEventListener('click', () => {
            if (currentStreamUrl) {
                window.open(currentStreamUrl, '_blank');
            }
        });
    }

    if (btnPlayerMsx) {
        btnPlayerMsx.addEventListener('click', () => {
            if (currentStreamUrl) {
                recordCurrentPlaybackHistory();
                openMsxPlayer(currentStreamUrl, currentPlayerTitle);
            }
        });
    }
    
    // РљРЅРѕРїРєР° В«РљРѕРїРёСЂРѕРІР°С‚СЊ СЃСЃС‹Р»РєСѓВ»
    if (btnPlayerCopy) {
        btnPlayerCopy.addEventListener('click', () => {
            if (currentStreamUrl) {
                const completeCopy = () => {
                    const span = btnPlayerCopy.querySelector('span');
                    const originalText = span.textContent;
                    span.textContent = 'Скопировано!';
                    btnPlayerCopy.classList.add('copied');
                    setTimeout(() => {
                        span.textContent = originalText;
                        btnPlayerCopy.classList.remove('copied');
                    }, 2000);
                };

                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(currentStreamUrl).then(completeCopy).catch(() => {
                        showAppNotification('Не удалось скопировать ссылку');
                    });
                    return;
                }

                const helperInput = document.createElement('textarea');
                helperInput.value = currentStreamUrl;
                helperInput.setAttribute('readonly', '');
                helperInput.style.position = 'absolute';
                helperInput.style.left = '-9999px';
                document.body.appendChild(helperInput);
                helperInput.select();

                try {
                    document.execCommand('copy');
                    completeCopy();
                } catch {
                    showAppNotification('Не удалось скопировать ссылку');
                } finally {
                    helperInput.remove();
                }
            }
        });
    }
    
    // Esc/Backspace РґР»СЏ Р·Р°РєСЂС‹С‚РёСЏ С‚РѕСЂСЂРµРЅС‚-РјРѕРґР°Р»РєРё Рё РїР»РµРµСЂР°
    document.addEventListener('keydown', (e) => {
        // РРіРЅРѕСЂРёСЂСѓРµРј, РµСЃР»Рё С„РѕРєСѓСЃ РІ РёРЅРїСѓС‚Рµ
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

        const playerModal = document.getElementById('player-modal');
        if (e.key === 'Escape' || e.key === 'Backspace') {
            if (playerModal && !playerModal.classList.contains('hidden')) {
                e.preventDefault();
                closePlayer();
            } else if (torrentModal && !torrentModal.classList.contains('hidden')) {
                e.preventDefault();
                torrentModal.classList.add('hidden');
                restorePreviousFocus();
                appState.lastActiveElement = null;
            }
        }
    });

    document.addEventListener('keydown', (e) => {
        const playerModal = document.getElementById('player-modal');
        if (!playerModal || playerModal.classList.contains('hidden')) return;

        if (['Space', ' '].includes(e.key)) {
            e.preventDefault();
            togglePlayerPlayback();
            return;
        }

        if (e.key.toLowerCase() === 'm') {
            e.preventDefault();
            togglePlayerMute();
            return;
        }

        if (e.key.toLowerCase() === 'f') {
            e.preventDefault();
            togglePlayerFullscreen();
            return;
        }

        if (e.key.toLowerCase() === 'r') {
            e.preventDefault();
            restartCurrentStream();
            return;
        }

        if (e.key === 'ArrowLeft') {
            e.preventDefault();
            seekPlayer(-10);
            return;
        }

        if (e.key === 'ArrowRight') {
            e.preventDefault();
            seekPlayer(10);
            return;
        }

        if (e.key === 'ArrowUp') {
            e.preventDefault();
            adjustPlayerVolume(0.05);
            return;
        }

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            adjustPlayerVolume(-0.05);
        }
    });

    document.addEventListener('fullscreenchange', updatePlayerButtonsState);

    ['mousemove', 'mousedown', 'touchstart'].forEach((eventName) => {
        document.addEventListener(eventName, (e) => {
            const playerModal = document.getElementById('player-modal');
            if (!playerModal || playerModal.classList.contains('hidden')) return;
            if (!playerModal.contains(e.target)) return;

            showPlayerChrome();
        }, { passive: true });
    });

    document.addEventListener('keydown', () => {
        const playerModal = document.getElementById('player-modal');
        if (!playerModal || playerModal.classList.contains('hidden')) return;

        showPlayerChrome();
    });
}

/**
 * Р“Р»РѕР±Р°Р»СЊРЅС‹Р№ РїРµСЂРµС…РІР°С‚ Backspace РґР»СЏ РїСЂРµРґРѕС‚РІСЂР°С‰РµРЅРёСЏ РЅР°РІРёРіР°С†РёРё РЅР°Р·Р°Рґ РІ Р±СЂР°СѓР·РµСЂРµ
 */
function setupGlobalKeyHandlers() {
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace') {
            const target = e.target;
            // Р Р°Р·СЂРµС€Р°РµРј Backspace С‚РѕР»СЊРєРѕ РІ РїРѕР»СЏС… РІРІРѕРґР°
            if (isTextInputElement(target)) {
                return;
            }
            
            // Р•СЃР»Рё РјС‹ РЅРµ РІ РёРЅРїСѓС‚Рµ, Р±Р»РѕРєРёСЂСѓРµРј РЅР°РІРёРіР°С†РёСЋ Р±СЂР°СѓР·РµСЂР°
            e.preventDefault();
            
            // Р•СЃР»Рё РЅРµС‚ РѕС‚РєСЂС‹С‚С‹С… РјРѕРґР°Р»РѕРє, РјРѕР¶РЅРѕ СЂРµР°Р»РёР·РѕРІР°С‚СЊ РєР°РєСѓСЋ-С‚Рѕ Р»РѕРіРёРєСѓ "РЅР°Р·Р°Рґ" 
            // (РЅР°РїСЂРёРјРµСЂ, РІРѕР·РІСЂР°С‰РµРЅРёРµ Рє РїСЂРµРґС‹РґСѓС‰РµР№ РєР°С‚РµРіРѕСЂРёРё), РЅРѕ РїРѕРєР° РїСЂРѕСЃС‚Рѕ Р±Р»РѕРєРёСЂСѓРµРј.
        }
    });
}

function setupSpatialNavigation() {
    document.addEventListener('pointerdown', () => {
        disableTvMode();
    });

    document.addEventListener('focusin', (e) => {
        const target = e.target;
        if (!(target instanceof HTMLElement)) return;
        if (!appState.tvMode) return;
        if (!target.matches(TV_FOCUSABLE_SELECTOR)) return;

        clearTvFocus();
        target.classList.add('tv-focused');
    });

    document.addEventListener('keydown', (e) => {
        const directionMap = {
            ArrowRight: 'right',
            ArrowLeft: 'left',
            ArrowDown: 'down',
            ArrowUp: 'up'
        };

        const direction = directionMap[e.key];
        if (!direction) return;

        enableTvMode();

        if (isTextInputElement(e.target)) {
            if (direction === 'left' || direction === 'right') return;
        }

        const root = getNavigationRoot();
        const focusableElements = getFocusableElements(root);
        if (!focusableElements.length) return;

        const currentElement = document.activeElement instanceof HTMLElement && focusableElements.includes(document.activeElement)
            ? document.activeElement
            : null;

        if (!currentElement) {
            e.preventDefault();
            applyTvFocus(focusableElements[0]);
            return;
        }

        const nextElement = findNextFocusable(currentElement, direction, focusableElements);
        if (!nextElement) return;

        e.preventDefault();
        applyTvFocus(nextElement);
    });

    document.addEventListener('keydown', (e) => {
        if (e.key !== ' ') return;

        if (!(document.activeElement instanceof HTMLElement)) return;
        if (!document.activeElement.matches('.movie-card, .torrent-item, .nav-item')) return;

        enableTvMode();
        e.preventDefault();
        document.activeElement.click();
    });
}

/**
 * =========================================================================
 * РЈРїСЂР°РІР»РµРЅРёРµ СЂР°СЃС€РёСЂРµРЅРёСЏРјРё РІ РЅР°СЃС‚СЂРѕР№РєР°С…
 * =========================================================================
 */
function setupExtensions() {
    const extList = document.getElementById('ext-list');
    const inputUrl = document.getElementById('input-ext-url');
    const btnAdd = document.getElementById('btn-ext-add');
    
    if (!extList || !inputUrl || !btnAdd) return;
    
    // Р РµРЅРґРµСЂ СЃРїРёСЃРєР° СЂР°СЃС€РёСЂРµРЅРёР№
    function renderExtList() {
        const extensions = Lampa.list();
        
        if (extensions.length === 0) {
            extList.innerHTML = '<div class="ext-empty"><i class="fa-solid fa-puzzle-piece"></i> Нет установленных расширений</div>';
            return;
        }
        
        extList.innerHTML = '';
        extensions.forEach(ext => {
            const item = document.createElement('div');
            item.className = 'ext-item';
            item.innerHTML = `
                <div class="ext-item-icon"><i class="fa-solid fa-puzzle-piece"></i></div>
                <div class="ext-item-info">
                    <div class="ext-item-name">${ext.name}</div>
                    <div class="ext-item-url" title="${ext.url}">${ext.url}</div>
                </div>
                <div class="ext-item-status ${ext.status || 'ok'}" title="${ext.status === 'error' ? 'Ошибка загрузки' : 'Активно'}"></div>
                <button class="ext-item-remove" title="Удалить" data-url="${ext.url}">
                    <i class="fa-solid fa-trash"></i>
                </button>
            `;
            
            item.querySelector('.ext-item-remove').addEventListener('click', () => {
                Lampa.remove(ext.url);
                Lampa.notify('Расширение удалено. Перезагрузите страницу.');
                renderExtList();
            });
            
            extList.appendChild(item);
        });
    }
    
    // РљРЅРѕРїРєР° "Р”РѕР±Р°РІРёС‚СЊ"
    btnAdd.addEventListener('click', async () => {
        const url = inputUrl.value.trim();
        if (!url) {
            Lampa.notify('Введите URL расширения');
            return;
        }
        
        if (!url.startsWith('http')) {
            Lampa.notify('URL должен начинаться с http:// или https://');
            return;
        }
        
        btnAdd.disabled = true;
        btnAdd.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Загрузка...';
        
        const success = await Lampa.install(url);
        
        btnAdd.disabled = false;
        btnAdd.innerHTML = '<i class="fa-solid fa-plus"></i> Добавить';
        
        if (success) {
            Lampa.notify('Расширение установлено');
            inputUrl.value = '';
        } else {
            Lampa.notify('Не удалось загрузить расширение');
        }
        
        renderExtList();
    });
    
    // Enter РІ РїРѕР»Рµ URL
    inputUrl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') btnAdd.click();
    });
    
    // РџРµСЂРІРёС‡РЅС‹Р№ СЂРµРЅРґРµСЂ
    renderExtList();
    
    // РћР±РЅРѕРІР»РµРЅРёРµ РїСЂРё РёР·РјРµРЅРµРЅРёРё СЃРїРёСЃРєР°
    Lampa.on('extensions:changed', () => renderExtList());
}

/**
 * Р“Р»Р°РІРЅР°СЏ С„СѓРЅРєС†РёСЏ РёРЅРёС†РёР°Р»РёР·Р°С†РёРё РїСЂРёР»РѕР¶РµРЅРёСЏ
 */
async function initApp() {
    initDomElements();
    setupTopNav();
    setupHeroActions();
    setupSettings();
    setupJackettPage();
    setupExtensions();
    setupDetailsPageHandlers();
    setupTorrentHandlers();
    setupGlobalKeyHandlers();
    setupSpatialNavigation();
    
    if (window.Lampa) {
        Lampa.utils = {
            fetchMovies,
            renderCarousel,
            createMovieCard,
            openDetailsPage,
            loadCategory,
            getImageSize,
            domElements: () => domElements
        };

        const mountCustomCategory = (config) => {
            const navLinks = document.querySelector('.nav-links');
            if (!navLinks) return;
            const categoryKey = (config.name || 'custom').toLowerCase().replace(/[^a-z0-9а-яё]+/gi, '-');
            if (navLinks.querySelector(`[data-custom-category="${categoryKey}"]`)) {
                return;
            }
            
            const navItem = document.createElement('li');
            navItem.className = 'nav-item';
            navItem.tabIndex = 0;
            navItem.dataset.customCategory = categoryKey;
            const icon = document.createElement('i');
            icon.className = config.icon || 'fa-solid fa-puzzle-piece';
            navItem.appendChild(icon);
            navItem.append(` ${config.name}`);
            
            const handleClick = async () => {
                document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
                navItem.classList.add('active');

                const titles1 = getHomeSection(0).title;
                titles1.innerHTML = '';
                const titleIcon = document.createElement('i');
                titleIcon.className = config.icon || 'fa-solid fa-puzzle-piece';
                titles1.appendChild(titleIcon);
                titles1.append(` ${config.name}`);
                getHomeSection(1).title.textContent = 'Другие материалы';
                
                try {
                    const items = await config.fetchFn();
                    if (items && items.length > 0) {
                        renderHero(items[0]);
                        setSectionContent(0, config.name, items);
                        setSectionContent(1, 'Другие материалы', []);
                        setSectionContent(2, 'История просмотра', getLatestHistoryItems());
                        setSectionContent(3, 'Буду смотреть', getLatestWatchlistItems());
                        setSectionContent(4, 'Рекомендации', await fetchRecommendationsForItems(items));
                    }
                } catch(e) {
                    console.error('[Extensions] РћС€РёР±РєР° Р·Р°РіСЂСѓР·РєРё РєР°С‚РµРіРѕСЂРёРё:', e);
                }
                
                if (window.Lampa) Lampa.emit('category:change', 'ext_' + config.name);
            };
            
            navItem.addEventListener('click', handleClick);
            navItem.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') handleClick();
            });
            
            // Р’СЃС‚Р°РІР»СЏРµРј РїРµСЂРµРґ РёРєРѕРЅРєРѕР№ РЅР°СЃС‚СЂРѕРµРє
            navLinks.appendChild(navItem);
        };

        Lampa.on('category:added', mountCustomCategory);
        Lampa.getCustomCategories().forEach(mountCustomCategory);
        await Lampa.loadAll();
        Lampa.getCustomCategories().forEach(mountCustomCategory);
    }

    loadCategory('home');

    if (window.Lampa) {
        Lampa.emit('ready', { version: '1.0.0' });
    }
}

// Р—Р°РїСѓСЃРєР°РµРј РёРЅРёС†РёР°Р»РёР·Р°С†РёСЋ СЃСЂР°Р·Сѓ РїРѕСЃР»Рµ РїРѕСЃС‚СЂРѕРµРЅРёСЏ DOM РґРµСЂРµРІР°
document.addEventListener('DOMContentLoaded', initApp);



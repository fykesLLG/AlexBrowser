// Инициализация базы данных IndexedDB на телефоне
let db;
const request = indexedDB.open("AlexBrowserDB", 1);

request.onupgradeneeded = function(e) {
    db = e.target.result;
    if(!db.objectStoreNames.contains("bookmarks")) db.createObjectStore("bookmarks", {keyPath: "id", autoIncrement: true});
};

request.onsuccess = function(e) {
    db = e.target.result;
    loadBookmarks();
};

// Часы сверху
setInterval(() => {
    document.getElementById('live-time').innerText = new Date().toTimeString().split(' ')[0];
}, 1000);

// Перехват отправки формы поиска
function handleSearchSubmit() {
    const query = document.getElementById('searchField').value.trim();
    if(!query) return;

    // Сохраняем запрос в базу данных телефона как закладку
    const tx = db.transaction(["bookmarks"], "readwrite");
    tx.objectStore("bookmarks").add({ title: query, url: "https://bing.com" + encodeURIComponent(query) });
    tx.oncomplete = function() { loadBookmarks(); };

    // Переключаем экраны: прячем поиск, показываем веб-окно и кнопку возврата
    document.getElementById('mainZone').style.display = 'none';
    document.getElementById('appViewport').style.display = 'block';
    document.getElementById('backHomeBtn').style.display = 'block';
}

// Открытие быстрых плиток (ВК, Госуслуги) во внутреннем окне приложения
function openWebSite(url) {
    document.getElementById('mainZone').style.display = 'none';
    const frame = document.getElementById('appViewport');
    frame.style.display = 'block';
    frame.src = url;
    document.getElementById('backHomeBtn').style.display = 'block';
}

// Возврат на главный неоновый экран
function goHome() {
    document.getElementById('appViewport').style.display = 'none';
    document.getElementById('backHomeBtn').style.display = 'none';
    document.getElementById('mainZone').style.display = 'flex';
    document.getElementById('searchField').value = '';
}

// Отображение закладок из базы данных на панели
function loadBookmarks() {
    const container = document.getElementById('bookmarksContainer');
    container.innerHTML = '';
    const tx = db.transaction("bookmarks", "readonly");
    tx.openCursor().onsuccess = function(e) {
        const cursor = e.target.result;
        if (cursor) {
            container.innerHTML += `
                <div class="bookmark-item">
                    <span class="bookmark-link" onclick="openWebSite('${cursor.value.url}')">🔖 ${cursor.value.title}</span>
                    <span class="del-bookmark" onclick="deleteBookmark(${cursor.value.id})">×</span>
                </div>`;
            cursor.continue();
        }
    };
}

// Удаление закладки крестиком из памяти
function deleteBookmark(id) {
    const tx = db.transaction(["bookmarks"], "readwrite");
    tx.objectStore("bookmarks").delete(id);
    tx.oncomplete = function() { loadBookmarks(); };
}

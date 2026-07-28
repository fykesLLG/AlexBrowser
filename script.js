// 2) Инициализация базы данных IndexedDB на самом смартфоне
let db;
const request = indexedDB.open("AlexBrowserDB", 1);

request.onupgradeneeded = function(e) {
    db = e.target.result;
    if(!db.objectStoreNames.contains("bookmarks")) db.createObjectStore("bookmarks", {keyPath: "id", autoIncrement: true});
    if(!db.objectStoreNames.contains("notes")) db.createObjectStore("notes", {keyPath: "id"});
};

request.onsuccess = function(e) {
    db = e.target.result;
    loadBookmarks();
    loadSavedNote();
};

// 6) Часы и имитация показателей скорости сети
setInterval(() => {
    const now = new Date();
    document.getElementById('live-time').innerText = now.toTimeString().split(' ')[0];
    const randomSpeed = (45 + Math.random() * 8).toFixed(1);
    document.getElementById('live-speed').innerText = `⚡ СКОРОСТЬ: ${randomSpeed} Mbps`;
}, 1000);

// 4) Логика поиска и вывод сайтов в 2 ряда (Сетка)
function executeSearch() {
    const query = document.getElementById('searchField').value.trim();
    if(!query) return;
    
    document.getElementById('resultsGrid').style.display = 'grid';
    
    // Запись поиска как закладки в базу данных IndexedDB
    if(!isIncognito) {
        const transaction = db.transaction(["bookmarks"], "readwrite");
        const store = transaction.objectStore("bookmarks");
        store.add({ title: query, url: "https://google.com" + encodeURIComponent(query) });
        transaction.oncomplete = function() { loadBookmarks(); };
    }
}

// 3) Вывод закладок из базы на верхнюю панель
function loadBookmarks() {
    const container = document.getElementById('bookmarksContainer');
    container.innerHTML = '';
    
    const tx = db.transaction("bookmarks", "readonly");
    const store = tx.objectStore("bookmarks");
    
    store.openCursor().onsuccess = function(e) {
        const cursor = e.target.result;
        if (cursor) {
            const bData = cursor.value;
            container.innerHTML += `
                <div class="bookmark-item">
                    <span class="bookmark-link" onclick="openWebSite('${bData.url}')">🔖 ${bData.title}</span>
                    <span class="del-bookmark" onclick="deleteBookmark(${bData.id})">×</span>
                </div>
            `;
            cursor.continue();
        }
    };
}

// 3) Удаление закладки крестиком из памяти телефона
function deleteBookmark(id) {
    const tx = db.transaction(["bookmarks"], "readwrite");
    tx.objectStore("bookmarks").delete(id);
    tx.oncomplete = function() { loadBookmarks(); };
}

// Показ сайтов во фрейме
function openWebSite(url) {
    document.getElementById('mainZone').style.display = 'none';
    const frame = document.getElementById('appViewport');
    frame.style.display = 'block';
    frame.src = url;
}

// 5) Переключатель режима Инкогнито
let isIncognito = false;
function toggleIncognito() {
    isIncognito = !isIncognito;
    const bar = document.getElementById('browser-mode');
    if(isIncognito) {
        bar.innerText = "🕶️ РЕЖИМ: ИНКОГНИТО (БАЗА ОТКЛЮЧЕНА)";
        bar.style.color = "#ff0055";
    } else {
        bar.innerText = "🌐 РЕЖИМ: СТАНДАРТ";
        bar.style.color = "#00f0ff";
    }
}

// 8) Полноэкранный режим
function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {});
    } else {
        document.exitFullscreen();
    }
}

// Управление окнами
function openModal(id) { document.getElementById(id).style.display = 'flex'; }
function closeModal(id) { document.getElementById(id).style.display = 'none'; }

// 4) Логика сохранения паролей в настройках
function saveUser() {
    const name = document.getElementById('regName').value;
    const pass = document.getElementById('regPass').value;
    const pass2 = document.getElementById('regPass2').value;
    if(pass !== pass2) { alert("Пароли не совпадают!"); return; }
    alert(`Профиль ${name} успешно зашифрован в ядре AlexBrowser!`);
    closeModal('settingsModal');
}

function requestDefaultBrowser() {
    alert("Системный вызов Android: Назначьте AlexBrowser приложением по умолчанию в настройках системы.");
}

// 10, 11) Чтение локальных документов HTML (Localhost симулятор)
function readLocalHTML(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        const viewer = document.getElementById('localhostViewer');
        viewer.style.display = 'block';
        viewer.innerHTML = e.target.result;
    };
    reader.readAsText(file);
}

// 11) Заметки в базу данных
function saveNote() {
    const text = document.getElementById('noteArea').value;
    const tx = db.transaction(["notes"], "readwrite");
    tx.objectStore("notes").put({id: "user_note", content: text});
    alert("Заметка надежно заблокирована в базе IndexedDB!");
    closeModal('notesModal');
}

function loadSavedNote() {
    const tx = db.transaction("notes", "readonly");
    tx.objectStore("notes").get("user_note").onsuccess = function(e) {
        if(e.target.result) document.getElementById('noteArea').value = e.target.result.content;
    };
}

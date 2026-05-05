// ========== Глобальные данные ==========
let scheduleData = [
  { date: "20.04.2026", startTime: "07:30", endTime: "08:00", desc: "Регистрация и крещение" },
  { date: "20.04.2026", startTime: "08:30", endTime: "09:00", desc: "Исповедь" },
  { date: "20.04.2026", startTime: "09:00", endTime: "10:30", desc: "Божественная Литургия. Молебен" }
];
let clergyData = [
  { name: "Полторжицкий Борис Кубович", position: "Настоятель", description: "Протоиерей...\nТел.: +375-29-6675610.", photoUrl: "https://molod-eparchy.by/wp-content/uploads/2019/11/protoierej-poltorzhiczkij-boris-kubovich-420x570.jpg" },
  { name: "Гончарук Кирилл Иванович", position: "Иерей", description: "Клирик...\nТел. +375 (29) 796-28-11.", photoUrl: "https://molod-eparchy.by/wp-content/uploads/2023/07/dsc_7995w-420x570.jpg" },
  { name: "Сенкевич Павел Александрович", position: "Иерей", description: "Клирик...\nТел.: +375-33-3752260.", photoUrl: "https://molod-eparchy.by/wp-content/uploads/2019/11/ierej-senkevich-pavel-aleksandrovich-420x570.jpg" }
];
let galleryEvents = [];
let articles = []; // массив статей: { id, title, content }
let announcementText = "Сердечно поздравляем всех с праздником Светлой Пасхи! Христос Воскресе!";
let heroImageSrc = "https://dzr.by/app/uploads/2024/06/czerkov-maj.jpg";

// Конвертация plain text в HTML
function textToHtml(text) {
  if (!text) return '';
  return '<p>' + text.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>') + '</p>';
}

// ========== Работа со статьями ==========
const STORAGE_ARTICLES_KEY = 'church_articles';
function loadArticles() {
  const stored = localStorage.getItem(STORAGE_ARTICLES_KEY);
  if (stored) {
    try { articles = JSON.parse(stored); } catch(e) { articles = []; }
  }
  if (!articles.length) {
    articles = [
      { id: 'church-history', title: 'О храме', content: 'В 1932 г. местечко Койданово переименовано в Дзержинск...' },
      { id: 'flowers', title: 'Почему не стоит покупать искусственные цветы', content: 'Советы православных экологов...' },
      { id: 'icon-part1', title: 'Проблемы современного иконопочитания. Часть 1', content: 'Сегодня, в преддверии праздника Торжества Православия...' },
      { id: 'icon-part2', title: 'Проблемы иконопочитания. Ч.2', content: 'Авторы благодарят читателей...' }
    ];
    saveArticles();
  }
}
function saveArticles() {
  localStorage.setItem(STORAGE_ARTICLES_KEY, JSON.stringify(articles));
}
function addArticle(title, content) {
  const id = 'article_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
  articles.push({ id, title, content });
  saveArticles();
}
function deleteArticle(articleId) {
  articles = articles.filter(a => a.id !== articleId);
  saveArticles();
}
function updateArticle(articleId, title, content) {
  const idx = articles.findIndex(a => a.id === articleId);
  if (idx !== -1) {
    articles[idx].title = title;
    articles[idx].content = content;
    saveArticles();
  }
}

// ========== IndexedDB (галерея) ==========
const DB_NAME = "ChurchGallery";
const DB_VERSION = 1;
let db = null;
function openDB() {
  return new Promise((resolve, reject) => {
    if (db && db.name === DB_NAME) return resolve(db);
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => { db = request.result; resolve(db); };
    request.onupgradeneeded = (e) => {
      const db_ = e.target.result;
      if (!db_.objectStoreNames.contains("images")) {
        db_.createObjectStore("images", { keyPath: "id" });
      }
    };
  });
}
async function storeImage(file) {
  const db_ = await openDB();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const imageId = `img_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
      const imageData = { id: imageId, data: reader.result, name: file.name, type: file.type };
      const tx = db_.transaction(["images"], "readwrite");
      const store = tx.objectStore("images");
      const request = store.add(imageData);
      request.onsuccess = () => resolve(imageId);
      request.onerror = () => reject(request.error);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
async function getImageById(imageId) {
  if (!imageId) return null;
  const db_ = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db_.transaction(["images"], "readonly");
    const store = tx.objectStore("images");
    const request = store.get(imageId);
    request.onsuccess = () => resolve(request.result ? request.result.data : null);
    request.onerror = () => reject(request.error);
  });
}
async function deleteImageById(imageId) {
  if (!imageId) return;
  const db_ = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db_.transaction(["images"], "readwrite");
    const store = tx.objectStore("images");
    const request = store.delete(imageId);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}
function saveGalleryEvents() {
  localStorage.setItem('church_gallery_events', JSON.stringify(galleryEvents));
}
function loadGalleryEvents() {
  const ge = localStorage.getItem('church_gallery_events');
  if (ge) { try { galleryEvents = JSON.parse(ge); } catch(e) {} }
}

// ========== Загрузка/сохранение остальных данных ==========
function loadFromLocalStorage() {
  let s = localStorage.getItem('church_schedule'); if (s) scheduleData = JSON.parse(s);
  let a = localStorage.getItem('church_announcement'); if (a) announcementText = a;
  let h = localStorage.getItem('church_hero_image'); if (h) heroImageSrc = h;
  let cl = localStorage.getItem('church_clergy_data'); if (cl) clergyData = JSON.parse(cl);
  loadGalleryEvents();
  loadArticles();
}
function saveScheduleToLocalStorage() {
  localStorage.setItem('church_schedule', JSON.stringify(scheduleData));
}
function saveClergyToLocalStorage() {
  localStorage.setItem('church_clergy_data', JSON.stringify(clergyData));
}

// ========== Расписание ==========
function parseDate(ds) {
  let [d,m,y] = ds.split('.');
  return new Date(y, m-1, d);
}
function getUpcomingSchedule() {
  let now = new Date();
  return scheduleData.filter(item => {
    let [day, month, year] = item.date.split('.');
    let itemDate = new Date(year, month-1, day);
    return itemDate >= now.setHours(0,0,0,0);
  }).sort((a,b) => {
    let [dayA, monthA, yearA] = a.date.split('.');
    let [dayB, monthB, yearB] = b.date.split('.');
    let dateA = new Date(yearA, monthA-1, dayA);
    let dateB = new Date(yearB, monthB-1, dayB);
    if (dateA.getTime() !== dateB.getTime()) return dateA - dateB;
    return a.startTime.localeCompare(b.startTime);
  });
}
function removePastScheduleFromData() {
  let now = new Date();
  let oldLength = scheduleData.length;
  scheduleData = scheduleData.filter(item => {
    let [day, month, year] = item.date.split('.');
    let itemDate = new Date(year, month-1, day);
    return itemDate >= now.setHours(0,0,0,0);
  });
  if (scheduleData.length !== oldLength) saveScheduleToLocalStorage();
  return scheduleData.length !== oldLength;
}
function getFormattedScheduleItem(item) {
  let timeStr = item.startTime;
  if (item.endTime && item.endTime !== '') timeStr += ` – ${item.endTime}`;
  return `${item.date} ${timeStr}`;
}

// ========== АДМИН-ПАНЕЛЬ (5 кликов по логотипу) ==========
let isAdminLogged = false;
let secretClickCount = 0;
let secretClickTimer = null;

function showAdminModal() {
  let modal = document.getElementById('adminModal');
  if (!modal) createAdminModal();
  modal = document.getElementById('adminModal');
  if (modal) modal.style.display = 'flex';
}
function hideAdminModal() {
  const modal = document.getElementById('adminModal');
  if (modal) modal.style.display = 'none';
}
function createAdminModal() {
  if (document.getElementById('adminModal')) return;
  const modalHTML = `<div id="adminModal" class="modal"><div class="modal-content"><h3><i class="fas fa-lock"></i> Админ-панель</h3><div class="password-wrapper"><i class="fas fa-key"></i><input type="password" id="adminPassword" placeholder="Введите пароль"></div><button id="loginAdminBtn" class="btn" style="width:100%">Войти</button><div id="adminPanel" class="admin-panel" style="display:none"><div class="admin-section"><h4><i class="fas fa-images"></i> Изображения</h4><label>Главное фото храма (URL)</label><input id="heroImageUrl"><button id="saveImagesBtn" class="btn">Сохранить</button></div><div class="admin-section"><h4><i class="fas fa-newspaper"></i> Управление статьями</h4><div id="articlesManager"></div><button id="addArticleBtn" class="btn">+ Добавить статью</button></div><div class="admin-section"><h4><i class="fas fa-user-friends"></i> Духовенство</h4><div id="clergyEditorContainer"></div><button id="saveClergyBtn" class="btn">Сохранить</button></div><div class="admin-section"><h4><i class="fas fa-images"></i> Управление событиями и фото (галерея)</h4><div id="galleryEventsEditor"></div><button id="addEventBtn" class="btn">+ Добавить событие</button><button id="saveGalleryEventsBtn" class="btn">Сохранить всё</button></div><div class="admin-section"><h4><i class="fas fa-calendar-alt"></i> Расписание</h4><div id="scheduleEditor"></div><button id="addScheduleRowBtn" class="btn">+ Добавить строку</button><button id="saveScheduleBtn" class="btn">Сохранить</button><button id="removePastScheduleBtn" class="btn btn-outline">Удалить прошедшие</button></div><div class="admin-section"><h4><i class="fas fa-bell"></i> Объявление и календарь</h4><textarea id="editAnnouncement" rows="2"></textarea><button id="saveAnnouncementBtn" class="btn">Объявление</button><textarea id="editCalendar" rows="4"></textarea><button id="saveCalendarBtn" class="btn">Календарь</button></div><button id="logoutAdminBtn" class="btn btn-outline" style="width:100%">Выйти</button></div><button id="closeModalBtn" class="btn btn-outline" style="margin-top:1rem">Закрыть</button></div></div>`;
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  initAdminEventListeners();
}
function initAdminEventListeners() {
  document.getElementById('loginAdminBtn')?.addEventListener('click', adminLogin);
  document.getElementById('closeModalBtn')?.addEventListener('click', hideAdminModal);
  document.getElementById('logoutAdminBtn')?.addEventListener('click', adminLogout);
  document.getElementById('saveImagesBtn')?.addEventListener('click', saveImagesFromAdmin);
  document.getElementById('saveClergyBtn')?.addEventListener('click', saveClergyFromAdmin);
  document.getElementById('addEventBtn')?.addEventListener('click', addNewEvent);
  document.getElementById('saveGalleryEventsBtn')?.addEventListener('click', saveGalleryEventsFromAdmin);
  document.getElementById('addScheduleRowBtn')?.addEventListener('click', addScheduleRow);
  document.getElementById('saveScheduleBtn')?.addEventListener('click', saveSchedule);
  document.getElementById('removePastScheduleBtn')?.addEventListener('click', removePastSchedule);
  document.getElementById('saveAnnouncementBtn')?.addEventListener('click', saveAnnouncement);
  document.getElementById('saveCalendarBtn')?.addEventListener('click', saveCalendar);
  document.getElementById('addArticleBtn')?.addEventListener('click', () => {
    let title = prompt("Введите заголовок новой статьи:");
    if (title) {
      let content = prompt("Введите текст статьи (можно с переносами строк):");
      if (content !== null) {
        addArticle(title, content);
        renderArticlesManager();
        alert("Статья добавлена");
      }
    }
  });
}
const ADMIN_PASS = "pokrovAdmin2026";
function adminLogin() {
  let pwd = document.getElementById('adminPassword').value;
  if (pwd === ADMIN_PASS) {
    isAdminLogged = true;
    document.getElementById('adminPanel').style.display = 'block';
    document.getElementById('loginAdminBtn').style.display = 'none';
    document.querySelector('.password-wrapper').style.display = 'none';
    renderArticlesManager();
    renderClergyEditor();
    rebuildScheduleEditor();
    renderGalleryEventsEditor();
    document.getElementById('heroImageUrl').value = heroImageSrc;
    document.getElementById('editAnnouncement').value = announcementText;
    alert("Вход выполнен.");
  } else {
    alert("Неверный пароль");
  }
}
function adminLogout() {
  isAdminLogged = false;
  document.getElementById('adminPanel').style.display = 'none';
  document.getElementById('loginAdminBtn').style.display = 'inline-block';
  document.querySelector('.password-wrapper').style.display = 'flex';
  document.getElementById('adminPassword').value = '';
  alert("Вы вышли.");
}

// ========== Управление статьями в админке ==========
function renderArticlesManager() {
  let container = document.getElementById('articlesManager');
  if (!container) return;
  let html = '';
  articles.forEach(article => {
    html += `<div style="border:1px solid #e2e8f0; border-radius:1rem; padding:1rem; margin-bottom:1rem;">
      <h4>${escapeHtml(article.title)}</h4>
      <label>Заголовок:</label><input class="article-title-edit" data-id="${article.id}" value="${escapeHtml(article.title)}" style="width:100%; margin-bottom:0.5rem;">
      <label>Текст (простой текст):</label>
      <textarea class="article-content-edit" data-id="${article.id}" rows="6" style="width:100%;">${escapeHtml(article.content)}</textarea>
      <div style="margin-top:0.5rem;">
        <button class="save-article-btn btn" data-id="${article.id}">Сохранить</button>
        <button class="delete-article-btn btn-outline" data-id="${article.id}">Удалить</button>
      </div>
    </div>`;
  });
  container.innerHTML = html;
  document.querySelectorAll('.save-article-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      let id = btn.getAttribute('data-id');
      let titleInput = document.querySelector(`.article-title-edit[data-id="${id}"]`);
      let contentTextarea = document.querySelector(`.article-content-edit[data-id="${id}"]`);
      if (titleInput && contentTextarea) {
        updateArticle(id, titleInput.value, contentTextarea.value);
        renderArticlesManager();
        alert("Статья обновлена");
      }
    });
  });
  document.querySelectorAll('.delete-article-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      let id = btn.getAttribute('data-id');
      if (confirm('Удалить статью?')) {
        deleteArticle(id);
        renderArticlesManager();
        alert("Статья удалена");
      }
    });
  });
}

// ========== Редактор духовенства ==========
function renderClergyEditor() {
  let c = document.getElementById('clergyEditorContainer');
  if (!c) return;
  let html = '';
  clergyData.forEach((m, i) => {
    html += `<div><label>Имя:</label><input id="clergy_name_${i}" value="${escapeHtml(m.name)}"><label>Должность:</label><input id="clergy_position_${i}" value="${escapeHtml(m.position)}"><label>Описание:</label><textarea id="clergy_desc_${i}" rows="4">${escapeHtml(m.description)}</textarea><label>URL фото:</label><input id="clergy_photo_${i}" value="${escapeHtml(m.photoUrl)}"></div>`;
  });
  c.innerHTML = html;
}
function saveClergyFromAdmin() {
  if (!isAdminLogged) return;
  let newClergy = [];
  for (let i = 0; i < clergyData.length; i++) {
    newClergy.push({ name: document.getElementById(`clergy_name_${i}`).value, position: document.getElementById(`clergy_position_${i}`).value, description: document.getElementById(`clergy_desc_${i}`).value, photoUrl: document.getElementById(`clergy_photo_${i}`).value });
  }
  clergyData = newClergy;
  saveClergyToLocalStorage();
  alert("Духовенство сохранено");
  location.reload();
}

// ========== Редактор расписания ==========
function rebuildScheduleEditor() {
  let container = document.getElementById('scheduleEditor');
  if (!container) return;
  container.innerHTML = '';
  scheduleData.forEach((item, idx) => {
    let [day, month, year] = item.date.split('.');
    let startDateTimeValue = `${year}-${month}-${day}T${item.startTime}`;
    let endDateTimeValue = item.endTime && item.endTime !== '' ? `${year}-${month}-${day}T${item.endTime}` : `${year}-${month}-${day}T${item.startTime}`;
    const eventTypes = [
      'Божественная Литургия. Молебен',
      'Божественная Литургия. Панихида',
      'Регистрация и крещение',
      'Исповедь',
      'Всенощное Бдение',
      'Другое'
    ];
    const isCustom = !eventTypes.includes(item.desc);
    const selectedType = isCustom ? 'Другое' : item.desc;
    let selectHtml = `<select class="schedule-desc-select" data-idx="${idx}" style="flex:1; padding:0.5rem; border-radius:2rem; border:1px solid #e2d5c0;">
      ${eventTypes.map(type => `<option value="${escapeHtml(type)}" ${selectedType === type ? 'selected' : ''}>${escapeHtml(type)}</option>`).join('')}
    </select>`;
    let customInputHtml = '';
    if (isCustom || selectedType === 'Другое') {
      customInputHtml = `<input type="text" class="schedule-custom-desc" data-idx="${idx}" value="${escapeHtml(item.desc)}" placeholder="Введите название события" style="width:100%; padding:0.5rem; border-radius:2rem; border:1px solid #e2d5c0; margin-top:0.5rem;">`;
    }
    let row = document.createElement('div');
    row.className = 'schedule-row';
    row.style.display = 'flex';
    row.style.flexDirection = 'column';
    row.style.gap = '0.5rem';
    row.style.marginBottom = '1rem';
    row.style.padding = '0.5rem';
    row.style.border = '1px solid #e2e8f0';
    row.style.borderRadius = '1rem';
    row.innerHTML = `
      <div style="display:flex; gap:1rem; flex-wrap:wrap; align-items:center;">
        <div style="display:flex; gap:0.5rem; align-items:center; flex:1;">
          <span>Начало:</span>
          <input type="datetime-local" value="${startDateTimeValue}" class="schedule-start-datetime" data-idx="${idx}" style="flex:1; padding:0.5rem; border-radius:2rem;">
        </div>
        <div style="display:flex; gap:0.5rem; align-items:center; flex:1;">
          <span>Окончание:</span>
          <input type="datetime-local" value="${endDateTimeValue}" class="schedule-end-datetime" data-idx="${idx}" style="flex:1; padding:0.5rem; border-radius:2rem;">
        </div>
        ${selectHtml}
        <button class="btn-outline remove-schedule" data-idx="${idx}">✖ Удалить</button>
      </div>
      <div class="custom-desc-container" style="display:${(isCustom || selectedType === 'Другое') ? 'block' : 'none'};">${customInputHtml}</div>
    `;
    container.appendChild(row);
  });
  document.querySelectorAll('.schedule-start-datetime').forEach(inp => {
    inp.addEventListener('change', (e) => {
      let idx = parseInt(e.target.dataset.idx);
      let val = e.target.value;
      if (val) {
        let [datePart, timePart] = val.split('T');
        let [year, month, day] = datePart.split('-');
        scheduleData[idx].date = `${day}.${month}.${year}`;
        scheduleData[idx].startTime = timePart;
        saveScheduleToLocalStorage();
      }
    });
  });
  document.querySelectorAll('.schedule-end-datetime').forEach(inp => {
    inp.addEventListener('change', (e) => {
      let idx = parseInt(e.target.dataset.idx);
      let val = e.target.value;
      if (val) {
        let [datePart, timePart] = val.split('T');
        scheduleData[idx].endTime = timePart;
        saveScheduleToLocalStorage();
      }
    });
  });
  document.querySelectorAll('.schedule-desc-select').forEach(sel => {
    sel.addEventListener('change', (e) => {
      let idx = parseInt(e.target.dataset.idx);
      let selected = e.target.value;
      let row = e.target.closest('.schedule-row');
      let customContainer = row.querySelector('.custom-desc-container');
      if (selected === 'Другое') {
        customContainer.style.display = 'block';
        if (!customContainer.querySelector('.schedule-custom-desc')) {
          let newInput = document.createElement('input');
          newInput.type = 'text';
          newInput.className = 'schedule-custom-desc';
          newInput.setAttribute('data-idx', idx);
          newInput.placeholder = 'Введите название события';
          newInput.style.width = '100%';
          newInput.style.padding = '0.5rem';
          newInput.style.borderRadius = '2rem';
          newInput.style.border = '1px solid #e2d5c0';
          newInput.style.marginTop = '0.5rem';
          newInput.value = scheduleData[idx].desc === 'Другое' ? '' : scheduleData[idx].desc;
          customContainer.innerHTML = '';
          customContainer.appendChild(newInput);
          newInput.addEventListener('change', (ev) => {
            scheduleData[idx].desc = ev.target.value;
            saveScheduleToLocalStorage();
          });
        }
      } else {
        customContainer.style.display = 'none';
        scheduleData[idx].desc = selected;
        saveScheduleToLocalStorage();
      }
    });
  });
  document.querySelectorAll('.schedule-custom-desc').forEach(inp => {
    inp.addEventListener('change', (e) => {
      let idx = parseInt(e.target.dataset.idx);
      scheduleData[idx].desc = e.target.value;
      saveScheduleToLocalStorage();
    });
  });
  document.querySelectorAll('.remove-schedule').forEach(btn => {
    btn.addEventListener('click', (e) => {
      let idx = parseInt(btn.dataset.idx);
      scheduleData.splice(idx, 1);
      saveScheduleToLocalStorage();
      rebuildScheduleEditor();
    });
  });
}
function addScheduleRow() {
  let now = new Date();
  let year = now.getFullYear();
  let month = String(now.getMonth() + 1).padStart(2, '0');
  let day = String(now.getDate()).padStart(2, '0');
  let hours = String(now.getHours()).padStart(2, '0');
  let minutes = String(now.getMinutes()).padStart(2, '0');
  let defaultDate = `${day}.${month}.${year}`;
  let defaultStart = `${hours}:${minutes}`;
  let defaultEnd = `${hours}:${minutes}`;
  scheduleData.push({ date: defaultDate, startTime: defaultStart, endTime: defaultEnd, desc: "Божественная Литургия. Молебен" });
  saveScheduleToLocalStorage();
  rebuildScheduleEditor();
}
function saveSchedule() {
  if (isAdminLogged) {
    saveScheduleToLocalStorage();
    alert("Расписание сохранено");
    location.reload();
  }
}
function removePastSchedule() {
  if (isAdminLogged && removePastScheduleFromData()) {
    alert("Прошедшие события удалены");
    rebuildScheduleEditor();
    let scheduleContainer = document.getElementById('scheduleContainer');
    if (scheduleContainer) {
      let upcoming = getUpcomingSchedule();
      scheduleContainer.innerHTML = upcoming.map(i => `<div class="schedule-item"><span class="schedule-date">${escapeHtml(getFormattedScheduleItem(i))}</span><span>${escapeHtml(i.desc)}</span></div>`).join('') || '<div class="schedule-item">Нет запланированных богослужений</div>';
    }
  } else {
    alert("Нет прошедших событий");
  }
}

// ========== Редактор галереи ==========
async function renderGalleryEventsEditor() {
  let container = document.getElementById('galleryEventsEditor');
  if (!container) return;
  let html = '';
  for (let idx = 0; idx < galleryEvents.length; idx++) {
    const e = galleryEvents[idx];
    let coverPreview = '';
    if (e.coverImageId) {
      let coverData = await getImageById(e.coverImageId);
      if (coverData) coverPreview = `<img src="${coverData}" style="max-width:100px;">`;
    }
    html += `<div style="border:1px solid #daa520; margin-bottom:1rem; padding:1rem;">
      <h4>${escapeHtml(e.title)}</h4>
      <label>Название:</label><input class="event-title" data-idx="${idx}" value="${escapeHtml(e.title)}"><br>
      <label>Описание:</label><textarea class="event-desc" data-idx="${idx}" rows="2">${escapeHtml(e.description)}</textarea><br>
      <label>Обложка:</label><input type="file" class="event-cover-upload" data-idx="${idx}">${coverPreview}
      <div>Фото: <button class="add-photo-btn" data-event-idx="${idx}">+</button></div>
      <div id="photos-${idx}">`;
    for (let pidx = 0; pidx < e.photos.length; pidx++) {
      let photo = e.photos[pidx];
      let thumb = await getImageById(photo.imageId);
      html += `<div><input class="photo-caption" data-event-idx="${idx}" data-photo-idx="${pidx}" value="${escapeHtml(photo.caption)}"><button class="remove-photo" data-event-idx="${idx}" data-photo-idx="${pidx}">Удалить</button>${thumb ? `<img src="${thumb}" height="40">` : ''}</div>`;
    }
    html += `</div><button class="remove-event" data-idx="${idx}">Удалить событие</button></div>`;
  }
  container.innerHTML = html;
  attachGalleryEvents();
}
function attachGalleryEvents() {
  document.querySelectorAll('.event-title').forEach(inp => inp.addEventListener('change', async (e) => { galleryEvents[e.target.dataset.idx].title = e.target.value; saveGalleryEvents(); await renderGalleryEventsEditor(); }));
  document.querySelectorAll('.event-desc').forEach(ta => ta.addEventListener('change', async (e) => { galleryEvents[e.target.dataset.idx].description = e.target.value; saveGalleryEvents(); await renderGalleryEventsEditor(); }));
  document.querySelectorAll('.event-cover-upload').forEach(btn => btn.addEventListener('change', async (e) => { let idx = e.target.dataset.idx; let file = e.target.files[0]; if (file) { let id = await storeImage(file); galleryEvents[idx].coverImageId = id; saveGalleryEvents(); await renderGalleryEventsEditor(); } }));
  document.querySelectorAll('.add-photo-btn').forEach(btn => btn.addEventListener('click', async (e) => { let eventIdx = e.target.dataset.eventIdx; let input = document.createElement('input'); input.type = 'file'; input.multiple = true; input.accept = 'image/*'; input.onchange = async (ev) => { for (let f of ev.target.files) { if (galleryEvents[eventIdx].photos.length >= 15) break; let id = await storeImage(f); galleryEvents[eventIdx].photos.push({ imageId: id, caption: f.name }); } saveGalleryEvents(); await renderGalleryEventsEditor(); }; input.click(); }));
  document.querySelectorAll('.photo-caption').forEach(inp => inp.addEventListener('change', (e) => { let eventIdx = e.target.dataset.eventIdx; let photoIdx = e.target.dataset.photoIdx; galleryEvents[eventIdx].photos[photoIdx].caption = e.target.value; saveGalleryEvents(); }));
  document.querySelectorAll('.remove-photo').forEach(btn => btn.addEventListener('click', async (e) => { let eventIdx = e.target.dataset.eventIdx; let photoIdx = e.target.dataset.photoIdx; let photo = galleryEvents[eventIdx].photos[photoIdx]; if (photo.imageId) await deleteImageById(photo.imageId); galleryEvents[eventIdx].photos.splice(photoIdx, 1); saveGalleryEvents(); await renderGalleryEventsEditor(); }));
  document.querySelectorAll('.remove-event').forEach(btn => btn.addEventListener('click', async (e) => { let idx = e.target.dataset.idx; if (confirm('Удалить событие?')) { for (let p of galleryEvents[idx].photos) if (p.imageId) await deleteImageById(p.imageId); if (galleryEvents[idx].coverImageId) await deleteImageById(galleryEvents[idx].coverImageId); galleryEvents.splice(idx, 1); saveGalleryEvents(); await renderGalleryEventsEditor(); } }));
}
function addNewEvent() { galleryEvents.push({ id: Date.now(), title: "Новое событие", description: "", coverImageId: null, photos: [] }); saveGalleryEvents(); renderGalleryEventsEditor(); }
async function saveGalleryEventsFromAdmin() { if (isAdminLogged) { saveGalleryEvents(); alert("События сохранены"); if (location.pathname.includes('gallery') || location.pathname.includes('event')) location.reload(); } }
function saveAnnouncement() { if (isAdminLogged) { announcementText = document.getElementById('editAnnouncement').value; localStorage.setItem('church_announcement', announcementText); alert("Обновлено"); location.reload(); } }
function saveCalendar() { if (isAdminLogged) { let val = document.getElementById('editCalendar').value; localStorage.setItem('church_calendar', val); alert("Обновлено"); location.reload(); } }
function saveImagesFromAdmin() { if (!isAdminLogged) return; let h = document.getElementById('heroImageUrl').value.trim(); if (h) heroImageSrc = h; localStorage.setItem('church_hero_image', heroImageSrc); alert("Главное фото обновлено"); location.reload(); }

// ========== Скрытый вход по 5 кликам на логотип ==========
function initSecretAdmin() {
  const logo = document.querySelector('.logo');
  if (!logo) return;
  logo.addEventListener('click', () => {
    if (secretClickTimer) clearTimeout(secretClickTimer);
    secretClickCount++;
    if (secretClickCount >= 5) {
      secretClickCount = 0;
      showAdminModal();
    }
    secretClickTimer = setTimeout(() => {
      secretClickCount = 0;
    }, 1000);
  });
}

// ========== Общие функции ==========
async function loadCommonData() {
  loadFromLocalStorage();
  await openDB();
}
async function getImageDataUrl(imageId) {
  if (!imageId) return '';
  return (await getImageById(imageId)) || '';
}

window.getImageDataUrl = getImageDataUrl;
window.galleryEvents = galleryEvents;
window.articles = articles;
window.escapeHtml = escapeHtml;
window.textToHtml = textToHtml;
window.getUpcomingSchedule = getUpcomingSchedule;
window.getFormattedScheduleItem = getFormattedScheduleItem;
window.announcementText = announcementText;
window.heroImageSrc = heroImageSrc;
window.clergyData = clergyData;

document.addEventListener('DOMContentLoaded', () => {
  const menuToggle = document.getElementById('menuToggle');
  const navLinks = document.getElementById('navLinks');
  if (menuToggle && navLinks) menuToggle.addEventListener('click', () => navLinks.classList.toggle('active'));
  const backBtn = document.getElementById('backToTop');
  if (backBtn) {
    window.addEventListener('scroll', () => { if (window.scrollY > 400) backBtn.classList.add('show'); else backBtn.classList.remove('show'); });
    backBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }
  initScrollAnimation();
  initSecretAdmin();
});
function initScrollAnimation() {
  let observer = new IntersectionObserver((entries) => { entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); }); }, { threshold: 0.1 });
  document.querySelectorAll('.fade-up').forEach(el => observer.observe(el));
}
function escapeHtml(str) { if (!str) return ''; return str.replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m])); }
  const taskbarContainer = document.getElementById('taskbar-items-container');
  const reorderBtn = document.getElementById('reorder-btn');
  const themeStylesheet = document.getElementById('theme-stylesheet');
  let highestZ = 10;
  //i added pc games here but thats all ive done
  function getIconClass(windowId) {
    if (windowId === 'win-pc-games') return 'icon-games';
    if (windowId === 'win-games') return 'icon-games';
    if (windowId === 'win-settings') return 'icon-settings';
    if (windowId === 'win-reports') return 'icon-reports';
    if (windowId === 'win-recommends') return 'icon-recommend';
    if (windowId === 'win-changelogs') return 'icon-changelogs';
    if (windowId.startsWith('win-uploaded-')) return 'icon-image';
    return '';
}

  const wallpapers = {
      'https://unpkg.com/98.css': "https://cdn.jsdelivr.net/gh/Dave-031/Newdemo@4031944321aaa64304138a68f1ee34b452cee8db/images/windows_98-resized.jpg",
      'https://unpkg.com/xp.css': "https://cdn.jsdelivr.net/gh/Dave-031/Newdemo@18303d7b050c223085e4065a091ce377e058be01/images/xp_wallpaper.jpg",
      'https://unpkg.com/7.css': "https://cdn.jsdelivr.net/gh/Dave-031/Newdemo@18303d7b050c223085e4065a091ce377e058be01/images/7_wallpaper.jpg"
  };

  
  function themeFile(){
    var t = "/win7.html";
    try {
      // FIX #1 (continued): corrected key spelling to match STORAGE_KEY above
      var raw = localStorage.getItem("game-station-settings-v1");
      console.log("raw from storage:", raw);
      if (raw) { var p = JSON.parse(raw); if (p && p.selectedTheme) t = p.selectedTheme; }
    } catch(e){ console.log("parse error:", e); }

    console.log("resolved theme value:", t);

    if (t.indexOf("98") !== -1) return "https://cdn.jsdelivr.net/gh/Dave-031/Newdemo@3a52b6c6e73d8f04d19f0f293e19581d9080c07b/98.html";
    if (t.indexOf("xp") !== -1) return "https://cdn.jsdelivr.net/gh/Dave-031/Newdemo@3a52b6c6e73d8f04d19f0f293e19581d9080c07b/xp.html";
    return "https://cdn.jsdelivr.net/gh/Dave-031/Newdemo@3a52b6c6e73d8f04d19f0f293e19581d9080c07b/7.html";
  }

  document.body.classList.add("gs-locked");
  var gate = document.createElement("div");
  gate.id = "login-gate";

  fetch(themeFile())
    .then(function(response) {
      if (!response.ok) throw new Error("Network response was not ok");
      return response.text();
    })
    .then(function(html) {
      var blob = new Blob([html], { type: 'text/html' });
      var blobUrl = URL.createObjectURL(blob);

      var frame = document.createElement("iframe");
      frame.src = blobUrl;
      gate.appendChild(frame);
    })
    .catch(function(err) {
      console.error("Failed to load login theme:", err);
    });

  document.body.appendChild(gate);

  window.addEventListener("message", function(e){
    if (e.data === "gs-login-success"){
      document.body.classList.remove("gs-locked");
      gate.remove();
    }
  });
  
  // FIX #1: this key must match the key used everywhere else (was "game-sation-settings-v1" at the bottom of the file — typo)
  const STORAGE_KEY = 'game-station-settings-v1';
  const LEGACY_STORAGE_KEY = 'windows_gamesite';
  const defaultSettings = {
      selectedTheme: 'https://unpkg.com/7.css',
      customBackgrounds: {},
      showClock: true,
      showCat: true,
      catScale: 1
  };

  // One-time migration: merge the legacy "windows_gamesite" key into
  // "game-station-settings-v1" and remove the legacy key. Per-field,
  // game-station-settings-v1 wins on conflicts; a field only comes from
  // the legacy key if game-station-settings-v1 doesn't already have it.
  function migrateLegacyStorage() {
      try {
          const legacyRaw = localStorage.getItem(LEGACY_STORAGE_KEY);
          if (!legacyRaw) return;

          const legacy = JSON.parse(legacyRaw);
          const currentRaw = localStorage.getItem(STORAGE_KEY);
          const current = currentRaw ? JSON.parse(currentRaw) : {};

          const merged = {
              selectedTheme: current.selectedTheme !== undefined ? current.selectedTheme : legacy.selectedTheme,
              customBackgrounds: {
                  ...(legacy.customBackgrounds || {}),
                  ...(current.customBackgrounds || {}) // current wins per-theme on overlap
              },
              showClock: current.showClock !== undefined ? current.showClock : legacy.showClock,
              showCat: current.showCat !== undefined ? current.showCat : legacy.showCat,
              catScale: current.catScale !== undefined ? current.catScale : legacy.catScale
          };

          localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
          localStorage.removeItem(LEGACY_STORAGE_KEY);
      } catch (err) {
          // If the legacy value is corrupt, don't block startup — just drop it.
          try { localStorage.removeItem(LEGACY_STORAGE_KEY); } catch (e2) {}
      }
  }
  migrateLegacyStorage();

  function loadSettings() {
      try {
          const stored = localStorage.getItem(STORAGE_KEY);
          if (!stored) return { ...defaultSettings, customBackgrounds: {} };
          const parsed = JSON.parse(stored);
          return {
              selectedTheme: parsed.selectedTheme || defaultSettings.selectedTheme,
              customBackgrounds: parsed.customBackgrounds || {},
              showClock: parsed.showClock !== undefined ? parsed.showClock : defaultSettings.showClock,
              showCat: parsed.showCat !== undefined ? parsed.showCat : defaultSettings.showCat,
              catScale: parsed.catScale !== undefined ? parsed.catScale : defaultSettings.catScale
          };
      } catch (err) {
          return { ...defaultSettings, customBackgrounds: {} };
      }
  }

  function saveSettings() {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }

  function getBackgroundForTheme(themeValue) {
      const custom = settings.customBackgrounds[themeValue];
      if (custom) return custom;
      return wallpapers[themeValue] || '';
  }

  function updateBackgroundStatus() {
      document.querySelectorAll('.theme-bg-status').forEach(statusEl => {
          const themeValue = statusEl.dataset.theme;
          if (settings.customBackgrounds[themeValue]) {
              statusEl.innerText = 'Custom image saved';
          } else {
              statusEl.innerText = 'Using default wallpaper';
          }
      });

      document.querySelectorAll('.theme-bg-preview').forEach(previewEl => {
          const themeValue = previewEl.dataset.theme;
          const custom = settings.customBackgrounds[themeValue];
          if (custom) {
              previewEl.src = custom;
              previewEl.style.display = 'block';
          } else {
              previewEl.style.display = 'none';
          }
      });
  }

  function updateClockVisibility() {
      const clockElement = document.getElementById('taskbar-clock');
      if (clockElement) {
          clockElement.style.display = settings.showClock ? 'flex' : 'none';
      }
  }

function updateCatSettings() {
      const catEl = document.getElementById('taskbar-cat');
      if (catEl) {
          catEl.style.display = settings.showCat ? 'block' : 'none';
          catEl.style.setProperty('--cat-scale', settings.catScale);
          catEl.style.bottom = ''; // Clears any buggy inline math from the last step
      }
  }

  function applyTheme(themeValue) {
      settings.selectedTheme = themeValue;
      themeStylesheet.href = themeValue;
      document.body.style.backgroundImage = `url('${getBackgroundForTheme(themeValue)}')`;

      document.querySelectorAll('input[name="theme-selection-group"]').forEach(radio => {
          radio.checked = radio.value === themeValue;
      });

    const themeName = themeValue.includes('98') ? 'win98' :
                      themeValue.includes('xp') ? 'winxp' : 'win7';
    document.body.setAttribute('data-theme', themeName);

      const quickSelect = document.getElementById('quick-theme-select');
      if (quickSelect) quickSelect.value = themeValue;

      // FIX #2/#4: previously compared themeValue against hardcoded jsdelivr "*_theme.css" URLs
      // that never matched the actual unpkg.com theme URLs, so it always fell through to "Windows 7".
      // Reuse the same includes('98')/includes('xp') logic used above for data-theme.
      const quickSummary = document.getElementById('quick-theme-summary');
      if (quickSummary) {
          const selectedLabel = themeName === 'win98'
              ? 'Windows 98'
              : themeName === 'winxp'
                  ? 'Windows XP'
                  : 'Windows 7';
          quickSummary.innerText = `Current theme: ${selectedLabel}`;
      }

      updateBackgroundStatus();
      saveSettings();
  }

  let settings = loadSettings();

  document.querySelectorAll('input[name="theme-selection-group"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
          if (e.target.checked) {
              applyTheme(e.target.value);
          }
      });
  });

  const quickThemeSelect = document.getElementById('quick-theme-select');
  if (quickThemeSelect) {
      quickThemeSelect.addEventListener('change', (e) => {
          applyTheme(e.target.value);
      });
  }

  const showClockToggle = document.getElementById('show-clock-toggle');
  if (showClockToggle) {
      showClockToggle.checked = settings.showClock;
      showClockToggle.addEventListener('change', (e) => {
          settings.showClock = e.target.checked;
          updateClockVisibility();
          saveSettings();
      });
  }

  const showCatToggle = document.getElementById('show-cat-toggle');
  if (showCatToggle) {
      showCatToggle.checked = settings.showCat;
      showCatToggle.addEventListener('change', (e) => {
          settings.showCat = e.target.checked;
          updateCatSettings();
          saveSettings();
      });
  }

  const catSizeSlider = document.getElementById('cat-size-slider');
  if (catSizeSlider) {
      catSizeSlider.value = settings.catScale;
      catSizeSlider.addEventListener('input', (e) => {
          settings.catScale = parseFloat(e.target.value);
          updateCatSettings();
          saveSettings();
      });
  }

  document.querySelectorAll('.upload-tray-btn').forEach(button => {
      button.addEventListener('click', () => {
          const matchingInput = document.querySelector(`.theme-bg-input[data-theme="${button.dataset.theme}"]`);
          if (matchingInput) matchingInput.click();
      });
  });

  document.querySelectorAll('.theme-bg-input').forEach(input => {
      input.addEventListener('change', (e) => {
          const file = e.target.files && e.target.files[0];
          if (!file) return;

          const reader = new FileReader();
          reader.onload = function(event) {
              settings.customBackgrounds[input.dataset.theme] = event.target.result;
              updateBackgroundStatus();
              if (settings.selectedTheme === input.dataset.theme) {
                  document.body.style.backgroundImage = `url('${event.target.result}')`;
              }
              saveSettings();
          };
          reader.readAsDataURL(file);
          e.target.value = '';
      });
  });

  document.querySelectorAll('.revert-bg-btn').forEach(button => {
      button.addEventListener('click', (e) => {
          e.stopPropagation();
          const themeValue = button.dataset.theme;
          delete settings.customBackgrounds[themeValue];
          updateBackgroundStatus();
          if (settings.selectedTheme === themeValue) {
              const defaultWallpaper = wallpapers[themeValue] || '';
              document.body.style.backgroundImage = `url('${defaultWallpaper}')`;
          }
          saveSettings();
      });
  });

  updateBackgroundStatus();
  updateClockVisibility();
  applyTheme(settings.selectedTheme);
  updateCatSettings();
 //added the location for the pc games window
  const defaultPositions = [
      { left: '30px', top: '30px' },
      { left: '500px', top: '30px' },
      { left: '30px', top: '380px' },
      { left: '500px', top: '380px' },
      { left: '970px', top: '30px' },
      { left: '970px', top: '380px' }
  ];

  const windowsList = document.querySelectorAll('.window');
  const standardWindowMap = new Map();
  const imageWindowMap = new Map();

  function applyDefaultLayout() {
      windowsList.forEach((windowEl, index) => {
          windowEl.classList.remove('maximized');
          windowEl.style.display = 'flex';
          // FIX #3: guard against more windows than defaultPositions entries
          // (previously would throw "Cannot read properties of undefined" if windowsList.length > defaultPositions.length)
          const pos = defaultPositions[index] || defaultPositions[index % defaultPositions.length];
          windowEl.style.left = pos.left;
          windowEl.style.top = pos.top;
          windowEl.style.zIndex = index + 1;

          const maxBtn = windowEl.querySelector('.btn-maximize');
          if(maxBtn) maxBtn.setAttribute('aria-label', 'Maximize');
      });

      taskbarContainer.innerHTML = '';

      windowsList.forEach(windowEl => {
          const btn = standardWindowMap.get(windowEl.id);
          if (btn) taskbarContainer.appendChild(btn);
      });

      const activeImageWindows = Array.from(document.querySelectorAll("div.window[id^='win-uploaded-']"));
      activeImageWindows.sort((a, b) => a.id.localeCompare(b.id));

      activeImageWindows.forEach((win) => {
          const associatedBtn = imageWindowMap.get(win.id);
          if (associatedBtn) {
              taskbarContainer.appendChild(associatedBtn);
          }
      });

      highestZ = windowsList.length + 1;
      renameActiveImagePanes();
  }

  function setupWindowLogic(windowEl, isImageWindow = false) {
    const titleBar = windowEl.querySelector('.title-bar');
    const titleText = windowEl.querySelector('.title-bar-text').innerText;
    const maxBtn = windowEl.querySelector('.btn-maximize');

    let savedLeft = windowEl.style.left || '100px';
    let savedTop = windowEl.style.top || '100px';

    const taskBtn = document.createElement('button');
    taskBtn.className = 'taskbar-item';
    taskBtn.style.cursor = 'pointer';
    const iconClass = getIconClass(windowEl.id);
    taskBtn.innerHTML = `<span class="taskbar-icon ${iconClass}"></span>${titleText}`;

    if (!isImageWindow) {
        standardWindowMap.set(windowEl.id, taskBtn);
    } else {
        imageWindowMap.set(windowEl.id, taskBtn);
    }

    taskBtn.addEventListener('click', () => {
        if (windowEl.style.display === 'none') {
            windowEl.style.display = 'flex';
        }
        bringToFront(windowEl);
    });

    function bringToFront(el) {
        if (!el.classList.contains('maximized')) {
            highestZ++;
            el.style.zIndex = highestZ;
        }
    }

    function toggleMaximize() {
        const allowedWindowIds = ['win-games', 'win-settings', 'win-changelogs', 'win-pc-games'];
        const isAllowed = allowedWindowIds.includes(windowEl.id) || windowEl.id.startsWith('win-uploaded-');
        if (!isAllowed) return;

        windowEl.classList.toggle('maximized');
        if (!windowEl.classList.contains('maximized')) {
            windowEl.style.left = savedLeft;
            windowEl.style.top = savedTop;
            bringToFront(windowEl);
            if (maxBtn) maxBtn.setAttribute('aria-label', 'Maximize');
        } else {
            if (maxBtn) maxBtn.setAttribute('aria-label', 'Restore');
        }
    }

    titleBar.addEventListener('dblclick', (e) => {
        if (e.target.closest('.title-bar-controls') || e.target.closest('select')) return;
        toggleMaximize();
    });

    windowEl.addEventListener('mousedown', () => bringToFront(windowEl));

    // Drag Handling with boundaries
    let isDragging = false;
    let wStartX, wStartY, initialLeft, initialTop;

    titleBar.addEventListener('mousedown', (e) => {
      if (e.target.closest('.title-bar-controls')) return;

      isDragging = true;
      windowEl.style.zIndex = 999999;

      wStartX = e.clientX;
      wStartY = e.clientY;

      if (windowEl.classList.contains('maximized')) {
        windowEl.classList.remove('maximized');
        if(maxBtn) maxBtn.setAttribute('aria-label', 'Maximize');
        initialLeft = e.clientX - 150;
        initialTop = e.clientY - 15;
        windowEl.style.left = `${initialLeft}px`;
        windowEl.style.top = `${initialTop}px`;
      } else {
        initialLeft = windowEl.offsetLeft;
        initialTop = windowEl.offsetTop;
      }

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    });

    function onMouseMove(e) {
      if (!isDragging) return;

      let newLeft = initialLeft + (e.clientX - wStartX);
      let newTop = initialTop + (e.clientY - wStartY);

      const taskbar = document.getElementById('taskbar');
      const windowHeight = windowEl.offsetHeight;
      const boundaryLimitTop = taskbar.getBoundingClientRect().top;

      if (newTop + windowHeight > boundaryLimitTop) {
          newTop = boundaryLimitTop - windowHeight;
      }

      if (newTop < 0) newTop = 0;

      savedLeft = `${newLeft}px`;
      savedTop = `${newTop}px`;
      windowEl.style.left = savedLeft;
      windowEl.style.top = savedTop;
    }

    function onMouseUp() {
      if (!isDragging) return;
      isDragging = false;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      bringToFront(windowEl);
    }

    windowEl.querySelector('.btn-minimize').addEventListener('click', (e) => {
        e.stopPropagation();
        windowEl.style.display = 'none';
    });

    if (maxBtn) {
        maxBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleMaximize();
        });
    }

    windowEl.querySelector('.btn-close').addEventListener('click', (e) => {
        e.stopPropagation();
        if (isImageWindow) {
            windowEl.remove();
            taskBtn.remove();
            imageWindowMap.delete(windowEl.id);
            renameActiveImagePanes();
        } else {
            windowEl.style.display = 'none';
        }
    });

    return taskBtn;
  }

  windowsList.forEach(windowEl => {
      setupWindowLogic(windowEl, false);
  });

  applyDefaultLayout();
  reorderBtn.addEventListener('click', applyDefaultLayout);

  function updateClock() {
      const clockElement = document.getElementById('taskbar-clock');
      const now = new Date();
      let hours = now.getHours();
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      clockElement.innerText = `${hours}:${minutes} ${ampm}`;
  }
  updateClock();
  setInterval(updateClock, 1000);

function renameActiveImagePanes() {
    const activeImageWindows = Array.from(document.querySelectorAll("div.window[id^='win-uploaded-']"));
    activeImageWindows.sort((a, b) => a.id.localeCompare(b.id));

    activeImageWindows.forEach((win, index) => {
        const newNumber = index + 1;
        const titleTextEl = win.querySelector('.title-bar-text');
        if (titleTextEl) {
            titleTextEl.innerHTML = `<span class="win-icon icon-image"></span>IMAGE PANE #${newNumber}`;
        }

        const associatedTaskBtn = imageWindowMap.get(win.id);
        if (associatedTaskBtn) {
            associatedTaskBtn.innerHTML = `<span class="taskbar-icon icon-image"></span>IMAGE PANE #${newNumber}`;
        }
    });
}

  // Handle Dynamic Upload limits securely
  document.getElementById('image-uploader').addEventListener('change', function(e) {
      const files = Array.from(e.target.files);
      if (files.length === 0) return;

      const currentCount = document.querySelectorAll("div.window[id^='win-uploaded-']").length;
      const allowedSlots = 4 - currentCount;

      if (allowedSlots <= 0) {
          alert("Maximum limit of 4 image panes reached. Close an existing pane to add a new one.");
          e.target.value = '';
          return;
      }

      const filesToProcess = files.slice(0, allowedSlots);

      if (files.length > allowedSlots) {
          alert(`Only ${allowedSlots} image pane(s) could be added. The rest were skipped to respect the 4-pane limit.`);
      }

      filesToProcess.forEach((file, index) => {
          const reader = new FileReader();
          reader.onload = function(event) {
              const assignedNum = document.querySelectorAll("div.window[id^='win-uploaded-']").length + 1;
              const secureTimestampId = Date.now() + "-" + index + "-" + Math.random().toString(36).substr(2, 5);

              const newWindow = document.createElement('div');
              newWindow.className = 'window glass active';
              newWindow.id = `win-uploaded-${secureTimestampId}`;

              newWindow.style.left = `${80 + (assignedNum * 25)}px`;
              newWindow.style.top = `${120 + (assignedNum * 25)}px`;
              newWindow.style.width = '300px';
              newWindow.style.height = '300px';
              newWindow.style.zIndex = ++highestZ;

              newWindow.innerHTML = `
                <div class="title-bar">
                  <div class="title-bar-text"><span class="win-icon icon-image"></span>IMAGE PANE #${assignedNum}</div>
                  <div class="title-bar-controls">
                    <button aria-label="Minimize" class="btn-minimize"></button>
                    <button aria-label="Maximize" class="btn-maximize"></button>
                    <button aria-label="Close" class="btn-close"></button>
                  </div>
                </div>
                <div class="window-body" style="padding:0; display:flex; justify-content:center; align-items:center; background:#000;">
                   <img src="${event.target.result}" class="uploaded-img-frame" alt="User upload image container">
                </div>
              `;

              document.body.appendChild(newWindow);

              const assignedTaskBtn = setupWindowLogic(newWindow, true);
              assignedTaskBtn.dataset.windowLink = `win-uploaded-${secureTimestampId}`;

              renameActiveImagePanes();
          };
          reader.readAsDataURL(file);
      });

      e.target.value = '';
  });


  function createDesktopIcon(container, options) {
    options = options || {};
    const label = options.label || '';
    const src = options.src || '';
    const startCol = options.col || 0;
    const startRow = options.row || 0;

    const CELL_W = 75;
    const CELL_H = 64;
    const MARGIN = 6;

    if (!container._desktopIcons) container._desktopIcons = [];
    const icons = container._desktopIcons;

    const icon = document.createElement('div');
    icon.className = 'icon';
    icon.tabIndex = 0;
    icon.innerHTML =
      '<div class="icon-image"><img src="' + src + '" alt="" width="48" height="48"></div>' +
      '<div class="icon-label"></div>';
    icon.querySelector('.icon-label').textContent = label;

    container.appendChild(icon);
    icons.push(icon);

    function cellOf(x, y) {
      const col = Math.round((x - MARGIN) / CELL_W);
      const row = Math.round((y - MARGIN) / CELL_H);
      const maxCol = Math.floor((container.clientWidth - MARGIN - 74) / CELL_W);
      const maxRow = Math.floor((container.clientHeight - MARGIN - 76) / CELL_H);
      return {
        col: Math.min(Math.max(col, 0), Math.max(maxCol, 0)),
        row: Math.min(Math.max(row, 0), Math.max(maxRow, 0))
      };
    }

    function cellToPos(col, row) {
      return { x: MARGIN + col * CELL_W, y: MARGIN + row * CELL_H };
    }

    function isCellTaken(col, row, excludeIcon) {
      return icons.some(other => {
        if (other === excludeIcon) return false;
        const ox = parseFloat(other.style.left);
        const oy = parseFloat(other.style.top);
        const oc = cellOf(ox, oy);
        return oc.col === col && oc.row === row;
      });
    }

    function nearestFreeCell(col, row, excludeIcon) {
      if (!isCellTaken(col, row, excludeIcon)) return { col, row };

      const maxCol = Math.floor((container.clientWidth - MARGIN - 74) / CELL_W);
      const maxRow = Math.floor((container.clientHeight - MARGIN - 76) / CELL_H);

      for (let radius = 1; radius < maxCol + maxRow + 2; radius++) {
        for (let dRow = -radius; dRow <= radius; dRow++) {
          for (let dCol = -radius; dCol <= radius; dCol++) {
            if (Math.max(Math.abs(dRow), Math.abs(dCol)) !== radius) continue;
            const c = col + dCol;
            const r = row + dRow;
            if (c < 0 || r < 0 || c > maxCol || r > maxRow) continue;
            if (!isCellTaken(c, r, excludeIcon)) return { col: c, row: r };
          }
        }
      }
      return { col, row };
    }

    const startFree = nearestFreeCell(startCol, startRow, icon);
    const initial = cellToPos(startFree.col, startFree.row);
    icon.style.left = initial.x + 'px';
    icon.style.top = initial.y + 'px';

    let dragState = null;

    icon.addEventListener('mousedown', (e) => {
      e.preventDefault();
      icons.forEach(i => i.classList.remove('selected'));
      icon.classList.add('selected');
      icon.focus();

      const rect = icon.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();

      dragState = {
        offsetX: e.clientX - rect.left,
        offsetY: e.clientY - rect.top,
        containerRect
      };

      icon.classList.add('dragging');
    });

    document.addEventListener('mousemove', (e) => {
      if (!dragState) return;
      const { offsetX, offsetY, containerRect } = dragState;

      let x = e.clientX - containerRect.left - offsetX;
      let y = e.clientY - containerRect.top - offsetY;

      x = Math.min(Math.max(x, 0), container.clientWidth - icon.offsetWidth);
      y = Math.min(Math.max(y, 0), container.clientHeight - icon.offsetHeight);

      icon.style.left = x + 'px';
      icon.style.top = y + 'px';
    });

    document.addEventListener('mouseup', () => {
      if (!dragState) return;
      icon.classList.remove('dragging');

      const x = parseFloat(icon.style.left);
      const y = parseFloat(icon.style.top);
      const target = cellOf(x, y);
      const free = nearestFreeCell(target.col, target.row, icon);
      const pos = cellToPos(free.col, free.row);

      icon.style.left = pos.x + 'px';
      icon.style.top = pos.y + 'px';

      dragState = null;
    });

    return icon;
  }

  document.addEventListener('mousedown', (e) => {
    if (e.target.id === 'container') {
      (e.target._desktopIcons || []).forEach(i => i.classList.remove('selected'));
    }
  });

  // Auto-build icons from any .icon-template divs found in the HTML above.
  // Edit data-label and data-src on those divs to change name/icon —
  // no JavaScript editing required.
  (function () {
    const container = document.getElementById('container');
    const templates = Array.from(container.querySelectorAll('.icon-template'));
    templates.forEach(t => t.remove());
    templates.forEach(t => {
      createDesktopIcon(container, {
        label: t.dataset.label || '',
        src: t.dataset.src || ''
      });
    });
  })();




  //make the cat meow
  var meowMp3 = 'https://cdn.jsdelivr.net/gh/Dave-031/Newdemo@3a243dc331b07cf2a7c473f9bed6af732319ce17/cat_anim/meow%20PLUS%20FADE%20AND%20SLOWED%2BREVERBED%20AND%20CHOPPED%20NOT%20SLOPPED%20CUH.mp3'
  //play a meow
  function Meow() {
  const audio = new Audio(meowMp3); // Create a new Audio object
  audio.play()                       // Start playback
      .catch(error => {
          console.error("Playback failed. A user interaction is required first:", error);
      });
    }
  // ---- Taskbar cat: animated sprite you can slide left/right along the taskbar ----
  (function setupTaskbarCat() {
      const catEl = document.getElementById('taskbar-cat');
      const taskbarEl = document.getElementById('taskbar');
      if (!catEl || !taskbarEl) return;

      let isDraggingCat = false;
      let dragStartX = 0;
      let catStartLeft = 0;



      function clampCatLeft(left) {
          const maxLeft = taskbarEl.clientWidth - catEl.offsetWidth;
          if (left < 0) return 0;
          if (left > maxLeft) return maxLeft;
          return left;
      }

      // Keep the cat inside the taskbar if the window gets resized
      window.addEventListener('resize', () => {
          catEl.style.left = clampCatLeft(catEl.offsetLeft) + 'px';
      });

      catEl.addEventListener('mousedown', (e) => {
          Meow()
          isDraggingCat = true;
          dragStartX = e.clientX;
          catStartLeft = catEl.offsetLeft;
          catEl.classList.add('dragging');
          e.preventDefault();
      });

      document.addEventListener('mousemove', (e) => {
          if (!isDraggingCat) return;
          const deltaX = e.clientX - dragStartX;
          const newLeft = clampCatLeft(catStartLeft + deltaX);
          catEl.style.left = newLeft + 'px';
      });

      document.addEventListener('mouseup', () => {
          if (!isDraggingCat) return;
          isDraggingCat = false;
          catEl.classList.remove('dragging');
      });

      // Touch support so it can be dragged on mobile too
      catEl.addEventListener('touchstart', (e) => {
          const touch = e.touches[0];
          isDraggingCat = true;
          dragStartX = touch.clientX;
          catStartLeft = catEl.offsetLeft;
          catEl.classList.add('dragging');
      }, { passive: true });

      document.addEventListener('touchmove', (e) => {
          if (!isDraggingCat) return;
          const touch = e.touches[0];
          const deltaX = touch.clientX - dragStartX;
          const newLeft = clampCatLeft(catStartLeft + deltaX);
          catEl.style.left = newLeft + 'px';
      }, { passive: true });

      document.addEventListener('touchend', () => {
          if (!isDraggingCat) return;
          isDraggingCat = false;
          catEl.classList.remove('dragging');
      });

      // Make sure the cat starts inside taskbar bounds
      catEl.style.left = clampCatLeft(catEl.offsetLeft) + 'px';
  })();

  (function setupChangelogs() {
      const CHANGELOG_URL = 'https://gist.githubusercontent.com/Dave-031/2137f840bf18a9b43b722f0bacaab332/raw/changelogs.json';

      const listEl = document.getElementById('changelog-list');
      const statusEl = document.getElementById('changelog-status');
      const searchEl = document.getElementById('changelog-search');
      if (!listEl || !searchEl) return;

      let changelogData = [];

      function renderChangelogs(filterText) {
          const term = (filterText || '').trim().toLowerCase();
          listEl.innerHTML = '';

          const filtered = !term ? changelogData : changelogData.filter(entry => {
              const haystack = [entry.version || '', entry.date || '', ...(entry.changes || [])].join(' ').toLowerCase();
              return haystack.includes(term);
          });

          if (filtered.length === 0) {
              const emptyMsg = document.createElement('p');
              emptyMsg.style.fontSize = '30px';
              emptyMsg.style.color = '#444';
              emptyMsg.style.margin = '0';
              emptyMsg.innerText = 'No changelog entries match your search.';
              listEl.appendChild(emptyMsg);
              return;
          }

          filtered.forEach(entry => {
              const fieldset = document.createElement('fieldset');
              fieldset.style.margin = '0';
              fieldset.style.padding = '10px 12px';
              fieldset.style.flexShrink = '0';

              const legend = document.createElement('legend');
              legend.style.fontWeight = 'bold';
              legend.style.fontSize = '17px';
              legend.innerText = (entry.version || '') + ' — ' + (entry.date || '');
              fieldset.appendChild(legend);

              const ul = document.createElement('ul');
              ul.style.margin = '4px 0 0 0';
              ul.style.paddingLeft = '18px';
              ul.style.fontSize = '14px';
              ul.style.lineHeight = '1.5';

              (entry.changes || []).forEach(change => {
                  const li = document.createElement('li');
                  li.innerText = change;
                  ul.appendChild(li);
              });

              fieldset.appendChild(ul);
              listEl.appendChild(fieldset);
          });
      }

        function loadChangelogs() {
            fetch(CHANGELOG_URL)
                .then(res => {
                    if (!res.ok) throw new Error('Bad response');
                    return res.json();
                })
                .then(data => {
                    changelogData = Array.isArray(data) ? data : [];
                    if (statusEl) statusEl.style.display = 'none';
                    renderChangelogs(searchEl.value);
                })
                .catch(() => {
                    changelogData = [];
                    listEl.innerHTML = '';
                    if (statusEl) {
                        statusEl.style.display = 'block';
                        statusEl.innerText = 'Failed to fetch.';
                    }
                });
        }

      searchEl.addEventListener('input', () => renderChangelogs(searchEl.value));

      loadChangelogs();
  })();


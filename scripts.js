    const form = document.getElementById('codeForm');
    const input = document.getElementById('codeInput');
    const batchInput = document.getElementById('batchInput');
    const batchSlash = document.getElementById('batchSlash');
    const addBatchToggle = document.getElementById('addBatchToggle');
    const clearInputBtn = document.getElementById('clearInputBtn');
    
    const btnBarcode = document.getElementById('btnBarcode');
    const btnQR = document.getElementById('btnQR');
    const btnFavorites = document.getElementById('btnFavorites');
    const btnCollection = document.getElementById('btnCollection');
    const codeGrid = document.getElementById('codeGrid');
    const hideToggle = document.getElementById('hideToggle');
    const darkModeToggle = document.getElementById('darkModeToggle');
    const sortSelect = document.getElementById('sortSelect');

    // Settings Cog elements & Toggles
    const settingsCogBtn = document.getElementById('settingsCogBtn');
    const settingsMenu = document.getElementById('settingsMenu');
    const promptCollectionToggle = document.getElementById('promptCollectionToggle');
    const defaultActionWrapper = document.getElementById('defaultActionWrapper');
    const defaultActionSelect = document.getElementById('defaultActionSelect');
    
    // Delete All Modal elements
    const deleteAllBtn = document.getElementById('deleteAllBtn');
    const confirmModal = document.getElementById('confirmModal');
    const confirmYes = document.getElementById('confirmYes');
    const confirmNo = document.getElementById('confirmNo');

    // Save Collection Modal elements
    const collectionModal = document.getElementById('collectionModal');
    const collectionNameInput = document.getElementById('collectionNameInput');
    const collectionSave = document.getElementById('collectionSave');
    const collectionCancel = document.getElementById('collectionCancel');
    const collectionsContainer = document.getElementById('collectionsContainer');
    const collectionsList = document.getElementById('collectionsList');

    // Load Collection Modal elements
    const loadCollectionModal = document.getElementById('loadCollectionModal');
    const loadCollectionTargetName = document.getElementById('loadCollectionTargetName');
    const loadReplaceBtn = document.getElementById('loadReplaceBtn');
    const loadAppendBtn = document.getElementById('loadAppendBtn');
    const loadCancelBtn = document.getElementById('loadCancelBtn');
    let collectionToLoad = null;

    // Delete Single Collection Modal elements
    const deleteCollectionModal = document.getElementById('deleteCollectionModal');
    const deleteCollectionTargetName = document.getElementById('deleteCollectionTargetName');
    const deleteCollectionYes = document.getElementById('deleteCollectionYes');
    const deleteCollectionNo = document.getElementById('deleteCollectionNo');
    let collectionToDelete = null;

    // Share Collection Modal elements
    const shareModal = document.getElementById('shareModal');
    const shareCollectionName = document.getElementById('shareCollectionName');
    const shareUrlInput = document.getElementById('shareUrlInput');
    const shareCopyBtn = document.getElementById('shareCopyBtn');
    const shareCloseBtn = document.getElementById('shareCloseBtn');

    // SVG String Templates
    const SVG_SHARE_ICON = `<svg viewBox="0 0 24 24"><path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/></svg>`;
    const SVG_HEART_ICON = `<svg viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>`;

    // Image URL for Chuck Testa easter egg
    const CHUCK_IMG_URL = "https://preview.redd.it/another-mens-wearhouse-meme-v0-a0s523g5d4mg1.jpeg?auto=webp&s=6b8a8070a4cd6268581ec5d283e4d1237b8c683d";

    // Storage Keys
    const STORAGE_KEY_CODES = 'saved_generated_codes';
    const STORAGE_KEY_HIDE = 'saved_hide_preference';
    const STORAGE_KEY_DARK = 'saved_dark_mode';
    const STORAGE_KEY_FAVS = 'saved_favorite_codes';
    const STORAGE_KEY_COLLECTIONS = 'saved_collections_list';
    const STORAGE_KEY_SORT = 'saved_sort_preference';
    const STORAGE_KEY_PROMPT_COLLECTION = 'saved_prompt_collection_preference';
    const STORAGE_KEY_DEFAULT_COLLECTION_ACTION = 'saved_default_collection_action';

    // State Objects/Arrays
    let savedCodes = [];
    let savedFavorites = [];
    let savedCollections = {};
    let isCollectionEditMode = false;

    // Special reserved collection key
    const SPECIAL_ALL_KEY = '__ALL_COLLECTIONS__';

    // Helper: Get aggregated list of all items across all collections
    function getAllCollectionsAggregated() {
      const aggregated = [];
      const seenMap = new Map();

      Object.values(savedCollections).forEach(items => {
        if (Array.isArray(items)) {
          items.forEach(item => {
            const key = `${item.type}:${item.value.toLowerCase()}`;
            if (!seenMap.has(key)) {
              seenMap.set(key, true);
              aggregated.push(item);
            }
          });
        }
      });

      return aggregated;
    }

    // Helper: Natural alphanumeric comparison
    function compareAlphanumeric(a, b) {
      return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
    }

    // Helper: Sort array according to current dropdown setting
    function getSortedCodes() {
      const mode = sortSelect.value;
      const sorted = [...savedCodes];

      if (mode === 'asc') {
        sorted.sort((a, b) => compareAlphanumeric(a.value, b.value));
      } else if (mode === 'desc') {
        sorted.sort((a, b) => compareAlphanumeric(b.value, a.value));
      }
      return sorted;
    }

    // Refresh display of the entire grid while maintaining sort order
    function refreshGridDisplay() {
      codeGrid.innerHTML = '';
      const itemsToRender = getSortedCodes();
      
      itemsToRender.forEach(item => {
        renderCodeCard(item.id, item.type, item.value, item.isFav || false);
      });
    }

    // Helper: Check if duplicate exists and highlight it
    function isDuplicate(type, value) {
      const existing = savedCodes.find(item => item.type === type && item.value.toLowerCase() === value.toLowerCase());
      if (existing) {
        const cardElem = document.querySelector(`.code-card[data-id="${existing.id}"]`);
        if (cardElem) {
          cardElem.scrollIntoView({ behavior: 'smooth', block: 'center' });
          cardElem.classList.remove('duplicate-highlight');
          void cardElem.offsetWidth; // Reflow trigger to restart CSS animation
          cardElem.classList.add('duplicate-highlight');
        }
        return true;
      }
      return false;
    }

    // Helper: Save current state to Local Storage
    function saveToLocalStorage() {
      localStorage.setItem(STORAGE_KEY_CODES, JSON.stringify(savedCodes));
      localStorage.setItem(STORAGE_KEY_HIDE, hideToggle.checked);
      localStorage.setItem(STORAGE_KEY_DARK, darkModeToggle.checked);
      localStorage.setItem(STORAGE_KEY_FAVS, JSON.stringify(savedFavorites));
      localStorage.setItem(STORAGE_KEY_COLLECTIONS, JSON.stringify(savedCollections));
      localStorage.setItem(STORAGE_KEY_SORT, sortSelect.value);
      localStorage.setItem(STORAGE_KEY_PROMPT_COLLECTION, promptCollectionToggle.checked);
      localStorage.setItem(STORAGE_KEY_DEFAULT_COLLECTION_ACTION, defaultActionSelect.value);
    }

    // Generate Shareable Link for a collection
    function generateShareUrl(name) {
      const items = savedCollections[name];
      if (!items) return '';
      
      const payload = {
        name: name,
        items: items
      };
      
      const jsonStr = JSON.stringify(payload);
      const encoded = btoa(encodeURIComponent(jsonStr));
      
      const baseUrl = window.location.origin + window.location.pathname;
      return `${baseUrl}?import=${encoded}`;
    }

    // Open Share Modal
    function openShareModal(name) {
      const url = generateShareUrl(name);
      shareCollectionName.textContent = `"${name}"`;
      shareUrlInput.value = url;
      shareCopyBtn.textContent = 'Copy Link';
      shareModal.classList.add('active');
    }

    // Check URL parameters for imported collections on page load
    function checkImportUrl() {
      const urlParams = new URLSearchParams(window.location.search);
      const importData = urlParams.get('import');
      
      if (!importData) return;
      
      try {
        const jsonStr = decodeURIComponent(atob(importData));
        const payload = JSON.parse(jsonStr);
        
        if (payload && payload.name && Array.isArray(payload.items)) {
          savedCollections[payload.name] = payload.items;
          saveToLocalStorage();
          renderCollectionsUI();
          
          handleCollectionClick(payload.name);

          window.history.replaceState({}, document.title, window.location.pathname);
          
          setTimeout(() => {
            alert(`Successfully imported collection "${payload.name}"!`);
          }, 300);
        }
      } catch (err) {
        console.error("Failed to import collection from URL:", err);
      }
    }

    // Helper: Rename Collection Key
    function renameCollection(oldName, newName) {
      const trimmedNewName = newName.trim();
      
      if (!trimmedNewName || trimmedNewName === oldName) return false;
      
      if (trimmedNewName.toLowerCase() === 'all') {
        alert('The name "All" is reserved for viewing all collections.');
        return false;
      }

      if (savedCollections[trimmedNewName]) {
        alert(`A collection named "${trimmedNewName}" already exists.`);
        return false;
      }

      const updatedCollections = {};
      Object.keys(savedCollections).forEach(key => {
        if (key === oldName) {
          updatedCollections[trimmedNewName] = savedCollections[oldName];
        } else {
          updatedCollections[key] = savedCollections[key];
        }
      });

      savedCollections = updatedCollections;
      saveToLocalStorage();
      renderCollectionsUI();
      return true;
    }

    // Render Saved Collections Chips + Edit Toggle Button
    function renderCollectionsUI() {
      collectionsList.innerHTML = '';
      const names = Object.keys(savedCollections);
      
      if (names.length === 0) {
        collectionsContainer.style.display = 'none';
        isCollectionEditMode = false;
        return;
      }

      collectionsContainer.style.display = 'block';

      if (isCollectionEditMode) {
        collectionsList.classList.add('is-edit-mode');
      } else {
        collectionsList.classList.remove('is-edit-mode');
      }

      // Prepend "All" chip
      const allChip = document.createElement('div');
      allChip.className = 'collection-chip all-chip';
      allChip.innerHTML = '<span>All</span>';
      allChip.addEventListener('click', () => {
        if (!isCollectionEditMode) {
          handleCollectionClick(SPECIAL_ALL_KEY);
        }
      });
      collectionsList.appendChild(allChip);

      // Prepend Edit/Done toggle button styled like the "All" pill
      const editToggleChip = document.createElement('div');
      editToggleChip.className = `collection-chip edit-toggle-chip ${isCollectionEditMode ? 'is-active-mode' : ''}`;
      editToggleChip.innerHTML = `<span>${isCollectionEditMode ? '✓ Done' : 'Edit'}</span>`;
      
      editToggleChip.addEventListener('click', (e) => {
        e.stopPropagation();
        isCollectionEditMode = !isCollectionEditMode;
        renderCollectionsUI();
      });
      collectionsList.appendChild(editToggleChip);

      // Custom Collection Chips
      names.forEach(name => {
        const chip = document.createElement('div');
        chip.className = 'collection-chip custom-chip';
        
        const labelText = document.createElement('span');
        labelText.className = 'collection-label';
        labelText.textContent = name;
        chip.appendChild(labelText);

        if (!isCollectionEditMode) {
          // Share Icon
          const shareBtn = document.createElement('span');
          shareBtn.className = 'share-chip';
          shareBtn.innerHTML = SVG_SHARE_ICON;
          shareBtn.title = `Share collection "${name}"`;
          shareBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            openShareModal(name);
          });
          chip.appendChild(shareBtn);

          // Delete Icon
          const deleteX = document.createElement('span');
          deleteX.className = 'delete-chip';
          deleteX.innerHTML = '&times;';
          deleteX.title = `Delete collection "${name}"`;
          deleteX.addEventListener('click', (e) => {
            e.stopPropagation();
            collectionToDelete = name;
            deleteCollectionTargetName.textContent = `"${name}"`;
            deleteCollectionModal.classList.add('active');
          });
          chip.appendChild(deleteX);

          chip.addEventListener('click', () => {
            handleCollectionClick(name);
          });
        } else {
          // Edit Mode Click Handler -> Inline input transformation
          chip.addEventListener('click', (e) => {
            e.stopPropagation();
            
            if (chip.querySelector('input')) return; // Already editing this chip

            const inputField = document.createElement('input');
            inputField.type = 'text';
            inputField.className = 'collection-rename-input';
            inputField.value = name;

            labelText.replaceWith(inputField);
            inputField.focus();
            inputField.select();

            const commitRename = () => {
              const updatedVal = inputField.value.trim();
              if (updatedVal && updatedVal !== name) {
                if (!renameCollection(name, updatedVal)) {
                  renderCollectionsUI();
                }
              } else {
                renderCollectionsUI();
              }
            };

            inputField.addEventListener('keydown', (ev) => {
              if (ev.key === 'Enter') {
                ev.preventDefault();
                commitRename();
              } else if (ev.key === 'Escape') {
                renderCollectionsUI();
              }
            });

            inputField.addEventListener('blur', () => {
              commitRename();
            });
          });
        }

        collectionsList.appendChild(chip);
      });
    }

    // Decision function when a collection chip is clicked
    function handleCollectionClick(name) {
      const isAll = (name === SPECIAL_ALL_KEY);
      const items = isAll ? getAllCollectionsAggregated() : savedCollections[name];

      if (!items || !items.length) return;

      const displayName = isAll ? 'All Collections' : `"${name}"`;

      // If screen is empty, load directly without prompting
      if (savedCodes.length === 0) {
        loadCollection(name, false);
        return;
      }

      // Check user setting: prompt or auto-action
      if (promptCollectionToggle.checked) {
        collectionToLoad = name;
        loadCollectionTargetName.textContent = displayName;
        loadCollectionModal.classList.add('active');
      } else {
        const replaceCurrent = (defaultActionSelect.value === 'replace');
        loadCollection(name, replaceCurrent);
      }
    }

    // Load a selected collection onto the grid (replace vs append)
    function loadCollection(name, replaceCurrent = false) {
      const isAll = (name === SPECIAL_ALL_KEY);
      const items = isAll ? getAllCollectionsAggregated() : savedCollections[name];

      if (!items || !items.length) return;

      if (replaceCurrent) {
        savedCodes = [];
      }

      items.forEach((item, index) => {
        if (!replaceCurrent && isDuplicate(item.type, item.value)) {
          return;
        }
        const id = Date.now().toString() + index + Math.random().toString(36).substr(2, 3);
        const isFav = checkIsFavorited(item.type, item.value);
        savedCodes.push({ id, type: item.type, value: item.value, isFav });
      });

      refreshGridDisplay();
      saveToLocalStorage();
    }

    // Load State from local storage
    function loadFromLocalStorage() {
      const savedHideState = localStorage.getItem(STORAGE_KEY_HIDE);
      if (savedHideState === 'true') {
        hideToggle.checked = true;
        codeGrid.classList.add('hide-active');
      }

      const savedDarkState = localStorage.getItem(STORAGE_KEY_DARK);
      if (savedDarkState === 'true') {
        darkModeToggle.checked = true;
        document.body.classList.add('dark-mode');
      }

      const savedPromptState = localStorage.getItem(STORAGE_KEY_PROMPT_COLLECTION);
      if (savedPromptState !== null) {
        promptCollectionToggle.checked = (savedPromptState === 'true');
      }
      defaultActionWrapper.style.display = promptCollectionToggle.checked ? 'none' : 'flex';

      const savedDefaultAction = localStorage.getItem(STORAGE_KEY_DEFAULT_COLLECTION_ACTION);
      if (savedDefaultAction && ['append', 'replace'].includes(savedDefaultAction)) {
        defaultActionSelect.value = savedDefaultAction;
      }

      const storedSort = localStorage.getItem(STORAGE_KEY_SORT);
      if (storedSort && ['custom', 'asc', 'desc'].includes(storedSort)) {
        sortSelect.value = storedSort;
      }

      const storedFavs = localStorage.getItem(STORAGE_KEY_FAVS);
      if (storedFavs) {
        try { savedFavorites = JSON.parse(storedFavs); } catch (e) { savedFavorites = []; }
      }

      const storedCollections = localStorage.getItem(STORAGE_KEY_COLLECTIONS);
      if (storedCollections) {
        try { savedCollections = JSON.parse(storedCollections); } catch (e) { savedCollections = {}; }
      }

      renderCollectionsUI();

      const storedData = localStorage.getItem(STORAGE_KEY_CODES);
      if (storedData) {
        try {
          savedCodes = JSON.parse(storedData);
          refreshGridDisplay();
        } catch (e) {
          console.error("Failed to parse stored codes:", e);
          savedCodes = [];
        }
      }

      checkImportUrl();
    }

    // Settings Cog Toggle
    settingsCogBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      settingsMenu.classList.toggle('active');
    });

    document.addEventListener('click', (e) => {
      if (!settingsMenu.contains(e.target) && e.target !== settingsCogBtn) {
        settingsMenu.classList.remove('active');
      }
    });

    darkModeToggle.addEventListener('change', () => {
      if (darkModeToggle.checked) {
        document.body.classList.add('dark-mode');
      } else {
        document.body.classList.remove('dark-mode');
      }
      saveToLocalStorage();
    });

    promptCollectionToggle.addEventListener('change', () => {
      defaultActionWrapper.style.display = promptCollectionToggle.checked ? 'none' : 'flex';
      saveToLocalStorage();
    });

    defaultActionSelect.addEventListener('change', () => {
      saveToLocalStorage();
    });

    sortSelect.addEventListener('change', () => {
      refreshGridDisplay();
      saveToLocalStorage();
    });

    addBatchToggle.addEventListener('change', () => {
      const isBatchActive = addBatchToggle.checked;
      batchInput.style.display = isBatchActive ? 'block' : 'none';
      batchSlash.style.display = isBatchActive ? 'inline-block' : 'none';
      input.placeholder = isBatchActive ? 'Main Code...' : 'Type text, numbers, or URL...';
      updateClearButtonVisibility();
    });

    function updateClearButtonVisibility() {
      const hasContent = input.value.trim() || (addBatchToggle.checked && batchInput.value.trim());
      clearInputBtn.style.display = hasContent ? 'block' : 'none';
    }

    input.addEventListener('input', updateClearButtonVisibility);
    batchInput.addEventListener('input', updateClearButtonVisibility);

    clearInputBtn.addEventListener('click', () => {
      input.value = '';
      batchInput.value = '';
      updateClearButtonVisibility();
      input.focus();
    });

    hideToggle.addEventListener('change', () => {
      if (hideToggle.checked) {
        codeGrid.classList.add('hide-active');
      } else {
        codeGrid.classList.remove('hide-active');
      }
      saveToLocalStorage();
    });

    shareCloseBtn.addEventListener('click', () => {
      shareModal.classList.remove('active');
    });

    shareCopyBtn.addEventListener('click', () => {
      shareUrlInput.select();
      navigator.clipboard.writeText(shareUrlInput.value).then(() => {
        shareCopyBtn.textContent = 'Copied!';
        setTimeout(() => {
          shareCopyBtn.textContent = 'Copy Link';
        }, 2000);
      });
    });

    shareModal.addEventListener('click', (e) => {
      if (e.target === shareModal) {
        shareModal.classList.remove('active');
      }
    });

    deleteAllBtn.addEventListener('click', () => {
      if (savedCodes.length === 0) return;
      confirmModal.classList.add('active');
    });

    confirmNo.addEventListener('click', () => {
      confirmModal.classList.remove('active');
    });

    confirmYes.addEventListener('click', () => {
      codeGrid.innerHTML = '';
      savedCodes = [];
      saveToLocalStorage();
      confirmModal.classList.remove('active');
    });

    confirmModal.addEventListener('click', (e) => {
      if (e.target === confirmModal) {
        confirmModal.classList.remove('active');
      }
    });

    /* Load Collection Modal Handler listeners */
    loadReplaceBtn.addEventListener('click', () => {
      if (collectionToLoad) {
        loadCollection(collectionToLoad, true);
      }
      loadCollectionModal.classList.remove('active');
      collectionToLoad = null;
    });

    loadAppendBtn.addEventListener('click', () => {
      if (collectionToLoad) {
        loadCollection(collectionToLoad, false);
      }
      loadCollectionModal.classList.remove('active');
      collectionToLoad = null;
    });

    loadCancelBtn.addEventListener('click', () => {
      loadCollectionModal.classList.remove('active');
      collectionToLoad = null;
    });

    loadCollectionModal.addEventListener('click', (e) => {
      if (e.target === loadCollectionModal) {
        loadCollectionModal.classList.remove('active');
        collectionToLoad = null;
      }
    });

    deleteCollectionNo.addEventListener('click', () => {
      deleteCollectionModal.classList.remove('active');
      collectionToDelete = null;
    });

    deleteCollectionYes.addEventListener('click', () => {
      if (collectionToDelete && savedCollections[collectionToDelete]) {
        delete savedCollections[collectionToDelete];
        saveToLocalStorage();
        renderCollectionsUI();
      }
      deleteCollectionModal.classList.remove('active');
      collectionToDelete = null;
    });

    deleteCollectionModal.addEventListener('click', (e) => {
      if (e.target === deleteCollectionModal) {
        deleteCollectionModal.classList.remove('active');
        collectionToDelete = null;
      }
    });

    btnCollection.addEventListener('click', () => {
      if (savedCodes.length === 0) {
        alert('Please generate at least one code before creating a collection.');
        return;
      }
      collectionNameInput.value = '';
      collectionModal.classList.add('active');
      collectionNameInput.focus();
    });

    collectionCancel.addEventListener('click', () => {
      collectionModal.classList.remove('active');
    });

    function saveCurrentCollection() {
      const name = collectionNameInput.value.trim();
      if (!name) {
        collectionNameInput.reportValidity();
        return;
      }

      if (name.toLowerCase() === 'all') {
        alert('The name "All" is reserved for viewing all collections. Please choose a different name.');
        return;
      }

      savedCollections[name] = savedCodes.map(item => ({
        type: item.type,
        value: item.value
      }));

      saveToLocalStorage();
      renderCollectionsUI();
      collectionModal.classList.remove('active');
    }

    collectionSave.addEventListener('click', saveCurrentCollection);
    
    collectionNameInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        saveCurrentCollection();
      }
    });

    collectionModal.addEventListener('click', (e) => {
      if (e.target === collectionModal) {
        collectionModal.classList.remove('active');
      }
    });

    function toggleFavorite(id, type, value, favBtn) {
      const index = savedFavorites.findIndex(fav => fav.type === type && fav.value.toLowerCase() === value.toLowerCase());
      
      if (index > -1) {
        savedFavorites.splice(index, 1);
        favBtn.classList.remove('is-fav');
        favBtn.title = 'Add to Favorites';
      } else {
        savedFavorites.push({ type, value });
        favBtn.classList.add('is-fav');
        favBtn.title = 'Remove from Favorites';
      }

      const codeItem = savedCodes.find(item => item.id === id);
      if (codeItem) {
        codeItem.isFav = index === -1;
      }

      saveToLocalStorage();
    }

    function checkIsFavorited(type, value) {
      return savedFavorites.some(fav => fav.type === type && fav.value.toLowerCase() === value.toLowerCase());
    }

    function renderCodeCard(id, codeType, textValue, isFavInitial = false) {
      const card = document.createElement('div');
      card.className = 'code-card';
      card.dataset.id = id;

      const isFavorited = isFavInitial || checkIsFavorited(codeType, textValue);

      // Heart / Favorite Button (SVG)
      const favBtn = document.createElement('button');
      favBtn.className = `fav-btn ${isFavorited ? 'is-fav' : ''}`;
      favBtn.innerHTML = SVG_HEART_ICON;
      favBtn.title = isFavorited ? 'Remove from Favorites' : 'Add to Favorites';
      favBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleFavorite(id, codeType, textValue, favBtn);
      });
      card.appendChild(favBtn);

      const hiddenOverlay = document.createElement('div');
      hiddenOverlay.className = 'hidden-overlay';

      const typeBadge = document.createElement('span');
      typeBadge.className = `type-badge ${codeType}`;
      
      let badgeLabel = 'Barcode';
      if (codeType === 'qrcode') badgeLabel = 'QR Code';
      if (codeType === 'chuck') badgeLabel = 'Chuck Testa';
      typeBadge.textContent = badgeLabel;

      const hiddenTitle = document.createElement('div');
      hiddenTitle.className = 'hidden-title';
      hiddenTitle.textContent = textValue;

      hiddenOverlay.appendChild(typeBadge);
      hiddenOverlay.appendChild(hiddenTitle);
      card.appendChild(hiddenOverlay);

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'delete-btn';
      deleteBtn.innerHTML = '&times;';
      deleteBtn.title = 'Remove item';
      deleteBtn.addEventListener('click', () => {
        card.remove();
        savedCodes = savedCodes.filter(item => item.id !== id);
        saveToLocalStorage();
      });
      card.appendChild(deleteBtn);

      if (codeType === 'chuck') {
        const chuckWrapper = document.createElement('div');
        chuckWrapper.className = 'chuck-wrapper';

        const img = document.createElement('img');
        img.src = CHUCK_IMG_URL;
        img.alt = 'Chuck Testa';
        img.className = 'chuck-img';

        const label = document.createElement('span');
        label.className = 'chuck-label';
        label.textContent = 'Nope, Chuck Testa!';

        chuckWrapper.appendChild(img);
        chuckWrapper.appendChild(label);
        card.appendChild(chuckWrapper);
        codeGrid.appendChild(card);
      } else if (codeType === 'barcode') {
        const canvasContainer = document.createElement('div');
        canvasContainer.className = 'barcode-canvas-container';

        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        canvasContainer.appendChild(svg);
        card.appendChild(canvasContainer);
        codeGrid.appendChild(card);

        try {
          JsBarcode(svg, textValue, {
            format: "CODE128",
            lineColor: "#000000",
            background: "#ffffff",
            width: 2,
            height: 70,
            displayValue: true,
            fontSize: 14,
            margin: 4
          });
        } catch (err) {
          card.remove();
          return false;
        }
      } else if (codeType === 'qrcode') {
        const qrContainer = document.createElement('div');
        qrContainer.className = 'qr-wrapper';
        
        const qrBox = document.createElement('div');
        const label = document.createElement('span');
        label.className = 'qr-label';
        label.textContent = textValue;

        qrContainer.appendChild(qrBox);
        qrContainer.appendChild(label);
        card.appendChild(qrContainer);
        codeGrid.appendChild(card);

        try {
          new QRCode(qrBox, {
            text: textValue,
            width: 120,
            height: 120,
            colorDark: "#000000",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H
          });
        } catch (err) {
          card.remove();
          return false;
        }
      }

      return true;
    }

    function handleCreateCode(codeType) {
      const mainVal = input.value.trim();
      const batchVal = batchInput.value.trim();
      
      let textValue = '';
      if (addBatchToggle.checked) {
        if (mainVal && batchVal) {
          textValue = `${mainVal}/${batchVal}`;
        } else {
          textValue = mainVal || batchVal;
        }
      } else {
        textValue = mainVal;
      }

      if (!textValue) {
        input.reportValidity();
        return;
      }

      const targetType = textValue.toLowerCase() === 'chuck testa' ? 'chuck' : codeType;

      if (isDuplicate(targetType, textValue)) {
        return;
      }

      const id = Date.now().toString() + Math.random().toString(36).substr(2, 4);
      const isFav = checkIsFavorited(targetType, textValue);
      
      savedCodes.unshift({ id, type: targetType, value: textValue, isFav });
      
      refreshGridDisplay();
      saveToLocalStorage();

      input.focus();
    }

    function handleLoadFavorites() {
      if (savedFavorites.length === 0) {
        alert('You do not have any favorite codes saved yet! Click the heart on any card to favorite it.');
        return;
      }

      savedFavorites.forEach((fav, index) => {
        if (!isDuplicate(fav.type, fav.value)) {
          const id = (Date.now() + index).toString() + '-fav';
          savedCodes.unshift({ id, type: fav.type, value: fav.value, isFav: true });
        }
      });

      refreshGridDisplay();
      saveToLocalStorage();
    }

    btnBarcode.addEventListener('click', () => handleCreateCode('barcode'));
    btnQR.addEventListener('click', () => handleCreateCode('qrcode'));
    btnFavorites.addEventListener('click', handleLoadFavorites);

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      handleCreateCode('barcode');
    });

    loadFromLocalStorage();
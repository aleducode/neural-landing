(function () {
  'use strict';

  // SHA-256 of the admin password - change this hash to change the password
  // Default password: "neural2024"
  var PASSWORD_HASH = 'ec7580de04b8791de31eeb354e3b903fe359d84318d08ed04bdcc9afa49de32a';
  var STORAGE_KEY = 'neural_admin_profes';
  var SESSION_KEY = 'neural_admin_auth';
  var API_URL = '/api/profes';
  var DATA_URL = 'data/profes.json';
  var MAX_PHOTO_SIZE = 2 * 1024 * 1024;
  var MAX_PHOTO_WIDTH = 800;

  var profes = [];
  var deleteTargetId = null;
  var editModal = null;
  var deleteModal = null;

  // ── Icons (inline SVG) ──

  var icons = {
    chevronUp: '<svg class="icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5"/></svg>',
    chevronDown: '<svg class="icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5"/></svg>',
    pencil: '<svg class="icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125"/></svg>',
    trash: '<svg class="icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"/></svg>',
    user: '<svg class="icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"/></svg>',
    facebook: '<svg class="icon-sm" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>',
    instagram: '<svg class="icon-sm" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>'
  };

  // ── Utilities ──

  function generateId() {
    return 'prof-' + Date.now().toString(36) + Math.random().toString(36).substr(2, 4);
  }

  function padNumber(n) {
    return n < 10 ? '0' + n : '' + n;
  }

  async function sha256(text) {
    var encoder = new TextEncoder();
    var data = encoder.encode(text);
    var hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash)).map(function (b) {
      return b.toString(16).padStart(2, '0');
    }).join('');
  }

  function resizeImage(file, maxWidth) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function (e) {
        var img = new Image();
        img.onload = function () {
          var width = img.width;
          var height = img.height;
          if (width > maxWidth) {
            height = Math.round(height * maxWidth / width);
            width = maxWidth;
          }
          var canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          var ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          var dataUrl = canvas.toDataURL('image/webp', 0.85);
          if (dataUrl.indexOf('data:image/webp') === -1) {
            dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          }
          resolve(dataUrl);
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ── Data ──

  function saveDraft() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ profes: profes }));
    showUnsavedIndicator(true);
  }

  function loadDraft() {
    var draft = localStorage.getItem(STORAGE_KEY);
    if (draft) {
      try {
        var data = JSON.parse(draft);
        if (data.profes && data.profes.length > 0) return data.profes;
      } catch (e) { /* ignore */ }
    }
    return null;
  }

  function clearDraft() {
    localStorage.removeItem(STORAGE_KEY);
    showUnsavedIndicator(false);
  }

  async function loadFromServer() {
    // Try KV API first
    try {
      var response = await fetch(API_URL);
      if (response.ok) {
        var data = await response.json();
        if (data.profes && data.profes.length > 0) return data.profes;
      }
    } catch (e) { /* API unavailable */ }

    // Fallback to static JSON
    try {
      var response2 = await fetch(DATA_URL);
      var data2 = await response2.json();
      return data2.profes || [];
    } catch (e) {
      console.error('Error loading profes:', e);
      return [];
    }
  }

  function showUnsavedIndicator(show) {
    var el = document.getElementById('unsaved-indicator');
    if (!el) return;
    if (show) {
      el.classList.remove('hidden');
      el.style.display = 'flex';
    } else {
      el.classList.add('hidden');
    }
  }

  // ── Toast ──

  function showToast(message, type) {
    var existing = document.getElementById('admin-toast');
    if (existing) existing.remove();

    var toast = document.createElement('div');
    toast.id = 'admin-toast';
    toast.className = 'admin-toast admin-toast-' + (type || 'success');
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(function () { toast.classList.add('show'); }, 10);
    setTimeout(function () {
      toast.classList.remove('show');
      setTimeout(function () { toast.remove(); }, 300);
    }, 3000);
  }

  // ── Publish ──

  async function publishToServer() {
    var pwd = sessionStorage.getItem('neural_admin_pwd');
    if (!pwd) {
      pwd = prompt('Contraseña de admin para publicar:');
      if (!pwd) return;
    }

    var sorted = profes.slice().sort(function (a, b) { return a.order - b.order; });
    sorted.forEach(function (p, i) { p.order = i + 1; });
    var payload = JSON.stringify({ profes: sorted });

    var publishBtn = document.getElementById('btn-publish');
    if (publishBtn) {
      publishBtn.disabled = true;
      publishBtn.textContent = 'Publicando...';
    }

    try {
      var response = await fetch(API_URL, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Key': pwd
        },
        body: payload
      });

      if (response.status === 401) {
        sessionStorage.removeItem('neural_admin_pwd');
        showToast('Contraseña incorrecta', 'error');
        return;
      }

      if (!response.ok) throw new Error('HTTP ' + response.status);

      // Save password for session so we don't ask again
      sessionStorage.setItem('neural_admin_pwd', pwd);
      clearDraft();
      showToast('Publicado correctamente');
    } catch (e) {
      console.error('Publish error:', e);
      showToast('Error al publicar: ' + e.message, 'error');
    } finally {
      if (publishBtn) {
        publishBtn.disabled = false;
        publishBtn.innerHTML = '<svg class="icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z"/></svg> Publicar';
      }
    }
  }

  // ── Auth ──

  async function handleLogin(e) {
    e.preventDefault();
    var pwd = document.getElementById('login-password').value;
    var hash = await sha256(pwd);
    if (hash === PASSWORD_HASH) {
      sessionStorage.setItem(SESSION_KEY, '1');
      showAdmin();
    } else {
      document.getElementById('login-error').classList.add('show');
      document.getElementById('login-password').value = '';
      document.getElementById('login-password').focus();
    }
  }

  function checkAuth() {
    return sessionStorage.getItem(SESSION_KEY) === '1';
  }

  function showAdmin() {
    document.getElementById('login-screen').classList.add('hidden');
    var panel = document.getElementById('admin-panel');
    panel.classList.remove('hidden');
    panel.style.display = '';
    initAdmin();
  }

  // ── Render Prof List ──

  function renderProfList() {
    var container = document.getElementById('prof-list');
    if (!container) return;

    var sorted = profes.slice().sort(function (a, b) { return a.order - b.order; });

    if (sorted.length === 0) {
      container.innerHTML = '<div class="empty-state"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z"/></svg><p>No hay profes todavía</p></div>';
      return;
    }

    container.innerHTML = sorted.map(function (prof, i) {
      var photoHtml = prof.photo
        ? '<img src="' + escapeHtml(prof.photo) + '" alt="" class="prof-avatar">'
        : '<div class="prof-avatar-placeholder">' + icons.user + '</div>';

      var upDisabled = i === 0 ? ' disabled style="opacity:0.3;pointer-events:none;"' : '';
      var downDisabled = i === sorted.length - 1 ? ' disabled style="opacity:0.3;pointer-events:none;"' : '';

      return '<div class="prof-item" data-id="' + prof.id + '">' +
        '<div class="order-num">' + (i + 1) + '</div>' +
        photoHtml +
        '<div class="prof-info">' +
          '<div class="prof-name">' + escapeHtml(prof.name) + '</div>' +
          '<div class="prof-role">' + escapeHtml(prof.role) + '</div>' +
        '</div>' +
        '<div class="prof-actions">' +
          '<button class="btn-sh btn-sh-ghost btn-sh-icon"' + upDisabled + ' onclick="Admin.moveProf(\'' + prof.id + '\',-1)" title="Subir">' + icons.chevronUp + '</button>' +
          '<button class="btn-sh btn-sh-ghost btn-sh-icon"' + downDisabled + ' onclick="Admin.moveProf(\'' + prof.id + '\',1)" title="Bajar">' + icons.chevronDown + '</button>' +
          '<button class="btn-sh btn-sh-ghost btn-sh-icon" onclick="Admin.editProf(\'' + prof.id + '\')" title="Editar">' + icons.pencil + '</button>' +
          '<button class="btn-sh btn-sh-ghost btn-sh-icon" onclick="Admin.deleteProf(\'' + prof.id + '\')" title="Eliminar" style="color:var(--destructive);">' + icons.trash + '</button>' +
        '</div>' +
      '</div>';
    }).join('');
  }

  // ── Preview ──

  var activePreviewTab = 0;

  function renderPreview() {
    var sorted = profes.slice().sort(function (a, b) { return a.order - b.order; });
    var tabsContainer = document.getElementById('preview-tabs');
    var navContainer = document.getElementById('preview-nav');
    if (!tabsContainer || !navContainer) return;

    if (sorted.length === 0) {
      tabsContainer.innerHTML = '<div class="empty-state" style="padding:2rem;"><p>Sin profes para previsualizar</p></div>';
      navContainer.innerHTML = '';
      return;
    }

    if (activePreviewTab >= sorted.length) activePreviewTab = 0;

    tabsContainer.innerHTML = sorted.map(function (prof, i) {
      var num = padNumber(i + 1);
      var activeClass = i === activePreviewTab ? ' active' : '';
      var socialHtml = '';
      if (prof.social) {
        var items = '';
        if (prof.social.facebook) items += '<a href="' + escapeHtml(prof.social.facebook) + '" target="_blank" title="Facebook">' + icons.facebook + '</a>';
        if (prof.social.instagram) items += '<a href="' + escapeHtml(prof.social.instagram) + '" target="_blank" title="Instagram">' + icons.instagram + '</a>';
        if (items) socialHtml = '<div class="socials">' + items + '</div>';
      }

      var photoStyle = prof.photo ? 'background-image:url(\'' + escapeHtml(prof.photo) + '\');' : 'background:var(--muted);';

      return '<div class="preview-tab-pane' + activeClass + '" data-tab="' + i + '">' +
        '<div class="preview-item">' +
          '<div class="preview-text">' +
            '<h3>' + escapeHtml(prof.name) + '</h3>' +
            '<div class="role">' + escapeHtml(prof.role) + '</div>' +
            '<p>' + escapeHtml(prof.description) + '</p>' +
            socialHtml +
          '</div>' +
          '<div class="preview-photo" style="' + photoStyle + '">' +
            '<div class="num">' + num + '.</div>' +
          '</div>' +
        '</div>' +
      '</div>';
    }).join('');

    navContainer.innerHTML = sorted.map(function (prof, i) {
      var activeClass = i === activePreviewTab ? ' active' : '';
      return '<button class="' + activeClass + '" onclick="Admin.switchPreview(' + i + ')">' +
        escapeHtml(prof.name.split(' ')[0]) +
      '</button>';
    }).join('');
  }

  function switchPreview(index) {
    activePreviewTab = index;
    renderPreview();
  }

  // ── CRUD ──

  function openEditModal(prof) {
    document.getElementById('editModalTitle').textContent = prof ? 'Editar Profe' : 'Nuevo Profe';
    document.getElementById('editModalDesc').textContent = prof ? 'Modifica la información de ' + prof.name : 'Completa la información del nuevo profesor';
    document.getElementById('prof-id').value = prof ? prof.id : '';
    document.getElementById('prof-name').value = prof ? prof.name : '';
    document.getElementById('prof-desc').value = prof ? prof.description : '';
    document.getElementById('prof-facebook').value = (prof && prof.social) ? (prof.social.facebook || '') : '';
    document.getElementById('prof-instagram').value = (prof && prof.social) ? (prof.social.instagram || '') : '';
    document.getElementById('prof-photo-path').value = '';

    var roleSelect = document.getElementById('prof-role-select');
    var roleCustom = document.getElementById('prof-role-custom');
    if (prof) {
      var found = false;
      for (var j = 0; j < roleSelect.options.length; j++) {
        if (roleSelect.options[j].value === prof.role) {
          roleSelect.selectedIndex = j;
          found = true;
          break;
        }
      }
      if (!found) {
        roleSelect.value = 'custom';
        roleCustom.classList.remove('hidden');
        roleCustom.value = prof.role;
      } else {
        roleCustom.classList.add('hidden');
        roleCustom.value = '';
      }
    } else {
      roleSelect.selectedIndex = 2;
      roleCustom.classList.add('hidden');
      roleCustom.value = '';
    }

    var preview = document.getElementById('photo-preview');
    var placeholder = document.getElementById('photo-placeholder');
    if (prof && prof.photo) {
      preview.src = prof.photo;
      preview.classList.remove('hidden');
      placeholder.classList.add('hidden');
    } else {
      preview.classList.add('hidden');
      placeholder.classList.remove('hidden');
    }

    document.getElementById('photo-file').value = '';
    editModal.show();
  }

  function saveProf() {
    var id = document.getElementById('prof-id').value;
    var name = document.getElementById('prof-name').value.trim();
    var desc = document.getElementById('prof-desc').value.trim();
    var facebook = document.getElementById('prof-facebook').value.trim();
    var instagram = document.getElementById('prof-instagram').value.trim();

    if (!name) { alert('El nombre es obligatorio'); return; }

    var roleSelect = document.getElementById('prof-role-select');
    var role = roleSelect.value === 'custom'
      ? document.getElementById('prof-role-custom').value.trim().toUpperCase()
      : roleSelect.value;

    if (!role) { alert('El rol es obligatorio'); return; }

    var preview = document.getElementById('photo-preview');
    var photoPath = document.getElementById('prof-photo-path').value.trim();
    var photo = '';
    if (photoPath) {
      photo = photoPath;
    } else if (preview.src && !preview.classList.contains('hidden')) {
      photo = preview.src;
    }

    if (id) {
      for (var i = 0; i < profes.length; i++) {
        if (profes[i].id === id) {
          profes[i].name = name;
          profes[i].role = role;
          profes[i].description = desc;
          if (photo) profes[i].photo = photo;
          profes[i].social = { facebook: facebook, instagram: instagram };
          break;
        }
      }
    } else {
      var maxOrder = 0;
      profes.forEach(function (p) { if (p.order > maxOrder) maxOrder = p.order; });
      profes.push({
        id: generateId(),
        order: maxOrder + 1,
        name: name,
        role: role,
        description: desc,
        photo: photo,
        social: { facebook: facebook, instagram: instagram }
      });
    }

    saveDraft();
    renderProfList();
    renderPreview();
    editModal.hide();
  }

  function deleteProf(id) {
    deleteTargetId = id;
    var prof = profes.find(function (p) { return p.id === id; });
    document.getElementById('delete-prof-name').textContent = prof ? 'Se eliminará a ' + prof.name + ' permanentemente.' : '';
    deleteModal.show();
  }

  function confirmDelete() {
    if (!deleteTargetId) return;
    profes = profes.filter(function (p) { return p.id !== deleteTargetId; });
    profes.sort(function (a, b) { return a.order - b.order; });
    profes.forEach(function (p, i) { p.order = i + 1; });
    deleteTargetId = null;
    saveDraft();
    renderProfList();
    renderPreview();
    deleteModal.hide();
  }

  function moveProf(id, direction) {
    var sorted = profes.slice().sort(function (a, b) { return a.order - b.order; });
    var idx = sorted.findIndex(function (p) { return p.id === id; });
    if (idx === -1) return;
    var newIdx = idx + direction;
    if (newIdx < 0 || newIdx >= sorted.length) return;

    var tmpOrder = sorted[idx].order;
    sorted[idx].order = sorted[newIdx].order;
    sorted[newIdx].order = tmpOrder;

    saveDraft();
    renderProfList();
    renderPreview();
  }

  // ── Import / Export ──

  function exportJSON() {
    var sorted = profes.slice().sort(function (a, b) { return a.order - b.order; });
    sorted.forEach(function (p, i) { p.order = i + 1; });
    var json = JSON.stringify({ profes: sorted }, null, 2);
    var blob = new Blob([json], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'profes.json';
    a.click();
    URL.revokeObjectURL(url);
    clearDraft();
  }

  function importJSON() {
    var input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = function (e) {
      var file = e.target.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function (ev) {
        try {
          var data = JSON.parse(ev.target.result);
          if (data.profes && Array.isArray(data.profes)) {
            profes = data.profes;
            saveDraft();
            renderProfList();
            renderPreview();
          } else {
            alert('El archivo no tiene el formato correcto.');
          }
        } catch (err) {
          alert('Error al leer el archivo: ' + err.message);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }

  // ── Photo Handling ──

  function setupPhotoUpload() {
    var area = document.getElementById('photo-upload-area');
    var fileInput = document.getElementById('photo-file');

    area.addEventListener('click', function () { fileInput.click(); });

    area.addEventListener('dragover', function (e) {
      e.preventDefault();
      area.classList.add('dragover');
    });

    area.addEventListener('dragleave', function () {
      area.classList.remove('dragover');
    });

    area.addEventListener('drop', function (e) {
      e.preventDefault();
      area.classList.remove('dragover');
      if (e.dataTransfer.files.length > 0) handlePhotoFile(e.dataTransfer.files[0]);
    });

    fileInput.addEventListener('change', function () {
      if (fileInput.files.length > 0) handlePhotoFile(fileInput.files[0]);
    });
  }

  async function handlePhotoFile(file) {
    if (file.size > MAX_PHOTO_SIZE) { alert('La imagen es muy grande. Máximo 2MB.'); return; }
    if (!file.type.startsWith('image/')) { alert('El archivo debe ser una imagen.'); return; }

    var preview = document.getElementById('photo-preview');
    var placeholder = document.getElementById('photo-placeholder');

    try {
      var dataUrl = await resizeImage(file, MAX_PHOTO_WIDTH);
      preview.src = dataUrl;
      preview.classList.remove('hidden');
      placeholder.classList.add('hidden');
      document.getElementById('prof-photo-path').value = '';
    } catch (err) {
      alert('Error procesando la imagen: ' + err.message);
    }
  }

  function onRoleChange() {
    var roleSelect = document.getElementById('prof-role-select');
    var roleCustom = document.getElementById('prof-role-custom');
    if (roleSelect.value === 'custom') {
      roleCustom.classList.remove('hidden');
      roleCustom.focus();
    } else {
      roleCustom.classList.add('hidden');
    }
  }

  // ── Init ──

  async function initAdmin() {
    editModal = new bootstrap.Modal(document.getElementById('editModal'));
    deleteModal = new bootstrap.Modal(document.getElementById('deleteModal'));

    setupPhotoUpload();

    var draft = loadDraft();
    if (draft) {
      profes = draft;
      showUnsavedIndicator(true);
    } else {
      profes = await loadFromServer();
    }

    renderProfList();
    renderPreview();
  }

  // ── Boot ──

  document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    if (checkAuth()) showAdmin();
  });

  // ── Public API ──

  window.Admin = {
    addProf: function () { openEditModal(null); },
    editProf: function (id) {
      var prof = profes.find(function (p) { return p.id === id; });
      if (prof) openEditModal(prof);
    },
    deleteProf: deleteProf,
    confirmDelete: confirmDelete,
    moveProf: moveProf,
    saveProf: saveProf,
    exportJSON: exportJSON,
    importJSON: importJSON,
    publish: publishToServer,
    onRoleChange: onRoleChange,
    switchPreview: switchPreview,
    logout: function () {
      sessionStorage.removeItem(SESSION_KEY);
      location.reload();
    }
  };

})();

(function () {
  'use strict';

  // SHA-256 of the admin password - change this hash to change the password
  // Default password: "neural2024"
  var PASSWORD_HASH = 'ec7580de04b8791de31eeb354e3b903fe359d84318d08ed04bdcc9afa49de32a';
  var STORAGE_KEY = 'neural_admin_profes';
  var SESSION_KEY = 'neural_admin_auth';
  var DATA_URL = 'data/profes.json';
  var MAX_PHOTO_SIZE = 2 * 1024 * 1024; // 2MB
  var MAX_PHOTO_WIDTH = 800; // Resize to max 800px wide

  var profes = [];
  var deleteTargetId = null;
  var editModal = null;
  var deleteModal = null;

  // ========== UTILITIES ==========

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
          // Use webp if supported, fallback to jpeg
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

  // ========== DATA ==========

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
    try {
      var response = await fetch(DATA_URL);
      var data = await response.json();
      return data.profes || [];
    } catch (e) {
      console.error('Error loading profes.json:', e);
      return [];
    }
  }

  function showUnsavedIndicator(show) {
    var el = document.getElementById('unsaved-indicator');
    if (el) el.classList.toggle('d-none', !show);
  }

  // ========== AUTH ==========

  async function handleLogin(e) {
    e.preventDefault();
    var pwd = document.getElementById('login-password').value;
    var hash = await sha256(pwd);
    if (hash === PASSWORD_HASH) {
      sessionStorage.setItem(SESSION_KEY, '1');
      showAdmin();
    } else {
      document.getElementById('login-error').classList.remove('d-none');
      document.getElementById('login-password').value = '';
      document.getElementById('login-password').focus();
    }
  }

  function checkAuth() {
    return sessionStorage.getItem(SESSION_KEY) === '1';
  }

  function showAdmin() {
    document.getElementById('login-screen').classList.add('d-none');
    document.getElementById('admin-panel').classList.remove('d-none');
    initAdmin();
  }

  // ========== RENDER PROF LIST ==========

  function renderProfList() {
    var container = document.getElementById('prof-list');
    if (!container) return;

    var sorted = profes.slice().sort(function (a, b) { return a.order - b.order; });

    if (sorted.length === 0) {
      container.innerHTML = '<div class="text-center text-muted py-5"><i class="fas fa-users fa-3x mb-3"></i><p>No hay profes. Agrega el primero!</p></div>';
      return;
    }

    container.innerHTML = sorted.map(function (prof, i) {
      var photoHtml;
      if (prof.photo) {
        photoHtml = '<img src="' + prof.photo + '" alt="' + prof.name + '" class="prof-photo">';
      } else {
        photoHtml = '<div class="prof-photo-placeholder"><i class="fas fa-user"></i></div>';
      }

      return '<div class="prof-card p-3 mb-3" data-id="' + prof.id + '">' +
        '<div class="d-flex align-items-center gap-3">' +
          '<div class="order-badge">' + (i + 1) + '</div>' +
          photoHtml +
          '<div class="flex-grow-1">' +
            '<h6 class="fw-bold mb-0">' + prof.name + '</h6>' +
            '<small class="text-muted">' + prof.role + '</small>' +
          '</div>' +
          '<div class="d-flex flex-column gap-1">' +
            '<button class="btn btn-sm btn-outline-secondary" onclick="Admin.moveProf(\'' + prof.id + '\',-1)" title="Subir"' + (i === 0 ? ' disabled' : '') + '><i class="fas fa-chevron-up"></i></button>' +
            '<button class="btn btn-sm btn-outline-secondary" onclick="Admin.moveProf(\'' + prof.id + '\',1)" title="Bajar"' + (i === sorted.length - 1 ? ' disabled' : '') + '><i class="fas fa-chevron-down"></i></button>' +
          '</div>' +
          '<div class="d-flex gap-1">' +
            '<button class="btn btn-sm btn-outline-primary" onclick="Admin.editProf(\'' + prof.id + '\')" title="Editar"><i class="fas fa-edit"></i></button>' +
            '<button class="btn btn-sm btn-outline-danger" onclick="Admin.deleteProf(\'' + prof.id + '\')" title="Eliminar"><i class="fas fa-trash"></i></button>' +
          '</div>' +
        '</div>' +
      '</div>';
    }).join('');
  }

  // ========== PREVIEW ==========

  function renderPreview() {
    var sorted = profes.slice().sort(function (a, b) { return a.order - b.order; });
    var tabsContainer = document.getElementById('preview-tabs');
    var navContainer = document.getElementById('preview-nav');
    if (!tabsContainer || !navContainer) return;

    if (sorted.length === 0) {
      tabsContainer.innerHTML = '<div class="text-center text-muted p-4">Sin profes para previsualizar</div>';
      navContainer.innerHTML = '';
      return;
    }

    tabsContainer.innerHTML = sorted.map(function (prof, i) {
      var num = padNumber(i + 1);
      var activeClass = i === 0 ? ' active show' : '';
      var socialHtml = '';
      if (prof.social) {
        var items = '';
        if (prof.social.facebook) items += '<a href="' + prof.social.facebook + '" target="_blank" class="me-2 text-dark"><i class="fab fa-facebook-f"></i></a>';
        if (prof.social.instagram) items += '<a href="' + prof.social.instagram + '" target="_blank" class="text-dark"><i class="fab fa-instagram"></i></a>';
        if (items) socialHtml = '<div class="mt-2">' + items + '</div>';
      }

      var photoStyle = prof.photo ? 'background-image:url(\'' + prof.photo + '\');' : 'background:#e9ecef;';

      return '<div class="tab-pane fade' + activeClass + '" id="preview_tab' + (i + 1) + '">' +
        '<div class="row g-0">' +
          '<div class="col-7 p-3">' +
            '<h6 class="fw-bold mb-0">' + prof.name + '</h6>' +
            '<small class="text-success fw-semibold">' + prof.role + '</small>' +
            '<hr class="my-2">' +
            '<p class="small mb-1">' + prof.description + '</p>' +
            socialHtml +
          '</div>' +
          '<div class="col-5 position-relative" style="' + photoStyle + 'background-size:cover;background-position:center;min-height:200px;">' +
            '<span class="position-absolute fw-bold text-white" style="font-size:2rem;bottom:5px;left:5px;opacity:0.7;">' + num + '.</span>' +
          '</div>' +
        '</div>' +
      '</div>';
    }).join('');

    navContainer.innerHTML = '<ul class="nav nav-pills nav-fill">' +
      sorted.map(function (prof, i) {
        var activeClass = i === 0 ? ' active' : '';
        return '<li class="nav-item">' +
          '<a class="nav-link' + activeClass + ' py-1 px-2 small" data-bs-toggle="tab" href="#preview_tab' + (i + 1) + '">' +
            prof.name.split(' ')[0] +
          '</a></li>';
      }).join('') +
    '</ul>';
  }

  // ========== CRUD ==========

  function openEditModal(prof) {
    document.getElementById('editModalTitle').textContent = prof ? 'Editar Profe' : 'Agregar Profe';
    document.getElementById('prof-id').value = prof ? prof.id : '';
    document.getElementById('prof-name').value = prof ? prof.name : '';
    document.getElementById('prof-desc').value = prof ? prof.description : '';
    document.getElementById('prof-facebook').value = (prof && prof.social) ? (prof.social.facebook || '') : '';
    document.getElementById('prof-instagram').value = (prof && prof.social) ? (prof.social.instagram || '') : '';
    document.getElementById('prof-photo-path').value = '';

    // Role
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
        roleCustom.classList.remove('d-none');
        roleCustom.value = prof.role;
      } else {
        roleCustom.classList.add('d-none');
        roleCustom.value = '';
      }
    } else {
      roleSelect.selectedIndex = 2; // ENTRENADOR default
      roleCustom.classList.add('d-none');
      roleCustom.value = '';
    }

    // Photo preview
    var preview = document.getElementById('photo-preview');
    var placeholder = document.getElementById('photo-placeholder');
    if (prof && prof.photo) {
      preview.src = prof.photo;
      preview.classList.remove('d-none');
      placeholder.classList.add('d-none');
    } else {
      preview.classList.add('d-none');
      placeholder.classList.remove('d-none');
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

    if (!name) {
      alert('El nombre es obligatorio');
      return;
    }

    var roleSelect = document.getElementById('prof-role-select');
    var role = roleSelect.value === 'custom'
      ? document.getElementById('prof-role-custom').value.trim().toUpperCase()
      : roleSelect.value;

    if (!role) {
      alert('El rol es obligatorio');
      return;
    }

    // Photo: check if new file was uploaded (stored in data attribute)
    var preview = document.getElementById('photo-preview');
    var photoPath = document.getElementById('prof-photo-path').value.trim();
    var photo = '';
    if (photoPath) {
      photo = photoPath;
    } else if (preview.src && !preview.classList.contains('d-none')) {
      photo = preview.src;
    }

    if (id) {
      // Edit existing
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
      // Add new
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
    document.getElementById('delete-prof-name').textContent = prof ? prof.name : '';
    deleteModal.show();
  }

  function confirmDelete() {
    if (!deleteTargetId) return;
    profes = profes.filter(function (p) { return p.id !== deleteTargetId; });
    // Reorder
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

    // Swap orders
    var tmpOrder = sorted[idx].order;
    sorted[idx].order = sorted[newIdx].order;
    sorted[newIdx].order = tmpOrder;

    saveDraft();
    renderProfList();
    renderPreview();
  }

  // ========== IMPORT / EXPORT ==========

  function exportJSON() {
    var sorted = profes.slice().sort(function (a, b) { return a.order - b.order; });
    // Re-normalize orders
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
            alert('JSON importado correctamente (' + profes.length + ' profes)');
          } else {
            alert('El archivo no tiene el formato correcto. Debe contener una propiedad "profes".');
          }
        } catch (err) {
          alert('Error al leer el archivo: ' + err.message);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }

  // ========== PHOTO HANDLING ==========

  function setupPhotoUpload() {
    var area = document.getElementById('photo-upload-area');
    var fileInput = document.getElementById('photo-file');
    var preview = document.getElementById('photo-preview');
    var placeholder = document.getElementById('photo-placeholder');

    area.addEventListener('click', function () {
      fileInput.click();
    });

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
      if (e.dataTransfer.files.length > 0) {
        handlePhotoFile(e.dataTransfer.files[0]);
      }
    });

    fileInput.addEventListener('change', function () {
      if (fileInput.files.length > 0) {
        handlePhotoFile(fileInput.files[0]);
      }
    });
  }

  async function handlePhotoFile(file) {
    if (file.size > MAX_PHOTO_SIZE) {
      alert('La imagen es muy grande. Máximo 2MB.');
      return;
    }

    if (!file.type.startsWith('image/')) {
      alert('El archivo debe ser una imagen.');
      return;
    }

    var preview = document.getElementById('photo-preview');
    var placeholder = document.getElementById('photo-placeholder');

    try {
      var dataUrl = await resizeImage(file, MAX_PHOTO_WIDTH);
      preview.src = dataUrl;
      preview.classList.remove('d-none');
      placeholder.classList.add('d-none');
      // Clear manual path since we're using uploaded file
      document.getElementById('prof-photo-path').value = '';
    } catch (err) {
      alert('Error procesando la imagen: ' + err.message);
    }
  }

  function onRoleChange() {
    var roleSelect = document.getElementById('prof-role-select');
    var roleCustom = document.getElementById('prof-role-custom');
    if (roleSelect.value === 'custom') {
      roleCustom.classList.remove('d-none');
      roleCustom.focus();
    } else {
      roleCustom.classList.add('d-none');
    }
  }

  // ========== INIT ==========

  async function initAdmin() {
    editModal = new bootstrap.Modal(document.getElementById('editModal'));
    deleteModal = new bootstrap.Modal(document.getElementById('deleteModal'));

    setupPhotoUpload();

    // Load data: draft first, fallback to server
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

  // ========== BOOT ==========

  document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('login-form').addEventListener('submit', handleLogin);

    if (checkAuth()) {
      showAdmin();
    }
  });

  // ========== PUBLIC API ==========

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
    onRoleChange: onRoleChange,
    logout: function () {
      sessionStorage.removeItem(SESSION_KEY);
      location.reload();
    }
  };

})();

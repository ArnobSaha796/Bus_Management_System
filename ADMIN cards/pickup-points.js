(function (global) {
  'use strict';

  var STORAGE_KEY = 'aiub_bms_pickup_points';
  var ROUTES_KEY = 'aiub_bms_routes';
  var SCHEDULES_KEY = 'aiub_bms_schedules';
  var SESSION_KEY = 'aiub_bms_session';

  var DEFAULT_POINTS = [
    { id: 'pp-1', name: 'Shibbari Intersection', description: 'Main Bus Stand beside BRTC Counter', route: 'Shibbari → Board Bazar → Tongi → Kuril → AIUB' },
    { id: 'pp-2', name: 'Tongi Station Road', description: 'Footbridge East Side Passenger Bay', route: 'Shibbari → Board Bazar → Tongi → Kuril → AIUB' },
    { id: 'pp-3', name: 'Jatrabari Ideal School Gate', description: 'Front of Ideal School & College Main Gate', route: 'Jatrabari → Sayedabad → Rampura → Badda → AIUB' },
    { id: 'pp-4', name: 'Mirpur 12 Metro Station', description: 'Exit Gate 02 near Pallabi Police Box', route: 'Mirpur 12 → Agargaon → Mohakhali → Banani → AIUB' },
    { id: 'pp-5', name: 'Dhanmondi 27 Rapa Plaza', description: 'Mirpur Road Northbound Pickup Stop', route: 'Dhanmondi 27 → Farmgate → Kakoli → AIUB' },
  ];

  var FALLBACK_ROUTES = [
    'Shibbari → Board Bazar → Tongi → Kuril → AIUB',
    'Shibbari → Bypass → Purbachal 300 Feet → AIUB',
    'Jatrabari → Sayedabad → Rampura → Badda → AIUB',
    'Jatrabari → Hanif Flyover → Hatirjheel → AIUB',
    'Mirpur 12 → Agargaon → Mohakhali → Banani → AIUB',
    'Mirpur 1 → Cantonment → Kalshi → Kuril → AIUB',
    'Dhanmondi 15 → Shahbag → Tejgaon → AIUB',
    'Dhanmondi 27 → Farmgate → Kakoli → AIUB',
  ];

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function validatePickupPointInput(input) {
    var name = String(input.name || '').trim();
    var description = String(input.description || '').trim();
    var route = String(input.route || '').trim();

    if (name.length < 2) {
      return { valid: false, error: 'Pickup Point Name is required.' };
    }
    if (description.length < 3) {
      return { valid: false, error: 'Description / Landmark is required.' };
    }
    if (!route) {
      return { valid: false, error: 'Please select an assigned route.' };
    }

    return {
      valid: true,
      value: {
        name: name,
        description: description,
        route: route,
      },
    };
  }

  function loadJson(key, fallback) {
    try {
      var raw = global.localStorage.getItem(key);
      if (!raw) {
        global.localStorage.setItem(key, JSON.stringify(fallback));
        return fallback.slice();
      }
      var parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : fallback.slice();
    } catch (_err) {
      return fallback.slice();
    }
  }

  function savePoints(points) {
    try {
      global.localStorage.setItem(STORAGE_KEY, JSON.stringify(points));
    } catch (_err) {
      // Ignore
    }
  }

  function getAvailableRoutes() {
    var routes = loadJson(ROUTES_KEY, []);
    if (routes.length > 0) {
      return routes.map(function (r) { return r.name; });
    }
    return FALLBACK_ROUTES.slice();
  }

  function showToast(message) {
    var container = document.getElementById('bms-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'bms-toast-container';
      container.className = 'bms-toast-container';
      container.setAttribute('role', 'status');
      container.setAttribute('aria-live', 'polite');
      document.body.appendChild(container);
    }
    var toast = document.createElement('div');
    toast.className = 'bms-toast';
    toast.innerHTML = '<i class="fa-solid fa-circle-check"></i><span></span>';
    toast.querySelector('span').textContent = message;
    container.appendChild(toast);
    setTimeout(function () {
      toast.remove();
    }, 3200);
  }

  function setupLogout() {
    var logoutBtn = document.querySelector('.btn-logout');
    if (!logoutBtn) return;

    var confirmModal = document.createElement('div');
    confirmModal.className = 'modal-overlay';
    confirmModal.setAttribute('role', 'dialog');
    confirmModal.innerHTML =
      '<div class="modal-box modal-box-sm">' +
        '<div class="modal-header modal-header-danger"><h3><i class="fa-solid fa-right-from-bracket"></i> Confirm Log Out</h3><button type="button" class="modal-close" style="background:none;border:none;cursor:pointer;" aria-label="Close">&times;</button></div>' +
        '<div class="modal-body-text"><p>Are you sure you want to log out of the <strong>AIUB BMS Admin Panel</strong>?</p></div>' +
        '<div class="modal-footer"><button type="button" class="btn-modal-cancel">Cancel</button><button type="button" class="btn-modal-danger" id="btn-logout-confirm">Log Out</button></div>' +
      '</div>';

    document.body.appendChild(confirmModal);

    logoutBtn.addEventListener('click', function () {
      confirmModal.classList.add('is-open');
    });
    confirmModal.querySelector('.modal-close').addEventListener('click', function () {
      confirmModal.classList.remove('is-open');
    });
    confirmModal.querySelector('.btn-modal-cancel').addEventListener('click', function () {
      confirmModal.classList.remove('is-open');
    });
    confirmModal.addEventListener('click', function (e) {
      if (e.target === confirmModal) confirmModal.classList.remove('is-open');
    });
    confirmModal.querySelector('#btn-logout-confirm').addEventListener('click', function () {
      try {
        global.localStorage.setItem(SESSION_KEY, 'signed_out');
      } catch (_err) {
        // Ignore
      }
      global.location.href = '../Login page/login.html?role=admin';
    });
  }

  function ensureHelperStyles() {
    if (document.getElementById('bms-runtime-styles')) return;
    var style = document.createElement('style');
    style.id = 'bms-runtime-styles';
    style.textContent =
      '.modal-overlay.is-open{opacity:1!important;visibility:visible!important;pointer-events:auto!important}' +
      'button.btn-icon{font-family:inherit;cursor:pointer}' +
      '.form-error{background:#fef2f2;border:1px solid #fecaca;color:#b91c1c;border-radius:8px;padding:10px 12px;font-size:.82rem;font-weight:600;margin-bottom:14px}' +
      '.empty-state-cell{text-align:center;color:#64748b;padding:32px 16px!important;font-size:.92rem}' +
      '.bms-toast-container{position:fixed;right:24px;bottom:24px;display:flex;flex-direction:column;gap:10px;z-index:3000;pointer-events:none}' +
      '.bms-toast{background:#053b6e;color:#fff;padding:12px 16px;border-radius:8px;font-size:.86rem;font-weight:600;box-shadow:0 10px 25px rgba(5,59,110,.25);display:flex;align-items:center;gap:8px;border-left:4px solid #f59e0b}';
    document.head.appendChild(style);
  }

  function ensureFormError(formEl, id) {
    var existing = document.getElementById(id) || (formEl && formEl.querySelector('.form-error'));
    if (existing) return existing;
    var el = document.createElement('div');
    el.id = id;
    el.className = 'form-error';
    el.setAttribute('role', 'alert');
    el.setAttribute('aria-live', 'polite');
    el.hidden = true;
    if (formEl) formEl.insertBefore(el, formEl.firstChild);
    return el;
  }

  function bindFormSubmit(formEl, handler) {
    if (!formEl) return;
    formEl.setAttribute('novalidate', 'novalidate');
    formEl.addEventListener('submit', function (e) {
      e.preventDefault();
      handler();
    });
    var submitEl = formEl.querySelector('.btn-modal-submit');
    if (submitEl && submitEl.tagName.toLowerCase() !== 'button') {
      submitEl.addEventListener('click', function (e) {
        e.preventDefault();
        handler();
      });
    }
  }

  function initPickupPointsPage() {
    ensureHelperStyles();
    var points = loadJson(STORAGE_KEY, DEFAULT_POINTS);
    var activeId = null;

    var tbody = document.getElementById('pickup-points-tbody') || document.querySelector('table tbody');
    var modalAdd = document.getElementById('modal-add');
    var modalEdit = document.getElementById('modal-edit');
    var modalView = document.getElementById('modal-view');
    var modalDelete = document.getElementById('modal-delete');

    var addForm = document.getElementById('form-add-point') || (modalAdd && modalAdd.querySelector('form'));
    var editForm = document.getElementById('form-edit-point') || (modalEdit && modalEdit.querySelector('form'));
    var addError = ensureFormError(addForm, 'add-point-error');
    var editError = ensureFormError(editForm, 'edit-point-error');

    function populateRouteSelect(selectEl, selectedValue) {
      var names = getAvailableRoutes();
      if (selectedValue && names.indexOf(selectedValue) === -1) {
        names.unshift(selectedValue);
      }
      selectEl.innerHTML = names
        .map(function (name) {
          var sel = name === selectedValue ? ' selected' : '';
          return '<option value="' + escapeHtml(name) + '"' + sel + '>' + escapeHtml(name) + '</option>';
        })
        .join('');
    }

    function findBoardingTimes(routeName) {
      var schedules = loadJson(SCHEDULES_KEY, []);
      var matches = schedules.filter(function (s) { return s.route === routeName; });
      if (matches.length === 0) return '06:00 AM (Morning) / 09:00 AM (Second Shift)';
      return matches.map(function (s) { return s.departureTime + ' (' + s.bus + ')'; }).join(' / ');
    }

    function closeAllModals() {
      [modalAdd, modalEdit, modalView, modalDelete].forEach(function (m) {
        if (m) m.classList.remove('is-open');
      });
      if (global.location.hash) {
        try {
          global.history.replaceState(null, '', global.location.pathname + global.location.search);
        } catch (_err) {
          // Ignore
        }
      }
    }

    function openModal(modalEl) {
      closeAllModals();
      if (modalEl) {
        modalEl.classList.add('is-open');
        var firstInput = modalEl.querySelector('input, select, textarea');
        if (firstInput) firstInput.focus();
      }
    }

    function renderTable() {
      if (!tbody) return;
      if (points.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="empty-state-cell">No pickup points added yet. Click "Add New Point" to create one.</td></tr>';
        return;
      }

      tbody.innerHTML = points
        .map(function (pt) {
          return (
            '<tr data-id="' + escapeHtml(pt.id) + '">' +
              '<td class="fw-bold">' + escapeHtml(pt.name) + '</td>' +
              '<td>' + escapeHtml(pt.description) + '</td>' +
              '<td>' + escapeHtml(pt.route) + '</td>' +
              '<td class="text-right">' +
                '<div class="icon-actions">' +
                  '<button type="button" class="btn-icon btn-icon-edit" data-action="edit" data-id="' + escapeHtml(pt.id) + '" title="Edit Point" aria-label="Edit Pickup Point ' + escapeHtml(pt.name) + '"><i class="fa-regular fa-pen-to-square"></i></button>' +
                  '<button type="button" class="btn-icon btn-icon-view" data-action="view" data-id="' + escapeHtml(pt.id) + '" title="View Point" aria-label="View Pickup Point ' + escapeHtml(pt.name) + '"><i class="fa-regular fa-eye"></i></button>' +
                  '<button type="button" class="btn-icon btn-icon-delete" data-action="delete" data-id="' + escapeHtml(pt.id) + '" title="Delete Point" aria-label="Delete Pickup Point ' + escapeHtml(pt.name) + '"><i class="fa-solid fa-trash"></i></button>' +
                '</div>' +
              '</td>' +
            '</tr>'
          );
        })
        .join('');
    }

    function openEditFor(id) {
      var pt = points.find(function (p) { return p.id === id; });
      if (!pt) return;
      activeId = id;
      editError.hidden = true;
      document.getElementById('edit-point-name').value = pt.name;
      document.getElementById('edit-point-desc').value = pt.description;
      populateRouteSelect(document.getElementById('edit-point-route'), pt.route);
      openModal(modalEdit);
    }

    function openViewFor(id) {
      var pt = points.find(function (p) { return p.id === id; });
      if (!pt) return;
      activeId = id;
      var details = document.getElementById('view-point-details') || (modalView && modalView.querySelector('.detail-list'));
      if (details) {
        details.innerHTML =
          '<div class="detail-item"><span class="detail-label">Point Name</span><span class="detail-value">' + escapeHtml(pt.name) + '</span></div>' +
          '<div class="detail-item"><span class="detail-label">Landmark Description</span><span class="detail-value">' + escapeHtml(pt.description) + '</span></div>' +
          '<div class="detail-item"><span class="detail-label">Assigned Route</span><span class="detail-value">' + escapeHtml(pt.route) + '</span></div>' +
          '<div class="detail-item"><span class="detail-label">Boarding Time</span><span class="detail-value">' + escapeHtml(findBoardingTimes(pt.route)) + '</span></div>';
      }
      openModal(modalView);
    }

    function openDeleteFor(id) {
      var pt = points.find(function (p) { return p.id === id; });
      if (!pt) return;
      activeId = id;
      var delName = document.getElementById('delete-point-name') || (modalDelete && modalDelete.querySelector('.modal-body-text strong'));
      if (delName) delName.textContent = pt.name;
      openModal(modalDelete);
    }

    var addTrigger = document.querySelector('.btn-primary-add');
    if (addTrigger) {
      addTrigger.addEventListener('click', function (e) {
        e.preventDefault();
        addForm.reset();
        addError.hidden = true;
        populateRouteSelect(document.getElementById('add-point-route'), '');
        openModal(modalAdd);
      });
    }

    tbody.addEventListener('click', function (e) {
      var btn = e.target.closest('button[data-action]');
      if (!btn) return;
      var action = btn.getAttribute('data-action');
      var id = btn.getAttribute('data-id');
      if (action === 'edit') openEditFor(id);
      if (action === 'view') openViewFor(id);
      if (action === 'delete') openDeleteFor(id);
    });

    var viewToEdit = document.getElementById('btn-view-to-edit') || (modalView && modalView.querySelector('.btn-modal-submit'));
    if (viewToEdit) {
      viewToEdit.addEventListener('click', function (e) {
        e.preventDefault();
        if (activeId) openEditFor(activeId);
      });
    }

    bindFormSubmit(addForm, function () {
      var result = validatePickupPointInput({
        name: document.getElementById('add-point-name').value,
        description: document.getElementById('add-point-desc').value,
        route: document.getElementById('add-point-route').value,
      });
      if (!result.valid) {
        addError.textContent = result.error;
        addError.hidden = false;
        return;
      }
      addError.hidden = true;
      var newPoint = Object.assign({ id: 'pp-' + Date.now() }, result.value);
      points.push(newPoint);
      savePoints(points);
      renderTable();
      closeAllModals();
      showToast('Pickup point "' + newPoint.name + '" added.');
    });

    bindFormSubmit(editForm, function () {
      var result = validatePickupPointInput({
        name: document.getElementById('edit-point-name').value,
        description: document.getElementById('edit-point-desc').value,
        route: document.getElementById('edit-point-route').value,
      });
      if (!result.valid) {
        editError.textContent = result.error;
        editError.hidden = false;
        return;
      }
      editError.hidden = true;
      points = points.map(function (p) {
        return p.id === activeId ? Object.assign({}, p, result.value) : p;
      });
      savePoints(points);
      renderTable();
      closeAllModals();
      showToast('Pickup point "' + result.value.name + '" updated.');
    });

    var confirmDeleteBtn = document.getElementById('btn-confirm-delete-point') || (modalDelete && modalDelete.querySelector('.btn-modal-danger'));
    if (confirmDeleteBtn) {
      confirmDeleteBtn.addEventListener('click', function (e) {
        e.preventDefault();
        var target = points.find(function (p) { return p.id === activeId; });
        if (!target) return;
        points = points.filter(function (p) { return p.id !== activeId; });
        savePoints(points);
        renderTable();
        closeAllModals();
        showToast('Pickup point "' + target.name + '" deleted.');
      });
    }

    document.querySelectorAll('.modal-close, .btn-modal-cancel').forEach(function (el) {
      el.addEventListener('click', function (e) {
        e.preventDefault();
        closeAllModals();
      });
    });

    [modalAdd, modalEdit, modalView, modalDelete].forEach(function (overlay) {
      if (!overlay) return;
      overlay.addEventListener('click', function (e) {
        if (e.target === overlay) closeAllModals();
      });
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeAllModals();
    });

    renderTable();
    setupLogout();
  }

  global.AIUB_BMS_PICKUP_POINTS = {
    STORAGE_KEY: STORAGE_KEY,
    DEFAULT_POINTS: DEFAULT_POINTS,
    validatePickupPointInput: validatePickupPointInput,
  };

  if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', function () {
      try {
        var raw = global.localStorage.getItem(SESSION_KEY);
        var sess = raw && raw !== 'signed_out' && raw !== 'active' ? JSON.parse(raw) : null;
        if (!sess || sess.role !== 'admin') {
          global.location.replace('../Login page/login.html?role=admin');
          return;
        }
        var eEl = document.querySelector('.admin-email');
        var rEl = document.querySelector('.admin-role');
        if (eEl && sess.email) eEl.textContent = sess.email;
        if (rEl && sess.name) rEl.textContent = sess.name;
      } catch (_e) {
        global.location.replace('../Login page/login.html?role=admin');
        return;
      }
      initPickupPointsPage();
    });
  }
})(typeof window !== 'undefined' ? window : globalThis);

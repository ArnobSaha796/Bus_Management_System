(function (global) {
  'use strict';

  var STORAGE_KEY = 'aiub_bms_routes';
  var SCHEDULES_KEY = 'aiub_bms_schedules';
  var SESSION_KEY = 'aiub_bms_session';

  var DEFAULT_ROUTES = [
    { id: 'rt-1', name: 'Shibbari → Board Bazar → Tongi → Kuril → AIUB', startPoint: 'Gazipur', endPoint: 'AIUB', stops: ['Shibbari', 'Board Bazar', 'Tongi', 'Kuril'] },
    { id: 'rt-2', name: 'Shibbari → Bypass → Purbachal 300 Feet → AIUB', startPoint: 'Gazipur', endPoint: 'AIUB', stops: ['Shibbari', 'Bypass', 'Purbachal 300 Feet'] },
    { id: 'rt-3', name: 'Jatrabari → Sayedabad → Rampura → Badda → AIUB', startPoint: 'Jatrabari', endPoint: 'AIUB', stops: ['Jatrabari', 'Sayedabad', 'Rampura', 'Badda'] },
    { id: 'rt-4', name: 'Jatrabari → Hanif Flyover → Hatirjheel → AIUB', startPoint: 'Jatrabari', endPoint: 'AIUB', stops: ['Jatrabari', 'Hanif Flyover', 'Hatirjheel'] },
    { id: 'rt-5', name: 'Mirpur 12 → Agargaon → Mohakhali → Banani → AIUB', startPoint: 'Mirpur', endPoint: 'AIUB', stops: ['Mirpur 12', 'Agargaon', 'Mohakhali', 'Banani'] },
    { id: 'rt-6', name: 'Mirpur 1 → Cantonment → Kalshi → Kuril → AIUB', startPoint: 'Mirpur', endPoint: 'AIUB', stops: ['Mirpur 1', 'Cantonment', 'Kalshi', 'Kuril'] },
    { id: 'rt-7', name: 'Dhanmondi 15 → Shahbag → Tejgaon → AIUB', startPoint: 'Dhanmondi', endPoint: 'AIUB', stops: ['Dhanmondi 15', 'Shahbag', 'Tejgaon'] },
    { id: 'rt-8', name: 'Dhanmondi 27 → Farmgate → Kakoli → AIUB', startPoint: 'Dhanmondi', endPoint: 'AIUB', stops: ['Dhanmondi 27', 'Farmgate', 'Kakoli'] },
  ];

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function parseStops(rawStops, fallbackRouteName) {
    var list = String(rawStops || '')
      .split(',')
      .map(function (s) { return s.trim(); })
      .filter(Boolean);
    if (list.length > 0) return list;

    var parts = String(fallbackRouteName || '')
      .split(/→|->/)
      .map(function (s) { return s.trim(); })
      .filter(Boolean);
    if (parts.length > 1) {
      return parts.slice(0, parts.length - 1);
    }
    return parts;
  }

  function validateRouteInput(input) {
    var name = String(input.name || '').trim().replace(/\s*->\s*/g, ' → ');
    var startPoint = String(input.startPoint || '').trim();
    var endPoint = String(input.endPoint || '').trim();
    var stops = parseStops(input.stopsText, name);

    if (name.length < 3) {
      return { valid: false, error: 'Route Path Name is required.' };
    }
    if (!startPoint) {
      return { valid: false, error: 'Start Point is required.' };
    }
    if (!endPoint) {
      return { valid: false, error: 'End Point is required.' };
    }

    return {
      valid: true,
      value: {
        name: name,
        startPoint: startPoint,
        endPoint: endPoint,
        stops: stops.length > 0 ? stops : [startPoint],
      },
    };
  }

  function formatRouteNameHtml(routeName) {
    var segments = String(routeName || '').split(/→|->/).map(function (s) { return s.trim(); }).filter(Boolean);
    if (segments.length <= 1) return escapeHtml(routeName);
    return segments
      .map(function (seg) { return escapeHtml(seg); })
      .join(' <i class="fa-solid fa-arrow-right route-arrow"></i> ');
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

  function saveRoutes(routes) {
    try {
      global.localStorage.setItem(STORAGE_KEY, JSON.stringify(routes));
    } catch (_err) {
      // Ignore
    }
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

  function initRoutesPage() {
    ensureHelperStyles();
    var routes = loadJson(STORAGE_KEY, DEFAULT_ROUTES);
    var activeId = null;

    var tbody = document.getElementById('routes-tbody') || document.querySelector('table tbody');
    var modalAdd = document.getElementById('modal-add');
    var modalEdit = document.getElementById('modal-edit');
    var modalView = document.getElementById('modal-view');
    var modalDelete = document.getElementById('modal-delete');

    var addForm = document.getElementById('form-add-route') || (modalAdd && modalAdd.querySelector('form'));
    var editForm = document.getElementById('form-edit-route') || (modalEdit && modalEdit.querySelector('form'));
    var addError = ensureFormError(addForm, 'add-route-error');
    var editError = ensureFormError(editForm, 'edit-route-error');

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

    function findAssignedSchedules(routeName) {
      var schedules = loadJson(SCHEDULES_KEY, []);
      var matches = schedules.filter(function (s) { return s.route === routeName; });
      if (matches.length === 0) return 'Unassigned';
      return matches.map(function (s) { return s.bus + ' (' + s.departureTime.slice(0, 5) + ')'; }).join(', ');
    }

    function renderTable() {
      if (!tbody) return;
      if (routes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="empty-state-cell">No routes configured yet. Click "Add New Route" to create one.</td></tr>';
        return;
      }

      tbody.innerHTML = routes
        .map(function (rt) {
          var stopCount = Array.isArray(rt.stops) ? rt.stops.length : 0;
          return (
            '<tr data-id="' + escapeHtml(rt.id) + '">' +
              '<td class="fw-bold">' + formatRouteNameHtml(rt.name) + '</td>' +
              '<td>' + escapeHtml(rt.startPoint) + '</td>' +
              '<td>' + escapeHtml(rt.endPoint) + '</td>' +
              '<td>' + escapeHtml(stopCount) + (stopCount === 1 ? ' Stop' : ' Stops') + '</td>' +
              '<td class="text-right">' +
                '<div class="icon-actions">' +
                  '<button type="button" class="btn-icon btn-icon-edit" data-action="edit" data-id="' + escapeHtml(rt.id) + '" title="Edit Route" aria-label="Edit Route ' + escapeHtml(rt.name) + '"><i class="fa-regular fa-pen-to-square"></i></button>' +
                  '<button type="button" class="btn-icon btn-icon-view" data-action="view" data-id="' + escapeHtml(rt.id) + '" title="View Route" aria-label="View Route ' + escapeHtml(rt.name) + '"><i class="fa-regular fa-eye"></i></button>' +
                  '<button type="button" class="btn-icon btn-icon-delete" data-action="delete" data-id="' + escapeHtml(rt.id) + '" title="Delete Route" aria-label="Delete Route ' + escapeHtml(rt.name) + '"><i class="fa-solid fa-trash"></i></button>' +
                '</div>' +
              '</td>' +
            '</tr>'
          );
        })
        .join('');
    }

    function openEditFor(id) {
      var rt = routes.find(function (r) { return r.id === id; });
      if (!rt) return;
      activeId = id;
      editError.hidden = true;
      document.getElementById('edit-route-name').value = rt.name;
      document.getElementById('edit-start').value = rt.startPoint;
      document.getElementById('edit-end').value = rt.endPoint;
      document.getElementById('edit-stops').value = (rt.stops || []).join(', ');
      openModal(modalEdit);
    }

    function openViewFor(id) {
      var rt = routes.find(function (r) { return r.id === id; });
      if (!rt) return;
      activeId = id;
      var stopList = (rt.stops || []).join(', ');
      var details = document.getElementById('view-route-details') || (modalView && modalView.querySelector('.detail-list'));
      if (details) {
        details.innerHTML =
          '<div class="detail-item"><span class="detail-label">Route Name</span><span class="detail-value">' + escapeHtml(rt.name) + '</span></div>' +
          '<div class="detail-item"><span class="detail-label">Start Point</span><span class="detail-value">' + escapeHtml(rt.startPoint) + '</span></div>' +
          '<div class="detail-item"><span class="detail-label">End Point</span><span class="detail-value">' + escapeHtml(rt.endPoint) + '</span></div>' +
          '<div class="detail-item"><span class="detail-label">Total Pickup Points</span><span class="detail-value">' + escapeHtml((rt.stops || []).length) + ' Designated Stops (' + escapeHtml(stopList) + ')</span></div>' +
          '<div class="detail-item"><span class="detail-label">Assigned Bus</span><span class="detail-value">' + escapeHtml(findAssignedSchedules(rt.name)) + '</span></div>';
      }
      openModal(modalView);
    }

    function openDeleteFor(id) {
      var rt = routes.find(function (r) { return r.id === id; });
      if (!rt) return;
      activeId = id;
      var delName = document.getElementById('delete-route-name') || (modalDelete && modalDelete.querySelector('.modal-body-text strong'));
      if (delName) delName.textContent = rt.name;
      openModal(modalDelete);
    }

    var addTrigger = document.querySelector('.btn-primary-add');
    if (addTrigger) {
      addTrigger.addEventListener('click', function (e) {
        e.preventDefault();
        addForm.reset();
        document.getElementById('add-end').value = 'AIUB';
        addError.hidden = true;
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
      var result = validateRouteInput({
        name: document.getElementById('add-route-name').value,
        startPoint: document.getElementById('add-start').value,
        endPoint: document.getElementById('add-end').value,
        stopsText: document.getElementById('add-stops').value,
      });
      if (!result.valid) {
        addError.textContent = result.error;
        addError.hidden = false;
        return;
      }
      addError.hidden = true;
      var newRoute = Object.assign({ id: 'rt-' + Date.now() }, result.value);
      routes.push(newRoute);
      saveRoutes(routes);
      renderTable();
      closeAllModals();
      showToast('Route "' + newRoute.startPoint + ' → ' + newRoute.endPoint + '" added.');
    });

    bindFormSubmit(editForm, function () {
      var result = validateRouteInput({
        name: document.getElementById('edit-route-name').value,
        startPoint: document.getElementById('edit-start').value,
        endPoint: document.getElementById('edit-end').value,
        stopsText: document.getElementById('edit-stops').value,
      });
      if (!result.valid) {
        editError.textContent = result.error;
        editError.hidden = false;
        return;
      }
      editError.hidden = true;
      routes = routes.map(function (r) {
        return r.id === activeId ? Object.assign({}, r, result.value) : r;
      });
      saveRoutes(routes);
      renderTable();
      closeAllModals();
      showToast('Route updated successfully.');
    });

    var confirmDeleteBtn = document.getElementById('btn-confirm-delete-route') || (modalDelete && modalDelete.querySelector('.btn-modal-danger'));
    if (confirmDeleteBtn) {
      confirmDeleteBtn.addEventListener('click', function (e) {
        e.preventDefault();
        var target = routes.find(function (r) { return r.id === activeId; });
        if (!target) return;
        routes = routes.filter(function (r) { return r.id !== activeId; });
        saveRoutes(routes);
        renderTable();
        closeAllModals();
        showToast('Route removed.');
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

  global.AIUB_BMS_ROUTES = {
    STORAGE_KEY: STORAGE_KEY,
    DEFAULT_ROUTES: DEFAULT_ROUTES,
    parseStops: parseStops,
    validateRouteInput: validateRouteInput,
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
      initRoutesPage();
    });
  }
})(typeof window !== 'undefined' ? window : globalThis);

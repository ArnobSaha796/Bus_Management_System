(function (global) {
  'use strict';

  var STORAGE_KEY = 'aiub_bms_schedules';
  var BUSES_KEY = 'aiub_bms_buses';
  var ROUTES_KEY = 'aiub_bms_routes';
  var SESSION_KEY = 'aiub_bms_session';

  var DEFAULT_SCHEDULES = [
    { id: 'sch-1', days: 'Sunday - Thursday', departureTime: '06:00:00', bus: 'Gazipur-01', route: 'Shibbari → Board Bazar → Tongi → Kuril → AIUB' },
    { id: 'sch-2', days: 'Sunday - Thursday', departureTime: '09:00:00', bus: 'Gazipur-02', route: 'Shibbari → Bypass → Purbachal 300 Feet → AIUB' },
    { id: 'sch-3', days: 'Sunday - Thursday', departureTime: '06:00:00', bus: 'Jatrabari-01', route: 'Jatrabari → Sayedabad → Rampura → Badda → AIUB' },
    { id: 'sch-4', days: 'Sunday - Thursday', departureTime: '09:00:00', bus: 'Jatrabari-02', route: 'Jatrabari → Hanif Flyover → Hatirjheel → AIUB' },
    { id: 'sch-5', days: 'Sunday - Thursday', departureTime: '06:00:00', bus: 'Mirpur-01', route: 'Mirpur 12 → Agargaon → Mohakhali → Banani → AIUB' },
    { id: 'sch-6', days: 'Sunday - Thursday', departureTime: '09:00:00', bus: 'Mirpur-02', route: 'Mirpur 1 → Cantonment → Kalshi → Kuril → AIUB' },
    { id: 'sch-7', days: 'Sunday - Thursday', departureTime: '06:00:00', bus: 'Dhanmondi-01', route: 'Dhanmondi 15 → Shahbag → Tejgaon → AIUB' },
    { id: 'sch-8', days: 'Sunday - Thursday', departureTime: '09:00:00', bus: 'Dhanmondi-02', route: 'Dhanmondi 27 → Farmgate → Kakoli → AIUB' },
  ];

  var FALLBACK_BUSES = [
    'Gazipur-01', 'Gazipur-02', 'Jatrabari-01', 'Jatrabari-02',
    'Mirpur-01', 'Mirpur-02', 'Dhanmondi-01', 'Dhanmondi-02',
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

  function normalizeTime(rawTime) {
    var trimmed = String(rawTime || '').trim();
    if (/^([01]\d|2[0-3]):[0-5]\d$/.test(trimmed)) {
      return trimmed + ':00';
    }
    if (/^([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/.test(trimmed)) {
      return trimmed;
    }
    return null;
  }

  function validateScheduleInput(input) {
    var days = String(input.days || '').trim();
    var departureTime = normalizeTime(input.departureTime);
    var bus = String(input.bus || '').trim();
    var route = String(input.route || '').trim();

    if (!days) {
      return { valid: false, error: 'Days of Week is required.' };
    }
    if (!departureTime) {
      return { valid: false, error: 'Departure Time must be in HH:MM or HH:MM:SS 24-hour format (e.g., 06:00:00).' };
    }
    if (!bus) {
      return { valid: false, error: 'Please select a Bus.' };
    }
    if (!route) {
      return { valid: false, error: 'Please select a Route.' };
    }

    return {
      valid: true,
      value: {
        days: days,
        departureTime: departureTime,
        bus: bus,
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

  function saveSchedules(schedules) {
    try {
      global.localStorage.setItem(STORAGE_KEY, JSON.stringify(schedules));
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

  function initSchedulesPage() {
    ensureHelperStyles();
    var schedules = loadJson(STORAGE_KEY, DEFAULT_SCHEDULES);
    var activeId = null;

    var tbody = document.getElementById('schedules-tbody') || document.querySelector('table tbody');
    var modalAdd = document.getElementById('modal-add');
    var modalEdit = document.getElementById('modal-edit');
    var modalView = document.getElementById('modal-view');
    var modalDelete = document.getElementById('modal-delete');

    var addForm = document.getElementById('form-add-schedule') || (modalAdd && modalAdd.querySelector('form'));
    var editForm = document.getElementById('form-edit-schedule') || (modalEdit && modalEdit.querySelector('form'));
    var addError = ensureFormError(addForm, 'add-schedule-error');
    var editError = ensureFormError(editForm, 'edit-schedule-error');

    function getBusOptions() {
      var buses = loadJson(BUSES_KEY, []);
      return buses.length > 0 ? buses.map(function (b) { return b.busNumber; }) : FALLBACK_BUSES.slice();
    }

    function getRouteOptions() {
      var routes = loadJson(ROUTES_KEY, []);
      return routes.length > 0 ? routes.map(function (r) { return r.name; }) : FALLBACK_ROUTES.slice();
    }

    function populateSelect(selectEl, options, selectedValue) {
      var list = options.slice();
      if (selectedValue && list.indexOf(selectedValue) === -1) {
        list.unshift(selectedValue);
      }
      selectEl.innerHTML = list
        .map(function (opt) {
          var sel = opt === selectedValue ? ' selected' : '';
          return '<option value="' + escapeHtml(opt) + '"' + sel + '>' + escapeHtml(opt) + '</option>';
        })
        .join('');
    }

    function getSeatSummary(busNumber) {
      var buses = loadJson(BUSES_KEY, []);
      var bus = buses.find(function (b) { return b.busNumber === busNumber; });
      if (!bus) return '38 / 40 Seats Booked';
      var reserved = typeof bus.reserved === 'number' ? Math.min(bus.reserved, bus.seats) : 0;
      return reserved + ' / ' + bus.seats + ' Seats Booked';
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
      if (schedules.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="empty-state-cell">No schedules configured yet. Click "Add New Schedule" to create one.</td></tr>';
        return;
      }

      tbody.innerHTML = schedules
        .map(function (sch) {
          return (
            '<tr data-id="' + escapeHtml(sch.id) + '">' +
              '<td class="days-cell"><i class="fa-solid fa-calendar-days"></i> ' + escapeHtml(sch.days) + '</td>' +
              '<td class="time-cell">' + escapeHtml(sch.departureTime) + '</td>' +
              '<td><span class="bus-link">' + escapeHtml(sch.bus) + '</span></td>' +
              '<td class="route-text">' + escapeHtml(sch.route) + '</td>' +
              '<td class="text-right">' +
                '<div class="icon-actions">' +
                  '<button type="button" class="btn-icon btn-icon-edit" data-action="edit" data-id="' + escapeHtml(sch.id) + '" title="Edit Schedule" aria-label="Edit Schedule ' + escapeHtml(sch.bus) + ' ' + escapeHtml(sch.departureTime) + '"><i class="fa-regular fa-pen-to-square"></i></button>' +
                  '<button type="button" class="btn-icon btn-icon-view" data-action="view" data-id="' + escapeHtml(sch.id) + '" title="View Schedule" aria-label="View Schedule ' + escapeHtml(sch.bus) + ' ' + escapeHtml(sch.departureTime) + '"><i class="fa-regular fa-eye"></i></button>' +
                  '<button type="button" class="btn-icon btn-icon-delete" data-action="delete" data-id="' + escapeHtml(sch.id) + '" title="Delete Schedule" aria-label="Delete Schedule ' + escapeHtml(sch.bus) + ' ' + escapeHtml(sch.departureTime) + '"><i class="fa-solid fa-trash"></i></button>' +
                '</div>' +
              '</td>' +
            '</tr>'
          );
        })
        .join('');
    }

    function openEditFor(id) {
      var sch = schedules.find(function (s) { return s.id === id; });
      if (!sch) return;
      activeId = id;
      editError.hidden = true;
      document.getElementById('edit-sched-days').value = sch.days;
      document.getElementById('edit-sched-time').value = sch.departureTime;
      populateSelect(document.getElementById('edit-sched-bus'), getBusOptions(), sch.bus);
      populateSelect(document.getElementById('edit-sched-route'), getRouteOptions(), sch.route);
      openModal(modalEdit);
    }

    function openViewFor(id) {
      var sch = schedules.find(function (s) { return s.id === id; });
      if (!sch) return;
      activeId = id;
      var details = document.getElementById('view-schedule-details') || (modalView && modalView.querySelector('.detail-list'));
      if (details) {
        details.innerHTML =
          '<div class="detail-item"><span class="detail-label">Days of Week</span><span class="detail-value">' + escapeHtml(sch.days) + '</span></div>' +
          '<div class="detail-item"><span class="detail-label">Departure Time</span><span class="detail-value">' + escapeHtml(sch.departureTime) + '</span></div>' +
          '<div class="detail-item"><span class="detail-label">Assigned Bus</span><span class="detail-value"><span class="bus-link">' + escapeHtml(sch.bus) + '</span></span></div>' +
          '<div class="detail-item"><span class="detail-label">Route</span><span class="detail-value">' + escapeHtml(sch.route) + '</span></div>' +
          '<div class="detail-item"><span class="detail-label">Seat Reservations</span><span class="detail-value">' + escapeHtml(getSeatSummary(sch.bus)) + '</span></div>';
      }
      openModal(modalView);
    }

    function openDeleteFor(id) {
      var sch = schedules.find(function (s) { return s.id === id; });
      if (!sch) return;
      activeId = id;
      var delLabel = document.getElementById('delete-schedule-label') || (modalDelete && modalDelete.querySelector('.modal-body-text strong'));
      if (delLabel) delLabel.textContent = sch.departureTime + ' (' + sch.bus + ')';
      openModal(modalDelete);
    }

    var addTrigger = document.querySelector('.btn-primary-add');
    if (addTrigger) {
      addTrigger.addEventListener('click', function (e) {
        e.preventDefault();
        addForm.reset();
        document.getElementById('add-sched-time').value = '06:00:00';
        addError.hidden = true;
        populateSelect(document.getElementById('add-sched-bus'), getBusOptions(), '');
        populateSelect(document.getElementById('add-sched-route'), getRouteOptions(), '');
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
      var result = validateScheduleInput({
        days: document.getElementById('add-sched-days').value,
        departureTime: document.getElementById('add-sched-time').value,
        bus: document.getElementById('add-sched-bus').value,
        route: document.getElementById('add-sched-route').value,
      });
      if (!result.valid) {
        addError.textContent = result.error;
        addError.hidden = false;
        return;
      }
      addError.hidden = true;
      var newSched = Object.assign({ id: 'sch-' + Date.now() }, result.value);
      schedules.push(newSched);
      saveSchedules(schedules);
      renderTable();
      closeAllModals();
      showToast('Schedule for "' + newSched.bus + '" at ' + newSched.departureTime + ' saved.');
    });

    bindFormSubmit(editForm, function () {
      var result = validateScheduleInput({
        days: document.getElementById('edit-sched-days').value,
        departureTime: document.getElementById('edit-sched-time').value,
        bus: document.getElementById('edit-sched-bus').value,
        route: document.getElementById('edit-sched-route').value,
      });
      if (!result.valid) {
        editError.textContent = result.error;
        editError.hidden = false;
        return;
      }
      editError.hidden = true;
      schedules = schedules.map(function (s) {
        return s.id === activeId ? Object.assign({}, s, result.value) : s;
      });
      saveSchedules(schedules);
      renderTable();
      closeAllModals();
      showToast('Schedule updated.');
    });

    var confirmDeleteBtn = document.getElementById('btn-confirm-delete-schedule') || (modalDelete && modalDelete.querySelector('.btn-modal-danger'));
    if (confirmDeleteBtn) {
      confirmDeleteBtn.addEventListener('click', function (e) {
        e.preventDefault();
        var target = schedules.find(function (s) { return s.id === activeId; });
        if (!target) return;
        schedules = schedules.filter(function (s) { return s.id !== activeId; });
        saveSchedules(schedules);
        renderTable();
        closeAllModals();
        showToast('Schedule for "' + target.bus + '" deleted.');
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

  global.AIUB_BMS_SCHEDULES = {
    STORAGE_KEY: STORAGE_KEY,
    DEFAULT_SCHEDULES: DEFAULT_SCHEDULES,
    normalizeTime: normalizeTime,
    validateScheduleInput: validateScheduleInput,
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
      initSchedulesPage();
    });
  }
})(typeof window !== 'undefined' ? window : globalThis);

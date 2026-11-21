(function (global) {
  'use strict';

  var STORAGE_KEY = 'aiub_bms_buses';
  var DRIVERS_KEY = 'aiub_bms_drivers';
  var SCHEDULES_KEY = 'aiub_bms_schedules';
  var SESSION_KEY = 'aiub_bms_session';

  var DEFAULT_BUSES = [
    { id: 'bus-1', busNumber: 'Gazipur-01', plateNumber: 'N/A', seats: 40, reserved: 38, status: 'Active' },
    { id: 'bus-2', busNumber: 'Gazipur-02', plateNumber: 'N/A', seats: 40, reserved: 36, status: 'Active' },
    { id: 'bus-3', busNumber: 'Jatrabari-01', plateNumber: 'N/A', seats: 40, reserved: 39, status: 'Active' },
    { id: 'bus-4', busNumber: 'Jatrabari-02', plateNumber: 'N/A', seats: 40, reserved: 35, status: 'Active' },
    { id: 'bus-5', busNumber: 'Mirpur-01', plateNumber: 'N/A', seats: 40, reserved: 40, status: 'Active' },
    { id: 'bus-6', busNumber: 'Mirpur-02', plateNumber: 'N/A', seats: 40, reserved: 34, status: 'Active' },
    { id: 'bus-7', busNumber: 'Dhanmondi-01', plateNumber: 'N/A', seats: 40, reserved: 38, status: 'Active' },
    { id: 'bus-8', busNumber: 'Dhanmondi-02', plateNumber: 'N/A', seats: 40, reserved: 36, status: 'Active' },
  ];

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function validateBusInput(input, existingBuses, ignoreId) {
    var busNumber = String(input.busNumber || '').trim();
    var plateNumber = String(input.plateNumber || '').trim() || 'N/A';
    var seats = Number(input.seats);
    var status = String(input.status || 'Active').trim();

    if (!busNumber) {
      return { valid: false, error: 'Bus Number is required.' };
    }
    if (!Number.isInteger(seats) || seats < 10 || seats > 60) {
      return { valid: false, error: 'Seat Capacity must be a whole number between 10 and 60.' };
    }
    var duplicate = (existingBuses || []).some(function (b) {
      return b.id !== ignoreId && b.busNumber.toLowerCase() === busNumber.toLowerCase();
    });
    if (duplicate) {
      return { valid: false, error: 'A bus with number "' + busNumber + '" already exists.' };
    }
    if (['Active', 'Maintenance', 'Inactive'].indexOf(status) === -1) {
      return { valid: false, error: 'Operational Status must be Active, Maintenance, or Inactive.' };
    }

    return {
      valid: true,
      value: {
        busNumber: busNumber,
        plateNumber: plateNumber,
        seats: seats,
        status: status,
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

  function saveBuses(buses) {
    try {
      global.localStorage.setItem(STORAGE_KEY, JSON.stringify(buses));
    } catch (_err) {
      // Ignore storage quota errors
    }
  }

  function statusBadgeClass(status) {
    if (status === 'Maintenance') return 'badge-status-maintenance';
    if (status === 'Inactive') return 'badge-status-inactive';
    return 'badge-status-active';
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
    confirmModal.id = 'modal-logout';
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
      '.badge-status-maintenance{display:inline-block;background:#fef3c7;color:#b45309;font-size:.78rem;font-weight:700;padding:5px 12px;border-radius:6px}' +
      '.badge-status-inactive{display:inline-block;background:#e2e8f0;color:#475569;font-size:.78rem;font-weight:700;padding:5px 12px;border-radius:6px}' +
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

  function initBusesPage() {
    ensureHelperStyles();
    var buses = loadJson(STORAGE_KEY, DEFAULT_BUSES);
    var activeId = null;

    var tbody = document.getElementById('buses-tbody') || document.querySelector('table tbody');
    var modalAdd = document.getElementById('modal-add');
    var modalEdit = document.getElementById('modal-edit');
    var modalView = document.getElementById('modal-view');
    var modalDelete = document.getElementById('modal-delete');

    var addForm = document.getElementById('form-add-bus') || (modalAdd && modalAdd.querySelector('form'));
    var editForm = document.getElementById('form-edit-bus') || (modalEdit && modalEdit.querySelector('form'));
    var addError = ensureFormError(addForm, 'add-bus-error');
    var editError = ensureFormError(editForm, 'edit-bus-error');

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

    function findDriverForBus(busNumber) {
      var drivers = loadJson(DRIVERS_KEY, []);
      var found = drivers.find(function (d) { return d.assignedBus === busNumber; });
      return found ? found.fullName + ' (' + found.phone + ')' : 'Unassigned';
    }

    function findRouteForBus(busNumber) {
      var schedules = loadJson(SCHEDULES_KEY, []);
      var found = schedules.find(function (s) { return s.bus === busNumber; });
      return found ? found.route : 'No route scheduled';
    }

    function renderTable() {
      if (!tbody) return;
      if (buses.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="empty-state-cell">No buses registered yet. Click "Add New Bus" to register one.</td></tr>';
        return;
      }

      tbody.innerHTML = buses
        .map(function (bus) {
          return (
            '<tr data-id="' + escapeHtml(bus.id) + '">' +
              '<td class="fw-bold">' + escapeHtml(bus.busNumber) + '</td>' +
              '<td>' + escapeHtml(bus.plateNumber || 'N/A') + '</td>' +
              '<td class="text-center"><span class="badge-capacity">' + escapeHtml(bus.seats) + ' Seats</span></td>' +
              '<td class="text-center"><span class="' + statusBadgeClass(bus.status) + '">' + escapeHtml(bus.status) + '</span></td>' +
              '<td class="text-right">' +
                '<div class="icon-actions">' +
                  '<button type="button" class="btn-icon btn-icon-edit" data-action="edit" data-id="' + escapeHtml(bus.id) + '" title="Edit Bus" aria-label="Edit Bus ' + escapeHtml(bus.busNumber) + '"><i class="fa-regular fa-pen-to-square"></i></button>' +
                  '<button type="button" class="btn-icon btn-icon-view" data-action="view" data-id="' + escapeHtml(bus.id) + '" title="View Bus" aria-label="View Bus ' + escapeHtml(bus.busNumber) + '"><i class="fa-regular fa-eye"></i></button>' +
                  '<button type="button" class="btn-icon btn-icon-delete" data-action="delete" data-id="' + escapeHtml(bus.id) + '" title="Delete Bus" aria-label="Delete Bus ' + escapeHtml(bus.busNumber) + '"><i class="fa-solid fa-trash"></i></button>' +
                '</div>' +
              '</td>' +
            '</tr>'
          );
        })
        .join('');
    }

    function openEditFor(id) {
      var bus = buses.find(function (b) { return b.id === id; });
      if (!bus) return;
      activeId = id;
      editError.hidden = true;
      document.getElementById('edit-bus-no').value = bus.busNumber;
      document.getElementById('edit-plate').value = bus.plateNumber === 'N/A' ? '' : bus.plateNumber;
      document.getElementById('edit-seats').value = bus.seats;
      document.getElementById('edit-status').value = bus.status;
      openModal(modalEdit);
    }

    function openViewFor(id) {
      var bus = buses.find(function (b) { return b.id === id; });
      if (!bus) return;
      activeId = id;
      var reserved = typeof bus.reserved === 'number' ? Math.min(bus.reserved, bus.seats) : 0;
      var details = document.getElementById('view-bus-details') || (modalView && modalView.querySelector('.detail-list'));
      if (details) {
        details.innerHTML =
          '<div class="detail-item"><span class="detail-label">Bus Number</span><span class="detail-value">' + escapeHtml(bus.busNumber) + '</span></div>' +
          '<div class="detail-item"><span class="detail-label">Bus Plate Number</span><span class="detail-value">' + escapeHtml(bus.plateNumber || 'N/A') + '</span></div>' +
          '<div class="detail-item"><span class="detail-label">Seat Capacity</span><span class="detail-value">' + escapeHtml(bus.seats) + ' Seats (' + escapeHtml(reserved) + ' Reserved)</span></div>' +
          '<div class="detail-item"><span class="detail-label">Assigned Driver</span><span class="detail-value">' + escapeHtml(findDriverForBus(bus.busNumber)) + '</span></div>' +
          '<div class="detail-item"><span class="detail-label">Assigned Route</span><span class="detail-value">' + escapeHtml(findRouteForBus(bus.busNumber)) + '</span></div>' +
          '<div class="detail-item"><span class="detail-label">Operational Status</span><span class="detail-value"><span class="' + statusBadgeClass(bus.status) + '">' + escapeHtml(bus.status) + '</span></span></div>';
      }
      openModal(modalView);
    }

    function openDeleteFor(id) {
      var bus = buses.find(function (b) { return b.id === id; });
      if (!bus) return;
      activeId = id;
      var delName = document.getElementById('delete-bus-name') || (modalDelete && modalDelete.querySelector('.modal-body-text strong'));
      if (delName) delName.textContent = bus.busNumber;
      openModal(modalDelete);
    }

    var addTrigger = document.querySelector('.btn-primary-add');
    if (addTrigger) {
      addTrigger.addEventListener('click', function (e) {
        e.preventDefault();
        addForm.reset();
        document.getElementById('add-seats').value = '40';
        document.getElementById('add-status').value = 'Active';
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
      var result = validateBusInput(
        {
          busNumber: document.getElementById('add-bus-no').value,
          plateNumber: document.getElementById('add-plate').value,
          seats: document.getElementById('add-seats').value,
          status: document.getElementById('add-status').value,
        },
        buses,
        null
      );
      if (!result.valid) {
        addError.textContent = result.error;
        addError.hidden = false;
        return;
      }
      addError.hidden = true;
      var newBus = {
        id: 'bus-' + Date.now(),
        busNumber: result.value.busNumber,
        plateNumber: result.value.plateNumber,
        seats: result.value.seats,
        reserved: 0,
        status: result.value.status,
      };
      buses.push(newBus);
      saveBuses(buses);
      renderTable();
      closeAllModals();
      showToast('Bus "' + newBus.busNumber + '" added successfully.');
    });

    bindFormSubmit(editForm, function () {
      var result = validateBusInput(
        {
          busNumber: document.getElementById('edit-bus-no').value,
          plateNumber: document.getElementById('edit-plate').value,
          seats: document.getElementById('edit-seats').value,
          status: document.getElementById('edit-status').value,
        },
        buses,
        activeId
      );
      if (!result.valid) {
        editError.textContent = result.error;
        editError.hidden = false;
        return;
      }
      editError.hidden = true;
      buses = buses.map(function (b) {
        if (b.id !== activeId) return b;
        return Object.assign({}, b, result.value);
      });
      saveBuses(buses);
      renderTable();
      closeAllModals();
      showToast('Bus "' + result.value.busNumber + '" updated.');
    });

    var confirmDeleteBtn = document.getElementById('btn-confirm-delete-bus') || (modalDelete && modalDelete.querySelector('.btn-modal-danger'));
    if (confirmDeleteBtn) {
      confirmDeleteBtn.addEventListener('click', function (e) {
        e.preventDefault();
        var target = buses.find(function (b) { return b.id === activeId; });
        if (!target) return;
        buses = buses.filter(function (b) { return b.id !== activeId; });
        saveBuses(buses);
        renderTable();
        closeAllModals();
        showToast('Bus "' + target.busNumber + '" removed.');
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

  global.AIUB_BMS_BUSES = {
    STORAGE_KEY: STORAGE_KEY,
    DEFAULT_BUSES: DEFAULT_BUSES,
    validateBusInput: validateBusInput,
    statusBadgeClass: statusBadgeClass,
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
      initBusesPage();
    });
  }
})(typeof window !== 'undefined' ? window : globalThis);

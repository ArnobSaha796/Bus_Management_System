(function (global) {
  'use strict';

  var STORAGE_KEY = 'aiub_bms_drivers';
  var BUSES_KEY = 'aiub_bms_buses';
  var SCHEDULES_KEY = 'aiub_bms_schedules';
  var SESSION_KEY = 'aiub_bms_session';

  var DEFAULT_DRIVERS = [
    { id: 'drv-1', fullName: 'Md. Rafiqul Islam', phone: '+880 1712-458920', license: 'DL-DHK-2019-88412', assignedBus: 'Gazipur-01' },
    { id: 'drv-2', fullName: 'Abdul Karim Mia', phone: '+880 1819-339104', license: 'DL-DHK-2020-55301', assignedBus: 'Gazipur-02' },
    { id: 'drv-3', fullName: 'Md. Mizanur Rahman', phone: '+880 1911-772819', license: 'DL-DHK-2018-41209', assignedBus: 'Jatrabari-01' },
    { id: 'drv-4', fullName: 'Shahidul Alam', phone: '+880 1675-883410', license: 'DL-DHK-2021-90415', assignedBus: 'Mirpur-01' },
    { id: 'drv-5', fullName: 'Kamrul Hasan', phone: '+880 1755-609123', license: 'DL-DHK-2019-74108', assignedBus: 'Dhanmondi-01' },
  ];

  var FALLBACK_BUS_NAMES = [
    'Gazipur-01', 'Gazipur-02', 'Jatrabari-01', 'Jatrabari-02',
    'Mirpur-01', 'Mirpur-02', 'Dhanmondi-01', 'Dhanmondi-02',
  ];

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function validateDriverInput(input, existingDrivers, ignoreId) {
    var fullName = String(input.fullName || '').trim();
    var phone = String(input.phone || '').trim();
    var license = String(input.license || '').trim().toUpperCase();
    var assignedBus = String(input.assignedBus || '').trim();

    if (fullName.length < 3) {
      return { valid: false, error: 'Driver Full Name must be at least 3 characters.' };
    }
    if (!/^[+\d][\d\s-]{8,18}$/.test(phone)) {
      return { valid: false, error: 'Please enter a valid Phone Number (e.g., +880 1711-000000).' };
    }
    if (license.length < 5) {
      return { valid: false, error: 'BRTA License Number is required (at least 5 characters).' };
    }
    var duplicateLicense = (existingDrivers || []).some(function (d) {
      return d.id !== ignoreId && d.license.toUpperCase() === license;
    });
    if (duplicateLicense) {
      return { valid: false, error: 'License number "' + license + '" is already registered.' };
    }
    if (!assignedBus) {
      return { valid: false, error: 'Please select an Assigned Bus.' };
    }

    return {
      valid: true,
      value: {
        fullName: fullName,
        phone: phone,
        license: license,
        assignedBus: assignedBus,
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

  function saveDrivers(drivers) {
    try {
      global.localStorage.setItem(STORAGE_KEY, JSON.stringify(drivers));
    } catch (_err) {
      // Ignore
    }
  }

  function getAvailableBusNames() {
    var buses = loadJson(BUSES_KEY, []);
    if (buses.length > 0) {
      return buses.map(function (b) { return b.busNumber; });
    }
    return FALLBACK_BUS_NAMES.slice();
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

  function initDriversPage() {
    ensureHelperStyles();
    var drivers = loadJson(STORAGE_KEY, DEFAULT_DRIVERS);
    var activeId = null;

    var tbody = document.getElementById('drivers-tbody') || document.querySelector('table tbody');
    var modalAdd = document.getElementById('modal-add');
    var modalEdit = document.getElementById('modal-edit');
    var modalView = document.getElementById('modal-view');
    var modalDelete = document.getElementById('modal-delete');

    var addForm = document.getElementById('form-add-driver') || (modalAdd && modalAdd.querySelector('form'));
    var editForm = document.getElementById('form-edit-driver') || (modalEdit && modalEdit.querySelector('form'));
    var addError = ensureFormError(addForm, 'add-driver-error');
    var editError = ensureFormError(editForm, 'edit-driver-error');

    function populateBusSelect(selectEl, selectedValue) {
      var names = getAvailableBusNames();
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

    function findRouteForBus(busNumber) {
      var schedules = loadJson(SCHEDULES_KEY, []);
      var found = schedules.find(function (s) { return s.bus === busNumber; });
      return found ? found.route : 'No route scheduled';
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
      if (drivers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="empty-state-cell">No drivers registered yet. Click "Add New Driver" to register one.</td></tr>';
        return;
      }

      tbody.innerHTML = drivers
        .map(function (drv) {
          return (
            '<tr data-id="' + escapeHtml(drv.id) + '">' +
              '<td class="fw-bold">' + escapeHtml(drv.fullName) + '</td>' +
              '<td>' + escapeHtml(drv.phone) + '</td>' +
              '<td>' + escapeHtml(drv.license) + '</td>' +
              '<td><span class="bus-link">' + escapeHtml(drv.assignedBus) + '</span></td>' +
              '<td class="text-right">' +
                '<div class="icon-actions">' +
                  '<button type="button" class="btn-icon btn-icon-edit" data-action="edit" data-id="' + escapeHtml(drv.id) + '" title="Edit Driver" aria-label="Edit Driver ' + escapeHtml(drv.fullName) + '"><i class="fa-regular fa-pen-to-square"></i></button>' +
                  '<button type="button" class="btn-icon btn-icon-view" data-action="view" data-id="' + escapeHtml(drv.id) + '" title="View Driver" aria-label="View Driver ' + escapeHtml(drv.fullName) + '"><i class="fa-regular fa-eye"></i></button>' +
                  '<button type="button" class="btn-icon btn-icon-delete" data-action="delete" data-id="' + escapeHtml(drv.id) + '" title="Delete Driver" aria-label="Delete Driver ' + escapeHtml(drv.fullName) + '"><i class="fa-solid fa-trash"></i></button>' +
                '</div>' +
              '</td>' +
            '</tr>'
          );
        })
        .join('');
    }

    function openEditFor(id) {
      var drv = drivers.find(function (d) { return d.id === id; });
      if (!drv) return;
      activeId = id;
      editError.hidden = true;
      document.getElementById('edit-driver-name').value = drv.fullName;
      document.getElementById('edit-driver-phone').value = drv.phone;
      document.getElementById('edit-driver-license').value = drv.license;
      populateBusSelect(document.getElementById('edit-driver-bus'), drv.assignedBus);
      openModal(modalEdit);
    }

    function openViewFor(id) {
      var drv = drivers.find(function (d) { return d.id === id; });
      if (!drv) return;
      activeId = id;
      var details = document.getElementById('view-driver-details') || (modalView && modalView.querySelector('.detail-list'));
      if (details) {
        details.innerHTML =
          '<div class="detail-item"><span class="detail-label">Full Name</span><span class="detail-value">' + escapeHtml(drv.fullName) + '</span></div>' +
          '<div class="detail-item"><span class="detail-label">Phone Number</span><span class="detail-value">' + escapeHtml(drv.phone) + '</span></div>' +
          '<div class="detail-item"><span class="detail-label">License Number</span><span class="detail-value">' + escapeHtml(drv.license) + '</span></div>' +
          '<div class="detail-item"><span class="detail-label">Assigned Bus</span><span class="detail-value"><span class="bus-link">' + escapeHtml(drv.assignedBus) + '</span></span></div>' +
          '<div class="detail-item"><span class="detail-label">Assigned Route</span><span class="detail-value">' + escapeHtml(findRouteForBus(drv.assignedBus)) + '</span></div>';
      }
      openModal(modalView);
    }

    function openDeleteFor(id) {
      var drv = drivers.find(function (d) { return d.id === id; });
      if (!drv) return;
      activeId = id;
      var delName = document.getElementById('delete-driver-name') || (modalDelete && modalDelete.querySelector('.modal-body-text strong'));
      var delNote = document.getElementById('delete-driver-note') || (modalDelete && modalDelete.querySelector('.text-danger-note'));
      if (delName) delName.textContent = drv.fullName;
      if (delNote) delNote.textContent = 'Bus ' + drv.assignedBus + ' will require a new driver assignment.';
      openModal(modalDelete);
    }

    var addTrigger = document.querySelector('.btn-primary-add');
    if (addTrigger) {
      addTrigger.addEventListener('click', function (e) {
        e.preventDefault();
        addForm.reset();
        addError.hidden = true;
        populateBusSelect(document.getElementById('add-driver-bus'), '');
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
      var result = validateDriverInput(
        {
          fullName: document.getElementById('add-driver-name').value,
          phone: document.getElementById('add-driver-phone').value,
          license: document.getElementById('add-driver-license').value,
          assignedBus: document.getElementById('add-driver-bus').value,
        },
        drivers,
        null
      );
      if (!result.valid) {
        addError.textContent = result.error;
        addError.hidden = false;
        return;
      }
      addError.hidden = true;
      var newDriver = Object.assign({ id: 'drv-' + Date.now() }, result.value);
      drivers.push(newDriver);
      saveDrivers(drivers);
      renderTable();
      closeAllModals();
      showToast('Driver "' + newDriver.fullName + '" registered.');
    });

    bindFormSubmit(editForm, function () {
      var result = validateDriverInput(
        {
          fullName: document.getElementById('edit-driver-name').value,
          phone: document.getElementById('edit-driver-phone').value,
          license: document.getElementById('edit-driver-license').value,
          assignedBus: document.getElementById('edit-driver-bus').value,
        },
        drivers,
        activeId
      );
      if (!result.valid) {
        editError.textContent = result.error;
        editError.hidden = false;
        return;
      }
      editError.hidden = true;
      drivers = drivers.map(function (d) {
        return d.id === activeId ? Object.assign({}, d, result.value) : d;
      });
      saveDrivers(drivers);
      renderTable();
      closeAllModals();
      showToast('Driver "' + result.value.fullName + '" updated.');
    });

    var confirmDeleteBtn = document.getElementById('btn-confirm-delete-driver') || (modalDelete && modalDelete.querySelector('.btn-modal-danger'));
    if (confirmDeleteBtn) {
      confirmDeleteBtn.addEventListener('click', function (e) {
        e.preventDefault();
        var target = drivers.find(function (d) { return d.id === activeId; });
        if (!target) return;
        drivers = drivers.filter(function (d) { return d.id !== activeId; });
        saveDrivers(drivers);
        renderTable();
        closeAllModals();
        showToast('Driver "' + target.fullName + '" removed.');
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

  global.AIUB_BMS_DRIVERS = {
    STORAGE_KEY: STORAGE_KEY,
    DEFAULT_DRIVERS: DEFAULT_DRIVERS,
    validateDriverInput: validateDriverInput,
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
      initDriversPage();
    });
  }
})(typeof window !== 'undefined' ? window : globalThis);

(function (global) {
  'use strict';

  var STORAGE_KEY = 'aiub_bms_notifications';
  var BUSES_KEY = 'aiub_bms_buses';
  var PASSES_KEY = 'aiub_bms_passes';
  var SESSION_KEY = 'aiub_bms_session';

  var DEFAULT_NOTIFICATIONS = [
    { id: 'not-1', title: 'Mirpur-01 Morning Bus Departed', message: 'Bus Mirpur-01 departed Mirpur 12 on schedule at 06:00 AM.', audience: 'Students & Linked Parents (Mirpur-01)', type: 'Departure Alert', sentTime: 'Today, 06:02 AM', deliveryStatus: 'Delivered to 40 Students & 40 Parents' },
    { id: 'not-2', title: 'Gazipur-01 Arrived at AIUB Campus', message: 'All 38 reserved students safely arrived at Kuril AIUB Gate.', audience: 'Students & Linked Parents (Gazipur-01)', type: 'Arrival Alert', sentTime: 'Today, 07:40 AM', deliveryStatus: 'Delivered to 38 Students & 38 Parents' },
    { id: 'not-3', title: 'November 2026 Monthly Pass Renewal Open', message: 'Students can renew their monthly bus pass before Nov 05, 2026.', audience: 'All Registered Students & Parents', type: 'Announcement', sentTime: 'Oct 25, 2026', deliveryStatus: 'Delivered to 312 Students & 312 Parents' },
  ];

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function validateNotificationInput(input) {
    var title = String(input.title || '').trim();
    var audience = String(input.audience || '').trim();
    var type = String(input.type || '').trim();
    var message = String(input.message || '').trim();

    if (title.length < 3) {
      return { valid: false, error: 'Notification Title must be at least 3 characters.' };
    }
    if (!audience) {
      return { valid: false, error: 'Please choose a Target Audience.' };
    }
    if (['Departure Alert', 'Arrival Alert', 'Announcement'].indexOf(type) === -1) {
      return { valid: false, error: 'Alert Type must be Departure Alert, Arrival Alert, or Announcement.' };
    }
    if (message.length < 5) {
      return { valid: false, error: 'Notification Message must be at least 5 characters.' };
    }

    return {
      valid: true,
      value: {
        title: title,
        audience: audience,
        type: type,
        message: message,
      },
    };
  }

  function computeTransportKpis(buses, passes) {
    var busList = Array.isArray(buses) && buses.length > 0 ? buses : [];
    var totalBuses = busList.length || 8;
    var activeBuses = busList.length > 0
      ? busList.filter(function (b) { return b.status === 'Active'; }).length
      : 8;

    var totalCapacity = busList.length > 0
      ? busList.reduce(function (sum, b) { return sum + (Number(b.seats) || 40); }, 0)
      : 320;
    var totalReserved = busList.length > 0
      ? busList.reduce(function (sum, b) {
          var seats = Number(b.seats) || 40;
          var reserved = typeof b.reserved === 'number' ? Math.min(b.reserved, seats) : 0;
          return sum + (b.status === 'Active' ? reserved : 0);
        }, 0)
      : 296;

    var approvedPassesDelta = Array.isArray(passes)
      ? passes.filter(function (p) { return p.status === 'Approved'; }).length - 1
      : 0;
    var activeMonthlyPasses = Math.max(0, 312 + approvedPassesDelta);

    var pad2 = function (n) { return n < 10 ? '0' + n : String(n); };

    return {
      activeBusesText: pad2(activeBuses) + ' / ' + pad2(totalBuses),
      seatReservationsText: totalReserved + ' / ' + totalCapacity,
      activePassesText: activeMonthlyPasses + ' Passes',
      onTimeRateText: '96.4%',
    };
  }

  function badgeClassForType(type) {
    if (type === 'Arrival Alert') return 'badge-arrival';
    if (type === 'Announcement') return 'badge-announcement';
    return 'badge-departure';
  }

  function formatCurrentSentTime(date) {
    var d = date || new Date();
    var hours = d.getHours();
    var minutes = d.getMinutes();
    var ampm = hours >= 12 ? 'PM' : 'AM';
    var h12 = hours % 12 || 12;
    var hh = h12 < 10 ? '0' + h12 : String(h12);
    var mm = minutes < 10 ? '0' + minutes : String(minutes);
    return 'Today, ' + hh + ':' + mm + ' ' + ampm;
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

  function saveNotifications(notifications) {
    try {
      global.localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
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

  function initNotificationsPage() {
    ensureHelperStyles();
    var notifications = loadJson(STORAGE_KEY, DEFAULT_NOTIFICATIONS);
    var activeId = null;

    var tbody = document.getElementById('notifications-tbody') || document.querySelector('table tbody');
    var modalAdd = document.getElementById('modal-add');
    var modalEdit = document.getElementById('modal-edit');
    var modalView = document.getElementById('modal-view');
    var modalDelete = document.getElementById('modal-delete');

    var addForm = document.getElementById('form-add-notif') || (modalAdd && modalAdd.querySelector('form'));
    var editForm = document.getElementById('form-edit-notif') || (modalEdit && modalEdit.querySelector('form'));
    var addError = ensureFormError(addForm, 'add-notif-error');
    var editError = ensureFormError(editForm, 'edit-notif-error');

    function renderKpis() {
      var buses = loadJson(BUSES_KEY, []);
      var passes = loadJson(PASSES_KEY, []);
      var kpis = computeTransportKpis(buses, passes);

      var summaryValues = document.querySelectorAll('.report-summary-grid .summary-value');
      var elBuses = document.getElementById('kpi-active-buses') || summaryValues[0];
      var elSeats = document.getElementById('kpi-seat-reservations') || summaryValues[1];
      var elPasses = document.getElementById('kpi-active-passes') || summaryValues[2];
      var elRate = document.getElementById('kpi-ontime-rate') || summaryValues[3];

      if (elBuses) elBuses.textContent = kpis.activeBusesText;
      if (elSeats) elSeats.textContent = kpis.seatReservationsText;
      if (elPasses) elPasses.textContent = kpis.activePassesText;
      if (elRate) elRate.textContent = kpis.onTimeRateText;
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
      renderKpis();
      if (!tbody) return;
      if (notifications.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="empty-state-cell">No notifications sent yet. Click "Send Notification" to broadcast an alert.</td></tr>';
        return;
      }

      tbody.innerHTML = notifications
        .map(function (notif) {
          return (
            '<tr data-id="' + escapeHtml(notif.id) + '">' +
              '<td>' +
                '<div class="cell-stack">' +
                  '<span class="primary-text">' + escapeHtml(notif.title) + '</span>' +
                  '<span class="sub-text">' + escapeHtml(notif.message) + '</span>' +
                '</div>' +
              '</td>' +
              '<td>' + escapeHtml(notif.audience) + '</td>' +
              '<td><span class="badge-type ' + badgeClassForType(notif.type) + '">' + escapeHtml(notif.type) + '</span></td>' +
              '<td>' + escapeHtml(notif.sentTime) + '</td>' +
              '<td class="text-right">' +
                '<div class="icon-actions">' +
                  '<button type="button" class="btn-icon btn-icon-edit" data-action="edit" data-id="' + escapeHtml(notif.id) + '" title="Edit Notification" aria-label="Edit Notification ' + escapeHtml(notif.title) + '"><i class="fa-regular fa-pen-to-square"></i></button>' +
                  '<button type="button" class="btn-icon btn-icon-view" data-action="view" data-id="' + escapeHtml(notif.id) + '" title="View Report" aria-label="View Notification ' + escapeHtml(notif.title) + '"><i class="fa-regular fa-eye"></i></button>' +
                  '<button type="button" class="btn-icon btn-icon-delete" data-action="delete" data-id="' + escapeHtml(notif.id) + '" title="Delete Alert" aria-label="Delete Notification ' + escapeHtml(notif.title) + '"><i class="fa-solid fa-trash"></i></button>' +
                '</div>' +
              '</td>' +
            '</tr>'
          );
        })
        .join('');
    }

    function openEditFor(id) {
      var notif = notifications.find(function (n) { return n.id === id; });
      if (!notif) return;
      activeId = id;
      editError.hidden = true;
      document.getElementById('edit-notif-title').value = notif.title;
      var targetSelect = document.getElementById('edit-notif-target');
      if (Array.from(targetSelect.options).every(function (opt) { return opt.value !== notif.audience; })) {
        var extra = document.createElement('option');
        extra.value = notif.audience;
        extra.textContent = notif.audience;
        targetSelect.appendChild(extra);
      }
      targetSelect.value = notif.audience;
      document.getElementById('edit-notif-type').value = notif.type;
      document.getElementById('edit-notif-msg').value = notif.message;
      openModal(modalEdit);
    }

    function openViewFor(id) {
      var notif = notifications.find(function (n) { return n.id === id; });
      if (!notif) return;
      activeId = id;
      var details = document.getElementById('view-notif-details') || (modalView && modalView.querySelector('.detail-list'));
      if (details) {
        details.innerHTML =
          '<div class="detail-item"><span class="detail-label">Title</span><span class="detail-value">' + escapeHtml(notif.title) + '</span></div>' +
          '<div class="detail-item"><span class="detail-label">Target Audience</span><span class="detail-value">' + escapeHtml(notif.audience) + '</span></div>' +
          '<div class="detail-item"><span class="detail-label">Alert Category</span><span class="detail-value">' + escapeHtml(notif.type) + '</span></div>' +
          '<div class="detail-item"><span class="detail-label">Delivery Status</span><span class="detail-value">' + escapeHtml(notif.deliveryStatus || 'Delivered to recipients') + '</span></div>' +
          '<div class="detail-item"><span class="detail-label">Message</span><span class="detail-value">' + escapeHtml(notif.message) + '</span></div>';
      }
      openModal(modalView);
    }

    function openDeleteFor(id) {
      var notif = notifications.find(function (n) { return n.id === id; });
      if (!notif) return;
      activeId = id;
      var delTitle = document.getElementById('delete-notif-title') || (modalDelete && modalDelete.querySelector('.modal-body-text strong'));
      if (delTitle) delTitle.textContent = notif.title;
      openModal(modalDelete);
    }

    var addTrigger = document.querySelector('.btn-primary-add');
    if (addTrigger) {
      addTrigger.addEventListener('click', function (e) {
        e.preventDefault();
        addForm.reset();
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
      var result = validateNotificationInput({
        title: document.getElementById('add-notif-title').value,
        audience: document.getElementById('add-notif-target').value,
        type: document.getElementById('add-notif-type').value,
        message: document.getElementById('add-notif-msg').value,
      });
      if (!result.valid) {
        addError.textContent = result.error;
        addError.hidden = false;
        return;
      }
      addError.hidden = true;
      var isAll = result.value.audience.indexOf('All Registered') !== -1;
      var newNotif = Object.assign(
        {
          id: 'not-' + Date.now(),
          sentTime: formatCurrentSentTime(),
          deliveryStatus: isAll ? 'Delivered to 312 Students & 312 Parents' : 'Delivered to 40 Students & 40 Parents',
        },
        result.value
      );
      notifications.unshift(newNotif);
      saveNotifications(notifications);
      renderTable();
      closeAllModals();
      showToast('Notification broadcast sent.');
    });

    bindFormSubmit(editForm, function () {
      var result = validateNotificationInput({
        title: document.getElementById('edit-notif-title').value,
        audience: document.getElementById('edit-notif-target').value,
        type: document.getElementById('edit-notif-type').value,
        message: document.getElementById('edit-notif-msg').value,
      });
      if (!result.valid) {
        editError.textContent = result.error;
        editError.hidden = false;
        return;
      }
      editError.hidden = true;
      notifications = notifications.map(function (n) {
        return n.id === activeId ? Object.assign({}, n, result.value) : n;
      });
      saveNotifications(notifications);
      renderTable();
      closeAllModals();
      showToast('Notification updated.');
    });

    var confirmDeleteBtn = document.getElementById('btn-confirm-delete-notif') || (modalDelete && modalDelete.querySelector('.btn-modal-danger'));
    if (confirmDeleteBtn) {
      confirmDeleteBtn.addEventListener('click', function (e) {
        e.preventDefault();
        var target = notifications.find(function (n) { return n.id === activeId; });
        if (!target) return;
        notifications = notifications.filter(function (n) { return n.id !== activeId; });
        saveNotifications(notifications);
        renderTable();
        closeAllModals();
        showToast('Notification log "' + target.title + '" deleted.');
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

  global.AIUB_BMS_NOTIFICATIONS = {
    STORAGE_KEY: STORAGE_KEY,
    DEFAULT_NOTIFICATIONS: DEFAULT_NOTIFICATIONS,
    validateNotificationInput: validateNotificationInput,
    computeTransportKpis: computeTransportKpis,
    formatCurrentSentTime: formatCurrentSentTime,
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
      initNotificationsPage();
    });
  }
})(typeof window !== 'undefined' ? window : globalThis);

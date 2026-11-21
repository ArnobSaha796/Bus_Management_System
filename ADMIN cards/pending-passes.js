(function (global) {
  'use strict';

  var STORAGE_KEY = 'aiub_bms_passes';
  var BUSES_KEY = 'aiub_bms_buses';
  var SESSION_KEY = 'aiub_bms_session';

  var DEFAULT_PASSES = [
    { id: 'pass-1', email: '23-54334-3@student.aiub.edu', studentName: 'Md. Tahmidur Rahman Khan', bus: 'Mirpur-01', passType: 'Monthly Pass (Two-Way)', validity: 'Nov 2026', trxId: 'bKash (BKX9948210)', price: '2,200 BDT', status: 'Pending', paymentVerified: true },
    { id: 'pass-2', email: '23-54613-3@student.aiub.edu', studentName: 'Arnob Saha', bus: 'Jatrabari-01', passType: 'Monthly Pass (Two-Way)', validity: 'Nov 2026', trxId: 'Nagad (NGD7741209)', price: '2,200 BDT', status: 'Pending', paymentVerified: true },
    { id: 'pass-3', email: '23-55092-3@student.aiub.edu', studentName: 'Md. Shahriar Kabir Seium', bus: 'Gazipur-01', passType: 'Monthly Pass (Two-Way)', validity: 'Nov 2026', trxId: 'bKash (BKX3310944)', price: '2,200 BDT', status: 'Pending', paymentVerified: false },
    { id: 'pass-4', email: '23-54310-3@student.aiub.edu', studentName: 'Aritra Mallick Joy', bus: 'Dhanmondi-02', passType: 'Monthly Pass (Morning Only)', validity: 'Nov 2026', trxId: 'SSLCommerz (SSL5510921)', price: '1,400 BDT', status: 'Approved', paymentVerified: true },
  ];

  var FALLBACK_BUSES = ['Mirpur-01', 'Gazipur-01', 'Jatrabari-01', 'Dhanmondi-02'];

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function priceForPassType(passType) {
    return String(passType || '').indexOf('Morning') !== -1 ? '1,400 BDT' : '2,200 BDT';
  }

  function validatePassInput(input) {
    var email = String(input.email || '').trim().toLowerCase();
    var passType = String(input.passType || '').trim();
    var bus = String(input.bus || '').trim();
    var trxId = String(input.trxId || '').trim();
    var price = String(input.price || '').trim() || priceForPassType(passType);
    var status = String(input.status || 'Pending').trim();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { valid: false, error: 'Please enter a valid Student University Email.' };
    }
    if (!passType) {
      return { valid: false, error: 'Pass Type is required.' };
    }
    if (input.requireTrx && trxId.length < 4) {
      return { valid: false, error: 'Payment Transaction ID is required (at least 4 characters).' };
    }

    return {
      valid: true,
      value: {
        email: email,
        passType: passType,
        bus: bus || 'Mirpur-01',
        trxId: trxId || 'bKash (Manual)',
        price: price,
        status: status,
      },
    };
  }

  function filterPasses(passes, filter) {
    if (!filter || filter === 'all') return passes.slice();
    return passes.filter(function (p) { return p.status === filter; });
  }

  function computePassCounts(passes) {
    return {
      all: passes.length,
      Pending: passes.filter(function (p) { return p.status === 'Pending'; }).length,
      Approved: passes.filter(function (p) { return p.status === 'Approved'; }).length,
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

  function savePasses(passes) {
    try {
      global.localStorage.setItem(STORAGE_KEY, JSON.stringify(passes));
    } catch (_err) {
      // Ignore
    }
  }

  function statusClass(status) {
    if (status === 'Approved') return 'status-approved';
    if (status === 'Declined') return 'status-declined';
    return 'status-pending';
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
      'button.btn-icon,button.btn-action,button.filter-tab{font-family:inherit;cursor:pointer}' +
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

  function initPendingPassesPage() {
    ensureHelperStyles();
    var passes = loadJson(STORAGE_KEY, DEFAULT_PASSES);
    var activeFilter = 'all';
    var activeId = null;

    var tbody = document.getElementById('passes-tbody') || document.querySelector('table tbody');
    var tabsContainer = document.getElementById('passes-filter-tabs') || document.querySelector('.filter-tabs');
    if (tabsContainer) {
      var filterOrder = ['all', 'Pending', 'Approved'];
      tabsContainer.querySelectorAll('.filter-tab').forEach(function (tab, idx) {
        if (!tab.getAttribute('data-filter') && filterOrder[idx]) {
          tab.setAttribute('data-filter', filterOrder[idx]);
        }
      });
    }
    var modalAdd = document.getElementById('modal-add');
    var modalEdit = document.getElementById('modal-edit');
    var modalView = document.getElementById('modal-view');
    var modalDelete = document.getElementById('modal-delete');

    var addForm = document.getElementById('form-add-pass') || (modalAdd && modalAdd.querySelector('form'));
    var editForm = document.getElementById('form-edit-pass') || (modalEdit && modalEdit.querySelector('form'));
    var addError = ensureFormError(addForm, 'add-pass-error');
    var editError = ensureFormError(editForm, 'edit-pass-error');

    function populateBusSelect(selectEl, selected) {
      var buses = loadJson(BUSES_KEY, []);
      var names = buses.length > 0 ? buses.map(function (b) { return b.busNumber; }) : FALLBACK_BUSES.slice();
      if (selected && names.indexOf(selected) === -1) names.unshift(selected);
      selectEl.innerHTML = names
        .map(function (n) {
          var sel = n === selected ? ' selected' : '';
          return '<option value="' + escapeHtml(n) + '"' + sel + '>' + escapeHtml(n) + '</option>';
        })
        .join('');
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

    function updateFilterTabs() {
      if (!tabsContainer) return;
      var counts = computePassCounts(passes);
      var tabAll = tabsContainer.querySelector('[data-filter="all"]');
      var tabPending = tabsContainer.querySelector('[data-filter="Pending"]');
      var tabApproved = tabsContainer.querySelector('[data-filter="Approved"]');

      if (tabAll) tabAll.textContent = 'All Requests (' + counts.all + ')';
      if (tabPending) tabPending.textContent = 'Pending (' + counts.Pending + ')';
      if (tabApproved) tabApproved.textContent = 'Approved (' + counts.Approved + ')';

      tabsContainer.querySelectorAll('.filter-tab').forEach(function (tab) {
        var isSelected = tab.getAttribute('data-filter') === activeFilter;
        tab.classList.toggle('active', isSelected);
        tab.setAttribute('aria-selected', isSelected ? 'true' : 'false');
      });
    }

    function renderTable() {
      updateFilterTabs();
      if (!tbody) return;
      var visible = filterPasses(passes, activeFilter);
      if (visible.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="empty-state-cell">No pass requests match the selected filter.</td></tr>';
        return;
      }

      tbody.innerHTML = visible
        .map(function (item) {
          var paymentHtml = item.paymentVerified
            ? '<span class="payment-verified"><i class="fa-solid fa-circle-check"></i> Payment Verified</span>'
            : '<span class="payment-unverified"><i class="fa-solid fa-clock"></i> Unverified Payment</span>';

          var quickActionHtml = '';
          if (item.status === 'Pending') {
            if (item.paymentVerified) {
              quickActionHtml =
                '<button type="button" class="btn-action btn-approve" data-action="quick-approve" data-id="' + escapeHtml(item.id) + '" title="Approve Pass" aria-label="Approve pass for ' + escapeHtml(item.email) + '"><i class="fa-solid fa-check"></i> Approve</button>';
            } else {
              quickActionHtml =
                '<button type="button" class="btn-action btn-verify" data-action="quick-verify" data-id="' + escapeHtml(item.id) + '" title="Verify Payment" aria-label="Verify payment for ' + escapeHtml(item.email) + '"><i class="fa-solid fa-shield-halved"></i> Verify</button>';
            }
          }

          return (
            '<tr data-id="' + escapeHtml(item.id) + '">' +
              '<td>' +
                '<div class="student-cell">' +
                  '<span class="student-email">' + escapeHtml(item.email) + '</span>' +
                  '<span class="student-meta">' + escapeHtml(item.studentName || 'AIUB Student') + ' · ' + escapeHtml(item.bus) + '</span>' +
                '</div>' +
              '</td>' +
              '<td>' +
                '<div class="pass-type-cell">' +
                  '<span class="pass-name">' + escapeHtml(item.passType) + '</span>' +
                  '<span class="pass-validity">' + escapeHtml(item.validity) + ' · ' + escapeHtml(item.trxId) + '</span>' +
                '</div>' +
              '</td>' +
              '<td class="price-cell">' + escapeHtml(item.price) + '</td>' +
              '<td>' +
                '<div class="status-cell">' +
                  '<span class="status-badge ' + statusClass(item.status) + '">' + escapeHtml(item.status) + '</span>' +
                  paymentHtml +
                '</div>' +
              '</td>' +
              '<td class="text-right">' +
                '<div class="action-buttons">' +
                  quickActionHtml +
                  '<button type="button" class="btn-icon btn-icon-edit" data-action="edit" data-id="' + escapeHtml(item.id) + '" title="Edit Request" aria-label="Edit pass request for ' + escapeHtml(item.email) + '"><i class="fa-regular fa-pen-to-square"></i></button>' +
                  '<button type="button" class="btn-icon btn-icon-view" data-action="view" data-id="' + escapeHtml(item.id) + '" title="View Request Details" aria-label="View pass request for ' + escapeHtml(item.email) + '"><i class="fa-regular fa-eye"></i></button>' +
                  '<button type="button" class="btn-icon btn-icon-delete" data-action="delete" data-id="' + escapeHtml(item.id) + '" title="Decline / Delete Request" aria-label="Delete pass request for ' + escapeHtml(item.email) + '"><i class="fa-solid fa-trash"></i></button>' +
                '</div>' +
              '</td>' +
            '</tr>'
          );
        })
        .join('');
    }

    function openEditFor(id) {
      var item = passes.find(function (p) { return p.id === id; });
      if (!item) return;
      activeId = id;
      editError.hidden = true;
      document.getElementById('edit-email').value = item.email;
      document.getElementById('edit-pass-type').value = item.passType;
      document.getElementById('edit-price').value = item.price;
      document.getElementById('edit-payment').value = item.paymentVerified ? 'Payment Verified' : 'Unverified Payment';
      document.getElementById('edit-approval').value = item.status;
      openModal(modalEdit);
    }

    function openViewFor(id) {
      var item = passes.find(function (p) { return p.id === id; });
      if (!item) return;
      activeId = id;
      var details = document.getElementById('view-pass-details') || (modalView && modalView.querySelector('.detail-list'));
      var studentIdPart = item.email.split('@')[0];
      if (details) {
        details.innerHTML =
          '<div class="detail-item"><span class="detail-label">Student Name</span><span class="detail-value">' + escapeHtml(item.studentName || 'AIUB Student') + ' (' + escapeHtml(studentIdPart) + ')</span></div>' +
          '<div class="detail-item"><span class="detail-label">Student Email</span><span class="detail-value">' + escapeHtml(item.email) + '</span></div>' +
          '<div class="detail-item"><span class="detail-label">Assigned Bus</span><span class="detail-value">' + escapeHtml(item.bus) + '</span></div>' +
          '<div class="detail-item"><span class="detail-label">Pass Type &amp; Validity</span><span class="detail-value">' + escapeHtml(item.passType) + ' · Valid ' + escapeHtml(item.validity) + '</span></div>' +
          '<div class="detail-item"><span class="detail-label">Payment Info</span><span class="detail-value">' + escapeHtml(item.price) + ' · ' + escapeHtml(item.trxId) + ' (' + (item.paymentVerified ? 'Verified' : 'Unverified') + ')</span></div>' +
          '<div class="detail-item"><span class="detail-label">Current Status</span><span class="detail-value ' + statusClass(item.status) + '">' + escapeHtml(item.status) + '</span></div>';
      }
      openModal(modalView);
    }

    function openDeleteFor(id) {
      var item = passes.find(function (p) { return p.id === id; });
      if (!item) return;
      activeId = id;
      var delEmail = document.getElementById('delete-pass-email') || (modalDelete && modalDelete.querySelector('.modal-body-text strong'));
      if (delEmail) delEmail.textContent = item.email;
      openModal(modalDelete);
    }

    if (tabsContainer) {
      tabsContainer.addEventListener('click', function (e) {
        var tab = e.target.closest('.filter-tab');
        if (!tab) return;
        activeFilter = tab.getAttribute('data-filter') || 'all';
        renderTable();
      });
    }

    var addTrigger = document.querySelector('.btn-primary-add');
    if (addTrigger) {
      addTrigger.addEventListener('click', function (e) {
        e.preventDefault();
        addForm.reset();
        addError.hidden = true;
        populateBusSelect(document.getElementById('add-bus'), '');
        openModal(modalAdd);
      });
    }

    var editPassTypeSelect = document.getElementById('edit-pass-type');
    if (editPassTypeSelect) {
      editPassTypeSelect.addEventListener('change', function () {
        document.getElementById('edit-price').value = priceForPassType(editPassTypeSelect.value);
      });
    }

    tbody.addEventListener('click', function (e) {
      var btn = e.target.closest('button[data-action]');
      if (!btn) return;
      var action = btn.getAttribute('data-action');
      var id = btn.getAttribute('data-id');

      if (action === 'quick-verify') {
        passes = passes.map(function (p) {
          return p.id === id ? Object.assign({}, p, { paymentVerified: true }) : p;
        });
        savePasses(passes);
        renderTable();
        showToast('Payment verified. Pass is now ready for approval.');
        return;
      }

      if (action === 'quick-approve') {
        passes = passes.map(function (p) {
          return p.id === id ? Object.assign({}, p, { status: 'Approved', paymentVerified: true }) : p;
        });
        savePasses(passes);
        renderTable();
        showToast('Bus pass request approved.');
        return;
      }

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
      var passTypeVal = document.getElementById('add-pass-type').value;
      var normalizedType = passTypeVal === 'morning' ? 'Monthly Pass (Morning Only)' : passTypeVal === 'two-way' ? 'Monthly Pass (Two-Way)' : passTypeVal;
      var result = validatePassInput({
        email: document.getElementById('add-email').value,
        passType: normalizedType,
        bus: document.getElementById('add-bus').value,
        trxId: document.getElementById('add-trx').value,
        price: priceForPassType(normalizedType),
        status: document.getElementById('add-status').value,
        requireTrx: true,
      });
      if (!result.valid) {
        addError.textContent = result.error;
        addError.hidden = false;
        return;
      }
      addError.hidden = true;
      var newPass = {
        id: 'pass-' + Date.now(),
        email: result.value.email,
        studentName: result.value.email.split('@')[0],
        bus: result.value.bus,
        passType: result.value.passType,
        validity: 'Nov 2026',
        trxId: result.value.trxId,
        price: result.value.price,
        status: result.value.status,
        paymentVerified: result.value.status === 'Approved',
      };
      passes.unshift(newPass);
      savePasses(passes);
      renderTable();
      closeAllModals();
      showToast('Pass request for "' + newPass.email + '" created.');
    });

    bindFormSubmit(editForm, function () {
      var existing = passes.find(function (p) { return p.id === activeId; });
      if (!existing) return;
      var result = validatePassInput({
        email: document.getElementById('edit-email').value,
        passType: document.getElementById('edit-pass-type').value,
        bus: existing.bus,
        trxId: existing.trxId,
        price: document.getElementById('edit-price').value,
        status: document.getElementById('edit-approval').value,
        requireTrx: false,
      });
      if (!result.valid) {
        editError.textContent = result.error;
        editError.hidden = false;
        return;
      }
      editError.hidden = true;
      var isVerified = document.getElementById('edit-payment').value === 'Payment Verified';
      passes = passes.map(function (p) {
        if (p.id !== activeId) return p;
        return Object.assign({}, p, {
          email: result.value.email,
          passType: result.value.passType,
          price: result.value.price,
          status: result.value.status,
          paymentVerified: isVerified,
        });
      });
      savePasses(passes);
      renderTable();
      closeAllModals();
      showToast('Pass request updated.');
    });

    var confirmDeleteBtn = document.getElementById('btn-confirm-delete-pass') || (modalDelete && modalDelete.querySelector('.btn-modal-danger'));
    if (confirmDeleteBtn) {
      confirmDeleteBtn.addEventListener('click', function (e) {
        e.preventDefault();
        var target = passes.find(function (p) { return p.id === activeId; });
        if (!target) return;
        passes = passes.filter(function (p) { return p.id !== activeId; });
        savePasses(passes);
        renderTable();
        closeAllModals();
        showToast('Pass request for "' + target.email + '" removed.');
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

  global.AIUB_BMS_PASSES = {
    STORAGE_KEY: STORAGE_KEY,
    DEFAULT_PASSES: DEFAULT_PASSES,
    priceForPassType: priceForPassType,
    validatePassInput: validatePassInput,
    filterPasses: filterPasses,
    computePassCounts: computePassCounts,
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
      initPendingPassesPage();
    });
  }
})(typeof window !== 'undefined' ? window : globalThis);

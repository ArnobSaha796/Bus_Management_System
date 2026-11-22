(function (global) {
  'use strict';

  var STORAGE_KEY = 'aiub_bms_accounts';
  var BUSES_KEY = 'aiub_bms_buses';
  var SESSION_KEY = 'aiub_bms_session';

  var DEFAULT_ACCOUNTS = [
    { id: 'acc-1', studentName: 'Md. Tahmidur Rahman Khan', studentId: '23-54334-3', department: 'Dept. of Computer Science', bus: 'Mirpur-01', pickup: 'Mirpur 12 Metro Station', parentName: 'Md. Habibur Rahman Khan', parentPhone: '+880 1711-234567', parentNote: 'Parent Linked', status: 'Approved' },
    { id: 'acc-2', studentName: 'Arnob Saha', studentId: '23-54613-3', department: 'Dept. of Computer Science', bus: 'Jatrabari-01', pickup: 'Jatrabari Ideal School Gate', parentName: 'Ashok Kumar Saha', parentPhone: '+880 1817-998812', parentNote: 'Parent Linked', status: 'Approved' },
    { id: 'acc-3', studentName: 'Aritra Mallick Joy', studentId: '23-54310-3', department: 'Dept. of Computer Science', bus: 'Dhanmondi-02', pickup: 'Dhanmondi 27 Rapa Plaza', parentName: 'Subrata Mallick', parentPhone: '+880 1914-552019', parentNote: 'Parent Linked', status: 'Approved' },
    { id: 'acc-4', studentName: 'Md. Shahriar Kabir Seium', studentId: '23-55092-3', department: 'Dept. of Computer Science', bus: 'Gazipur-01', pickup: 'Shibbari Intersection', parentName: 'Md. Humayun Kabir', parentPhone: '+880 1715-663201', parentNote: 'Verification Pending', status: 'Pending Approval' },
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

  function validateAccountInput(input, existingAccounts, ignoreId) {
    var studentName = String(input.studentName || '').trim();
    var studentId = String(input.studentId || '').trim();
    var bus = String(input.bus || '').trim();
    var pickup = String(input.pickup || '').trim();
    var parentName = String(input.parentName || '').trim();
    var parentPhone = String(input.parentPhone || '').trim();
    var status = String(input.status || 'Pending Approval').trim();

    if (studentName.length < 3) {
      return { valid: false, error: 'Student Full Name must be at least 3 characters.' };
    }
    if (!/^\d{2}-\d{5}-\d$/.test(studentId)) {
      return { valid: false, error: 'University ID must follow AIUB format XX-XXXXX-X (e.g., 23-54999-3).' };
    }
    var duplicate = (existingAccounts || []).some(function (a) {
      return a.id !== ignoreId && a.studentId === studentId;
    });
    if (duplicate) {
      return { valid: false, error: 'An account with University ID "' + studentId + '" already exists.' };
    }
    if (input.requireFullFields) {
      if (!pickup) {
        return { valid: false, error: 'Pickup Point is required.' };
      }
      if (!/^[+\d][\d\s-]{8,18}$/.test(parentPhone)) {
        return { valid: false, error: 'Please enter a valid Parent Phone Number.' };
      }
    }
    if (parentName.length < 3) {
      return { valid: false, error: 'Parent / Guardian Name must be at least 3 characters.' };
    }

    return {
      valid: true,
      value: {
        studentName: studentName,
        studentId: studentId,
        bus: bus || 'Mirpur-01',
        pickup: pickup,
        parentName: parentName,
        parentPhone: parentPhone,
        status: status,
      },
    };
  }

  function filterAccounts(accounts, filter) {
    if (!filter || filter === 'all') return accounts.slice();
    return accounts.filter(function (a) { return a.status === filter; });
  }

  function computeAccountCounts(accounts) {
    return {
      all: accounts.length,
      pending: accounts.filter(function (a) { return a.status === 'Pending Approval'; }).length,
      approved: accounts.filter(function (a) { return a.status === 'Approved'; }).length,
    };
  }

  function statusBadgeClass(status) {
    if (status === 'Approved') return 'badge-active';
    if (status === 'Deactivated') return 'badge-deactivated';
    return 'badge-pending';
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

  function saveAccounts(accounts) {
    try {
      global.localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
    } catch (_err) {
      // Ignore
    }
  }

  function syncUserStatus(studentId, status) {
    if (!studentId) return;
    try {
      var raw = global.localStorage.getItem('aiub_bms_users');
      if (!raw) return;
      var users = JSON.parse(raw);
      if (!Array.isArray(users)) return;
      var changed = false;
      users = users.map(function (u) {
        if (u.role === 'student' && u.studentId === studentId) {
          changed = true;
          return Object.assign({}, u, { status: status });
        }
        return u;
      });
      if (changed) global.localStorage.setItem('aiub_bms_users', JSON.stringify(users));
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
      'button.btn-icon,button.btn-action{font-family:inherit;cursor:pointer}' +
      '.badge-deactivated{background:#fee2e2;color:#b91c1c}' +
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

  function initAccountsPage() {
    try {
      var sRaw = global.localStorage.getItem(SESSION_KEY);
      var sess = sRaw && sRaw !== 'signed_out' && sRaw !== 'active' ? JSON.parse(sRaw) : null;
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
    ensureHelperStyles();
    var accounts = loadJson(STORAGE_KEY, DEFAULT_ACCOUNTS);
    var activeFilter = 'all';
    var activeId = null;

    var tbody = document.getElementById('accounts-tbody') || document.querySelector('table tbody');
    var tabsContainer = document.getElementById('accounts-filter-tabs') || document.querySelector('.filter-tabs');
    if (tabsContainer) {
      var filterOrder = ['all', 'Pending Approval', 'Approved'];
      tabsContainer.querySelectorAll('.filter-tab').forEach(function (tab, idx) {
        if (!tab.getAttribute('data-filter') && filterOrder[idx]) {
          tab.setAttribute('data-filter', filterOrder[idx]);
          tab.setAttribute('role', 'tab');
        }
      });
    }
    var modalAdd = document.getElementById('modal-add');
    var modalEdit = document.getElementById('modal-edit');
    var modalView = document.getElementById('modal-view');
    var modalDelete = document.getElementById('modal-delete');

    var addForm = document.getElementById('form-add-account') || (modalAdd && modalAdd.querySelector('form'));
    var editForm = document.getElementById('form-edit-account') || (modalEdit && modalEdit.querySelector('form'));
    var addError = ensureFormError(addForm, 'add-account-error');
    var editError = ensureFormError(editForm, 'edit-account-error');

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
      var counts = computeAccountCounts(accounts);
      var tabAll = tabsContainer.querySelector('[data-filter="all"]');
      var tabPending = tabsContainer.querySelector('[data-filter="Pending Approval"]');
      var tabApproved = tabsContainer.querySelector('[data-filter="Approved"]');

      if (tabAll) tabAll.textContent = 'All Accounts (' + counts.all + ')';
      if (tabPending) tabPending.textContent = 'Pending (' + counts.pending + ')';
      if (tabApproved) tabApproved.textContent = 'Approved (' + counts.approved + ')';

      tabsContainer.querySelectorAll('.filter-tab').forEach(function (tab) {
        var isSelected = tab.getAttribute('data-filter') === activeFilter;
        tab.classList.toggle('active', isSelected);
        tab.setAttribute('aria-selected', isSelected ? 'true' : 'false');
      });
    }

    function renderTable() {
      updateFilterTabs();
      if (!tbody) return;
      var visible = filterAccounts(accounts, activeFilter);
      if (visible.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="empty-state-cell">No student or parent accounts match the selected filter.</td></tr>';
        return;
      }

      tbody.innerHTML = visible
        .map(function (acc) {
          var approveBtn = acc.status === 'Pending Approval'
            ? '<button type="button" class="btn-action btn-approve" data-action="quick-approve" data-id="' + escapeHtml(acc.id) + '" title="Approve Account" aria-label="Approve Account ' + escapeHtml(acc.studentName) + '">Approve</button>'
            : '';

          return (
            '<tr data-id="' + escapeHtml(acc.id) + '">' +
              '<td>' +
                '<div class="cell-stack">' +
                  '<span class="primary-text">' + escapeHtml(acc.studentName) + '</span>' +
                  '<span class="sub-text">ID: ' + escapeHtml(acc.studentId) + ' · ' + escapeHtml(acc.department) + '</span>' +
                '</div>' +
              '</td>' +
              '<td>' +
                '<div class="cell-stack">' +
                  '<span class="bus-link">' + escapeHtml(acc.bus) + '</span>' +
                  '<span class="sub-text">Pickup: ' + escapeHtml(acc.pickup) + '</span>' +
                '</div>' +
              '</td>' +
              '<td>' +
                '<div class="cell-stack">' +
                  '<span class="primary-text">' + escapeHtml(acc.parentName) + '</span>' +
                  '<span class="sub-text">' + escapeHtml(acc.parentPhone) + ' · ' + escapeHtml(acc.parentNote) + '</span>' +
                '</div>' +
              '</td>' +
              '<td><span class="badge-status ' + statusBadgeClass(acc.status) + '">' + escapeHtml(acc.status) + '</span></td>' +
              '<td class="text-right">' +
                '<div class="icon-actions">' +
                  approveBtn +
                  '<button type="button" class="btn-icon btn-icon-edit" data-action="edit" data-id="' + escapeHtml(acc.id) + '" title="Edit Account" aria-label="Edit Account ' + escapeHtml(acc.studentName) + '"><i class="fa-regular fa-pen-to-square"></i></button>' +
                  '<button type="button" class="btn-icon btn-icon-view" data-action="view" data-id="' + escapeHtml(acc.id) + '" title="View Account" aria-label="View Account ' + escapeHtml(acc.studentName) + '"><i class="fa-regular fa-eye"></i></button>' +
                  '<button type="button" class="btn-icon btn-icon-delete" data-action="delete" data-id="' + escapeHtml(acc.id) + '" title="Deactivate / Delete" aria-label="Delete Account ' + escapeHtml(acc.studentName) + '"><i class="fa-solid fa-trash"></i></button>' +
                '</div>' +
              '</td>' +
            '</tr>'
          );
        })
        .join('');
    }

    function openEditFor(id) {
      var acc = accounts.find(function (a) { return a.id === id; });
      if (!acc) return;
      activeId = id;
      editError.hidden = true;
      document.getElementById('edit-stu-name').value = acc.studentName;
      document.getElementById('edit-stu-id').value = acc.studentId;
      document.getElementById('edit-parent-name').value = acc.parentName;
      document.getElementById('edit-acc-status').value = acc.status;
      openModal(modalEdit);
    }

    function openViewFor(id) {
      var acc = accounts.find(function (a) { return a.id === id; });
      if (!acc) return;
      activeId = id;
      var details = document.getElementById('view-account-details') || (modalView && modalView.querySelector('.detail-list'));
      if (details) {
        details.innerHTML =
          '<div class="detail-item"><span class="detail-label">Student Name &amp; ID</span><span class="detail-value">' + escapeHtml(acc.studentName) + ' (' + escapeHtml(acc.studentId) + ')</span></div>' +
          '<div class="detail-item"><span class="detail-label">Department</span><span class="detail-value">' + escapeHtml(acc.department) + '</span></div>' +
          '<div class="detail-item"><span class="detail-label">Assigned Bus &amp; Stop</span><span class="detail-value">' + escapeHtml(acc.bus) + ' · ' + escapeHtml(acc.pickup) + '</span></div>' +
          '<div class="detail-item"><span class="detail-label">Linked Parent / Guardian</span><span class="detail-value">' + escapeHtml(acc.parentName) + ' (' + escapeHtml(acc.parentPhone) + ')</span></div>' +
          '<div class="detail-item"><span class="detail-label">Account Status</span><span class="detail-value"><span class="badge-status ' + statusBadgeClass(acc.status) + '">' + escapeHtml(acc.status) + '</span></span></div>';
      }
      openModal(modalView);
    }

    function openDeleteFor(id) {
      var acc = accounts.find(function (a) { return a.id === id; });
      if (!acc) return;
      activeId = id;
      var delName = document.getElementById('delete-account-name') || (modalDelete && modalDelete.querySelector('.modal-body-text strong'));
      if (delName) delName.textContent = acc.studentName + ' (' + acc.studentId + ')';
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
        populateBusSelect(document.getElementById('add-stu-bus'), '');
        openModal(modalAdd);
      });
    }

    tbody.addEventListener('click', function (e) {
      var btn = e.target.closest('button[data-action]');
      if (!btn) return;
      var action = btn.getAttribute('data-action');
      var id = btn.getAttribute('data-id');

      if (action === 'quick-approve') {
        var approvedStudentId = null;
        accounts = accounts.map(function (a) {
          if (a.id === id) {
            approvedStudentId = a.studentId;
            return Object.assign({}, a, { status: 'Approved', parentNote: 'Parent Linked' });
          }
          return a;
        });
        saveAccounts(accounts);
        if (approvedStudentId) syncUserStatus(approvedStudentId, 'Approved');
        renderTable();
        showToast('Student & parent account approved.');
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
      var result = validateAccountInput(
        {
          studentName: document.getElementById('add-stu-name').value,
          studentId: document.getElementById('add-stu-id').value,
          bus: document.getElementById('add-stu-bus').value,
          pickup: document.getElementById('add-stu-pickup').value,
          parentName: document.getElementById('add-parent-name').value,
          parentPhone: document.getElementById('add-parent-phone').value,
          status: 'Pending Approval',
          requireFullFields: true,
        },
        accounts,
        null
      );
      if (!result.valid) {
        addError.textContent = result.error;
        addError.hidden = false;
        return;
      }
      addError.hidden = true;
      var newAcc = Object.assign(
        {
          id: 'acc-' + Date.now(),
          department: 'Dept. of Computer Science',
          parentNote: 'Verification Pending',
        },
        result.value
      );
      accounts.push(newAcc);
      saveAccounts(accounts);
      renderTable();
      closeAllModals();
      showToast('Account for "' + newAcc.studentName + '" created.');
    });

    bindFormSubmit(editForm, function () {
      var existing = accounts.find(function (a) { return a.id === activeId; });
      if (!existing) return;
      var statusVal = document.getElementById('edit-acc-status').value;
      var result = validateAccountInput(
        {
          studentName: document.getElementById('edit-stu-name').value,
          studentId: document.getElementById('edit-stu-id').value,
          bus: existing.bus,
          pickup: existing.pickup,
          parentName: document.getElementById('edit-parent-name').value,
          parentPhone: existing.parentPhone,
          status: statusVal,
          requireFullFields: false,
        },
        accounts,
        activeId
      );
      if (!result.valid) {
        editError.textContent = result.error;
        editError.hidden = false;
        return;
      }
      editError.hidden = true;
      accounts = accounts.map(function (a) {
        if (a.id !== activeId) return a;
        return Object.assign({}, a, {
          studentName: result.value.studentName,
          studentId: result.value.studentId,
          parentName: result.value.parentName,
          status: statusVal,
          parentNote: statusVal === 'Approved' ? 'Parent Linked' : statusVal === 'Deactivated' ? 'Access Revoked' : 'Verification Pending',
        });
      });
      saveAccounts(accounts);
      syncUserStatus(result.value.studentId, statusVal);
      renderTable();
      closeAllModals();
      showToast('Account updated.');
    });

    var confirmDeleteBtn = document.getElementById('btn-confirm-delete-account') || (modalDelete && modalDelete.querySelector('.btn-modal-danger'));
    if (confirmDeleteBtn) {
      confirmDeleteBtn.addEventListener('click', function (e) {
        e.preventDefault();
        var target = accounts.find(function (a) { return a.id === activeId; });
        if (!target) return;
        accounts = accounts.filter(function (a) { return a.id !== activeId; });
        saveAccounts(accounts);
        renderTable();
        closeAllModals();
        showToast('Account for "' + target.studentName + '" removed.');
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

  global.AIUB_BMS_ACCOUNTS = {
    STORAGE_KEY: STORAGE_KEY,
    DEFAULT_ACCOUNTS: DEFAULT_ACCOUNTS,
    validateAccountInput: validateAccountInput,
    filterAccounts: filterAccounts,
    computeAccountCounts: computeAccountCounts,
  };

  if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', initAccountsPage);
  }
})(typeof window !== 'undefined' ? window : globalThis);

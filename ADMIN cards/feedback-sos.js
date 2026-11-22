(function (global) {
  'use strict';

  var STORAGE_KEY = 'aiub_bms_feedback';
  var BUSES_KEY = 'aiub_bms_buses';
  var SESSION_KEY = 'aiub_bms_session';

  var DEFAULT_FEEDBACK = [
    { id: 'fb-1', userName: 'Md. Shahriar Kabir Seium', userEmail: '23-55092-3@student.aiub.edu', category: 'SOS Emergency', bus: 'Gazipur-01', location: 'Near Tongi Flyover', description: 'Bus engine overheated in heavy traffic; requesting backup bus support.', status: 'Urgent', resolutionNote: 'Backup bus Gazipur-02 dispatched to Tongi Flyover; all students transferred safely.' },
    { id: 'fb-2', userName: 'Md. Tahmidur Rahman Khan', userEmail: '23-54334-3@student.aiub.edu', category: 'Complaint', bus: 'Mirpur-01', location: 'Agargaon Pickup Point', description: 'AC cooling in the rear rows was low during the 09:00 AM trip.', status: 'In Review', resolutionNote: '' },
    { id: 'fb-3', userName: 'Arnob Saha', userEmail: '23-54613-3@student.aiub.edu', category: 'Complaint', bus: 'Jatrabari-01', location: 'Rampura Bridge Stop', description: 'Bus arrived 12 minutes late at Rampura pickup point due to roadblock.', status: 'In Review', resolutionNote: '' },
    { id: 'fb-4', userName: 'Aritra Mallick Joy', userEmail: '23-54310-3@student.aiub.edu', category: 'Feedback', bus: 'Dhanmondi-02', location: 'Dhanmondi 27 Stop', description: 'Live GPS tracking and seat reservation worked smoothly this morning.', status: 'Resolved', resolutionNote: 'Logged positive feedback with transport operations.' },
  ];

  var FALLBACK_BUSES = ['Gazipur-01', 'Mirpur-01', 'Jatrabari-01', 'Dhanmondi-02'];

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function validateIssueInput(input) {
    var userInput = String(input.user || '').trim();
    var category = String(input.category || '').trim();
    var bus = String(input.bus || '').trim();
    var location = String(input.location || '').trim();
    var description = String(input.description || '').trim();

    if (userInput.length < 3) {
      return { valid: false, error: 'Submitted By (Student Name or Email) is required.' };
    }
    if (['SOS Emergency', 'Complaint', 'Feedback'].indexOf(category) === -1) {
      return { valid: false, error: 'Please choose a valid Category.' };
    }
    if (!location) {
      return { valid: false, error: 'Location / Stop is required.' };
    }
    if (description.length < 5) {
      return { valid: false, error: 'Issue / Feedback Details must be at least 5 characters.' };
    }

    var isEmail = userInput.indexOf('@') !== -1;
    var userName = isEmail ? userInput.split('@')[0] : userInput;
    var userEmail = isEmail ? userInput : userInput.toLowerCase().replace(/\s+/g, '.') + '@student.aiub.edu';
    var defaultStatus = category === 'SOS Emergency' ? 'Urgent' : 'In Review';

    return {
      valid: true,
      value: {
        userName: userName,
        userEmail: userEmail,
        category: category,
        bus: bus || 'Gazipur-01',
        location: location,
        description: description,
        status: defaultStatus,
      },
    };
  }

  function validateResolutionInput(input) {
    var category = String(input.category || '').trim();
    var status = String(input.status || '').trim();
    var resolutionNote = String(input.resolutionNote || '').trim();

    if (['SOS Emergency', 'Complaint', 'Feedback'].indexOf(category) === -1) {
      return { valid: false, error: 'Please select a valid Category.' };
    }
    if (['Urgent', 'In Review', 'Resolved'].indexOf(status) === -1) {
      return { valid: false, error: 'Please select a valid Resolution Status.' };
    }
    if (status === 'Resolved' && resolutionNote.length < 5) {
      return { valid: false, error: 'Please enter an Admin Resolution Note (at least 5 characters) before resolving.' };
    }

    return {
      valid: true,
      value: {
        category: category,
        status: status,
        resolutionNote: resolutionNote,
      },
    };
  }

  function filterFeedback(items, filter) {
    if (!filter || filter === 'all') return items.slice();
    if (filter === 'Resolved') {
      return items.filter(function (i) { return i.status === 'Resolved'; });
    }
    return items.filter(function (i) { return i.category === filter; });
  }

  function computeFeedbackCounts(items) {
    return {
      all: items.length,
      sos: items.filter(function (i) { return i.category === 'SOS Emergency'; }).length,
      complaints: items.filter(function (i) { return i.category === 'Complaint'; }).length,
      resolved: items.filter(function (i) { return i.status === 'Resolved'; }).length,
    };
  }

  function categoryBadgeHtml(category) {
    if (category === 'SOS Emergency') {
      return '<span class="badge-category badge-sos"><i class="fa-solid fa-triangle-exclamation"></i> SOS Emergency</span>';
    }
    if (category === 'Feedback') {
      return '<span class="badge-category badge-feedback">Feedback</span>';
    }
    return '<span class="badge-category badge-complaint">Complaint</span>';
  }

  function statusClass(status) {
    if (status === 'Resolved') return 'status-resolved';
    if (status === 'Urgent') return 'status-open';
    return 'status-pending';
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

  function saveFeedback(items) {
    try {
      global.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
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
      'button.btn-icon,button.btn-resolve{font-family:inherit;cursor:pointer}' +
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

  function initFeedbackPage() {
    ensureHelperStyles();
    var items = loadJson(STORAGE_KEY, DEFAULT_FEEDBACK);
    var activeFilter = 'all';
    var activeId = null;

    var tbody = document.getElementById('feedback-tbody') || document.querySelector('table tbody');
    var tabsContainer = document.getElementById('feedback-filter-tabs') || document.querySelector('.filter-tabs');
    if (tabsContainer) {
      var filterOrder = ['all', 'SOS Emergency', 'Complaint', 'Resolved'];
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

    var addForm = document.getElementById('form-add-issue') || (modalAdd && modalAdd.querySelector('form'));
    var editForm = document.getElementById('form-edit-issue') || (modalEdit && modalEdit.querySelector('form'));
    var addError = ensureFormError(addForm, 'add-issue-error');
    var editError = ensureFormError(editForm, 'edit-issue-error');

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
      var counts = computeFeedbackCounts(items);
      var tabAll = tabsContainer.querySelector('[data-filter="all"]');
      var tabSos = tabsContainer.querySelector('[data-filter="SOS Emergency"]');
      var tabComplaints = tabsContainer.querySelector('[data-filter="Complaint"]');
      var tabResolved = tabsContainer.querySelector('[data-filter="Resolved"]');

      if (tabAll) tabAll.textContent = 'All Issues (' + counts.all + ')';
      if (tabSos) tabSos.textContent = 'SOS Alerts (' + counts.sos + ')';
      if (tabComplaints) tabComplaints.textContent = 'Complaints (' + counts.complaints + ')';
      if (tabResolved) tabResolved.textContent = 'Resolved (' + counts.resolved + ')';

      tabsContainer.querySelectorAll('.filter-tab').forEach(function (tab) {
        var isSelected = tab.getAttribute('data-filter') === activeFilter;
        tab.classList.toggle('active', isSelected);
        tab.setAttribute('aria-selected', isSelected ? 'true' : 'false');
      });
    }

    function renderTable() {
      updateFilterTabs();
      if (!tbody) return;
      var visible = filterFeedback(items, activeFilter);
      if (visible.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty-state-cell">No feedback or SOS alerts match this filter.</td></tr>';
        return;
      }

      tbody.innerHTML = visible
        .map(function (item) {
          var resolveBtn = item.status !== 'Resolved'
            ? '<button type="button" class="btn-resolve" data-action="resolve" data-id="' + escapeHtml(item.id) + '" title="Resolve Issue" aria-label="Resolve issue from ' + escapeHtml(item.userName) + '">Resolve</button>'
            : '';

          return (
            '<tr data-id="' + escapeHtml(item.id) + '">' +
              '<td>' +
                '<div class="cell-stack">' +
                  '<span class="primary-text">' + escapeHtml(item.userName) + '</span>' +
                  '<span class="sub-text">' + escapeHtml(item.userEmail) + '</span>' +
                '</div>' +
              '</td>' +
              '<td>' + categoryBadgeHtml(item.category) + '</td>' +
              '<td>' +
                '<div class="cell-stack">' +
                  '<span class="bus-link">' + escapeHtml(item.bus) + '</span>' +
                  '<span class="sub-text">' + escapeHtml(item.location) + '</span>' +
                '</div>' +
              '</td>' +
              '<td>' + escapeHtml(item.description) + '</td>' +
              '<td><span class="' + statusClass(item.status) + '">' + escapeHtml(item.status) + '</span></td>' +
              '<td class="text-right">' +
                '<div class="icon-actions">' +
                  resolveBtn +
                  '<button type="button" class="btn-icon btn-icon-edit" data-action="edit" data-id="' + escapeHtml(item.id) + '" title="Edit Issue" aria-label="Edit issue from ' + escapeHtml(item.userName) + '"><i class="fa-regular fa-pen-to-square"></i></button>' +
                  '<button type="button" class="btn-icon btn-icon-view" data-action="view" data-id="' + escapeHtml(item.id) + '" title="View Details" aria-label="View issue from ' + escapeHtml(item.userName) + '"><i class="fa-regular fa-eye"></i></button>' +
                  '<button type="button" class="btn-icon btn-icon-delete" data-action="delete" data-id="' + escapeHtml(item.id) + '" title="Delete Issue" aria-label="Delete issue from ' + escapeHtml(item.userName) + '"><i class="fa-solid fa-trash"></i></button>' +
                '</div>' +
              '</td>' +
            '</tr>'
          );
        })
        .join('');
    }

    function openEditFor(id, forceResolve) {
      var item = items.find(function (i) { return i.id === id; });
      if (!item) return;
      activeId = id;
      editError.hidden = true;
      document.getElementById('edit-issue-cat').value = item.category;
      document.getElementById('edit-issue-status').value = forceResolve ? 'Resolved' : item.status;
      document.getElementById('edit-issue-note').value =
        item.resolutionNote ||
        (forceResolve ? 'Action taken by AIUB Transport Office and verified with driver.' : '');
      openModal(modalEdit);
    }

    function openViewFor(id) {
      var item = items.find(function (i) { return i.id === id; });
      if (!item) return;
      activeId = id;
      var details = document.getElementById('view-issue-details') || (modalView && modalView.querySelector('.detail-list'));
      if (details) {
        details.innerHTML =
          '<div class="detail-item"><span class="detail-label">Submitted By</span><span class="detail-value">' + escapeHtml(item.userName) + ' (' + escapeHtml(item.userEmail) + ')</span></div>' +
          '<div class="detail-item"><span class="detail-label">Category</span><span class="detail-value">' + escapeHtml(item.category) + '</span></div>' +
          '<div class="detail-item"><span class="detail-label">Bus &amp; Location</span><span class="detail-value">' + escapeHtml(item.bus) + ' · ' + escapeHtml(item.location) + '</span></div>' +
          '<div class="detail-item"><span class="detail-label">Issue Description</span><span class="detail-value">' + escapeHtml(item.description) + '</span></div>' +
          '<div class="detail-item"><span class="detail-label">Status</span><span class="detail-value ' + statusClass(item.status) + '">' + escapeHtml(item.status) + '</span></div>' +
          (item.resolutionNote
            ? '<div class="detail-item"><span class="detail-label">Resolution Note</span><span class="detail-value">' + escapeHtml(item.resolutionNote) + '</span></div>'
            : '');
      }
      openModal(modalView);
    }

    function openDeleteFor(id) {
      var item = items.find(function (i) { return i.id === id; });
      if (!item) return;
      activeId = id;
      var delUser = document.getElementById('delete-issue-user') || (modalDelete && modalDelete.querySelector('.modal-body-text strong'));
      if (delUser) delUser.textContent = item.userName;
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
        populateBusSelect(document.getElementById('add-issue-bus'), '');
        openModal(modalAdd);
      });
    }

    tbody.addEventListener('click', function (e) {
      var btn = e.target.closest('button[data-action]');
      if (!btn) return;
      var action = btn.getAttribute('data-action');
      var id = btn.getAttribute('data-id');
      if (action === 'resolve') openEditFor(id, true);
      if (action === 'edit') openEditFor(id, false);
      if (action === 'view') openViewFor(id);
      if (action === 'delete') openDeleteFor(id);
    });

    var viewToEdit = document.getElementById('btn-view-to-edit') || (modalView && modalView.querySelector('.btn-modal-submit'));
    if (viewToEdit) {
      viewToEdit.addEventListener('click', function (e) {
        e.preventDefault();
        if (activeId) openEditFor(activeId, true);
      });
    }

    bindFormSubmit(addForm, function () {
      var result = validateIssueInput({
        user: document.getElementById('add-issue-user').value,
        category: document.getElementById('add-issue-cat').value,
        bus: document.getElementById('add-issue-bus').value,
        location: document.getElementById('add-issue-loc').value,
        description: document.getElementById('add-issue-desc').value,
      });
      if (!result.valid) {
        addError.textContent = result.error;
        addError.hidden = false;
        return;
      }
      addError.hidden = true;
      var newIssue = Object.assign({ id: 'fb-' + Date.now(), resolutionNote: '' }, result.value);
      items.unshift(newIssue);
      saveFeedback(items);
      renderTable();
      closeAllModals();
      showToast('New ' + newIssue.category + ' record logged.');
    });

    bindFormSubmit(editForm, function () {
      var result = validateResolutionInput({
        category: document.getElementById('edit-issue-cat').value,
        status: document.getElementById('edit-issue-status').value,
        resolutionNote: document.getElementById('edit-issue-note').value,
      });
      if (!result.valid) {
        editError.textContent = result.error;
        editError.hidden = false;
        return;
      }
      editError.hidden = true;
      items = items.map(function (i) {
        return i.id === activeId ? Object.assign({}, i, result.value) : i;
      });
      saveFeedback(items);
      renderTable();
      closeAllModals();
      showToast(result.value.status === 'Resolved' ? 'Issue marked as Resolved.' : 'Issue updated.');
    });

    var confirmDeleteBtn = document.getElementById('btn-confirm-delete-issue') || (modalDelete && modalDelete.querySelector('.btn-modal-danger'));
    if (confirmDeleteBtn) {
      confirmDeleteBtn.addEventListener('click', function (e) {
        e.preventDefault();
        var target = items.find(function (i) { return i.id === activeId; });
        if (!target) return;
        items = items.filter(function (i) { return i.id !== activeId; });
        saveFeedback(items);
        renderTable();
        closeAllModals();
        showToast('Issue record deleted.');
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

  global.AIUB_BMS_FEEDBACK = {
    STORAGE_KEY: STORAGE_KEY,
    DEFAULT_FEEDBACK: DEFAULT_FEEDBACK,
    validateIssueInput: validateIssueInput,
    validateResolutionInput: validateResolutionInput,
    filterFeedback: filterFeedback,
    computeFeedbackCounts: computeFeedbackCounts,
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
      initFeedbackPage();
    });
  }
})(typeof window !== 'undefined' ? window : globalThis);

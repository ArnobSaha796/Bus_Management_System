(function (global) {
  'use strict';

  var SESSION_KEY = 'aiub_bms_session';
  var ACCOUNTS_KEY = 'aiub_bms_accounts';

  function loadJson(key, fallback) {
    try {
      var raw = global.localStorage.getItem(key);
      if (!raw) return fallback;
      var parsed = JSON.parse(raw);
      return parsed != null ? parsed : fallback;
    } catch (_err) {
      return fallback;
    }
  }

  function resolveLayoutInfo(session, accounts) {
    var info = {
      parentEmail: 'parent@gmail.com',
      parentRole: 'Parent',
      studentId: '23-54334-3',
      studentName: 'Md. Tahmidur Rahman Khan',
    };

    if (session && typeof session === 'object' && session.role === 'parent') {
      if (session.email) info.parentEmail = session.email;
      if (session.linkedStudentId) info.studentId = session.linkedStudentId;
    }

    if (Array.isArray(accounts)) {
      var found = accounts.find(function (a) { return a.studentId === info.studentId; }) || accounts[0];
      if (found) {
        info.studentId = found.studentId || info.studentId;
        info.studentName = found.studentName || info.studentName;
      }
    }

    return info;
  }

  function ensureHelperStyles() {
    if (document.getElementById('bms-layout-runtime-styles')) return;
    var style = document.createElement('style');
    style.id = 'bms-layout-runtime-styles';
    style.textContent =
      '.bms-layout-modal{position:fixed;inset:0;background:rgba(15,23,42,.55);display:none;align-items:center;justify-content:center;padding:20px;z-index:2000}' +
      '.bms-layout-modal.is-open{display:flex}' +
      '.bms-layout-modal-card{background:#fff;border-radius:12px;border-top:5px solid #fbbf24;max-width:420px;width:100%;padding:22px;box-shadow:0 20px 40px rgba(15,23,42,.2)}' +
      '.bms-layout-modal-card h3{font-size:1.1rem;font-weight:800;color:#0f172a;margin-bottom:8px}' +
      '.bms-layout-modal-card p{font-size:.86rem;color:#475569;margin-bottom:18px}' +
      '.bms-layout-modal-actions{display:flex;justify-content:flex-end;gap:8px}' +
      '.bms-layout-btn{font-family:inherit;font-size:.84rem;font-weight:700;padding:8px 16px;border-radius:8px;cursor:pointer;border:1px solid #cbd5e1;background:#f8fafc;color:#334155}' +
      '.bms-layout-btn-danger{background:#dc3545;color:#fff;border-color:#dc3545}';
    document.head.appendChild(style);
  }

  function initParentLayout() {
    ensureHelperStyles();
    var info = resolveLayoutInfo(loadJson(SESSION_KEY, null), loadJson(ACCOUNTS_KEY, []));

    var emailEl = document.querySelector('.sidebar-footer .user-email');
    var roleEl = document.querySelector('.sidebar-footer .user-role');
    var avatarEl = document.querySelector('.sidebar-footer .user-avatar');
    var subtitleEl = document.querySelector('.dashboard-subtitle');

    if (emailEl) emailEl.textContent = info.parentEmail;
    if (roleEl) roleEl.textContent = info.parentRole;
    if (avatarEl && avatarEl.children.length === 0) {
      avatarEl.textContent = info.parentEmail.charAt(0).toUpperCase();
    }
    if (subtitleEl) {
      subtitleEl.innerHTML =
        'AIUB Campus Transport Monitoring &middot; Linked Student ID: <span class="mono">' +
        info.studentId +
        '</span>';
    }

    // Highlight active sidebar link based on current filename
    var currentFile = (global.location.pathname || '').split('/').pop() || 'index.html';
    document.querySelectorAll('.sidebar-nav .nav-item').forEach(function (link) {
      var href = link.getAttribute('href') || '';
      if (href === currentFile) {
        link.classList.add('active');
      } else if (href && href.charAt(0) !== '#') {
        link.classList.remove('active');
      }
    });

    // Logout confirmation modal
    var logoutBtn = document.querySelector('.btn-logout');
    if (logoutBtn) {
      var modal = document.createElement('div');
      modal.className = 'bms-layout-modal';
      modal.setAttribute('role', 'dialog');
      modal.setAttribute('aria-modal', 'true');
      modal.innerHTML =
        '<div class="bms-layout-modal-card">' +
          '<h3>Sign Out of Parent Portal?</h3>' +
          '<p>Your current session for ' + info.parentEmail + ' will be closed.</p>' +
          '<div class="bms-layout-modal-actions">' +
            '<button type="button" class="bms-layout-btn" data-action="cancel">Cancel</button>' +
            '<button type="button" class="bms-layout-btn bms-layout-btn-danger" data-action="confirm">Log Out</button>' +
          '</div>' +
        '</div>';
      document.body.appendChild(modal);

      logoutBtn.addEventListener('click', function () {
        modal.classList.add('is-open');
      });

      modal.addEventListener('click', function (e) {
        if (e.target === modal || e.target.getAttribute('data-action') === 'cancel') {
          modal.classList.remove('is-open');
        } else if (e.target.getAttribute('data-action') === 'confirm') {
          try {
            global.localStorage.setItem(SESSION_KEY, 'signed_out');
          } catch (_err) {
            // Ignore
          }
          global.location.href = '../Login page/login.html?role=parent';
        }
      });

      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') modal.classList.remove('is-open');
      });
    }
  }

  global.AIUB_BMS_PARENT_LAYOUT = {
    resolveLayoutInfo: resolveLayoutInfo,
  };

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initParentLayout);
    } else {
      initParentLayout();
    }
  }
})(typeof window !== 'undefined' ? window : globalThis);

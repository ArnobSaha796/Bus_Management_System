(function (global) {
  'use strict';

  var KEYS = {
    session: 'aiub_bms_session',
    accounts: 'aiub_bms_accounts',
    passes: 'aiub_bms_passes',
    studentPass: 'aiub_bms_student_pass',
    adminNotifications: 'aiub_bms_notifications',
    readIds: 'aiub_bms_student_notif_read',
  };

  function buildDefaultNotifs(studentCtx) {
    var bus = (studentCtx && studentCtx.bus) || 'Assigned Bus';
    var pickup = (studentCtx && studentCtx.pickup) || 'your pickup point';
    var passInfo = studentCtx && studentCtx.passInfo;
    var passMsg = passInfo
      ? 'Your ' + passInfo.plan + ' (' + passInfo.amount + ') is currently ' + passInfo.status + '.'
      : 'Your bus pass status can be reviewed anytime from the My Bus Pass page.';

    return [
      {
        id: 'snot-1',
        type: 'Arrival Update',
        time: 'Today, 06:24 AM',
        title: bus + ' Approaching ' + pickup,
        message: 'Your assigned morning bus ' + bus + ' is on route and approaching ' + pickup + ' pickup point shortly.',
      },
      {
        id: 'snot-2',
        type: 'Pass Verification',
        time: 'Today, 08:15 AM',
        title: passInfo ? 'Bus Pass Status: ' + passInfo.status : 'Bus Pass Verification',
        message: passMsg,
      },
      {
        id: 'snot-3',
        type: 'Departure Schedule',
        time: '10 Aug 2026, 02:30 PM',
        title: 'Afternoon Return Schedule Update',
        message: 'All afternoon campus departure buses from AIUB Gate 4 will depart at 04:45 PM during Fall 2026-2027.',
      },
    ];
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

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

  function saveJson(key, val) {
    try {
      global.localStorage.setItem(key, JSON.stringify(val));
    } catch (_err) {
      // Ignore
    }
  }

  function mergeStudentNotifications(adminNotifs, readIds, studentCtx) {
    var readSet = new Set(Array.isArray(readIds) ? readIds : ['snot-2', 'snot-3']);
    var items = [];
    var busLower = String((studentCtx && studentCtx.bus) || '').toLowerCase();

    if (Array.isArray(adminNotifs)) {
      adminNotifs.forEach(function (n) {
        var aud = String(n.audience || '').toLowerCase();
        var targetsSpecificBus = /(gazipur|jatrabari|mirpur|dhanmondi)-\d{2}/i.test(aud);
        var matchesThisBus = busLower && aud.indexOf(busLower) !== -1;
        var isGeneralStudent = !targetsSpecificBus && (aud.indexOf('all') !== -1 || aud.indexOf('student') !== -1);

        if (isGeneralStudent || matchesThisBus) {
          var id = 'admin-' + n.id;
          items.push({
            id: id,
            type: n.type || 'Announcement',
            time: n.sentTime || 'Today',
            title: n.title,
            message: n.message,
            unread: !readSet.has(id),
          });
        }
      });
    }

    buildDefaultNotifs(studentCtx).forEach(function (n) {
      items.push({
        id: n.id,
        type: n.type,
        time: n.time,
        title: n.title,
        message: n.message,
        unread: !readSet.has(n.id),
      });
    });

    return items;
  }

  function ensureHelperStyles() {
    if (document.getElementById('bms-stu-notif-styles')) return;
    var style = document.createElement('style');
    style.id = 'bms-stu-notif-styles';
    style.textContent =
      '.notif-toolbar{display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;flex-wrap:wrap;gap:10px}' +
      '.notif-filter-group{display:flex;gap:8px}' +
      '.btn-nf{font-family:inherit;font-size:12.5px;font-weight:600;padding:7px 13px;border-radius:6px;border:1px solid #cbd5e1;background:#fff;color:#334155;cursor:pointer}' +
      '.btn-nf.active{background:#003366;color:#fff;border-color:#003366}' +
      '.notif-item{cursor:pointer;transition:transform .12s,box-shadow .12s}' +
      '.notif-item:hover{box-shadow:0 4px 14px rgba(0,0,0,.06)}' +
      '.stu-modal-overlay{position:fixed;inset:0;background:rgba(15,23,42,.55);display:none;align-items:center;justify-content:center;padding:20px;z-index:2000}' +
      '.stu-modal-overlay.is-open{display:flex}' +
      '.stu-modal-card{background:#fff;border-radius:12px;border-top:4px solid #ffb703;max-width:400px;width:100%;padding:24px;box-shadow:0 20px 40px rgba(15,23,42,.22)}' +
      '.stu-modal-card h3{font-size:18px;font-weight:700;color:#003366;margin-bottom:8px}' +
      '.stu-modal-card p{font-size:13.5px;color:#475569;margin-bottom:20px}' +
      '.stu-modal-actions{display:flex;justify-content:flex-end;gap:10px}' +
      '.stu-btn{font-family:inherit;font-size:13px;font-weight:600;padding:9px 16px;border-radius:6px;cursor:pointer;border:1px solid #cbd5e1;background:#f8fafc;color:#334155}' +
      '.stu-btn-danger{background:#dc3545;color:#fff;border-color:#dc3545}';
    document.head.appendChild(style);
  }

  function initStudentNotificationsPage() {
    ensureHelperStyles();
    var session = loadJson(KEYS.session, null);
    if (!session || typeof session !== 'object' || session.role !== 'student') {
      global.location.replace('../Login page/login.html?role=student');
      return;
    }

    var studentId =
      session.studentId ||
      (/^\d{2}-\d{5}-\d$/.test(session.identifier || '') ? session.identifier : '');
    var email = session.email || (studentId ? studentId + '@student.aiub.edu' : '');
    var emailEl = document.querySelector('.sidebar-footer .user-email');
    var roleEl = document.querySelector('.sidebar-footer .user-role');
    if (emailEl && email) emailEl.textContent = email;
    if (roleEl && studentId) roleEl.textContent = 'Student · ' + studentId;

    var accounts = loadJson(KEYS.accounts, []);
    var matchedAcc = Array.isArray(accounts)
      ? accounts.find(function (a) { return a.studentId === studentId; })
      : null;

    var passKey = studentId ? KEYS.studentPass + '_' + studentId : KEYS.studentPass;
    var localPass = loadJson(passKey, null);
    var adminPasses = loadJson(KEYS.passes, []);
    var matchedPass = Array.isArray(adminPasses)
      ? adminPasses.find(function (p) {
          return (
            (p.studentEmail && p.studentEmail.toLowerCase() === email.toLowerCase()) ||
            (studentId && p.studentId === studentId)
          );
        })
      : null;
    var passInfo = matchedPass || localPass;

    var studentCtx = {
      studentId: studentId,
      bus: (matchedAcc && matchedAcc.bus) || '',
      pickup: (matchedAcc && matchedAcc.pickup) || 'Assigned Stop',
      passInfo: passInfo,
    };

    var readKey = studentId ? KEYS.readIds + '_' + studentId : KEYS.readIds;
    var readIds = loadJson(readKey, ['snot-2', 'snot-3']);
    if (!Array.isArray(readIds)) readIds = ['snot-2', 'snot-3'];
    var activeFilter = 'all';

    var container = document.querySelector('.notif-container');
    var listEl = document.querySelector('.notif-list');
    var toolbar = document.createElement('div');
    toolbar.className = 'notif-toolbar';
    toolbar.innerHTML =
      '<div class="notif-filter-group">' +
        '<button type="button" class="btn-nf active" data-filter="all">All</button>' +
        '<button type="button" class="btn-nf" data-filter="unread">Unread</button>' +
      '</div>' +
      '<button type="button" class="btn-nf" id="btn-stu-mark-all">Mark All as Read</button>';
    if (container && listEl) container.insertBefore(toolbar, listEl);

    function render() {
      var all = mergeStudentNotifications(loadJson(KEYS.adminNotifications, []), readIds, studentCtx);
      var unreadCount = all.filter(function (n) { return n.unread; }).length;
      var visible = activeFilter === 'unread' ? all.filter(function (n) { return n.unread; }) : all;

      toolbar.querySelector('[data-filter="all"]').textContent = 'All (' + all.length + ')';
      toolbar.querySelector('[data-filter="unread"]').textContent = 'Unread (' + unreadCount + ')';
      toolbar.querySelectorAll('[data-filter]').forEach(function (b) {
        b.classList.toggle('active', b.getAttribute('data-filter') === activeFilter);
      });

      if (!listEl) return;
      if (visible.length === 0) {
        listEl.innerHTML = '<article class="notif-item"><p style="text-align:center;color:#64748b">No unread notifications.</p></article>';
        return;
      }
      listEl.innerHTML = visible
        .map(function (n) {
          return (
            '<article class="notif-item' + (n.unread ? ' unread' : '') + '" data-id="' + escapeHtml(n.id) + '">' +
              '<div class="notif-meta">' +
                '<span class="notif-type">' + escapeHtml(n.type) + (n.unread ? ' &bull; Unread' : '') + '</span>' +
                '<span class="notif-time">' + escapeHtml(n.time) + '</span>' +
              '</div>' +
              '<h3>' + escapeHtml(n.title) + '</h3>' +
              '<p>' + escapeHtml(n.message) + '</p>' +
            '</article>'
          );
        })
        .join('');
    }

    toolbar.addEventListener('click', function (e) {
      var fBtn = e.target.closest('button[data-filter]');
      if (fBtn) {
        activeFilter = fBtn.getAttribute('data-filter');
        render();
        return;
      }
      if (e.target.id === 'btn-stu-mark-all') {
        var all = mergeStudentNotifications(loadJson(KEYS.adminNotifications, []), readIds, studentCtx);
        all.forEach(function (n) {
          if (readIds.indexOf(n.id) === -1) readIds.push(n.id);
        });
        saveJson(readKey, readIds);
        render();
      }
    });

    if (listEl) {
      listEl.addEventListener('click', function (e) {
        var item = e.target.closest('article[data-id]');
        if (!item) return;
        var id = item.getAttribute('data-id');
        if (readIds.indexOf(id) === -1) {
          readIds.push(id);
          saveJson(readKey, readIds);
          render();
        }
      });
    }

    // Logout modal
    var logoutBtn = document.querySelector('.btn-logout');
    if (logoutBtn) {
      var modal = document.createElement('div');
      modal.className = 'stu-modal-overlay';
      modal.innerHTML =
        '<div class="stu-modal-card"><h3>Confirm Sign Out</h3><p>Sign out of Student Panel (' + escapeHtml(email) + ')?</p><div class="stu-modal-actions"><button type="button" class="stu-btn" data-act="cancel">Cancel</button><button type="button" class="stu-btn stu-btn-danger" data-act="confirm">Log Out</button></div></div>';
      document.body.appendChild(modal);
      logoutBtn.addEventListener('click', function () { modal.classList.add('is-open'); });
      modal.addEventListener('click', function (e) {
        if (e.target === modal || e.target.getAttribute('data-act') === 'cancel') modal.classList.remove('is-open');
        if (e.target.getAttribute('data-act') === 'confirm') {
          try { global.localStorage.setItem(KEYS.session, 'signed_out'); } catch (_e) {}
          global.location.href = '../Login page/login.html?role=student';
        }
      });
    }

    render();
  }

  global.AIUB_BMS_STU_NOTIFICATIONS = {
    KEYS: KEYS,
    mergeStudentNotifications: mergeStudentNotifications,
  };

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initStudentNotificationsPage);
    } else {
      initStudentNotificationsPage();
    }
  }
})(typeof window !== 'undefined' ? window : globalThis);

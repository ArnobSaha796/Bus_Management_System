(function (global) {
  'use strict';

  var KEYS = {
    session: 'aiub_bms_session',
    users: 'aiub_bms_users',
    accounts: 'aiub_bms_accounts',
    passes: 'aiub_bms_passes',
    schedules: 'aiub_bms_schedules',
    notifications: 'aiub_bms_notifications',
    studentPass: 'aiub_bms_student_pass',
    bookings: 'aiub_bms_student_bookings',
    notifRead: 'aiub_bms_student_notif_read',
  };

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

  function resolveStudentIdentity(session, accounts, users) {
    var info = {
      email: '',
      name: 'AIUB Student',
      studentId: '',
      bus: 'Mirpur-01',
      pickup: 'Main Campus Gate',
      status: 'Approved',
    };

    if (session && typeof session === 'object' && session.role === 'student') {
      if (session.email) info.email = session.email;
      if (session.name) info.name = session.name;
      if (session.studentId) {
        info.studentId = session.studentId;
      } else if (session.identifier && /^\d{2}-\d{5}-\d$/.test(session.identifier)) {
        info.studentId = session.identifier;
      }
    }

    if (!info.studentId && Array.isArray(users) && info.email) {
      var matchedUser = users.find(function (u) {
        return u.role === 'student' && String(u.email || '').toLowerCase() === info.email.toLowerCase();
      });
      if (matchedUser && matchedUser.studentId) info.studentId = matchedUser.studentId;
    }

    if (Array.isArray(accounts) && accounts.length > 0 && info.studentId) {
      var acc = accounts.find(function (a) { return a.studentId === info.studentId; });
      if (acc) {
        info.name = acc.studentName || info.name;
        info.bus = acc.bus || info.bus;
        info.pickup = acc.pickup || info.pickup;
        info.status = acc.status || info.status;
      }
    }

    var savedProfile = info.studentId ? loadJson('aiub_bms_student_profile_' + info.studentId, null) : null;
    if (savedProfile) {
      if (savedProfile.fullName) info.name = savedProfile.fullName;
      if (savedProfile.email) info.email = savedProfile.email;
      if (savedProfile.pickup) info.pickup = savedProfile.pickup;
    }

    return info;
  }

  function resolveStudentPass(student, scopedPass, adminPasses) {
    var emailLower = String(student.email || '').toLowerCase();
    var idLower = String(student.studentId || '').toLowerCase();
    var adminMatch = Array.isArray(adminPasses)
      ? adminPasses.find(function (p) {
          if (scopedPass && scopedPass.trxId && p.trxId === scopedPass.trxId) return true;
          var pEmail = String(p.email || '').toLowerCase();
          return (emailLower && pEmail === emailLower) || (idLower && pEmail.indexOf(idLower) === 0);
        })
      : null;

    if (scopedPass) {
      return Object.assign({}, scopedPass, {
        status: (adminMatch && adminMatch.status) || scopedPass.status,
      });
    }
    if (adminMatch) {
      return {
        planName: adminMatch.passType || 'Monthly Pass',
        status: adminMatch.status || 'Pending',
      };
    }
    return { planName: 'No Active Pass', status: 'Buy Pass' };
  }

  function computeDashboardBadges(store) {
    var student = store.student || {};
    var bookings = Array.isArray(store.bookings) ? store.bookings : [];
    var activeBookings = bookings.filter(function (b) { return b.status !== 'Cancelled'; }).length;
    var schedules = Array.isArray(store.schedules) && store.schedules.length > 0 ? store.schedules.length : 8;
    var pass = resolveStudentPass(student, store.studentPass, store.passes);
    var readIds = new Set(Array.isArray(store.notifRead) ? store.notifRead : ['snot-2', 'snot-3']);
    var adminNotifs = Array.isArray(store.notifications) ? store.notifications : [];
    var busLower = String(student.bus || '').toLowerCase();

    var unreadAdmin = adminNotifs.filter(function (n) {
      var aud = String(n.audience || '').toLowerCase();
      var isBusSpecific = /\([^)]+\)/.test(aud);
      var matchesBus = busLower && aud.indexOf(busLower) !== -1;
      var relevant = aud.indexOf('all') !== -1 || matchesBus || (!isBusSpecific && aud.indexOf('student') !== -1);
      return relevant && !readIds.has('admin-' + n.id);
    }).length;
    var unreadDefault = readIds.has('snot-1') ? 0 : 1;

    return {
      passLabel: pass.planName + ' · ' + (pass.status || 'Approved'),
      passStatus: pass.status || 'Approved',
      schedulesCount: schedules + ' Active Routes',
      bookingsCount: activeBookings === 0 ? 'No Active Trips' : activeBookings + ' Booked Trip' + (activeBookings > 1 ? 's' : ''),
      unreadNotifs: unreadAdmin + unreadDefault,
    };
  }

  function ensureHelperStyles() {
    if (document.getElementById('bms-stu-dash-styles')) return;
    var style = document.createElement('style');
    style.id = 'bms-stu-dash-styles';
    style.textContent =
      '.stu-welcome-line{margin-top:8px;font-size:13.5px;color:#475569;font-weight:500}' +
      '.stu-card-badge{display:inline-block;margin-bottom:14px;padding:4px 10px;border-radius:999px;font-size:11.5px;font-weight:700;background:#eff6ff;color:#003366;border:1px solid #bfdbfe}' +
      '.stu-card-badge.is-warn{background:#fffbeb;color:#b45309;border-color:#fde68a}' +
      '.stu-card-badge.is-green{background:#dcfce7;color:#166534;border-color:#bbf7d0}' +
      '.stu-modal-overlay{position:fixed;inset:0;background:rgba(15,23,42,.55);display:none;align-items:center;justify-content:center;padding:20px;z-index:2000}' +
      '.stu-modal-overlay.is-open{display:flex}' +
      '.stu-modal-card{background:#fff;border-radius:12px;border-top:4px solid #ffb703;max-width:400px;width:100%;padding:24px;box-shadow:0 20px 40px rgba(15,23,42,.22)}' +
      '.stu-modal-card h3{font-size:18px;font-weight:700;color:#003366;margin-bottom:8px}' +
      '.stu-modal-card p{font-size:13.5px;color:#475569;margin-bottom:20px;line-height:1.5}' +
      '.stu-modal-actions{display:flex;justify-content:flex-end;gap:10px}' +
      '.stu-btn{font-family:inherit;font-size:13px;font-weight:600;padding:9px 16px;border-radius:6px;cursor:pointer;border:1px solid #cbd5e1;background:#f8fafc;color:#334155}' +
      '.stu-btn-danger{background:#dc3545;color:#fff;border-color:#dc3545}';
    document.head.appendChild(style);
  }

  function setupLogout(email) {
    var logoutBtn = document.querySelector('.btn-logout');
    if (!logoutBtn) return;
    var modal = document.createElement('div');
    modal.className = 'stu-modal-overlay';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.innerHTML =
      '<div class="stu-modal-card">' +
        '<h3>Confirm Sign Out</h3>' +
        '<p>Sign out of Student Panel (' + email + ')? You can sign back in anytime.</p>' +
        '<div class="stu-modal-actions">' +
          '<button type="button" class="stu-btn" data-act="cancel">Cancel</button>' +
          '<button type="button" class="stu-btn stu-btn-danger" data-act="confirm">Log Out</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(modal);

    logoutBtn.addEventListener('click', function () {
      modal.classList.add('is-open');
    });
    modal.addEventListener('click', function (e) {
      if (e.target === modal || e.target.getAttribute('data-act') === 'cancel') {
        modal.classList.remove('is-open');
      } else if (e.target.getAttribute('data-act') === 'confirm') {
        try {
          global.localStorage.setItem(KEYS.session, 'signed_out');
        } catch (_err) {
          // Ignore
        }
        global.location.href = '../Login page/login.html?role=student';
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') modal.classList.remove('is-open');
    });
  }

  function injectBadge(cardId, text, toneClass) {
    var card = document.getElementById(cardId);
    if (!card) return;
    var badge = card.querySelector('.stu-card-badge');
    if (!badge) {
      badge = document.createElement('span');
      badge.className = 'stu-card-badge';
      var btn = card.querySelector('.btn-outline');
      if (btn) card.insertBefore(badge, btn);
      else card.appendChild(badge);
    }
    badge.className = 'stu-card-badge' + (toneClass ? ' ' + toneClass : '');
    badge.textContent = text;
  }

  function initStudentDashboard() {
    var session = loadJson(KEYS.session, null);
    if (!session || typeof session !== 'object' || session.role !== 'student') {
      global.location.replace('../Login page/login.html?role=student');
      return;
    }

    ensureHelperStyles();
    var student = resolveStudentIdentity(session, loadJson(KEYS.accounts, []), loadJson(KEYS.users, []));
    var emailEl = document.querySelector('.sidebar-footer .user-email');
    var roleEl = document.querySelector('.sidebar-footer .user-role');
    if (emailEl) emailEl.textContent = student.email;
    if (roleEl) roleEl.textContent = student.studentId || 'Student';

    var pageHeader = document.querySelector('.page-header');
    if (pageHeader && !pageHeader.querySelector('.stu-welcome-line')) {
      var welcome = document.createElement('p');
      welcome.className = 'stu-welcome-line';
      welcome.textContent = student.name + ' (' + student.studentId + ') · Assigned Bus: ' + student.bus + ' · Pickup: ' + student.pickup;
      pageHeader.appendChild(welcome);
    }

    var sid = student.studentId;
    var badges = computeDashboardBadges({
      student: student,
      bookings: loadJson(KEYS.bookings + '_' + sid, []),
      schedules: loadJson(KEYS.schedules, []),
      studentPass: loadJson(KEYS.studentPass + '_' + sid, null),
      passes: loadJson(KEYS.passes, []),
      notifications: loadJson(KEYS.notifications, []),
      notifRead: loadJson(KEYS.notifRead + '_' + sid, ['snot-2', 'snot-3']),
    });

    injectBadge('my-pass', badges.passLabel, badges.passStatus === 'Approved' ? 'is-green' : 'is-warn');
    injectBadge('schedules', badges.schedulesCount, '');
    injectBadge('bookings', badges.bookingsCount, '');
    injectBadge('live-tracking', 'Assigned: ' + student.bus, '');
    injectBadge(
      'notifications',
      badges.unreadNotifs > 0 ? badges.unreadNotifs + ' Unread Alert' + (badges.unreadNotifs > 1 ? 's' : '') : 'All Caught Up',
      badges.unreadNotifs > 0 ? 'is-warn' : 'is-green'
    );
    injectBadge('profile', 'Pickup: ' + student.pickup, '');

    setupLogout(student.email);
  }

  global.AIUB_BMS_STU_DASHBOARD = {
    KEYS: KEYS,
    resolveStudentIdentity: resolveStudentIdentity,
    computeDashboardBadges: computeDashboardBadges,
  };

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initStudentDashboard);
    } else {
      initStudentDashboard();
    }
  }
})(typeof window !== 'undefined' ? window : globalThis);

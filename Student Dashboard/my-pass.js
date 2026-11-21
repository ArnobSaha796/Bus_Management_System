(function (global) {
  'use strict';

  var KEYS = {
    session: 'aiub_bms_session',
    users: 'aiub_bms_users',
    studentPass: 'aiub_bms_student_pass',
    adminPasses: 'aiub_bms_passes',
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

  function resolveStudentId(session) {
    if (!session || typeof session !== 'object') return '';
    if (session.studentId) return session.studentId;
    if (session.identifier && /^\d{2}-\d{5}-\d$/.test(session.identifier)) return session.identifier;
    var users = loadJson(KEYS.users, []);
    var u = Array.isArray(users)
      ? users.find(function (x) {
          return x.role === 'student' && String(x.email || '').toLowerCase() === String(session.email || '').toLowerCase();
        })
      : null;
    return (u && u.studentId) || '';
  }

  function resolveActivePass(session, studentPass, adminPasses) {
    var studentId = resolveStudentId(session);
    var email = (session && session.email) || (studentId ? studentId + '@student.aiub.edu' : '');
    var emailLower = email.toLowerCase();
    var idLower = studentId.toLowerCase();

    var adminMatch = Array.isArray(adminPasses)
      ? adminPasses.find(function (p) {
          if (studentPass && studentPass.trxId && p.trxId === studentPass.trxId) return true;
          var pEmail = String(p.email || '').toLowerCase();
          return (emailLower && pEmail === emailLower) || (idLower && pEmail.indexOf(idLower) === 0);
        })
      : null;

    if (studentPass) {
      var merged = Object.assign({}, studentPass, { email: email });
      if (adminMatch && adminMatch.status) merged.status = adminMatch.status;
      return merged;
    }

    if (adminMatch) {
      return {
        planName: adminMatch.passType || 'Monthly Pass',
        email: email,
        amount: adminMatch.price || '2,200 BDT',
        validFrom: adminMatch.validFrom || '01 Nov 2026',
        validUntil: adminMatch.validity || '30 Nov 2026',
        status: adminMatch.status || 'Pending',
        trxId: adminMatch.trxId || '—',
      };
    }

    return {
      planName: 'No Active Pass',
      email: email,
      amount: '৳0.00',
      validFrom: '—',
      validUntil: 'Purchase a pass to activate',
      status: 'Not Purchased',
      trxId: '—',
    };
  }

  function ensureHelperStyles() {
    if (document.getElementById('bms-stu-pass-styles')) return;
    var style = document.createElement('style');
    style.id = 'bms-stu-pass-styles';
    style.textContent =
      '.pass-actions-bar{display:flex;justify-content:center;gap:12px;margin-top:22px;flex-wrap:wrap}' +
      '.btn-pass-action{font-family:inherit;font-size:13.5px;font-weight:600;padding:10px 18px;border-radius:6px;text-decoration:none;cursor:pointer;border:1px solid #003366;background:#003366;color:#fff}' +
      '.btn-pass-action.secondary{background:#6c757d;border-color:#6c757d}' +
      '.btn-pass-action.outline{background:#fff;color:#003366}' +
      '.stu-modal-overlay{position:fixed;inset:0;background:rgba(15,23,42,.55);display:none;align-items:center;justify-content:center;padding:20px;z-index:2000}' +
      '.stu-modal-overlay.is-open{display:flex}' +
      '.stu-modal-card{background:#fff;border-radius:12px;border-top:4px solid #ffb703;max-width:400px;width:100%;padding:24px;box-shadow:0 20px 40px rgba(15,23,42,.22);text-align:left}' +
      '.stu-modal-card h3{font-size:18px;font-weight:700;color:#003366;margin-bottom:8px}' +
      '.stu-modal-card p{font-size:13.5px;color:#475569;margin-bottom:20px}' +
      '.stu-modal-actions{display:flex;justify-content:flex-end;gap:10px}' +
      '.stu-btn{font-family:inherit;font-size:13px;font-weight:600;padding:9px 16px;border-radius:6px;cursor:pointer;border:1px solid #cbd5e1;background:#f8fafc;color:#334155}' +
      '.stu-btn-danger{background:#dc3545;color:#fff;border-color:#dc3545}' +
      '@media print{.sidebar,.pass-actions-bar{display:none!important}.main-content{margin-left:0!important;padding:12px!important}}';
    document.head.appendChild(style);
  }

  function setupLogout(email) {
    var btn = document.querySelector('.btn-logout');
    if (!btn) return;
    var modal = document.createElement('div');
    modal.className = 'stu-modal-overlay';
    modal.innerHTML =
      '<div class="stu-modal-card">' +
        '<h3>Confirm Sign Out</h3>' +
        '<p>Sign out of Student Panel (' + email + ')?</p>' +
        '<div class="stu-modal-actions">' +
          '<button type="button" class="stu-btn" data-act="cancel">Cancel</button>' +
          '<button type="button" class="stu-btn stu-btn-danger" data-act="confirm">Log Out</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(modal);
    btn.addEventListener('click', function () { modal.classList.add('is-open'); });
    modal.addEventListener('click', function (e) {
      if (e.target === modal || e.target.getAttribute('data-act') === 'cancel') modal.classList.remove('is-open');
      if (e.target.getAttribute('data-act') === 'confirm') {
        try { global.localStorage.setItem(KEYS.session, 'signed_out'); } catch (_e) {}
        global.location.href = '../Login page/login.html?role=student';
      }
    });
  }

  function initMyPassPage() {
    var session = loadJson(KEYS.session, null);
    if (!session || typeof session !== 'object' || session.role !== 'student') {
      global.location.replace('../Login page/login.html?role=student');
      return;
    }

    ensureHelperStyles();
    var sid = resolveStudentId(session);
    var pass = resolveActivePass(
      session,
      loadJson(KEYS.studentPass + '_' + sid, null),
      loadJson(KEYS.adminPasses, [])
    );

    var emailSidebar = document.querySelector('.sidebar-footer .user-email');
    var roleSidebar = document.querySelector('.sidebar-footer .user-role');
    if (emailSidebar) emailSidebar.textContent = pass.email;
    if (roleSidebar) roleSidebar.textContent = sid || 'Student';

    var header = document.querySelector('.pass-card-header');
    var typeEl = document.querySelector('.pass-type');
    var values = document.querySelectorAll('.pass-details .detail-row .detail-value');
    var badgeEl = document.querySelector('.status-badge');

    var isApproved = pass.status === 'Approved';
    var isNone = pass.status === 'Not Purchased';
    if (header) {
      header.style.backgroundColor = isApproved ? '#198754' : isNone ? '#64748b' : '#d97706';
      header.innerHTML = isApproved
        ? '<span class="check-badge"><i class="fa-solid fa-check"></i></span><span>Active Pass</span>'
        : isNone
        ? '<span class="check-badge" style="background:#e2e8f0;color:#334155"><i class="fa-solid fa-ticket"></i></span><span>No Pass Purchased Yet</span>'
        : '<span class="check-badge" style="background:#fde68a;color:#78350f"><i class="fa-solid fa-clock"></i></span><span>Pending Admin Approval</span>';
    }
    if (typeEl) typeEl.textContent = pass.planName;
    if (values[0]) values[0].textContent = pass.email;
    if (values[1]) values[1].textContent = pass.amount;
    if (values[2]) values[2].textContent = pass.validFrom;
    if (values[3]) values[3].textContent = pass.validUntil;
    if (badgeEl) {
      badgeEl.textContent = pass.status;
      badgeEl.style.backgroundColor = isApproved ? '#198754' : isNone ? '#64748b' : '#d97706';
    }

    var container = document.querySelector('.receipt-container');
    if (container && !container.querySelector('.pass-actions-bar')) {
      var bar = document.createElement('div');
      bar.className = 'pass-actions-bar';
      bar.innerHTML =
        '<button type="button" class="btn-pass-action" id="btn-print-pass"><i class="fa-solid fa-print"></i> Print Receipt</button>' +
        '<a href="buy-pass.html" class="btn-pass-action outline">Renew / Upgrade Pass</a>' +
        '<a href="index.html" class="btn-pass-action secondary">Back to Dashboard</a>';
      container.appendChild(bar);
      bar.querySelector('#btn-print-pass').addEventListener('click', function () {
        if (typeof global.print === 'function') global.print();
      });
    }

    setupLogout(pass.email);
  }

  global.AIUB_BMS_STU_MY_PASS = {
    KEYS: KEYS,
    resolveActivePass: resolveActivePass,
  };

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initMyPassPage);
    } else {
      initMyPassPage();
    }
  }
})(typeof window !== 'undefined' ? window : globalThis);

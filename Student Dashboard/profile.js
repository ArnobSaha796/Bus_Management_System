(function (global) {
  'use strict';

  var KEYS = {
    session: 'aiub_bms_session',
    users: 'aiub_bms_users',
    accounts: 'aiub_bms_accounts',
    pickupPoints: 'aiub_bms_pickup_points',
    studentProfile: 'aiub_bms_student_profile',
  };

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

  function validateProfileSettings(input) {
    var fullName = String(input.fullName || '').trim();
    var studentId = String(input.studentId || '').trim();
    var email = String(input.email || '').trim();
    var phone = String(input.phone || '').trim();
    var pickup = String(input.pickup || '').trim();
    var guardianPhone = String(input.guardianPhone || '').trim();

    if (fullName.length < 3) return { valid: false, field: 'full-name', error: 'Full Name must be at least 3 characters.' };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { valid: false, field: 'student-email', error: 'Please enter a valid email address.' };
    if (!/^[+\d][\d\s-]{8,18}$/.test(phone)) return { valid: false, field: 'student-phone', error: 'Enter a valid student mobile number.' };
    if (!pickup) return { valid: false, field: 'pickup-point', error: 'Please select a preferred pickup point.' };
    if (!/^[+\d][\d\s-]{8,18}$/.test(guardianPhone)) return { valid: false, field: 'guardian-phone', error: 'Enter a valid guardian mobile number.' };

    return {
      valid: true,
      value: {
        fullName: fullName,
        studentId: studentId,
        email: email,
        phone: phone,
        pickup: pickup,
        guardianPhone: guardianPhone,
      },
    };
  }

  function ensureHelperStyles() {
    if (document.getElementById('bms-stu-prof-styles')) return;
    var style = document.createElement('style');
    style.id = 'bms-stu-prof-styles';
    style.textContent =
      '.prof-banner{padding:11px 14px;border-radius:8px;font-size:13px;font-weight:600;margin-bottom:18px}' +
      '.prof-banner-ok{background:#dcfce7;color:#166534;border:1px solid #bbf7d0}' +
      '.prof-banner-err{background:#fef2f2;color:#b91c1c;border:1px solid #fecaca}' +
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

  function initStudentProfilePage() {
    ensureHelperStyles();
    var session = loadJson(KEYS.session, null);
    if (!session || typeof session !== 'object' || session.role !== 'student') {
      global.location.replace('../Login page/login.html?role=student');
      return;
    }

    var studentId =
      session.studentId ||
      (/^\d{2}-\d{5}-\d$/.test(session.identifier || '') ? session.identifier : '');
    var profileKey = studentId ? KEYS.studentProfile + '_' + studentId : KEYS.studentProfile;
    var saved = loadJson(profileKey, null);
    var accounts = loadJson(KEYS.accounts, []);
    var users = loadJson(KEYS.users, []);
    var pickupSelect = document.getElementById('pickup-point');

    // Merge Admin pickup points into dropdown if available
    var adminPickups = loadJson(KEYS.pickupPoints, []);
    if (pickupSelect && Array.isArray(adminPickups) && adminPickups.length > 0) {
      var existingVals = Array.from(pickupSelect.options).map(function (o) { return o.value; });
      adminPickups.forEach(function (pp) {
        if (pp.name && existingVals.indexOf(pp.name) === -1) {
          var opt = document.createElement('option');
          opt.value = pp.name;
          opt.textContent = pp.name;
          pickupSelect.appendChild(opt);
        }
      });
    }

    var matchedAcc = Array.isArray(accounts)
      ? accounts.find(function (a) { return a.studentId === studentId; })
      : null;
    var matchedUser = Array.isArray(users)
      ? users.find(function (u) {
          return u.role === 'student' && (u.studentId === studentId || u.identifier === studentId);
        })
      : null;

    var initial = {
      fullName:
        (saved && saved.fullName) ||
        (matchedAcc && matchedAcc.studentName) ||
        (matchedUser && matchedUser.name) ||
        session.name ||
        'AIUB Student',
      studentId: studentId,
      email:
        (saved && saved.email) ||
        session.email ||
        (matchedUser && matchedUser.email) ||
        (studentId ? studentId + '@student.aiub.edu' : ''),
      phone:
        (saved && saved.phone) ||
        session.phone ||
        (matchedUser && matchedUser.phone) ||
        '+880 1712-000000',
      pickup:
        (saved && saved.pickup) ||
        (matchedAcc && matchedAcc.pickup) ||
        'Kuril',
      guardianPhone:
        (saved && saved.guardianPhone) ||
        (matchedAcc && matchedAcc.parentPhone) ||
        '+880 1711-000000',
      status: (matchedAcc && matchedAcc.status) || 'Approved',
    };

    var emailSidebar = document.querySelector('.sidebar-footer .user-email');
    var roleSidebar = document.querySelector('.sidebar-footer .user-role');
    if (emailSidebar) emailSidebar.textContent = initial.email;
    if (roleSidebar && studentId) roleSidebar.textContent = 'Student · ' + studentId;

    var headerTitle = document.querySelector('.profile-header h3');
    var statusEl = document.querySelector('.approval-status');
    if (headerTitle) headerTitle.textContent = initial.fullName + ' (' + initial.studentId + ')';
    if (statusEl) {
      statusEl.textContent = 'Admin Status: ' + initial.status;
      statusEl.style.color = initial.status === 'Approved' ? '#198754' : '#d97706';
    }

    var nameEl = document.getElementById('full-name');
    var idEl = document.getElementById('student-id');
    var mailEl = document.getElementById('student-email');
    var phoneEl = document.getElementById('student-phone');
    var guardEl = document.getElementById('guardian-phone');

    if (nameEl) nameEl.value = initial.fullName;
    if (idEl) idEl.value = initial.studentId;
    if (mailEl) mailEl.value = initial.email;
    if (phoneEl) phoneEl.value = initial.phone;
    if (guardEl) guardEl.value = initial.guardianPhone;
    if (pickupSelect && initial.pickup) {
      var hasOpt = Array.from(pickupSelect.options).some(function (o) { return o.value === initial.pickup; });
      if (!hasOpt) {
        var extra = document.createElement('option');
        extra.value = initial.pickup;
        extra.textContent = initial.pickup;
        pickupSelect.appendChild(extra);
      }
      pickupSelect.value = initial.pickup;
    }

    var card = document.querySelector('.profile-card');
    var form = document.querySelector('.profile-form');

    function showBanner(ok, msg) {
      if (!card) return;
      var banner = card.querySelector('.prof-banner');
      if (!banner) {
        banner = document.createElement('div');
        banner.className = 'prof-banner';
        banner.setAttribute('role', 'status');
        card.insertBefore(banner, form);
      }
      banner.className = 'prof-banner ' + (ok ? 'prof-banner-ok' : 'prof-banner-err');
      banner.textContent = msg;
    }

    if (form) {
      form.setAttribute('novalidate', 'novalidate');
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var res = validateProfileSettings({
          fullName: nameEl ? nameEl.value : '',
          studentId: idEl ? idEl.value : initial.studentId,
          email: mailEl ? mailEl.value : '',
          phone: phoneEl ? phoneEl.value : '',
          pickup: pickupSelect ? pickupSelect.value : '',
          guardianPhone: guardEl ? guardEl.value : '',
        });
        if (!res.valid) {
          showBanner(false, res.error);
          if (res.field) {
            var bad = document.getElementById(res.field);
            if (bad) bad.focus();
          }
          return;
        }

        var v = res.value;
        saveJson(profileKey, v);
        if (headerTitle) headerTitle.textContent = v.fullName + ' (' + v.studentId + ')';
        if (emailSidebar) emailSidebar.textContent = v.email;

        // Sync pickup point & guardian phone back into Admin accounts directory
        if (Array.isArray(accounts) && accounts.length > 0) {
          var updated = accounts.map(function (a) {
            if (a.studentId !== v.studentId) return a;
            return Object.assign({}, a, {
              studentName: v.fullName,
              pickup: v.pickup,
              parentPhone: v.guardianPhone,
            });
          });
          saveJson(KEYS.accounts, updated);
        }

        // Sync name/email/phone back into Users and Session
        if (Array.isArray(users) && users.length > 0) {
          var updatedUsers = users.map(function (u) {
            if (u.role === 'student' && (u.studentId === v.studentId || u.identifier === v.studentId)) {
              return Object.assign({}, u, { name: v.fullName, email: v.email, phone: v.phone });
            }
            return u;
          });
          saveJson(KEYS.users, updatedUsers);
        }
        saveJson(KEYS.session, Object.assign({}, session, { name: v.fullName, email: v.email, phone: v.phone }));

        showBanner(true, 'Profile & pickup point settings saved and synced across AIUB BMS.');
      });
    }

    // Logout modal
    var logoutBtn = document.querySelector('.btn-logout');
    if (logoutBtn) {
      var modal = document.createElement('div');
      modal.className = 'stu-modal-overlay';
      modal.innerHTML =
        '<div class="stu-modal-card"><h3>Confirm Sign Out</h3><p>Sign out of Student Panel (' + escapeHtml(initial.email) + ')?</p><div class="stu-modal-actions"><button type="button" class="stu-btn" data-act="cancel">Cancel</button><button type="button" class="stu-btn stu-btn-danger" data-act="confirm">Log Out</button></div></div>';
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
  }

  global.AIUB_BMS_STU_PROFILE = {
    KEYS: KEYS,
    validateProfileSettings: validateProfileSettings,
  };

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initStudentProfilePage);
    } else {
      initStudentProfilePage();
    }
  }
})(typeof window !== 'undefined' ? window : globalThis);

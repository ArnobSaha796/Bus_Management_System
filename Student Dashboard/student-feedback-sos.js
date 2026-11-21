(function (global) {
  'use strict';

  var KEYS = {
    session: 'aiub_bms_session',
    accounts: 'aiub_bms_accounts',
    buses: 'aiub_bms_buses',
    feedback: 'aiub_bms_feedback',
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

  function validateSosTrigger(bus, location) {
    var b = String(bus || '').trim();
    var loc = String(location || '').trim();
    if (!b) return { valid: false, error: 'Please select your current bus.' };
    if (loc.length < 3) return { valid: false, error: 'Enter your current location or nearest landmark (at least 3 characters).' };
    return { valid: true, value: { bus: b, location: loc } };
  }

  function validateFeedbackSubmission(input) {
    var type = String(input.reportType || 'General Feedback').trim();
    var bus = String(input.bus || 'Gazipur-01').trim();
    var subject = String(input.subject || '').trim();
    var description = String(input.description || '').trim();
    if (subject.length < 4) return { valid: false, field: 'subject', error: 'Please enter a subject (at least 4 characters).' };
    if (description.length < 10) return { valid: false, field: 'description', error: 'Please describe the issue or feedback (at least 10 characters).' };
    var mappedCategory = type === 'General Feedback' ? 'Feedback' : 'Complaint';
    return {
      valid: true,
      value: {
        category: mappedCategory,
        reportType: type,
        bus: bus,
        subject: subject,
        description: subject + ' — ' + description,
      },
    };
  }

  function ensureHelperStyles() {
    if (document.getElementById('bms-stu-fb-styles')) return;
    var style = document.createElement('style');
    style.id = 'bms-stu-fb-styles';
    style.textContent =
      '.stu-alert-banner{padding:11px 14px;border-radius:8px;font-size:13px;font-weight:600;margin-bottom:16px}' +
      '.stu-alert-success{background:#dcfce7;color:#166534;border:1px solid #bbf7d0}' +
      '.stu-alert-error{background:#fef2f2;color:#b91c1c;border:1px solid #fecaca}' +
      '.stu-alert-sos{background:#fee2e2;color:#991b1b;border:1px solid #fca5a5}' +
      '.stu-modal-overlay{position:fixed;inset:0;background:rgba(15,23,42,.55);display:none;align-items:center;justify-content:center;padding:20px;z-index:2000}' +
      '.stu-modal-overlay.is-open{display:flex}' +
      '.stu-modal-card{background:#fff;border-radius:12px;border-top:4px solid #dc3545;max-width:420px;width:100%;padding:24px;box-shadow:0 20px 40px rgba(15,23,42,.22)}' +
      '.stu-modal-card h3{font-size:18px;font-weight:700;color:#0f172a;margin-bottom:8px}' +
      '.stu-modal-card p{font-size:13.5px;color:#475569;margin-bottom:20px;line-height:1.5}' +
      '.stu-modal-actions{display:flex;justify-content:flex-end;gap:10px}' +
      '.stu-btn{font-family:inherit;font-size:13px;font-weight:600;padding:9px 16px;border-radius:6px;cursor:pointer;border:1px solid #cbd5e1;background:#f8fafc;color:#334155}' +
      '.stu-btn-danger{background:#dc3545;color:#fff;border-color:#dc3545}';
    document.head.appendChild(style);
  }

  function showCardBanner(cardEl, tone, message) {
    if (!cardEl) return;
    var banner = cardEl.querySelector('.stu-alert-banner');
    if (!banner) {
      banner = document.createElement('div');
      banner.className = 'stu-alert-banner';
      banner.setAttribute('role', 'alert');
      cardEl.insertBefore(banner, cardEl.firstChild);
    }
    banner.className = 'stu-alert-banner ' + (tone === 'error' ? 'stu-alert-error' : tone === 'sos' ? 'stu-alert-sos' : 'stu-alert-success');
    banner.textContent = message;
  }

  function initStudentFeedbackSosPage() {
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
    var accounts = loadJson(KEYS.accounts, []);
    var matchedAcc = Array.isArray(accounts)
      ? accounts.find(function (a) { return a.studentId === studentId; })
      : null;
    var name = session.name || (matchedAcc && matchedAcc.studentName) || 'AIUB Student';
    var assignedBus = (matchedAcc && matchedAcc.bus) || '';

    var emailEl = document.querySelector('.sidebar-footer .user-email');
    var roleEl = document.querySelector('.sidebar-footer .user-role');
    if (emailEl && email) emailEl.textContent = email;
    if (roleEl && studentId) roleEl.textContent = 'Student · ' + studentId;

    // Populate bus dropdowns from Admin fleet if available
    var buses = loadJson(KEYS.buses, []);
    var sosBus = document.getElementById('sos-bus');
    var fbBus = document.getElementById('bus-route');
    if (Array.isArray(buses) && buses.length > 0) {
      var opts = buses.map(function (b) { return '<option value="' + escapeHtml(b.busNumber) + '">' + escapeHtml(b.busNumber) + '</option>'; }).join('');
      if (sosBus) sosBus.innerHTML = opts;
      if (fbBus) fbBus.innerHTML = opts;
    }
    if (assignedBus) {
      if (sosBus) sosBus.value = assignedBus;
      if (fbBus) fbBus.value = assignedBus;
    }

    var sosCard = document.querySelector('.sos-card');
    var fbCard = document.querySelector('.feedback-card');
    var sosBtn = document.querySelector('.btn-sos');
    var fbForm = fbCard && fbCard.querySelector('form');

    // SOS confirmation modal
    var sosModal = document.createElement('div');
    sosModal.className = 'stu-modal-overlay';
    sosModal.innerHTML =
      '<div class="stu-modal-card">' +
        '<h3>Confirm Emergency SOS Dispatch</h3>' +
        '<p id="sos-confirm-text"></p>' +
        '<div class="stu-modal-actions">' +
          '<button type="button" class="stu-btn" data-act="cancel">Cancel</button>' +
          '<button type="button" class="stu-btn stu-btn-danger" data-act="confirm">Send Emergency SOS Now</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(sosModal);

    var pendingSos = null;
    if (sosBtn) {
      sosBtn.addEventListener('click', function () {
        var check = validateSosTrigger(
          document.getElementById('sos-bus').value,
          document.getElementById('sos-location').value
        );
        if (!check.valid) {
          showCardBanner(sosCard, 'error', check.error);
          return;
        }
        pendingSos = check.value;
        document.getElementById('sos-confirm-text').textContent =
          'Alert AIUB Transport Control & your linked guardian about an emergency on bus ' +
          pendingSos.bus +
          ' at "' +
          pendingSos.location +
          '"?';
        sosModal.classList.add('is-open');
      });
    }

    sosModal.addEventListener('click', function (e) {
      if (e.target === sosModal || e.target.getAttribute('data-act') === 'cancel') {
        sosModal.classList.remove('is-open');
        return;
      }
      if (e.target.getAttribute('data-act') === 'confirm' && pendingSos) {
        var list = loadJson(KEYS.feedback, []);
        if (!Array.isArray(list)) list = [];
        list.unshift({
          id: 'fb-' + Date.now(),
          studentId: studentId,
          userName: name,
          userEmail: email,
          category: 'SOS Emergency',
          bus: pendingSos.bus,
          location: pendingSos.location,
          description: 'Emergency SOS triggered by ' + name + ' (' + studentId + ') on ' + pendingSos.bus + ' near ' + pendingSos.location + '.',
          status: 'Urgent',
          resolutionNote: '',
        });
        saveJson(KEYS.feedback, list);
        sosModal.classList.remove('is-open');
        showCardBanner(
          sosCard,
          'sos',
          'SOS Dispatched! Transport Control & your guardian have been notified for ' + pendingSos.bus + ' (' + pendingSos.location + ').'
        );
      }
    });

    if (fbForm) {
      fbForm.setAttribute('novalidate', 'novalidate');
      fbForm.addEventListener('submit', function (e) {
        e.preventDefault();
        var check = validateFeedbackSubmission({
          reportType: document.getElementById('report-type').value,
          bus: document.getElementById('bus-route').value,
          subject: document.getElementById('subject').value,
          description: document.getElementById('description').value,
        });
        if (!check.valid) {
          showCardBanner(fbCard, 'error', check.error);
          if (check.field) {
            var el = document.getElementById(check.field);
            if (el) el.focus();
          }
          return;
        }
        var list = loadJson(KEYS.feedback, []);
        if (!Array.isArray(list)) list = [];
        list.unshift({
          id: 'fb-' + Date.now(),
          studentId: studentId,
          userName: name,
          userEmail: email,
          category: check.value.category,
          bus: check.value.bus,
          location: 'Reported via Student Portal',
          description: check.value.description,
          status: 'Pending',
          resolutionNote: '',
        });
        saveJson(KEYS.feedback, list);
        fbForm.reset();
        if (assignedBus && fbBus) fbBus.value = assignedBus;
        showCardBanner(fbCard, 'success', 'Report submitted! The AIUB Transport Administrator can now review it in Feedback & SOS.');
      });
    }

    // Logout modal
    var logoutBtn = document.querySelector('.btn-logout');
    if (logoutBtn) {
      var modal = document.createElement('div');
      modal.className = 'stu-modal-overlay';
      modal.innerHTML =
        '<div class="stu-modal-card" style="border-top-color:#ffb703"><h3>Confirm Sign Out</h3><p>Sign out of Student Panel (' + escapeHtml(email) + ')?</p><div class="stu-modal-actions"><button type="button" class="stu-btn" data-act="cancel">Cancel</button><button type="button" class="stu-btn stu-btn-danger" data-act="confirm">Log Out</button></div></div>';
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

  global.AIUB_BMS_STU_FEEDBACK = {
    KEYS: KEYS,
    validateSosTrigger: validateSosTrigger,
    validateFeedbackSubmission: validateFeedbackSubmission,
  };

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initStudentFeedbackSosPage);
    } else {
      initStudentFeedbackSosPage();
    }
  }
})(typeof window !== 'undefined' ? window : globalThis);

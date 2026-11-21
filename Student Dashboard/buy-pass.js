(function (global) {
  'use strict';

  var KEYS = {
    session: 'aiub_bms_session',
    studentPass: 'aiub_bms_student_pass',
    adminPasses: 'aiub_bms_passes',
    accounts: 'aiub_bms_accounts',
  };

  var PLANS = {
    daily: { id: 'daily', name: 'Daily Pass', priceNum: 50, priceText: '৳50.00', adminPrice: '50 BDT', days: 0, inputId: 'date-daily' },
    monthly: { id: 'monthly', name: 'Monthly Pass', priceNum: 1200, priceText: '৳1200.00', adminPrice: '1,200 BDT', days: 30, inputId: 'date-monthly' },
    semester: { id: 'semester', name: 'Semester Pass', priceNum: 4000, priceText: '৳4000.00', adminPrice: '4,000 BDT', days: 120, inputId: 'date-semester' },
  };

  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

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

  function formatDisplayDate(dateObj) {
    var day = dateObj.getDate();
    return (day < 10 ? '0' : '') + day + ' ' + MONTHS[dateObj.getMonth()] + ' ' + dateObj.getFullYear();
  }

  function computeValidityRange(startIso, durationDays) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(startIso || ''))) {
      return { valid: false, error: 'Please select a valid start date before purchasing.' };
    }
    var parts = startIso.split('-').map(Number);
    var start = new Date(parts[0], parts[1] - 1, parts[2]);
    var end = new Date(parts[0], parts[1] - 1, parts[2] + (Number(durationDays) || 0));
    return {
      valid: true,
      validFrom: formatDisplayDate(start),
      validUntil: formatDisplayDate(end),
    };
  }

  function validatePassPurchase(planKey, startDateIso, paymentMethod, trxCode) {
    var plan = PLANS[planKey];
    if (!plan) return { valid: false, error: 'Unknown pass plan selected.' };
    var range = computeValidityRange(startDateIso, plan.days);
    if (!range.valid) return range;
    var trx = String(trxCode || '').trim();
    if (trx.length < 5) {
      return { valid: false, error: 'Enter a valid Transaction ID (at least 5 characters, e.g. BKX994821).' };
    }
    return {
      valid: true,
      value: {
        planName: plan.name,
        amount: plan.priceText,
        adminPrice: plan.adminPrice,
        validFrom: range.validFrom,
        validUntil: range.validUntil,
        trxId: (paymentMethod || 'bKash') + ' (' + trx.toUpperCase() + ')',
      },
    };
  }

  function ensureHelperStyles() {
    if (document.getElementById('bms-stu-buy-styles')) return;
    var style = document.createElement('style');
    style.id = 'bms-stu-buy-styles';
    style.textContent =
      '.stu-modal-overlay{position:fixed;inset:0;background:rgba(15,23,42,.55);display:none;align-items:center;justify-content:center;padding:20px;z-index:2000}' +
      '.stu-modal-overlay.is-open{display:flex}' +
      '.stu-modal-card{background:#fff;border-radius:12px;border-top:4px solid #ffb703;max-width:440px;width:100%;padding:24px;box-shadow:0 20px 40px rgba(15,23,42,.22);text-align:left}' +
      '.stu-modal-card h3{font-size:18px;font-weight:700;color:#003366;margin-bottom:6px}' +
      '.stu-modal-sub{font-size:13px;color:#64748b;margin-bottom:16px}' +
      '.stu-form-group{margin-bottom:14px}' +
      '.stu-form-group label{display:block;font-size:12.5px;font-weight:700;color:#334155;margin-bottom:6px}' +
      '.stu-form-group input,.stu-form-group select{width:100%;padding:9px 12px;border:1px solid #cbd5e1;border-radius:6px;font-size:13.5px}' +
      '.stu-form-error{background:#fef2f2;color:#b91c1c;border:1px solid #fecaca;padding:8px 12px;border-radius:6px;font-size:12.5px;font-weight:600;margin-bottom:12px}' +
      '.stu-modal-actions{display:flex;justify-content:flex-end;gap:10px;margin-top:16px}' +
      '.stu-btn{font-family:inherit;font-size:13px;font-weight:600;padding:9px 16px;border-radius:6px;cursor:pointer;border:1px solid #cbd5e1;background:#f8fafc;color:#334155}' +
      '.stu-btn-primary{background:#003366;color:#fff;border-color:#003366}' +
      '.stu-btn-danger{background:#dc3545;color:#fff;border-color:#dc3545}';
    document.head.appendChild(style);
  }

  function initBuyPassPage() {
    var session = loadJson(KEYS.session, null);
    if (!session || typeof session !== 'object' || session.role !== 'student') {
      global.location.replace('../Login page/login.html?role=student');
      return;
    }

    ensureHelperStyles();
    var studentId = session.studentId || (session.identifier && /^\d{2}-\d{5}-\d$/.test(session.identifier) ? session.identifier : '');
    var email = session.email || (studentId + '@student.aiub.edu');
    var name = session.name || 'AIUB Student';
    var emailEl = document.querySelector('.sidebar-footer .user-email');
    var roleEl = document.querySelector('.sidebar-footer .user-role');
    if (emailEl) emailEl.textContent = email;
    if (roleEl) roleEl.textContent = studentId || 'Student';

    var todayIso = new Date().toISOString().slice(0, 10);
    ['date-daily', 'date-monthly', 'date-semester'].forEach(function (id) {
      var input = document.getElementById(id);
      if (input) {
        input.value = todayIso;
        input.min = todayIso;
      }
    });

    var payModal = document.createElement('div');
    payModal.className = 'stu-modal-overlay';
    payModal.setAttribute('role', 'dialog');
    payModal.setAttribute('aria-modal', 'true');
    payModal.innerHTML =
      '<div class="stu-modal-card">' +
        '<h3>Complete Bus Pass Payment</h3>' +
        '<p class="stu-modal-sub" id="pay-modal-summary"></p>' +
        '<div class="stu-form-error" id="pay-modal-error" hidden></div>' +
        '<div class="stu-form-group">' +
          '<label for="pay-method">Payment Gateway</label>' +
          '<select id="pay-method"><option value="bKash">bKash</option><option value="Nagad">Nagad</option><option value="SSLCommerz">SSLCommerz (Card)</option></select>' +
        '</div>' +
        '<div class="stu-form-group">' +
          '<label for="pay-trx">Transaction ID</label>' +
          '<input type="text" id="pay-trx" placeholder="e.g. BKX9948210" />' +
        '</div>' +
        '<div class="stu-modal-actions">' +
          '<button type="button" class="stu-btn" data-act="cancel">Cancel</button>' +
          '<button type="button" class="stu-btn stu-btn-primary" data-act="confirm">Confirm &amp; Submit Pass</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(payModal);

    var selectedPlanKey = null;
    var planOrder = ['daily', 'monthly', 'semester'];
    document.querySelectorAll('.pricing-grid .plan-card').forEach(function (card, idx) {
      var buyBtn = card.querySelector('.btn-buy');
      var planKey = planOrder[idx];
      if (!buyBtn || !planKey) return;
      buyBtn.addEventListener('click', function (e) {
        e.preventDefault();
        selectedPlanKey = planKey;
        var plan = PLANS[planKey];
        var dateInput = document.getElementById(plan.inputId);
        var range = computeValidityRange(dateInput ? dateInput.value : '', plan.days);
        var errEl = document.getElementById('pay-modal-error');
        if (!range.valid) {
          if (dateInput) dateInput.focus();
          return;
        }
        document.getElementById('pay-modal-summary').textContent =
          plan.name + ' (' + plan.priceText + ') · Valid ' + range.validFrom + ' to ' + range.validUntil;
        document.getElementById('pay-trx').value = 'BKX' + String(Date.now()).slice(-7);
        errEl.hidden = true;
        payModal.classList.add('is-open');
      });
    });

    payModal.addEventListener('click', function (e) {
      if (e.target === payModal || e.target.getAttribute('data-act') === 'cancel') {
        payModal.classList.remove('is-open');
        return;
      }
      if (e.target.getAttribute('data-act') === 'confirm' && selectedPlanKey) {
        var plan = PLANS[selectedPlanKey];
        var dateInput = document.getElementById(plan.inputId);
        var res = validatePassPurchase(
          selectedPlanKey,
          dateInput ? dateInput.value : '',
          document.getElementById('pay-method').value,
          document.getElementById('pay-trx').value
        );
        var errEl = document.getElementById('pay-modal-error');
        if (!res.valid) {
          errEl.textContent = res.error;
          errEl.hidden = false;
          return;
        }

        var v = res.value;
        saveJson(KEYS.studentPass + '_' + studentId, {
          planName: v.planName,
          email: email,
          amount: v.amount,
          validFrom: v.validFrom,
          validUntil: v.validUntil,
          status: 'Pending',
          trxId: v.trxId,
        });

        // Sync into Admin Pending Passes queue
        var adminPasses = loadJson(KEYS.adminPasses, []);
        if (!Array.isArray(adminPasses)) adminPasses = [];
        var accounts = loadJson(KEYS.accounts, []);
        var acc = Array.isArray(accounts)
          ? accounts.find(function (a) { return a.studentId === studentId || a.studentName === name; })
          : null;
        adminPasses.unshift({
          id: 'pass-' + Date.now(),
          email: email,
          studentName: name,
          bus: (acc && acc.bus) || 'Mirpur-01',
          passType: v.planName,
          validFrom: v.validFrom,
          validity: v.validUntil,
          trxId: v.trxId,
          price: v.adminPrice,
          status: 'Pending',
          paymentVerified: false,
        });
        saveJson(KEYS.adminPasses, adminPasses);

        payModal.classList.remove('is-open');
        global.location.href = 'my-pass.html';
      }
    });

    // Logout modal
    var logoutBtn = document.querySelector('.btn-logout');
    if (logoutBtn) {
      var logoutModal = document.createElement('div');
      logoutModal.className = 'stu-modal-overlay';
      logoutModal.innerHTML =
        '<div class="stu-modal-card"><h3>Confirm Sign Out</h3><p class="stu-modal-sub">Sign out of Student Panel (' + email + ')?</p><div class="stu-modal-actions"><button type="button" class="stu-btn" data-act="cancel">Cancel</button><button type="button" class="stu-btn stu-btn-danger" data-act="confirm">Log Out</button></div></div>';
      document.body.appendChild(logoutModal);
      logoutBtn.addEventListener('click', function () { logoutModal.classList.add('is-open'); });
      logoutModal.addEventListener('click', function (e) {
        if (e.target === logoutModal || e.target.getAttribute('data-act') === 'cancel') logoutModal.classList.remove('is-open');
        if (e.target.getAttribute('data-act') === 'confirm') {
          try { global.localStorage.setItem(KEYS.session, 'signed_out'); } catch (_e) {}
          global.location.href = '../Login page/login.html?role=student';
        }
      });
    }

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        document.querySelectorAll('.stu-modal-overlay.is-open').forEach(function (m) { m.classList.remove('is-open'); });
      }
    });
  }

  global.AIUB_BMS_STU_BUY_PASS = {
    KEYS: KEYS,
    PLANS: PLANS,
    computeValidityRange: computeValidityRange,
    validatePassPurchase: validatePassPurchase,
  };

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initBuyPassPage);
    } else {
      initBuyPassPage();
    }
  }
})(typeof window !== 'undefined' ? window : globalThis);

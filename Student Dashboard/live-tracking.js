(function (global) {
  'use strict';

  var KEYS = {
    session: 'aiub_bms_session',
    accounts: 'aiub_bms_accounts',
    buses: 'aiub_bms_buses',
    drivers: 'aiub_bms_drivers',
    routes: 'aiub_bms_routes',
    schedules: 'aiub_bms_schedules',
    trackState: 'aiub_bms_student_track',
  };

  var FALLBACK_BUSES = [
    {
      bus: 'Gazipur-01',
      driver: 'Md. Rafiqul Islam',
      contact: '+880 1711-901122',
      stops: ['Shibbari', 'Board Bazar', 'Tongi', 'Kuril', 'AIUB Campus'],
    },
    {
      bus: 'Jatrabari-01',
      driver: 'Md. Mizanur Rahman',
      contact: '+880 1911-772819',
      stops: ['Jatrabari', 'Sayedabad', 'Rampura', 'Badda', 'AIUB Campus'],
    },
    {
      bus: 'Mirpur-01',
      driver: 'Shahidul Alam',
      contact: '+880 1675-883410',
      stops: ['Mirpur 12', 'Agargaon', 'Mohakhali', 'Banani', 'AIUB Campus'],
    },
    {
      bus: 'Dhanmondi-01',
      driver: 'Kamrul Hasan',
      contact: '+880 1755-609123',
      stops: ['Dhanmondi 15', 'Shahbag', 'Tejgaon', 'Kuril', 'AIUB Campus'],
    },
  ];

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

  function buildBusCatalog(store) {
    var buses = Array.isArray(store.buses) && store.buses.length > 0 ? store.buses : null;
    if (!buses) return FALLBACK_BUSES.slice();

    var drivers = Array.isArray(store.drivers) ? store.drivers : [];
    var schedules = Array.isArray(store.schedules) ? store.schedules : [];
    var routes = Array.isArray(store.routes) ? store.routes : [];

    return buses.map(function (b) {
      var drv = drivers.find(function (d) { return d.assignedBus === b.busNumber; });
      var sch = schedules.find(function (s) { return s.bus === b.busNumber; });
      var rt = sch ? routes.find(function (r) { return r.name === sch.route; }) : null;
      var stops =
        rt && Array.isArray(rt.stops) && rt.stops.length > 0
          ? rt.stops.slice(0, 4).concat(['AIUB Campus'])
          : ['Start Hub', 'Checkpoint 1', 'Checkpoint 2', 'Kuril', 'AIUB Campus'];
      return {
        bus: b.busNumber,
        driver: (drv && drv.fullName) || 'Assigned AIUB Driver',
        contact: (drv && drv.phone) || '+880 1711-901122',
        stops: stops,
      };
    });
  }

  function computeEtaMinutes(activeStopIndex, totalStops) {
    var remaining = Math.max(0, (totalStops || 5) - 1 - (Number(activeStopIndex) || 0));
    return remaining === 0 ? 'Arrived' : remaining * 9 + ' mins';
  }

  function ensureHelperStyles() {
    if (document.getElementById('bms-stu-track-styles')) return;
    var style = document.createElement('style');
    style.id = 'bms-stu-track-styles';
    style.textContent =
      '.track-controls{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:20px;flex-wrap:wrap}' +
      '.track-select{padding:9px 12px;border:1px solid #cbd5e1;border-radius:8px;font-size:13.5px;background:#fff;font-weight:600;color:#0f172a}' +
      '.track-btn-group{display:flex;gap:8px;flex-wrap:wrap}' +
      '.btn-track-ctrl{font-family:inherit;font-size:13px;font-weight:600;padding:8px 14px;border-radius:6px;border:1px solid #003366;background:#fff;color:#003366;cursor:pointer}' +
      '.btn-track-ctrl.is-active,.btn-track-ctrl:hover{background:#003366;color:#fff}' +
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

  function initLiveTrackingPage() {
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
    var assignedBus = (matchedAcc && matchedAcc.bus) || '';

    var catalog = buildBusCatalog({
      buses: loadJson(KEYS.buses, []),
      drivers: loadJson(KEYS.drivers, []),
      routes: loadJson(KEYS.routes, []),
      schedules: loadJson(KEYS.schedules, []),
    });

    var defaultBus =
      (assignedBus && catalog.some(function (c) { return c.bus === assignedBus; }) ? assignedBus : '') ||
      catalog[0].bus;
    var trackKey = studentId ? KEYS.trackState + '_' + studentId : KEYS.trackState;
    var state = loadJson(trackKey, null);
    if (!state || !state.bus || !catalog.some(function (c) { return c.bus === state.bus; })) {
      state = { bus: defaultBus, activeIndex: 2 };
    }
    var timer = null;

    var wrapper = document.querySelector('.tracking-wrapper');
    var card = document.querySelector('.tracking-card');
    var controls = document.createElement('div');
    controls.className = 'track-controls';
    controls.innerHTML =
      '<select id="track-bus-select" class="track-select" aria-label="Select bus to track">' +
        catalog.map(function (c) {
          var sel = c.bus === state.bus ? ' selected' : '';
          var suffix = c.bus === assignedBus ? ' (My Assigned Bus)' : '';
          return '<option value="' + escapeHtml(c.bus) + '"' + sel + '>Track Bus: ' + escapeHtml(c.bus) + suffix + '</option>';
        }).join('') +
      '</select>' +
      '<div class="track-btn-group">' +
        '<button type="button" class="btn-track-ctrl" id="btn-step-gps"><i class="fa-solid fa-location-crosshairs"></i> Refresh GPS</button>' +
        '<button type="button" class="btn-track-ctrl" id="btn-auto-gps">Auto-Track: Off</button>' +
      '</div>';
    if (wrapper && card) wrapper.insertBefore(controls, card);

    function render() {
      var entry = catalog.find(function (c) { return c.bus === state.bus; }) || catalog[0];
      var stops = entry.stops;
      var activeIdx = Math.max(0, Math.min(stops.length - 1, Number(state.activeIndex) || 0));

      var h3 = card && card.querySelector('.bus-summary h3');
      var p = card && card.querySelector('.bus-summary p');
      var etaStrong = card && card.querySelector('.eta-box strong');
      var progress = card && card.querySelector('.route-progress');

      if (h3) h3.textContent = entry.bus + ' (' + stops.join(' → ') + ')';
      if (p) p.textContent = 'Driver: ' + entry.driver + ' • Contact: ' + entry.contact + ' • Stops: ' + stops.length;
      if (etaStrong) etaStrong.textContent = computeEtaMinutes(activeIdx, stops.length);
      if (progress) {
        progress.style.gridTemplateColumns = 'repeat(' + stops.length + ', 1fr)';
        progress.innerHTML = stops
          .map(function (stop, idx) {
            var cls = idx < activeIdx ? 'completed' : idx === activeIdx ? 'active' : '';
            var statusText =
              idx < activeIdx
                ? 'Departed'
                : idx === activeIdx
                ? idx === stops.length - 1
                  ? 'Arrived'
                  : 'Current Location'
                : idx === stops.length - 1
                ? 'Destination'
                : 'Upcoming';
            return (
              '<div class="stop-card ' + cls + '">' +
                '<span class="stop-status">' + statusText + '</span>' +
                '<strong>0' + (idx + 1) + '. ' + escapeHtml(stop) + '</strong>' +
              '</div>'
            );
          })
          .join('');
      }
    }

    function advanceStop() {
      var entry = catalog.find(function (c) { return c.bus === state.bus; }) || catalog[0];
      state.activeIndex = (Number(state.activeIndex) + 1) % entry.stops.length;
      saveJson(trackKey, state);
      render();
    }

    var busSelect = document.getElementById('track-bus-select');
    if (busSelect) {
      busSelect.addEventListener('change', function () {
        state.bus = busSelect.value;
        state.activeIndex = 2;
        saveJson(trackKey, state);
        render();
      });
    }

    var stepBtn = document.getElementById('btn-step-gps');
    if (stepBtn) stepBtn.addEventListener('click', advanceStop);

    var autoBtn = document.getElementById('btn-auto-gps');
    if (autoBtn) {
      autoBtn.addEventListener('click', function () {
        if (timer) {
          global.clearInterval(timer);
          timer = null;
          autoBtn.textContent = 'Auto-Track: Off';
          autoBtn.classList.remove('is-active');
        } else {
          autoBtn.textContent = 'Auto-Track: Live';
          autoBtn.classList.add('is-active');
          timer = global.setInterval(advanceStop, 5000);
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

  global.AIUB_BMS_STU_TRACKING = {
    KEYS: KEYS,
    buildBusCatalog: buildBusCatalog,
    computeEtaMinutes: computeEtaMinutes,
  };

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initLiveTrackingPage);
    } else {
      initLiveTrackingPage();
    }
  }
})(typeof window !== 'undefined' ? window : globalThis);

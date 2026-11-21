(function (global) {
  'use strict';

  var KEYS = {
    session: 'aiub_bms_session',
    accounts: 'aiub_bms_accounts',
    buses: 'aiub_bms_buses',
    drivers: 'aiub_bms_drivers',
    routes: 'aiub_bms_routes',
    schedules: 'aiub_bms_schedules',
    parentState: 'aiub_bms_parent_state',
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

  function saveJson(key, val) {
    try {
      global.localStorage.setItem(key, JSON.stringify(val));
    } catch (_err) {
      // Ignore
    }
  }

  function formatTime24To12(timeStr) {
    var m = /^(\d{2}):(\d{2})/.exec(String(timeStr || '').trim());
    if (!m) return timeStr || '08:00 AM';
    var h = Number(m[1]);
    var suffix = h >= 12 ? 'PM' : 'AM';
    var h12 = h % 12 || 12;
    return (h12 < 10 ? '0' : '') + h12 + ':' + m[2] + ' ' + suffix;
  }

  function resolveBusData(store) {
    var session = store ? store.session : loadJson(KEYS.session, null);
    var accounts = store ? store.accounts : loadJson(KEYS.accounts, []);
    var buses = store ? store.buses : loadJson(KEYS.buses, []);
    var drivers = store ? store.drivers : loadJson(KEYS.drivers, []);
    var routes = store ? store.routes : loadJson(KEYS.routes, []);
    var schedules = store ? store.schedules : loadJson(KEYS.schedules, []);

    var data = {
      busName: 'Gazipur-01',
      plate: 'DHAKA METRO-BA 14-8921',
      routeCode: 'Route RT-04',
      occupied: 38,
      capacity: 44,
      departure: '08:00 AM',
      eta: '08:50 AM',
      driverName: 'Md. Rafiqul Islam',
      driverPhone: '+8801712903411',
      stops: ['Dhanmondi', 'Mohakhali', 'Banani'],
    };

    var stuId = session && session.linkedStudentId ? session.linkedStudentId : '23-54334-3';
    if (Array.isArray(accounts) && accounts.length > 0) {
      var acc = accounts.find(function (a) { return a.studentId === stuId; }) || accounts[0];
      if (acc && acc.bus) data.busName = acc.bus;
    }

    if (Array.isArray(buses)) {
      var bus = buses.find(function (b) { return b.busNumber === data.busName; });
      if (bus) {
        if (bus.plateNumber && bus.plateNumber !== 'N/A') data.plate = bus.plateNumber;
        if (Number.isFinite(Number(bus.seats))) data.capacity = Number(bus.seats);
        if (Number.isFinite(Number(bus.reserved))) data.occupied = Number(bus.reserved);
      }
    }

    if (Array.isArray(drivers)) {
      var drv = drivers.find(function (d) { return d.assignedBus === data.busName; });
      if (drv) {
        data.driverName = drv.fullName || data.driverName;
        data.driverPhone = drv.phone || data.driverPhone;
      }
    }

    if (Array.isArray(schedules)) {
      var sch = schedules.find(function (s) { return s.bus === data.busName; });
      if (sch && sch.departureTime) data.departure = formatTime24To12(sch.departureTime);
      if (sch && sch.route && Array.isArray(routes)) {
        var rt = routes.find(function (r) { return r.name === sch.route; });
        if (rt && Array.isArray(rt.stops) && rt.stops.length >= 2) {
          data.stops = [
            rt.stops[0],
            rt.stops[Math.floor(rt.stops.length / 2)] || rt.stops[1],
            rt.stops[rt.stops.length - 1],
          ];
        }
      }
    }

    return data;
  }

  function computeStage(stageIndex, stops, busName, eta) {
    var idx = Math.max(0, Math.min(2, Number(stageIndex) || 0));
    if (idx === 0) {
      return {
        progress: 15,
        speed: 22,
        start: 'Start: ' + stops[0],
        current: 'Next: ' + stops[1],
        end: 'End: ' + stops[2],
        firstDone: false,
        secondDone: false,
        note: '* ' + busName + ' departed ' + stops[0] + ' and is heading toward ' + stops[1] + '.',
      };
    }
    if (idx === 2) {
      return {
        progress: 100,
        speed: 0,
        start: 'Start: ' + stops[0],
        current: 'Passed: ' + stops[1],
        end: 'Arrived: ' + stops[2],
        firstDone: true,
        secondDone: true,
        note: '* ' + busName + ' reached AIUB Campus Gate-B safely.',
      };
    }
    return {
      progress: 50,
      speed: 34,
      start: 'Start: ' + stops[0],
      current: 'Current: ' + stops[1],
      end: 'End: ' + stops[2],
      firstDone: true,
      secondDone: false,
      note: '* The bus is currently midway to the destination (Next stop: ' + stops[2] + ' → AIUB Campus, ETA ' + eta + ').',
    };
  }

  function ensureStyles() {
    if (document.getElementById('bms-assigned-bus-styles')) return;
    var style = document.createElement('style');
    style.id = 'bms-assigned-bus-styles';
    style.textContent =
      '.route-controls{display:flex;justify-content:center;gap:8px;margin-top:14px}' +
      '.btn-route-ctrl{font-family:inherit;font-size:.76rem;font-weight:700;padding:6px 12px;border-radius:6px;border:1px solid #cbd5e1;background:#fff;color:#0f172a;cursor:pointer}' +
      '.btn-route-ctrl:hover{background:#f1f5f9}' +
      '.btn-route-ctrl.is-active{background:#003366;color:#fff;border-color:#003366}';
    document.head.appendChild(style);
  }

  function initAssignedBusCard() {
    var card = document.querySelector('.assigned-bus-card');
    if (!card) return;
    ensureStyles();

    var data = resolveBusData();
    var state = loadJson(KEYS.parentState, { stageIndex: 1, readAlertIds: ['palert-3'], extraAlerts: [] });
    var timer = null;

    function render() {
      var st = computeStage(state.stageIndex, data.stops, data.busName, data.eta);
      var plateEl = card.querySelector('.bus-plate');
      var cols = card.querySelectorAll('.telemetry-col');
      if (plateEl) plateEl.innerHTML = data.plate + ' &middot; ' + data.routeCode;
      if (cols[0]) {
        cols[0].querySelector('.telemetry-value').textContent = data.busName;
        cols[0].querySelector('.telemetry-sub').textContent = data.occupied + '/' + data.capacity + ' Seats Occupied';
      }
      if (cols[1]) {
        cols[1].querySelector('.telemetry-value').textContent = data.departure;
        cols[1].querySelector('.telemetry-sub').innerHTML = 'Campus ETA: <span class="mono">' + data.eta + '</span>';
      }
      if (cols[2]) {
        var drvName = cols[2].querySelector('.driver-name');
        var callBtn = cols[2].querySelector('.btn-call-driver');
        if (drvName) drvName.textContent = data.driverName;
        if (callBtn && (callBtn.getAttribute('href') || '').indexOf('tel:') === 0) {
          callBtn.setAttribute('href', 'tel:' + data.driverPhone.replace(/[^\d+]/g, ''));
        }
      }

      var meta = card.querySelector('.route-box-meta');
      var startEl = card.querySelector('.stop-start');
      var curEl = card.querySelector('.stop-current');
      var endEl = card.querySelector('.stop-end');
      var lines = card.querySelectorAll('.route-line');
      var note = card.querySelector('.route-note');

      if (meta) meta.textContent = 'Speed: ' + st.speed + ' km/h · Progress: ' + st.progress + '%';
      if (startEl) startEl.textContent = st.start;
      if (curEl) curEl.textContent = st.current;
      if (endEl) endEl.textContent = st.end;
      if (lines[0]) lines[0].className = 'route-line ' + (st.firstDone ? 'line-completed' : 'line-upcoming');
      if (lines[1]) lines[1].className = 'route-line ' + (st.secondDone ? 'line-completed' : 'line-upcoming');
      if (note) note.textContent = st.note;
    }

    var box = card.querySelector('.route-tracking-box');
    if (box && !box.querySelector('.route-controls')) {
      var controls = document.createElement('div');
      controls.className = 'route-controls';
      controls.innerHTML =
        '<button type="button" class="btn-route-ctrl" data-act="step">Update Live GPS</button>' +
        '<button type="button" class="btn-route-ctrl" data-act="auto">Auto-Track: Off</button>';
      box.appendChild(controls);

      controls.addEventListener('click', function (e) {
        var btn = e.target.closest('button[data-act]');
        if (!btn) return;
        if (btn.getAttribute('data-act') === 'step') {
          state.stageIndex = (Number(state.stageIndex) + 1) % 3;
          saveJson(KEYS.parentState, state);
          render();
        } else {
          if (timer) {
            global.clearInterval(timer);
            timer = null;
            btn.textContent = 'Auto-Track: Off';
            btn.classList.remove('is-active');
          } else {
            btn.textContent = 'Auto-Track: Live';
            btn.classList.add('is-active');
            timer = global.setInterval(function () {
              state.stageIndex = (Number(state.stageIndex) + 1) % 3;
              saveJson(KEYS.parentState, state);
              render();
            }, 6000);
          }
        }
      });
    }

    render();
  }

  global.AIUB_BMS_ASSIGNED_BUS = {
    resolveBusData: resolveBusData,
    computeStage: computeStage,
  };

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initAssignedBusCard);
    } else {
      initAssignedBusCard();
    }
  }
})(typeof window !== 'undefined' ? window : globalThis);

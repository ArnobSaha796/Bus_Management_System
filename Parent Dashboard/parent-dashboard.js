(function (global) {
  'use strict';

  var KEYS = {
    session: 'aiub_bms_session',
    accounts: 'aiub_bms_accounts',
    buses: 'aiub_bms_buses',
    drivers: 'aiub_bms_drivers',
    routes: 'aiub_bms_routes',
    schedules: 'aiub_bms_schedules',
    passes: 'aiub_bms_passes',
    notifications: 'aiub_bms_notifications',
    parentState: 'aiub_bms_parent_state',
  };

  var DEFAULT_CONTEXT = {
    parentEmail: 'parent@gmail.com',
    parentName: 'Md. Habibur Rahman Khan',
    parentRole: 'Parent',
    studentName: 'Md. Tahmidur Rahman Khan',
    studentId: '23-54334-3',
    department: 'CSE (FST)',
    passStatus: 'Active',
    passValidUntil: '30 Nov 2026',
    passId: 'AIUB-PASS-2026-8841',
    seat: 'B-04 (Window)',
    seatCode: 'B-04',
    pickupPoint: 'Dhanmondi 27 (Rapa Plaza Gate)',
    pickupShort: 'Dhanmondi 27 Gate',
    emergencyPhone: '+880 1711-482910',
    busName: 'Gazipur-01',
    busPlate: 'DHAKA METRO-BA 14-8921',
    routeCode: 'Route RT-04',
    seatsOccupied: 38,
    seatsCapacity: 44,
    departureTime: '08:00 AM',
    returnTime: '04:30 PM',
    campusEta: '08:50 AM',
    driverName: 'Md. Rafiqul Islam',
    driverPhone: '+880 1712-903411',
    helperPhone: '+880 1819-554210',
    stops: ['Dhanmondi', 'Mohakhali', 'Banani'],
  };

  var DEFAULT_ALERTS = [
    {
      id: 'palert-1',
      title: 'Bus Reached Mohakhali Checkpoint',
      time: '08:29 AM',
      desc: 'Gazipur-01 crossed Mohakhali Flyover. Student is onboard (Seat B-04). ETA: 08:50 AM.',
      unread: true,
    },
    {
      id: 'palert-2',
      title: 'Morning Boarding Confirmed',
      time: '07:56 AM',
      desc: 'Digital pass scanned at Dhanmondi 27 pickup point.',
      unread: true,
    },
    {
      id: 'palert-3',
      title: 'Thursday Afternoon Schedule Notice',
      time: 'Yesterday',
      desc: 'Return buses depart at 03:30 PM on Thursday due to faculty seminar.',
      unread: false,
    },
  ];

  var DEFAULT_PARENT_STATE = {
    stageIndex: 1, // 0 = Departed Start, 1 = Midway, 2 = Arrived at Campus
    readAlertIds: ['palert-3'],
    extraAlerts: [],
    selectedScheduleIndex: 1,
  };

  var WEEKLY_SCHEDULE = [
    { label: 'Sun – Tue', days: [0, 1, 2], pickup: '08:00 AM', ret: '04:30 PM' },
    { label: 'Wed', days: [3], pickup: '08:00 AM', ret: '04:30 PM' },
    { label: 'Thursday', days: [4], pickup: '08:00 AM', ret: '03:30 PM' },
  ];

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function loadJson(key, fallback) {
    try {
      var raw = global.localStorage.getItem(key);
      if (!raw) return cloneFallback(fallback);
      var parsed = JSON.parse(raw);
      return parsed != null ? parsed : cloneFallback(fallback);
    } catch (_err) {
      return cloneFallback(fallback);
    }
  }

  function cloneFallback(val) {
    if (Array.isArray(val)) return val.slice();
    if (val && typeof val === 'object') return Object.assign({}, val);
    return val;
  }

  function saveJson(key, value) {
    try {
      global.localStorage.setItem(key, JSON.stringify(value));
    } catch (_err) {
      // Ignore storage quota errors
    }
  }

  function formatTime24To12(timeStr) {
    var match = /^(\d{2}):(\d{2})/.exec(String(timeStr || '').trim());
    if (!match) return timeStr || '08:00 AM';
    var h = Number(match[1]);
    var m = match[2];
    var suffix = h >= 12 ? 'PM' : 'AM';
    var h12 = h % 12 || 12;
    return (h12 < 10 ? '0' : '') + h12 + ':' + m + ' ' + suffix;
  }

  function formatCurrentTime12(dateObj) {
    var d = dateObj || new Date();
    var h = d.getHours();
    var m = d.getMinutes();
    var suffix = h >= 12 ? 'PM' : 'AM';
    var h12 = h % 12 || 12;
    return (h12 < 10 ? '0' : '') + h12 + ':' + (m < 10 ? '0' : '') + m + ' ' + suffix;
  }

  function isControlRoomOpen(dateObj) {
    var d = dateObj || new Date();
    var h = d.getHours();
    return h >= 7 && h < 21;
  }

  function getRouteStageInfo(stageIndex, stops, busName, eta) {
    var list = Array.isArray(stops) && stops.length >= 3 ? stops : DEFAULT_CONTEXT.stops;
    var idx = Math.max(0, Math.min(2, Number(stageIndex) || 0));
    if (idx === 0) {
      return {
        stageIndex: 0,
        progress: 15,
        speed: 22,
        travelStatus: 'Boarded · Departing Pickup',
        travelStatusLong: 'Departed ' + list[0] + ' Pickup Point',
        travelTone: 'text-amber',
        note: '* ' + busName + ' has just departed ' + list[0] + ' (Heading toward ' + list[1] + ').',
        completedFirst: false,
        completedSecond: false,
        startLabel: 'Start: ' + list[0],
        currentLabel: 'Next: ' + list[1],
        endLabel: 'End: ' + list[2],
      };
    }
    if (idx === 2) {
      return {
        stageIndex: 2,
        progress: 100,
        speed: 0,
        travelStatus: 'Arrived · AIUB Campus',
        travelStatusLong: 'Safely Arrived at AIUB Campus',
        travelTone: 'text-green',
        note: '* ' + busName + ' completed the route and reached AIUB Permanent Campus Gate-B.',
        completedFirst: true,
        completedSecond: true,
        startLabel: 'Start: ' + list[0],
        currentLabel: 'Passed: ' + list[1],
        endLabel: 'Arrived: ' + list[2],
      };
    }
    return {
      stageIndex: 1,
      progress: 50,
      speed: 34,
      travelStatus: 'Onboard · In Transit',
      travelStatusLong: 'In Transit to AIUB Campus',
      travelTone: 'text-amber',
      note: '* The bus is currently midway to the destination (Next stop: ' + list[2] + ' → AIUB Campus, ETA ' + eta + ').',
      completedFirst: true,
      completedSecond: false,
      startLabel: 'Start: ' + list[0],
      currentLabel: 'Current: ' + list[1],
      endLabel: 'End: ' + list[2],
    };
  }

  function resolveParentContext(store) {
    var session = store ? store.session : loadJson(KEYS.session, null);
    var accounts = store ? store.accounts : loadJson(KEYS.accounts, []);
    var buses = store ? store.buses : loadJson(KEYS.buses, []);
    var drivers = store ? store.drivers : loadJson(KEYS.drivers, []);
    var routes = store ? store.routes : loadJson(KEYS.routes, []);
    var schedules = store ? store.schedules : loadJson(KEYS.schedules, []);
    var passes = store ? store.passes : loadJson(KEYS.passes, []);

    var ctx = Object.assign({}, DEFAULT_CONTEXT);

    if (session && typeof session === 'object' && session.role === 'parent') {
      if (session.email) ctx.parentEmail = session.email;
      if (session.name) ctx.parentName = session.name;
      if (session.linkedStudentId) ctx.studentId = session.linkedStudentId;
    }

    if (Array.isArray(accounts) && accounts.length > 0) {
      var acc =
        accounts.find(function (a) { return a.studentId === ctx.studentId; }) ||
        accounts[0];
      if (acc) {
        ctx.studentName = acc.studentName || ctx.studentName;
        ctx.studentId = acc.studentId || ctx.studentId;
        ctx.department = acc.department || ctx.department;
        ctx.busName = acc.bus || ctx.busName;
        ctx.pickupPoint = acc.pickup || ctx.pickupPoint;
        ctx.pickupShort = acc.pickup || ctx.pickupShort;
        if (acc.parentPhone) ctx.emergencyPhone = acc.parentPhone;
        if (acc.parentName) ctx.parentName = acc.parentName;
        ctx.passStatus = acc.status === 'Approved' ? 'Active' : acc.status || 'Active';
      }
    }

    ctx.passId = 'AIUB-' + String(ctx.studentId || '23-54334-3').replace(/-/g, '');

    // Check per-student bookings for latest seat
    var stuBookings = loadJson('aiub_bms_student_bookings_' + ctx.studentId, []);
    if (Array.isArray(stuBookings)) {
      var activeBk = stuBookings.find(function (b) { return b.status !== 'Cancelled'; });
      if (activeBk && activeBk.seat) {
        ctx.seat = activeBk.seat + ' (Reserved)';
        ctx.seatCode = activeBk.seat;
      }
    }

    if (Array.isArray(buses) && buses.length > 0) {
      var bus = buses.find(function (b) { return b.busNumber === ctx.busName; });
      if (bus) {
        if (bus.plateNumber && bus.plateNumber !== 'N/A') ctx.busPlate = bus.plateNumber;
        if (Number.isFinite(Number(bus.seats))) ctx.seatsCapacity = Number(bus.seats);
        if (Number.isFinite(Number(bus.reserved))) ctx.seatsOccupied = Number(bus.reserved);
      }
    }

    if (Array.isArray(drivers) && drivers.length > 0) {
      var drv = drivers.find(function (d) { return d.assignedBus === ctx.busName; });
      if (drv) {
        ctx.driverName = drv.fullName || ctx.driverName;
        ctx.driverPhone = drv.phone || ctx.driverPhone;
      }
    }

    if (Array.isArray(schedules) && schedules.length > 0) {
      var sch = schedules.find(function (s) { return s.bus === ctx.busName; });
      if (sch && sch.departureTime) {
        ctx.departureTime = formatTime24To12(sch.departureTime);
        ctx.campusEta = String(sch.departureTime).indexOf('09') === 0 ? '09:50 AM' : '07:40 AM';
      }
      if (sch && sch.route && Array.isArray(routes)) {
        var rt = routes.find(function (r) { return r.name === sch.route; });
        if (rt) {
          ctx.routeCode = 'Route ' + String(rt.id || 'RT-01').toUpperCase();
          if (Array.isArray(rt.stops) && rt.stops.length >= 2) {
            ctx.stops = [
              rt.stops[0],
              rt.stops[Math.floor(rt.stops.length / 2)] || rt.stops[1],
              rt.stops[rt.stops.length - 1],
            ];
          }
        }
      }
    }

    // Check per-student pass + admin passes queue
    var scopedPass = loadJson('aiub_bms_student_pass_' + ctx.studentId, null);
    var adminPass = Array.isArray(passes)
      ? passes.find(function (p) {
          if (scopedPass && scopedPass.trxId && p.trxId === scopedPass.trxId) return true;
          return String(p.email || '').toLowerCase().indexOf(String(ctx.studentId).toLowerCase()) === 0;
        })
      : null;

    if (scopedPass) {
      ctx.passValidUntil = scopedPass.validUntil || ctx.passValidUntil;
      var st = (adminPass && adminPass.status) || scopedPass.status;
      ctx.passStatus = st === 'Approved' ? 'Active' : st;
    } else if (adminPass) {
      ctx.passValidUntil = adminPass.validity || ctx.passValidUntil;
      ctx.passStatus = adminPass.status === 'Approved' ? 'Active' : adminPass.status;
    }

    return ctx;
  }

  function buildParentAlerts(adminNotifications, parentState, ctx) {
    var readSet = new Set((parentState && parentState.readAlertIds) || []);
    var merged = [];

    if (parentState && Array.isArray(parentState.extraAlerts)) {
      parentState.extraAlerts.forEach(function (a) {
        merged.push({
          id: a.id,
          title: a.title,
          time: a.time,
          desc: a.desc,
          unread: !readSet.has(a.id),
        });
      });
    }

    if (Array.isArray(adminNotifications)) {
      adminNotifications.forEach(function (n) {
        var audience = String(n.audience || '').toLowerCase();
        var busLower = String(ctx.busName || '').toLowerCase();
        var isBusSpecific = /\([^)]+\)/.test(audience);
        var matchesBus = busLower && audience.indexOf(busLower) !== -1;
        if (audience.indexOf('all') !== -1 || matchesBus || (!isBusSpecific && audience.indexOf('parent') !== -1)) {
          var nid = 'admin-' + n.id;
          merged.push({
            id: nid,
            title: n.title,
            time: n.sentTime || 'Today',
            desc: n.message,
            unread: !readSet.has(nid),
          });
        }
      });
    }

    var midwayStop = (ctx.stops && ctx.stops[1]) || 'Midway';
    var personalizedDefaults = [
      {
        id: 'palert-1',
        title: 'Bus Reached ' + midwayStop + ' Checkpoint',
        time: 'Today',
        desc: ctx.busName + ' crossed ' + midwayStop + '. ' + ctx.studentName + ' is onboard (Seat ' + ctx.seatCode + '). ETA: ' + ctx.campusEta + '.',
      },
      {
        id: 'palert-2',
        title: 'Morning Boarding Confirmed',
        time: ctx.departureTime,
        desc: 'Digital pass scanned at ' + ctx.pickupPoint + '.',
      },
      {
        id: 'palert-3',
        title: 'Thursday Afternoon Schedule Notice',
        time: 'Yesterday',
        desc: 'Return buses depart at 03:30 PM on Thursday due to faculty seminar.',
      },
    ];

    personalizedDefaults.forEach(function (a) {
      merged.push({
        id: a.id,
        title: a.title,
        time: a.time,
        desc: a.desc,
        unread: !readSet.has(a.id),
      });
    });

    return merged.slice(0, 6);
  }

  function countUnreadAlerts(alerts) {
    return (alerts || []).filter(function (a) { return a.unread; }).length;
  }

  function ensureHelperStyles() {
    if (document.getElementById('bms-parent-runtime-styles')) return;
    var style = document.createElement('style');
    style.id = 'bms-parent-runtime-styles';
    style.textContent =
      '.contact-modal-overlay.is-open{display:flex!important}' +
      '.route-controls{display:flex;align-items:center;justify-content:center;gap:8px;margin-top:14px;flex-wrap:wrap}' +
      '.btn-route-ctrl{font-family:inherit;font-size:.76rem;font-weight:700;padding:6px 12px;border-radius:6px;border:1px solid #cbd5e1;background:#fff;color:#0f172a;cursor:pointer;transition:background .15s,border-color .15s}' +
      '.btn-route-ctrl:hover{background:#f1f5f9;border-color:#94a3b8}' +
      '.btn-route-ctrl.is-active{background:#003366;color:#fff;border-color:#003366}' +
      '.alert-item{cursor:pointer;border-radius:6px;padding:8px 8px 10px 10px;transition:background .15s}' +
      '.alert-item:hover{background:#f8fafc}' +
      '.alert-item.unread{border-left:3px solid #0d6efd;background:#f8fbff}' +
      '.btn-mark-read{font-family:inherit;font-size:.72rem;font-weight:700;color:#003366;background:#eff6ff;border:1px solid #bfdbfe;border-radius:6px;padding:3px 8px;cursor:pointer;margin-left:8px}' +
      '.btn-mark-read:hover{background:#dbeafe}' +
      '.mini-table tbody tr{cursor:pointer;transition:background .15s}' +
      '.mini-table tbody tr:hover{background:#f8fafc}' +
      '.btn-copy-inline{font-family:inherit;font-size:.72rem;font-weight:700;color:#003366;background:#f1f5f9;border:1px solid #cbd5e1;border-radius:5px;padding:2px 7px;margin-left:8px;cursor:pointer}' +
      '.btn-copy-inline:hover{background:#e2e8f0}' +
      '.bms-parent-toast{position:fixed;right:22px;bottom:22px;background:#003366;color:#fff;border-left:4px solid #fbbf24;padding:11px 16px;border-radius:8px;font-size:.84rem;font-weight:600;box-shadow:0 12px 26px rgba(15,23,42,.22);z-index:3000;opacity:0;transform:translateY(8px);transition:opacity .2s,transform .2s;pointer-events:none}' +
      '.bms-parent-toast.show{opacity:1;transform:translateY(0)}' +
      '.btn-modal-danger-parent{display:inline-flex;align-items:center;justify-content:center;padding:9px 18px;border-radius:8px;background:#dc3545;color:#fff;border:none;font-family:inherit;font-size:.84rem;font-weight:700;cursor:pointer}' +
      '.btn-modal-danger-parent:hover{background:#c82333}' +
      '.btn-modal-secondary-parent{display:inline-flex;align-items:center;justify-content:center;padding:9px 18px;border-radius:8px;background:#f1f5f9;color:#334155;border:1px solid #cbd5e1;font-family:inherit;font-size:.84rem;font-weight:700;cursor:pointer;margin-right:8px}';
    document.head.appendChild(style);
  }

  var toastTimer = null;
  function showToast(message) {
    var toast = document.getElementById('bms-parent-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'bms-parent-toast';
      toast.className = 'bms-parent-toast';
      toast.setAttribute('role', 'status');
      toast.setAttribute('aria-live', 'polite');
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = global.setTimeout(function () {
      toast.classList.remove('show');
    }, 2600);
  }

  function copyText(text, label) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        showToast((label || 'Contact') + ' copied: ' + text);
      });
    } else {
      showToast((label || 'Contact') + ': ' + text);
    }
  }

  function initParentDashboard() {
    var session = loadJson(KEYS.session, null);
    if (!session || typeof session !== 'object' || session.role !== 'parent') {
      global.location.replace('../Login page/login.html?role=parent');
      return;
    }

    ensureHelperStyles();

    var ctx = resolveParentContext();
    var stateKey = KEYS.parentState + '_' + ctx.studentId;
    var state = Object.assign({}, DEFAULT_PARENT_STATE, loadJson(stateKey, DEFAULT_PARENT_STATE));
    if (!Array.isArray(state.readAlertIds)) state.readAlertIds = ['palert-3'];
    if (!Array.isArray(state.extraAlerts)) state.extraAlerts = [];
    var autoTrackTimer = null;

    function persistState() {
      saveJson(stateKey, state);
    }

    function renderSidebarAndHeader() {
      var emailEl = document.querySelector('.sidebar-footer .user-email');
      var roleEl = document.querySelector('.sidebar-footer .user-role');
      var subEl = document.querySelector('.dashboard-subtitle');
      if (emailEl) emailEl.textContent = ctx.parentEmail;
      if (roleEl) roleEl.textContent = ctx.parentRole;
      if (subEl) {
        subEl.innerHTML =
          'AIUB Campus Transport Monitoring &middot; Linked Student: <strong>' +
          escapeHtml(ctx.studentName) +
          '</strong> (<span class="mono">' +
          escapeHtml(ctx.studentId) +
          '</span>)';
      }
    }

    function renderStudentProfile(stage) {
      var card = document.querySelector('.student-profile-card');
      if (!card) return;
      var nameEl = card.querySelector('.student-name');
      var idEl = card.querySelector('.student-id-text');
      var passEl = card.querySelector('.pass-status-active');
      var rows = card.querySelectorAll('.student-meta-list .meta-row dd');
      var footerSpans = card.querySelectorAll('.student-card-footer > span');

      if (nameEl) nameEl.textContent = ctx.studentName;
      if (idEl) idEl.innerHTML = 'ID: <span class="mono">' + escapeHtml(ctx.studentId) + '</span> &middot; ' + escapeHtml(ctx.department);
      if (passEl) {
        passEl.innerHTML = ctx.passStatus === 'Active' ? 'Active &#10003;' : escapeHtml(ctx.passStatus);
        passEl.style.color = ctx.passStatus === 'Active' ? '#198754' : '#d97706';
      }
      if (rows[0]) {
        rows[0].textContent = stage.travelStatus;
        rows[0].className = stage.travelTone;
      }
      if (rows[1]) rows[1].textContent = ctx.seat;
      if (rows[2]) rows[2].textContent = ctx.pickupShort;
      if (footerSpans[0]) footerSpans[0].innerHTML = 'Pass Valid Until: <strong class="mono">' + escapeHtml(ctx.passValidUntil) + '</strong>';
      if (footerSpans[1]) footerSpans[1].textContent = ctx.emergencyPhone;
    }

    function renderAssignedBus(stage) {
      var card = document.querySelector('.assigned-bus-card');
      if (!card) return;
      var plateEl = card.querySelector('.bus-plate');
      var cols = card.querySelectorAll('.telemetry-col');
      if (plateEl) plateEl.innerHTML = escapeHtml(ctx.busPlate) + ' &middot; ' + escapeHtml(ctx.routeCode);

      if (cols[0]) {
        var busVal = cols[0].querySelector('.telemetry-value');
        var busSub = cols[0].querySelector('.telemetry-sub');
        if (busVal) busVal.textContent = ctx.busName;
        if (busSub) busSub.textContent = ctx.seatsOccupied + '/' + ctx.seatsCapacity + ' Seats Occupied';
      }
      if (cols[1]) {
        var depVal = cols[1].querySelector('.telemetry-value');
        var depSub = cols[1].querySelector('.telemetry-sub');
        if (depVal) depVal.textContent = ctx.departureTime;
        if (depSub) depSub.innerHTML = 'Campus ETA: <span class="mono">' + escapeHtml(ctx.campusEta) + '</span>';
      }
      if (cols[2]) {
        var drvEl = cols[2].querySelector('.driver-name');
        if (drvEl) drvEl.textContent = ctx.driverName;
      }

      var metaEl = card.querySelector('.route-box-meta');
      var startEl = card.querySelector('.stop-start');
      var currentEl = card.querySelector('.stop-current');
      var endEl = card.querySelector('.stop-end');
      var lines = card.querySelectorAll('.route-line');
      var noteEl = card.querySelector('.route-note');

      if (metaEl) metaEl.textContent = 'Speed: ' + stage.speed + ' km/h · Progress: ' + stage.progress + '%';
      if (startEl) startEl.textContent = stage.startLabel;
      if (currentEl) currentEl.textContent = stage.currentLabel;
      if (endEl) endEl.textContent = stage.endLabel;
      if (lines[0]) {
        lines[0].className = 'route-line ' + (stage.completedFirst ? 'line-completed' : 'line-upcoming');
      }
      if (lines[1]) {
        lines[1].className = 'route-line ' + (stage.completedSecond ? 'line-completed' : 'line-upcoming');
      }
      if (noteEl) noteEl.textContent = stage.note;

      // Ensure interactive route checkpoint controls exist
      var trackingBox = card.querySelector('.route-tracking-box');
      if (trackingBox && !trackingBox.querySelector('.route-controls')) {
        var controls = document.createElement('div');
        controls.className = 'route-controls';
        controls.innerHTML =
          '<button type="button" class="btn-route-ctrl" data-action="advance-stage">Update Live GPS</button>' +
          '<button type="button" class="btn-route-ctrl" data-action="toggle-auto">Auto-Track: Off</button>';
        trackingBox.appendChild(controls);

        controls.addEventListener('click', function (e) {
          var btn = e.target.closest('button[data-action]');
          if (!btn) return;
          var action = btn.getAttribute('data-action');
          if (action === 'advance-stage') {
            advanceStage(true);
          } else if (action === 'toggle-auto') {
            if (autoTrackTimer) {
              global.clearInterval(autoTrackTimer);
              autoTrackTimer = null;
              btn.textContent = 'Auto-Track: Off';
              btn.classList.remove('is-active');
              showToast('Live GPS auto-tracking paused.');
            } else {
              btn.textContent = 'Auto-Track: Live';
              btn.classList.add('is-active');
              showToast('Live GPS auto-tracking enabled (updates every 6s).');
              autoTrackTimer = global.setInterval(function () {
                advanceStage(false);
              }, 6000);
            }
          }
        });
      }
    }

    function renderPickupSchedule() {
      var card = document.getElementById('pickup-schedule') || document.querySelector('.pickup-schedule-card');
      if (!card) return;
      var metaEl = card.querySelector('.feature-meta');
      var mainEl = card.querySelector('.highlight-main');
      var subEl = card.querySelector('.highlight-sub');
      var tbody = card.querySelector('.mini-table tbody');
      var todayDow = new Date().getDay();

      if (metaEl) metaEl.textContent = ctx.routeCode;

      var rowsData = WEEKLY_SCHEDULE.map(function (r) {
        return Object.assign({}, r, { pickup: ctx.departureTime || r.pickup });
      });

      if (tbody) {
        tbody.innerHTML = rowsData.map(function (row, idx) {
          var isToday = row.days.indexOf(todayDow) !== -1;
          var isSelected = state.selectedScheduleIndex === idx;
          var labelText = isToday ? '<strong>' + escapeHtml(row.label) + ' (Today)</strong>' : escapeHtml(row.label);
          return (
            '<tr data-sch-idx="' + idx + '" class="' + (isSelected ? 'active-table-row' : '') + '">' +
              '<td>' + labelText + '</td>' +
              '<td class="mono">' + escapeHtml(row.pickup) + '</td>' +
              '<td class="mono">' + escapeHtml(row.ret) + '</td>' +
              '<td class="mono text-right">' + escapeHtml(ctx.seatCode) + '</td>' +
            '</tr>'
          );
        }).join('');
      }

      var activeRow = rowsData[state.selectedScheduleIndex] || rowsData[0];
      if (mainEl) mainEl.textContent = ctx.pickupPoint;
      if (subEl) subEl.textContent = 'Morning: ' + activeRow.pickup + ' · Return: ' + activeRow.ret;
    }

    function renderTravelStatus(stage) {
      var card = document.getElementById('travel-status') || document.querySelector('.travel-status-card');
      if (!card) return;
      var metaEl = card.querySelector('.feature-meta');
      var mainEl = card.querySelector('.highlight-main');
      var subEl = card.querySelector('.highlight-sub');
      var rows = card.querySelectorAll('.compact-list .compact-row dd');

      if (metaEl) {
        metaEl.textContent = ctx.passStatus === 'Active' ? 'Pass Verified' : ctx.passStatus;
        metaEl.className = 'feature-meta ' + (ctx.passStatus === 'Active' ? 'text-green' : 'text-amber');
      }
      if (mainEl) {
        mainEl.textContent = stage.travelStatusLong;
        mainEl.className = 'highlight-main ' + stage.travelTone;
      }
      if (subEl) {
        subEl.textContent =
          stage.stageIndex === 2
            ? 'Arrived at ' + ctx.campusEta + ' · Seat ' + ctx.seatCode
            : 'Boarded at 07:56 AM · Seat ' + ctx.seatCode;
      }
      if (rows[0]) rows[0].textContent = ctx.passId;
    }

    function renderNotifications() {
      var card = document.getElementById('notifications') || document.querySelector('.notifications-card');
      if (!card) return;
      var adminNotes = loadJson(KEYS.notifications, []);
      var alerts = buildParentAlerts(adminNotes, state, ctx);
      var unreadCount = countUnreadAlerts(alerts);

      var header = card.querySelector('.feature-card-header');
      var metaEl = card.querySelector('.feature-meta');
      if (metaEl) {
        metaEl.textContent = unreadCount === 0 ? 'All Read' : unreadCount + ' Unread';
      }

      if (header && !header.querySelector('.btn-mark-read')) {
        var wrap = document.createElement('div');
        wrap.style.display = 'flex';
        wrap.style.alignItems = 'center';
        if (metaEl) {
          header.insertBefore(wrap, metaEl);
          wrap.appendChild(metaEl);
        } else {
          header.appendChild(wrap);
        }
        var markBtn = document.createElement('button');
        markBtn.type = 'button';
        markBtn.className = 'btn-mark-read';
        markBtn.textContent = 'Mark all read';
        markBtn.addEventListener('click', function () {
          alerts.forEach(function (a) {
            if (state.readAlertIds.indexOf(a.id) === -1) state.readAlertIds.push(a.id);
          });
          persistState();
          renderNotifications();
          showToast('All alerts marked as read.');
        });
        wrap.appendChild(markBtn);
      }

      var markBtnExisting = header && header.querySelector('.btn-mark-read');
      if (markBtnExisting) markBtnExisting.style.display = unreadCount > 0 ? 'inline-block' : 'none';

      var list = card.querySelector('.alert-list');
      if (!list) return;
      list.innerHTML = alerts
        .map(function (a) {
          return (
            '<li class="alert-item' + (a.unread ? ' unread' : '') + '" data-alert-id="' + escapeHtml(a.id) + '">' +
              '<div class="alert-top">' +
                '<strong class="alert-title">' + escapeHtml(a.title) + '</strong>' +
                '<span class="alert-time mono">' + escapeHtml(a.time) + '</span>' +
              '</div>' +
              '<p class="alert-desc">' + escapeHtml(a.desc) + '</p>' +
            '</li>'
          );
        })
        .join('');
    }

    function renderTransportOfficeAndModals(stage) {
      var section = document.getElementById('transport-office') || document.querySelector('.transport-office-card');
      if (section) {
        var statusEl = section.querySelector('.transport-status-text');
        if (statusEl) {
          var open = isControlRoomOpen();
          statusEl.textContent = open
            ? 'Control Room Open · 07:00 AM – 09:00 PM'
            : 'After Hours · 24/7 Emergency Line Active';
          statusEl.className = 'transport-status-text ' + (open ? 'text-green' : 'text-amber');
        }
        var items = section.querySelectorAll('.transport-item');
        if (items[2]) {
          var lbl = items[2].querySelector('.transport-label');
          var ph = items[2].querySelector('.transport-phone');
          var nt = items[2].querySelector('.transport-note');
          if (lbl) lbl.textContent = 'Assigned Bus Driver (' + ctx.busName + ')';
          if (ph) ph.textContent = ctx.driverPhone;
          if (nt) nt.innerHTML = escapeHtml(ctx.driverName) + ' &middot; Helper: <span class="mono">' + escapeHtml(ctx.helperPhone) + '</span>';
        }
      }

      var driverModal = document.getElementById('call-driver');
      if (driverModal) {
        var kicker = driverModal.querySelector('.modal-kicker');
        var statusTitle = driverModal.querySelector('.call-status-title');
        var statusSub = driverModal.querySelector('.call-status-sub');
        var dds = driverModal.querySelectorAll('.modal-contact-row dd');
        if (kicker) kicker.innerHTML = 'Assigned Bus ' + escapeHtml(ctx.busName) + ' &middot; ' + escapeHtml(ctx.routeCode);
        if (statusTitle) statusTitle.textContent = ctx.driverName + ' (Senior Driver)';
        if (statusSub) statusSub.textContent = stage.travelStatusLong;
        if (dds[0]) dds[0].textContent = ctx.driverPhone;
        if (dds[1]) dds[1].textContent = ctx.helperPhone;
        if (dds[2]) dds[2].textContent = ctx.busPlate;
      }

      // Attach copy buttons inside modals once
      document.querySelectorAll('.contact-modal-overlay .modal-contact-row dd.mono').forEach(function (dd) {
        if (dd.querySelector('.btn-copy-inline')) return;
        var rawText = dd.textContent.trim();
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn-copy-inline';
        btn.textContent = 'Copy';
        btn.addEventListener('click', function () {
          copyText(rawText, 'Number');
        });
        dd.appendChild(btn);
      });
    }

    function advanceStage(manual) {
      state.stageIndex = (Number(state.stageIndex) + 1) % 3;
      var stage = getRouteStageInfo(state.stageIndex, ctx.stops, ctx.busName, ctx.campusEta);
      var newAlert = {
        id: 'live-' + Date.now(),
        title:
          state.stageIndex === 2
            ? 'Arrived Safely at AIUB Campus'
            : state.stageIndex === 1
            ? 'Bus Reached ' + ctx.stops[1] + ' Checkpoint'
            : 'Bus Departed ' + ctx.stops[0] + ' Pickup',
        time: formatCurrentTime12(),
        desc: stage.note.replace(/^\*\s*/, ''),
      };
      state.extraAlerts.unshift(newAlert);
      state.extraAlerts = state.extraAlerts.slice(0, 4);
      persistState();
      renderAll();
      if (manual) showToast('GPS refreshed: ' + stage.travelStatus);
    }

    function renderAll() {
      var stage = getRouteStageInfo(state.stageIndex, ctx.stops, ctx.busName, ctx.campusEta);
      renderSidebarAndHeader();
      renderStudentProfile(stage);
      renderAssignedBus(stage);
      renderPickupSchedule();
      renderTravelStatus(stage);
      renderNotifications();
      renderTransportOfficeAndModals(stage);
    }

    // Bind schedule table row click
    var pickupCard = document.getElementById('pickup-schedule') || document.querySelector('.pickup-schedule-card');
    if (pickupCard) {
      pickupCard.addEventListener('click', function (e) {
        var tr = e.target.closest('tr[data-sch-idx]');
        if (!tr) return;
        state.selectedScheduleIndex = Number(tr.getAttribute('data-sch-idx'));
        persistState();
        renderPickupSchedule();
      });
    }

    // Bind alert click to mark read
    var notifCard = document.getElementById('notifications') || document.querySelector('.notifications-card');
    if (notifCard) {
      notifCard.addEventListener('click', function (e) {
        var li = e.target.closest('li[data-alert-id]');
        if (!li) return;
        var aid = li.getAttribute('data-alert-id');
        if (state.readAlertIds.indexOf(aid) === -1) {
          state.readAlertIds.push(aid);
          persistState();
          renderNotifications();
        }
      });
    }

    // Smooth modal open/close for #call-transport-office and #call-driver
    function closeAllModals() {
      document.querySelectorAll('.contact-modal-overlay.is-open').forEach(function (m) {
        m.classList.remove('is-open');
      });
      if (global.location.hash === '#call-transport-office' || global.location.hash === '#call-driver') {
        try {
          global.history.replaceState(null, '', global.location.pathname + global.location.search);
        } catch (_err) {
          // Ignore
        }
      }
    }

    function openModalById(id) {
      closeAllModals();
      var modal = document.getElementById(id);
      if (modal) modal.classList.add('is-open');
    }

    document.querySelectorAll('a[href="#call-transport-office"], a[href="#call-driver"]').forEach(function (link) {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        openModalById(link.getAttribute('href').slice(1));
      });
    });

    document.querySelectorAll('.contact-modal-overlay').forEach(function (overlay) {
      overlay.addEventListener('click', function (e) {
        if (e.target === overlay || e.target.closest('.modal-close-btn') || e.target.closest('.btn-modal-primary')) {
          e.preventDefault();
          closeAllModals();
        }
      });
    });

    // Logout confirmation modal
    var logoutBtn = document.querySelector('.btn-logout');
    if (logoutBtn) {
      var logoutModal = document.createElement('div');
      logoutModal.id = 'modal-parent-logout';
      logoutModal.className = 'contact-modal-overlay';
      logoutModal.setAttribute('role', 'dialog');
      logoutModal.setAttribute('aria-modal', 'true');
      logoutModal.innerHTML =
        '<div class="contact-modal-card">' +
          '<div class="contact-modal-header">' +
            '<div><span class="modal-kicker">AIUB Parent Portal</span><h3 class="modal-title">Confirm Sign Out</h3></div>' +
            '<a href="#" class="modal-close-btn" aria-label="Close">&times;</a>' +
          '</div>' +
          '<div class="contact-modal-body">' +
            '<p style="font-size:.86rem;color:#475569">Are you sure you want to sign out of the Parent Portal? You can sign back in anytime with your guardian credentials.</p>' +
            '<div class="modal-footer-actions">' +
              '<button type="button" class="btn-modal-secondary-parent" id="btn-cancel-parent-logout">Cancel</button>' +
              '<button type="button" class="btn-modal-danger-parent" id="btn-confirm-parent-logout">Log Out</button>' +
            '</div>' +
          '</div>' +
        '</div>';
      document.body.appendChild(logoutModal);

      logoutBtn.addEventListener('click', function (e) {
        e.preventDefault();
        openModalById('modal-parent-logout');
      });

      logoutModal.addEventListener('click', function (e) {
        if (e.target === logoutModal || e.target.closest('.modal-close-btn') || e.target.id === 'btn-cancel-parent-logout') {
          e.preventDefault();
          closeAllModals();
        }
      });

      logoutModal.querySelector('#btn-confirm-parent-logout').addEventListener('click', function () {
        try {
          global.localStorage.setItem(KEYS.session, 'signed_out');
        } catch (_err) {
          // Ignore
        }
        global.location.href = '../Login page/login.html?role=parent';
      });
    }

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeAllModals();
    });

    // Determine initial schedule row matching today if not explicitly clicked
    var todayDow = new Date().getDay();
    var todayRowIdx = WEEKLY_SCHEDULE.findIndex(function (r) { return r.days.indexOf(todayDow) !== -1; });
    if (todayRowIdx !== -1 && loadJson(stateKey, null) == null) {
      state.selectedScheduleIndex = todayRowIdx;
    }

    renderAll();
  }

  global.AIUB_BMS_PARENT_DASHBOARD = {
    KEYS: KEYS,
    DEFAULT_CONTEXT: DEFAULT_CONTEXT,
    DEFAULT_ALERTS: DEFAULT_ALERTS,
    formatTime24To12: formatTime24To12,
    isControlRoomOpen: isControlRoomOpen,
    getRouteStageInfo: getRouteStageInfo,
    resolveParentContext: resolveParentContext,
    buildParentAlerts: buildParentAlerts,
    countUnreadAlerts: countUnreadAlerts,
  };

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initParentDashboard);
    } else {
      initParentDashboard();
    }
  }
})(typeof window !== 'undefined' ? window : globalThis);

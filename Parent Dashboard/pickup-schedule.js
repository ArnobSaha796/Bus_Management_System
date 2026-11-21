(function (global) {
  'use strict';

  var SESSION_KEY = 'aiub_bms_session';
  var ACCOUNTS_KEY = 'aiub_bms_accounts';
  var SCHEDULES_KEY = 'aiub_bms_schedules';

  var DEFAULT_ROWS = [
    { label: 'Sun – Tue', days: [0, 1, 2], pickup: '08:00 AM', ret: '04:30 PM', seat: 'B-04' },
    { label: 'Wed', days: [3], pickup: '08:00 AM', ret: '04:30 PM', seat: 'B-04' },
    { label: 'Thursday', days: [4], pickup: '08:00 AM', ret: '03:30 PM', seat: 'B-04' },
  ];

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

  function formatTime24To12(timeStr) {
    var m = /^(\d{2}):(\d{2})/.exec(String(timeStr || '').trim());
    if (!m) return timeStr || '08:00 AM';
    var h = Number(m[1]);
    var suffix = h >= 12 ? 'PM' : 'AM';
    var h12 = h % 12 || 12;
    return (h12 < 10 ? '0' : '') + h12 + ':' + m[2] + ' ' + suffix;
  }

  function resolvePickupSchedule(session, accounts, schedules) {
    var info = {
      pickupPoint: 'Dhanmondi 27 (Rapa Plaza Gate)',
      routeCode: 'Route RT-04',
      busName: 'Gazipur-01',
      rows: DEFAULT_ROWS.map(function (r) { return Object.assign({}, r); }),
    };

    var stuId = session && session.linkedStudentId ? session.linkedStudentId : '23-54334-3';
    if (Array.isArray(accounts) && accounts.length > 0) {
      var acc = accounts.find(function (a) { return a.studentId === stuId; }) || accounts[0];
      if (acc) {
        if (acc.pickup) info.pickupPoint = acc.pickup;
        if (acc.bus) info.busName = acc.bus;
      }
    }

    if (Array.isArray(schedules)) {
      var sch = schedules.find(function (s) { return s.bus === info.busName; });
      if (sch && sch.departureTime) {
        var dep = formatTime24To12(sch.departureTime);
        info.rows.forEach(function (r) { r.pickup = dep; });
      }
    }

    return info;
  }

  function findTodayRowIndex(rows, dayOfWeek) {
    var dow = Number.isInteger(dayOfWeek) ? dayOfWeek : new Date().getDay();
    var idx = rows.findIndex(function (r) { return r.days.indexOf(dow) !== -1; });
    return idx !== -1 ? idx : 1;
  }

  function initPickupScheduleCard() {
    var card = document.querySelector('.pickup-schedule-card') || document.getElementById('pickup-schedule');
    if (!card) return;

    var info = resolvePickupSchedule(
      loadJson(SESSION_KEY, null),
      loadJson(ACCOUNTS_KEY, []),
      loadJson(SCHEDULES_KEY, [])
    );
    var todayDow = new Date().getDay();
    var selectedIndex = findTodayRowIndex(info.rows, todayDow);

    var mainEl = card.querySelector('.highlight-main');
    var subEl = card.querySelector('.highlight-sub');
    var tbody = card.querySelector('.mini-table tbody');

    function render() {
      var active = info.rows[selectedIndex] || info.rows[0];
      if (mainEl) mainEl.textContent = info.pickupPoint;
      if (subEl) subEl.textContent = 'Morning: ' + active.pickup + ' · Return: ' + active.ret;
      if (!tbody) return;
      tbody.innerHTML = info.rows
        .map(function (row, idx) {
          var isToday = row.days.indexOf(todayDow) !== -1;
          var labelHtml = isToday ? '<strong>' + row.label + ' (Today)</strong>' : row.label;
          return (
            '<tr data-row-idx="' + idx + '" style="cursor:pointer" class="' + (idx === selectedIndex ? 'active-table-row' : '') + '">' +
              '<td>' + labelHtml + '</td>' +
              '<td class="mono">' + row.pickup + '</td>' +
              '<td class="mono">' + row.ret + '</td>' +
              '<td class="mono text-right">' + row.seat + '</td>' +
            '</tr>'
          );
        })
        .join('');
    }

    if (tbody) {
      tbody.addEventListener('click', function (e) {
        var tr = e.target.closest('tr[data-row-idx]');
        if (!tr) return;
        selectedIndex = Number(tr.getAttribute('data-row-idx'));
        render();
      });
    }

    render();
  }

  global.AIUB_BMS_PICKUP_SCHEDULE = {
    resolvePickupSchedule: resolvePickupSchedule,
    findTodayRowIndex: findTodayRowIndex,
  };

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initPickupScheduleCard);
    } else {
      initPickupScheduleCard();
    }
  }
})(typeof window !== 'undefined' ? window : globalThis);

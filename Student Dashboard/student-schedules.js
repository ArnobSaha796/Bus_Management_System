(function (global) {
  'use strict';

  var KEYS = {
    session: 'aiub_bms_session',
    accounts: 'aiub_bms_accounts',
    schedules: 'aiub_bms_schedules',
    bookings: 'aiub_bms_student_bookings',
  };

  var DEFAULT_SCHEDULES = [
    { id: 'sch-1', days: 'Sunday - Thursday', departureTime: '06:00', bus: 'Gazipur-01', route: 'Shibbari → Board Bazar → Tongi → Kuril → AIUB' },
    { id: 'sch-2', days: 'Sunday - Thursday', departureTime: '09:00', bus: 'Gazipur-02', route: 'Shibbari → Bypass → Purbachal 300 Feet → AIUB' },
    { id: 'sch-3', days: 'Sunday - Thursday', departureTime: '06:00', bus: 'Jatrabari-01', route: 'Jatrabari → Sayedabad → Rampura → Badda → AIUB' },
    { id: 'sch-4', days: 'Sunday - Thursday', departureTime: '09:00', bus: 'Jatrabari-02', route: 'Jatrabari → Hanif Flyover → Hatirjheel → AIUB' },
    { id: 'sch-5', days: 'Sunday - Thursday', departureTime: '06:00', bus: 'Mirpur-01', route: 'Mirpur 12 → Agargaon → Mohakhali → Banani → AIUB' },
    { id: 'sch-6', days: 'Sunday - Thursday', departureTime: '09:00', bus: 'Mirpur-02', route: 'Mirpur 1 → Cantonment → Kalshi → Kuril → AIUB' },
    { id: 'sch-7', days: 'Sunday - Thursday', departureTime: '06:00', bus: 'Dhanmondi-01', route: 'Dhanmondi 15 → Shahbag → Tejgaon → AIUB' },
  ];

  var SEAT_OPTIONS = ['A-01', 'A-02', 'A-05', 'B-04', 'B-07', 'C-02', 'C-08', 'D-03', 'D-06'];

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
      if (!raw) return fallback.slice ? fallback.slice() : fallback;
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

  function filterSchedules(schedules, query) {
    var q = String(query || '').trim().toLowerCase();
    if (!q) return schedules.slice();
    return schedules.filter(function (s) {
      return (
        String(s.route || '').toLowerCase().indexOf(q) !== -1 ||
        String(s.bus || '').toLowerCase().indexOf(q) !== -1 ||
        String(s.departureTime || '').toLowerCase().indexOf(q) !== -1
      );
    });
  }

  function createBookingRecord(schedule, tripDate, seatNumber, existingBookings) {
    var dateStr = String(tripDate || '').trim();
    var seatStr = String(seatNumber || '').trim();
    if (!dateStr) return { valid: false, error: 'Please choose a trip date.' };
    if (!seatStr) return { valid: false, error: 'Please select a seat number.' };

    var dup = (existingBookings || []).some(function (b) {
      return b.status !== 'Cancelled' && b.date === dateStr && b.bus === schedule.bus;
    });
    if (dup) {
      return { valid: false, error: 'You already have an active booking for ' + schedule.bus + ' on ' + dateStr + '.' };
    }

    return {
      valid: true,
      record: {
        id: 'bk-' + Date.now(),
        date: dateStr,
        route: schedule.route,
        bus: schedule.bus,
        time: String(schedule.departureTime || '06:00').slice(0, 5),
        seat: seatStr,
        status: 'Confirmed',
      },
    };
  }

  function ensureHelperStyles() {
    if (document.getElementById('bms-stu-sch-styles')) return;
    var style = document.createElement('style');
    style.id = 'bms-stu-sch-styles';
    style.textContent =
      '.sch-toolbar{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:18px;flex-wrap:wrap}' +
      '.sch-search{padding:10px 14px;border:1px solid #cbd5e1;border-radius:8px;font-size:13.5px;width:320px;max-width:100%;background:#fff}' +
      '.sch-count{font-size:13px;color:#64748b;font-weight:600}' +
      '.stu-modal-overlay{position:fixed;inset:0;background:rgba(15,23,42,.55);display:none;align-items:center;justify-content:center;padding:20px;z-index:2000}' +
      '.stu-modal-overlay.is-open{display:flex}' +
      '.stu-modal-card{background:#fff;border-radius:12px;border-top:4px solid #ffb703;max-width:440px;width:100%;padding:24px;box-shadow:0 20px 40px rgba(15,23,42,.22)}' +
      '.stu-modal-card h3{font-size:18px;font-weight:700;color:#003366;margin-bottom:6px}' +
      '.stu-modal-sub{font-size:13px;color:#64748b;margin-bottom:16px}' +
      '.stu-form-group{margin-bottom:14px;text-align:left}' +
      '.stu-form-group label{display:block;font-size:12.5px;font-weight:700;color:#334155;margin-bottom:6px}' +
      '.stu-form-group input,.stu-form-group select{width:100%;padding:9px 12px;border:1px solid #cbd5e1;border-radius:6px;font-size:13.5px}' +
      '.stu-form-error{background:#fef2f2;color:#b91c1c;border:1px solid #fecaca;padding:8px 12px;border-radius:6px;font-size:12.5px;font-weight:600;margin-bottom:12px}' +
      '.stu-modal-actions{display:flex;justify-content:flex-end;gap:10px;margin-top:16px}' +
      '.stu-btn{font-family:inherit;font-size:13px;font-weight:600;padding:9px 16px;border-radius:6px;cursor:pointer;border:1px solid #cbd5e1;background:#f8fafc;color:#334155}' +
      '.stu-btn-primary{background:#198754;color:#fff;border-color:#198754}' +
      '.stu-btn-danger{background:#dc3545;color:#fff;border-color:#dc3545}';
    document.head.appendChild(style);
  }

  function initStudentSchedulesPage() {
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
    var bookingsKey = studentId ? KEYS.bookings + '_' + studentId : KEYS.bookings;

    var emailEl = document.querySelector('.sidebar-footer .user-email');
    var roleEl = document.querySelector('.sidebar-footer .user-role');
    if (emailEl && email) emailEl.textContent = email;
    if (roleEl && studentId) roleEl.textContent = 'Student · ' + studentId;

    var schedules = loadJson(KEYS.schedules, []);
    if (!Array.isArray(schedules) || schedules.length === 0) {
      schedules = DEFAULT_SCHEDULES.slice();
    }

    var container = document.querySelector('.schedules-container');
    var tableCard = document.querySelector('.schedule-table-card');
    var tbody = document.querySelector('.schedule-table tbody');
    var searchQuery = '';
    var selectedSchedule = null;

    var toolbar = document.createElement('div');
    toolbar.className = 'sch-toolbar';
    toolbar.innerHTML =
      '<input type="search" class="sch-search" id="stu-sch-search" placeholder="Search route, stop, or bus (e.g. Mirpur, Kuril)..." aria-label="Search bus schedules" />' +
      '<span class="sch-count" id="stu-sch-count"></span>';
    if (container && tableCard) container.insertBefore(toolbar, tableCard);

    // Booking modal
    var bookModal = document.createElement('div');
    bookModal.className = 'stu-modal-overlay';
    bookModal.setAttribute('role', 'dialog');
    bookModal.setAttribute('aria-modal', 'true');
    bookModal.innerHTML =
      '<div class="stu-modal-card">' +
        '<h3>Reserve Bus Seat</h3>' +
        '<p class="stu-modal-sub" id="book-modal-route"></p>' +
        '<div class="stu-form-error" id="book-modal-error" hidden></div>' +
        '<div class="stu-form-group">' +
          '<label for="book-trip-date">Trip Date</label>' +
          '<input type="date" id="book-trip-date" />' +
        '</div>' +
        '<div class="stu-form-group">' +
          '<label for="book-seat-no">Select Seat</label>' +
          '<select id="book-seat-no">' +
            SEAT_OPTIONS.map(function (s) { return '<option value="' + s + '">Seat ' + s + '</option>'; }).join('') +
          '</select>' +
        '</div>' +
        '<div class="stu-modal-actions">' +
          '<button type="button" class="stu-btn" data-act="cancel">Cancel</button>' +
          '<button type="button" class="stu-btn stu-btn-primary" data-act="confirm">Confirm Booking</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(bookModal);

    var todayIso = new Date().toISOString().slice(0, 10);

    function renderRows() {
      var list = filterSchedules(schedules, searchQuery);
      var countEl = document.getElementById('stu-sch-count');
      if (countEl) countEl.textContent = list.length + ' schedule' + (list.length === 1 ? '' : 's') + ' available';
      if (!tbody) return;
      if (list.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;color:#64748b;padding:28px">No bus schedules match your search.</td></tr>';
        return;
      }
      tbody.innerHTML = list
        .map(function (s) {
          var timeShort = String(s.departureTime || '06:00').slice(0, 5);
          return (
            '<tr>' +
              '<td>' +
                '<div class="route-path">' + escapeHtml(s.route) + '</div>' +
                '<div class="route-time"><i class="fa-regular fa-clock"></i> ' + escapeHtml(s.days || 'Sunday - Thursday') + ' at ' + escapeHtml(timeShort) + '</div>' +
              '</td>' +
              '<td><span class="bus-code">' + escapeHtml(s.bus) + '</span></td>' +
              '<td class="text-right">' +
                '<a href="bookings.html" class="btn-book" data-sch-id="' + escapeHtml(s.id) + '"><i class="fa-solid fa-check"></i> Book Trip</a>' +
              '</td>' +
            '</tr>'
          );
        })
        .join('');
    }

    var searchInput = document.getElementById('stu-sch-search');
    if (searchInput) {
      searchInput.addEventListener('input', function () {
        searchQuery = searchInput.value;
        renderRows();
      });
    }

    if (tbody) {
      tbody.addEventListener('click', function (e) {
        var btn = e.target.closest('.btn-book');
        if (!btn) return;
        e.preventDefault();
        var id = btn.getAttribute('data-sch-id');
        selectedSchedule = schedules.find(function (s) { return s.id === id; });
        if (!selectedSchedule) return;
        document.getElementById('book-modal-route').textContent =
          selectedSchedule.bus + ' · ' + selectedSchedule.route + ' (' + String(selectedSchedule.departureTime).slice(0, 5) + ')';
        document.getElementById('book-trip-date').value = todayIso;
        document.getElementById('book-trip-date').min = todayIso;
        document.getElementById('book-modal-error').hidden = true;
        bookModal.classList.add('is-open');
      });
    }

    bookModal.addEventListener('click', function (e) {
      if (e.target === bookModal || e.target.getAttribute('data-act') === 'cancel') {
        bookModal.classList.remove('is-open');
        return;
      }
      if (e.target.getAttribute('data-act') === 'confirm' && selectedSchedule) {
        var existing = loadJson(bookingsKey, []);
        if (!Array.isArray(existing)) existing = [];
        var res = createBookingRecord(
          selectedSchedule,
          document.getElementById('book-trip-date').value,
          document.getElementById('book-seat-no').value,
          existing
        );
        var errEl = document.getElementById('book-modal-error');
        if (!res.valid) {
          errEl.textContent = res.error;
          errEl.hidden = false;
          return;
        }
        existing.unshift(res.record);
        saveJson(bookingsKey, existing);
        bookModal.classList.remove('is-open');
        global.location.href = 'bookings.html?booked=1';
      }
    });

    // Logout confirmation
    var logoutBtn = document.querySelector('.btn-logout');
    if (logoutBtn) {
      var logoutModal = document.createElement('div');
      logoutModal.className = 'stu-modal-overlay';
      logoutModal.innerHTML =
        '<div class="stu-modal-card"><h3>Confirm Sign Out</h3><p class="stu-modal-sub">Sign out of Student Panel (' + escapeHtml(email) + ')?</p><div class="stu-modal-actions"><button type="button" class="stu-btn" data-act="cancel">Cancel</button><button type="button" class="stu-btn stu-btn-danger" data-act="confirm">Log Out</button></div></div>';
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

    renderRows();
  }

  global.AIUB_BMS_STU_SCHEDULES = {
    KEYS: KEYS,
    DEFAULT_SCHEDULES: DEFAULT_SCHEDULES,
    filterSchedules: filterSchedules,
    createBookingRecord: createBookingRecord,
  };

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initStudentSchedulesPage);
    } else {
      initStudentSchedulesPage();
    }
  }
})(typeof window !== 'undefined' ? window : globalThis);

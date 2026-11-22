(function (global) {
  'use strict';

  var STORAGE_KEYS = {
    buses: 'aiub_bms_buses',
    drivers: 'aiub_bms_drivers',
    routes: 'aiub_bms_routes',
    pickupPoints: 'aiub_bms_pickup_points',
    schedules: 'aiub_bms_schedules',
    passes: 'aiub_bms_passes',
    accounts: 'aiub_bms_accounts',
    notifications: 'aiub_bms_notifications',
    feedback: 'aiub_bms_feedback',
    session: 'aiub_bms_session',
  };

  var DEFAULT_DATA = {
    buses: [
      { id: 'bus-1', busNumber: 'Gazipur-01', plateNumber: 'DHAKA METRO-BA 14-8921', seats: 40, reserved: 38, status: 'Active' },
      { id: 'bus-2', busNumber: 'Gazipur-02', plateNumber: 'DHAKA METRO-BA 14-8922', seats: 40, reserved: 36, status: 'Active' },
      { id: 'bus-3', busNumber: 'Jatrabari-01', plateNumber: 'DHAKA METRO-BA 14-8923', seats: 40, reserved: 39, status: 'Active' },
      { id: 'bus-4', busNumber: 'Jatrabari-02', plateNumber: 'DHAKA METRO-BA 14-8924', seats: 40, reserved: 35, status: 'Active' },
      { id: 'bus-5', busNumber: 'Mirpur-01', plateNumber: 'DHAKA METRO-BA 14-8925', seats: 40, reserved: 40, status: 'Active' },
      { id: 'bus-6', busNumber: 'Mirpur-02', plateNumber: 'DHAKA METRO-BA 14-8926', seats: 40, reserved: 34, status: 'Active' },
      { id: 'bus-7', busNumber: 'Dhanmondi-01', plateNumber: 'DHAKA METRO-BA 14-8927', seats: 40, reserved: 38, status: 'Active' },
      { id: 'bus-8', busNumber: 'Dhanmondi-02', plateNumber: 'DHAKA METRO-BA 14-8928', seats: 40, reserved: 36, status: 'Active' },
    ],
    drivers: [
      { id: 'drv-1', fullName: 'Md. Rafiqul Islam', phone: '+880 1712-458920', license: 'DL-DHK-2019-88412', assignedBus: 'Gazipur-01' },
      { id: 'drv-2', fullName: 'Abdul Karim Mia', phone: '+880 1819-339104', license: 'DL-DHK-2020-55301', assignedBus: 'Gazipur-02' },
      { id: 'drv-3', fullName: 'Md. Mizanur Rahman', phone: '+880 1911-772819', license: 'DL-DHK-2018-41209', assignedBus: 'Jatrabari-01' },
      { id: 'drv-4', fullName: 'Shahidul Alam', phone: '+880 1675-883410', license: 'DL-DHK-2021-90415', assignedBus: 'Mirpur-01' },
      { id: 'drv-5', fullName: 'Kamrul Hasan', phone: '+880 1755-609123', license: 'DL-DHK-2019-74108', assignedBus: 'Dhanmondi-01' },
      { id: 'drv-6', fullName: 'Md. Jahangir Alam', phone: '+880 1722-419802', license: 'DL-DHK-2020-66421', assignedBus: 'Dhanmondi-02' },
      { id: 'drv-7', fullName: 'Nazmul Haque', phone: '+880 1833-512094', license: 'DL-DHK-2019-33817', assignedBus: 'Mirpur-02' },
      { id: 'drv-8', fullName: 'Sohel Rana', phone: '+880 1944-620183', license: 'DL-DHK-2021-51904', assignedBus: 'Jatrabari-02' },
    ],
    routes: [
      { id: 'rt-1', name: 'Shibbari → Board Bazar → Tongi → Kuril → AIUB', startPoint: 'Gazipur', endPoint: 'AIUB', stops: ['Shibbari', 'Board Bazar', 'Tongi', 'Kuril'] },
      { id: 'rt-2', name: 'Shibbari → Bypass → Purbachal 300 Feet → AIUB', startPoint: 'Gazipur', endPoint: 'AIUB', stops: ['Shibbari', 'Bypass', 'Purbachal 300 Feet'] },
      { id: 'rt-3', name: 'Jatrabari → Sayedabad → Rampura → Badda → AIUB', startPoint: 'Jatrabari', endPoint: 'AIUB', stops: ['Jatrabari', 'Sayedabad', 'Rampura', 'Badda'] },
      { id: 'rt-4', name: 'Jatrabari → Hanif Flyover → Hatirjheel → AIUB', startPoint: 'Jatrabari', endPoint: 'AIUB', stops: ['Jatrabari', 'Hanif Flyover', 'Hatirjheel'] },
      { id: 'rt-5', name: 'Mirpur 12 → Agargaon → Mohakhali → Banani → AIUB', startPoint: 'Mirpur', endPoint: 'AIUB', stops: ['Mirpur 12', 'Agargaon', 'Mohakhali', 'Banani'] },
      { id: 'rt-6', name: 'Mirpur 1 → Cantonment → Kalshi → Kuril → AIUB', startPoint: 'Mirpur', endPoint: 'AIUB', stops: ['Mirpur 1', 'Cantonment', 'Kalshi', 'Kuril'] },
      { id: 'rt-7', name: 'Dhanmondi 15 → Shahbag → Tejgaon → AIUB', startPoint: 'Dhanmondi', endPoint: 'AIUB', stops: ['Dhanmondi 15', 'Shahbag', 'Tejgaon'] },
      { id: 'rt-8', name: 'Dhanmondi 27 → Farmgate → Kakoli → AIUB', startPoint: 'Dhanmondi', endPoint: 'AIUB', stops: ['Dhanmondi 27', 'Farmgate', 'Kakoli'] },
    ],
    pickupPoints: [
      { id: 'pp-1', name: 'Shibbari Intersection', description: 'Main Bus Stand beside BRTC Counter', route: 'Shibbari → Board Bazar → Tongi → Kuril → AIUB' },
      { id: 'pp-2', name: 'Tongi Station Road', description: 'Footbridge East Side Passenger Bay', route: 'Shibbari → Board Bazar → Tongi → Kuril → AIUB' },
      { id: 'pp-3', name: 'Jatrabari Ideal School Gate', description: 'Front of Ideal School & College Main Gate', route: 'Jatrabari → Sayedabad → Rampura → Badda → AIUB' },
      { id: 'pp-4', name: 'Mirpur 12 Metro Station', description: 'Exit Gate 02 near Pallabi Police Box', route: 'Mirpur 12 → Agargaon → Mohakhali → Banani → AIUB' },
      { id: 'pp-5', name: 'Dhanmondi 27 Rapa Plaza', description: 'Mirpur Road Northbound Pickup Stop', route: 'Dhanmondi 27 → Farmgate → Kakoli → AIUB' },
    ],
    schedules: [
      { id: 'sch-1', days: 'Sunday - Thursday', departureTime: '06:00:00', bus: 'Gazipur-01', route: 'Shibbari → Board Bazar → Tongi → Kuril → AIUB' },
      { id: 'sch-2', days: 'Sunday - Thursday', departureTime: '09:00:00', bus: 'Gazipur-02', route: 'Shibbari → Bypass → Purbachal 300 Feet → AIUB' },
      { id: 'sch-3', days: 'Sunday - Thursday', departureTime: '06:00:00', bus: 'Jatrabari-01', route: 'Jatrabari → Sayedabad → Rampura → Badda → AIUB' },
      { id: 'sch-4', days: 'Sunday - Thursday', departureTime: '09:00:00', bus: 'Jatrabari-02', route: 'Jatrabari → Hanif Flyover → Hatirjheel → AIUB' },
      { id: 'sch-5', days: 'Sunday - Thursday', departureTime: '06:00:00', bus: 'Mirpur-01', route: 'Mirpur 12 → Agargaon → Mohakhali → Banani → AIUB' },
      { id: 'sch-6', days: 'Sunday - Thursday', departureTime: '09:00:00', bus: 'Mirpur-02', route: 'Mirpur 1 → Cantonment → Kalshi → Kuril → AIUB' },
      { id: 'sch-7', days: 'Sunday - Thursday', departureTime: '06:00:00', bus: 'Dhanmondi-01', route: 'Dhanmondi 15 → Shahbag → Tejgaon → AIUB' },
      { id: 'sch-8', days: 'Sunday - Thursday', departureTime: '09:00:00', bus: 'Dhanmondi-02', route: 'Dhanmondi 27 → Farmgate → Kakoli → AIUB' },
    ],
    passes: [
      { id: 'pass-1', email: '23-54334-3@student.aiub.edu', studentName: 'Md. Tahmidur Rahman Khan', bus: 'Mirpur-01', passType: 'Monthly Pass (Two-Way)', validity: 'Nov 2026', trxId: 'bKash (BKX9948210)', price: '2,200 BDT', status: 'Pending', paymentVerified: true },
      { id: 'pass-2', email: '23-54613-3@student.aiub.edu', studentName: 'Arnob Saha', bus: 'Jatrabari-01', passType: 'Monthly Pass (Two-Way)', validity: 'Nov 2026', trxId: 'Nagad (NGD7741209)', price: '2,200 BDT', status: 'Pending', paymentVerified: true },
      { id: 'pass-3', email: '23-55092-3@student.aiub.edu', studentName: 'Md. Shahriar Kabir Seium', bus: 'Gazipur-01', passType: 'Monthly Pass (Two-Way)', validity: 'Nov 2026', trxId: 'bKash (BKX3310944)', price: '2,200 BDT', status: 'Pending', paymentVerified: false },
      { id: 'pass-4', email: '23-54310-3@student.aiub.edu', studentName: 'Aritra Mallick Joy', bus: 'Dhanmondi-02', passType: 'Monthly Pass (Morning Only)', validity: 'Nov 2026', trxId: 'SSLCommerz (SSL5510921)', price: '1,400 BDT', status: 'Approved', paymentVerified: true },
    ],
    accounts: [
      { id: 'acc-1', studentName: 'Md. Tahmidur Rahman Khan', studentId: '23-54334-3', department: 'Dept. of Computer Science', bus: 'Mirpur-01', pickup: 'Mirpur 12 Metro Station', parentName: 'Md. Habibur Rahman Khan', parentPhone: '+880 1711-234567', parentNote: 'Parent Linked', status: 'Approved' },
      { id: 'acc-2', studentName: 'Arnob Saha', studentId: '23-54613-3', department: 'Dept. of Computer Science', bus: 'Jatrabari-01', pickup: 'Jatrabari Ideal School Gate', parentName: 'Ashok Kumar Saha', parentPhone: '+880 1817-998812', parentNote: 'Parent Linked', status: 'Approved' },
      { id: 'acc-3', studentName: 'Aritra Mallick Joy', studentId: '23-54310-3', department: 'Dept. of Computer Science', bus: 'Dhanmondi-02', pickup: 'Dhanmondi 27 Rapa Plaza', parentName: 'Subrata Mallick', parentPhone: '+880 1914-552019', parentNote: 'Parent Linked', status: 'Approved' },
      { id: 'acc-4', studentName: 'Md. Shahriar Kabir Seium', studentId: '23-55092-3', department: 'Dept. of Computer Science', bus: 'Gazipur-01', pickup: 'Shibbari Intersection', parentName: 'Md. Humayun Kabir', parentPhone: '+880 1715-663201', parentNote: 'Verification Pending', status: 'Pending Approval' },
    ],
    notifications: [
      { id: 'not-1', title: 'Mirpur-01 Morning Bus Departed', message: 'Bus Mirpur-01 departed Mirpur 12 on schedule at 06:00 AM.', audience: 'Students & Linked Parents (Mirpur-01)', type: 'Departure Alert', sentTime: 'Today, 06:02 AM', deliveryStatus: 'Delivered to 40 Students & 40 Parents' },
      { id: 'not-2', title: 'Gazipur-01 Arrived at AIUB Campus', message: 'All 38 reserved students safely arrived at Kuril AIUB Gate.', audience: 'Students & Linked Parents (Gazipur-01)', type: 'Arrival Alert', sentTime: 'Today, 07:40 AM', deliveryStatus: 'Delivered to 38 Students & 38 Parents' },
      { id: 'not-3', title: 'November 2026 Monthly Pass Renewal Open', message: 'Students can renew their monthly bus pass before Nov 05, 2026.', audience: 'All Registered Students & Parents', type: 'Announcement', sentTime: 'Oct 25, 2026', deliveryStatus: 'Delivered to 312 Students & 312 Parents' },
    ],
    feedback: [
      { id: 'fb-1', userName: 'Md. Shahriar Kabir Seium', userEmail: '23-55092-3@student.aiub.edu', category: 'SOS Emergency', bus: 'Gazipur-01', location: 'Near Tongi Flyover', description: 'Bus engine overheated in heavy traffic; requesting backup bus support.', status: 'Urgent', resolutionNote: 'Backup bus Gazipur-02 dispatched to Tongi Flyover; all students transferred safely.' },
      { id: 'fb-2', userName: 'Md. Tahmidur Rahman Khan', userEmail: '23-54334-3@student.aiub.edu', category: 'Complaint', bus: 'Mirpur-01', location: 'Agargaon Pickup Point', description: 'AC cooling in the rear rows was low during the 09:00 AM trip.', status: 'In Review', resolutionNote: '' },
      { id: 'fb-3', userName: 'Arnob Saha', userEmail: '23-54613-3@student.aiub.edu', category: 'Complaint', bus: 'Jatrabari-01', location: 'Rampura Bridge Stop', description: 'Bus arrived 12 minutes late at Rampura pickup point due to roadblock.', status: 'In Review', resolutionNote: '' },
      { id: 'fb-4', userName: 'Aritra Mallick Joy', userEmail: '23-54310-3@student.aiub.edu', category: 'Feedback', bus: 'Dhanmondi-02', location: 'Dhanmondi 27 Stop', description: 'Live GPS tracking and seat reservation worked smoothly this morning.', status: 'Resolved', resolutionNote: 'Logged positive feedback with transport operations.' },
    ],
  };

  function readCollection(storage, name) {
    var key = STORAGE_KEYS[name];
    var fallback = DEFAULT_DATA[name];
    if (!storage) {
      return fallback.slice();
    }
    try {
      var raw = storage.getItem(key);
      if (!raw) {
        storage.setItem(key, JSON.stringify(fallback));
        return fallback.slice();
      }
      var parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : fallback.slice();
    } catch (_err) {
      return fallback.slice();
    }
  }

  function computeDashboardSummary(data) {
    var passes = data.passes || [];
    var buses = data.buses || [];
    var drivers = data.drivers || [];
    var routes = data.routes || [];
    var pickupPoints = data.pickupPoints || [];
    var schedules = data.schedules || [];
    var accounts = data.accounts || [];
    var notifications = data.notifications || [];
    var feedback = data.feedback || [];

    var pendingPasses = passes.filter(function (p) { return p.status === 'Pending'; }).length;
    var activeBuses = buses.filter(function (b) { return b.status === 'Active'; }).length;
    var pendingAccounts = accounts.filter(function (a) { return a.status === 'Pending Approval'; }).length;
    var urgentSos = feedback.filter(function (f) { return f.category === 'SOS Emergency' && f.status !== 'Resolved'; }).length;
    var openIssues = feedback.filter(function (f) { return f.status !== 'Resolved'; }).length;

    return {
      passes: {
        text: pendingPasses + ' Pending · ' + passes.length + ' Total',
        tone: pendingPasses > 0 ? 'warning' : 'normal',
      },
      buses: {
        text: activeBuses + ' Active · ' + buses.length + ' Registered',
        tone: 'normal',
      },
      drivers: {
        text: drivers.length + ' Assigned Drivers',
        tone: 'normal',
      },
      routes: {
        text: routes.length + ' Active Routes',
        tone: 'normal',
      },
      pickupPoints: {
        text: pickupPoints.length + ' Designated Stops',
        tone: 'normal',
      },
      schedules: {
        text: schedules.length + ' Scheduled Trips',
        tone: 'normal',
      },
      accounts: {
        text: pendingAccounts + ' Pending · ' + accounts.length + ' Accounts',
        tone: pendingAccounts > 0 ? 'warning' : 'normal',
      },
      notifications: {
        text: notifications.length + ' Broadcasts Logged',
        tone: 'normal',
      },
      feedback: {
        text: urgentSos > 0
          ? urgentSos + ' Urgent SOS · ' + openIssues + ' Open'
          : openIssues > 0
            ? openIssues + ' Open · ' + feedback.length + ' Total'
            : 'All ' + feedback.length + ' Resolved',
        tone: urgentSos > 0 ? 'alert' : openIssues > 0 ? 'warning' : 'normal',
      },
    };
  }

  function ensureHelperStyles() {
    if (document.getElementById('bms-runtime-styles')) return;
    var style = document.createElement('style');
    style.id = 'bms-runtime-styles';
    style.textContent =
      '.card-stat-line{display:inline-flex;align-items:center;justify-content:center;gap:6px;margin:-4px 0 12px;padding:4px 12px;border-radius:6px;background:#eef4fb;color:#053b6e;font-size:.76rem;font-weight:700}' +
      '.card-stat-line.is-warning{background:#fef3c7;color:#b45309}' +
      '.card-stat-line.is-alert{background:#fee2e2;color:#b91c1c}' +
      '.bms-modal-overlay{position:fixed;inset:0;background:rgba(3,31,58,.55);display:flex;align-items:center;justify-content:center;padding:20px;opacity:0;visibility:hidden;pointer-events:none;transition:opacity .2s ease;z-index:2000}' +
      '.bms-modal-overlay.is-open{opacity:1;visibility:visible;pointer-events:auto}' +
      '.bms-modal-box{width:100%;max-width:420px;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 20px 45px rgba(3,31,58,.24)}' +
      '.bms-modal-header{background:#053b6e;color:#fff;padding:16px 20px;display:flex;align-items:center;justify-content:space-between}' +
      '.bms-modal-header.is-danger{background:#dc2626}' +
      '.bms-modal-header h3{margin:0;font-size:1rem;font-weight:700;display:flex;align-items:center;gap:8px}' +
      '.bms-modal-body{padding:20px;color:#334155;font-size:.92rem;line-height:1.5}' +
      '.bms-modal-footer{padding:14px 20px;background:#f8fafc;border-top:1px solid #e2e8f0;display:flex;justify-content:flex-end;gap:10px}' +
      '.bms-btn{border:none;border-radius:8px;padding:9px 16px;font-size:.86rem;font-weight:700;cursor:pointer;font-family:inherit}' +
      '.bms-btn-cancel{background:#e2e8f0;color:#1e293b}' +
      '.bms-btn-danger{background:#e11d48;color:#fff}' +
      '.bms-btn-primary{background:#053b6e;color:#fff}' +
      '.bms-signed-out-screen{position:fixed;inset:0;background:rgba(3,31,58,.92);display:flex;align-items:center;justify-content:center;padding:24px;z-index:2500}' +
      '.bms-signed-out-card{background:#fff;border-radius:14px;padding:32px;max-width:420px;width:100%;text-align:center;box-shadow:0 24px 50px rgba(0,0,0,.3)}' +
      '.bms-signed-out-card h2{color:#053b6e;margin:12px 0 8px;font-size:1.35rem}' +
      '.bms-signed-out-card p{color:#64748b;font-size:.9rem;margin:0 0 20px}' +
      '.bms-toast-container{position:fixed;right:24px;bottom:24px;display:flex;flex-direction:column;gap:10px;z-index:3000;pointer-events:none}' +
      '.bms-toast{background:#053b6e;color:#fff;padding:12px 16px;border-radius:8px;font-size:.86rem;font-weight:600;box-shadow:0 10px 25px rgba(5,59,110,.25);display:flex;align-items:center;gap:8px;border-left:4px solid #f59e0b}';
    document.head.appendChild(style);
  }

  var CARD_ID_MAP = {
    passes: 'pass-approvals',
    buses: 'manage-buses',
    drivers: 'manage-drivers',
    routes: 'manage-routes',
    pickupPoints: 'pickup-points',
    schedules: 'manage-schedules',
    accounts: 'students-parents',
    notifications: 'notifications-reports',
    feedback: 'feedback-sos',
  };

  function getAdminSession() {
    try {
      var raw = global.localStorage && global.localStorage.getItem(STORAGE_KEYS.session);
      if (!raw || raw === 'signed_out' || raw === 'active') return null;
      var parsed = JSON.parse(raw);
      return parsed && parsed.role === 'admin' ? parsed : null;
    } catch (_err) {
      return null;
    }
  }

  function initDashboard() {
    var session = getAdminSession();
    if (!session) {
      global.location.replace('../Login page/login.html?role=admin');
      return;
    }
    var emailEl = document.querySelector('.admin-email');
    var roleEl = document.querySelector('.admin-role');
    if (emailEl && session.email) emailEl.textContent = session.email;
    if (roleEl && session.name) roleEl.textContent = session.name;

    ensureHelperStyles();
    var storage = global.localStorage;
    var data = {
      buses: readCollection(storage, 'buses'),
      drivers: readCollection(storage, 'drivers'),
      routes: readCollection(storage, 'routes'),
      pickupPoints: readCollection(storage, 'pickupPoints'),
      schedules: readCollection(storage, 'schedules'),
      passes: readCollection(storage, 'passes'),
      accounts: readCollection(storage, 'accounts'),
      notifications: readCollection(storage, 'notifications'),
      feedback: readCollection(storage, 'feedback'),
    };

    var summary = computeDashboardSummary(data);
    Object.keys(summary).forEach(function (key) {
      var badge = document.querySelector('[data-stat="' + key + '"]');
      if (!badge) {
        var card = document.getElementById(CARD_ID_MAP[key]);
        if (!card) return;
        badge = document.createElement('div');
        badge.className = 'card-stat-line';
        badge.setAttribute('data-stat', key);
        var titleEl = card.querySelector('.card-title');
        if (titleEl && titleEl.parentNode) {
          titleEl.parentNode.insertBefore(badge, titleEl.nextSibling);
        } else {
          card.appendChild(badge);
        }
      }
      badge.textContent = summary[key].text;
      badge.classList.remove('is-alert', 'is-warning');
      if (summary[key].tone === 'alert') {
        badge.classList.add('is-alert');
      } else if (summary[key].tone === 'warning') {
        badge.classList.add('is-warning');
      }
    });
  }

  function showToast(message) {
    var container = document.getElementById('bms-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'bms-toast-container';
      container.className = 'bms-toast-container';
      container.setAttribute('role', 'status');
      container.setAttribute('aria-live', 'polite');
      document.body.appendChild(container);
    }
    var toast = document.createElement('div');
    toast.className = 'bms-toast';
    toast.innerHTML = '<i class="fa-solid fa-circle-check"></i><span></span>';
    toast.querySelector('span').textContent = message;
    container.appendChild(toast);
    setTimeout(function () {
      toast.remove();
    }, 3200);
  }

  function setupSessionLogout() {
    var logoutBtn = document.querySelector('.btn-logout');
    if (!logoutBtn) return;

    var confirmOverlay = document.createElement('div');
    confirmOverlay.id = 'modal-logout-confirm';
    confirmOverlay.className = 'bms-modal-overlay';
    confirmOverlay.setAttribute('role', 'dialog');
    confirmOverlay.setAttribute('aria-labelledby', 'logout-modal-title');
    confirmOverlay.innerHTML =
      '<div class="bms-modal-box">' +
        '<div class="bms-modal-header is-danger">' +
          '<h3 id="logout-modal-title"><i class="fa-solid fa-right-from-bracket"></i> Confirm Log Out</h3>' +
        '</div>' +
        '<div class="bms-modal-body">' +
          '<p>Are you sure you want to log out of the <strong>AIUB BMS Admin Panel</strong>?</p>' +
        '</div>' +
        '<div class="bms-modal-footer">' +
          '<button type="button" class="bms-btn bms-btn-cancel" id="btn-logout-cancel">Cancel</button>' +
          '<button type="button" class="bms-btn bms-btn-danger" id="btn-logout-confirm">Log Out</button>' +
        '</div>' +
      '</div>';

    document.body.appendChild(confirmOverlay);

    logoutBtn.addEventListener('click', function () {
      confirmOverlay.classList.add('is-open');
    });

    confirmOverlay.querySelector('#btn-logout-cancel').addEventListener('click', function () {
      confirmOverlay.classList.remove('is-open');
    });

    confirmOverlay.addEventListener('click', function (e) {
      if (e.target === confirmOverlay) {
        confirmOverlay.classList.remove('is-open');
      }
    });

    confirmOverlay.querySelector('#btn-logout-confirm').addEventListener('click', function () {
      confirmOverlay.classList.remove('is-open');
      if (global.localStorage) {
        global.localStorage.setItem(STORAGE_KEYS.session, 'signed_out');
      }
      global.location.href = '../Login page/login.html?role=admin';
    });
  }

  global.AIUB_BMS_DASHBOARD = {
    STORAGE_KEYS: STORAGE_KEYS,
    DEFAULT_DATA: DEFAULT_DATA,
    readCollection: readCollection,
    computeDashboardSummary: computeDashboardSummary,
  };

  if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', function () {
      initDashboard();
      setupSessionLogout();
    });
    global.addEventListener('pageshow', initDashboard);
    global.addEventListener('storage', initDashboard);
  }
})(typeof window !== 'undefined' ? window : globalThis);

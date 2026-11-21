(function (global) {
  'use strict';

  var USERS_KEY = 'aiub_bms_users';
  var ACCOUNTS_KEY = 'aiub_bms_accounts';
  var SESSION_KEY = 'aiub_bms_session';
  var REMEMBER_KEY = 'aiub_bms_remember';

  var DEFAULT_USERS = [
    {
      id: 'usr-admin-1',
      role: 'admin',
      name: 'Tanvir Ahmed',
      staffId: 'ADM-2026-03',
      username: 'admin',
      email: 'admin.transport@aiub.edu',
      phone: '01844-115000',
      designation: 'Chief Transport Administrator',
      operationsHub: 'Kuril Permanent Campus',
      pin: '4303',
      password: 'admin1234',
      status: 'Approved',
    },
    {
      id: 'usr-stu-1',
      role: 'student',
      name: 'Md. Tahmidur Rahman Khan',
      studentId: '23-54334-3',
      email: '23-54334-3@student.aiub.edu',
      phone: '01711-543343',
      faculty: 'FST-CSE',
      password: 'student123',
      status: 'Approved',
    },
    {
      id: 'usr-stu-2',
      role: 'student',
      name: 'Arnob Saha',
      studentId: '23-54613-3',
      email: '23-54613-3@student.aiub.edu',
      phone: '01817-998812',
      faculty: 'FST-CSE',
      password: 'student123',
      status: 'Approved',
    },
    {
      id: 'usr-stu-3',
      role: 'student',
      name: 'Aritra Mallick Joy',
      studentId: '23-54310-3',
      email: '23-54310-3@student.aiub.edu',
      phone: '01914-552019',
      faculty: 'FST-CSE',
      password: 'student123',
      status: 'Approved',
    },
    {
      id: 'usr-stu-4',
      role: 'student',
      name: 'Md. Shahriar Kabir Seium',
      studentId: '23-55092-3',
      email: '23-55092-3@student.aiub.edu',
      phone: '01715-663201',
      faculty: 'FST-CSE',
      password: 'student123',
      status: 'Pending Approval',
    },
    {
      id: 'usr-par-1',
      role: 'parent',
      name: 'Md. Habibur Rahman Khan',
      relationship: 'Father',
      phone: '01711-234567',
      email: 'habibur.guardian@example.com',
      linkedStudentId: '23-54334-3',
      linkedStudentName: 'Md. Tahmidur Rahman Khan',
      password: 'parent123',
      status: 'Approved',
    },
    {
      id: 'usr-par-2',
      role: 'parent',
      name: 'Ashok Kumar Saha',
      relationship: 'Father',
      phone: '01817-998812',
      email: 'ashok.saha@example.com',
      linkedStudentId: '23-54613-3',
      linkedStudentName: 'Arnob Saha',
      password: 'parent123',
      status: 'Approved',
    },
    {
      id: 'usr-par-3',
      role: 'parent',
      name: 'Subrata Mallick',
      relationship: 'Father',
      phone: '01914-552019',
      email: 'subrata.mallick@example.com',
      linkedStudentId: '23-54310-3',
      linkedStudentName: 'Aritra Mallick Joy',
      password: 'parent123',
      status: 'Approved',
    },
    {
      id: 'usr-par-4',
      role: 'parent',
      name: 'Md. Humayun Kabir',
      relationship: 'Father',
      phone: '01715-663201',
      email: 'humayun.kabir@example.com',
      linkedStudentId: '23-55092-3',
      linkedStudentName: 'Md. Shahriar Kabir Seium',
      password: 'parent123',
      status: 'Approved',
    },
  ];

  var DEFAULT_SEED = {
    aiub_bms_accounts: [
      { id: 'acc-1', studentName: 'Md. Tahmidur Rahman Khan', studentId: '23-54334-3', department: 'Dept. of Computer Science', bus: 'Mirpur-01', pickup: 'Mirpur 12 Metro Station', parentName: 'Md. Habibur Rahman Khan', parentPhone: '+880 1711-234567', parentNote: 'Parent Linked', status: 'Approved' },
      { id: 'acc-2', studentName: 'Arnob Saha', studentId: '23-54613-3', department: 'Dept. of Computer Science', bus: 'Jatrabari-01', pickup: 'Jatrabari Ideal School Gate', parentName: 'Ashok Kumar Saha', parentPhone: '+880 1817-998812', parentNote: 'Parent Linked', status: 'Approved' },
      { id: 'acc-3', studentName: 'Aritra Mallick Joy', studentId: '23-54310-3', department: 'Dept. of Computer Science', bus: 'Dhanmondi-02', pickup: 'Dhanmondi 27 Rapa Plaza', parentName: 'Subrata Mallick', parentPhone: '+880 1914-552019', parentNote: 'Parent Linked', status: 'Approved' },
      { id: 'acc-4', studentName: 'Md. Shahriar Kabir Seium', studentId: '23-55092-3', department: 'Dept. of Computer Science', bus: 'Gazipur-01', pickup: 'Shibbari Intersection', parentName: 'Md. Humayun Kabir', parentPhone: '+880 1715-663201', parentNote: 'Verification Pending', status: 'Pending Approval' },
    ],
    aiub_bms_buses: [
      { id: 'bus-1', busNumber: 'Gazipur-01', plateNumber: 'DHAKA METRO-BA 14-8921', seats: 40, reserved: 38, status: 'Active' },
      { id: 'bus-2', busNumber: 'Gazipur-02', plateNumber: 'DHAKA METRO-BA 14-8922', seats: 40, reserved: 36, status: 'Active' },
      { id: 'bus-3', busNumber: 'Jatrabari-01', plateNumber: 'DHAKA METRO-BA 14-8923', seats: 40, reserved: 39, status: 'Active' },
      { id: 'bus-4', busNumber: 'Jatrabari-02', plateNumber: 'DHAKA METRO-BA 14-8924', seats: 40, reserved: 35, status: 'Active' },
      { id: 'bus-5', busNumber: 'Mirpur-01', plateNumber: 'DHAKA METRO-BA 14-8925', seats: 40, reserved: 40, status: 'Active' },
      { id: 'bus-6', busNumber: 'Mirpur-02', plateNumber: 'DHAKA METRO-BA 14-8926', seats: 40, reserved: 34, status: 'Active' },
      { id: 'bus-7', busNumber: 'Dhanmondi-01', plateNumber: 'DHAKA METRO-BA 14-8927', seats: 40, reserved: 38, status: 'Active' },
      { id: 'bus-8', busNumber: 'Dhanmondi-02', plateNumber: 'DHAKA METRO-BA 14-8928', seats: 40, reserved: 36, status: 'Active' },
    ],
    aiub_bms_drivers: [
      { id: 'drv-1', fullName: 'Md. Rafiqul Islam', phone: '+880 1712-458920', license: 'DL-DHK-2019-88412', assignedBus: 'Gazipur-01' },
      { id: 'drv-2', fullName: 'Abdul Karim Mia', phone: '+880 1819-339104', license: 'DL-DHK-2020-55301', assignedBus: 'Gazipur-02' },
      { id: 'drv-3', fullName: 'Md. Mizanur Rahman', phone: '+880 1911-772819', license: 'DL-DHK-2018-41209', assignedBus: 'Jatrabari-01' },
      { id: 'drv-4', fullName: 'Shahidul Alam', phone: '+880 1675-883410', license: 'DL-DHK-2021-90415', assignedBus: 'Mirpur-01' },
      { id: 'drv-5', fullName: 'Kamrul Hasan', phone: '+880 1755-609123', license: 'DL-DHK-2019-74108', assignedBus: 'Dhanmondi-01' },
      { id: 'drv-6', fullName: 'Md. Jahangir Alam', phone: '+880 1722-419802', license: 'DL-DHK-2020-66421', assignedBus: 'Dhanmondi-02' },
      { id: 'drv-7', fullName: 'Nazmul Haque', phone: '+880 1833-512094', license: 'DL-DHK-2019-33817', assignedBus: 'Mirpur-02' },
      { id: 'drv-8', fullName: 'Sohel Rana', phone: '+880 1944-620183', license: 'DL-DHK-2021-51904', assignedBus: 'Jatrabari-02' },
    ],
    aiub_bms_routes: [
      { id: 'rt-1', name: 'Shibbari → Board Bazar → Tongi → Kuril → AIUB', startPoint: 'Gazipur', endPoint: 'AIUB', stops: ['Shibbari', 'Board Bazar', 'Tongi', 'Kuril'] },
      { id: 'rt-2', name: 'Shibbari → Bypass → Purbachal 300 Feet → AIUB', startPoint: 'Gazipur', endPoint: 'AIUB', stops: ['Shibbari', 'Bypass', 'Purbachal 300 Feet'] },
      { id: 'rt-3', name: 'Jatrabari → Sayedabad → Rampura → Badda → AIUB', startPoint: 'Jatrabari', endPoint: 'AIUB', stops: ['Jatrabari', 'Sayedabad', 'Rampura', 'Badda'] },
      { id: 'rt-4', name: 'Jatrabari → Hanif Flyover → Hatirjheel → AIUB', startPoint: 'Jatrabari', endPoint: 'AIUB', stops: ['Jatrabari', 'Hanif Flyover', 'Hatirjheel'] },
      { id: 'rt-5', name: 'Mirpur 12 → Agargaon → Mohakhali → Banani → AIUB', startPoint: 'Mirpur', endPoint: 'AIUB', stops: ['Mirpur 12', 'Agargaon', 'Mohakhali', 'Banani'] },
      { id: 'rt-6', name: 'Mirpur 1 → Cantonment → Kalshi → Kuril → AIUB', startPoint: 'Mirpur', endPoint: 'AIUB', stops: ['Mirpur 1', 'Cantonment', 'Kalshi', 'Kuril'] },
      { id: 'rt-7', name: 'Dhanmondi 15 → Shahbag → Tejgaon → AIUB', startPoint: 'Dhanmondi', endPoint: 'AIUB', stops: ['Dhanmondi 15', 'Shahbag', 'Tejgaon'] },
      { id: 'rt-8', name: 'Dhanmondi 27 → Farmgate → Kakoli → AIUB', startPoint: 'Dhanmondi', endPoint: 'AIUB', stops: ['Dhanmondi 27', 'Farmgate', 'Kakoli'] },
    ],
    aiub_bms_pickup_points: [
      { id: 'pp-1', name: 'Shibbari Intersection', description: 'Main Bus Stand beside BRTC Counter', route: 'Shibbari → Board Bazar → Tongi → Kuril → AIUB' },
      { id: 'pp-2', name: 'Tongi Station Road', description: 'Footbridge East Side Passenger Bay', route: 'Shibbari → Board Bazar → Tongi → Kuril → AIUB' },
      { id: 'pp-3', name: 'Jatrabari Ideal School Gate', description: 'Front of Ideal School & College Main Gate', route: 'Jatrabari → Sayedabad → Rampura → Badda → AIUB' },
      { id: 'pp-4', name: 'Mirpur 12 Metro Station', description: 'Exit Gate 02 near Pallabi Police Box', route: 'Mirpur 12 → Agargaon → Mohakhali → Banani → AIUB' },
      { id: 'pp-5', name: 'Dhanmondi 27 Rapa Plaza', description: 'Mirpur Road Northbound Pickup Stop', route: 'Dhanmondi 27 → Farmgate → Kakoli → AIUB' },
    ],
    aiub_bms_schedules: [
      { id: 'sch-1', days: 'Sunday - Thursday', departureTime: '06:00:00', bus: 'Gazipur-01', route: 'Shibbari → Board Bazar → Tongi → Kuril → AIUB' },
      { id: 'sch-2', days: 'Sunday - Thursday', departureTime: '09:00:00', bus: 'Gazipur-02', route: 'Shibbari → Bypass → Purbachal 300 Feet → AIUB' },
      { id: 'sch-3', days: 'Sunday - Thursday', departureTime: '06:00:00', bus: 'Jatrabari-01', route: 'Jatrabari → Sayedabad → Rampura → Badda → AIUB' },
      { id: 'sch-4', days: 'Sunday - Thursday', departureTime: '09:00:00', bus: 'Jatrabari-02', route: 'Jatrabari → Hanif Flyover → Hatirjheel → AIUB' },
      { id: 'sch-5', days: 'Sunday - Thursday', departureTime: '06:00:00', bus: 'Mirpur-01', route: 'Mirpur 12 → Agargaon → Mohakhali → Banani → AIUB' },
      { id: 'sch-6', days: 'Sunday - Thursday', departureTime: '09:00:00', bus: 'Mirpur-02', route: 'Mirpur 1 → Cantonment → Kalshi → Kuril → AIUB' },
      { id: 'sch-7', days: 'Sunday - Thursday', departureTime: '06:00:00', bus: 'Dhanmondi-01', route: 'Dhanmondi 15 → Shahbag → Tejgaon → AIUB' },
      { id: 'sch-8', days: 'Sunday - Thursday', departureTime: '09:00:00', bus: 'Dhanmondi-02', route: 'Dhanmondi 27 → Farmgate → Kakoli → AIUB' },
    ],
    aiub_bms_passes: [
      { id: 'pass-1', email: '23-54334-3@student.aiub.edu', studentName: 'Md. Tahmidur Rahman Khan', bus: 'Mirpur-01', passType: 'Monthly Pass (Two-Way)', validFrom: '01 Nov 2026', validity: '30 Nov 2026', trxId: 'bKash (BKX9948210)', price: '2,200 BDT', status: 'Pending', paymentVerified: true },
      { id: 'pass-2', email: '23-54613-3@student.aiub.edu', studentName: 'Arnob Saha', bus: 'Jatrabari-01', passType: 'Monthly Pass (Two-Way)', validFrom: '01 Nov 2026', validity: '30 Nov 2026', trxId: 'Nagad (NGD7741209)', price: '2,200 BDT', status: 'Pending', paymentVerified: true },
      { id: 'pass-3', email: '23-55092-3@student.aiub.edu', studentName: 'Md. Shahriar Kabir Seium', bus: 'Gazipur-01', passType: 'Monthly Pass (Two-Way)', validFrom: '01 Nov 2026', validity: '30 Nov 2026', trxId: 'bKash (BKX3310944)', price: '2,200 BDT', status: 'Pending', paymentVerified: false },
      { id: 'pass-4', email: '23-54310-3@student.aiub.edu', studentName: 'Aritra Mallick Joy', bus: 'Dhanmondi-02', passType: 'Monthly Pass (Morning Only)', validFrom: '01 Nov 2026', validity: '30 Nov 2026', trxId: 'SSLCommerz (SSL5510921)', price: '1,400 BDT', status: 'Approved', paymentVerified: true },
    ],
    aiub_bms_notifications: [
      { id: 'not-1', title: 'Mirpur-01 Morning Bus Departed', message: 'Bus Mirpur-01 departed Mirpur 12 on schedule at 06:00 AM.', audience: 'Students & Linked Parents (Mirpur-01)', type: 'Departure Alert', sentTime: 'Today, 06:02 AM', deliveryStatus: 'Delivered to 40 Students & 40 Parents' },
      { id: 'not-2', title: 'Gazipur-01 Arrived at AIUB Campus', message: 'All 38 reserved students safely arrived at Kuril AIUB Gate.', audience: 'Students & Linked Parents (Gazipur-01)', type: 'Arrival Alert', sentTime: 'Today, 07:40 AM', deliveryStatus: 'Delivered to 38 Students & 38 Parents' },
      { id: 'not-3', title: 'November 2026 Monthly Pass Renewal Open', message: 'Students can renew their monthly bus pass before Nov 05, 2026.', audience: 'All Registered Students & Parents', type: 'Announcement', sentTime: 'Oct 25, 2026', deliveryStatus: 'Delivered to 312 Students & 312 Parents' },
    ],
    aiub_bms_feedback: [
      { id: 'fb-1', userName: 'Md. Shahriar Kabir Seium', userEmail: '23-55092-3@student.aiub.edu', category: 'SOS Emergency', bus: 'Gazipur-01', location: 'Near Tongi Flyover', description: 'Bus engine overheated in heavy traffic; requesting backup bus support.', status: 'Urgent', resolutionNote: 'Backup bus Gazipur-02 dispatched to Tongi Flyover; all students transferred safely.' },
      { id: 'fb-2', userName: 'Md. Tahmidur Rahman Khan', userEmail: '23-54334-3@student.aiub.edu', category: 'Complaint', bus: 'Mirpur-01', location: 'Agargaon Pickup Point', description: 'AC cooling in the rear rows was low during the 09:00 AM trip.', status: 'In Review', resolutionNote: '' },
      { id: 'fb-3', userName: 'Arnob Saha', userEmail: '23-54613-3@student.aiub.edu', category: 'Complaint', bus: 'Jatrabari-01', location: 'Rampura Bridge Stop', description: 'Bus arrived 12 minutes late at Rampura pickup point due to roadblock.', status: 'In Review', resolutionNote: '' },
      { id: 'fb-4', userName: 'Aritra Mallick Joy', userEmail: '23-54310-3@student.aiub.edu', category: 'Feedback', bus: 'Dhanmondi-02', location: 'Dhanmondi 27 Stop', description: 'Live GPS tracking and seat reservation worked smoothly this morning.', status: 'Resolved', resolutionNote: 'Logged positive feedback with transport operations.' },
    ],
  };

  function seedAllDefaults() {
    try {
      var users = loadJson(USERS_KEY, DEFAULT_USERS);
      if (Array.isArray(users)) {
        var changed = false;
        DEFAULT_USERS.forEach(function (du) {
          if (!users.some(function (u) { return u.id === du.id; })) {
            users.push(du);
            changed = true;
          }
        });
        if (changed) global.localStorage.setItem(USERS_KEY, JSON.stringify(users));
      }
      Object.keys(DEFAULT_SEED).forEach(function (k) {
        if (!global.localStorage.getItem(k)) {
          global.localStorage.setItem(k, JSON.stringify(DEFAULT_SEED[k]));
        }
      });
    } catch (_err) {
      // Ignore storage errors
    }
  }

var ROLE_CONFIG = {
    student: {
      label: 'AIUB Student ID or Institutional Email',
      placeholder: '23-54334-3 or 23-54334-3@student.aiub.edu',
      hint: 'Format: XX-XXXXX-X (Account must be approved by Administrator)',
      notice:
        '<strong>Student Access:</strong> Primary campus commuter portal. Purchase monthly bus passes, reserve seats, select pickup points, track buses live, and access SOS alerts.',
      submitText: 'Sign In as Student',
      portalUrl: '../Student Dashboard/index.html',
      roleTitle: 'Student',
    },
    parent: {
      label: 'Registered Guardian Phone or Email',
      placeholder: '01711-234567 or habibur.guardian@example.com',
      hint: 'Linked to an approved AIUB Student ID for journey monitoring',
      notice:
        '<strong>Parent / Guardian Access:</strong> View your linked student’s assigned bus, driver profile, pickup schedule, and live travel status.',
      submitText: 'Sign In as Parent / Guardian',
      portalUrl: '../Parent Dashboard/index.html',
      roleTitle: 'Parent / Guardian',
    },
    admin: {
      label: 'Administrator Username or Staff Email',
      placeholder: 'admin.transport@aiub.edu',
      hint: 'Restricted to AIUB Office of Transport & Operations',
      notice:
        '<strong>Administrator Access:</strong> Approve student registrations, manage buses, drivers, routes, schedules, verify pass payments, and handle complaints.',
      submitText: 'Sign In as Administrator',
      portalUrl: '../Admin Dashboard/index.html',
      roleTitle: 'Administrator',
    },
  };

  var currentRole = 'student';

  function normalizePhone(phone) {
    var digits = String(phone || '').replace(/\D/g, '');
    if (digits.indexOf('880') === 0 && digits.length === 13) {
      return '0' + digits.slice(3);
    }
    return digits;
  }

  function isValidStudentId(value) {
    return /^\d{2}-\d{5}-\d$/.test(String(value || '').trim());
  }

  function loadJson(key, fallback) {
    try {
      var raw = global.localStorage.getItem(key);
      if (!raw) {
        if (fallback !== undefined) {
          global.localStorage.setItem(key, JSON.stringify(fallback));
        }
        return Array.isArray(fallback) ? fallback.slice() : fallback;
      }
      var parsed = JSON.parse(raw);
      return parsed != null ? parsed : (Array.isArray(fallback) ? fallback.slice() : fallback);
    } catch (_err) {
      return Array.isArray(fallback) ? fallback.slice() : fallback;
    }
  }

  function validateLoginInput(input) {
    var role = ROLE_CONFIG[input.role] ? input.role : 'student';
    var identifier = String(input.identifier || '').trim();
    var password = String(input.password || '');
    var linkedStudentId = String(input.linkedStudentId || '').trim();
    var adminPin = String(input.adminPin || '').trim();

    if (!identifier) {
      return {
        valid: false,
        field: 'login-identifier',
        error: 'Please enter your ' + ROLE_CONFIG[role].label.toLowerCase() + '.',
      };
    }

    if (role === 'student') {
      var isId = isValidStudentId(identifier);
      var isStudentEmail = /^[^\s@]+@student\.aiub\.edu$/i.test(identifier);
      if (!isId && !isStudentEmail) {
        return {
          valid: false,
          field: 'login-identifier',
          error: 'Enter a valid AIUB Student ID (XX-XXXXX-X) or @student.aiub.edu email.',
        };
      }
    }

    if (role === 'parent') {
      var isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
      var normPhone = normalizePhone(identifier);
      var isPhone = /^01[3-9]\d{8}$/.test(normPhone);
      if (!isEmail && !isPhone) {
        return {
          valid: false,
          field: 'login-identifier',
          error: 'Enter a valid guardian mobile number (e.g. 01711-234567) or email address.',
        };
      }
      if (!linkedStudentId) {
        return {
          valid: false,
          field: 'linked-student-id',
          error: 'Please enter your linked student’s AIUB ID (XX-XXXXX-X).',
        };
      }
      if (!isValidStudentId(linkedStudentId)) {
        return {
          valid: false,
          field: 'linked-student-id',
          error: 'Linked Student ID must follow AIUB format XX-XXXXX-X (e.g. 23-54334-3).',
        };
      }
    }

    if (role === 'admin') {
      if (!adminPin) {
        return {
          valid: false,
          field: 'admin-pin',
          error: 'Please enter your 4-digit Transport Control Security PIN.',
        };
      }
      if (!/^\d{4}$/.test(adminPin)) {
        return {
          valid: false,
          field: 'admin-pin',
          error: 'Security PIN must be exactly 4 digits.',
        };
      }
    }

    if (!password || password.length < 6) {
      return {
        valid: false,
        field: 'login-password',
        error: 'Please enter your password (minimum 6 characters).',
      };
    }

    return {
      valid: true,
      value: {
        role: role,
        identifier: identifier,
        password: password,
        linkedStudentId: linkedStudentId,
        adminPin: adminPin,
      },
    };
  }

  function authenticateUser(credentials, users, accounts) {
    var role = credentials.role;
    var idLower = credentials.identifier.toLowerCase();
    var idPhone = normalizePhone(credentials.identifier);
    var pool = (users || []).filter(function (u) { return u.role === role; });

    var matched = pool.find(function (u) {
      if (role === 'student') {
        return (
          String(u.studentId || '').toLowerCase() === idLower ||
          String(u.email || '').toLowerCase() === idLower
        );
      }
      if (role === 'parent') {
        var phoneMatch = idPhone && normalizePhone(u.phone) === idPhone;
        var emailMatch = String(u.email || '').toLowerCase() === idLower;
        return phoneMatch || emailMatch;
      }
      return (
        String(u.email || '').toLowerCase() === idLower ||
        String(u.staffId || '').toLowerCase() === idLower ||
        String(u.username || '').toLowerCase() === idLower
      );
    });

    if (!matched) {
      return {
        ok: false,
        tone: 'error',
        field: 'login-identifier',
        error: 'No ' + ROLE_CONFIG[role].roleTitle + ' account found for "' + credentials.identifier + '".',
      };
    }

    if (role === 'parent' && matched.linkedStudentId && matched.linkedStudentId !== credentials.linkedStudentId) {
      return {
        ok: false,
        tone: 'error',
        field: 'linked-student-id',
        error: 'The Linked Student ID does not match this guardian account.',
      };
    }

    if (role === 'admin' && String(matched.pin || '') !== credentials.adminPin) {
      return {
        ok: false,
        tone: 'error',
        field: 'admin-pin',
        error: 'Invalid 4-digit Transport Control Security PIN.',
      };
    }

    if (matched.password !== credentials.password) {
      return {
        ok: false,
        tone: 'error',
        field: 'login-password',
        error: 'Incorrect password. Please try again or use "Forgot password?".',
      };
    }

    var effectiveStatus = matched.status || 'Approved';
    if (role === 'student' && Array.isArray(accounts)) {
      var synced = accounts.find(function (acc) { return acc.studentId === matched.studentId; });
      if (synced && synced.status) {
        effectiveStatus = synced.status;
      }
    }

    if (effectiveStatus === 'Pending Approval') {
      return {
        ok: false,
        tone: 'warning',
        error:
          'Account for ' +
          matched.name +
          ' (' +
          (matched.studentId || matched.email) +
          ') is currently pending Administrator approval.',
      };
    }

    if (effectiveStatus === 'Deactivated') {
      return {
        ok: false,
        tone: 'error',
        error:
          'This transport account has been deactivated. Contact the AIUB Office of Transport (+880 1844-115000).',
      };
    }

    return {
      ok: true,
      user: matched,
      redirectUrl: ROLE_CONFIG[role].portalUrl,
    };
  }

  function ensureHelperStyles() {
    if (document.getElementById('bms-login-runtime-styles')) return;
    var style = document.createElement('style');
    style.id = 'bms-login-runtime-styles';
    style.textContent =
      '.feedback-warning{background-color:#fffbeb;color:#b45309;border:1px solid #fde68a}' +
      '.form-input.input-invalid{border-color:#dc2626!important;box-shadow:0 0 0 3px rgba(220,38,38,.12)!important}' +
      '.feedback-banner a{color:inherit;font-weight:700;text-decoration:underline}';
    document.head.appendChild(style);
  }

  function clearInvalidFields() {
    document.querySelectorAll('.form-input.input-invalid').forEach(function (el) {
      el.classList.remove('input-invalid');
      el.removeAttribute('aria-invalid');
    });
  }

  function markFieldInvalid(fieldId) {
    if (!fieldId) return;
    var el = document.getElementById(fieldId);
    if (el) {
      el.classList.add('input-invalid');
      el.setAttribute('aria-invalid', 'true');
      el.focus();
    }
  }

  function showFeedback(tone, message, htmlContent) {
    var feedback = document.getElementById('form-feedback');
    if (!feedback) return;
    feedback.classList.remove('hidden');
    var cls =
      tone === 'success'
        ? 'feedback-success'
        : tone === 'warning'
        ? 'feedback-warning'
        : 'feedback-error';
    feedback.className = 'feedback-banner ' + cls;
    if (htmlContent) {
      feedback.innerHTML = htmlContent;
    } else {
      feedback.textContent = message;
    }
  }

  function hideFeedback() {
    var feedback = document.getElementById('form-feedback');
    if (feedback) feedback.classList.add('hidden');
  }

  function selectRole(role) {
    if (!ROLE_CONFIG[role]) role = 'student';
    currentRole = role;
    clearInvalidFields();
    hideFeedback();

    var roles = ['student', 'parent', 'admin'];
    roles.forEach(function (r) {
      var btn = document.getElementById('role-' + r);
      if (btn) {
        var active = r === role;
        btn.classList.toggle('active', active);
        btn.setAttribute('aria-pressed', active ? 'true' : 'false');
      }
    });

    var cfg = ROLE_CONFIG[role];
    var label = document.getElementById('label-identifier');
    var input = document.getElementById('login-identifier');
    var hint = document.getElementById('hint-identifier');
    var notice = document.getElementById('role-notice-text');
    var submitBtn = document.getElementById('btn-submit-login');
    var linkedGroup = document.getElementById('group-linked-student');
    var adminPinGroup = document.getElementById('group-admin-pin');
    var linkedInput = document.getElementById('linked-student-id');
    var adminPinInput = document.getElementById('admin-pin');
    var registerLink = document.getElementById('link-need-account');

    if (linkedGroup) linkedGroup.classList.toggle('hidden', role !== 'parent');
    if (adminPinGroup) adminPinGroup.classList.toggle('hidden', role !== 'admin');
    if (linkedInput) linkedInput.required = role === 'parent';
    if (adminPinInput) adminPinInput.required = role === 'admin';

    if (label) label.textContent = cfg.label;
    if (input) input.placeholder = cfg.placeholder;
    if (hint) hint.textContent = cfg.hint;
    if (notice) notice.innerHTML = cfg.notice;
    if (submitBtn) submitBtn.textContent = cfg.submitText;
    if (registerLink) registerLink.setAttribute('href', 'register.html?role=' + role);
  }

  function togglePasswordVisibility() {
    var pwInput = document.getElementById('login-password');
    var btn = document.getElementById('btn-toggle-pw');
    if (!pwInput || !btn) return;
    if (pwInput.type === 'password') {
      pwInput.type = 'text';
      btn.textContent = 'Hide';
      btn.setAttribute('aria-label', 'Hide password');
    } else {
      pwInput.type = 'password';
      btn.textContent = 'Show';
      btn.setAttribute('aria-label', 'Show password');
    }
  }

  function toggleResetNote() {
    clearInvalidFields();
    var idInput = document.getElementById('login-identifier');
    var idVal = idInput ? idInput.value.trim() : '';
    if (!idVal) {
      markFieldInvalid('login-identifier');
      showFeedback(
        'warning',
        'Enter your ' + ROLE_CONFIG[currentRole].label.toLowerCase() + ' first, then click "Forgot password?" to request recovery.'
      );
      return;
    }

    var users = loadJson(USERS_KEY, DEFAULT_USERS);
    var idLower = idVal.toLowerCase();
    var idPhone = normalizePhone(idVal);
    var found = users.find(function (u) {
      return (
        u.role === currentRole &&
        (String(u.email || '').toLowerCase() === idLower ||
          String(u.studentId || '').toLowerCase() === idLower ||
          String(u.staffId || '').toLowerCase() === idLower ||
          String(u.username || '').toLowerCase() === idLower ||
          (idPhone && normalizePhone(u.phone) === idPhone))
      );
    });

    if (!found) {
      showFeedback(
        'warning',
        'If an account exists for "' + idVal + '", password recovery instructions will be sent to the registered institutional contact.'
      );
      return;
    }

    showFeedback(
      'success',
      'Password recovery instructions have been sent to the registered contact for ' + found.name + ' (' + (found.email || found.phone) + ').'
    );
  }

  function saveSession(user, remember) {
    var payload = {
      id: user.id,
      role: user.role,
      name: user.name,
      identifier: user.studentId || user.staffId || user.email || user.phone,
      studentId: user.studentId || null,
      email: user.email || '',
      phone: user.phone || '',
      linkedStudentId: user.linkedStudentId || null,
      remember: Boolean(remember),
      loggedInAt: new Date().toISOString(),
    };
    try {
      global.localStorage.setItem(SESSION_KEY, JSON.stringify(payload));
      if (remember) {
        global.localStorage.setItem(
          REMEMBER_KEY,
          JSON.stringify({
            role: user.role,
            identifier: payload.identifier,
            linkedStudentId: user.linkedStudentId || '',
          })
        );
      } else {
        global.localStorage.removeItem(REMEMBER_KEY);
      }
    } catch (_err) {
      // Ignore storage quota errors
    }
  }

  function handleLoginSubmit(e) {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    clearInvalidFields();

    var idEl = document.getElementById('login-identifier');
    var pwEl = document.getElementById('login-password');
    var linkedEl = document.getElementById('linked-student-id');
    var pinEl = document.getElementById('admin-pin');
    var rememberEl = document.querySelector('input[name="remember"]');

    var validation = validateLoginInput({
      role: currentRole,
      identifier: idEl ? idEl.value : '',
      password: pwEl ? pwEl.value : '',
      linkedStudentId: linkedEl ? linkedEl.value : '',
      adminPin: pinEl ? pinEl.value : '',
    });

    if (!validation.valid) {
      markFieldInvalid(validation.field);
      showFeedback('error', validation.error);
      return false;
    }

    seedAllDefaults();
    var users = loadJson(USERS_KEY, DEFAULT_USERS);
    var accounts = loadJson(ACCOUNTS_KEY, DEFAULT_SEED.aiub_bms_accounts);
    var auth = authenticateUser(validation.value, users, accounts);

    if (!auth.ok) {
      markFieldInvalid(auth.field);
      showFeedback(auth.tone || 'error', auth.error);
      return false;
    }

    saveSession(auth.user, rememberEl ? rememberEl.checked : false);

    showFeedback(
      'success',
      'Welcome back, ' +
        auth.user.name +
        ' (' +
        ROLE_CONFIG[auth.user.role].roleTitle +
        '). Redirecting to ' +
        ROLE_CONFIG[auth.user.role].roleTitle +
        ' Portal...'
    );
    global.setTimeout(function () {
      global.location.href = auth.redirectUrl;
    }, 350);

    return true;
  }

  function initLoginPage() {
    ensureHelperStyles();
    seedAllDefaults();

    // Strip inline onsubmit/onclick duplication cleanly while still exposing globals
    var form = document.querySelector('form.auth-form');
    if (form) {
      form.setAttribute('novalidate', 'novalidate');
      form.removeAttribute('onsubmit');
      form.addEventListener('submit', handleLoginSubmit);
    }

    ['student', 'parent', 'admin'].forEach(function (role) {
      var btn = document.getElementById('role-' + role);
      if (btn) {
        btn.removeAttribute('onclick');
        btn.addEventListener('click', function () {
          selectRole(role);
        });
      }
    });

    var toggleBtn = document.getElementById('btn-toggle-pw');
    if (toggleBtn) {
      toggleBtn.removeAttribute('onclick');
      toggleBtn.addEventListener('click', togglePasswordVisibility);
    }

    var forgotBtn = document.querySelector('button.forgot-link');
    if (forgotBtn) {
      forgotBtn.removeAttribute('onclick');
      forgotBtn.addEventListener('click', toggleResetNote);
    }

    var pinInput = document.getElementById('admin-pin');
    if (pinInput) {
      pinInput.addEventListener('input', function () {
        pinInput.value = pinInput.value.replace(/\D/g, '').slice(0, 4);
      });
    }

    document.querySelectorAll('.form-input').forEach(function (input) {
      input.addEventListener('input', function () {
        input.classList.remove('input-invalid');
        input.removeAttribute('aria-invalid');
      });
    });

    // Check URL params (?role=...&registered=1&id=...)
    var params = null;
    try {
      params = new URLSearchParams(global.location.search || '');
    } catch (_err) {
      params = null;
    }

    var initialRole = 'student';
    var remembered = loadJson(REMEMBER_KEY, null);
    if (params && ROLE_CONFIG[params.get('role')]) {
      initialRole = params.get('role');
    } else if (remembered && ROLE_CONFIG[remembered.role]) {
      initialRole = remembered.role;
    }

    selectRole(initialRole);

    if (remembered && remembered.role === initialRole) {
      var idField = document.getElementById('login-identifier');
      var linkedField = document.getElementById('linked-student-id');
      if (idField && remembered.identifier) idField.value = remembered.identifier;
      if (linkedField && remembered.linkedStudentId) linkedField.value = remembered.linkedStudentId;
    }

    if (params && params.get('registered') === '1') {
      var regId = params.get('id') || '';
      var idField2 = document.getElementById('login-identifier');
      if (idField2 && regId) idField2.value = regId;
      if (initialRole === 'student') {
        showFeedback(
          'warning',
          'Registration submitted for ' + (regId || 'your account') + '. Once approved by an Administrator, you can sign in here.'
        );
      } else {
        showFeedback(
          'success',
          'Registration complete for ' + (regId || 'your account') + '. Enter your password to sign in.'
        );
      }
    } else {
      try {
        if (global.localStorage.getItem(SESSION_KEY) === 'signed_out') {
          global.localStorage.removeItem(SESSION_KEY);
          showFeedback('success', 'You have been signed out safely.');
        }
      } catch (_err) {
        // Ignore
      }
    }
  }

  // Expose global handlers for HTML compatibility and unit tests
  global.selectRole = selectRole;
  global.togglePasswordVisibility = togglePasswordVisibility;
  global.toggleResetNote = toggleResetNote;
  global.handleLoginSubmit = handleLoginSubmit;

  global.AIUB_BMS_LOGIN = {
    USERS_KEY: USERS_KEY,
    ACCOUNTS_KEY: ACCOUNTS_KEY,
    SESSION_KEY: SESSION_KEY,
    DEFAULT_USERS: DEFAULT_USERS,
    ROLE_CONFIG: ROLE_CONFIG,
    normalizePhone: normalizePhone,
    isValidStudentId: isValidStudentId,
    validateLoginInput: validateLoginInput,
    authenticateUser: authenticateUser,
  };

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initLoginPage);
    } else {
      initLoginPage();
    }
  }
})(typeof window !== 'undefined' ? window : globalThis);
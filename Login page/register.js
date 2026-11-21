(function (global) {
  'use strict';

  var USERS_KEY = 'aiub_bms_users';
  var ACCOUNTS_KEY = 'aiub_bms_accounts';
  var ADMIN_AUTH_CODE = 'AIUB-TRN-2026';

  var FACULTY_LABELS = {
    'FST-CSE': 'Dept. of Computer Science',
    'FE-EEE': 'Dept. of Electrical & Electronic Engineering',
    'FBA-BBA': 'Faculty of Business Administration',
    FASS: 'Faculty of Arts & Social Sciences',
  };

  var ROUTE_MAPPING = {
    'R-01': { bus: 'Gazipur-01', pickup: 'Uttara House Building' },
    'R-02': { bus: 'Mirpur-01', pickup: 'Mirpur-10 Roundabout' },
    'R-03': { bus: 'Dhanmondi-02', pickup: 'Dhanmondi 27 / Asad Gate' },
    'R-04': { bus: 'Mirpur-02', pickup: 'Banani Chairman Bari' },
    'R-05': { bus: 'Gazipur-02', pickup: 'Bashundhara Gate' },
    'R-06': { bus: 'Jatrabari-01', pickup: 'Badda / Rampura TV Center' },
    'R-07': { bus: 'Jatrabari-02', pickup: 'Motijheel / Khilgaon Flyover' },
  };

  var ROLE_NOTICES = {
    student:
      '<strong>Student Registration:</strong> Register with your AIUB university credentials. Your account will become active after Administrator approval so you can buy monthly bus passes, reserve seats, and track buses live.',
    parent:
      '<strong>Parent / Guardian Registration:</strong> Link your account to your child’s AIUB Student ID to monitor their assigned bus, driver information, pickup schedule, and live bus location.',
    admin:
      '<strong>Administrator Registration:</strong> Authorized AIUB Office of Transport staff registration for managing student approvals, buses, drivers, routes, schedules, and reports.',
  };

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

  var DEFAULT_ACCOUNTS = [
    { id: 'acc-1', studentName: 'Md. Tahmidur Rahman Khan', studentId: '23-54334-3', department: 'Dept. of Computer Science', bus: 'Mirpur-01', pickup: 'Mirpur 12 Metro Station', parentName: 'Md. Habibur Rahman Khan', parentPhone: '+880 1711-234567', parentNote: 'Parent Linked', status: 'Approved' },
    { id: 'acc-2', studentName: 'Arnob Saha', studentId: '23-54613-3', department: 'Dept. of Computer Science', bus: 'Jatrabari-01', pickup: 'Jatrabari Ideal School Gate', parentName: 'Ashok Kumar Saha', parentPhone: '+880 1817-998812', parentNote: 'Parent Linked', status: 'Approved' },
    { id: 'acc-3', studentName: 'Aritra Mallick Joy', studentId: '23-54310-3', department: 'Dept. of Computer Science', bus: 'Dhanmondi-02', pickup: 'Dhanmondi 27 Rapa Plaza', parentName: 'Subrata Mallick', parentPhone: '+880 1914-552019', parentNote: 'Parent Linked', status: 'Approved' },
    { id: 'acc-4', studentName: 'Md. Shahriar Kabir Seium', studentId: '23-55092-3', department: 'Dept. of Computer Science', bus: 'Gazipur-01', pickup: 'Shibbari Intersection', parentName: 'Md. Humayun Kabir', parentPhone: '+880 1715-663201', parentNote: 'Verification Pending', status: 'Pending Approval' },
  ];

  var activeRole = 'student';

  function normalizePhone(phone) {
    var digits = String(phone || '').replace(/\D/g, '');
    if (digits.indexOf('880') === 0 && digits.length === 13) {
      return '0' + digits.slice(3);
    }
    return digits;
  }

  function isValidBdPhone(phone) {
    return /^01[3-9]\d{8}$/.test(normalizePhone(phone));
  }

  function isValidStudentId(id) {
    return /^\d{2}-\d{5}-\d$/.test(String(id || '').trim());
  }

  function loadJson(key, fallback) {
    try {
      var raw = global.localStorage.getItem(key);
      if (!raw) {
        global.localStorage.setItem(key, JSON.stringify(fallback));
        return fallback.slice();
      }
      var parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : fallback.slice();
    } catch (_err) {
      return fallback.slice();
    }
  }

  function saveJson(key, value) {
    try {
      global.localStorage.setItem(key, JSON.stringify(value));
    } catch (_err) {
      // Ignore quota errors
    }
  }

  function validateStudentRegistration(input, existingUsers, existingAccounts) {
    var studentId = String(input.studentId || '').trim();
    var fullName = String(input.fullName || '').trim();
    var email = String(input.email || '').trim().toLowerCase();
    var studentPhone = String(input.studentPhone || '').trim();
    var faculty = String(input.faculty || 'FST-CSE').trim();
    var bloodGroup = String(input.bloodGroup || 'O+').trim();
    var pickupCode = String(input.pickupPoint || 'R-01').trim();
    var shift = String(input.shift || '07:15 AM').trim();
    var guardianName = String(input.guardianName || '').trim();
    var guardianPhone = String(input.guardianPhone || '').trim();
    var password = String(input.password || '');
    var confirmPassword = String(input.confirmPassword || '');

    if (!isValidStudentId(studentId)) {
      return { valid: false, field: 'stu-id', error: 'AIUB Student ID must follow format XX-XXXXX-X (e.g. 23-54334-3).' };
    }
    if (fullName.length < 3) {
      return { valid: false, field: 'stu-name', error: 'Full Official Name must be at least 3 characters.' };
    }
    if (!/^[^\s@]+@student\.aiub\.edu$/i.test(email)) {
      return { valid: false, field: 'stu-email', error: 'Please enter a valid AIUB student email (@student.aiub.edu).' };
    }
    if (!isValidBdPhone(studentPhone)) {
      return { valid: false, field: 'stu-phone', error: 'Enter a valid Bangladesh mobile number (e.g. 01711-543343).' };
    }
    if (guardianName.length < 3) {
      return { valid: false, field: 'stu-guardian-name', error: 'Parent / Guardian Full Name must be at least 3 characters.' };
    }
    if (!isValidBdPhone(guardianPhone)) {
      return { valid: false, field: 'stu-guardian-phone', error: 'Enter a valid Guardian mobile number (e.g. 01711-234567).' };
    }
    if (password.length < 6) {
      return { valid: false, field: 'stu-password', error: 'Password must be at least 6 characters long.' };
    }
    if (password !== confirmPassword) {
      return { valid: false, field: 'stu-confirm', error: 'Confirm Password does not match Create Password.' };
    }
    if (input.termsAccepted === false) {
      return { valid: false, error: 'You must confirm your AIUB university information and agree to bus pass regulations.' };
    }

    var dupUser = (existingUsers || []).some(function (u) {
      return (
        u.role === 'student' &&
        (u.studentId === studentId || String(u.email || '').toLowerCase() === email)
      );
    });
    var dupAcc = (existingAccounts || []).some(function (a) {
      return a.studentId === studentId;
    });
    if (dupUser || dupAcc) {
      return {
        valid: false,
        field: 'stu-id',
        error: 'A student account with ID "' + studentId + '" or email "' + email + '" is already registered.',
      };
    }

    return {
      valid: true,
      value: {
        studentId: studentId,
        fullName: fullName,
        email: email,
        studentPhone: studentPhone,
        faculty: faculty,
        bloodGroup: bloodGroup,
        pickupCode: pickupCode,
        shift: shift,
        guardianName: guardianName,
        guardianPhone: guardianPhone,
        password: password,
      },
    };
  }

  function validateParentRegistration(input, existingUsers) {
    var guardianFullName = String(input.guardianFullName || '').trim();
    var relationship = String(input.relationship || 'Father').trim();
    var guardianMobile = String(input.guardianMobile || '').trim();
    var guardianEmail = String(input.guardianEmail || '').trim().toLowerCase();
    var linkedStudentId = String(input.linkedStudentId || '').trim();
    var linkedStudentName = String(input.linkedStudentName || '').trim();
    var residentialAddress = String(input.residentialAddress || '').trim();
    var password = String(input.password || '');
    var confirmPassword = String(input.confirmPassword || '');

    if (guardianFullName.length < 3) {
      return { valid: false, field: 'par-name', error: 'Parent / Guardian Full Name must be at least 3 characters.' };
    }
    if (!isValidBdPhone(guardianMobile)) {
      return { valid: false, field: 'par-phone', error: 'Enter a valid Guardian mobile number (e.g. 01711-543343).' };
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guardianEmail)) {
      return { valid: false, field: 'par-email', error: 'Please enter a valid Guardian email address.' };
    }
    if (!isValidStudentId(linkedStudentId)) {
      return { valid: false, field: 'par-student-id', error: 'Linked Student AIUB ID must follow format XX-XXXXX-X.' };
    }
    if (linkedStudentName.length < 3) {
      return { valid: false, field: 'par-student-name', error: 'Linked Student’s Full Name must be at least 3 characters.' };
    }
    if (residentialAddress.length < 5) {
      return { valid: false, field: 'par-address', error: 'Please enter a valid Residential / Pickup Area Address.' };
    }
    if (password.length < 6) {
      return { valid: false, field: 'par-password', error: 'Password must be at least 6 characters long.' };
    }
    if (password !== confirmPassword) {
      return { valid: false, field: 'par-confirm', error: 'Confirm Password does not match Create Password.' };
    }

    var normPhone = normalizePhone(guardianMobile);
    var dupParent = (existingUsers || []).some(function (u) {
      return (
        u.role === 'parent' &&
        (normalizePhone(u.phone) === normPhone || String(u.email || '').toLowerCase() === guardianEmail)
      );
    });
    if (dupParent) {
      return {
        valid: false,
        field: 'par-phone',
        error: 'A Parent / Guardian account with this phone number or email already exists.',
      };
    }

    return {
      valid: true,
      value: {
        guardianFullName: guardianFullName,
        relationship: relationship,
        guardianMobile: guardianMobile,
        guardianEmail: guardianEmail,
        linkedStudentId: linkedStudentId,
        linkedStudentName: linkedStudentName,
        residentialAddress: residentialAddress,
        password: password,
      },
    };
  }

  function validateAdminRegistration(input, existingUsers) {
    var adminName = String(input.adminName || '').trim();
    var staffId = String(input.staffId || '').trim().toUpperCase();
    var staffEmail = String(input.staffEmail || '').trim().toLowerCase();
    var staffPhone = String(input.staffPhone || '').trim();
    var designation = String(input.designation || 'Chief Transport Administrator').trim();
    var operationsHub = String(input.operationsHub || 'Kuril Permanent Campus').trim();
    var securityPin = String(input.securityPin || '').trim();
    var authCode = String(input.authCode || '').trim().toUpperCase();
    var password = String(input.password || '');
    var confirmPassword = String(input.confirmPassword || '');

    if (adminName.length < 3) {
      return { valid: false, field: 'adm-name', error: 'Administrator Full Name must be at least 3 characters.' };
    }
    if (!/^[A-Z]{2,6}-\d{4}-\d{2,4}$/.test(staffId)) {
      return { valid: false, field: 'adm-staff-id', error: 'AIUB Staff ID must follow format ADM-2026-03.' };
    }
    if (!/^[^\s@]+@aiub\.edu$/i.test(staffEmail)) {
      return { valid: false, field: 'adm-email', error: 'Official AIUB Staff Email must end with @aiub.edu.' };
    }
    if (!isValidBdPhone(staffPhone)) {
      return { valid: false, field: 'adm-phone', error: 'Enter a valid official Bangladesh mobile number.' };
    }
    if (!/^\d{4}$/.test(securityPin)) {
      return { valid: false, field: 'adm-pin', error: 'Transport Control PIN must be exactly 4 numeric digits.' };
    }
    if (authCode !== ADMIN_AUTH_CODE) {
      return {
        valid: false,
        field: 'adm-auth-code',
        error: 'Invalid Department Authorization Code. Expected format: ' + ADMIN_AUTH_CODE + '.',
      };
    }
    if (password.length < 8) {
      return { valid: false, field: 'adm-password', error: 'Administrator password must be at least 8 characters long.' };
    }
    if (password !== confirmPassword) {
      return { valid: false, field: 'adm-confirm', error: 'Confirm Admin Password does not match Create Admin Password.' };
    }

    var dupAdmin = (existingUsers || []).some(function (u) {
      return (
        u.role === 'admin' &&
        (String(u.staffId || '').toUpperCase() === staffId ||
          String(u.email || '').toLowerCase() === staffEmail)
      );
    });
    if (dupAdmin) {
      return {
        valid: false,
        field: 'adm-staff-id',
        error: 'An Administrator account with Staff ID "' + staffId + '" or email "' + staffEmail + '" already exists.',
      };
    }

    return {
      valid: true,
      value: {
        adminName: adminName,
        staffId: staffId,
        staffEmail: staffEmail,
        staffPhone: staffPhone,
        designation: designation,
        operationsHub: operationsHub,
        securityPin: securityPin,
        authCode: authCode,
        password: password,
      },
    };
  }

  function ensureHelperStyles() {
    if (document.getElementById('bms-register-runtime-styles')) return;
    var style = document.createElement('style');
    style.id = 'bms-register-runtime-styles';
    style.textContent =
      '.feedback-error{background-color:#fef2f2;color:#b91c1c;border:1px solid #fecaca}' +
      '.feedback-warning{background-color:#fffbeb;color:#b45309;border:1px solid #fde68a}' +
      '.form-input.input-invalid,.form-select.input-invalid{border-color:#dc2626!important;box-shadow:0 0 0 3px rgba(220,38,38,.12)!important}' +
      '.feedback-banner a{color:inherit;font-weight:700;text-decoration:underline}';
    document.head.appendChild(style);
  }

  function clearInvalidFields() {
    document.querySelectorAll('.input-invalid').forEach(function (el) {
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
    var feedback = document.getElementById('reg-feedback');
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
    if (typeof feedback.scrollIntoView === 'function') {
      feedback.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  function hideFeedback() {
    var feedback = document.getElementById('reg-feedback');
    if (feedback) feedback.classList.add('hidden');
  }

  function switchRegRole(role) {
    if (!ROLE_NOTICES[role]) role = 'student';
    activeRole = role;
    clearInvalidFields();
    hideFeedback();

    ['student', 'parent', 'admin'].forEach(function (r) {
      var tab = document.getElementById('tab-' + r);
      var form = document.getElementById('form-' + r);
      var isSelected = r === role;
      if (tab) {
        tab.classList.toggle('active', isSelected);
        tab.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
      }
      if (form) {
        form.classList.toggle('hidden', !isSelected);
      }
    });

    var notice = document.getElementById('reg-role-notice');
    if (notice) notice.innerHTML = ROLE_NOTICES[role];
  }

  function handleRegSubmit(e, roleLabel) {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    clearInvalidFields();

    var roleKey =
      roleLabel === 'Administrator'
        ? 'admin'
        : roleLabel === 'Parent / Guardian'
        ? 'parent'
        : 'student';

    var users = loadJson(USERS_KEY, DEFAULT_USERS);
    var accounts = loadJson(ACCOUNTS_KEY, DEFAULT_ACCOUNTS);

    if (roleKey === 'student') {
      var termsBox = document.querySelector('#form-student input[type="checkbox"]');
      var stuRes = validateStudentRegistration(
        {
          studentId: document.getElementById('stu-id').value,
          fullName: document.getElementById('stu-name').value,
          email: document.getElementById('stu-email').value,
          studentPhone: document.getElementById('stu-phone').value,
          faculty: document.getElementById('stu-faculty').value,
          bloodGroup: document.getElementById('stu-blood').value,
          pickupPoint: document.getElementById('stu-pickup').value,
          shift: document.getElementById('stu-shift').value,
          guardianName: document.getElementById('stu-guardian-name').value,
          guardianPhone: document.getElementById('stu-guardian-phone').value,
          password: document.getElementById('stu-password').value,
          confirmPassword: document.getElementById('stu-confirm').value,
          termsAccepted: termsBox ? termsBox.checked : true,
        },
        users,
        accounts
      );

      if (!stuRes.valid) {
        markFieldInvalid(stuRes.field);
        showFeedback('error', stuRes.error);
        return false;
      }

      var v = stuRes.value;
      var routeMeta = ROUTE_MAPPING[v.pickupCode] || { bus: 'Mirpur-01', pickup: 'Main Campus Gate' };

      users.unshift({
        id: 'usr-stu-' + Date.now(),
        role: 'student',
        name: v.fullName,
        studentId: v.studentId,
        email: v.email,
        phone: v.studentPhone,
        faculty: v.faculty,
        bloodGroup: v.bloodGroup,
        shift: v.shift,
        guardianName: v.guardianName,
        guardianPhone: v.guardianPhone,
        password: v.password,
        status: 'Pending Approval',
        createdAt: new Date().toISOString(),
      });
      saveJson(USERS_KEY, users);

      accounts.unshift({
        id: 'acc-' + Date.now(),
        studentName: v.fullName,
        studentId: v.studentId,
        department: FACULTY_LABELS[v.faculty] || v.faculty,
        bus: routeMeta.bus,
        pickup: routeMeta.pickup,
        parentName: v.guardianName,
        parentPhone: v.guardianPhone,
        parentNote: 'Verification Pending',
        status: 'Pending Approval',
      });
      saveJson(ACCOUNTS_KEY, accounts);

      document.getElementById('form-student').reset();
      showFeedback(
        'success',
        '',
        'Student registration submitted for <strong>' +
          v.fullName +
          '</strong> (' +
          v.studentId +
          '). Your account is now awaiting Administrator approval. <a href="login.html?role=student&registered=1&id=' +
          encodeURIComponent(v.studentId) +
          '">Proceed to Sign In →</a>'
      );
      return true;
    }

    if (roleKey === 'parent') {
      var notifBoxes = document.querySelectorAll('#form-parent .checkbox-stack input[type="checkbox"]');
      var parRes = validateParentRegistration(
        {
          guardianFullName: document.getElementById('par-name').value,
          relationship: document.getElementById('par-relation').value,
          guardianMobile: document.getElementById('par-phone').value,
          guardianEmail: document.getElementById('par-email').value,
          linkedStudentId: document.getElementById('par-student-id').value,
          linkedStudentName: document.getElementById('par-student-name').value,
          residentialAddress: document.getElementById('par-address').value,
          password: document.getElementById('par-password').value,
          confirmPassword: document.getElementById('par-confirm').value,
        },
        users
      );

      if (!parRes.valid) {
        markFieldInvalid(parRes.field);
        showFeedback('error', parRes.error);
        return false;
      }

      var pv = parRes.value;
      users.unshift({
        id: 'usr-par-' + Date.now(),
        role: 'parent',
        name: pv.guardianFullName,
        relationship: pv.relationship,
        phone: pv.guardianMobile,
        email: pv.guardianEmail,
        linkedStudentId: pv.linkedStudentId,
        linkedStudentName: pv.linkedStudentName,
        address: pv.residentialAddress,
        notifyTrips: notifBoxes[0] ? notifBoxes[0].checked : true,
        notifyNotices: notifBoxes[1] ? notifBoxes[1].checked : true,
        password: pv.password,
        status: 'Approved',
        createdAt: new Date().toISOString(),
      });
      saveJson(USERS_KEY, users);

      // Update linked student account record if present in Admin Directory
      var updated = false;
      accounts = accounts.map(function (acc) {
        if (acc.studentId === pv.linkedStudentId) {
          updated = true;
          return Object.assign({}, acc, {
            parentName: pv.guardianFullName,
            parentPhone: pv.guardianMobile,
            parentNote: 'Parent Linked',
          });
        }
        return acc;
      });
      if (updated) saveJson(ACCOUNTS_KEY, accounts);

      document.getElementById('form-parent').reset();
      showFeedback(
        'success',
        '',
        'Parent / Guardian account registered for <strong>' +
          pv.guardianFullName +
          '</strong> and linked to Student ID <strong>' +
          pv.linkedStudentId +
          '</strong>. <a href="login.html?role=parent&registered=1&id=' +
          encodeURIComponent(pv.guardianMobile) +
          '">Sign In now →</a>'
      );
      return true;
    }

    var admRes = validateAdminRegistration(
      {
        adminName: document.getElementById('adm-name').value,
        staffId: document.getElementById('adm-staff-id').value,
        staffEmail: document.getElementById('adm-email').value,
        staffPhone: document.getElementById('adm-phone').value,
        designation: document.getElementById('adm-designation').value,
        operationsHub: document.getElementById('adm-hub').value,
        securityPin: document.getElementById('adm-pin').value,
        authCode: document.getElementById('adm-auth-code').value,
        password: document.getElementById('adm-password').value,
        confirmPassword: document.getElementById('adm-confirm').value,
      },
      users
    );

    if (!admRes.valid) {
      markFieldInvalid(admRes.field);
      showFeedback('error', admRes.error);
      return false;
    }

    var av = admRes.value;
    users.unshift({
      id: 'usr-adm-' + Date.now(),
      role: 'admin',
      name: av.adminName,
      staffId: av.staffId,
      email: av.staffEmail,
      phone: av.staffPhone,
      designation: av.designation,
      operationsHub: av.operationsHub,
      pin: av.securityPin,
      password: av.password,
      status: 'Approved',
      createdAt: new Date().toISOString(),
    });
    saveJson(USERS_KEY, users);

    document.getElementById('form-admin').reset();
    showFeedback(
      'success',
      '',
      'Administrator account registered for <strong>' +
        av.adminName +
        '</strong> (' +
        av.staffId +
        '). <a href="login.html?role=admin&registered=1&id=' +
        encodeURIComponent(av.staffEmail) +
        '">Sign In to Admin Dashboard →</a>'
    );
    return true;
  }

  function initRegisterPage() {
    ensureHelperStyles();
    loadJson(USERS_KEY, DEFAULT_USERS);
    loadJson(ACCOUNTS_KEY, DEFAULT_ACCOUNTS);

    var roleMap = [
      { key: 'student', label: 'Student' },
      { key: 'parent', label: 'Parent / Guardian' },
      { key: 'admin', label: 'Administrator' },
    ];

    roleMap.forEach(function (item) {
      var tab = document.getElementById('tab-' + item.key);
      if (tab) {
        tab.removeAttribute('onclick');
        tab.addEventListener('click', function () {
          switchRegRole(item.key);
        });
      }
      var form = document.getElementById('form-' + item.key);
      if (form) {
        form.setAttribute('novalidate', 'novalidate');
        form.removeAttribute('onsubmit');
        form.addEventListener('submit', function (e) {
          handleRegSubmit(e, item.label);
        });
      }
    });

    // Auto-suggest @student.aiub.edu email from AIUB Student ID
    var stuIdInput = document.getElementById('stu-id');
    var stuEmailInput = document.getElementById('stu-email');
    var lastAutoEmail = '';
    if (stuIdInput && stuEmailInput) {
      stuIdInput.addEventListener('input', function () {
        var val = stuIdInput.value.trim();
        if (isValidStudentId(val) && (!stuEmailInput.value.trim() || stuEmailInput.value.trim() === lastAutoEmail)) {
          lastAutoEmail = val + '@student.aiub.edu';
          stuEmailInput.value = lastAutoEmail;
        }
      });
    }

    // Keep Admin 4-digit PIN strictly numeric
    var admPinInput = document.getElementById('adm-pin');
    if (admPinInput) {
      admPinInput.addEventListener('input', function () {
        admPinInput.value = admPinInput.value.replace(/\D/g, '').slice(0, 4);
      });
    }

    document.querySelectorAll('.form-input, .form-select').forEach(function (el) {
      el.addEventListener('input', function () {
        el.classList.remove('input-invalid');
        el.removeAttribute('aria-invalid');
      });
      el.addEventListener('change', function () {
        el.classList.remove('input-invalid');
        el.removeAttribute('aria-invalid');
      });
    });

    // Pre-select role from URL query (?role=student|parent|admin)
    var initialRole = 'student';
    try {
      var params = new URLSearchParams(global.location.search || '');
      if (ROLE_NOTICES[params.get('role')]) {
        initialRole = params.get('role');
      }
    } catch (_err) {
      // Ignore
    }
    switchRegRole(initialRole);
  }

  // Expose global handlers for HTML compatibility and unit tests
  global.switchRegRole = switchRegRole;
  global.handleRegSubmit = handleRegSubmit;

  global.AIUB_BMS_REGISTER = {
    USERS_KEY: USERS_KEY,
    ACCOUNTS_KEY: ACCOUNTS_KEY,
    ADMIN_AUTH_CODE: ADMIN_AUTH_CODE,
    DEFAULT_USERS: DEFAULT_USERS,
    normalizePhone: normalizePhone,
    isValidBdPhone: isValidBdPhone,
    isValidStudentId: isValidStudentId,
    validateStudentRegistration: validateStudentRegistration,
    validateParentRegistration: validateParentRegistration,
    validateAdminRegistration: validateAdminRegistration,
  };

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initRegisterPage);
    } else {
      initRegisterPage();
    }
  }
})(typeof window !== 'undefined' ? window : globalThis);

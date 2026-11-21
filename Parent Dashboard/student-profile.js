(function (global) {
  'use strict';

  var SESSION_KEY = 'aiub_bms_session';
  var ACCOUNTS_KEY = 'aiub_bms_accounts';
  var PASSES_KEY = 'aiub_bms_passes';
  var PARENT_STATE_KEY = 'aiub_bms_parent_state';

  var FALLBACK_PROFILE = {
    studentName: 'Md. Tahmidur Rahman Khan',
    studentId: '23-54334-3',
    department: 'CSE (FST)',
    passStatus: 'Active',
    travelStatus: 'Onboard · In Transit',
    travelTone: 'text-amber',
    seat: 'B-04 (Window)',
    pickupPoint: 'Dhanmondi 27 Gate',
    validUntil: '30 Nov 2026',
    emergencyPhone: '+880 1711-482910',
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

  function resolveStudentProfile(session, accounts, passes, parentState) {
    var profile = Object.assign({}, FALLBACK_PROFILE);
    var targetId =
      session && typeof session === 'object' && session.linkedStudentId
        ? session.linkedStudentId
        : profile.studentId;

    if (Array.isArray(accounts) && accounts.length > 0) {
      var acc = accounts.find(function (a) { return a.studentId === targetId; }) || accounts[0];
      if (acc) {
        profile.studentName = acc.studentName || profile.studentName;
        profile.studentId = acc.studentId || profile.studentId;
        profile.department = acc.department || profile.department;
        profile.pickupPoint = acc.pickup || profile.pickupPoint;
        if (acc.parentPhone) profile.emergencyPhone = acc.parentPhone;
        profile.passStatus = acc.status === 'Approved' ? 'Active' : acc.status || 'Active';
      }
    }

    if (Array.isArray(passes)) {
      var pass = passes.find(function (p) { return String(p.email || '').indexOf(profile.studentId) === 0; });
      if (pass) {
        profile.validUntil = pass.validity || profile.validUntil;
        profile.passStatus = pass.status === 'Approved' ? 'Active' : pass.status;
      }
    }

    var stage = parentState && Number.isFinite(Number(parentState.stageIndex)) ? Number(parentState.stageIndex) : 1;
    if (stage === 0) {
      profile.travelStatus = 'Boarded · Departing Pickup';
      profile.travelTone = 'text-amber';
    } else if (stage === 2) {
      profile.travelStatus = 'Arrived · AIUB Campus';
      profile.travelTone = 'text-green';
    } else {
      profile.travelStatus = 'Onboard · In Transit';
      profile.travelTone = 'text-amber';
    }

    return profile;
  }

  function initStudentProfileCard() {
    var card = document.querySelector('.student-profile-card');
    if (!card) return;

    var profile = resolveStudentProfile(
      loadJson(SESSION_KEY, null),
      loadJson(ACCOUNTS_KEY, []),
      loadJson(PASSES_KEY, []),
      loadJson(PARENT_STATE_KEY, null)
    );

    var nameEl = card.querySelector('.student-name');
    var idEl = card.querySelector('.student-id-text');
    var passEl = card.querySelector('.pass-status-active');
    var dds = card.querySelectorAll('.student-meta-list .meta-row dd');
    var footerSpans = card.querySelectorAll('.student-card-footer > span');

    if (nameEl) nameEl.textContent = profile.studentName;
    if (idEl) idEl.innerHTML = 'ID: <span class="mono">' + profile.studentId + '</span> &middot; ' + profile.department;
    if (passEl) {
      passEl.innerHTML = profile.passStatus === 'Active' ? 'Active &#10003;' : profile.passStatus;
      passEl.style.color = profile.passStatus === 'Active' ? '#198754' : '#d97706';
    }
    if (dds[0]) {
      dds[0].textContent = profile.travelStatus;
      dds[0].className = profile.travelTone;
    }
    if (dds[1]) dds[1].textContent = profile.seat;
    if (dds[2]) dds[2].textContent = profile.pickupPoint;
    if (footerSpans[0]) footerSpans[0].innerHTML = 'Pass Valid Until: <strong class="mono">' + profile.validUntil + '</strong>';
    if (footerSpans[1]) footerSpans[1].textContent = profile.emergencyPhone;
  }

  global.AIUB_BMS_STUDENT_PROFILE = {
    resolveStudentProfile: resolveStudentProfile,
  };

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initStudentProfileCard);
    } else {
      initStudentProfileCard();
    }
  }
})(typeof window !== 'undefined' ? window : globalThis);

(function (global) {
  'use strict';

  var SESSION_KEY = 'aiub_bms_session';
  var ACCOUNTS_KEY = 'aiub_bms_accounts';
  var PASSES_KEY = 'aiub_bms_passes';
  var PARENT_STATE_KEY = 'aiub_bms_parent_state';

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

  function resolveTravelStatus(session, accounts, passes, parentState) {
    var stuId = session && session.linkedStudentId ? session.linkedStudentId : '23-54334-3';
    var passVerified = true;

    if (Array.isArray(accounts) && accounts.length > 0) {
      var acc = accounts.find(function (a) { return a.studentId === stuId; }) || accounts[0];
      if (acc) {
        stuId = acc.studentId || stuId;
        passVerified = acc.status === 'Approved';
      }
    }

    if (Array.isArray(passes)) {
      var pass = passes.find(function (p) { return String(p.email || '').indexOf(stuId) === 0; });
      if (pass) passVerified = pass.status === 'Approved' || Boolean(pass.paymentVerified);
    }

    var stage = parentState && Number.isFinite(Number(parentState.stageIndex)) ? Number(parentState.stageIndex) : 1;
    var statusLabel = 'In Transit to AIUB Campus';
    var statusTone = 'text-amber';
    var subLabel = 'Boarded at 07:56 AM · Seat B-04';

    if (stage === 0) {
      statusLabel = 'Departed Pickup Point';
      statusTone = 'text-amber';
      subLabel = 'Boarded at 07:56 AM · Seat B-04';
    } else if (stage === 2) {
      statusLabel = 'Safely Arrived at AIUB Campus';
      statusTone = 'text-green';
      subLabel = 'Arrived at 08:50 AM · Seat B-04';
    }

    return {
      passBadge: passVerified ? 'Pass Verified' : 'Pending Verification',
      passTone: passVerified ? 'text-green' : 'text-amber',
      statusLabel: statusLabel,
      statusTone: statusTone,
      subLabel: subLabel,
      passId: 'AIUB-PASS-2026-' + String(stuId).replace(/\D/g, '').slice(-4),
    };
  }

  function initTravelStatusCard() {
    var card = document.querySelector('.travel-status-card') || document.getElementById('travel-status');
    if (!card) return;

    var status = resolveTravelStatus(
      loadJson(SESSION_KEY, null),
      loadJson(ACCOUNTS_KEY, []),
      loadJson(PASSES_KEY, []),
      loadJson(PARENT_STATE_KEY, null)
    );

    var badgeEl = card.querySelector('.feature-meta');
    var mainEl = card.querySelector('.highlight-main');
    var subEl = card.querySelector('.highlight-sub');
    var dds = card.querySelectorAll('.compact-list .compact-row dd');

    if (badgeEl) {
      badgeEl.textContent = status.passBadge;
      badgeEl.className = 'feature-meta ' + status.passTone;
    }
    if (mainEl) {
      mainEl.textContent = status.statusLabel;
      mainEl.className = 'highlight-main ' + status.statusTone;
    }
    if (subEl) subEl.textContent = status.subLabel;
    if (dds[0]) dds[0].textContent = status.passId;
  }

  global.AIUB_BMS_TRAVEL_STATUS = {
    resolveTravelStatus: resolveTravelStatus,
  };

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initTravelStatusCard);
    } else {
      initTravelStatusCard();
    }
  }
})(typeof window !== 'undefined' ? window : globalThis);

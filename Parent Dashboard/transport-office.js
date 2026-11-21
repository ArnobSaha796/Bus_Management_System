(function (global) {
  'use strict';

  var SESSION_KEY = 'aiub_bms_session';
  var ACCOUNTS_KEY = 'aiub_bms_accounts';
  var DRIVERS_KEY = 'aiub_bms_drivers';
  var BUSES_KEY = 'aiub_bms_buses';

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

  function isControlRoomOpen(dateObj) {
    var d = dateObj || new Date();
    var h = d.getHours();
    return h >= 7 && h < 21;
  }

  function resolveDriverSupport(session, accounts, drivers, buses) {
    var info = {
      busName: 'Gazipur-01',
      driverName: 'Md. Rafiqul Islam',
      driverPhone: '+880 1712-903411',
      helperPhone: '+880 1819-554210',
      busPlate: 'DHAKA METRO-BA 14-8921',
    };

    var stuId = session && session.linkedStudentId ? session.linkedStudentId : '23-54334-3';
    if (Array.isArray(accounts) && accounts.length > 0) {
      var acc = accounts.find(function (a) { return a.studentId === stuId; }) || accounts[0];
      if (acc && acc.bus) info.busName = acc.bus;
    }

    if (Array.isArray(drivers)) {
      var drv = drivers.find(function (d) { return d.assignedBus === info.busName; });
      if (drv) {
        info.driverName = drv.fullName || info.driverName;
        info.driverPhone = drv.phone || info.driverPhone;
      }
    }

    if (Array.isArray(buses)) {
      var bus = buses.find(function (b) { return b.busNumber === info.busName; });
      if (bus && bus.plateNumber && bus.plateNumber !== 'N/A') {
        info.busPlate = bus.plateNumber;
      }
    }

    return info;
  }

  function ensureStyles() {
    if (document.getElementById('bms-transport-office-styles')) return;
    var style = document.createElement('style');
    style.id = 'bms-transport-office-styles';
    style.textContent =
      '.contact-modal-overlay.is-open{display:flex!important}' +
      '.btn-copy-inline{font-family:inherit;font-size:.72rem;font-weight:700;color:#003366;background:#f1f5f9;border:1px solid #cbd5e1;border-radius:5px;padding:2px 7px;margin-left:8px;cursor:pointer}' +
      '.bms-office-toast{position:fixed;right:20px;bottom:20px;background:#003366;color:#fff;border-left:4px solid #fbbf24;padding:10px 15px;border-radius:8px;font-size:.82rem;font-weight:600;z-index:2000;opacity:0;transition:opacity .2s;pointer-events:none}' +
      '.bms-office-toast.show{opacity:1}';
    document.head.appendChild(style);
  }

  function initTransportOfficeCard() {
    ensureStyles();
    var info = resolveDriverSupport(
      loadJson(SESSION_KEY, null),
      loadJson(ACCOUNTS_KEY, []),
      loadJson(DRIVERS_KEY, []),
      loadJson(BUSES_KEY, [])
    );

    var section = document.querySelector('.transport-office-card') || document.getElementById('transport-office');
    if (section) {
      var statusEl = section.querySelector('.transport-status-text');
      if (statusEl) {
        var open = isControlRoomOpen();
        statusEl.textContent = open
          ? 'Control Room Open · 07:00 AM – 09:00 PM'
          : 'After Hours · 24/7 Emergency Line Active';
      }
      var items = section.querySelectorAll('.transport-item');
      if (items[2]) {
        var lbl = items[2].querySelector('.transport-label');
        var ph = items[2].querySelector('.transport-phone');
        var nt = items[2].querySelector('.transport-note');
        if (lbl) lbl.textContent = 'Assigned Bus Driver (' + info.busName + ')';
        if (ph) ph.textContent = info.driverPhone;
        if (nt) nt.innerHTML = info.driverName + ' &middot; Helper: <span class="mono">' + info.helperPhone + '</span>';
      }
    }

    var driverModal = document.getElementById('call-driver');
    if (driverModal) {
      var kicker = driverModal.querySelector('.modal-kicker');
      var title = driverModal.querySelector('.call-status-title');
      var dds = driverModal.querySelectorAll('.modal-contact-row dd');
      if (kicker) kicker.innerHTML = 'Assigned Bus ' + info.busName + ' &middot; Route RT-04';
      if (title) title.textContent = info.driverName + ' (Senior Driver)';
      if (dds[0]) dds[0].textContent = info.driverPhone;
      if (dds[1]) dds[1].textContent = info.helperPhone;
      if (dds[2]) dds[2].textContent = info.busPlate;
    }

    var toastTimer = null;
    function showToast(msg) {
      var toast = document.getElementById('bms-office-toast');
      if (!toast) {
        toast = document.createElement('div');
        toast.id = 'bms-office-toast';
        toast.className = 'bms-office-toast';
        document.body.appendChild(toast);
      }
      toast.textContent = msg;
      toast.classList.add('show');
      clearTimeout(toastTimer);
      toastTimer = global.setTimeout(function () { toast.classList.remove('show'); }, 2200);
    }

    document.querySelectorAll('.contact-modal-overlay .modal-contact-row dd.mono').forEach(function (dd) {
      if (dd.querySelector('.btn-copy-inline')) return;
      var value = dd.textContent.trim();
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn-copy-inline';
      btn.textContent = 'Copy';
      btn.addEventListener('click', function () {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(value).then(function () { showToast('Copied ' + value); });
        } else {
          showToast(value);
        }
      });
      dd.appendChild(btn);
    });

    function closeAll() {
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

    document.querySelectorAll('a[href="#call-transport-office"], a[href="#call-driver"]').forEach(function (link) {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        closeAll();
        var target = document.getElementById(link.getAttribute('href').slice(1));
        if (target) target.classList.add('is-open');
      });
    });

    document.querySelectorAll('.contact-modal-overlay').forEach(function (overlay) {
      overlay.addEventListener('click', function (e) {
        if (e.target === overlay || e.target.closest('.modal-close-btn') || e.target.closest('.btn-modal-primary')) {
          e.preventDefault();
          closeAll();
        }
      });
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeAll();
    });
  }

  global.AIUB_BMS_TRANSPORT_OFFICE = {
    isControlRoomOpen: isControlRoomOpen,
    resolveDriverSupport: resolveDriverSupport,
  };

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initTransportOfficeCard);
    } else {
      initTransportOfficeCard();
    }
  }
})(typeof window !== 'undefined' ? window : globalThis);

(function (global) {
  'use strict';

  var NOTIFICATIONS_KEY = 'aiub_bms_notifications';
  var PARENT_STATE_KEY = 'aiub_bms_parent_state';

  var DEFAULT_ALERTS = [
    {
      id: 'palert-1',
      title: 'Bus Reached Mohakhali Checkpoint',
      time: '08:29 AM',
      desc: 'Gazipur-01 crossed Mohakhali Flyover. Student is onboard (Seat B-04). ETA: 08:50 AM.',
    },
    {
      id: 'palert-2',
      title: 'Morning Boarding Confirmed',
      time: '07:56 AM',
      desc: 'Digital pass scanned at Dhanmondi 27 pickup point.',
    },
    {
      id: 'palert-3',
      title: 'Thursday Afternoon Schedule Notice',
      time: 'Yesterday',
      desc: 'Return buses depart at 03:30 PM on Thursday due to faculty seminar.',
    },
  ];

  function escapeHtml(val) {
    return String(val == null ? '' : val)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

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

  function saveJson(key, value) {
    try {
      global.localStorage.setItem(key, JSON.stringify(value));
    } catch (_err) {
      // Ignore
    }
  }

  function mergeAlerts(adminNotifications, readIds) {
    var readSet = new Set(Array.isArray(readIds) ? readIds : ['palert-3']);
    var items = [];

    if (Array.isArray(adminNotifications)) {
      adminNotifications.forEach(function (n) {
        var aud = String(n.audience || '').toLowerCase();
        if (aud.indexOf('all') !== -1 || aud.indexOf('parent') !== -1) {
          var id = 'admin-' + n.id;
          items.push({
            id: id,
            title: n.title,
            time: n.sentTime || 'Today',
            desc: n.message,
            unread: !readSet.has(id),
          });
        }
      });
    }

    DEFAULT_ALERTS.forEach(function (a) {
      items.push({
        id: a.id,
        title: a.title,
        time: a.time,
        desc: a.desc,
        unread: !readSet.has(a.id),
      });
    });

    return items.slice(0, 6);
  }

  function ensureStyles() {
    if (document.getElementById('bms-parent-notif-styles')) return;
    var style = document.createElement('style');
    style.id = 'bms-parent-notif-styles';
    style.textContent =
      '.alert-item{cursor:pointer;border-radius:6px;padding:8px 8px 10px 10px;transition:background .15s}' +
      '.alert-item:hover{background:#f8fafc}' +
      '.alert-item.unread{border-left:3px solid #0d6efd;background:#f8fbff}' +
      '.btn-mark-read{font-family:inherit;font-size:.72rem;font-weight:700;color:#003366;background:#eff6ff;border:1px solid #bfdbfe;border-radius:6px;padding:3px 8px;cursor:pointer;margin-left:8px}';
    document.head.appendChild(style);
  }

  function initNotificationsCard() {
    var card = document.querySelector('.notifications-card') || document.getElementById('notifications');
    if (!card) return;
    ensureStyles();

    var state = loadJson(PARENT_STATE_KEY, { stageIndex: 1, readAlertIds: ['palert-3'], extraAlerts: [] });
    if (!Array.isArray(state.readAlertIds)) state.readAlertIds = ['palert-3'];

    var header = card.querySelector('.feature-card-header');
    var metaEl = card.querySelector('.feature-meta');
    var listEl = card.querySelector('.alert-list');
    var markBtn = null;

    if (header) {
      var wrap = document.createElement('div');
      wrap.style.display = 'flex';
      wrap.style.alignItems = 'center';
      if (metaEl) {
        header.insertBefore(wrap, metaEl);
        wrap.appendChild(metaEl);
      } else {
        header.appendChild(wrap);
      }
      markBtn = document.createElement('button');
      markBtn.type = 'button';
      markBtn.className = 'btn-mark-read';
      markBtn.textContent = 'Mark all read';
      wrap.appendChild(markBtn);
    }

    function render() {
      var alerts = mergeAlerts(loadJson(NOTIFICATIONS_KEY, []), state.readAlertIds);
      var unread = alerts.filter(function (a) { return a.unread; }).length;
      if (metaEl) metaEl.textContent = unread === 0 ? 'All Read' : unread + ' Unread';
      if (markBtn) markBtn.style.display = unread > 0 ? 'inline-block' : 'none';
      if (!listEl) return;
      listEl.innerHTML = alerts
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

    if (markBtn) {
      markBtn.addEventListener('click', function () {
        var alerts = mergeAlerts(loadJson(NOTIFICATIONS_KEY, []), state.readAlertIds);
        alerts.forEach(function (a) {
          if (state.readAlertIds.indexOf(a.id) === -1) state.readAlertIds.push(a.id);
        });
        saveJson(PARENT_STATE_KEY, state);
        render();
      });
    }

    if (listEl) {
      listEl.addEventListener('click', function (e) {
        var li = e.target.closest('li[data-alert-id]');
        if (!li) return;
        var id = li.getAttribute('data-alert-id');
        if (state.readAlertIds.indexOf(id) === -1) {
          state.readAlertIds.push(id);
          saveJson(PARENT_STATE_KEY, state);
          render();
        }
      });
    }

    render();
  }

  global.AIUB_BMS_PARENT_NOTIFICATIONS = {
    mergeAlerts: mergeAlerts,
  };

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initNotificationsCard);
    } else {
      initNotificationsCard();
    }
  }
})(typeof window !== 'undefined' ? window : globalThis);

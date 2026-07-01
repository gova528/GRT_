/* ===================================================================
   EVENTS TAB
   - Everyone: view the event list
   - Admin: add / edit / delete events
=================================================================== */

document.getElementById('events').innerHTML = `
  <div class="sec-title">
    <h2>🗓️ Event Info</h2>
    <span class="pill" id="evCount">0</span>
  </div>
  <div class="card" id="evAddCard" style="display:none">
    <h3 id="evFormTitle">Add event</h3>
    <input type="hidden" id="evId">
    <div class="field"><input id="evTitle" placeholder="Event title"></div>
    <div class="row">
      <div class="field grow"><label>Date</label><input id="evDate" type="date"></div>
      <div class="field grow"><label>Time</label><input id="evTime" type="time"></div>
    </div>
    <div class="field"><textarea id="evDesc" rows="3" placeholder="Description"></textarea></div>
    <div class="row">
      <button class="btn grow" onclick="saveEvent()">💾 Save event</button>
      <button class="btn ghost" id="evCancel" style="display:none" onclick="resetEventForm()">Cancel</button>
    </div>
  </div>
  <div id="evWrap"><div class="loader">Loading events…</div></div>`;

let EV = [];

async function loadEvents() {
  try { EV = await Store.list('events'); } catch (e) { EV = []; }
  renderEvents();
}

function renderEvents() {
  const wrap = document.getElementById('evWrap');
  if (!wrap) return;
  document.getElementById('evCount').textContent = EV.length;
  if (!EV.length) { wrap.innerHTML = '<div class="empty">No events posted yet.' + (isAdmin() ? '<br>Add the first one above.' : '') + '</div>'; return; }
  wrap.innerHTML = EV.map(e => {
    let when = e.date ? new Date(e.date + 'T' + (e.time || '00:00')).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : '';
    if (e.time) when += ' · ' + new Date('2000-01-01T' + e.time).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    return `<div class="ev">
      <div class="when">${when || 'Date TBD'}</div>
      <div class="ti">${esc(e.title)}</div>
      ${e.desc ? `<div class="ds">${esc(e.desc)}</div>` : ''}
      ${isAdmin() ? `<div class="evact">
        <button class="btn sm" onclick='editEvent(${JSON.stringify(JSON.stringify(e))})'>✏️ Edit</button>
        <button class="btn danger sm" onclick="delEvent('${e.id}')">🗑 Delete</button></div>` : ''}
    </div>`;
  }).join('');
}

async function saveEvent() {
  if (!isAdmin()) return toast('Login required');
  const id = document.getElementById('evId').value;
  const data = {
    title: document.getElementById('evTitle').value.trim(),
    date: document.getElementById('evDate').value,
    time: document.getElementById('evTime').value,
    desc: document.getElementById('evDesc').value.trim()
  };
  if (!data.title) return toast('Enter a title');
  if (id) await Store.update('events', id, data); else await Store.add('events', data);
  resetEventForm(); toast(id ? 'Event updated ✅' : 'Event added ✅'); loadEvents();
}

function editEvent(json) {
  const e = JSON.parse(json);
  document.getElementById('evId').value = e.id; document.getElementById('evTitle').value = e.title || '';
  document.getElementById('evDate').value = e.date || ''; document.getElementById('evTime').value = e.time || '';
  document.getElementById('evDesc').value = e.desc || '';
  document.getElementById('evFormTitle').textContent = 'Edit event';
  document.getElementById('evCancel').style.display = 'inline-flex';
  go('events'); window.scrollTo({ top: 0, behavior: 'smooth' });
}

function resetEventForm() {
  ['evId', 'evTitle', 'evDate', 'evTime', 'evDesc'].forEach(i => document.getElementById(i).value = '');
  document.getElementById('evFormTitle').textContent = 'Add event';
  document.getElementById('evCancel').style.display = 'none';
}

async function delEvent(id) {
  if (!isAdmin()) return; if (!confirm('Delete this event?')) return;
  await Store.remove('events', id); toast('Event deleted'); loadEvents();
}
/* ===================================================================
   HOME TAB — hero, live countdown, event details.
   Editable content (date/time, About, Venue, Schedule activities) is
   loaded from the database (Store: settings/event) so the admin can
   change it live; falls back to the defaults below.
=================================================================== */

const DEF_ABOUT = "A grand get-together (GRT) of the 2006–2007 batch of Vivekananda Municipal High School. Reconnect with old friends, relive school memories, share photos and celebrate the bond that started in our classrooms.";
const DEF_VENUE = "Vivekananda Municipal High School\nNG Palle, Madanapalle";
const DEF_ACTIVITIES = "Memories · Lunch · Music";

document.getElementById('home').innerHTML = `
  <div class="hero">
    <div class="kicker">GRAND RE-UNION · GRT</div>
    <h1>Batch <span>✦ 𝟐𝟎𝟎𝟔–𝟐𝟎𝟎𝟕 ✦</span></h1>
    <div class="sub">Vivekananda Municipal High School</div>
    <div class="meta">
      <div class="chip" id="evDateChip">📅 —</div>
      <div class="chip" id="evTimeChip">🕘 —</div>
      <div class="chip">📍 VMHS, NG Palle, Madanapalle</div>
    </div>
    <div class="count">
      <div class="box"><div class="n" id="cd">00</div><div class="l">Days</div></div>
      <div class="box"><div class="n" id="ch">00</div><div class="l">Hours</div></div>
      <div class="box"><div class="n" id="cm">00</div><div class="l">Mins</div></div>
      <div class="box"><div class="n" id="cs">00</div><div class="l">Secs</div></div>
    </div>
    <div class="live" id="liveTag" style="display:none"><span class="dot"></span> The reunion is LIVE now! 🎉</div>
  </div>

  <!-- Admin-only: edit event details (saved for everyone) -->
  <div class="card" id="eventEditCard" style="display:none">
    <h3>✏️ Edit event details</h3>
    <div class="field"><label>Date</label><input type="date" id="evCfgDate"></div>
    <div class="row">
      <div class="field grow"><label>Start time</label><input type="time" id="evCfgStart"></div>
      <div class="field grow"><label>End time</label><input type="time" id="evCfgEnd"></div>
    </div>
    <div class="field"><label>About this Reunion</label><textarea id="cfgAbout" rows="3"></textarea></div>
    <div class="field"><label>Venue (one line per row)</label><textarea id="cfgVenue" rows="2"></textarea></div>
    <div class="field"><label>Schedule activities</label><input id="cfgActivities" placeholder="e.g. Memories · Lunch · Music"></div>
    <button class="btn block" onclick="saveEventConfig()">💾 Save changes</button>
  </div>

  <div class="card">
    <h3>🎓 About this Reunion</h3>
    <p class="muted" id="aboutText" style="margin:0;line-height:1.6;font-size:16px">—</p>
  </div>

  <div class="row">
    <div class="card grow" style="margin-bottom:0">
      <h3>📍 Venue</h3>
      <p class="muted" id="venueText" style="margin:0;font-size:16px;line-height:1.6">—</p>
      <a class="btn sm ghost" id="venueMap" style="margin-top:12px;display:inline-flex" target="_blank" href="#">Open in Maps ↗</a>
    </div>
    <div class="card grow" style="margin-bottom:0">
      <h3>🕘 Schedule</h3>
      <p class="muted" style="margin:0;font-size:16px;line-height:1.6">
        <b style="color:var(--txt)" id="schedLine1">—</b><br>
        <span id="schedLine2">—</span><br>
        <span id="schedActivities">—</span>
      </p>
    </div>
  </div>`;

/* ---------- Event state (updatable) ---------- */
let EVENT = { start: EVENT_START, end: EVENT_END };

function fmtTime(hhmm) { // "21:00" -> "9:00 PM"
  return new Date('2000-01-01T' + hhmm).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

function applyEventConfig(c) {
  const date  = (c && c.date)  || EVENT_DATE_STR;
  const start = (c && c.start) || EVENT_START_STR;
  const end   = (c && c.end)   || EVENT_END_STR;
  const about = (c && c.about) || DEF_ABOUT;
  const venue = (c && c.venue) || DEF_VENUE;
  const acts  = (c && c.activities) || DEF_ACTIVITIES;

  EVENT.start = new Date(`${date}T${start}:00+05:30`);
  EVENT.end   = new Date(`${date}T${end}:00+05:30`);

  // Date/time chips + schedule
  const dObj = new Date(`${date}T00:00:00+05:30`);
  document.getElementById('evDateChip').textContent =
    '📅 ' + dObj.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  document.getElementById('evTimeChip').textContent = '🕘 ' + fmtTime(start) + ' – ' + fmtTime(end);
  document.getElementById('schedLine1').textContent =
    dObj.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  document.getElementById('schedLine2').textContent = fmtTime(start) + ' – ' + fmtTime(end) + ' (same day)';
  document.getElementById('schedActivities').textContent = acts;

  // About + Venue
  document.getElementById('aboutText').textContent = about;
  document.getElementById('venueText').innerHTML = esc(venue).replace(/\n/g, '<br>');
  document.getElementById('venueMap').href =
    'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(venue.replace(/\n/g, ' '));

  // Prefill the admin form
  document.getElementById('evCfgDate').value  = date;
  document.getElementById('evCfgStart').value = start;
  document.getElementById('evCfgEnd').value   = end;
  document.getElementById('cfgAbout').value = about;
  document.getElementById('cfgVenue').value = venue;
  document.getElementById('cfgActivities').value = acts;

  tick();
}

async function loadEventConfig() {
  let c = null;
  try { c = await Store.getDoc('settings', 'event'); } catch (e) {}
  applyEventConfig(c);
}

async function saveEventConfig() {
  if (!isAdmin()) return toast('Login required');
  const date  = document.getElementById('evCfgDate').value;
  const start = document.getElementById('evCfgStart').value;
  const end   = document.getElementById('evCfgEnd').value;
  if (!date || !start || !end) return toast('Fill date, start and end time');
  if (end <= start) return toast('End time must be after start time');
  const data = {
    date, start, end,
    about: document.getElementById('cfgAbout').value.trim() || DEF_ABOUT,
    venue: document.getElementById('cfgVenue').value.trim() || DEF_VENUE,
    activities: document.getElementById('cfgActivities').value.trim() || DEF_ACTIVITIES
  };
  try {
    await Store.setDoc('settings', 'event', data);
    applyEventConfig(data);
    toast('Saved ✅');
  } catch (e) { console.error(e); toast('Update failed'); }
}

/* ---------- Countdown ---------- */
function tick() {
  const now = new Date();
  let diff = EVENT.start - now;
  const live = now >= EVENT.start && now <= EVENT.end;
  document.getElementById('liveTag').style.display = live ? 'inline-flex' : 'none';
  if (diff < 0) diff = 0;
  const d = Math.floor(diff / 864e5), h = Math.floor(diff % 864e5 / 36e5),
        m = Math.floor(diff % 36e5 / 6e4), s = Math.floor(diff % 6e4 / 1e3);
  const p = n => String(n).padStart(2, '0');
  cd.textContent = p(d); ch.textContent = p(h); cm.textContent = p(m); cs.textContent = p(s);
}
setInterval(tick, 1000);

// Load saved details (or defaults) and start the countdown
loadEventConfig();

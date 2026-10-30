/* Qibla compass and Hijri month calendar for the Sky page. Calculated in the browser; nothing is sent anywhere. */
(function(){
  var LOCS = [["Dhaka",23.81,90.41],["Chattogram",22.36,91.78],["Sylhet",24.90,91.87],["Rajshahi",24.37,88.60],["Khulna",22.82,89.55],["Barishal",22.70,90.37],["Rangpur",25.74,89.25],["Mymensingh",24.75,90.41]];
  var KAABA = [21.4225, 39.8262], RAD = Math.PI / 180, DAY = 864e5, OFF = 6 * 36e5;
  var HM = ["Muharram","Safar","Rabi al-Awwal","Rabi al-Thani","Jumada al-Ula","Jumada al-Thani","Rajab","Shaban","Ramadan","Shawwal","Dhu al-Qadah","Dhu al-Hijjah"];
  var MON = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  var EVENTS = {"1-1":"Islamic New Year","10-1":"Ashura","12-3":"Eid-e-Miladunnabi","27-7":"Shab-e-Miraj","15-8":"Shab-e-Barat","1-9":"Ramadan begins","27-9":"Shab-e-Qadr (27th night)","1-10":"Eid al-Fitr","9-12":"Day of Arafah","10-12":"Eid al-Adha"};
  function $(id){ return document.getElementById(id); }
  function place(){
    var s = $("loc"), i = s ? +s.value : NaN;
    if (isNaN(i)){ try { i = +localStorage.getItem("sky.loc"); } catch(e){} }
    if (isNaN(i) || !LOCS[i]) i = 2;
    return LOCS[i];
  }
  function card(id, key, name, bn, icon, c){
    var s = document.createElement("section"); s.className = "grp"; s.id = id; s.style.setProperty("--c", c || "var(--accent)");
    s.innerHTML = '<div class="gh"><div><span class="gk">' + key + '</span><span class="gn">' + name + '<small>' + bn + '</small></span></div><div class="gi">' + icon + '</div></div><div id="' + id + 'Box"></div>';
    $("facts").appendChild(s); return $(id + "Box");
  }

  /* ---------- Qibla ---------- */
  function qibla(lat, lon){
    var p1 = lat * RAD, p2 = KAABA[0] * RAD, dl = (KAABA[1] - lon) * RAD;
    var b = Math.atan2(Math.sin(dl) * Math.cos(p2), Math.cos(p1) * Math.sin(p2) - Math.sin(p1) * Math.cos(p2) * Math.cos(dl)) / RAD;
    var a = Math.sin((p2 - p1) / 2) * Math.sin((p2 - p1) / 2) + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) * Math.sin(dl / 2);
    return {bearing: (b + 360) % 360, km: 2 * 6371 * Math.asin(Math.sqrt(a))};
  }
  function wind(b){ return ["N","NNE","NE","ENE","E","ESE","SE","SSE","S","SSW","SW","WSW","W","WNW","NW","NNW"][Math.round(b / 22.5) % 16]; }
  var qBox, comp = {on:false, h:null, timer:0}, curQ = 0;
  function renderQibla(){
    if (!qBox) return;
    var L = place(), q = qibla(L[1], L[2]), t = ""; curQ = q.bearing;
    for (var a = 0; a < 360; a += 30){ var big = a % 90 === 0; t += '<line x1="0" y1="' + (big ? -84 : -87) + '" x2="0" y2="-92" transform="rotate(' + a + ')" stroke="var(--muted)" stroke-width="' + (big ? 2 : 1) + '"/>'; }
    var svg = '<svg class="qb-dial" viewBox="-110 -110 220 220" role="img" aria-label="Qibla direction from ' + L[0] + ': ' + Math.round(q.bearing) + ' degrees from north">' +
      '<g id="qbRot"><circle r="92" fill="none" stroke="var(--line)" stroke-width="1.5"/><circle r="60" fill="none" stroke="var(--line)" stroke-dasharray="3 5"/>' + t +
      '<g font-size="12" fill="var(--muted)" text-anchor="middle"><text y="-98">N</text><text x="101" y="4">E</text><text y="108">S</text><text x="-101" y="4">W</text></g>' +
      '<g transform="rotate(' + q.bearing.toFixed(1) + ')"><line y1="8" y2="-66" stroke="var(--accent)" stroke-width="3" stroke-linecap="round"/><polygon points="0,-76 -7,-60 7,-60" fill="var(--accent)"/>' +
      '<rect x="-8" y="-98" width="16" height="16" fill="var(--bg)" stroke="var(--accent)" stroke-width="2"/><rect x="-8" y="-93" width="16" height="3" fill="var(--accent)"/></g></g>' +
      '<polygon id="qbFwd" points="0,-110 -5,-101 5,-101" fill="var(--ink)" opacity="0"/><circle r="5" fill="var(--accent)"/></svg>';
    qBox.innerHTML = '<div class="qb-wrap">' + svg + '<div class="qb-text"><b>' + Math.round(q.bearing) + '\u00B0 <i>' + wind(q.bearing) + '</i></b><span>from true north, clockwise</span>' +
      '<div class="qb-row"><span>Kaaba, Makkah</span><b>' + Math.round(q.km).toLocaleString("en-US") + ' km</b></div><div class="qb-row"><span>From</span><b>' + L[0] + '</b></div>' +
      '<button type="button" class="qb-btn" id="qbBtn">' + (comp.on ? 'Stop compass' : 'Use phone compass') + '</button></div></div>' +
      '<p class="qb-stat" id="qbStat" aria-live="polite"></p>' +
      '<p class="pr-note">On a phone, tap the button and allow motion access, then hold the phone flat with its top pointing forward. Turn until the message says you are facing the Qibla. Phone compasses can be a few degrees off near metal and electronics.</p>';
    $("qbBtn").onclick = toggleCompass;
    if (comp.on) applyCompass();
  }
  function applyCompass(){
    var g = $("qbRot"), f = $("qbFwd"), st = $("qbStat"); if (!g || comp.h === null) return;
    g.setAttribute("transform", "rotate(" + (-comp.h).toFixed(1) + ")"); if (f) f.setAttribute("opacity", "1");
    var d = ((curQ - comp.h + 540) % 360) - 180;
    if (st){
      if (Math.abs(d) <= 5){ st.textContent = "\u2713 You are facing the Qibla"; st.className = "qb-stat ok"; }
      else { st.textContent = "Turn " + (d > 0 ? "right" : "left") + " about " + Math.round(Math.abs(d)) + "\u00B0"; st.className = "qb-stat"; }
    }
  }
  function onOri(e){
    var h = null;
    if (typeof e.webkitCompassHeading === "number") h = e.webkitCompassHeading;
    else if (e.absolute && e.alpha !== null && e.alpha !== undefined) h = (360 - e.alpha) % 360;
    if (h === null || isNaN(h)) return;
    if (comp.h === null) comp.h = h; else { var df = ((h - comp.h + 540) % 360) - 180; comp.h = (comp.h + df * 0.25 + 360) % 360; }
    clearTimeout(comp.timer); applyCompass();
  }
  function stopCompass(){
    comp.on = false; comp.h = null; clearTimeout(comp.timer);
    window.removeEventListener("deviceorientationabsolute", onOri, true); window.removeEventListener("deviceorientation", onOri, true);
    var g = $("qbRot"), f = $("qbFwd"), st = $("qbStat"), b = $("qbBtn");
    if (g) g.removeAttribute("transform"); if (f) f.setAttribute("opacity", "0"); if (st){ st.textContent = ""; st.className = "qb-stat"; } if (b) b.textContent = "Use phone compass";
  }
  function beginCompass(){
    comp.on = true; var b = $("qbBtn"), st = $("qbStat"); if (b) b.textContent = "Stop compass"; if (st){ st.textContent = "Looking for the compass\u2026"; st.className = "qb-stat"; }
    window.addEventListener("deviceorientationabsolute", onOri, true); window.addEventListener("deviceorientation", onOri, true);
    comp.timer = setTimeout(function(){ var s2 = $("qbStat"); if (comp.on && comp.h === null && s2) s2.textContent = "No compass signal. This needs a phone or tablet with a compass sensor, opened over https, with motion access allowed."; }, 3000);
  }
  function toggleCompass(){
    if (comp.on){ stopCompass(); return; }
    var DO = window.DeviceOrientationEvent;
    if (DO && typeof DO.requestPermission === "function"){
      DO.requestPermission().then(function(r){ if (r === "granted") beginCompass(); else { var st = $("qbStat"); if (st) st.textContent = "Motion access was not allowed."; } }).catch(function(){ var st = $("qbStat"); if (st) st.textContent = "Could not start the compass."; });
    } else beginCompass();
  }

  /* ---------- Hijri calendar (tabular) ---------- */
  function hijri(day){            /* day = UTC-midnight ms of a Gregorian date */
    var d = new Date(day), y = d.getUTCFullYear(), m = d.getUTCMonth() + 1, dd = d.getUTCDate();
    var a = Math.floor((14 - m) / 12), yy = y + 4800 - a, mm = m + 12 * a - 3;
    var jd = dd + Math.floor((153 * mm + 2) / 5) + 365 * yy + Math.floor(yy / 4) - Math.floor(yy / 100) + Math.floor(yy / 400) - 32045;
    var l = jd - 1948440 + 10632, n = Math.floor((l - 1) / 10631);
    l = l - 10631 * n + 354;
    var j = Math.floor((10985 - l) / 5316) * Math.floor((50 * l) / 17719) + Math.floor(l / 5670) * Math.floor((43 * l) / 15238);
    l = l - Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) - Math.floor(j / 16) * Math.floor((15238 * j) / 43) + 29;
    var hm = Math.floor((24 * l) / 709);
    return {d: l - Math.floor((709 * hm) / 24), m: hm, y: 30 * n + j - 30};
  }
  function today(){ var d = new Date(Date.now() + OFF); return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()); }
  function startOf(day){ return day - (hijri(day).d - 1) * DAY; }
  function lenOf(start){ var h = hijri(start), n = 1; while (n < 32 && hijri(start + n * DAY).m === h.m) n++; return n; }
  function gdate(day){ var d = new Date(day); return d.getUTCDate() + " " + MON[d.getUTCMonth()]; }

  var cBox, view = null;
  function renderCal(){
    if (!cBox) return;
    var td = today(); if (view === null) view = startOf(td);
    var h = hijri(view), len = lenOf(view), first = new Date(view).getUTCDay(), last = view + (len - 1) * DAY;
    var out = '<div class="hc-nav"><button type="button" id="hcPrev" aria-label="Previous month">\u2039</button><div><b>' + HM[h.m - 1] + ' ' + h.y + ' AH</b><small>' + gdate(view) + ' \u2013 ' + gdate(last) + ' ' + new Date(last).getUTCFullYear() + '</small></div><button type="button" id="hcNext" aria-label="Next month">\u203A</button></div>';
    out += '<div class="hc-grid" role="grid">';
    ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].forEach(function(w, i){ out += '<span class="hc-w' + (i === 5 ? ' fri' : '') + '">' + w + '</span>'; });
    for (var i = 0; i < first; i++) out += '<span class="hc-e"></span>';
    var evs = [];
    for (var n = 0; n < len; n++){
      var day = view + n * DAY, dow = (first + n) % 7, ev = EVENTS[(n + 1) + "-" + h.m];
      if (ev) evs.push([n + 1, ev, day]);
      out += '<span class="hc-d' + (dow === 5 ? ' fri' : '') + (day === td ? ' today' : '') + (ev ? ' ev' : '') + '"' + (ev ? ' title="' + ev + '"' : '') + '><b>' + (n + 1) + '</b><small>' + new Date(day).getUTCDate() + '</small></span>';
    }
    out += '</div>';
    if (evs.length){ out += '<ul class="hc-ev">'; evs.forEach(function(e){ out += '<li><b>' + e[0] + ' ' + HM[h.m - 1] + '</b> \u00B7 ' + e[1] + '<small>' + gdate(e[2]) + '</small></li>'; }); out += '</ul>'; }
    out += '<div class="hc-foot"><span>Big number: Hijri day \u00B7 small: English date</span>' + (view === startOf(td) ? '' : '<button type="button" id="hcToday">Today</button>') + '</div>' +
      '<p class="pr-note">This uses the standard tabular calendar. In Bangladesh the month starts with local moon sighting, so the real date can be a day later.</p>';
    cBox.innerHTML = out;
    $("hcPrev").onclick = function(){ view = startOf(view - DAY); renderCal(); };
    $("hcNext").onclick = function(){ view = view + len * DAY; renderCal(); };
    var tb = $("hcToday"); if (tb) tb.onclick = function(){ view = startOf(today()); renderCal(); };
  }

  function start(){
    if (!$("facts")) return;
    qBox = card("qiblaGrp", "05 \u2014 QIBLA", "Qibla", "\u0995\u09BF\u09AC\u09B2\u09BE", '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/></svg>', "var(--moon)");
    cBox = card("hijriGrp", "06 \u2014 HIJRI CALENDAR", "Calendar", "\u09B9\u09BF\u099C\u09B0\u09BF \u0995\u09CD\u09AF\u09BE\u09B2\u09C7\u09A8\u09CD\u09A1\u09BE\u09B0", '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>', "var(--yr)");
    renderQibla(); renderCal();
    var s = $("loc"); if (s) s.addEventListener("change", renderQibla);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
  window.__qc = {qibla: qibla, hijri: hijri, startOf: startOf, lenOf: lenOf};
})();

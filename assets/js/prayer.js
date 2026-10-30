/* Prayer times and Ramadan countdown for the Sky page. Calculated in the browser; nothing is sent anywhere.
   Setting used in Bangladesh: Fajr and Isha at 18 degrees, Hanafi Asr (shadow = 2x). Computed from each city's own coordinates, sunrise/sunset at -0.833 degrees. Times are Bangladesh time (UTC+6). */
(function(){
  var LOCS = [["Dhaka",23.81,90.41],["Chattogram",22.36,91.78],["Sylhet",24.90,91.87],["Rajshahi",24.37,88.60],["Khulna",22.82,89.55],["Barishal",22.70,90.37],["Rangpur",25.74,89.25],["Mymensingh",24.75,90.41]];
  var OFF = 6 * 36e5, RAD = Math.PI / 180;
  var NAMES = [["fajr","Fajr","\u09AB\u099C\u09B0"],["sunrise","Sunrise","\u09B8\u09C2\u09B0\u09CD\u09AF\u09CB\u09A6\u09DF"],["dhuhr","Dhuhr","\u099C\u09CB\u09B9\u09B0"],["asr","Asr","\u0986\u09B8\u09B0"],["maghrib","Maghrib","\u09AE\u09BE\u0997\u09B0\u09BF\u09AC"],["isha","Isha","\u098F\u09B6\u09BE"]];
  var HM = ["Muharram","Safar","Rabi al-Awwal","Rabi al-Thani","Jumada al-Ula","Jumada al-Thani","Rajab","Shaban","Ramadan","Shawwal","Dhu al-Qadah","Dhu al-Hijjah"];

  function $(id){ return document.getElementById(id); }
  function pad(n){ return ("0" + n).slice(-2); }
  function clock(ms){ var d = new Date(ms + OFF), h = d.getUTCHours(); return (h % 12 || 12) + ":" + pad(d.getUTCMinutes()) + (h < 12 ? " AM" : " PM"); }
  function span(ms){ var m = Math.max(0, Math.round(ms / 6e4)); return Math.floor(m / 60) + "h " + pad(m % 60) + "m"; }

  /* Solar declination and equation of time (NOAA approximation) */
  function sun(y, m, d){
    var doy = Math.round((Date.UTC(y, m, d) - Date.UTC(y, 0, 0)) / 864e5);
    var g = 2 * Math.PI / 365 * (doy - 1);
    var eq = 229.18 * (0.000075 + 0.001868 * Math.cos(g) - 0.032077 * Math.sin(g) - 0.014615 * Math.cos(2 * g) - 0.040849 * Math.sin(2 * g));
    var dec = 0.006918 - 0.399912 * Math.cos(g) + 0.070257 * Math.sin(g) - 0.006758 * Math.cos(2 * g) + 0.000907 * Math.sin(2 * g) - 0.002697 * Math.cos(3 * g) + 0.00148 * Math.sin(3 * g);
    return {eq: eq, dec: dec};
  }
  function hourAngle(lat, dec, alt){
    var c = (Math.sin(alt * RAD) - Math.sin(lat * RAD) * Math.sin(dec)) / (Math.cos(lat * RAD) * Math.cos(dec));
    return Math.acos(Math.max(-1, Math.min(1, c))) / RAD;
  }
  /* y, m (0-11), d = a Bangladesh calendar day. Returns times in real ms. */
  function times(y, m, d, lat, lon){
    var s = sun(y, m, d), mid = Date.UTC(y, m, d) - OFF;
    var noon = 720 - 4 * lon - s.eq + 360;           /* minutes after local midnight */
    var asrAlt = Math.atan(1 / (2 + Math.tan(Math.abs(lat * RAD - s.dec)))) / RAD;
    var at = function(min){ return mid + Math.round(min) * 6e4; };
    return {
      fajr: at(noon - 4 * hourAngle(lat, s.dec, -18)),
      sunrise: at(noon - 4 * hourAngle(lat, s.dec, -0.833)),
      dhuhr: at(noon + 1),
      asr: at(noon + 4 * hourAngle(lat, s.dec, asrAlt)),
      maghrib: at(noon + 4 * hourAngle(lat, s.dec, -0.833) + 1),
      isha: at(noon + 4 * hourAngle(lat, s.dec, -18))
    };
  }

  /* Tabular Hijri date (used for the Ramadan countdown) */
  function hijri(ms){
    var d = new Date(ms + OFF), y = d.getUTCFullYear(), m = d.getUTCMonth() + 1, dd = d.getUTCDate();
    var a = Math.floor((14 - m) / 12), yy = y + 4800 - a, mm = m + 12 * a - 3;
    var jd = dd + Math.floor((153 * mm + 2) / 5) + 365 * yy + Math.floor(yy / 4) - Math.floor(yy / 100) + Math.floor(yy / 400) - 32045;
    var l = jd - 1948440 + 10632, n = Math.floor((l - 1) / 10631);
    l = l - 10631 * n + 354;
    var j = Math.floor((10985 - l) / 5316) * Math.floor((50 * l) / 17719) + Math.floor(l / 5670) * Math.floor((43 * l) / 15238);
    l = l - Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) - Math.floor(j / 16) * Math.floor((15238 * j) / 43) + 29;
    var hm = Math.floor((24 * l) / 709);
    return {d: l - Math.floor((709 * hm) / 24), m: hm, y: 30 * n + j - 30};
  }
  function daysUntil(month, nowMs){
    for (var i = 1; i < 400; i++){ var h = hijri(nowMs + i * 864e5); if (h.m === month && h.d === 1) return {days: i, year: h.y}; }
    return null;
  }

  var box, built = false, lastKey = "";
  function build(){
    var facts = $("facts"); if (!facts) return false;
    var sec = document.createElement("section"); sec.className = "grp"; sec.id = "prayerGrp"; sec.style.setProperty("--c", "var(--accent)");
    sec.innerHTML = '<div class="gh"><div><span class="gk">04 \u2014 PRAYER</span><span class="gn">Prayer times<small>\u09A8\u09BE\u09AE\u09BE\u099C\u09C7\u09B0 \u09B8\u09AE\u09DF</small></span></div>' +
      '<div class="gi"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3a4 4 0 00-4 4v1h8V7a4 4 0 00-4-4z"/><path d="M5 21V12h14v9M9 21v-4a3 3 0 016 0v4"/></svg></div></div>' +
      '<div id="prayerBox"></div>';
    facts.appendChild(sec); box = $("prayerBox"); return true;
  }
  function place(){
    var s = $("loc"), i = s ? +s.value : NaN;
    if (isNaN(i)){ try { i = +localStorage.getItem("sky.loc"); } catch(e){} }
    if (isNaN(i) || !LOCS[i]) i = 2;
    return LOCS[i];
  }
  function render(){
    if (!built) built = build();
    if (!built || !box) return;
    var now = Date.now(), L = place(), d = new Date(now + OFF);
    var y = d.getUTCFullYear(), m = d.getUTCMonth(), dd = d.getUTCDate();
    var T = times(y, m, dd, L[1], L[2]), order = ["fajr","dhuhr","asr","maghrib","isha"], nextK = null, nextT = 0;
    for (var i = 0; i < order.length; i++){ if (T[order[i]] > now){ nextK = order[i]; nextT = T[order[i]]; break; } }
    if (!nextK){ nextK = "fajr"; nextT = times(y, m, dd + 1, L[1], L[2]).fajr; }
    var prevT = 0, prevK = "isha";
    for (var j = order.length - 1; j >= 0; j--){ if (T[order[j]] <= now){ prevK = order[j]; prevT = T[order[j]]; break; } }
    var nm = {}; NAMES.forEach(function(n){ nm[n[0]] = n; });
    var rm = hijri(now), key = L[0] + nextK + Math.floor(now / 6e4);
    if (key === lastKey) return; lastKey = key;

    var Tn = times(y, m, dd + 1, L[1], L[2]);
    var W = {fajr:[T.fajr, T.sunrise], dhuhr:[T.dhuhr, T.asr], asr:[T.asr, T.maghrib], maghrib:[T.maghrib, T.isha], isha:[T.isha, Tn.fajr]};
    var cur = null;
    order.forEach(function(k){ if (W[k][0] <= now && now < W[k][1]) cur = k; });
    var overnight = false;
    if (!cur && now < T.fajr){ cur = "isha"; overnight = true; }
    var curEnd = cur ? (overnight ? T.fajr : W[cur][1]) : 0;

    var h = '<div class="pr-next"><small>Next azan</small><b>' + nm[nextK][1] + ' <i>' + nm[nextK][2] + '</i></b><span>Azan at ' + clock(nextT) + ' \u00B7 in ' + span(nextT - now) + '</span></div>';
    if (cur) h += '<p class="pr-now">Now: <b>' + nm[cur][1] + '</b> time is on, until ' + clock(curEnd) + ' (' + span(curEnd - now) + ' left)</p>';
    else h += '<p class="pr-now">Now: between sunrise and Dhuhr, no prayer time.</p>';
    h += '<div class="pr-head"><span>Prayer \u00B7 time window</span><span>Azan</span></div><div class="pr-list">';
    NAMES.forEach(function(n){
      var k = n[0], on = k === nextK, isNow = k === cur && !overnight, past = T[k] <= now && !on && !isNow;
      var win = W[k] ? clock(W[k][0]) + ' \u2013 ' + clock(W[k][1]) : 'Sun rises \u00B7 no prayer';
      h += '<div class="pr-row' + (on ? ' on' : '') + (isNow ? ' now' : '') + (past ? ' past' : '') + (k === "sunrise" ? ' info' : '') + '"><span>' + n[1] + ' <i>' + n[2] + '</i>' + (isNow ? ' <em>Now</em>' : on ? ' <em>Next</em>' : '') + '<small class="pr-win">' + win + '</small></span><b>' + (k === "sunrise" ? '\u2014' : clock(T[k])) + '</b></div>';
    });
    h += '</div>';
    /* Ramadan and Eid */
    var line;
    if (rm.m === 9){ line = "Ramadan " + rm.y + " AH is on \u2014 day " + rm.d + " (tabular calendar)."; }
    else {
      var r = daysUntil(9, now), e = daysUntil(10, now);
      line = r ? "Ramadan " + r.year + " AH begins in about <b>" + r.days + " days</b>" + (e ? ", Eid al-Fitr in about <b>" + e.days + "</b>." : ".") : "";
    }
    h += '<p class="pr-note">' + line + '</p><p class="pr-note">Calculated from ' + L[0] + '\u2019s own latitude and longitude, using the Bangladesh-style setting (Fajr and Isha at 18\u00B0, Hanafi Asr), close to the Islamic Foundation Bangladesh timetable. Azan is the start of each prayer time; the jamaat at your mosque is usually later. Local mosque timetables can differ by a few minutes, and Ramadan and Eid follow moon sighting, so a day\u2019s difference is normal.</p>';
    box.innerHTML = h;
  }
  function start(){
    render(); setInterval(render, 5000);
    var s = $("loc"); if (s) s.addEventListener("change", function(){ lastKey = ""; render(); });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
  window.__prayerTest = {times: times, hijri: hijri};
})();

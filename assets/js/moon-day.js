/* Moon phase calendar and day-length chart for the Sky page. Calculated in the browser; nothing is sent anywhere.
   The moon maths comes from sky.js (window.SkyAstro); a simple fallback is used if it is missing. */
(function(){
  var LOCS = [["Dhaka",23.81,90.41],["Chattogram",22.36,91.78],["Sylhet",24.90,91.87],["Rajshahi",24.37,88.60],["Khulna",22.82,89.55],["Barishal",22.70,90.37],["Rangpur",25.74,89.25],["Mymensingh",24.75,90.41]];
  var OFF = 6 * 36e5, RAD = Math.PI / 180, DAY = 864e5, H6 = 6 * 36e5;
  var MON = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  var MONL = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  var WD = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  function $(id){ return document.getElementById(id); }
  function pad(n){ return ("0" + n).slice(-2); }
  function place(){
    var s = $("loc"), i = s ? +s.value : NaN;
    if (isNaN(i)){ try { i = +localStorage.getItem("sky.loc"); } catch(e){} }
    if (isNaN(i) || !LOCS[i]) i = 2;
    return LOCS[i];
  }
  function card(id, key, name, bn, icon, c, wide){
    var s = document.createElement("section"); s.className = "grp" + (wide ? " grp-wide" : ""); s.id = id; s.style.setProperty("--c", c);
    s.innerHTML = '<div class="gh"><div><span class="gk">' + key + '</span><span class="gn">' + name + '<small>' + bn + '</small></span></div><div class="gi">' + icon + '</div></div><div id="' + id + 'Box"></div>';
    $("facts").appendChild(s); return $(id + "Box");
  }
  function dhaka(ms){ return new Date(ms + OFF); }
  function clock(ms){ var d = dhaka(ms), h = d.getUTCHours(); return (h % 12 || 12) + ":" + pad(d.getUTCMinutes()) + (h < 12 ? " AM" : " PM"); }
  function approx(ms){ var d = dhaka(ms + 18e5), h = d.getUTCHours(); return "\u2248 " + (h % 12 || 12) + (h < 12 ? " AM" : " PM"); }
  function dlabel(ms){ var d = dhaka(ms); return WD[d.getUTCDay()] + " " + d.getUTCDate() + " " + MON[d.getUTCMonth()]; }
  function hm(min){ var m = Math.round(min); return Math.floor(m / 60) + "h " + pad(m % 60) + "m"; }
  function clockMin(min){ var m = Math.round(min), h = Math.floor(m / 60) % 24; return (h % 12 || 12) + ":" + pad(m % 60) + (h < 12 ? " AM" : " PM"); }

  /* ---------- Moon calendar ---------- */
  function phaseAt(ms){
    if (window.SkyAstro && window.SkyAstro.illum){ var r = window.SkyAstro.illum(ms); return {p: ((r.phase % 1) + 1) % 1, f: r.frac}; }
    var jd = ms / DAY + 2440587.5, p = (((jd - 2451550.1) / 29.530588853) % 1 + 1) % 1;
    return {p: p, f: (1 - Math.cos(2 * Math.PI * p)) / 2};
  }
  function moonSVG(p, size){
    var r = 10, k = Math.cos(2 * Math.PI * p), rx = Math.abs(k) * r, d;
    if (p < 0.5) d = "M0,-10 A10,10 0 0 1 0,10 A" + rx.toFixed(2) + ",10 0 0 " + (k > 0 ? 0 : 1) + " 0,-10Z";
    else d = "M0,-10 A10,10 0 0 0 0,10 A" + rx.toFixed(2) + ",10 0 0 " + (k < 0 ? 0 : 1) + " 0,-10Z";
    return '<svg viewBox="-12 -12 24 24" width="' + size + '" height="' + size + '" aria-hidden="true"><circle r="10" fill="var(--line)" opacity=".85"/><path d="' + d + '" fill="var(--moon)"/><circle r="10" fill="none" stroke="var(--muted)" stroke-width=".8" opacity=".6"/></svg>';
  }
  function quad(ms){ return Math.floor(phaseAt(ms).p * 4) % 4; }
  var PN = ["New moon","First quarter","Full moon","Last quarter"], PS = ["New","1st Q","Full","Last Q"];
  function monthEvents(y, m){
    var a = Date.UTC(y, m, 1) - OFF, b = Date.UTC(y, m + 1, 1) - OFF, out = [];
    for (var t = a - H6; t < b; t += H6){
      var q0 = quad(t), q1 = quad(t + H6);
      if (q0 !== q1){
        var lo = t, hi = t + H6;
        for (var i = 0; i < 22; i++){ var mid = (lo + hi) / 2; if (quad(mid) === q0) lo = mid; else hi = mid; }
        if (hi >= a && hi < b) out.push({t: hi, q: q1});
      }
    }
    return out;
  }
  var mBox, vy, vm;
  function renderMoon(){
    if (!mBox) return;
    if (vy === undefined){ var n = dhaka(Date.now()); vy = n.getUTCFullYear(); vm = n.getUTCMonth(); }
    var now = dhaka(Date.now()), isThis = now.getUTCFullYear() === vy && now.getUTCMonth() === vm;
    var len = new Date(Date.UTC(vy, vm + 1, 0)).getUTCDate(), first = new Date(Date.UTC(vy, vm, 1)).getUTCDay();
    var ev = monthEvents(vy, vm), evDay = {};
    ev.forEach(function(e){ evDay[dhaka(e.t).getUTCDate()] = e; });
    var o = '<div class="hc-nav"><button type="button" id="mcPrev" aria-label="Previous month">\u2039</button><div><b>' + MONL[vm] + ' ' + vy + '</b><small>Moon as seen from Bangladesh</small></div><button type="button" id="mcNext" aria-label="Next month">\u203A</button></div><div class="hc-grid">';
    WD.forEach(function(w, i){ o += '<span class="hc-w' + (i === 5 ? ' fri' : '') + '">' + w + '</span>'; });
    for (var i = 0; i < first; i++) o += '<span class="hc-e"></span>';
    for (var d = 1; d <= len; d++){
      var ph = phaseAt(Date.UTC(vy, vm, d, 12) - OFF), e = evDay[d], dow = (first + d - 1) % 7;
      o += '<span class="hc-d mc' + (dow === 5 ? ' fri' : '') + (isThis && d === now.getUTCDate() ? ' today' : '') + (e ? ' ev' : '') + '"><b>' + d + '</b>' + moonSVG(ph.p, 24) + '<small>' + (e ? PS[e.q] : Math.round(ph.f * 100) + '%') + '</small></span>';
    }
    o += '</div><ul class="hc-ev">';
    if (!ev.length) o += '<li>No main phase this month.</li>';
    ev.forEach(function(e){ o += '<li><b>' + PN[e.q] + '</b><small>' + dlabel(e.t) + ' \u00B7 ' + approx(e.t) + '</small></li>'; });
    o += '</ul><div class="hc-foot"><span>Percent = how much of the moon is lit at noon. Phase times are approximate and can be a few hours off.</span>' + (isThis ? '' : '<button type="button" id="mcToday">This month</button>') + '</div>';
    mBox.innerHTML = o;
    $("mcPrev").onclick = function(){ vm--; if (vm < 0){ vm = 11; vy--; } renderMoon(); };
    $("mcNext").onclick = function(){ vm++; if (vm > 11){ vm = 0; vy++; } renderMoon(); };
    var tb = $("mcToday"); if (tb) tb.onclick = function(){ vy = undefined; renderMoon(); };
  }

  /* ---------- Day length ---------- */
  function sun(y, m, d){
    var doy = Math.round((Date.UTC(y, m, d) - Date.UTC(y, 0, 0)) / DAY), g = 2 * Math.PI / 365 * (doy - 1);
    return {
      eq: 229.18 * (0.000075 + 0.001868 * Math.cos(g) - 0.032077 * Math.sin(g) - 0.014615 * Math.cos(2 * g) - 0.040849 * Math.sin(2 * g)),
      dec: 0.006918 - 0.399912 * Math.cos(g) + 0.070257 * Math.sin(g) - 0.006758 * Math.cos(2 * g) + 0.000907 * Math.sin(2 * g) - 0.002697 * Math.cos(3 * g) + 0.00148 * Math.sin(3 * g)
    };
  }
  function ha(lat, dec){ var c = (Math.sin(-0.833 * RAD) - Math.sin(lat * RAD) * Math.sin(dec)) / (Math.cos(lat * RAD) * Math.cos(dec)); return Math.acos(Math.max(-1, Math.min(1, c))) / RAD; }
  function dayInfo(y, i, L){ var s = sun(y, 0, 1 + i), H = ha(L[1], s.dec), noon = 720 - 4 * L[2] - s.eq + 360; return {len: 8 * H, rise: noon - 4 * H, set: noon + 4 * H}; }
  var dBox;
  function renderDay(){
    if (!dBox) return;
    var L = place(), now = dhaka(Date.now()), y = now.getUTCFullYear(), n = (y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0)) ? 366 : 365;
    var today = Math.round((Date.UTC(y, now.getUTCMonth(), now.getUTCDate()) - Date.UTC(y, 0, 1)) / DAY);
    var arr = [], mn = 1e9, mx = -1, imn = 0, imx = 0;
    for (var i = 0; i < n; i++){ var v = dayInfo(y, i, L).len; arr.push(v); if (v < mn){ mn = v; imn = i; } if (v > mx){ mx = v; imx = i; } }
    var W = 600, Hh = 230, pl = 40, pr = 16, pt = 26, pb = 28, pw = W - pl - pr, ph = Hh - pt - pb;
    var lo = Math.floor(mn / 60), hi = Math.ceil(mx / 60); if (hi - lo < 2) hi = lo + 2;
    function X(i){ return pl + i / (n - 1) * pw; }
    function Y(v){ return pt + (hi * 60 - v) / ((hi - lo) * 60) * ph; }
    var line = "", grid = "", mlab = "";
    arr.forEach(function(v, i){ line += (i ? "L" : "M") + X(i).toFixed(1) + "," + Y(v).toFixed(1); });
    for (var h = lo; h <= hi; h++){ grid += '<line x1="' + pl + '" x2="' + (W - pr) + '" y1="' + Y(h * 60).toFixed(1) + '" y2="' + Y(h * 60).toFixed(1) + '" stroke="var(--line)" ' + (h === 12 ? 'stroke-dasharray="4 4" stroke="var(--muted)"' : '') + '/><text x="' + (pl - 6) + '" y="' + (Y(h * 60) + 4).toFixed(1) + '" text-anchor="end" font-size="11" fill="var(--muted)">' + h + 'h</text>'; }
    for (var mo = 0; mo < 12; mo++){ var di = Math.round((Date.UTC(y, mo, 15) - Date.UTC(y, 0, 1)) / DAY); mlab += '<text x="' + X(di).toFixed(1) + '" y="' + (Hh - 8) + '" text-anchor="middle" font-size="11" fill="var(--muted)">' + MON[mo] + '</text>'; }
    function tag(i, txt, above){ var x = X(i), anc = i < 40 ? "start" : i > n - 40 ? "end" : "middle"; return '<circle cx="' + x.toFixed(1) + '" cy="' + Y(arr[i]).toFixed(1) + '" r="4" fill="var(--bg)" stroke="var(--c)" stroke-width="2"/><text x="' + x.toFixed(1) + '" y="' + (Y(arr[i]) + (above ? -10 : 18)).toFixed(1) + '" text-anchor="' + anc + '" font-size="11.5" fill="var(--ink)">' + txt + '</text>'; }
    var tx = X(today).toFixed(1), ty = Y(arr[today]).toFixed(1);
    var svg = '<svg class="dl-chart" viewBox="0 0 ' + W + ' ' + Hh + '" role="img" aria-label="Day length through ' + y + ' for ' + L[0] + '. Longest ' + hm(mx) + ', shortest ' + hm(mn) + '.">' + grid + mlab +
      '<path d="' + line + 'L' + X(n - 1).toFixed(1) + ',' + (pt + ph) + 'L' + pl + ',' + (pt + ph) + 'Z" fill="var(--c)" opacity=".12"/><path d="' + line + '" fill="none" stroke="var(--c)" stroke-width="2.5"/>' +
      '<line x1="' + tx + '" x2="' + tx + '" y1="' + pt + '" y2="' + (pt + ph) + '" stroke="var(--ink)" stroke-dasharray="3 4" opacity=".7"/>' +
      tag(imx, 'Longest ' + hm(mx), true) + tag(imn, 'Shortest ' + hm(mn), false) +
      '<circle cx="' + tx + '" cy="' + ty + '" r="6" fill="var(--c)" stroke="var(--bg)" stroke-width="2"/><text x="' + tx + '" y="' + (pt - 8) + '" text-anchor="' + (today > n - 40 ? 'end' : today < 40 ? 'start' : 'middle') + '" font-size="11.5" font-weight="700" fill="var(--ink)">Today</text></svg>';
    /* stats */
    var T = dayInfo(y, today, L), prev = today ? arr[today - 1] : arr[n - 1], diffS = Math.round((arr[today] - prev) * 60);
    var dir = arr[(today + 1) % n] - arr[today] >= 0 ? 1 : -1, k = 1;
    while (k < n && ((arr[(today + k + 1) % n] - arr[(today + k) % n] >= 0 ? 1 : -1) === dir)) k++;
    var tms = Date.UTC(y, now.getUTCMonth(), now.getUTCDate()) + k * DAY, td = new Date(tms);
    var change = (diffS >= 0 ? "+" : "\u2212") + Math.floor(Math.abs(diffS) / 60) + "m " + pad(Math.abs(diffS) % 60) + "s";
    var stats = '<div class="dl-stats"><div><small>Daylight today</small><b>' + hm(arr[today]) + '</b></div><div><small>Sunrise \u00B7 Sunset</small><b>' + clockMin(T.rise) + ' \u00B7 ' + clockMin(T.set) + '</b></div>' +
      '<div><small>Change per day</small><b>' + change + '</b></div><div><small>' + (dir > 0 ? 'Longest day in' : 'Shortest day in') + '</small><b>' + k + ' days <i>' + td.getUTCDate() + ' ' + MON[td.getUTCMonth()] + '</i></b></div></div>';
    dBox.innerHTML = svg + stats + '<p class="pr-note">Daylight = sunrise to sunset for ' + L[0] + '. The dashed grey line is 12 hours. The longest day here is about ' + (Math.round((mx - mn) / 30) / 2) + ' hours longer than the shortest.</p>';
  }

  function start(){
    if (!$("facts")) return;
    mBox = card("moonCalGrp", "07 \u2014 MOON CALENDAR", "Moon phases", "\u099A\u09BE\u0981\u09A6\u09C7\u09B0 \u0995\u09B2\u09BE", '<svg viewBox="-12 -12 24 24" aria-hidden="true"><circle r="10" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M0,-10A10,10 0 0 1 0,10A5,10 0 0 0 0,-10Z" fill="currentColor"/></svg>', "var(--moon)", false);
    dBox = card("dayLenGrp", "08 \u2014 DAY LENGTH", "Daylight", "\u09A6\u09BF\u09A8\u09C7\u09B0 \u09A6\u09C8\u09B0\u09CD\u0998\u09CD\u09AF", '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 18h18M6 18a6 6 0 0112 0M12 4v3M4.5 8.5l2 2M19.5 8.5l-2 2"/></svg>', "var(--sun)", true);
    renderMoon(); renderDay();
    var s = $("loc"); if (s) s.addEventListener("change", renderDay);
    setInterval(renderDay, 36e5);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
  window.__md = {phaseAt: phaseAt, monthEvents: monthEvents, dayInfo: dayInfo, moonSVG: moonSVG};
})();

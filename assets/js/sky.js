/* Live Sylhet clock, sun, moon and season panel. All calculations run in the browser; nothing is sent anywhere. */
(function(){
  var TZ = "Asia/Dhaka", RAD = Math.PI / 180, DAY = 864e5, HR = 36e5, OBL = RAD * 23.4397;
  var LOCS = [["Dhaka",23.81,90.41],["Chattogram",22.36,91.78],["Sylhet",24.90,91.87],["Rajshahi",24.37,88.60],["Khulna",22.82,89.55],["Barishal",22.70,90.37],["Rangpur",25.74,89.25],["Mymensingh",24.75,90.41]];
  var LOCBN = ["\u09A2\u09BE\u0995\u09BE","\u099A\u099F\u09CD\u099F\u0997\u09CD\u09B0\u09BE\u09AE","\u09B8\u09BF\u09B2\u09C7\u099F","\u09B0\u09BE\u099C\u09B6\u09BE\u09B9\u09C0","\u0996\u09C1\u09B2\u09A8\u09BE","\u09AC\u09B0\u09BF\u09B6\u09BE\u09B2","\u09B0\u0982\u09AA\u09C1\u09B0","\u09AE\u09AF\u09BC\u09AE\u09A8\u09B8\u09BF\u0982\u09B9"];
  var LOC = 2, OPEN = false; try { var sv = localStorage.getItem("sky.loc"); if (sv !== null) LOC = Math.min(LOCS.length - 1, Math.max(0, +sv || 0)); OPEN = localStorage.getItem("sky.open") === "1"; } catch(e){}
  function $(id){ return document.getElementById(id); }
  function bn(n){ return String(n).replace(/\d/g, function(c){ return "\u09E6\u09E7\u09E8\u09E9\u09EA\u09EB\u09EC\u09ED\u09EE\u09EF"[c]; }); }
/* ASTRO-START */
  function dj(ms){ return ms / DAY + 2440587.5 - 2451545; }
  function sunC(d){
    var M = RAD * (357.5291 + 0.98560028 * d), C = RAD * (1.9148 * Math.sin(M) + 0.02 * Math.sin(2 * M) + 0.0003 * Math.sin(3 * M)), L = M + C + RAD * 102.9372 + Math.PI;
    return {ra:Math.atan2(Math.sin(L) * Math.cos(OBL), Math.cos(L)), dec:Math.asin(Math.sin(OBL) * Math.sin(L)), lam:((L / RAD) % 360 + 360) % 360};
  }
  function moonC(d){
    var L = RAD * (218.316 + 13.176396 * d), M = RAD * (134.963 + 13.064993 * d), F = RAD * (93.272 + 13.22935 * d), l = L + RAD * 6.289 * Math.sin(M), b = RAD * 5.128 * Math.sin(F);
    return {ra:Math.atan2(Math.sin(l) * Math.cos(OBL) - Math.tan(b) * Math.sin(OBL), Math.cos(l)), dec:Math.asin(Math.sin(b) * Math.cos(OBL) + Math.cos(b) * Math.sin(OBL) * Math.sin(l)), dist:385001 - 20905 * Math.cos(M)};
  }
  function altAz(d, c, lat, lon){
    var H = RAD * (280.16 + 360.9856235 * d) + RAD * lon - c.ra, phi = RAD * lat;
    var alt = Math.asin(Math.sin(phi) * Math.sin(c.dec) + Math.cos(phi) * Math.cos(c.dec) * Math.cos(H));
    var az = Math.atan2(Math.sin(H), Math.cos(H) * Math.sin(phi) - Math.tan(c.dec) * Math.cos(phi)) / RAD + 180;
    return {alt:alt / RAD, az:(az % 360 + 360) % 360};
  }
  function sunAA(ms, la, lo){ var d = dj(ms); return altAz(d, sunC(d), la, lo); }
  function moonAA(ms, la, lo){ var d = dj(ms); return altAz(d, moonC(d), la, lo); }
  function illum(ms){
    var d = dj(ms), s = sunC(d), m = moonC(d), sd = 149598000;
    var phi = Math.acos(Math.sin(s.dec) * Math.sin(m.dec) + Math.cos(s.dec) * Math.cos(m.dec) * Math.cos(s.ra - m.ra));
    var inc = Math.atan2(sd * Math.sin(phi), m.dist - sd * Math.cos(phi));
    var ang = Math.atan2(Math.cos(s.dec) * Math.sin(s.ra - m.ra), Math.sin(s.dec) * Math.cos(m.dec) - Math.cos(s.dec) * Math.sin(m.dec) * Math.cos(s.ra - m.ra));
    return {frac:(1 + Math.cos(inc)) / 2, phase:0.5 + 0.5 * inc * (ang < 0 ? -1 : 1) / Math.PI, dist:m.dist};
  }
  function sunDay(t0, la, lo){
    var TH = [-6, -.833, 6], up = {}, dn = {}, best = -99, noon = t0, prev = sunAA(t0, la, lo).alt;
    for (var i = 1; i <= 1440; i++){
      var t = t0 + i * 6e4, a = sunAA(t, la, lo).alt;
      if (a > best){ best = a; noon = t; }
      for (var k = 0; k < 3; k++){
        var th = TH[k];
        if (prev < th && a >= th) up[k] = t - 6e4 + 6e4 * (th - prev) / (a - prev);
        else if (prev >= th && a < th) dn[k] = t - 6e4 + 6e4 * (th - prev) / (a - prev);
      }
      prev = a;
    }
    return {dawn:up[0], rise:up[1], gmEnd:up[2], geStart:dn[2], set:dn[1], dusk:dn[0], noon:noon, peak:best};
  }
  function moonDay(t0, la, lo){
    var rise = null, set = null, prev = moonAA(t0, la, lo).alt - .133;
    for (var i = 1; i <= 1080; i++){
      var t = t0 + i * 12e4, a = moonAA(t, la, lo).alt - .133;
      if (prev < 0 && a >= 0 && rise === null) rise = t - 12e4 + 12e4 * (-prev) / (a - prev);
      if (prev >= 0 && a < 0 && set === null) set = t - 12e4 + 12e4 * (-prev) / (a - prev);
      prev = a;
    }
    return {rise:rise, set:set};
  }
  function nextPhase(now, target){
    function f(t){ return ((illum(t).phase - target + 1.5) % 1) - .5; }
    var a = now, fa = f(a);
    for (var i = 0; i < 130; i++){
      var b = a + 6 * HR, fb = f(b);
      if (fa < 0 && fb >= 0){ var lo = a, hi = b; for (var k = 0; k < 22; k++){ var mid = (lo + hi) / 2; if (f(mid) < 0) lo = mid; else hi = mid; } return hi; }
      a = b; fa = fb;
    }
    return null;
  }
  function nextSeason(now){
    var l0 = sunC(dj(now)).lam, target = (Math.floor(l0 / 90) + 1) * 90 % 360, t = now + ((target - l0 + 360) % 360) / .9856 * DAY;
    for (var k = 0; k < 6; k++){ var diff = ((target - sunC(dj(t)).lam + 540) % 360) - 180; t += diff / .9856 * DAY; }
    var info = {0:["March equinox","day and night nearly equal"],90:["June solstice","longest day in the north"],180:["September equinox","day and night nearly equal"],270:["December solstice","shortest day in the north"]}[target];
    return {t:t, name:info[0], note:info[1]};
  }
  /* ASTRO-END */
  var bMonth = 0;
  function banga(d){
    var p = {};
    new Intl.DateTimeFormat("en-US",{timeZone:TZ,year:"numeric",month:"numeric",day:"numeric"}).formatToParts(d).forEach(function(x){ p[x.type] = +x.value; });
    var y = p.year, sy = (p.month > 4 || (p.month === 4 && p.day >= 14)) ? y : y - 1;
    var days = Math.round((Date.UTC(y, p.month - 1, p.day) - Date.UTC(sy, 3, 14)) / DAY);
    var fy = sy + 1, leap = (fy % 4 === 0 && fy % 100 !== 0) || fy % 400 === 0;
    var len = [31,31,31,31,31,31,30,30,30,30, leap ? 30 : 29, 30], i = 0;
    while (i < 11 && days >= len[i]){ days -= len[i]; i++; }
    bMonth = i;
    var mn = ["বৈশাখ","জ্যৈষ্ঠ","আষাঢ়","শ্রাবণ","ভাদ্র","আশ্বিন","কার্তিক","অগ্রহায়ণ","পৌষ","মাঘ","ফাল্গুন","চৈত্র"];
    var bn = function(n){ return String(n).replace(/\d/g, function(c){ return "০১২৩৪৫৬৭৮৯"[c]; }); };
    return bn(days + 1) + " " + mn[i] + " " + bn(sy - 593) + " বঙ্গাব্দ";
  }

  function ck(ms){ return ms ? new Date(ms).toLocaleTimeString("en-US",{timeZone:TZ,hour:"numeric",minute:"2-digit"}) : "none"; }
  function dd(ms){ return ms ? new Date(ms).toLocaleDateString("en-US",{timeZone:TZ,weekday:"short",day:"numeric",month:"short"}) : "-"; }
  function span(ms){ var m = Math.max(0, Math.round(ms / 6e4)); return Math.floor(m / 60) + "h " + (m % 60) + "m"; }
  function fmtT(h, mi){ return (h % 12 || 12) + ":" + ("0" + mi).slice(-2) + (h < 12 ? " AM" : " PM"); }
  function fmtAt(ms){ return new Date(ms).toLocaleString("en-US",{timeZone:TZ,weekday:"short",day:"numeric",month:"short",hour:"numeric",minute:"2-digit"}); }
  function mix(a, b, t){ return a.map(function(v, i){ return Math.round(v + (b[i] - v) * t); }); }
  function rgb(c){ return "rgb(" + c.join(",") + ")"; }
  var KF = [[-18,[7,11,36],[16,24,62]],[-8,[24,34,88],[70,60,120]],[-2,[60,70,150],[232,120,90]],[2,[90,125,205],[255,184,110]],[10,[80,150,225],[190,222,250]],[40,[40,125,215],[140,200,245]],[90,[30,110,205],[130,195,242]]];
  function skyCols(alt){
    var a = Math.max(-18, Math.min(90, alt));
    for (var i = 1; i < KF.length; i++){ if (a <= KF[i][0]){ var k = KF[i-1], n = KF[i], t = (a - k[0]) / (n[0] - k[0]); return [mix(k[1], n[1], t), mix(k[2], n[2], t)]; } }
    return [KF[6][1], KF[6][2]];
  }
  function moonDraw(g, r, p){
    g.textContent = "";
    var ns = "http://www.w3.org/2000/svg", c = document.createElementNS(ns, "circle");
    c.setAttribute("r", r); c.setAttribute("fill", "#2a3260"); g.appendChild(c);
    var pw = p < .5 ? p : 1 - p, rx = r * Math.abs(Math.cos(2 * Math.PI * pw)), sw = pw < .25 ? 0 : 1;
    var pa = document.createElementNS(ns, "path");
    pa.setAttribute("d", "M0 " + (-r) + " A" + r + " " + r + " 0 0 1 0 " + r + " A" + rx.toFixed(2) + " " + r + " 0 0 " + sw + " 0 " + (-r) + "Z");
    pa.setAttribute("fill", "#f4f1de"); if (p >= .5) pa.setAttribute("transform", "scale(-1,1)");
    g.appendChild(pa);
  }
  function phaseName(p){ return p < .03 || p > .97 ? "New moon" : p < .22 ? "Waxing crescent" : p < .28 ? "First quarter" : p < .47 ? "Waxing gibbous" : p < .53 ? "Full moon" : p < .72 ? "Waning gibbous" : p < .78 ? "Last quarter" : "Waning crescent"; }
  window.SkyAstro = {illum: illum, moonAA: moonAA, sunAA: sunAA};
  function rows(id, list){
    var box = $(id); box.textContent = "";
    list.forEach(function(it){
      var r = document.createElement("div"); r.className = "row";
      var l = document.createElement("span"); l.textContent = it[0];
      var v = document.createElement("b"); v.textContent = it[1];
      r.appendChild(l); r.appendChild(v); box.appendChild(r);
      if (it[2] !== undefined){ var b = document.createElement("div"); b.className = "bar"; var i = document.createElement("i"); i.style.width = it[2] + "%"; b.appendChild(i); box.appendChild(b); }
    });
  }


  /* Weather look for the sun arc: live data from Open-Meteo, or a manual preview. */
  var WXN = {sunny:["Sunny","\u09B0\u09CB\u09A6\u09C7\u09B2\u09BE"], cloudy:["Cloudy","\u09AE\u09C7\u0998\u09B2\u09BE"], rain:["Rain","\u09AC\u09C3\u09B7\u09CD\u099F\u09BF"], fog:["Fog","\u0995\u09C1\u09AF\u09BC\u09BE\u09B6\u09BE"], winter:["Winter","\u09B6\u09C0\u09A4"]};
  var WX = {mode:"auto", live:null, err:false, kind:""};
  try { var wm = localStorage.getItem("sky.wx"); if (wm && WXN[wm]) WX.mode = wm; } catch(e){}
  var SVGNS = "http://www.w3.org/2000/svg";
  function wr(i){ var x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
  function wel(tag, at, par){ var e = document.createElementNS(SVGNS, tag); for (var k in at) e.setAttribute(k, at[k]); if (par) par.appendChild(e); return e; }
  function wxFrom(L){
    var c = L.code, t = L.temp;
    if ((c >= 51 && c <= 67) || (c >= 80 && c <= 82) || c >= 95) return "rain";
    if (c === 45 || c === 48) return "fog";
    if ((c >= 71 && c <= 77) || c === 85 || c === 86) return "winter";
    if (t !== null && t !== undefined && t <= 14) return "winter";
    if (c === 3 || L.cloud >= 75) return "cloudy";
    return "sunny";
  }
  function wxCloud(g, y, scale, fill, op, d, s){
    var o = wel("g", {transform:"translate(0," + y + ")"}, g), c = wel("g", {"class":"wx-cloud", style:"--d:" + d + "s;--s:-" + s + "s"}, o);
    var k = wel("g", {transform:"scale(" + scale + ")", fill:fill, opacity:op}, c);
    wel("ellipse", {cx:0, cy:0, rx:26, ry:9}, k); wel("circle", {cx:-8, cy:-6, r:10}, k); wel("circle", {cx:8, cy:-9, r:13}, k); wel("circle", {cx:19, cy:-3, r:8}, k);
  }
  function wxBuild(kind){
    var g = $("wxFx"), i, e; g.textContent = "";
    if (kind === "sunny"){
      var st = wel("g", {"class":"wx-stars"}, g);
      for (i = 0; i < 16; i++) wel("circle", {"class":"wx-star", cx:(10 + wr(i) * 280).toFixed(1), cy:(6 + wr(i + 40) * 70).toFixed(1), r:(.6 + wr(i + 80) * .7).toFixed(2), fill:"#fff", style:"animation-delay:-" + (wr(i + 9) * 3).toFixed(2) + "s"}, st);
      var ro = wel("g", {"class":"wx-rays", id:"wxRays", transform:"translate(" + (WX.sx || 20) + "," + (WX.sy || 100) + ")"}, g), rs = wel("g", {"class":"wx-spin"}, ro);
      for (i = 0; i < 12; i++){ var a = i * Math.PI / 6, r1 = 15, r2 = i % 2 ? 22 : 26; wel("line", {x1:(Math.cos(a) * r1).toFixed(2), y1:(Math.sin(a) * r1).toFixed(2), x2:(Math.cos(a) * r2).toFixed(2), y2:(Math.sin(a) * r2).toFixed(2), stroke:"var(--sun)", "stroke-width":1.6, "stroke-linecap":"round", opacity:.75}, rs); }
    } else if (kind === "cloudy"){
      wxCloud(g, 30, 1, "#c4cfd6", .6, 60, 12); wxCloud(g, 55, .8, "#aebac2", .5, 80, 50); wxCloud(g, 18, .7, "#d3dce1", .5, 70, 30);
    } else if (kind === "rain"){
      wel("rect", {x:0, y:0, width:300, height:100, fill:"#4d5b68", opacity:.38}, g);
      wxCloud(g, 16, 1.5, "#5f6d79", .85, 90, 10); wxCloud(g, 22, 1.3, "#6c7b87", .8, 70, 45);
      for (i = 0; i < 30; i++){ var x = (4 + wr(i) * 292).toFixed(1); wel("line", {"class":"wx-drop", x1:x, y1:0, x2:(x - 1.6).toFixed(1), y2:7, stroke:"#9fd2f0", "stroke-width":1, "stroke-linecap":"round", opacity:.8, transform:"translate(0," + (wr(i + 5) * 100).toFixed(0) + ")", style:"--d:" + (.55 + wr(i + 20) * .4).toFixed(2) + "s;--s:-" + (wr(i + 60)).toFixed(2) + "s"}, g); }
    } else if (kind === "fog"){
      wel("rect", {x:0, y:0, width:300, height:100, fill:"#dfe7ea", opacity:.3}, g);
      var fb = wel("g", {filter:"url(#wxBlur)"}, g);
      [[28,125,10,.5,11],[48,150,12,.55,14],[68,130,11,.5,9],[88,160,12,.6,13]].forEach(function(f, n){
        var o = wel("g", {transform:"translate(" + (n % 2 ? 130 : 160) + "," + f[0] + ")"}, fb);
        wel("ellipse", {"class":"wx-fog", cx:0, cy:0, rx:f[1], ry:f[2], fill:"#eef3f5", opacity:f[3], style:"--d:" + f[4] + "s;--s:-" + n * 3 + "s"}, o);
      });
    } else if (kind === "winter"){
      wel("rect", {x:0, y:0, width:300, height:100, fill:"#bfe3ff", opacity:.16}, g);
      for (i = 0; i < 34; i++) wel("circle", {"class":"wx-flake", cx:(4 + wr(i + 3) * 292).toFixed(1), cy:0, r:(.8 + wr(i + 30) * 1.1).toFixed(2), fill:"#fff", opacity:.92, transform:"translate(0," + (wr(i + 7) * 100).toFixed(0) + ")", style:"--d:" + (3.2 + wr(i + 50) * 3).toFixed(2) + "s;--s:-" + (wr(i + 70) * 6).toFixed(2) + "s;--sw:" + ((wr(i + 90) - .5) * 24).toFixed(1) + "px"}, g);
      wel("rect", {x:0, y:96, width:300, height:4, fill:"#fff", opacity:.7}, g);
    }
  }
  function wxApply(){
    var kind = WX.mode !== "auto" ? WX.mode : (WX.live ? wxFrom(WX.live) : ""), arc = $("arc"), msg = $("wxNow");
    if (kind !== WX.kind){ WX.kind = kind; wxBuild(kind); }
    if (kind) arc.setAttribute("data-wx", kind); else arc.removeAttribute("data-wx");
    var n = kind ? WXN[kind] : null, tmp = WX.live && WX.live.temp !== null ? Math.round(WX.live.temp) + "\u00b0C" : "";
    if (WX.mode !== "auto") msg.textContent = "Preview: " + n[0] + " \u00b7 " + n[1] + (tmp ? " (live now: " + tmp + ")" : "");
    else if (WX.live) msg.textContent = "Weather now: " + n[0] + " \u00b7 " + n[1] + (tmp ? ", " + tmp : "");
    else msg.textContent = WX.err ? "Live weather is unavailable. Pick a look below to preview it." : "Checking live weather\u2026";
    Array.prototype.forEach.call($("wxPick").children, function(b){ b.setAttribute("aria-pressed", b.getAttribute("data-k") === WX.mode); });
  }
  function wxSun(x, y, day){
    WX.sx = x.toFixed(1); WX.sy = y.toFixed(1);
    $("arc").setAttribute("data-night", day ? "0" : "1");
    var r = $("wxRays"); if (r) r.setAttribute("transform", "translate(" + x.toFixed(1) + "," + y.toFixed(1) + ")");
  }
  function wxLoad(){
    var i = LOC;
    if (!window.fetch){ WX.err = true; wxApply(); return; }
    fetch("https://api.open-meteo.com/v1/forecast?latitude=" + LOCS[i][1] + "&longitude=" + LOCS[i][2] + "&current=temperature_2m,weather_code,cloud_cover&timezone=Asia%2FDhaka")
      .then(function(r){ return r.ok ? r.json() : Promise.reject(); })
      .then(function(j){ if (i !== LOC) return; var c = j.current; WX.live = {code:c.weather_code, temp:c.temperature_2m, cloud:c.cloud_cover}; WX.err = false; wxApply(); })
      .catch(function(){ if (i !== LOC) return; WX.live = null; WX.err = true; wxApply(); });
  }
  (function(){
    var pk = $("wxPick");
    [["auto","Auto \u00b7 \u09B8\u09CD\u09AC\u09DF\u0982\u0995\u09CD\u09B0\u09BF\u09DF"]].concat(Object.keys(WXN).map(function(k){ return [k, WXN[k][0] + " \u00b7 " + WXN[k][1]]; })).forEach(function(it){
      var b = document.createElement("button"); b.type = "button"; b.setAttribute("data-k", it[0]); b.textContent = it[1];
      b.addEventListener("click", function(){ WX.mode = it[0]; try { localStorage.setItem("sky.wx", it[0]); } catch(e){} wxApply(); });
      pk.appendChild(b);
    });
  })();

  var locSel = $("loc"), S = null, skyKey = "", M = null;
  LOCS.forEach(function(l, i){ var o = document.createElement("option"); o.value = i; o.textContent = l[0] + " \u00b7 " + LOCBN[i]; locSel.appendChild(o); });
  locSel.value = LOC;
  locSel.addEventListener("change", function(){ LOC = +locSel.value; try { localStorage.setItem("sky.loc", LOC); } catch(e){} skyKey = ""; WX.live = null; WX.err = false; wxApply(); wxLoad(); renderSky(new Date()); });
  var dirs = ["N","NE","E","SE","S","SW","W","NW"], dirBn = ["\u0989\u09A4\u09CD\u09A4\u09B0","\u0989\u09A4\u09CD\u09A4\u09B0-\u09AA\u09C2\u09B0\u09CD\u09AC","\u09AA\u09C2\u09B0\u09CD\u09AC","\u09A6\u0995\u09CD\u09B7\u09BF\u09A3-\u09AA\u09C2\u09B0\u09CD\u09AC","\u09A6\u0995\u09CD\u09B7\u09BF\u09A3","\u09A6\u0995\u09CD\u09B7\u09BF\u09A3-\u09AA\u09B6\u09CD\u099A\u09BF\u09AE","\u09AA\u09B6\u09CD\u099A\u09BF\u09AE","\u0989\u09A4\u09CD\u09A4\u09B0-\u09AA\u09B6\u09CD\u099A\u09BF\u09AE"];
  var MIC = ["\uD83C\uDF11","\uD83C\uDF12","\uD83C\uDF13","\uD83C\uDF14","\uD83C\uDF15","\uD83C\uDF16","\uD83C\uDF17","\uD83C\uDF18"];
  var PHBN = {"New moon":"\u0985\u09AE\u09BE\u09AC\u09B8\u09CD\u09AF\u09BE","Waxing crescent":"\u09B6\u09C1\u0995\u09CD\u09B2\u09AA\u0995\u09CD\u09B7\u09C7\u09B0 \u09AC\u09BE\u0981\u0995\u09BE \u099A\u09BE\u0981\u09A6","First quarter":"\u09AA\u09CD\u09B0\u09A5\u09AE \u099A\u09A4\u09C1\u09B0\u09CD\u09A5\u09BE\u0982\u09B6","Waxing gibbous":"\u09AC\u09B0\u09CD\u09A7\u09AE\u09BE\u09A8 \u099A\u09BE\u0981\u09A6 (\u09AA\u09CD\u09B0\u09BE\u09AF\u09BC \u09AA\u09C2\u09B0\u09CD\u09A3)","Full moon":"\u09AA\u09C2\u09B0\u09CD\u09A3\u09BF\u09AE\u09BE","Waning gibbous":"\u0995\u09CD\u09B7\u09AF\u09BC\u09BF\u09B7\u09CD\u09A3\u09C1 \u099A\u09BE\u0981\u09A6 (\u09AA\u09CD\u09B0\u09BE\u09AF\u09BC \u09AA\u09C2\u09B0\u09CD\u09A3)","Last quarter":"\u09B6\u09C7\u09B7 \u099A\u09A4\u09C1\u09B0\u09CD\u09A5\u09BE\u0982\u09B6","Waning crescent":"\u0995\u09C3\u09B7\u09CD\u09A3\u09AA\u0995\u09CD\u09B7\u09C7\u09B0 \u09AC\u09BE\u0981\u0995\u09BE \u099A\u09BE\u0981\u09A6"};
  var NSBN = {"March equinox":["\u09AE\u09BE\u09B0\u09CD\u099A \u09AC\u09BF\u09B7\u09C1\u09AC","\u09A6\u09BF\u09A8-\u09B0\u09BE\u09A4 \u09AA\u09CD\u09B0\u09BE\u09AF\u09BC \u09B8\u09AE\u09BE\u09A8"],"June solstice":["\u099C\u09C1\u09A8 \u0985\u09AF\u09BC\u09A8\u09BE\u09A8\u09CD\u09A4","\u0989\u09A4\u09CD\u09A4\u09B0\u09C7 \u09B8\u09AC\u099A\u09C7\u09AF\u09BC\u09C7 \u09AC\u09A1\u09BC \u09A6\u09BF\u09A8"],"September equinox":["\u09B8\u09C7\u09AA\u09CD\u099F\u09C7\u09AE\u09CD\u09AC\u09B0 \u09AC\u09BF\u09B7\u09C1\u09AC","\u09A6\u09BF\u09A8-\u09B0\u09BE\u09A4 \u09AA\u09CD\u09B0\u09BE\u09AF\u09BC \u09B8\u09AE\u09BE\u09A8"],"December solstice":["\u09A1\u09BF\u09B8\u09C7\u09AE\u09CD\u09AC\u09B0 \u0985\u09AF\u09BC\u09A8\u09BE\u09A8\u09CD\u09A4","\u0989\u09A4\u09CD\u09A4\u09B0\u09C7 \u09B8\u09AC\u099A\u09C7\u09AF\u09BC\u09C7 \u099B\u09CB\u099F \u09A6\u09BF\u09A8"]};
  function spanBn(ms){ var m = Math.max(0, Math.round(ms / 6e4)); return bn(Math.floor(m / 60)) + " \u0998\u09A3\u09CD\u099F\u09BE " + bn(m % 60) + " \u09AE\u09BF\u09A8\u09BF\u099F"; }
  var PHASE_BN = {"Morning":"\u09B8\u0995\u09BE\u09B2","Afternoon":"\u09AC\u09BF\u0995\u09C7\u09B2","Morning golden hour":"\u09B8\u0995\u09BE\u09B2\u09C7\u09B0 \u09B8\u09CB\u09A8\u09BE\u09B2\u09BF \u0986\u09B2\u09CB","Evening golden hour":"\u09AC\u09BF\u0995\u09C7\u09B2\u09C7\u09B0 \u09B8\u09CB\u09A8\u09BE\u09B2\u09BF \u0986\u09B2\u09CB","Dawn twilight":"\u09AD\u09CB\u09B0\u09C7\u09B0 \u0997\u09CB\u09A7\u09C2\u09B2\u09BF","Dusk twilight":"\u09B8\u09A8\u09CD\u09A7\u09CD\u09AF\u09BE\u09B0 \u0997\u09CB\u09A7\u09C2\u09B2\u09BF","Night":"\u09B0\u09BE\u09A4"};

  function renderSky(d){
    var now = d.getTime(), la = LOCS[LOC][1], lo = LOCS[LOC][2];
    var f = new Intl.DateTimeFormat("en-CA",{timeZone:TZ,year:"numeric",month:"2-digit",day:"2-digit"}).format(d);
    var y = +f.slice(0,4), mo = +f.slice(5,7), dy = +f.slice(8,10), key = f + "|" + LOC, t0 = Date.UTC(y, mo - 1, dy) - 216e5;
    if (key !== skyKey){ skyKey = key; S = {y:sunDay(t0 - DAY, la, lo), t:sunDay(t0, la, lo), n:sunDay(t0 + DAY, la, lo)}; M = {mv:moonDay(t0, la, lo), full:nextPhase(now, .5), nw:nextPhase(now, 0), ns:nextSeason(now)}; }
    var T = S.t, sp = sunAA(now, la, lo), mp = moonAA(now, la, lo), il = illum(now), age = il.phase * 29.530588853, day = now >= T.rise && now <= T.set, x, yy;
    if (day){ var fr = (now - T.rise) / (T.set - T.rise); x = 20 + 260 * fr; yy = 100 - 240 * fr * (1 - fr); }
    else { var a0 = now < T.rise ? S.y.set : T.set, b0 = now < T.rise ? T.rise : S.n.rise, g = Math.max(0, Math.min(1, (now - a0) / (b0 - a0))); x = 280 - 260 * g; yy = 100 + 80 * g * (1 - g); }
    var dot = $("sunDot"), glow = $("sunGlow"), bg = $("skyBg"), md = $("moonDot");
    [dot, glow].forEach(function(el){ el.setAttribute("cx", x); el.setAttribute("cy", yy); });
    dot.setAttribute("fill", day ? "var(--sun)" : "var(--muted)"); glow.setAttribute("opacity", day ? ".25" : "0");
    bg.setAttribute("fill", sp.alt > 6 ? "#ffd27a" : sp.alt > -6 ? "#ff8a4d" : "#3a4bd0"); bg.setAttribute("opacity", sp.alt > 6 ? ".14" : sp.alt > -6 ? ".18" : ".25");
    wxSun(x, yy, day); md.setAttribute("cx", 20 + 260 * Math.max(0, Math.min(1, (mp.az - 60) / 240))); md.setAttribute("cy", 100 - Math.min(mp.alt, 90) * 1.05); md.setAttribute("opacity", mp.alt > 0 ? 1 : 0); document.documentElement.style.setProperty("--tint", rgb(skyCols(sp.alt)[1]));

    var am = now < T.noon, di = Math.round(sp.az / 45) % 8;
    var phase = sp.alt > 6 ? (am ? "Morning" : "Afternoon") : sp.alt > -.833 ? (am ? "Morning golden hour" : "Evening golden hour") : sp.alt > -6 ? (am ? "Dawn twilight" : "Dusk twilight") : "Night";
    var up = now < T.rise ? ["Sunrise","\u09B8\u09C2\u09B0\u09CD\u09AF\u09CB\u09A6\u09AF\u09BC", T.rise] : now < T.set ? ["Sunset","\u09B8\u09C2\u09B0\u09CD\u09AF\u09BE\u09B8\u09CD\u09A4", T.set] : ["Sunrise","\u09B8\u09C2\u09B0\u09CD\u09AF\u09CB\u09A6\u09AF\u09BC", S.n.rise], ar = Math.abs(Math.round(sp.alt));
    $("nowEn").textContent = phase + ". Sun " + ar + "\u00b0 " + (sp.alt >= 0 ? "above" : "below") + " horizon, toward " + dirs[di] + ". " + up[0] + " in " + span(up[2] - now) + ".";
    $("nowBn").textContent = PHASE_BN[phase] + "\u0964 \u09B8\u09C2\u09B0\u09CD\u09AF \u09A6\u09BF\u0997\u09A8\u09CD\u09A4\u09C7\u09B0 " + bn(ar) + "\u00b0 " + (sp.alt >= 0 ? "\u0989\u09AA\u09B0\u09C7" : "\u09A8\u09BF\u099A\u09C7") + ", " + dirBn[di] + " \u09A6\u09BF\u0995\u09C7\u0964 " + up[1] + " \u09B9\u09A4\u09C7 " + spanBn(up[2] - now) + " \u09AC\u09BE\u0995\u09BF\u0964";

    var pc = function(ms){ return Math.max(0, Math.min(100, (ms - t0) / DAY * 100)).toFixed(2) + "%"; };
    var N = "#1b2455", W = "#e08a5a", D = "#7cc2f5";
    $("daybar").style.background = "linear-gradient(90deg," + N + " " + pc(T.dawn) + "," + W + " " + pc(T.dawn) + "," + W + " " + pc(T.rise) + "," + D + " " + pc(T.rise) + "," + D + " " + pc(T.set) + "," + W + " " + pc(T.set) + "," + W + " " + pc(T.dusk) + "," + N + " " + pc(T.dusk) + ")";
    $("nowMark").style.left = pc(now);

    var len = T.set - T.rise, dl = Math.round((len - (S.y.set - S.y.rise)) / 1e3), adl = Math.abs(dl), mv = M.mv, ns = M.ns, nb = NSBN[ns.name];
    var shadow = sp.alt > 2 ? (1 / Math.tan(sp.alt * RAD)).toFixed(1) + " m" : "none";
    var seasons = [["\u0997\u09CD\u09B0\u09C0\u09B7\u09CD\u09AE","Grishma, summer"],["\u09AC\u09B0\u09CD\u09B7\u09BE","Barsha, monsoon"],["\u09B6\u09B0\u09CE","Sharat, autumn"],["\u09B9\u09C7\u09AE\u09A8\u09CD\u09A4","Hemanta, late autumn"],["\u09B6\u09C0\u09A4","Sheet, winter"],["\u09AC\u09B8\u09A8\u09CD\u09A4","Boshonto, spring"]], se = seasons[Math.floor(bMonth / 2)];
    var doy = Math.round((Date.UTC(y, mo - 1, dy) - Date.UTC(y, 0, 1)) / DAY) + 1, tot = ((y % 4 === 0 && y % 100 !== 0) || y % 400 === 0) ? 366 : 365, dayPct = Math.round((now - t0) / DAY * 100), pm = phaseName(il.phase);
    var tm = function(ms){ return ms ? ck(ms) : "none today"; }, tmb = function(ms){ return !ms ? "\u0986\u099C \u09A8\u09C7\u0987" : ms >= t0 + DAY ? "\u0986\u0997\u09BE\u09AE\u09C0\u0995\u09BE\u09B2" : ""; };
    var SUN = "var(--accent)", MON = "var(--moon)", YR = "var(--yr)";
    // [English, Bangla, value, Bangla note, colour, bar, core]
    var list = [
      ["Sunrise","\u09B8\u09C2\u09B0\u09CD\u09AF\u09CB\u09A6\u09AF\u09BC", ck(T.rise), "", SUN, , 1],
      ["Sunset","\u09B8\u09C2\u09B0\u09CD\u09AF\u09BE\u09B8\u09CD\u09A4", ck(T.set), "", SUN, , 1],
      ["Day length","\u09A6\u09BF\u09A8\u09C7\u09B0 \u09A6\u09C8\u09B0\u09CD\u0998\u09CD\u09AF", span(len), "\u0997\u09A4\u0995\u09BE\u09B2\u09C7\u09B0 \u099A\u09C7\u09AF\u09BC\u09C7 " + bn(Math.floor(adl / 60)) + " \u09AE\u09BF " + bn(adl % 60) + " \u09B8\u09C7 " + (dl >= 0 ? "\u09AC\u09C7\u09B6\u09BF" : "\u0995\u09AE"), SUN, , 1],
      ["Daylight left","\u09AC\u09BE\u0995\u09BF \u09A6\u09BF\u09A8\u09C7\u09B0 \u0986\u09B2\u09CB", day ? span(T.set - now) : "none", day ? "\u09B8\u09C2\u09B0\u09CD\u09AF\u09BE\u09B8\u09CD\u09A4 \u09AA\u09B0\u09CD\u09AF\u09A8\u09CD\u09A4" : "\u09B8\u09C2\u09B0\u09CD\u09AF \u0985\u09B8\u09CD\u09A4", SUN, , 1],
      ["Solar noon","\u09B8\u09C2\u09B0\u09CD\u09AF \u09AE\u09A7\u09CD\u09AF\u0997\u0997\u09A8\u09C7", ck(T.noon), "\u09B8\u09B0\u09CD\u09AC\u09CB\u099A\u09CD\u099A " + bn(Math.round(T.peak)) + "\u00b0 \u0989\u0981\u099A\u09C1\u09A4\u09C7", SUN],
      ["Sun now","\u09B8\u09C2\u09B0\u09CD\u09AF \u098F\u0996\u09A8", ar + "\u00b0 " + (sp.alt >= 0 ? "up" : "down"), dirBn[di] + " \u09A6\u09BF\u0995\u09C7", SUN],
      ["Morning golden hour ends","\u09B8\u0995\u09BE\u09B2\u09C7\u09B0 \u09B8\u09CB\u09A8\u09BE\u09B2\u09BF \u0986\u09B2\u09CB \u09B6\u09C7\u09B7", ck(T.gmEnd), "", SUN],
      ["Evening golden hour","\u09AC\u09BF\u0995\u09C7\u09B2\u09C7\u09B0 \u09B8\u09CB\u09A8\u09BE\u09B2\u09BF \u0986\u09B2\u09CB", ck(T.geStart), "\u09B8\u09C2\u09B0\u09CD\u09AF\u09BE\u09B8\u09CD\u09A4 \u09AA\u09B0\u09CD\u09AF\u09A8\u09CD\u09A4", SUN],
      ["First and last light","\u09AA\u09CD\u09B0\u09A5\u09AE \u0993 \u09B6\u09C7\u09B7 \u0986\u09B2\u09CB", ck(T.dawn) + " / " + ck(T.dusk), "\u09B8\u09BF\u09AD\u09BF\u09B2 \u0997\u09CB\u09A7\u09C2\u09B2\u09BF", SUN],
      ["Shadow of a 1 m stick","\u09E7 \u09AE\u09BF\u099F\u09BE\u09B0 \u09B2\u09BE\u09A0\u09BF\u09B0 \u099B\u09BE\u09AF\u09BC\u09BE", shadow, sp.alt > 2 ? "\u098F\u0996\u09A8" : "\u09B8\u09C2\u09B0\u09CD\u09AF \u09A8\u09BF\u099A\u09C1 \u09AC\u09BE \u0985\u09B8\u09CD\u09A4", SUN],
      ["Moon","\u099A\u09BE\u0981\u09A6", MIC[Math.floor(il.phase * 8 + .5) % 8] + " " + pm, PHBN[pm] + ", " + bn(Math.round(il.frac * 100)) + "% \u0986\u09B2\u09CB\u0995\u09BF\u09A4, " + bn(age.toFixed(1)) + " \u09A6\u09BF\u09A8", MON, , 1],
      ["Moonrise","\u099A\u09BE\u0981\u09A6 \u0993\u09A0\u09BE", tm(mv.rise), tmb(mv.rise), MON, , 1],
      ["Moonset","\u099A\u09BE\u0981\u09A6 \u09A1\u09CB\u09AC\u09BE", tm(mv.set), tmb(mv.set), MON, , 1],
      ["Moon now","\u099A\u09BE\u0981\u09A6 \u098F\u0996\u09A8", mp.alt > 0 ? Math.round(mp.alt) + "\u00b0 up" : "below horizon", mp.alt > 0 ? dirBn[Math.round(mp.az / 45) % 8] + " \u09A6\u09BF\u0995\u09C7" : "\u09A6\u09BF\u0997\u09A8\u09CD\u09A4\u09C7\u09B0 \u09A8\u09BF\u099A\u09C7", MON],
      ["Distance","\u09A6\u09C2\u09B0\u09A4\u09CD\u09AC", Math.round(il.dist).toLocaleString("en-US") + " km", "\u09AA\u09C3\u09A5\u09BF\u09AC\u09C0 \u09A5\u09C7\u0995\u09C7", MON],
      ["Next full moon","\u09AA\u09B0\u09AC\u09B0\u09CD\u09A4\u09C0 \u09AA\u09C2\u09B0\u09CD\u09A3\u09BF\u09AE\u09BE", dd(M.full), ck(M.full), MON],
      ["Next new moon","\u09AA\u09B0\u09AC\u09B0\u09CD\u09A4\u09C0 \u0985\u09AE\u09BE\u09AC\u09B8\u09CD\u09AF\u09BE", dd(M.nw), ck(M.nw), MON],
      ["Season","\u098B\u09A4\u09C1", se[0], se[1], YR, , 1],
      [ns.name, nb[0], dd(ns.t), bn(Math.max(0, Math.round((ns.t - now) / DAY))) + " \u09A6\u09BF\u09A8 \u09AC\u09BE\u0995\u09BF, " + nb[1], YR],
      ["Today","\u0986\u099C", dayPct + "% done", spanBn(t0 + DAY - now) + " \u09AC\u09BE\u0995\u09BF", YR, dayPct, 1],
      ["Year " + y,"\u09AC\u099B\u09B0 " + bn(y), "Day " + doy + " of " + tot, bn(tot - doy) + " \u09A6\u09BF\u09A8 \u09AC\u09BE\u0995\u09BF, " + bn(Math.round(doy / tot * 100)) + "% \u09B6\u09C7\u09B7", YR, doy / tot * 100]
    ];
    $("sbWhere").textContent = LOCS[LOC][0] + " \u00b7 UTC+6";
    $("chipSunTxt").textContent = day ? "Sunset " + ck(T.set) + " \u00b7 " + span(T.set - now) + " left" : "Sunrise " + ck(now < T.rise ? T.rise : S.n.rise);
    $("chipMoonTxt").textContent = pm + " \u00b7 " + Math.round(il.frac * 100) + "%"; moonDraw($("moonMini"), 34, il.phase);
    $("chipYrTxt").textContent = se[1].split(",")[0] + " \u00b7 " + se[0];
    var boxes = [$("rSun"), $("rMoon"), $("rYear")]; boxes.forEach(function(bx){ bx.textContent = ""; });
    list.forEach(function(it){
      var r = document.createElement("div"); r.className = "row" + (it[6] ? "" : " x");
      var l = document.createElement("div"); l.className = "l";
      var e = document.createElement("span"); e.textContent = it[0]; var lb = document.createElement("small"); lb.textContent = it[1]; l.appendChild(e); l.appendChild(lb);
      var rt = document.createElement("div"); rt.className = "rt"; var v = document.createElement("b"); v.textContent = it[2]; rt.appendChild(v);
      if (it[3]){ var s = document.createElement("small"); s.textContent = it[3]; rt.appendChild(s); }
      if (it[5] !== undefined){ var bar = document.createElement("span"); bar.className = "yb"; var fi = document.createElement("i"); fi.style.width = it[5] + "%"; bar.appendChild(fi); rt.appendChild(bar); }
      r.appendChild(l); r.appendChild(rt); boxes[it[4] === SUN ? 0 : it[4] === MON ? 1 : 2].appendChild(r);
    });
    moonDraw($("moonBig"), 34, il.phase);
    $("facts").classList.toggle("open", OPEN);
    $("more").innerHTML = (OPEN ? "Show less \u00b7 \u0995\u09AE \u09A6\u09C7\u0996\u09BE\u09A8" : "Show all details \u00b7 \u09B8\u09AC \u09A4\u09A5\u09CD\u09AF \u09A6\u09C7\u0996\u09C1\u09A8") + "<em>" + (OPEN ? "\u25B2" : "\u25BC") + "</em>";
  }

  $("more").addEventListener("click", function(){ OPEN = !OPEN; try { localStorage.setItem("sky.open", OPEN ? "1" : "0"); } catch(e){} renderSky(new Date()); });
  var tf = new Intl.DateTimeFormat("en-US",{timeZone:TZ,hour:"numeric",minute:"2-digit",second:"2-digit",hour12:true}), tickN = 0;
  function tick(){
    var d = new Date(), p = {}; tf.formatToParts(d).forEach(function(x){ p[x.type] = x.value; });
    $("hm").textContent = p.hour + ":" + p.minute; $("ss").textContent = p.second; $("ap").textContent = p.dayPeriod;
    var hk = document.querySelector(".hero-kicker"), lh = d.getHours();
    if (hk) hk.textContent = (lh < 5 ? "HELLO" : lh < 12 ? "GOOD MORNING" : lh < 17 ? "GOOD AFTERNOON" : lh < 20 ? "GOOD EVENING" : "GOOD NIGHT") + ", I'M";
    if (tickN % 15 === 0){
      var pe = {}; new Intl.DateTimeFormat("en-US",{timeZone:TZ,weekday:"long",day:"numeric",month:"long",year:"numeric"}).formatToParts(d).forEach(function(x){ pe[x.type] = x.value; });
      $("dateEn").textContent = pe.weekday + ", " + pe.day + " " + pe.month + ", " + pe.year;
      $("banga").textContent = d.toLocaleDateString("bn-BD",{timeZone:TZ,weekday:"long"}) + ", " + banga(d);
      renderSky(d);
    }
    tickN++; checkAlarms();
  }
  // ---------- confirm box ----------
  function ask(title, body, okLabel){
    return new Promise(function(res){
      var ov = document.createElement("div"); ov.className = "ov";
      var bx = document.createElement("div"); bx.className = "dlg"; bx.setAttribute("role", "alertdialog"); bx.setAttribute("aria-modal", "true");
      var h = document.createElement("h3"); h.textContent = title;
      var p = document.createElement("p"); p.textContent = body;
      var row = document.createElement("div"); row.className = "rowb";
      var no = document.createElement("button"); no.type = "button"; no.className = "btn ghost sm"; no.textContent = "Cancel";
      var yes = document.createElement("button"); yes.type = "button"; yes.className = "btn danger"; yes.textContent = okLabel;
      function key(e){ if (e.key === "Escape") done(false); }
      function done(v){ document.removeEventListener("keydown", key); ov.remove(); res(v); }
      no.addEventListener("click", function(){ done(false); }); yes.addEventListener("click", function(){ done(true); });
      ov.addEventListener("click", function(e){ if (e.target === ov) done(false); });
      document.addEventListener("keydown", key);
      row.appendChild(no); row.appendChild(yes); bx.appendChild(h); bx.appendChild(p); bx.appendChild(row); ov.appendChild(bx); document.body.appendChild(ov); no.focus();
    });
  }

  // ---------- alarms ----------
  var alarms = [], aref = null, aw = false, adirty = false, ringing = false, actx = null, beepT = null;
  try { alarms = JSON.parse(localStorage.getItem("sky.alarms") || "[]"); if (!Array.isArray(alarms)) alarms = []; } catch(e){ alarms = []; }
  function aSave(){
    try { localStorage.setItem("sky.alarms", JSON.stringify(alarms)); } catch(e){}
    if (!aref) return;
    adirty = true; if (aw) return; aw = true;
    (async function(){ while (adirty){ adirty = false; try { await aref.set({alarms:alarms}); } catch(e){ $("astat").textContent = "Could not save to your account. Saved in this browser only."; } } aw = false; })();
  }
  function unlockAudio(){ try { actx = actx || new (window.AudioContext || window.webkitAudioContext)(); if (actx.state === "suspended") actx.resume(); } catch(e){} }
  document.addEventListener("pointerdown", unlockAudio, {once:true});
  document.addEventListener("keydown", unlockAudio, {once:true});
  function beep(){ if (!actx) return; try { var o = actx.createOscillator(), g = actx.createGain(); o.type = "sine"; o.frequency.value = 880; g.gain.value = .25; o.connect(g); g.connect(actx.destination); o.start(); o.stop(actx.currentTime + .3); } catch(e){} }
  function nextAt(h, mi){ var now = Date.now(), dh = new Date(now + 216e5); var t = Date.UTC(dh.getUTCFullYear(), dh.getUTCMonth(), dh.getUTCDate(), h, mi) - 216e5; if (t <= now) t += DAY; return t; }

  function ring(a, missed, at0){
    ringing = true; unlockAudio(); beep(); beepT = setInterval(beep, 700);
    var ov = document.createElement("div"); ov.className = "ov";
    var bx = document.createElement("div"); bx.className = "dlg"; bx.setAttribute("role", "alertdialog"); bx.setAttribute("aria-modal", "true");
    var h = document.createElement("h3"); h.textContent = "Alarm" + (a.label ? ": " + a.label : "");
    var p = document.createElement("p"); p.textContent = (missed ? "You missed this alarm. It was set for " : "It is time. Set for ") + fmtAt(at0) + " (Bangladesh time).";
    var row = document.createElement("div"); row.className = "rowb";
    var sn = document.createElement("button"); sn.type = "button"; sn.className = "btn ghost sm"; sn.textContent = "Snooze 5 min";
    var st = document.createElement("button"); st.type = "button"; st.className = "btn"; st.textContent = "Stop";
    function stop(){ clearInterval(beepT); ov.remove(); ringing = false; checkAlarms(); }
    st.addEventListener("click", stop);
    sn.addEventListener("click", function(){
      var at = Date.now() + 300000, dh = new Date(at + 216e5);
      alarms.push({id:Date.now().toString(36), label:a.label, repeat:"once", on:true, at:at, h:dh.getUTCHours(), mi:dh.getUTCMinutes(), snz:true});
      aSave(); renderAlarms(); stop();
    });
    row.appendChild(sn); row.appendChild(st); bx.appendChild(h); bx.appendChild(p); bx.appendChild(row); ov.appendChild(bx); document.body.appendChild(ov); st.focus();
  }
  function checkAlarms(){
    if (ringing) return;
    var now = Date.now();
    for (var i = 0; i < alarms.length; i++){
      var a = alarms[i];
      if (a.on && now >= a.at){
        var at0 = a.at, missed = now - a.at > 90000;
        if (a.snz) alarms.splice(i, 1);
        else if (a.repeat === "daily") a.at = nextAt(a.h, a.mi);
        else a.on = false;
        aSave(); renderAlarms(); ring(a, missed, at0); return;
      }
    }
  }
  function renderAlarms(){
    var box = $("alist"); box.textContent = "";
    if (!alarms.length){ var e = document.createElement("p"); e.className = "msg"; e.textContent = "No alarms yet."; box.appendChild(e); return; }
    alarms.forEach(function(a){
      var r = document.createElement("div"); r.className = "arow";
      var info = document.createElement("span"); info.className = "ainfo";
      var tm = document.createElement("b"); tm.textContent = a.label || "Alarm";
      var sub = document.createElement("small"); sub.textContent = (a.on ? fmtAt(a.at) : fmtT(a.h, a.mi) + " (off)") + ", " + (a.repeat === "daily" ? "every day" : "once");
      info.appendChild(tm); info.appendChild(sub);
      var sw = document.createElement("button"); sw.type = "button"; sw.className = "btn ghost sm"; sw.textContent = a.on ? "Turn off" : "Turn on";
      sw.addEventListener("click", function(){ a.on = !a.on; if (a.on) a.at = nextAt(a.h, a.mi); aSave(); renderAlarms(); });
      var del = document.createElement("button"); del.type = "button"; del.className = "btn ghost sm"; del.textContent = "Delete";
      del.addEventListener("click", async function(){
        var ok = await ask("Delete " + (a.label ? "the alarm " + a.label : "the " + fmtT(a.h, a.mi) + " alarm") + "?", "This removes the alarm from your list.", "Delete alarm");
        if (!ok) return;
        var k = alarms.indexOf(a); if (k > -1) alarms.splice(k, 1);
        aSave(); renderAlarms();
      });
      r.appendChild(info); r.appendChild(sw); r.appendChild(del); box.appendChild(r);
    });
  }
  $("aset").addEventListener("click", function(){
    var tv = $("atime").value, amsg = $("amsg");
    if (!tv){ amsg.textContent = "Pick a time first."; return; }
    var pt = tv.split(":"), h = +pt[0], mi = +pt[1], dv = $("adate").value, at;
    if (dv){
      var dp = dv.split("-"); at = Date.UTC(+dp[0], +dp[1] - 1, +dp[2], h, mi) - 216e5;
      if (at <= Date.now()){ amsg.textContent = "That date and time has already passed. Pick a later one."; return; }
    } else at = nextAt(h, mi);
    var al = {id:Date.now().toString(36), label:$("albl").value.trim(), repeat:$("arep").value, on:true, at:at, h:h, mi:mi};
    unlockAudio(); alarms.push(al); aSave(); renderAlarms();
    $("albl").value = ""; $("adate").value = "";
    amsg.textContent = "Alarm set. It will ring " + fmtAt(al.at) + " (Bangladesh time). Keep this page open.";
  });


  $("alarmBtn").addEventListener("click", function(){ var o = $("alarmBox").hidden; $("alarmBox").hidden = !o; $("alarmBtn").setAttribute("aria-expanded", o); });
  renderAlarms(); wxApply(); wxLoad(); setInterval(wxLoad, 9e5); tick(); setInterval(tick, 1000);
  document.addEventListener("visibilitychange", checkAlarms);
  var pnl = $("skyPanel"), tg = $("skyToggle");
  function setPanel(o){ pnl.classList.toggle("open", o); if (o) pnl.removeAttribute("inert"); else pnl.setAttribute("inert", ""); tg.setAttribute("aria-expanded", o); tg.querySelector("em").textContent = o ? "\u25B2" : "\u25BC"; try { localStorage.setItem("sky.panel", o ? "1" : "0"); } catch(e){} }
  tg.addEventListener("click", function(){ setPanel(!pnl.classList.contains("open")); });
  document.querySelectorAll('a[href="#skybar"]').forEach(function(a){ a.addEventListener("click", function(){ setPanel(true); }); });
  document.addEventListener("keydown", function(e){ if (e.key === "Escape" && pnl.classList.contains("open") && pnl.contains(document.activeElement)){ setPanel(false); tg.focus(); } });
  var po = false; try { po = localStorage.getItem("sky.panel") === "1"; } catch(e){}
  setPanel(po || location.hash === "#skybar" || document.body.hasAttribute("data-sky-open"));
})();

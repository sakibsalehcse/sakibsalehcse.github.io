/* Quick-jump menu: press Ctrl+K (or Cmd+K, or "/") anywhere on the site. Runs in the browser only. */
(function(){
  var me = document.currentScript, root = me ? new URL("../../", me.src).href : "/";
  function u(p){ return root + p; }
  var ITEMS = [
    ["Home","Page","index.html"],["About","Section","index.html#about"],["Skills","Section","index.html#skills"],["Experience","Section","index.html#journey"],["Contact","Section","index.html#contact"],
    ["Projects","Page","pages/projects.html"],["Tools","Page","pages/tools.html"],["Sky \u00B7 clock, sun, moon, prayer times","Page","pages/sky.html"],
    ["Subnet calculator","Tool","tools/subnet-calculator.html"],["MikroTik Setup Studio","Tool","tools/mikrotik-setup-studio.html"],["MikroTik config generator","Tool","tools/mikrotik-config-generator.html"],
    ["MikroTik Troubleshooting Desk","Tool","tools/mikrotik-troubleshooting-desk.html"],["Fiber Fix game","Tool","tools/fiber-fix.html"],["Slab calculator","Tool","tools/slab-calculator.html"],
    ["Download resume","Action","assets/resume.pdf",{download:1}],
    ["Switch theme","Action",null,{run:function(){ var b = document.getElementById("theme"); if (b) b.click(); }}],
    ["Copy email address","Action",null,{run:function(){ var t = "sakibsalehcse@gmail.com"; try { navigator.clipboard.writeText(t); toast("Email copied"); } catch(e){ location.href = "mailto:" + t; } }}],
    ["LinkedIn","Link","https://www.linkedin.com/in/sakibsaleh/",{ext:1}]
  ];
  var css = document.createElement("style");
  css.textContent =
    ".kp-fab{position:fixed;right:16px;bottom:16px;z-index:60;display:flex;align-items:center;gap:8px;padding:9px 13px;border:1px solid var(--line);background:var(--surface);color:var(--ink);font:500 13px/1 inherit;cursor:pointer;backdrop-filter:blur(8px)}" +
    ".kp-fab kbd,.kp-foot kbd{font:inherit;font-size:11px;padding:2px 6px;border:1px solid var(--line);color:var(--muted)}" +
    ".kp-ov{position:fixed;inset:0;z-index:200;display:grid;place-items:start center;padding:12vh 16px 16px;background:rgba(0,0,0,.55);backdrop-filter:blur(3px)}" +
    ".kp{width:min(560px,100%);border:1px solid var(--line);background:var(--bg);color:var(--ink);box-shadow:0 24px 60px rgba(0,0,0,.45)}" +
    ".kp input{width:100%;box-sizing:border-box;padding:16px 18px;border:0;border-bottom:1px solid var(--line);background:transparent;color:inherit;font:inherit;font-size:16px;outline:none}" +
    ".kp ul{list-style:none;margin:0;padding:6px;max-height:50vh;overflow:auto}" +
    ".kp li a,.kp li button{display:flex;justify-content:space-between;gap:12px;width:100%;box-sizing:border-box;padding:11px 12px;border:0;background:transparent;color:inherit;font:inherit;text-align:left;text-decoration:none;cursor:pointer}" +
    ".kp li.on a,.kp li.on button{background:var(--wash);outline:1px solid var(--accent)}" +
    ".kp li small{color:var(--muted);font-size:12px;letter-spacing:.08em;text-transform:uppercase}" +
    ".kp-empty{padding:18px;color:var(--muted)}.kp-foot{display:flex;gap:14px;padding:9px 14px;border-top:1px solid var(--line);color:var(--muted);font-size:12px}" +
    ".kp-toast{position:fixed;left:50%;bottom:70px;transform:translateX(-50%);z-index:210;padding:10px 16px;border:1px solid var(--accent);background:var(--bg);color:var(--ink);font-size:14px}" +
    "@media(max-width:560px){.kp-fab kbd{display:none}}";
  document.head.appendChild(css);

  function toast(t){ var e = document.createElement("div"); e.className = "kp-toast"; e.setAttribute("role", "status"); e.textContent = t; document.body.appendChild(e); setTimeout(function(){ e.remove(); }, 1800); }

  var ov = null, sel = 0, shown = [], opener = null;
  function close(){ if (!ov) return; ov.remove(); ov = null; document.removeEventListener("keydown", onKey, true); if (opener && opener.focus) opener.focus(); }
  function pick(it){
    var o = it[3] || {}; close();
    if (o.run) o.run();
    else if (o.ext) window.open(it[2], "_blank", "noopener");
    else if (o.download){ var a = document.createElement("a"); a.href = u(it[2]); a.download = ""; document.body.appendChild(a); a.click(); a.remove(); }
    else location.href = u(it[2]);
  }
  function draw(list, q){
    var q2 = q.trim().toLowerCase(), words = q2.split(/\s+/).filter(Boolean);
    shown = ITEMS.filter(function(it){ var h = (it[0] + " " + it[1]).toLowerCase(); return words.every(function(w){ return h.indexOf(w) > -1; }); });
    sel = 0; list.textContent = "";
    if (!shown.length){ var e = document.createElement("div"); e.className = "kp-empty"; e.textContent = "Nothing matches \u201C" + q + "\u201D."; list.appendChild(e); return; }
    shown.forEach(function(it, i){
      var li = document.createElement("li"); li.setAttribute("role", "option"); if (i === 0) li.className = "on";
      var el = document.createElement(it[3] && it[3].run ? "button" : "a");
      if (el.tagName === "A"){ el.href = it[3] && it[3].ext ? it[2] : u(it[2]); } else el.type = "button";
      el.innerHTML = "<span></span><small></small>"; el.firstChild.textContent = it[0]; el.lastChild.textContent = it[1];
      el.addEventListener("click", function(ev){ ev.preventDefault(); pick(it); });
      li.appendChild(el); list.appendChild(li);
    });
  }
  function move(d){ var lis = ov.querySelectorAll("li"); if (!lis.length) return; lis[sel].classList.remove("on"); sel = (sel + d + lis.length) % lis.length; lis[sel].classList.add("on"); lis[sel].scrollIntoView({block:"nearest"}); }
  function onKey(e){
    if (!ov) return;
    if (e.key === "Escape"){ e.preventDefault(); close(); }
    else if (e.key === "ArrowDown"){ e.preventDefault(); move(1); }
    else if (e.key === "ArrowUp"){ e.preventDefault(); move(-1); }
    else if (e.key === "Enter"){ e.preventDefault(); if (shown[sel]) pick(shown[sel]); }
    else if (e.key === "Tab"){ e.preventDefault(); ov.querySelector("input").focus(); }
  }
  function open(){
    if (ov) return; opener = document.activeElement;
    ov = document.createElement("div"); ov.className = "kp-ov";
    ov.innerHTML = '<div class="kp" role="dialog" aria-modal="true" aria-label="Quick jump"><input type="text" placeholder="Jump to a page, tool or action\u2026" aria-label="Search" autocomplete="off"><ul role="listbox"></ul><div class="kp-foot"><span><kbd>\u2191</kbd> <kbd>\u2193</kbd> move</span><span><kbd>Enter</kbd> open</span><span><kbd>Esc</kbd> close</span></div></div>';
    ov.addEventListener("mousedown", function(e){ if (e.target === ov) close(); });
    document.body.appendChild(ov);
    var inp = ov.querySelector("input"), list = ov.querySelector("ul");
    inp.addEventListener("input", function(){ draw(list, inp.value); });
    document.addEventListener("keydown", onKey, true);
    draw(list, ""); inp.focus();
  }
  document.addEventListener("keydown", function(e){
    var t = e.target, typing = t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable);
    if (((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") || (e.key === "/" && !typing && !e.ctrlKey && !e.metaKey && !e.altKey)){ e.preventDefault(); ov ? close() : open(); }
  });
  var fab = document.createElement("button"); fab.type = "button"; fab.className = "kp-fab"; fab.setAttribute("aria-label", "Open quick jump menu");
  fab.innerHTML = 'Quick jump <kbd>Ctrl K</kbd>'; fab.addEventListener("click", open); document.body.appendChild(fab);
})();

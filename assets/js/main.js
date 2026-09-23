/* Sakib Saleh portfolio. Plain JavaScript; no build step or dependencies. */
(() => {
  'use strict';
  const root = document.documentElement;
  const themeButton = document.getElementById('theme');
  function updateThemeLabel() {
    const light = root.dataset.theme === 'graphite';
    themeButton.textContent = light ? 'Dark mode' : 'Graphite mode';
    themeButton.setAttribute('aria-label', light ? 'Switch to dark theme' : 'Switch to graphite theme');
  }
  updateThemeLabel();
  themeButton.addEventListener('click', () => {
    root.dataset.theme = root.dataset.theme === 'graphite' ? 'dark' : 'graphite';
    try { localStorage.setItem('sakib-theme', root.dataset.theme); } catch (_) {}
    updateThemeLabel();
    drawCircuits();
  });
  const menu = document.getElementById('menu');
  const nav = document.getElementById('navigation');
  function closeMenu() { nav.classList.remove('open'); menu.setAttribute('aria-expanded', 'false'); menu.textContent = 'Menu'; }
  menu.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    menu.setAttribute('aria-expanded', String(open));
    menu.textContent = open ? 'Close' : 'Menu';
  });
  nav.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });

  const canvas = document.getElementById('circuits');
  const ctx = canvas.getContext('2d');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const motionButton = document.getElementById('motion');
  let paused = false, time = 0, last = 0, frame = 0, width = 0, height = 0;
  const arm = document.getElementById('arm');
  const links = document.getElementById('arm-links');
  const shadow = document.getElementById('arm-shadow');
  const tool = document.getElementById('tool');
  const target = document.getElementById('target');
  const jointGroup = document.getElementById('joints');
  const NS = 'http://www.w3.org/2000/svg';
  const joints = [0, 1].map(() => {
    const group = document.createElementNS(NS, 'g');
    [ ['joint', 17], ['joint-inner', 4] ].forEach(([cls, radius]) => {
      const circle = document.createElementNS(NS, 'circle');
      circle.setAttribute('class', cls); circle.setAttribute('r', radius); group.appendChild(circle);
    });
    jointGroup.appendChild(group); return group;
  });

  /* Two-link inverse kinematics: solve joint angles to reach the target.
     The end-effector traces a quadratic curve, not a simulated real machine. */
  function drawArm() {
    const u = (Math.sin(time * 0.42) + 1) / 2;
    const v = 1 - u;
    const x = v * v * 360 + 2 * v * u * 510 + u * u * 355;
    const y = v * v * 155 + 2 * v * u * 260 + u * u * 345;
    const baseX = 195, baseY = 420, lengthA = 180, lengthB = 175;
    const dx = x - baseX, dy = y - baseY;
    const cosine = Math.max(-1, Math.min(1, (dx * dx + dy * dy - lengthA ** 2 - lengthB ** 2) / (2 * lengthA * lengthB)));
    const elbowAngle = Math.acos(cosine);
    const shoulderAngle = Math.atan2(dy, dx) - Math.atan2(lengthB * Math.sin(elbowAngle), lengthA + lengthB * Math.cos(elbowAngle));
    const elbowX = baseX + lengthA * Math.cos(shoulderAngle);
    const elbowY = baseY + lengthA * Math.sin(shoulderAngle);
    const endX = elbowX + lengthB * Math.cos(shoulderAngle + elbowAngle);
    const endY = elbowY + lengthB * Math.sin(shoulderAngle + elbowAngle);
    const d = `M${baseX} ${baseY} L${elbowX.toFixed(2)} ${elbowY.toFixed(2)} L${endX.toFixed(2)} ${endY.toFixed(2)}`;
    links.setAttribute('d', d); shadow.setAttribute('d', d);
    joints[0].setAttribute('transform', `translate(${baseX},${baseY})`);
    joints[1].setAttribute('transform', `translate(${elbowX},${elbowY})`);
    tool.setAttribute('transform', `translate(${endX},${endY}) rotate(${Math.sin(time * .42) * 20})`);
    target.setAttribute('cx', x); target.setAttribute('cy', y);
  }

  function drawCircuits() {
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);
    const light = root.dataset.theme === 'graphite';
    const color = light ? '#baaddd' : '#8faeb9';
    const pulse = light ? '#93e5db' : '#efac84';
    const rows = width < 700 ? 5 : 8;
    for (let i = 0; i < rows; i++) {
      const y = height * (.08 + i / rows) - (scrollY * .04 % 75);
      const bend = width * (.3 + (i % 3) * .12);
      const points = [[-40, y], [bend, y], [bend + 60, y + 60], [width + 40, y + 60]];
      ctx.beginPath(); ctx.moveTo(...points[0]); points.slice(1).forEach(p => ctx.lineTo(...p));
      ctx.strokeStyle = color; ctx.globalAlpha = light ? .37 : .19; ctx.lineWidth = .8; ctx.stroke();
      const lengths = points.slice(1).map((p, j) => Math.hypot(p[0] - points[j][0], p[1] - points[j][1]));
      const total = lengths.reduce((a, b) => a + b, 0);
      for (let tail = 0; tail < 10; tail++) {
        let distance = ((time * 43 + i * 177 - tail * 3) % total + total) % total;
        let segment = 0;
        while (segment < lengths.length - 1 && distance > lengths[segment]) { distance -= lengths[segment++]; }
        const u = distance / lengths[segment];
        const start = points[segment], end = points[segment + 1];
        ctx.fillStyle = pulse; ctx.globalAlpha = .7 * (1 - tail / 10);
        ctx.beginPath(); ctx.arc(start[0] + (end[0] - start[0]) * u, start[1] + (end[1] - start[1]) * u, tail === 0 ? 2.2 : 1.1, 0, Math.PI * 2); ctx.fill();
      }
      ctx.strokeStyle = color; ctx.globalAlpha = .35;
      ctx.beginPath(); ctx.arc(bend - 25, y, 4, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
  let highlighted = -1;
  function drawProgramming() {
    const step = Math.floor(time / 1.25) % 7;
    if (highlighted === step) return;
    highlighted = step;
    document.querySelectorAll('[data-code]').forEach((el, i) => el.classList.toggle('active', i === step));
    const phase = Math.min(3, Math.floor(step * 4 / 7));
    document.querySelectorAll('[data-step]').forEach((el, i) => el.classList.toggle('active', i === phase));
  }
  function resize() {
    width = innerWidth; height = innerHeight;
    if (ctx) {
      const density = Math.min(devicePixelRatio || 1, 2);
      canvas.width = width * density; canvas.height = height * density;
      ctx.setTransform(density, 0, 0, density, 0, 0);
    }
    drawCircuits(); drawArm(); drawProgramming();
  }
  function tick(now) {
    frame = 0;
    if (paused || reduced.matches || document.hidden) return;
    const elapsed = last ? Math.min((now - last) / 1000, .05) : 0;
    last = now; time += elapsed;
    drawProgramming();
    drawCircuits();
    const bounds = arm.getBoundingClientRect();
    if (bounds.bottom > 0 && bounds.top < innerHeight) drawArm();
    frame = requestAnimationFrame(tick);
  }
  function schedule() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0; last = 0;
    if (motionButton) {
      motionButton.disabled = reduced.matches;
      motionButton.textContent = reduced.matches ? 'Reduced motion' : paused ? 'Resume motion' : 'Pause motion';
      motionButton.setAttribute('aria-pressed', String(paused || reduced.matches));
    }
    if (!paused && !reduced.matches && !document.hidden) frame = requestAnimationFrame(tick);
  }
  if (motionButton) motionButton.addEventListener('click', () => { paused = !paused; schedule(); });
  reduced.addEventListener('change', () => { schedule(); drawCircuits(); drawArm(); drawProgramming(); });
  document.addEventListener('visibilitychange', schedule);
  addEventListener('resize', resize);
  addEventListener('scroll', () => { if (paused || reduced.matches) drawCircuits(); }, { passive: true });
  /* Three.js 3D network scene. Loaded dynamically so the portfolio still works if the CDN is unavailable. */
  const threeCanvas = document.getElementById('three-network');
  let threeCleanup = null;
  if (threeCanvas && !reduced.matches) {
    import('https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js').then(THREE => {
      if (!threeCanvas.isConnected) return;
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
      camera.position.set(0, 0, 8.8);
      const renderer = new THREE.WebGLRenderer({ canvas: threeCanvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
      renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.6));
      renderer.setClearColor(0x000000, 0);

      const group = new THREE.Group();
      group.rotation.z = -0.15;
      scene.add(group);

      const nodeCount = innerWidth < 700 ? 42 : 78;
      const radius = 2.35;
      const points = [];
      const nodeGeo = new THREE.SphereGeometry(0.045, 8, 8);
      const nodeMat = new THREE.MeshBasicMaterial({ color: 0x49d9ff, transparent: true, opacity: .95 });
      for (let i = 0; i < nodeCount; i++) {
        const phi = Math.acos(1 - 2 * (i + .5) / nodeCount);
        const theta = Math.PI * (1 + Math.sqrt(5)) * i;
        const p = new THREE.Vector3(
          radius * Math.sin(phi) * Math.cos(theta),
          radius * Math.cos(phi),
          radius * Math.sin(phi) * Math.sin(theta)
        );
        points.push(p);
        const mesh = new THREE.Mesh(nodeGeo, nodeMat);
        mesh.position.copy(p);
        group.add(mesh);
      }

      const positions = [];
      for (let i = 0; i < points.length; i++) {
        const nearest = [];
        for (let j = 0; j < points.length; j++) {
          if (i === j) continue;
          nearest.push({ j, d: points[i].distanceToSquared(points[j]) });
        }
        nearest.sort((a,b) => a.d - b.d);
        nearest.slice(0, 3).forEach(({j}) => {
          if (i < j) positions.push(points[i].x, points[i].y, points[i].z, points[j].x, points[j].y, points[j].z);
        });
      }
      const lineGeo = new THREE.BufferGeometry();
      lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      const lineMat = new THREE.LineBasicMaterial({ color: 0x2f7ea3, transparent: true, opacity: .3 });
      group.add(new THREE.LineSegments(lineGeo, lineMat));

      const globe = new THREE.Mesh(
        new THREE.IcosahedronGeometry(radius * .985, 2),
        new THREE.MeshBasicMaterial({ color: 0x49d9ff, wireframe: true, transparent: true, opacity: .06 })
      );
      group.add(globe);

      const ringMat = new THREE.MeshBasicMaterial({ color: 0x49d9ff, transparent: true, opacity: .16, side: THREE.DoubleSide });
      [0, Math.PI/3, -Math.PI/3].forEach((tilt, i) => {
        const ring = new THREE.Mesh(new THREE.TorusGeometry(radius * 1.08, .008, 4, 96), ringMat);
        ring.rotation.x = tilt;
        ring.rotation.y = i * .7;
        group.add(ring);
      });

      // Rocket companion: it orbits the network globe on a tilted elliptical path,
      // trailing a fading comet tail, rather than walking across the hero.
      const orbit = { cx: 1.25, cy: -0.15, cz: 0.4, a: 3.45, b: 1.3, tilt: -0.2 };
      function orbitPoint(angle, out) {
        out = out || new THREE.Vector3();
        const ex = Math.cos(angle) * orbit.a, ey = Math.sin(angle) * orbit.b;
        const cosT = Math.cos(orbit.tilt), sinT = Math.sin(orbit.tilt);
        out.x = orbit.cx + ex * cosT - ey * sinT;
        out.y = orbit.cy + ex * sinT + ey * cosT;
        out.z = orbit.cz + Math.sin(angle) * 1.05;
        return out;
      }

      // Static glowing guide ring showing the orbit path, like the loop under the globe.
      const orbitPts = [];
      for (let i = 0; i <= 128; i++) orbitPts.push(orbitPoint((i / 128) * Math.PI * 2));
      const orbitGeo = new THREE.BufferGeometry().setFromPoints(orbitPts);
      const orbitMat = new THREE.LineBasicMaterial({ color: 0x49d9ff, transparent: true, opacity: .22, depthTest: false });
      const orbitLine = new THREE.Line(orbitGeo, orbitMat);
      orbitLine.renderOrder = 1;
      scene.add(orbitLine);

      const rocket = new THREE.Group();
      rocket.scale.setScalar(0.5);
      scene.add(rocket);

      const hullMat = new THREE.MeshStandardMaterial({ color: 0xe7eef1, metalness: .55, roughness: .3 });
      const darkMat = new THREE.MeshStandardMaterial({ color: 0x24313a, metalness: .5, roughness: .35 });
      const glowMat = new THREE.MeshBasicMaterial({ color: 0x49d9ff, transparent: true, opacity: .95, depthTest: false });
      const flameMat = new THREE.MeshBasicMaterial({ color: 0xff9a4d, transparent: true, opacity: .9, depthTest: false });

      const body = new THREE.Mesh(new THREE.CylinderGeometry(.16, .18, .62, 14), hullMat);
      rocket.add(body);
      const nose = new THREE.Mesh(new THREE.ConeGeometry(.16, .38, 14), darkMat);
      nose.position.y = .5; rocket.add(nose);
      const window1 = new THREE.Mesh(new THREE.CircleGeometry(.075, 12), glowMat);
      window1.position.set(0, .1, .175); rocket.add(window1);
      [0, 1, 2].forEach(i => {
        const fin = new THREE.Mesh(new THREE.ConeGeometry(.11, .32, 4), darkMat);
        fin.position.set(Math.cos(i * 2.094) * .22, -.24, Math.sin(i * 2.094) * .22);
        fin.rotation.x = Math.PI / 2.1;
        fin.rotation.y = i * 2.094;
        rocket.add(fin);
      });
      const flame = new THREE.Mesh(new THREE.ConeGeometry(.11, .4, 10), flameMat);
      flame.position.y = -.48; flame.rotation.x = Math.PI; rocket.add(flame);

      // Soft glow light makes the rocket read as a 3D object without changing the rest of the scene.
      const rocketLight = new THREE.PointLight(0x49d9ff, 1.3, 3.2);
      rocketLight.position.set(0, .1, .6); rocket.add(rocketLight);

      // Comet trail: a run of fading dots sampled slightly behind the rocket along the same orbit.
      const trailCount = 14;
      const trailDots = [];
      for (let i = 0; i < trailCount; i++) {
        const mat = new THREE.MeshBasicMaterial({ color: 0x49d9ff, transparent: true, opacity: 0, depthTest: false });
        const dot = new THREE.Mesh(new THREE.SphereGeometry(1, 6, 6), mat);
        dot.renderOrder = 2;
        scene.add(dot);
        trailDots.push(dot);
      }

      const cursor = { x: 0, y: 0 };
      const targetCursor = { x: 0, y: 0 };
      const onPointer = e => {
        targetCursor.x = (e.clientX / innerWidth - .5) * 2;
        targetCursor.y = (e.clientY / innerHeight - .5) * 2;
      };
      addEventListener('pointermove', onPointer, { passive: true });

      function resizeThree() {
        const r = threeCanvas.getBoundingClientRect();
        const w = Math.max(1, r.width), h = Math.max(1, r.height);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h, false);
        const mobile = innerWidth < 780;
        group.position.x = mobile ? .9 : 1.25;
        group.position.y = mobile ? .15 : .05;
        camera.position.z = mobile ? 9.5 : 8.8;
        orbit.cx = group.position.x;
        orbit.cy = group.position.y - .2;
        orbit.a = mobile ? 2.5 : 3.45;
        orbit.b = mobile ? .95 : 1.3;
        orbitPts.length = 0;
        for (let i = 0; i <= 128; i++) orbitPts.push(orbitPoint((i / 128) * Math.PI * 2));
        orbitGeo.setFromPoints(orbitPts);
      }
      resizeThree();
      addEventListener('resize', resizeThree);

      let raf = 0, t = 0, last3 = performance.now();
      const animate = now => {
        if (document.hidden || reduced.matches) { raf = 0; return; }
        const dt = Math.min((now - last3) / 1000, .05); last3 = now; t += dt;
        cursor.x += (targetCursor.x - cursor.x) * .035;
        cursor.y += (targetCursor.y - cursor.y) * .035;
        group.rotation.y += dt * .075;
        group.rotation.x = cursor.y * .10;
        group.rotation.z = -.15 + cursor.x * .035;

        // Rocket orbit: continuously loops the globe on the tilted ellipse, nose pointed along its path.
        const angle = t * 0.5;
        const p = orbitPoint(angle);
        const pNext = orbitPoint(angle + .02);
        rocket.position.copy(p);
        const dx = pNext.x - p.x, dy = pNext.y - p.y, dz = pNext.z - p.z;
        rocket.rotation.z = Math.atan2(dx, dy) * -1;
        rocket.rotation.x = dz * 1.1;
        flame.scale.set(1, .8 + Math.random() * .35, 1);
        window1.material.opacity = .7 + (Math.sin(t * 5) + 1) * .15;

        for (let i = 0; i < trailCount; i++) {
          const trailAngle = angle - (i + 1) * .055;
          const tp = orbitPoint(trailAngle);
          const fade = 1 - i / trailCount;
          trailDots[i].position.copy(tp);
          trailDots[i].scale.setScalar(.035 * fade + .006);
          trailDots[i].material.opacity = fade * .55;
        }

        group.children.forEach((child, i) => {
          if (child.isMesh && child.geometry.type === 'SphereGeometry') {
            const pulse = 1 + Math.sin(t * 2 + i * .35) * .18;
            child.scale.setScalar(pulse);
          }
        });
        renderer.render(scene, camera);
        raf = requestAnimationFrame(animate);
      };
      const start = () => { if (!raf && !paused && !document.hidden) raf = requestAnimationFrame(animate); };
      const stop = () => { if (raf) cancelAnimationFrame(raf); raf = 0; };
      start();
      const oldSchedule = schedule;
      schedule = function(){ oldSchedule(); if (paused || reduced.matches || document.hidden) stop(); else start(); };
      document.addEventListener('visibilitychange', () => document.hidden ? stop() : start());
      threeCleanup = () => {
        stop();
        removeEventListener('pointermove', onPointer);
        removeEventListener('resize', resizeThree);
        renderer.dispose();
        lineGeo.dispose(); nodeGeo.dispose(); lineMat.dispose(); nodeMat.dispose(); ringMat.dispose();
        orbitGeo.dispose(); orbitMat.dispose();
        trailDots.forEach(d => { d.geometry.dispose(); d.material.dispose(); });
      };
    }).catch(() => {
      threeCanvas.style.display = 'none';
    });
  }
  resize(); schedule();
  if ('IntersectionObserver' in window && !reduced.matches) {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); }
    }), { threshold: .05 });
    document.querySelectorAll('.section-heading,.about-layout,.project,.timeline article,.learning').forEach(el => { el.classList.add('reveal'); observer.observe(el); });
  }
})();

/* Länkorden — engelska bindeord, åk 7–9. En mekanik: välj det bindeord som får
   de två satserna att hänga ihop och bli sanna. Ingen tid, inga liv. */
(function () {
  'use strict';
  const S = {
    ljud: true,
    niva: 1,
    index: 0,
    stjarnor: 0,
    forsta: true,
    last: false,
    rader: [],
    svar: [],
    korts: []
  };

  window.__lank = S; /* speltest: läsbart tillstånd, ingen påverkan */

  const $ = (s) => document.querySelector(s);
  const el = {
    start: $('#startskarm'), spel: $('#spel'),
    fraga: $('#fraga'), satsA: $('#satsA'), satsB: $('#satsB'), lucka: $('#lucka'),
    alt: $('#alternativ'), aterkoppling: $('#aterkoppling'),
    nivaText: $('#nivaText'), stjarnText: $('#stjarnText'), prickar: $('#prickar'),
    klart: $('#klart'), klartTitel: $('#klartTitel'), klartText: $('#klartText'),
    klartStjarnor: $('#klartStjarnor'), klartKnapp: $('#klartKnapp'), klartIgen: $('#klartIgen'),
    ljud: $('#ljud'), framsteg: $('#framsteg')
  };

  /* ---------- ljud ---------- */
  let ljudCtx = null;
  function blipp(freq, slag, tid, volym) {
    if (!S.ljud) return;
    try {
      if (!ljudCtx) ljudCtx = new (window.AudioContext || window.webkitAudioContext)();
      const o = ljudCtx.createOscillator(), g = ljudCtx.createGain();
      o.type = slag || 'triangle';
      o.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, ljudCtx.currentTime);
      g.gain.exponentialRampToValueAtTime(volym || 0.14, ljudCtx.currentTime + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, ljudCtx.currentTime + (tid || 0.2));
      o.connect(g); g.connect(ljudCtx.destination);
      o.start(); o.stop(ljudCtx.currentTime + (tid || 0.2) + 0.03);
    } catch (e) {}
  }
  function tal(text) {
    if (!S.ljud) return;
    try {
      if (typeof window.__rost === 'function' && window.__rost(text)) return;
    } catch (e) {}
    if (!('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'sv-SE'; u.rate = 0.98; u.pitch = 1.03;
      window.speechSynthesis.speak(u);
    } catch (e) {}
  }
  window.addEventListener('pointerdown', function enGang() {
    try {
      if (!ljudCtx) ljudCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (ljudCtx.state === 'suspended') ljudCtx.resume();
    } catch (e) {}
    window.removeEventListener('pointerdown', enGang);
  });

  /* ---------- spelmekanik ---------- */
  function rader() {
    return DATA.filter((d) => d.niva === S.niva);
  }

  function blanda(a) {
    const b = a.slice();
    for (let i = b.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [b[i], b[j]] = [b[j], b[i]];
    }
    return b;
  }

  function visaPrickar() {
    const n = S.rader.length;
    el.prickar.innerHTML = '';
    for (let i = 0; i < n; i++) {
      const d = document.createElement('span');
      d.className = 'prick' + (i < S.index ? ' klar' : '') + (i === S.index ? ' nu' : '');
      el.prickar.appendChild(d);
    }
    el.framsteg.style.width = Math.round((S.index / n) * 100) + '%';
  }

  function visaFraga() {
    const r = S.rader[S.index];
    S.forsta = true;
    S.last = false;
    el.fraga.classList.remove('svarad');
    el.aterkoppling.textContent = '';
    el.aterkoppling.classList.remove('visa');
    el.satsA.textContent = r.a;
    el.satsB.textContent = r.b;
    el.lucka.textContent = '?';
    el.lucka.classList.remove('fylld');
    el.nivaText.textContent = 'Nivå ' + S.niva;
    el.stjarnText.textContent = S.stjarnor;

    const val = blanda([r.ratt].concat(r.fel));
    S.korts = val;
    el.alt.innerHTML = '';
    val.forEach((ord) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'kort';
      b.textContent = ord.charAt(0).toUpperCase() + ord.slice(1);
      b.dataset.ord = ord;
      b.setAttribute('aria-label', 'Bindeordet ' + ord);
      b.addEventListener('click', () => valj(ord, b));
      el.alt.appendChild(b);
    });

    visaPrickar();
    startDemo();
    const text = r.a + ' ' + r.b;
    tal(r.a + ' ' + r.b);
    window.skolappar?.event?.('round_start');
  }

  function valj(ord, knapp) {
    if (S.last) return;
    const r = S.rader[S.index];
    if (ord === r.ratt) {
      S.last = true;
      knapp.classList.add('ratt');
      el.alt.querySelectorAll('.kort').forEach((b) => {
        b.disabled = true;
        if (b !== knapp) b.classList.add('slocknad');
      });
      el.lucka.textContent = ord.charAt(0).toUpperCase() + ord.slice(1);
      el.lucka.classList.add('fylld');
      el.fraga.classList.add('svarad');
      el.aterkoppling.textContent = r.forkl;
      el.aterkoppling.classList.add('visa');
      if (S.forsta) { S.stjarnor++; }
      el.stjarnText.textContent = S.stjarnor;
      blipp(660, 'triangle', 0.16); setTimeout(() => blipp(880, 'triangle', 0.22), 120);
      tal(r.forkl);
      window.skolappar?.event?.('round_done', 100);
      S.svar.push({ id: S.index, ratt: true, forsta: S.forsta });
      setTimeout(nasta, 1750);
    } else {
      S.forsta = false;
      knapp.classList.add('fel');
      blipp(220, 'sine', 0.18, 0.1);
      if (navigator.vibrate) { try { navigator.vibrate(40); } catch (e) {} }
      const hint = 'Inte riktigt. Läs de två satserna igen: hänger de ihop i tid, som orsak, som motsats eller som ett tillägg?';
      el.aterkoppling.textContent = hint;
      el.aterkoppling.classList.add('visa');
      setTimeout(() => knapp.classList.remove('fel'), 900);
      window.skolappar?.event?.('hint');
      tal('Inte riktigt. Försök igen.');
    }
  }

  function nasta() {
    S.index++;
    if (S.index >= S.rader.length) { klart(); return; }
    visaFraga();
  }

  function klart() {
    const n = S.rader.length;
    const ratt = S.svar.filter((s) => s.ratt).length;
    el.klartStjarnor.textContent = '⭐'.repeat(Math.max(0, S.stjarnor)) || '–';
    el.klartTitel.textContent = 'Nivå ' + S.niva + ' klar!';
    el.klartText.textContent = ratt + ' av ' + n + ' rätt. ' +
      (S.niva < 3 ? 'Nästa nivå väntar.' : 'Du har klarat alla tre nivåerna.');
    el.klartKnapp.textContent = S.niva < 3 ? 'Nästa nivå' : 'Spela igen';
    el.klart.hidden = false;
    el.klart.classList.add('visa');
    blipp(523, 'triangle', 0.18); setTimeout(() => blipp(784, 'triangle', 0.3), 150);
    tal('Nivå ' + S.niva + ' klar. Du fick ' + S.stjarnor + ' stjärnor.');
    window.skolappar?.event?.('level', S.niva);
  }

  function startaNiva(n) {
    S.niva = n;
    S.index = 0;
    S.svar = [];
    S.rader = blanda(rader());
    el.klart.hidden = true;
    el.klart.classList.remove('visa');
    el.spel.hidden = false;
    el.start.hidden = true;
    window.skolappar?.event?.('level', n);
    visaFraga();
  }

  /* ---------- start ---------- */
  $('#play').addEventListener('click', () => startaNiva(1));
  el.klartKnapp.addEventListener('click', () => {
    if (S.niva < 3) startaNiva(S.niva + 1);
    else { S.stjarnor = 0; startaNiva(1); }
  });
  el.klartIgen.addEventListener('click', () => { S.stjarnor = 0; startaNiva(S.niva); });

  el.ljud.addEventListener('click', () => {
    S.ljud = !S.ljud;
    el.ljud.setAttribute('aria-pressed', String(S.ljud));
    el.ljud.textContent = S.ljud ? '🔊' : '🔇';
    if (!S.ljud) {
      try { window.speechSynthesis?.cancel(); } catch (e) {}
      window.skolappar?.event?.('sound_off');
    } else { blipp(600, 'triangle', 0.12); }
  });

  // demonrera trycket: pulsera ett av korten tills barnet svarar
  let demo = null;
  function startDemo() {
    clearInterval(demo);
    demo = setInterval(() => {
      if (S.last) { clearInterval(demo); return; }
      const k = el.alt.querySelector('.kort:not(.fel)');
      if (k) { k.classList.add('puls'); setTimeout(() => k.classList.remove('puls'), 700); }
    }, 2600);
  }

  window.__lankorden = { S, startaNiva, valj, DATA };
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { try { window.speechSynthesis?.cancel(); } catch (e) {} }
  });
})();
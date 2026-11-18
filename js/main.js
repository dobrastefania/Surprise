/* Surprise — behaviour
   language · theme · motion consent · menu and chapters · fortune cookie · curve · voices
   · words of the world · face · presents · ideas · boxes · hidden gifts · colours · footer button */
(function () {
  'use strict';

  var root = document.documentElement;
  var I18N = window.I18N || {};
  var VOICES = window.VOICES || [];
  var LANGS = ['en', 'de', 'ro', 'hu'];
  var PAGES = ['home', 'word', 'science', 'sides', 'voices', 'make', 'play', 'about'];

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), x = a[i]; a[i] = a[j]; a[j] = x; } return a; }
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }

  /* localStorage can be blocked (private mode, file://) — never let that break the page */
  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };

  /* replay a CSS animation by removing and re-adding its class */
  function replay(node, cls) {
    if (!node) return;
    node.classList.remove(cls);
    void node.getBoundingClientRect();
    node.classList.add(cls);
  }

  /* ------------------------------------------------------------------
     STATE
     ------------------------------------------------------------------ */
  function detectLang() {
    var fromUrl = new URLSearchParams(location.search).get('lang');
    if (LANGS.indexOf(fromUrl) > -1) return fromUrl;
    var saved = store.get('sp-lang');
    if (LANGS.indexOf(saved) > -1) return saved;
    var prefs = navigator.languages || [navigator.language || 'en'];
    for (var i = 0; i < prefs.length; i++) {
      var short = String(prefs[i]).slice(0, 2).toLowerCase();
      if (LANGS.indexOf(short) > -1) return short;
    }
    return 'en';
  }

  var state = {
    lang: detectLang(),
    theme: store.get('sp-theme') || 'auto',          // auto | light | dark
    motion: store.get('sp-motion'),                  // 'on' | 'off' | null (not answered yet)
    page: 'home',
    ending: 'dip',                                   // dip | flat | spike
    answered: store.get('sp-spectrum') !== null,     // did the visitor move the slider?
    fav: store.get('sp-fav'),                        // favourite colour
    egg: null                                        // key of the footer message being shown
  };
  if (['auto', 'light', 'dark'].indexOf(state.theme) < 0) state.theme = 'auto';
  if (state.motion !== 'on' && state.motion !== 'off') state.motion = null;

  function t(key) {
    var dict = I18N[state.lang] || {};
    if (key in dict) return dict[key];
    return (I18N.en && I18N.en[key]) || key;
  }
  function motionOn() { return state.motion === 'on'; }

  /* ------------------------------------------------------------------
     LANGUAGE
     ------------------------------------------------------------------ */
  function applyLang() {
    root.lang = state.lang;
    var desc = $('meta[name="description"]');
    if (desc) desc.setAttribute('content', t('meta.desc'));

    $$('[data-i18n]').forEach(function (n) { n.textContent = t(n.getAttribute('data-i18n')); });
    $$('[data-i18n-attr]').forEach(function (n) {
      n.getAttribute('data-i18n-attr').split(';').forEach(function (pair) {
        var p = pair.split(':');
        if (p.length === 2) n.setAttribute(p[0].trim(), t(p[1].trim()));
      });
    });

    $$('[data-set-lang]').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.getAttribute('data-set-lang') === state.lang));
    });
    $$('[data-lang-card]').forEach(function (c) {
      c.classList.toggle('is-current', c.getAttribute('data-lang-card') === state.lang);
    });
    $('#langCode').textContent = state.lang.toUpperCase();

    setTitle();
    renderLetters();
    renderAsk();
    renderCookie();
    renderEnding();
    renderVoices();
    renderBand();
    renderEgg();
    renderIdea();
    renderBoxes();
    renderColours();
    updateGifts();
    renderPager();
    fitNav();
  }

  function setLang(lang) {
    if (LANGS.indexOf(lang) < 0) return;
    state.lang = lang;
    store.set('sp-lang', lang);
    applyLang();
  }

  function setTitle() {
    document.title = state.page === 'home' ? t('meta.title') : t('nav.' + state.page) + ' · ' + t('word');
  }

  /* the big word: one <span> per letter, so the letters can jump in when motion is on */
  function renderLetters() {
    var box = $('#letters');
    if (!box) return;
    var letters = Array.from(t('word'));
    box.textContent = '';
    box.parentNode.style.setProperty('--n', letters.length + 1);   // + the “!”
    letters.forEach(function (ch, i) {
      var s = el('span', null, ch);
      s.style.setProperty('--i', i);
      box.appendChild(s);
    });
  }

  /* ------------------------------------------------------------------
     THEME — system, light or dark
     ------------------------------------------------------------------ */
  function applyTheme() {
    if (state.theme === 'auto') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', state.theme);
    $$('[data-set-theme]').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.getAttribute('data-set-theme') === state.theme));
    });
    syncThemeColour();
  }
  function syncThemeColour() {
    var meta = $('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', getComputedStyle(root).getPropertyValue('--bg').trim());
  }
  function setTheme(theme) {
    state.theme = theme;
    store.set('sp-theme', theme);
    applyTheme();
  }
  if (window.matchMedia) {
    var mqDark = window.matchMedia('(prefers-color-scheme: dark)');
    var onScheme = function () { if (state.theme === 'auto') syncThemeColour(); };
    if (mqDark.addEventListener) mqDark.addEventListener('change', onScheme);
    else if (mqDark.addListener) mqDark.addListener(onScheme);
  }

  /* ------------------------------------------------------------------
     MOTION — nothing moves until the visitor agrees
     ------------------------------------------------------------------ */
  function applyMotion() {
    if (state.motion) root.setAttribute('data-motion', state.motion);
    else root.removeAttribute('data-motion');
    $$('[data-set-motion]').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.getAttribute('data-set-motion') === state.motion));
    });
    /* things that look different without motion: shown in their final state straight away */
    var face = $('#face'), arcs = $('#arcs');
    if (face) face.classList.toggle('is-surprised', !motionOn());
    if (arcs) arcs.classList.toggle('drawn', !motionOn() || state.page === 'sides');
    renderAsk();
    renderCookie();
    renderEgg();
  }

  function renderAsk() {
    var out = $('#ask-state');
    if (out) out.textContent = state.motion === 'on' ? t('ask.stateOn') : state.motion === 'off' ? t('ask.stateOff') : '';
    var sys = $('#ask-sys');
    if (sys) {
      var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      sys.hidden = !(reduced && state.motion !== 'on');
    }
  }

  function setMotion(value, origin) {
    state.motion = value;
    store.set('sp-motion', value);
    applyMotion();
    movePill();
    if (value === 'on') {
      renderLetters();                 // new nodes → the letters jump in again
      if (origin) confettiFrom(origin, 110);
    }
  }

  /* ------------------------------------------------------------------
     CONFETTI (only ever runs with motion on)
     ------------------------------------------------------------------ */
  var confetti = { canvas: null, ctx: null, parts: [], raf: 0 };
  var PALETTE = ['--accent', '--primary', '--teal', '--violet', '--pink', '--green'];

  function confettiFrom(node, count, vars) {
    if (!node) return burst(window.innerWidth / 2, window.innerHeight * .35, count, vars);
    var r = node.getBoundingClientRect();
    burst(r.left + r.width / 2, r.top + r.height / 2, count, vars);
  }

  function burst(x, y, count, vars) {
    if (!motionOn() || !count) return;
    var c = confetti;
    if (!c.canvas) {
      c.canvas = document.createElement('canvas');
      c.canvas.id = 'confetti';
      c.canvas.setAttribute('aria-hidden', 'true');
      document.body.appendChild(c.canvas);
      c.ctx = c.canvas.getContext('2d');
    }
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    c.canvas.width = window.innerWidth * dpr;
    c.canvas.height = window.innerHeight * dpr;
    c.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    var css = getComputedStyle(root);
    var colours = (vars || PALETTE).map(function (v) { return css.getPropertyValue(v).trim(); });

    for (var i = 0; i < count; i++) {
      var angle = Math.random() * Math.PI * 2;
      var speed = 4 + Math.random() * 9;
      c.parts.push({
        x: x, y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 6,
        w: 6 + Math.random() * 7, h: 4 + Math.random() * 6,
        rot: Math.random() * Math.PI, vr: (Math.random() - .5) * .5,
        colour: colours[i % colours.length],
        round: Math.random() < .3,
        life: 90 + Math.random() * 50
      });
    }
    if (!c.raf) c.raf = requestAnimationFrame(tick);
  }

  function tick() {
    var c = confetti, ctx = c.ctx;
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    c.parts = motionOn() ? c.parts.filter(function (p) { return p.life > 0 && p.y < window.innerHeight + 40; }) : [];
    c.parts.forEach(function (p) {
      p.vy += .32; p.vx *= .985;
      p.x += p.vx; p.y += p.vy; p.rot += p.vr; p.life -= 1;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.globalAlpha = Math.min(1, p.life / 25);
      ctx.fillStyle = p.colour;
      if (p.round) { ctx.beginPath(); ctx.arc(0, 0, p.w / 2, 0, Math.PI * 2); ctx.fill(); }
      else ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    });
    c.raf = c.parts.length ? requestAnimationFrame(tick) : 0;
  }

  /* ------------------------------------------------------------------
     MENU — numbered chapters, sliding pill, full-screen sheet, settings
     ------------------------------------------------------------------ */
  var nav = $('#nav'), menuBtn = $('#menuBtn'), setBtn = $('#setBtn'), setPanel = $('#setPanel'), bar = $('#bar');
  $$('#navList li').forEach(function (li, i) { li.style.setProperty('--k', i); });

  function setMenu(open) {
    nav.classList.toggle('is-open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    document.body.style.overflow = open ? 'hidden' : '';
  }
  function setPop(open) {
    setPanel.hidden = !open;
    setBtn.setAttribute('aria-expanded', String(open));
  }
  menuBtn.addEventListener('click', function () { setPop(false); setMenu(!nav.classList.contains('is-open')); });
  setBtn.addEventListener('click', function (e) { e.stopPropagation(); setPop(setPanel.hidden); });
  setPanel.addEventListener('click', function (e) { e.stopPropagation(); });
  document.addEventListener('click', function () { setPop(false); });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (!setPanel.hidden) { setPop(false); setBtn.focus(); }
    if (nav.classList.contains('is-open')) { setMenu(false); menuBtn.focus(); }
  });

  /* The menu is a row while it fits next to the logo; when it doesn't (narrow screen,
     or a language with longer words), it turns into a full-screen sheet. */
  function fitNav() {
    root.classList.add('nav-measuring');             // no transitions while the row layout is tried out
    root.classList.remove('nav-sheet');
    if (bar.scrollWidth > bar.clientWidth + 1) root.classList.add('nav-sheet');
    else setMenu(false);
    void bar.offsetWidth;
    root.classList.remove('nav-measuring');
    movePill();
  }
  function movePill() {
    var pill = $('#navPill'), a = $('#navList a[aria-current]');
    if (!a || root.classList.contains('nav-sheet')) return;
    var nr = nav.getBoundingClientRect(), ar = a.getBoundingClientRect();
    pill.style.left = (ar.left - nr.left - 1) + 'px';
    pill.style.width = ar.width + 'px';
  }
  /* Phones fire "resize" every time the address bar hides or shows while scrolling.
     Only a change in width can change whether the menu fits, so height-only resizes are ignored. */
  var resizeRaf = 0, lastWidth = window.innerWidth;
  window.addEventListener('resize', function () {
    if (window.innerWidth === lastWidth) return;
    lastWidth = window.innerWidth;
    cancelAnimationFrame(resizeRaf);
    resizeRaf = requestAnimationFrame(fitNav);
  });

  /* ------------------------------------------------------------------
     CHAPTERS — one per page (#/word, #/science …)
     ------------------------------------------------------------------ */
  var firstRoute = true;

  /* go to the top of the new chapter at once, in every browser (older phones reject behavior: 'instant') */
  function jumpToTop() {
    var prev = root.style.scrollBehavior;
    root.style.scrollBehavior = 'auto';
    window.scrollTo(0, 0);
    root.style.scrollBehavior = prev;
  }

  function route() {
    var m = location.hash.match(/^#\/(\w+)/);
    var id = m && PAGES.indexOf(m[1]) > -1 ? m[1] : null;
    if (!id) {
      if (!firstRoute) return;         // an in-page link such as “skip to content”: stay where we are
      id = 'home';
    }
    state.page = id;
    $$('.view').forEach(function (v) { v.classList.toggle('is-active', v.getAttribute('data-view') === id); });
    $$('#navList a').forEach(function (a) {
      if (a.getAttribute('data-page') === id) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
    setMenu(false);
    movePill();
    renderPager();
    setTitle();
    if (!firstRoute) {
      jumpToTop();
      try { $('#views').focus({ preventScroll: true }); } catch (e) {}
    }
    firstRoute = false;
    onEnter(id);
    onScroll();
  }

  function onEnter(id) {
    if (id === 'science' && motionOn()) {
      var face = $('#face');
      face.classList.remove('is-surprised');
      setTimeout(function () { if (state.page === 'science') face.classList.add('is-surprised'); }, 1100);
    }
    if (id === 'sides') {
      var arcs = $('#arcs');
      arcs.classList.remove('drawn');
      if (!motionOn() || !('IntersectionObserver' in window)) arcs.classList.add('drawn');
      else {
        var io = new IntersectionObserver(function (en) {
          if (en[0].isIntersecting) { arcs.classList.add('drawn'); io.disconnect(); }
        }, { threshold: .35 });
        io.observe(arcs);
      }
    }
  }
  window.addEventListener('hashchange', route);

  function renderPager() {
    var pager = $('#pager');
    if (!pager) return;
    var i = PAGES.indexOf(state.page), html = '';
    if (i > 0) html += '<a class="prev" href="#/' + PAGES[i - 1] + '"><small><svg><use href="#i-back"/></svg>' + esc(t('pager.prev')) + '</small><strong>' + esc(t('nav.' + PAGES[i - 1])) + '</strong></a>';
    if (i < PAGES.length - 1) html += '<a class="next" href="#/' + PAGES[i + 1] + '"><small><svg><use href="#i-arrow"/></svg>' + esc(t('pager.next')) + '</small><strong>' + esc(t('nav.' + PAGES[i + 1])) + '</strong></a>';
    pager.innerHTML = html;
  }

  /* mark things as seen; the CSS only animates this when motion is on */
  if ('IntersectionObserver' in window) {
    var seen = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); seen.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    $$('.reveal').forEach(function (n) { seen.observe(n); });
  } else {
    $$('.reveal').forEach(function (n) { n.classList.add('in'); });
  }

  var progress = $('#progress-bar'), ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      if (progress) progress.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, window.scrollY / max) : 0) + ')';
      ticking = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  $('#to-top').addEventListener('click', function () {
    try { window.scrollTo({ top: 0, behavior: motionOn() ? 'smooth' : 'auto' }); } catch (e) { window.scrollTo(0, 0); }
  });

  /* ------------------------------------------------------------------
     THE FORTUNE COOKIE
     Notes come out in random order and the bag refills itself, so it never runs out.
     With motion: you crack it and get whatever comes. Calm: you are told what kind is next.
     ------------------------------------------------------------------ */
  var SLIPS = [];
  VOICES.forEach(function (v) { SLIPS.push({ kind: 'voice', voice: v.id }); });
  var n;
  for (n = 1; n <= 8; n++) SLIPS.push({ kind: 'fortune', key: 'f' + n });
  for (n = 1; n <= 5; n++) SLIPS.push({ kind: 'proverb', key: 'p' + n });
  for (n = 1; n <= 5; n++) SLIPS.push({ kind: 'fact', key: 'fact' + n });

  var bag = [];
  var cookie = { shown: null, next: { kind: 'hello', key: 'home.opened' } };

  function drawSlip() {
    if (!bag.length) bag = shuffle(SLIPS.slice());
    var s = bag.pop();
    if (s === cookie.next && bag.length) { bag.unshift(s); s = bag.pop(); }   // never the same note twice in a row
    return s;
  }
  function slipText(s) {
    return s.kind === 'voice' ? t('voices.q') + ' ' + t('voice.' + s.voice) : t(s.key);
  }
  function renderCookie() {
    var slip = $('#slip'), ck = $('#ck');
    if (!slip) return;
    var s = cookie.shown;
    slip.className = 'slip' + (s ? ' slip--' + s.kind : ' is-empty');
    $('#slip-kind').textContent = s ? t('kind.' + s.kind) : '';
    $('#slip-text').textContent = s ? slipText(s) : t('cookie.empty');
    $('#cookie-label').textContent = motionOn() ? t(s ? 'cookie.again' : 'cookie.open') : t('cookie.next');
    $('#slip-coming').textContent = t('cookie.coming').replace('{kind}', t('kind.' + cookie.next.kind));
    ck.classList.toggle('is-open', !motionOn() || !!s);
  }
  $('#cookie-btn').addEventListener('click', function () {
    cookie.shown = cookie.next;
    cookie.next = drawSlip();
    renderCookie();
    if (motionOn()) {
      replay($('#ck'), 'crack');
      replay($('#slip'), 'pop');
      confettiFrom($('#ck'), 40);
    }
  });

  /* ------------------------------------------------------------------
     THE CURVE — three endings
     ------------------------------------------------------------------ */
  var chart = $('#chart');

  function renderEnding() {
    if (!chart) return;
    chart.setAttribute('data-ending', state.ending);
    $$('.endings [data-ending]').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.getAttribute('data-ending') === state.ending));
    });
    $('#end-title').textContent = t('end.' + state.ending + '.t');
    $('#end-desc').textContent = t('end.' + state.ending + '.d');
  }
  $$('.endings [data-ending]').forEach(function (b) {
    b.addEventListener('click', function () {
      state.ending = b.getAttribute('data-ending');
      renderEnding();
      replay($('.ending-out'), 'pop');
      if (state.ending === 'spike') confettiFrom(b, 45);
    });
  });

  /* ------------------------------------------------------------------
     VOICES — the opinions on one line, and the visitor's own answer
     ------------------------------------------------------------------ */
  var slider = $('#spectrum');
  var savedPos = store.get('sp-spectrum');
  if (slider && savedPos !== null && !isNaN(+savedPos)) slider.value = savedPos;
  var partyDone = false, lastBand = 0;

  function who(v) { return t('voices.who').replace('{n}', v.id); }

  function renderVoices() {
    var dots = $('#voice-dots'), list = $('#voice-list');
    if (!dots || !list) return;
    dots.textContent = '';
    list.textContent = '';

    /* neighbours on the line alternate between two rows so the dots never sit on each other */
    VOICES.slice().sort(function (a, b) { return a.pos - b.pos; }).forEach(function (v, i) {
      var dot = el('button', 'vdot' + (i % 2 ? ' up' : ''));
      dot.type = 'button';
      dot.style.setProperty('--pos', v.pos);
      dot.setAttribute('aria-label', who(v) + ': ' + t('voice.' + v.id));
      dot.title = who(v);
      dot.setAttribute('data-voice', v.id);
      dot.appendChild(el('span', null, v.id));
      dot.addEventListener('click', function () {
        var card = $('#voice-' + v.id);
        $$('.voice').forEach(function (c) { c.classList.toggle('is-target', c === card); });
        try { card.scrollIntoView({ block: 'center', behavior: motionOn() ? 'smooth' : 'auto' }); } catch (e) { card.scrollIntoView(); }
      });
      dots.appendChild(dot);
    });

    VOICES.forEach(function (v) {
      var li = el('li', 'voice');
      li.id = 'voice-' + v.id;
      li.setAttribute('data-voice', v.id);
      var head = el('p', 'voice-who');
      var pin = el('b', 'pin', v.id);
      pin.setAttribute('aria-hidden', 'true');
      head.appendChild(pin);
      head.appendChild(document.createTextNode(t('voices.q')));
      li.appendChild(head);
      li.appendChild(el('blockquote', null, t('voice.' + v.id)));
      if (v.page) {
        var more = el('a', null, t('voices.seeIn').replace('{page}', t('nav.' + v.page)));
        more.href = '#/' + v.page;
        li.appendChild(more);
      }
      list.appendChild(li);
    });
  }

  function bandOf(v) { return v <= 20 ? 1 : v <= 40 ? 2 : v <= 60 ? 3 : v <= 80 ? 4 : 5; }

  function renderBand() {
    if (!slider) return;
    var band = $('#band'), near = $('#nearest');
    var v = +slider.value;
    var text = state.answered ? t('band' + bandOf(v)) : t('voices.prompt');
    if (band) band.textContent = text;
    slider.setAttribute('aria-valuetext', text);

    /* point out the voice closest to the visitor */
    var closest = null;
    if (state.answered && VOICES.length > 1) {
      VOICES.forEach(function (voice) {
        if (!closest || Math.abs(voice.pos - v) < Math.abs(closest.pos - v)) closest = voice;
      });
    }
    $$('[data-voice]').forEach(function (node) {
      node.classList.toggle('is-near', !!closest && node.getAttribute('data-voice') === closest.id);
    });
    if (near) {
      near.hidden = !closest;
      near.textContent = closest ? t('voices.nearest').replace('{who}', who(closest) + ' — ' + t('voice.' + closest.id)) : '';
    }
  }

  if (slider) {
    slider.addEventListener('input', function () {
      state.answered = true;
      store.set('sp-spectrum', slider.value);
      renderBand();
      var v = +slider.value, b = bandOf(v);
      if (b !== lastBand) { replay($('#band'), 'pop'); lastBand = b; }
      if (v === 100 && !partyDone) { partyDone = true; confettiFrom(slider, 90); }
      if (v < 90) partyDone = false;
    });
  }

  /* ------------------------------------------------------------------
     01 — the same word around the world
     ------------------------------------------------------------------ */
  $$('#world button').forEach(function (b) {
    b.addEventListener('click', function () {
      replay(b, 'pop-it');
      confettiFrom(b, 18);
    });
  });

  /* ------------------------------------------------------------------
     02 — the face
     ------------------------------------------------------------------ */
  var face = $('#face');
  $('#faceBtn').addEventListener('click', function () {
    face.classList.remove('is-surprised');
    void face.getBoundingClientRect();
    setTimeout(function () { face.classList.add('is-surprised'); }, 380);
  });
  $('svg', face).addEventListener('mouseenter', function () { if (motionOn()) face.classList.add('is-surprised'); });

  /* ------------------------------------------------------------------
     03 — the two presents
     ------------------------------------------------------------------ */
  $$('[data-present]').forEach(function (p) {
    var box = $('.present__box', p), q = $('.present__quote', p);
    box.addEventListener('click', function () {
      p.classList.add('is-open');
      box.setAttribute('aria-expanded', 'true');
      confettiFrom(box, 70);
      q.setAttribute('tabindex', '-1');
      setTimeout(function () { q.focus({ preventScroll: true }); }, motionOn() ? 900 : 0);
    });
  });

  /* ------------------------------------------------------------------
     05 — idea generator
     ------------------------------------------------------------------ */
  var ideaOrder = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]), ideaPos = -1;
  function renderIdea() {
    var txt = $('#ideaText'), cnt = $('#ideaCount'), lbl = $('#ideaBtn span');
    if (ideaPos < 0) { txt.textContent = t('idea.empty'); cnt.textContent = '—'; lbl.textContent = t('idea.btn'); return; }
    txt.textContent = t('idea.' + ideaOrder[ideaPos]);
    cnt.textContent = t('idea.of').replace('{n}', ideaPos + 1);
    lbl.textContent = t('idea.again');
  }
  $('#ideaBtn').addEventListener('click', function () {
    ideaPos = (ideaPos + 1) % 12;
    renderIdea();
    replay($('#ideaText'), 'swap');
    replay($('.idea__ic'), 'roll');
  });

  /* ------------------------------------------------------------------
     06 — nine boxes
     ------------------------------------------------------------------ */
  var boxOrder, opened;
  function wrapBoxes() {
    boxOrder = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    opened = [];
    var ul = $('#boxes');
    ul.innerHTML = '';
    boxOrder.forEach(function (content, i) {
      var li = el('li', 'cell');
      li.innerHTML = '<button type="button" aria-pressed="false"><span class="front"><i>' + (i + 1) + '</i></span><span class="back" aria-live="polite"></span></button>';
      var btn = $('button', li);
      btn.addEventListener('click', function () {
        if (btn.classList.contains('open')) return;
        btn.classList.add('open');
        btn.setAttribute('aria-pressed', 'true');
        opened.push(i);
        renderBoxes();
        replay($('#why-mirror'), 'pop');
        confettiFrom(btn, content === 3 ? 0 : 30);     // the empty box stays quiet
        if (content === 9) unlockGift('5');
      });
      ul.appendChild(li);
    });
    renderBoxes();
  }
  function renderBoxes() {
    if (!boxOrder) return;
    $$('#boxes .cell').forEach(function (li, i) {
      var c = boxOrder[i], btn = $('button', li), back = $('.back', li), isOpen = btn.classList.contains('open');
      btn.setAttribute('aria-label', t('play.box').replace('{n}', i + 1) + (isOpen ? ': ' + t('box.' + c) : ''));
      back.textContent = isOpen ? t('box.' + c) : '';
      back.classList.toggle('is-gift', c === 9);
      back.classList.toggle('is-empty', c === 3);
    });
    $('#playCount').textContent = t('play.count').replace('{n}', opened.length);
    /* the mirror under the boxes: the visitor just did what the research below explains */
    var mirror = $('#why-mirror');
    if (mirror) {
      var key = opened.length === 0 ? 'why.mirror0' : opened.length === 9 ? 'why.mirrorAll' : 'why.mirror';
      mirror.textContent = t(key).replace('{n}', opened.length);
    }
  }
  $('#rewrap').addEventListener('click', wrapBoxes);

  /* ------------------------------------------------------------------
     HIDDEN GIFTS — five of them, spread over the chapters
     ------------------------------------------------------------------ */
  var found = [];
  try { found = JSON.parse(store.get('sp-gifts') || '[]'); } catch (e) { found = []; }
  if (!Array.isArray(found)) found = [];

  function updateGifts() {
    $('#giftNum').textContent = found.length;
    $('#giftNum2').textContent = found.length;
    $('#giftRing').style.setProperty('--p', found.length * 20);
    var pill = $('#giftCount'), label = found.length + '/5 ' + t('gifts.found');
    pill.title = label;
    pill.setAttribute('aria-label', label);
    $$('.gift').forEach(function (g) { g.classList.toggle('found', found.indexOf(g.getAttribute('data-gift')) > -1); });
  }
  var toastTimer;
  function toast(html) {
    var box = $('#toast');
    box.innerHTML = html;
    box.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { box.classList.remove('show'); }, 5500);
  }
  function unlockGift(id, node) {
    var isNew = found.indexOf(id) < 0;
    if (isNew) { found.push(id); store.set('sp-gifts', JSON.stringify(found)); }
    updateGifts();
    toast('<b>' + found.length + '/5</b>' + esc(t('gift.' + id)));
    if (!isNew) return;
    if (node) confettiFrom(node, 50);
    replay($('#giftCount'), 'bump');
    if (found.length === 5) {
      setTimeout(function () {
        var modal = $('#doneModal');
        if (modal.showModal) modal.showModal();
        confettiFrom(null, 180);
      }, motionOn() ? 1100 : 200);
    }
  }
  $$('.gift').forEach(function (g) {
    g.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); unlockGift(g.getAttribute('data-gift'), g); });
  });
  $('#doneModal').addEventListener('click', function (e) { if (e.target === this) this.close(); });

  /* ------------------------------------------------------------------
     ⓘ — the six colours, and what your favourite says about you
     ------------------------------------------------------------------ */
  var COLOURS = [
    { id: 'amber', v: '--accent' }, { id: 'indigo', v: '--primary' }, { id: 'teal', v: '--teal' },
    { id: 'violet', v: '--violet' }, { id: 'pink', v: '--pink' }, { id: 'green', v: '--green' }
  ];
  function renderColours(popId) {
    var list = $('#colours');
    if (!list) return;
    list.textContent = '';
    COLOURS.forEach(function (c) {
      var isFav = state.fav === c.id;
      var li = el('li', 'colour colour--' + c.id + ' reveal in' + (isFav ? ' is-fav' : ''));
      var top = el('div', 'colour__top');
      top.appendChild(el('h3', null, t('c.' + c.id + '.n')));
      li.appendChild(top);

      var dl = el('dl');
      [['c.site', 'site'], ['c.love', 'love'], ['c.hate', 'hate']].forEach(function (row) {
        var d = el('div');
        d.appendChild(el('dt', null, t(row[0])));
        d.appendChild(el('dd', null, t('c.' + c.id + '.' + row[1])));
        dl.appendChild(d);
      });
      li.appendChild(dl);

      var foot = el('div', 'colour__foot');
      if (isFav) {
        var you = el('div', 'colour__you');
        you.setAttribute('role', 'status');
        you.appendChild(el('b', null, t('c.you')));
        you.appendChild(el('p', null, t('c.' + c.id + '.you')));
        foot.appendChild(you);
        if (popId === c.id) requestAnimationFrame(function () { replay(you, 'pop'); });
      }
      var btn = el('button', 'btn ' + (isFav ? 'btn-accent' : 'btn-ghost') + ' btn-small', t('c.pick'));
      btn.type = 'button';
      btn.setAttribute('aria-pressed', String(isFav));
      btn.addEventListener('click', function () {
        state.fav = c.id;
        store.set('sp-fav', c.id);
        renderColours(c.id);
        var again = $('.colour--' + c.id + ' .btn');
        if (again) { again.focus({ preventScroll: true }); confettiFrom(again, 70, [c.v, c.v, '--text']); }
      });
      foot.appendChild(btn);
      li.appendChild(foot);
      list.appendChild(li);
    });
  }

  /* ------------------------------------------------------------------
     THE BUTTON IN THE FOOTER — a different message every time
     ------------------------------------------------------------------ */
  var eggBtn = $('#egg-btn'), eggN = 0;

  function renderEgg() {
    var out = $('#egg-out');
    if (out) out.textContent = state.egg ? t(state.egg) : '';
  }
  /* Always “Don't press this”, in both moods. The last message promises confetti,
     so it only comes up when motion is on; calm mode loops through the others. */
  eggBtn.addEventListener('click', function () {
    var last = motionOn() ? 8 : 7;
    eggN = eggN >= last ? 2 : eggN + 1;
    state.egg = 'egg.w' + eggN;
    confettiFrom(eggBtn, eggN === 8 ? 220 : eggN === 1 ? 120 : 25);   // does nothing in calm mode
    renderEgg();
    replay($('#egg-out'), 'pop');
  });

  /* ------------------------------------------------------------------
     WIRING
     ------------------------------------------------------------------ */
  $$('[data-set-lang]').forEach(function (b) {
    b.addEventListener('click', function () { setLang(b.getAttribute('data-set-lang')); });
  });
  $$('[data-set-theme]').forEach(function (b) {
    b.addEventListener('click', function () { setTheme(b.getAttribute('data-set-theme')); });
  });
  $$('[data-set-motion]').forEach(function (b) {
    b.addEventListener('click', function () { setMotion(b.getAttribute('data-set-motion'), b); });
  });

  applyTheme();
  wrapBoxes();
  route();
  applyMotion();
  applyLang();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitNav);
})();

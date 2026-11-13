// Wabis Work: shared behaviour for every page.
(function () {
  var d = document;
  var still = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia && matchMedia('(hover: hover) and (pointer: fine)').matches;

  // ---- Hero: five photos. They change on their own, slowly, and answer a click, tap, swipe or arrow key. ----
  var hero = d.querySelector('.hero');
  var slides = d.querySelectorAll('.slide'), dots = d.querySelectorAll('.dots button'), cur = 0, timer = null;
  if (hero && slides.length) {
    var show = function (i) {
      slides[cur].classList.remove('is-on'); if (dots[cur]) dots[cur].setAttribute('aria-current', 'false');
      cur = (i + slides.length) % slides.length;
      slides[cur].classList.add('is-on'); if (dots[cur]) dots[cur].setAttribute('aria-current', 'true');
    };
    var start = function () { if (!still) { clearInterval(timer); timer = setInterval(function () { show(cur + 1); }, 10000); } };
    var nudge = function (step) { show(cur + step); start(); };
    dots.forEach(function (b, i) { b.addEventListener('click', function (e) { e.stopPropagation(); show(i); start(); }); });
    // swipe or drag sideways; a plain click or tap moves on (left third goes back)
    var x0 = null, y0 = null, moved = false;
    hero.addEventListener('pointerdown', function (e) { if (e.target.closest('.dots')) return; x0 = e.clientX; y0 = e.clientY; moved = false; hero.classList.add('is-dragging'); });
    hero.addEventListener('pointermove', function (e) { if (x0 !== null && Math.abs(e.clientX - x0) > 8) moved = true; });
    var end = function (e) {
      if (x0 === null) return;
      var dx = e.clientX - x0, dy = e.clientY - y0; hero.classList.remove('is-dragging');
      if (moved && Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) { nudge(dx < 0 ? 1 : -1); }
      else if (!moved) { var r = hero.getBoundingClientRect(); nudge(e.clientX < r.left + r.width / 3 ? -1 : 1); }
      x0 = null;
    };
    hero.addEventListener('pointerup', end);
    hero.addEventListener('pointercancel', function () { x0 = null; hero.classList.remove('is-dragging'); });
    hero.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight') nudge(1); if (e.key === 'ArrowLeft') nudge(-1); });
    d.addEventListener('visibilitychange', function () { if (d.hidden) { clearInterval(timer); } else { start(); } });
    start();
  }

  // ---- Alive photos: drift with the scroll, lean toward the cursor like a magnet, settle back to centre ----
  var live = [].slice.call(d.querySelectorAll('[data-live]')).map(function (el) {
    return { el: el, img: el.querySelector('img'), mx: 0, my: 0, tx: 0, ty: 0, py: 0 };
  });
  if (live.length && !still) {
    if (finePointer) {
      live.forEach(function (o) {
        o.el.addEventListener('pointermove', function (e) {
          var r = o.el.getBoundingClientRect();
          o.tx = ((e.clientX - r.left) / r.width - 0.5) * 2;   // -1 .. 1 from the centre
          o.ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
        });
        o.el.addEventListener('pointerleave', function () { o.tx = 0; o.ty = 0; });
      });
    }
    var tick = function () {
      var vh = window.innerHeight;
      live.forEach(function (o) {
        if (!o.img) return;
        var r = o.el.getBoundingClientRect();
        if (r.bottom < -50 || r.top > vh + 50) return;
        // scroll: how far the frame's centre is from the screen's centre, -1 .. 1
        var t = ((r.top + r.height / 2) - vh / 2) / (vh / 2 + r.height / 2);
        o.py = t * r.height * 0.03;
        // magnet: ease toward the cursor, ease back to centre
        o.mx += (o.tx - o.mx) * 0.035; o.my += (o.ty - o.my) * 0.035;
        var lean = r.width * 0.012;
        o.img.style.transform = 'translate3d(' + (o.mx * lean).toFixed(2) + 'px,' + (o.py + o.my * lean).toFixed(2) + 'px,0) scale(1.1)';
      });
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  // ---- Words rise into place as they arrive ----
  var rev = d.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window && rev.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    rev.forEach(function (el) { io.observe(el); });
  } else { rev.forEach(function (el) { el.classList.add('is-in'); }); }

  // ---- Made your way: choose a shape and a wood, carried to the contact page ----
  var pick = { shape: '', wood: '' }, line = d.getElementById('choice-line'), ask = d.getElementById('ask');
  function updateAsk() {
    if (line) {
      line.textContent = (!pick.shape && !pick.wood) ? 'Choose a shape and a wood.'
        : 'Your lamp: ' + (pick.shape ? 'a ' + pick.shape : 'a lamp') + (pick.wood ? ' in ' + pick.wood.toLowerCase() : '') + '.';
    }
    if (ask) {
      var q = [];
      if (pick.shape) q.push('lamp=' + encodeURIComponent('Made to order: ' + pick.shape));
      if (pick.wood) q.push('wood=' + encodeURIComponent(pick.wood));
      ask.href = 'contact.html' + (q.length ? '?' + q.join('&') : '');
    }
  }
  d.querySelectorAll('.options').forEach(function (group) {
    var key = group.getAttribute('data-group');
    group.querySelectorAll('.opt').forEach(function (b) {
      b.addEventListener('click', function () {
        var was = b.getAttribute('aria-pressed') === 'true';
        group.querySelectorAll('.opt').forEach(function (o) { o.setAttribute('aria-pressed', 'false'); });
        b.setAttribute('aria-pressed', was ? 'false' : 'true');
        pick[key] = was ? '' : b.getAttribute('data-value');
        updateAsk();
      });
    });
  });

  // ---- Collection filter ----
  var items = d.querySelectorAll('.lamps > li');
  d.querySelectorAll('.filter button').forEach(function (b) {
    b.addEventListener('click', function () {
      var k = b.getAttribute('data-kind');
      d.querySelectorAll('.filter button').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      items.forEach(function (li) { li.hidden = !(k === 'all' || li.getAttribute('data-kind') === k); });
    });
  });

  // ---- Contact page: fill in what the visitor chose on the Lamps page ----
  var form = d.getElementById('inquiry');
  if (form) {
    var qs = new URLSearchParams(location.search);
    ['lamp', 'wood', 'chain'].forEach(function (k) {
      var v = qs.get(k), sel = d.getElementById(k);
      if (v && sel && [].some.call(sel.options, function (o) { return o.value === v; })) { sel.value = v; }
    });
    // Put Robert's inquiry address between the quotes at launch.
    var INQUIRY_EMAIL = '';
    var note = d.getElementById('form-note');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!INQUIRY_EMAIL) { note.textContent = 'Draft preview: this form is not connected yet, so nothing was sent.'; return; }
      var f = new FormData(form);
      var body = ['Name: ' + f.get('name'), 'Email: ' + f.get('email'), 'Lamp: ' + f.get('lamp'), 'Wood: ' + f.get('wood'), 'Chain: ' + f.get('chain'), '', f.get('message')].join('\n');
      location.href = 'mailto:' + INQUIRY_EMAIL + '?subject=' + encodeURIComponent('Lamp inquiry: ' + f.get('lamp')) + '&body=' + encodeURIComponent(body);
      note.textContent = 'Your email app is opening with the inquiry ready to send.';
    });
  }
})();

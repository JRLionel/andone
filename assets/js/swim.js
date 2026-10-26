/* ============================================================
   蛙泳十课 · 交互脚本
   1. 阅读进度 / 回到顶部    2. 导航高亮
   3. 滚动揭示              4. 课次筛选 / 展开
   5. 课次打卡（与全景图同步） 6. 自检清单
   ============================================================ */
(function () {
  'use strict';

  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------- 存储 ---------- */
  var store = {
    get: function (k, def) {
      try {
        var v = localStorage.getItem(k);
        return v ? JSON.parse(v) : def;
      } catch (e) { return def; }
    },
    set: function (k, v) {
      try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {}
    }
  };

  /* ---------- 1. 进度条 + 回到顶部 ---------- */
  var bar = $('#bar');
  var toTop = $('#totop');
  var doc = document.documentElement;

  function onScroll() {
    var y = window.pageYOffset || doc.scrollTop;
    var max = doc.scrollHeight - window.innerHeight;
    if (bar) bar.style.width = (max > 0 ? (y / max) * 100 : 0).toFixed(2) + '%';
    if (toTop) toTop.classList.toggle('show', y > 640);
    highlight(y);
  }

  if (toTop) {
    toTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ---------- 2. 导航高亮 ---------- */
  var links = $$('.nav a');
  var sections = links.map(function (a) {
    return document.getElementById(a.getAttribute('href').slice(1));
  });
  var lastOn = -1;

  function highlight(y) {
    if (y < 200) {
      if (lastOn !== -1) { links.forEach(function (l) { l.classList.remove('on'); }); lastOn = -1; }
      return;
    }
    var idx = -1;
    for (var i = 0; i < sections.length; i++) {
      var s = sections[i];
      if (s && s.getBoundingClientRect().top <= 140) idx = i;
    }
    if (idx !== lastOn) {
      links.forEach(function (l, i) { l.classList.toggle('on', i === idx); });
      lastOn = idx;
      if (idx > -1 && links[idx]) {
        var nav = links[idx].parentNode;
        if (nav.scrollWidth > nav.clientWidth) {
          var l = links[idx];
          nav.scrollTo({
            left: l.offsetLeft - nav.clientWidth / 2 + l.offsetWidth / 2,
            behavior: 'smooth'
          });
        }
      }
    }
  }

  var ticking = false;
  window.addEventListener('scroll', function () {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(function () { onScroll(); ticking = false; });
    }
  }, { passive: true });

  /* ---------- 3. 滚动揭示 ---------- */
  var rvItems = $$('.rv');
  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
    rvItems.forEach(function (el) { io.observe(el); });
    // 兜底：2.5 秒后仍未揭示的直接显示
    window.setTimeout(function () {
      rvItems.forEach(function (el) { el.classList.add('in'); });
    }, 2500);
  } else {
    rvItems.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- 4. 课次筛选 / 展开 ---------- */
  var lessons = $$('.lesson');
  var chips = $$('#plan-filter .chip');
  var expandBtn = $('#expand-all');

  function applyFilter(f) {
    lessons.forEach(function (l) {
      l.classList.toggle('hide', f !== 'all' && l.getAttribute('data-stage') !== f);
    });
  }

  chips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      chips.forEach(function (c) { c.classList.remove('on'); });
      chip.classList.add('on');
      applyFilter(chip.getAttribute('data-f'));
    });
  });

  if (expandBtn) {
    expandBtn.addEventListener('click', function () {
      var open = expandBtn.textContent.indexOf('收起') > -1;
      lessons.forEach(function (l) { if (!l.classList.contains('hide')) l.open = !open; });
      expandBtn.textContent = open ? '展开全部' : '收起全部';
    });
  }

  /* ---------- 5. 课次打卡 ---------- */
  var doneList = store.get('swim.lessons', []);
  var mapCells = $$('.lcell');
  var ovDone = $('#ov-done');
  var ovBar = $('#ov-bar');

  function syncOverview() {
    var n = doneList.length;
    if (ovDone) ovDone.textContent = n;
    if (ovBar) ovBar.style.width = (n / 10 * 100) + '%';
    mapCells.forEach(function (c) {
      c.classList.toggle('done', doneList.indexOf(c.getAttribute('data-lesson')) > -1);
    });
  }

  function paintLessons() {
    lessons.forEach(function (l) {
      var id = l.getAttribute('data-lesson');
      var done = doneList.indexOf(id) > -1;
      l.classList.toggle('is-done', done);
      var btn = $('.ls-done', l);
      if (btn) btn.setAttribute('aria-pressed', done ? 'true' : 'false');
    });
  }

  lessons.forEach(function (l) {
    var btn = $('.ls-done', l);
    if (!btn) return;
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      var id = l.getAttribute('data-lesson');
      var i = doneList.indexOf(id);
      if (i > -1) doneList.splice(i, 1); else doneList.push(id);
      store.set('swim.lessons', doneList);
      paintLessons();
      syncOverview();
    });
    btn.addEventListener('keydown', function (e) { e.stopPropagation(); });
  });

  /* 全景图点击 → 跳到对应课次 */
  mapCells.forEach(function (c) {
    c.addEventListener('click', function () {
      var id = c.getAttribute('data-lesson');
      var target = document.getElementById('l' + id);
      if (!target) return;
      var on = $('#plan-filter .chip.on');
      if (on && on.getAttribute('data-f') !== 'all') {
        applyFilter('all');
        $$('#plan-filter .chip').forEach(function (x) { x.classList.toggle('on', x.getAttribute('data-f') === 'all'); });
      }
      target.open = true;
      target.classList.remove('hide');
      var top = target.getBoundingClientRect().top + window.pageYOffset - 96;
      window.scrollTo({ top: top, behavior: 'smooth' });
      target.style.transition = 'box-shadow .3s';
      target.style.boxShadow = '0 0 0 2px #109aab';
      window.setTimeout(function () { target.style.boxShadow = ''; }, 1400);
    });
  });

  /* ---------- 6. 自检清单 ---------- */
  var boxes = $$('#check-grid input[type="checkbox"]');
  var saved = store.get('swim.checks', []);
  var ckDone = $('#ck-done');
  var ckTotal = $('#ck-total');
  var ckBar = $('#ck-bar');
  var reset = $('#ck-reset');

  boxes.forEach(function (b) {
    b.checked = saved.indexOf(b.getAttribute('data-ck')) > -1;
    b.addEventListener('change', function () {
      var arr = boxes.filter(function (x) { return x.checked; })
                     .map(function (x) { return x.getAttribute('data-ck'); });
      store.set('swim.checks', arr);
      paintChecks(arr.length);
    });
  });

  function paintChecks(n) {
    if (ckTotal) ckTotal.textContent = boxes.length;
    if (ckDone) ckDone.textContent = n;
    if (ckBar) ckBar.style.width = (n / boxes.length * 100) + '%';
  }

  if (reset) {
    reset.addEventListener('click', function () {
      boxes.forEach(function (b) { b.checked = false; });
      store.set('swim.checks', []);
      paintChecks(0);
    });
  }

  /* ---------- 初始化 ---------- */
  paintLessons();
  syncOverview();
  paintChecks(boxes.filter(function (b) { return b.checked; }).length);
  onScroll();
})();

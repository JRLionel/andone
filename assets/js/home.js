/* ============================================================
   页面导航 · 逻辑
   ------------------------------------------------------------
   ★ 新增一个页面：在下面 PAGES 数组里加一条即可。
     - title  页面名（必填）
     - sub    一句话副标题（可选）
     - desc   卡片描述（可选）
     - href   相对路径（必填），如 'swim.html'
     - cover  封面图（可选），如 'assets/swim/hero.jpg'；不填用编号占位
     - cat    分类（可选，用于筛选），如 '运动健康'
     - date   日期标签（可选），如 '2026.10'
   ============================================================ */
(function () {
  'use strict';

  var PAGES = [
    {
      no: '01',
      title: '蛙泳 10 次课',
      sub: '零基础自学手册',
      desc: '从熟悉水性到连续游 50 米：六阶段路线图、10 次课计划、四拍技术拆解与安全自救。',
      href: 'swim.html',
      cover: 'assets/swim/hero.jpg',
      cat: '运动健康',
      featured: true,
      date: '2026.10'
    }
  ];

  var LAST_KEY = 'home.last';

  var grid = document.getElementById('grid');
  var input = document.getElementById('q');
  var chipBox = document.getElementById('chips');
  var empty = document.getElementById('empty');
  var countEl = document.getElementById('count');
  var metaEl = document.getElementById('meta');
  var clearBtn = document.getElementById('clear');
  var actsEl = document.getElementById('acts');

  var state = { q: '', cat: '全部' };

  /* ---------- 工具 ---------- */
  function pad(n) {
    return n < 10 ? '0' + n : String(n);
  }

  function readLast() {
    try { return localStorage.getItem(LAST_KEY) || ''; } catch (e) { return ''; }
  }

  function writeLast(href) {
    try { localStorage.setItem(LAST_KEY, href); } catch (e) {}
  }

  /* ---------- 渲染 ---------- */
  function cardHTML(p, i) {
    var no = p.no || pad(i + 1);
    var cover = p.cover
      ? '<img src="' + p.cover + '" alt="' + p.title + ' 封面" loading="lazy">'
      : '<span class="ph" aria-hidden="true">' + no + '</span>';

    return '' +
      '<a class="card" href="' + p.href + '" data-href="' + p.href + '">' +
        '<div class="cover' + (p.cover ? '' : ' is-empty') + '">' +
          cover +
          '<span class="no">' + no + '</span>' +
          (p.cat ? '<span class="cat">' + p.cat + '</span>' : '') +
        '</div>' +
        '<div class="card-body">' +
          '<h2>' + p.title + '</h2>' +
          (p.sub ? '<span class="card-sub">' + p.sub + '</span>' : '') +
          (p.desc ? '<p>' + p.desc + '</p>' : '') +
          '<div class="cfoot">' +
            '<span class="cfoot-l">进入页面 <span class="arrow" aria-hidden="true">→</span></span>' +
            (readLast() === p.href ? '<span class="recent">上次打开</span>'
                                   : '<span class="date">' + (p.date || '') + '</span>') +
          '</div>' +
        '</div>' +
      '</a>';
  }

  function match(p) {
    if (state.cat !== '全部' && p.cat !== state.cat) return false;
    if (!state.q) return true;
    var hay = [p.title, p.sub, p.desc, p.cat, (p.tags || []).join(' ')]
      .join(' ').toLowerCase();
    return hay.indexOf(state.q.toLowerCase()) > -1;
  }

  function render() {
    var list = PAGES.filter(match);
    var filtering = state.q !== '' || state.cat !== '全部';

    var html = list.map(cardHTML).join('');
    // 页面还少时补一张占位卡，避免左侧堆积、右侧大片空白
    if (!filtering && list.length > 0 && list.length <= 2) {
      html += '<div class="slot" aria-hidden="true">' +
                '<span class="slot-badge">+</span>' +
                '<b>更多页面陆续加入</b>' +
                '<span>后续页面会按分类出现在这里。</span>' +
              '</div>';
    }
    grid.innerHTML = html;

    countEl.textContent = filtering
      ? '匹配 ' + list.length + ' / ' + PAGES.length
      : '共 ' + PAGES.length + ' 个页面';

    empty.hidden = list.length > 0;
    grid.hidden = list.length === 0;
  }

  /* ---------- 分类 ---------- */
  function renderChips() {
    var cats = [];
    PAGES.forEach(function (p) {
      if (p.cat && cats.indexOf(p.cat) < 0) cats.push(p.cat);
    });
    if (cats.length < 2) return;               // 只有一个分类时不显示筛选

    var all = ['全部'].concat(cats);
    chipBox.innerHTML = all.map(function (c, i) {
      return '<button type="button" class="chip' + (i === 0 ? ' on' : '') +
             '" data-cat="' + c + '">' + c + '</button>';
    }).join('');
  }

  /* ---------- 首屏主按钮（指向 featured 那一页） ---------- */
  function renderActs() {
    var top = PAGES.filter(function (p) { return p.featured; })[0] || PAGES[0];
    if (!top) return;
    actsEl.innerHTML =
      '<a class="btn-primary" href="' + top.href + '">' +
        '开始：' + top.title +
        ' <span class="arrow" aria-hidden="true">→</span>' +
      '</a>';
  }

  /* ---------- 顶部信息 ---------- */
  function renderMeta() {
    var latest = '';
    PAGES.forEach(function (p) {
      if (p.date && p.date > latest) latest = p.date;
    });

    var items = ['收录 ' + PAGES.length + ' 个页面'];
    if (latest) items.push('最近更新 ' + latest);
    items.push('本地静态页 · 无需登录');

    metaEl.innerHTML = items.map(function (t) {
      return '<span>' + t + '</span>';
    }).join('');
  }

  /* ---------- 事件 ---------- */
  chipBox.addEventListener('click', function (e) {
    var btn = e.target.closest('.chip');
    if (!btn) return;
    state.cat = btn.dataset.cat;
    Array.prototype.forEach.call(chipBox.children, function (c) {
      c.classList.toggle('on', c === btn);
    });
    render();
  });

  input.addEventListener('input', function () {
    state.q = input.value.trim();
    render();
  });

  grid.addEventListener('click', function (e) {
    var card = e.target.closest('.card');
    if (card) writeLast(card.dataset.href);
  });

  function resetSearch() {
    input.value = '';
    state.q = '';
    state.cat = '全部';
    Array.prototype.forEach.call(chipBox.children, function (c, i) {
      c.classList.toggle('on', i === 0);
    });
    render();
    input.focus();
  }

  clearBtn.addEventListener('click', resetSearch);

  document.addEventListener('keydown', function (e) {
    var typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName);

    if (e.key === '/' && !typing) {
      e.preventDefault();
      input.focus();
    } else if (e.key === 'Escape' && document.activeElement === input) {
      if (input.value) resetSearch();
      input.blur();
    }
  });

  /* ---------- 启动 ---------- */
  renderActs();
  renderChips();
  renderMeta();
  render();
})();

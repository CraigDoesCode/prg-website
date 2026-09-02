/* =========================================================================
   The Payroll Giving Scheme - interactions
   No dependencies. Every section is readable and complete without this
   file; everything here is progressive enhancement.
   ========================================================================= */
(function () {
  'use strict';

  var $  = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── Shared radiogroup behaviour for segmented controls ───────────────── */
  function segmentedControl(group, onChange) {
    var buttons = $$('.seg', group);

    function select(button, focus) {
      buttons.forEach(function (b) {
        var on = b === button;
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-checked', String(on));
        b.tabIndex = on ? 0 : -1;
      });
      if (focus) button.focus();
      onChange(button);
    }

    buttons.forEach(function (button) {
      button.tabIndex = button.classList.contains('is-active') ? 0 : -1;
      button.addEventListener('click', function () { select(button); });
    });

    group.addEventListener('keydown', function (e) {
      var index = buttons.indexOf(document.activeElement);
      if (index < 0) return;
      var next = null;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = buttons[(index + 1) % buttons.length];
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = buttons[(index - 1 + buttons.length) % buttons.length];
      else if (e.key === 'Home') next = buttons[0];
      else if (e.key === 'End') next = buttons[buttons.length - 1];
      if (next) { e.preventDefault(); select(next, true); }
    });

    return { buttons: buttons, select: select };
  }

  /* ── Mobile navigation ────────────────────────────────────────────────── */
  (function nav() {
    var toggle = $('#nav-toggle');
    var menu = $('#site-nav');
    if (!toggle || !menu) return;

    function close() {
      menu.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
    }

    toggle.addEventListener('click', function () {
      var open = menu.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(open));
    });

    menu.addEventListener('click', function (e) { if (e.target.closest('a')) close(); });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menu.classList.contains('is-open')) { close(); toggle.focus(); }
    });

    window.addEventListener('resize', function () { if (window.innerWidth > 768) close(); });
  }());

  /* ── Header border and current-section highlighting ───────────────────── */
  (function scrollState() {
    var header = $('.site-header');
    var links = $$('.site-nav ul a');
    var sections = links.map(function (a) { return a.hash ? $(a.hash) : null; }).filter(Boolean);

    function onScroll() { if (header) header.classList.toggle('is-stuck', window.scrollY > 8); }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    if (!('IntersectionObserver' in window) || !sections.length) return;

    /* Track everything in the reading band, then mark the first one in
       document order, so two overlapping sections never both light up. */
    var inBand = [];

    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var at = inBand.indexOf(entry.target.id);
        if (entry.isIntersecting && at === -1) inBand.push(entry.target.id);
        else if (!entry.isIntersecting && at > -1) inBand.splice(at, 1);
      });

      var current = null;
      sections.some(function (section) {
        if (inBand.indexOf(section.id) === -1) return false;
        current = section.id;
        return true;
      });

      links.forEach(function (a) {
        a.classList.toggle('is-current', current !== null && a.hash === '#' + current);
      });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });

    sections.forEach(function (section) { spy.observe(section); });
  }());

  /* ── Scroll reveals ───────────────────────────────────────────────────── */
  (function reveal() {
    if (reduceMotion || !('IntersectionObserver' in window)) return;

    /* Related items are staggered together. Classes are applied here so a
       page without JavaScript shows everything immediately. */
    var groups = [
      ['.hero-copy', '.hero-figure'],
      ['.statband .stat'],
      ['#why .section-head', '#why .split-card'],
      ['#gap .section-head', '#gap .numbered li'],
      ['#how .section-head', '#how .steps li'],
      ['#building .section-head', '#building .product'],
      ['#support .section-head', '#support .columns div', '#support .progress', '#support .giving-as', '#support .tier'],
      ['#goal .goal'],
      ['#faq .section-head', '#faq .faq-item'],
      ['#register .register-copy', '#register .register-form']
    ];

    var io = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        obs.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.1 });

    groups.forEach(function (selectors) {
      var items = [];
      selectors.forEach(function (sel) { items = items.concat($$(sel)); });
      items.forEach(function (el, i) {
        el.classList.add('reveal');
        el.style.setProperty('--reveal-delay', Math.min(i, 5) * 70 + 'ms');
        io.observe(el);
      });
    });
  }());

  /* ── Hero: forty gifts forming one circle ─────────────────────────────── */
  (function collectiveDots() {
    var host = $('#dots');
    var ring = $('#dots-ring');
    if (!host || !ring) return;

    var COUNT = 40;
    var RADIUS = 46;    /* per cent of the ring box */
    var SPAN = 2600;    /* the last dot starts here, so the sequence ends near 3s */

    /* A fixed seed keeps the arrival order varied but the same on every
       visit, so the composition is designed rather than accidental. */
    function shuffledOrder(n) {
      var order = [], i;
      for (i = 0; i < n; i++) order.push(i);
      var seed = 20260826;
      for (i = n - 1; i > 0; i--) {
        seed = (seed * 1103515245 + 12345) % 2147483648;
        var j = seed % (i + 1);
        var tmp = order[i]; order[i] = order[j]; order[j] = tmp;
      }
      return order;
    }

    var order = shuffledOrder(COUNT);
    var fragment = document.createDocumentFragment();

    for (var i = 0; i < COUNT; i++) {
      var angle = (i / COUNT) * Math.PI * 2 - Math.PI / 2;
      var dot = document.createElement('span');
      dot.style.left = (50 + Math.cos(angle) * RADIUS) + '%';
      dot.style.top  = (50 + Math.sin(angle) * RADIUS) + '%';
      if (!reduceMotion) {
        dot.style.animationDelay = Math.round(order[i] / (COUNT - 1) * SPAN) + 'ms';
      }
      fragment.appendChild(dot);
    }

    ring.appendChild(fragment);

    /* Reduced motion gets the finished circle straight away. */
    if (!reduceMotion) host.classList.add('is-animating');
  }());

  /* ── Comparison: Direct Debit against Payroll Giving ──────────────────── */
  (function comparison() {
    var group = $('#rate-group');
    if (!group) return;

    var GIFT = 10;
    var FEE = 3;   /* planned Payroll Giving Agency fee, per cent */

    var ddCharity = $('#dd-charity');
    var ddTax     = $('#dd-tax');
    var note      = $('#split-note');

    function money(value) {
      return '£' + (value % 1 === 0 ? value.toFixed(0) : value.toFixed(2));
    }

    function apply(rate) {
      var charity = GIFT * (1 - rate / 100);
      var tax = GIFT - charity;

      ddCharity.style.width = (charity / GIFT * 100) + '%';
      ddTax.style.width = (tax / GIFT * 100) + '%';
      ddCharity.textContent = money(charity) + ' to charity';
      ddTax.textContent = money(tax) + ' tax';

      note.textContent = '*Illustrative ' + money(GIFT) + ' of gross pay for a ' + rate +
        '% taxpayer, before the planned ' + FEE + '% Payroll Giving Agency fee. A Direct Debit ' +
        'donation may also qualify for Gift Aid, and higher-rate relief on it is normally claimed ' +
        'by the donor through Self Assessment.';
    }

    segmentedControl(group, function (button) { apply(Number(button.dataset.rate)); });
    apply(40);
  }());

  /* ── Product preview tabs ─────────────────────────────────────────────── */
  (function tabs() {
    var list = $('.tablist');
    if (!list) return;
    var tabButtons = $$('[role="tab"]', list);

    function select(tab, focus) {
      tabButtons.forEach(function (t) {
        var on = t === tab;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        var panel = document.getElementById(t.getAttribute('aria-controls'));
        if (panel) panel.hidden = !on;
      });
      if (focus) tab.focus();
    }

    list.addEventListener('click', function (e) {
      var tab = e.target.closest('[role="tab"]');
      if (tab) select(tab);
    });

    list.addEventListener('keydown', function (e) {
      var index = tabButtons.indexOf(document.activeElement);
      if (index < 0) return;
      var next = null;
      if (e.key === 'ArrowRight') next = tabButtons[(index + 1) % tabButtons.length];
      else if (e.key === 'ArrowLeft') next = tabButtons[(index - 1 + tabButtons.length) % tabButtons.length];
      else if (e.key === 'Home') next = tabButtons[0];
      else if (e.key === 'End') next = tabButtons[tabButtons.length - 1];
      if (next) { e.preventDefault(); select(next, true); }
    });
  }());

  /* ── Fundraise progress ───────────────────────────────────────────────── */
  (function progress() {
    var host = $('#progress');
    if (!host) return;

    var raised = Number(host.dataset.raised) || 0;
    var goal = Number(host.dataset.goal) || 0;
    if (!goal) return;

    var gbp = new Intl.NumberFormat('en-GB', {
      style: 'currency', currency: 'GBP', maximumFractionDigits: 0
    });

    $('#progress-raised').textContent = gbp.format(raised);

    var pct = Math.max(0, Math.min(100, raised / goal * 100));
    var fill = $('#progress-fill');
    var bar = host.querySelector('.progress-track');

    bar.setAttribute('role', 'progressbar');
    bar.setAttribute('aria-valuemin', '0');
    bar.setAttribute('aria-valuemax', String(goal));
    bar.setAttribute('aria-valuenow', String(raised));
    bar.setAttribute('aria-valuetext', gbp.format(raised) + ' raised of ' + gbp.format(goal));

    /* Fill on entry so the bar reads as progress rather than decoration. */
    if (reduceMotion || !('IntersectionObserver' in window)) {
      fill.style.width = pct + '%';
      return;
    }
    var io = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        fill.style.width = pct + '%';
        obs.unobserve(entry.target);
      });
    }, { threshold: 0.4 });
    io.observe(host);
  }());

  /* ── Founding tiers, by Giving as: Business / Individual ──────────────── */
  (function foundingTiers() {
    var group = $('#givingas');
    var tiers = $('#tiers');
    if (!group || !tiers) return;

    var CONTENT = {
      business: {
        supporter: {
          benefits: [
            'Listed as a founding supporter',
            'Launch updates as we build',
            'Priority access when we open to employers'
          ],
          cta: 'Give as a business'
        },
        member: {
          benefits: [
            'Everything in Founding Supporter',
            'Named on the launch page',
            'A launch pack for your payroll and your team',
            'Onboarding support in the first cohort'
          ],
          cta: 'Become a founding member'
        },
        partner: {
          benefits: [
            'Everything in Founding Member',
            'Named as a founding partner',
            'A working session to plan your launch',
            'An annual impact summary for your board'
          ],
          cta: 'Become a founding partner'
        }
      },
      individual: {
        supporter: {
          benefits: [
            'Listed as a founding supporter',
            'Launch updates as we build',
            'Early access to the employee guide'
          ],
          cta: 'Support the launch'
        },
        member: {
          benefits: [
            'Everything in Founding Supporter',
            'Named on the launch page',
            'An invitation to the launch briefing',
            'A say in which guides we write first'
          ],
          cta: 'Become a founding member'
        },
        partner: {
          benefits: [
            'Everything in Founding Member',
            'Named as a founding partner',
            'An introduction to your employer, with our support',
            'A session with us on getting a scheme started'
          ],
          cta: 'Become a founding partner'
        }
      }
    };

    var cards = $$('.tier', tiers);
    var status = $('#givingas-status');
    var current = 'business';       /* Business is the initial state, per the brief. */

    function apply(mode) {
      var set = CONTENT[mode];
      if (!set) return;

      cards.forEach(function (card) {
        var data = set[card.dataset.tier];
        if (!data) return;

        $('[data-slot="cta"]', card).textContent = data.cta;

        var list = $('[data-slot="benefits"]', card);
        list.textContent = '';
        data.benefits.forEach(function (text) {
          var li = document.createElement('li');
          li.textContent = text;
          list.appendChild(li);
        });
      });

      if (status) status.textContent = 'Showing ' + mode + ' founding supporter options';
    }

    /* Reserve the height of the taller state so switching never moves the
       cards under the reader. Remeasured when the width changes. */
    function lockHeight() {
      tiers.style.minHeight = '';
      var heights = Object.keys(CONTENT).map(function (mode) {
        apply(mode);
        return tiers.getBoundingClientRect().height;
      });
      apply(current);
      tiers.style.minHeight = Math.ceil(Math.max.apply(null, heights)) + 'px';
    }

    segmentedControl(group, function (button) {
      current = button.dataset.mode;
      apply(current);
    });

    apply(current);

    var lastWidth = window.innerWidth;
    var relock;
    window.addEventListener('resize', function () {
      if (window.innerWidth === lastWidth) return;
      lastWidth = window.innerWidth;
      window.clearTimeout(relock);
      relock = window.setTimeout(lockHeight, 150);
    });

    /* Wait for webfonts so the measurement matches what people actually see. */
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(lockHeight);
    else window.addEventListener('load', lockHeight);
  }());

  /* ── FAQ: one answer open at a time ───────────────────────────────────── */
  (function faq() {
    var items = $$('.faq-item');
    items.forEach(function (item) {
      item.addEventListener('toggle', function () {
        if (!item.open) return;
        items.forEach(function (other) { if (other !== item) other.open = false; });
      });
    });
  }());

  /* ── Register form ────────────────────────────────────────────────────── */
  (function register() {
    var form = $('#register-form');
    if (!form) return;

    var status = $('#form-status');
    var button = $('#submit-btn');
    var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    var RULES = {
      name:    function (field) { return field.value.trim().length >= 2 || 'Please tell us your name.'; },
      email:   function (field) { return emailPattern.test(field.value.trim()) || 'Please enter a valid email address.'; },
      consent: function (field) { return field.checked || 'Please tick the box so we can reply.'; }
    };

    function showError(field, message) {
      var wrap = field.closest('.field');
      var slot = wrap && wrap.querySelector('[data-error-for="' + field.name + '"]');
      if (wrap) wrap.classList.toggle('is-invalid', Boolean(message));
      field.setAttribute('aria-invalid', String(Boolean(message)));
      if (slot) slot.textContent = message || '';
    }

    function validate(field) {
      var result = RULES[field.name](field);
      showError(field, result === true ? '' : result);
      return result === true;
    }

    Object.keys(RULES).forEach(function (name) {
      var field = form.elements[name];
      if (!field) return;
      field.addEventListener('blur', function () { validate(field); });
      field.addEventListener('change', function () { validate(field); });
      field.addEventListener('input', function () {
        if (field.getAttribute('aria-invalid') === 'true') validate(field);
      });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var firstInvalid = null;
      Object.keys(RULES).forEach(function (name) {
        var field = form.elements[name];
        if (field && !validate(field) && !firstInvalid) firstInvalid = field;
      });

      if (firstInvalid) {
        status.textContent = 'Please check the highlighted fields.';
        firstInvalid.focus();
        return;
      }

      /* There is no backend yet. Replace this block with a fetch() to your
         form endpoint and keep the same three states. */
      button.setAttribute('aria-busy', 'true');
      status.textContent = 'Sending.';

      window.setTimeout(function () {
        button.removeAttribute('aria-busy');
        status.textContent = 'Thank you. We will be in touch.';
        form.reset();
        $$('.field.is-invalid', form).forEach(function (field) { field.classList.remove('is-invalid'); });
      }, 600);
    });
  }());

  /* ── Footer year ──────────────────────────────────────────────────────── */
  (function year() {
    var el = $('#year');
    if (el) el.textContent = String(new Date().getFullYear());
  }());
}());

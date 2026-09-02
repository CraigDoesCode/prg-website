/* =========================================================================
   The Payroll Giving Scheme - holding page
   The page is complete without this file; it adds the dot animation and
   client-side validation only.
   ========================================================================= */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── Forty gifts forming one circle ───────────────────────────────────── */
  (function collectiveDots() {
    var host = document.getElementById('dots');
    var ring = document.getElementById('dots-ring');
    if (!host || !ring) return;

    var COUNT = 40;
    var RADIUS = 46;   /* per cent of the ring box */
    var SPAN = 2600;   /* the last dot starts here, so it finishes near 3s */

    /* A fixed seed keeps the arrival order varied but the same every visit. */
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

  /* ── Footer year ──────────────────────────────────────────────────────── */
  (function year() {
    var el = document.getElementById('year');
    if (el) el.textContent = String(new Date().getFullYear());
  }());
}());

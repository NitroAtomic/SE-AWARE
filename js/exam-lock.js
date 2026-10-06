/* ==========================================================================
   exam-lock.js: hides the chatbot while a quiz or assessment is running
   --------------------------------------------------------------------------
   A learner should not be able to ask the assistant for the answer in the
   middle of a test. Hiding the widget on the quiz page alone is not enough:
   the site can be open in two tabs, and a quiz in one tab left the chatbot
   reachable in the other.

   So the "a test is running" flag lives in localStorage, which every tab of
   the same site shares, rather than in a variable belonging to one page.

   The flag carries a timestamp and is refreshed while the test runs. If a
   tab is closed mid-quiz, or the browser crashes, the last timestamp simply
   stops moving and the flag ages out - otherwise a crash during a quiz
   would hide the chatbot permanently.
   ========================================================================== */
(function () {
  "use strict";

  var KEY = "se_exam_active";
  var HEARTBEAT_MS = 15000;   // how often a running test re-stamps the flag
  var STALE_MS = 45000;       // older than this and we assume the tab is gone

  var timer = null;
  var listeners = [];

  function now() { return Date.now(); }

  function read() {
    try {
      var raw = localStorage.getItem(KEY);
      return raw ? Number(raw) : 0;
    } catch (err) {
      // Private browsing, or storage blocked. Fall back to "no test running"
      // rather than throwing - a hidden chatbot is worse than a visible one.
      return 0;
    }
  }

  function write(value) {
    try {
      if (value) localStorage.setItem(KEY, String(value));
      else localStorage.removeItem(KEY);
    } catch (err) { /* no-op */ }
  }

  function isActive() {
    var stamp = read();
    return !!stamp && (now() - stamp) < STALE_MS;
  }

  function notify() {
    var active = isActive();
    listeners.forEach(function (fn) {
      try { fn(active); } catch (err) { /* a bad listener must not stop the rest */ }
    });
  }

  function start() {
    write(now());
    notify();
    if (timer) clearInterval(timer);
    timer = setInterval(function () {
      write(now());
    }, HEARTBEAT_MS);
  }

  function stop() {
    if (timer) { clearInterval(timer); timer = null; }
    write(null);
    notify();
  }

  function subscribe(fn) {
    listeners.push(fn);
    try { fn(isActive()); } catch (err) { /* no-op */ }
  }

  // Another tab started or finished a test.
  window.addEventListener("storage", function (e) {
    if (e.key === KEY) notify();
  });

  // Leaving the page ends this tab's test. pagehide fires on back/forward
  // navigation too, where unload sometimes does not.
  window.addEventListener("pagehide", function () {
    if (timer) { clearInterval(timer); timer = null; }
    write(null);
  });

  window.SEExam = {
    start: start,
    stop: stop,
    isActive: isActive,
    subscribe: subscribe
  };
})();

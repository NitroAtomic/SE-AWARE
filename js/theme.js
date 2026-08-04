/* ==========================================================================
   theme.js: light and dark appearance
   Web-Based Social Engineering Awareness Platform for Remote Workers
   Group 4 · S3102 · MO-IT200D1 Capstone 1
   --------------------------------------------------------------------------
   WHY THIS FILE LOADS IN THE HEAD, BEFORE ANYTHING ELSE

   Every other script on this site is deferred to the end of the body. This
   one cannot be. If the theme were applied after the first paint, a visitor
   who prefers dark would see a full-brightness white page flash first, which
   is the single most common defect in a hand-rolled dark mode.

   Applying the attribute here, synchronously, before the browser has painted
   anything, means the correct palette is in place for the very first frame.

   PRECEDENCE
     1. An explicit choice the visitor made, remembered in localStorage
     2. Otherwise, whatever the operating system asks for
     3. Otherwise, light

   Only the string "light" or "dark" is ever stored, under one key. No
   identifiers, no analytics, nothing that could identify a person. That
   matters here: a platform that teaches privacy should not quietly track the
   people reading it.
   ========================================================================== */

(function () {
  "use strict";

  var KEY = "se-theme";
  var root = document.documentElement;

  /* localStorage throws rather than returning null in a few real situations:
     Safari private browsing, and any browser configured to block site data.
     A theme preference is never worth breaking the page over. */
  function readStored() {
    try {
      var v = window.localStorage.getItem(KEY);
      return v === "light" || v === "dark" ? v : null;
    } catch (e) {
      return null;
    }
  }

  function store(theme) {
    try {
      window.localStorage.setItem(KEY, theme);
    } catch (e) {
      /* Preference lasts for this page view only. Nothing else breaks. */
    }
  }

  function systemPrefersDark() {
    return !!(window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches);
  }

  function resolve() {
    return readStored() || (systemPrefersDark() ? "dark" : "light");
  }

  function apply(theme) {
    root.setAttribute("data-theme", theme);

    /* Keep the mobile browser chrome in step with the page. */
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", theme === "dark" ? "#0A1A2F" : "#0B2545");

    syncButtons(theme);
  }

  function syncButtons(theme) {
    var isDark = theme === "dark";
    var buttons = document.querySelectorAll("[data-theme-toggle]");
    for (var i = 0; i < buttons.length; i++) {
      var b = buttons[i];
      b.setAttribute("aria-pressed", isDark ? "true" : "false");
      b.setAttribute("aria-label", isDark ? "Switch to light theme" : "Switch to dark theme");
      b.setAttribute("title", isDark ? "Switch to light theme" : "Switch to dark theme");
      var icon = b.querySelector("i");
      if (icon) icon.className = "bi " + (isDark ? "bi-sun-fill" : "bi-moon-stars-fill");
      var label = b.querySelector("[data-theme-label]");
      if (label) label.textContent = isDark ? "Light theme" : "Dark theme";
    }
  }

  function toggle() {
    var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
    store(next);
    apply(next);
  }

  /* Run immediately: this is the part that has to beat the first paint. */
  apply(resolve());

  /* Wire the buttons once the navbar exists. */
  document.addEventListener("DOMContentLoaded", function () {
    syncButtons(root.getAttribute("data-theme"));
    var buttons = document.querySelectorAll("[data-theme-toggle]");
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].addEventListener("click", toggle);
    }
  });

  /* Follow the system if the visitor has never chosen for themselves. Someone
     on a schedule that flips at sunset gets the change without a reload. */
  if (window.matchMedia) {
    var mq = window.matchMedia("(prefers-color-scheme: dark)");
    var onChange = function () {
      if (!readStored()) apply(systemPrefersDark() ? "dark" : "light");
    };
    if (mq.addEventListener) mq.addEventListener("change", onChange);
    else if (mq.addListener) mq.addListener(onChange);
  }

  /* Exposed for the test suites, which need to force a theme deterministically
     rather than depending on the machine running them. */
  window.SETheme = { apply: apply, toggle: toggle, current: function () { return root.getAttribute("data-theme"); } };
})();

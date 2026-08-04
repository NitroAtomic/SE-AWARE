/* ==========================================================================
   main.js: shared UI behaviour across every page
   Web-Based Social Engineering Awareness Platform for Remote Workers
   Group 4 · S3102 · MO-IT200D1 Capstone 1
   --------------------------------------------------------------------------
   Responsibilities:
     1. Highlight the current page in the navigation bar
     2. Stamp the current year into the footer
     3. Provide small shared helpers used by other scripts
   No user data is collected, stored, or transmitted anywhere in this file.
   ========================================================================== */

(function () {
  "use strict";

  /* ----------------------------------------------------------------------
     1. Active navigation state
     Marks the nav link whose data-nav value matches the page's data-page.
     ---------------------------------------------------------------------- */
  function setActiveNav() {
    var page = document.body.getAttribute("data-page");
    if (!page) return;

    var links = document.querySelectorAll(".se-navbar [data-nav]");
    for (var i = 0; i < links.length; i++) {
      if (links[i].getAttribute("data-nav") === page) {
        links[i].classList.add("active");
        links[i].setAttribute("aria-current", "page");
      }
    }
  }

  /* ----------------------------------------------------------------------
     2. Footer year
     ---------------------------------------------------------------------- */
  function setFooterYear() {
    var nodes = document.querySelectorAll("[data-year]");
    var year = new Date().getFullYear();
    for (var i = 0; i < nodes.length; i++) {
      nodes[i].textContent = year;
    }
  }

  /* ----------------------------------------------------------------------
     3. Close the mobile navbar after a link is tapped
     Prevents the collapsed menu from covering the page on small screens.
     ---------------------------------------------------------------------- */
  function collapseNavOnClick() {
    var collapse = document.getElementById("seNav");
    if (!collapse) return;

    var links = collapse.querySelectorAll(".nav-link");
    for (var i = 0; i < links.length; i++) {
      links[i].addEventListener("click", function () {
        if (collapse.classList.contains("show") && window.bootstrap) {
          var instance = window.bootstrap.Collapse.getInstance(collapse);
          if (instance) instance.hide();
        }
      });
    }
  }

  /* ----------------------------------------------------------------------
     4. Shared helpers exposed for quiz.js and chatbot.js
     ---------------------------------------------------------------------- */
  window.SEUtil = {
    /** Escape a string before inserting it into innerHTML. */
    escapeHtml: function (str) {
      return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    },

    /** Read a query-string parameter from the current URL. */
    getParam: function (name) {
      return new URLSearchParams(window.location.search).get(name);
    },

    /**
     * Fisher-Yates shuffle. Returns a NEW array; the input is not mutated.
     * Used by the quiz engine to randomise both question selection and
     * answer-option order (test case FT-05).
     */
    shuffle: function (arr) {
      var copy = arr.slice();
      for (var i = copy.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var tmp = copy[i];
        copy[i] = copy[j];
        copy[j] = tmp;
      }
      return copy;
    },

    /** Detect whether the page lives inside /modules/ so links can resolve. */
    rootPrefix: function () {
      return document.body.getAttribute("data-root") || "";
    }
  };

  /* ----------------------------------------------------------------------
     Init
     ---------------------------------------------------------------------- */
  document.addEventListener("DOMContentLoaded", function () {
    setActiveNav();
    setFooterYear();
    collapseNavOnClick();
  });
})();

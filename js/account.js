/* ==========================================================================
   account.js — account state in the navigation bar, premium gating, and
   the "mark module complete" control
   Web-Based Social Engineering Awareness Platform for Remote Workers
   Group 4 · S3102 · MO-IT200D1 Capstone 1
   --------------------------------------------------------------------------
   This script runs on EVERY page but must never change the guest experience.
   A visitor who never signs in sees exactly the free, login-free platform
   described in FR-07. Everything below is progressive enhancement layered on
   top of that.
   ========================================================================== */

(function () {
  "use strict";

  function root() {
    return document.body.getAttribute("data-root") || "";
  }

  /* ----------------------------------------------------------------------
     1. Account controls in the navbar
     Guest      ->  "Go Premium" + "Log in"
     Signed in  ->  "Dashboard" + a dropdown with the plan and sign-out
     ---------------------------------------------------------------------- */
  function renderNavAccount() {
    var host = document.getElementById("seNavAccount");
    if (!host) return;

    var r = root();
    var user = window.SEStore.getUser();

    if (!user) {
      host.innerHTML =
        '<li class="nav-item"><a class="nav-link se-nav-premium" href="' + r + 'go-premium.html">' +
        '<i class="bi bi-stars" aria-hidden="true"></i> Go Premium</a></li>' +
        '<li class="nav-item"><a class="nav-link" href="' + r + 'login.html">Log in</a></li>';
      return;
    }

    var isPremium = user.subscription === "Premium";
    var initials = (user.firstName || user.email || "?").trim().charAt(0).toUpperCase();

    host.innerHTML =
      '<li class="nav-item"><a class="nav-link" href="' + r + 'dashboard.html">Dashboard</a></li>' +
      '<li class="nav-item dropdown">' +
      '  <button class="nav-link dropdown-toggle se-nav-user" data-bs-toggle="dropdown" aria-expanded="false">' +
      '    <span class="se-avatar">' + window.SEUtil.escapeHtml(initials) + "</span>" +
      "    <span>" + window.SEUtil.escapeHtml(user.firstName || user.email) + "</span>" +
      "  </button>" +
      '  <ul class="dropdown-menu dropdown-menu-end">' +
      '    <li><span class="dropdown-item-text small text-body-secondary">' + window.SEUtil.escapeHtml(user.email) + "</span></li>" +
      '    <li><span class="dropdown-item-text"><span class="se-pill ' + (isPremium ? "" : "muted") + '">' +
      '      <i class="bi ' + (isPremium ? "bi-stars" : "bi-person") + '" aria-hidden="true"></i> ' +
      (isPremium ? "Premium" : "Free") + " plan</span></span></li>" +
      '    <li><hr class="dropdown-divider"></li>' +
      '    <li><a class="dropdown-item" href="' + r + 'dashboard.html">Dashboard</a></li>' +
      '    <li><a class="dropdown-item" href="' + r + 'assessment.html">Awareness assessment</a></li>' +
      (isPremium
        ? '    <li><a class="dropdown-item" href="' + r + 'premium-modules.html">Premium modules</a></li>'
        : '    <li><a class="dropdown-item" href="' + r + 'go-premium.html">Upgrade to Premium</a></li>') +
      '    <li><hr class="dropdown-divider"></li>' +
      '    <li><button type="button" class="dropdown-item" id="seSignOut">Sign out</button></li>' +
      "  </ul>" +
      "</li>";

    var out = document.getElementById("seSignOut");
    if (out) {
      out.addEventListener("click", function () {
        window.SEStore.logout();
        window.location.href = r + "index.html";
      });
    }
  }

  /* ----------------------------------------------------------------------
     2. Prototype badge
     Every premium-tier page carries an honest label. We do not fake
     persistence we do not have.
     ---------------------------------------------------------------------- */
  function renderPrototypeBadge() {
    var host = document.querySelector("[data-prototype-badge]");
    if (!host) return;
    host.innerHTML =
      '<div class="se-proto-badge">' +
      '  <i class="bi bi-cone-striped" aria-hidden="true"></i>' +
      "  <div><strong>Prototype &mdash; session data only.</strong> " +
      "  This part of the platform demonstrates the premium user journey. Nothing is sent to a server, no password is " +
      "  stored, and everything here disappears when you close this browser tab.</div>" +
      "</div>";
  }

  /* ----------------------------------------------------------------------
     3. Premium gate
     Pages marked data-requires="signin" or data-requires="premium" replace
     their content with a prompt when the visitor does not qualify.
     ---------------------------------------------------------------------- */
  function applyGate() {
    var gate = document.querySelector("[data-requires]");
    if (!gate) return true;

    var need = gate.getAttribute("data-requires");
    var r = root();
    var signedIn = window.SEStore.isSignedIn();
    var premium = window.SEStore.isPremium();

    if (need === "signin" && !signedIn) {
      gate.innerHTML = lockCard(
        "bi-box-arrow-in-right",
        "Sign in to continue",
        "This page is part of the premium experience. Sign in, or create an account, to see it.",
        [
          { href: r + "login.html", label: "Log in", primary: true },
          { href: r + "register.html", label: "Create an account", primary: false }
        ]
      );
      return false;
    }

    if (need === "premium" && !premium) {
      gate.innerHTML = lockCard(
        "bi-stars",
        signedIn ? "This is a Premium feature" : "Sign in to continue",
        signedIn
          ? "Role-based modules cover the scenarios remote workers meet in client work. Upgrade to unlock them."
          : "Sign in and upgrade to reach the role-based modules.",
        signedIn
          ? [{ href: r + "go-premium.html", label: "See what Premium includes", primary: true },
             { href: r + "modules.html", label: "Back to free modules", primary: false }]
          : [{ href: r + "login.html", label: "Log in", primary: true },
             { href: r + "register.html", label: "Create an account", primary: false }]
      );
      return false;
    }

    return true;
  }

  function lockCard(icon, title, body, actions) {
    var btns = actions.map(function (a) {
      return '<a class="btn ' + (a.primary ? "btn-se-primary" : "btn-se-outline") + '" href="' +
        a.href + '">' + a.label + "</a>";
    }).join(" ");

    return (
      '<div class="se-quiz-shell text-center">' +
      '  <div class="se-lock-icon"><i class="bi ' + icon + '" aria-hidden="true"></i></div>' +
      '  <h2 class="h4 mt-3">' + title + "</h2>" +
      '  <p class="mx-auto mb-4" style="max-width:48ch;">' + body + "</p>" +
      '  <div class="d-flex flex-wrap gap-2 justify-content-center">' + btns + "</div>" +
      "</div>"
    );
  }

  /* ----------------------------------------------------------------------
     4. "Mark this module as complete"
     Injected into module pages only when someone is signed in, so the guest
     view of a module page is byte-for-byte the free experience.
     ---------------------------------------------------------------------- */
  function renderModuleProgress() {
    var host = document.getElementById("seModuleProgress");
    if (!host) return;

    if (!window.SEStore.isSignedIn()) {
      host.innerHTML = "";
      return;
    }

    var slug = document.body.getAttribute("data-module");
    if (!slug) return;

    var done = !!window.SEStore.getProgress()[slug];

    host.innerHTML =
      '<div class="se-progress-strip ' + (done ? "is-done" : "") + '">' +
      '  <div><i class="bi ' + (done ? "bi-check-circle-fill" : "bi-circle") + '" aria-hidden="true"></i> ' +
      "    <strong>" + (done ? "Marked as complete" : "Track your progress") + "</strong>" +
      "    <span class=\"d-block\" style=\"font-size:.88rem;\">" +
      (done ? "This module shows as completed on your dashboard."
            : "Mark this module once you have read it, and it will appear on your dashboard.") +
      "</span>" +
      "  </div>" +
      '  <button type="button" class="btn ' + (done ? "btn-se-outline" : "btn-se-primary") + '" id="seToggleComplete">' +
      (done ? "Mark as not read" : "Mark as complete") +
      "  </button>" +
      "</div>";

    document.getElementById("seToggleComplete").addEventListener("click", function () {
      if (done) window.SEStore.unmarkModule(slug);
      else window.SEStore.markModuleComplete(slug);
      renderModuleProgress();
    });
  }

  /* ----------------------------------------------------------------------
     Init
     ---------------------------------------------------------------------- */
  document.addEventListener("DOMContentLoaded", function () {
    renderNavAccount();
    renderPrototypeBadge();
    var allowed = applyGate();
    renderModuleProgress();

    // Let page scripts know whether the gate let them through.
    window.SEGateOpen = allowed;
    document.dispatchEvent(new CustomEvent("se:ready", { detail: { allowed: allowed } }));
  });
})();

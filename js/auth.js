/* ==========================================================================
   auth.js — registration, sign-in, and the simulated upgrade
   Web-Based Social Engineering Awareness Platform for Remote Workers
   Group 4 · S3102 · MO-IT200D1 Capstone 1
   --------------------------------------------------------------------------
   PROTOTYPE ONLY. Validation here is client-side formatting only. No
   credential is transmitted, and no password is stored anywhere — not in
   memory, not in sessionStorage, not hashed. Real authentication belongs on
   the server and is Capstone 2 work.

   That is a deliberate choice rather than an omission: storing a password
   client-side, even hashed, would teach exactly the habit this platform
   spends six modules warning people about.
   ========================================================================== */

(function () {
  "use strict";

  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

  function root() {
    return document.body.getAttribute("data-root") || "";
  }

  function showError(id, message) {
    var el = document.getElementById(id);
    if (!el) return;
    el.textContent = message;
    el.classList.add("show");
  }

  function clearErrors(form) {
    var errs = form.querySelectorAll(".se-field-error");
    for (var i = 0; i < errs.length; i++) errs[i].classList.remove("show");
    var alert = form.querySelector(".se-form-alert");
    if (alert) alert.classList.remove("show", "err", "ok");
  }

  function formAlert(form, type, message) {
    var el = form.querySelector(".se-form-alert");
    if (!el) return;
    el.className = "se-form-alert show " + type;
    el.innerHTML = message;
  }

  /* ======================================================================
     REGISTER  (test case AU-01)
     ====================================================================== */
  function initRegister() {
    var form = document.getElementById("seRegisterForm");
    if (!form) return;

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      clearErrors(form);

      var first = document.getElementById("regFirst").value.trim();
      var last = document.getElementById("regLast").value.trim();
      var email = document.getElementById("regEmail").value.trim();
      var pass = document.getElementById("regPass").value;
      var confirm = document.getElementById("regConfirm").value;
      var agreed = document.getElementById("regTerms").checked;

      var ok = true;

      if (first.length < 2) { showError("errRegFirst", "Please enter your first name."); ok = false; }
      if (!EMAIL_RE.test(email)) { showError("errRegEmail", "Enter a valid email address."); ok = false; }
      if (pass.length < 8) { showError("errRegPass", "Use at least 8 characters."); ok = false; }
      else if (!/[a-z]/i.test(pass) || !/[0-9]/.test(pass)) {
        showError("errRegPass", "Include at least one letter and one number.");
        ok = false;
      }
      if (pass !== confirm) { showError("errRegConfirm", "The two passwords do not match."); ok = false; }
      if (!agreed) { showError("errRegTerms", "Please acknowledge the prototype notice."); ok = false; }

      if (!ok) return;

      var res = window.SEStore.register(first, last, email);
      if (!res.ok) {
        formAlert(form, "err", res.error);
        return;
      }

      formAlert(form, "ok", "<strong>Account created.</strong> Taking you to your dashboard&hellip;");
      setTimeout(function () { window.location.href = root() + "dashboard.html"; }, 700);
    });
  }

  /* ======================================================================
     LOGIN  (test case AU-02)
     ====================================================================== */
  function initLogin() {
    var form = document.getElementById("seLoginForm");
    if (!form) return;

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      clearErrors(form);

      var email = document.getElementById("loginEmail").value.trim();
      var pass = document.getElementById("loginPass").value;
      var ok = true;

      if (!EMAIL_RE.test(email)) { showError("errLoginEmail", "Enter a valid email address."); ok = false; }
      if (pass.length < 8) { showError("errLoginPass", "Passwords are at least 8 characters."); ok = false; }
      if (!ok) return;

      var res = window.SEStore.login(email);
      if (!res.ok) {
        formAlert(form, "err", res.error + ' <a href="' + root() + 'register.html">Create one now</a>.');
        return;
      }

      formAlert(form, "ok", "<strong>Signed in.</strong> Taking you to your dashboard&hellip;");
      setTimeout(function () { window.location.href = root() + "dashboard.html"; }, 600);
    });
  }

  /* ======================================================================
     GO PREMIUM  (simulated upgrade — scope excludes payment gateways)
     ====================================================================== */
  function initUpgrade() {
    var btn = document.getElementById("seUpgradeBtn");
    var status = document.getElementById("seUpgradeStatus");
    if (!btn) return;

    function render() {
      var user = window.SEStore.getUser();
      var r = root();

      if (!user) {
        btn.textContent = "Sign in to upgrade";
        btn.disabled = false;
        btn.onclick = function () { window.location.href = r + "login.html"; };
        status.innerHTML =
          '<span class="se-pill muted"><i class="bi bi-person" aria-hidden="true"></i> Not signed in</span>';
        return;
      }

      if (user.subscription === "Premium") {
        btn.innerHTML = '<i class="bi bi-check-lg" aria-hidden="true"></i> You are on Premium';
        btn.disabled = true;
        status.innerHTML =
          '<span class="se-pill"><i class="bi bi-stars" aria-hidden="true"></i> Premium active</span> ' +
          '<a class="ms-2" href="' + r + 'premium-modules.html">Open the role-based modules</a> ' +
          '<button type="button" class="btn btn-se-outline btn-sm ms-2" id="seDowngrade">Revert to Free</button>';

        var down = document.getElementById("seDowngrade");
        if (down) {
          down.addEventListener("click", function () {
            window.SEStore.downgrade();
            render();
          });
        }
        return;
      }

      btn.innerHTML = '<i class="bi bi-stars" aria-hidden="true"></i> Simulate Upgrade';
      btn.disabled = false;
      btn.onclick = function () {
        window.SEStore.upgrade();
        render();
      };
      status.innerHTML =
        '<span class="se-pill muted"><i class="bi bi-person" aria-hidden="true"></i> Free plan</span>';
    }

    render();
  }

  document.addEventListener("DOMContentLoaded", function () {
    initRegister();
    initLogin();
    initUpgrade();
  });
})();

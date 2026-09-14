/* ==========================================================================
   auth.js: registration, sign-in, and Stripe Checkout upgrade
   Web-Based Social Engineering Awareness Platform for Remote Workers
   Group 4 · S3102 · MO-IT200D1 Capstone 1
   --------------------------------------------------------------------------
   Client validation is backed by the Node API. Passwords are sent only to the
   configured server and stored there as bcrypt hashes.
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

    form.addEventListener("submit", async function (e) {
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
      if (!agreed) { showError("errRegTerms", "Please acknowledge the account notice."); ok = false; }

      if (!ok) return;

      var res = await window.SEStore.register(first, last, email, pass);
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

    form.addEventListener("submit", async function (e) {
      e.preventDefault();
      clearErrors(form);

      var email = document.getElementById("loginEmail").value.trim();
      var pass = document.getElementById("loginPass").value;
      var ok = true;

      if (!EMAIL_RE.test(email)) { showError("errLoginEmail", "Enter a valid email address."); ok = false; }
      if (pass.length < 8) { showError("errLoginPass", "Passwords are at least 8 characters."); ok = false; }
      if (!ok) return;

      var res = await window.SEStore.login(email, pass);
      if (!res.ok) {
        formAlert(form, "err", res.error + ' <a href="' + root() + 'register.html">Create one now</a>.');
        return;
      }

      formAlert(form, "ok", "<strong>Signed in.</strong> Taking you to your dashboard&hellip;");
      setTimeout(function () { window.location.href = root() + "dashboard.html"; }, 600);
    });
  }

  /* ======================================================================
     GO PREMIUM  (plan change only; scope excludes payment gateways)
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
          down.addEventListener("click", async function () {
            await window.SEStore.downgrade();
            render();
          });
        }
        return;
      }

      // Labelled plainly rather than dressed up as a checkout. No payment is
      // taken, and a platform that teaches people to distrust convincing
      // payment screens should not present a fake one of its own.
      btn.innerHTML = '<i class="bi bi-stars" aria-hidden="true"></i> Switch to Premium';
      btn.disabled = false;
      btn.onclick = async function () {
        btn.disabled = true;
        var result = await window.SEStore.upgrade();
        if (result.ok) {
          render();
          return;
        }
        btn.disabled = false;
        status.innerHTML = '<span class="text-danger">' + window.SEUtil.escapeHtml(result.error) + '</span>';
      };
      status.innerHTML =
        '<span class="se-pill muted"><i class="bi bi-person" aria-hidden="true"></i> Free plan</span>' +
        '<span class="d-block mt-2" style="font-size:.86rem;color:var(--se-muted);">' +
        'No payment is taken. Billing and payment processing are outside this study\'s scope, ' +
        'so switching plans simply records the change on your account.</span>';
    }

    render();
  }

  document.addEventListener("DOMContentLoaded", function () {
    window.SEStore.ready().then(function () {
      initRegister();
      initLogin();
      initUpgrade();
    });
  });
})();

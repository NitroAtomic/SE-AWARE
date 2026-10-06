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
  /* Which plan the visitor picked on go-premium.html before coming here.
     It arrives in the query string, which anyone could edit by hand - but
     no money changes hands, and the server only accepts "monthly" or
     "yearly", so the worst an edited URL achieves is picking the other
     price on a plan that is free to switch either way. */
  function chosenPlanFromUrl() {
    var match = /[?&]plan=([a-z]+)/i.exec(window.location.search);
    if (!match) return null;
    var plan = match[1].toLowerCase();
    return (plan === "monthly" || plan === "yearly") ? plan : null;
  }

  function initRegister() {
    var form = document.getElementById("seRegisterForm");
    if (!form) return;

    var plan = chosenPlanFromUrl();
    var summary = document.getElementById("seRegisterPlan");

    /* An account only exists because someone went Premium - the free tier
       needs no signup at all. So arriving here with no plan chosen means
       the first step was skipped, and the plan page is where it happens.
       Someone already signed in is left alone; they are not registering. */
    if (!plan && !window.SEStore.isSignedIn()) {
      window.location.replace(root() + "go-premium.html");
      return;
    }

    // Say what they are signing up for, so the Premium account that appears
    // at the end is not a surprise.
    if (plan && summary) {
      var p = PLANS[plan];
      summary.innerHTML =
        '<div class="se-callout mb-4">' +
        '<strong>You are creating a Premium account.</strong> ' +
        p.price + p.unit + ' &middot; ' + p.billing +
        '<span class="d-block mt-2" style="font-size:.88rem;">' +
        'No payment is taken. Billing and payment processing are outside this ' +
        'study\'s scope, so the plan is simply recorded on your account.' +
        '</span></div>';
    }

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

      /* The plan is applied at the end of the checkout, not here. Setting it
         the moment the account exists would hand over Premium before the
         payment step the person is about to be shown, which makes that step
         look like a formality it can skip. */
      if (plan) {
        formAlert(form, "ok", "<strong>Account created.</strong> One more step&hellip;");
        setTimeout(function () {
          window.location.href = root() + "payment.html?plan=" + plan;
        }, 700);
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

      // Premium accounts are not signed in yet — the backend emailed a code.
      if (res.requiresOtp) {
        showOtpStep(form, res);
        return;
      }

      goToDashboard(form);
    });

    initOtpStep(form);
  }

  function goToDashboard(form) {
    formAlert(form, "ok", "<strong>Signed in.</strong> Taking you to your dashboard&hellip;");
    setTimeout(function () { window.location.href = root() + "dashboard.html"; }, 600);
  }

  /* ----------------------------------------------------------------------
     One-time code step (Premium logins only)
     ---------------------------------------------------------------------- */
  function showOtpStep(form, res) {
    var passStep = document.getElementById("loginStepPassword");
    var otpStep = document.getElementById("loginStepOtp");
    if (!passStep || !otpStep) return;   // older copy of login.html

    var mailLabel = document.getElementById("otpEmail");
    if (mailLabel && res.email) mailLabel.textContent = res.email;

    passStep.hidden = true;
    otpStep.hidden = false;

    var note = "We sent a 6-digit code to your email.";
    if (res.expiresInMinutes) {
      note = "We sent a 6-digit code to your email. It expires in "
           + res.expiresInMinutes + " minutes.";
    }
    formAlert(form, "ok", "<strong>Password accepted.</strong> " + note);

    var input = document.getElementById("loginOtp");
    if (input) { input.value = ""; input.focus(); }
  }

  function hideOtpStep() {
    var passStep = document.getElementById("loginStepPassword");
    var otpStep = document.getElementById("loginStepOtp");
    if (passStep) passStep.hidden = false;
    if (otpStep) otpStep.hidden = true;
  }

  function initOtpStep(form) {
    var verify = document.getElementById("otpVerifyBtn");
    var resend = document.getElementById("otpResendBtn");
    var cancel = document.getElementById("otpCancelBtn");
    var input = document.getElementById("loginOtp");
    if (!verify || !input) return;

    // Digits only, 6 max. Stops a pasted "012-345" failing the regex check.
    input.addEventListener("input", function () {
      var digits = input.value.replace(/\D/g, "").slice(0, 6);
      if (digits !== input.value) input.value = digits;
    });

    // Enter inside the code box should verify, not re-submit the password.
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") { e.preventDefault(); verify.click(); }
    });

    verify.addEventListener("click", async function () {
      clearErrors(form);

      var code = input.value.trim();
      if (!/^\d{6}$/.test(code)) {
        showError("errLoginOtp", "Enter the 6-digit code from your email.");
        return;
      }

      verify.disabled = true;
      var original = verify.textContent;
      verify.textContent = "Verifying…";

      var res = await window.SEStore.verifyOtp(code);

      verify.disabled = false;
      verify.textContent = original;

      if (!res.ok) {
        formAlert(form, "err", res.error);
        input.value = "";
        input.focus();
        return;
      }

      goToDashboard(form);
    });

    if (resend) {
      resend.addEventListener("click", async function (e) {
        e.preventDefault();
        clearErrors(form);
        var res = await window.SEStore.resendOtp();
        formAlert(form, res.ok ? "ok" : "err", res.ok ? res.message : res.error);
        if (res.ok && input) { input.value = ""; input.focus(); }
      });
    }

    if (cancel) {
      cancel.addEventListener("click", function (e) {
        e.preventDefault();
        window.SEStore.cancelOtp();
        clearErrors(form);
        hideOtpStep();
        var pass = document.getElementById("loginPass");
        if (pass) pass.value = "";
      });
    }
  }

  /* ======================================================================
     GO PREMIUM  (plan change only; scope excludes payment gateways)
     ====================================================================== */
  /* The two billing periods buy the same features. Keeping the numbers in
     one place means the price on screen and the price quoted in the saving
     line can never drift apart. */
  var PLANS = {
    monthly: {
      price: "₱149", unit: " / month",
      billing: "Billed monthly, cancel anytime"
    },
    yearly: {
      price: "₱1,199", unit: " / year",
      billing: "Billed yearly, cancel anytime. ₱1,199 instead of ₱1,788 — you save ₱589."
    }
  };

  function initPeriodToggle(onChange) {
    var buttons = document.querySelectorAll("[data-period]");
    if (!buttons.length) return "monthly";

    var priceEl = document.getElementById("sePremiumPrice");
    var billingEl = document.getElementById("sePremiumBilling");
    var chosen = "monthly";

    function paint(period) {
      var plan = PLANS[period] || PLANS.monthly;
      chosen = PLANS[period] ? period : "monthly";

      if (priceEl) {
        priceEl.innerHTML = plan.price +
          '<span style="font-size:1rem;font-weight:500;color:var(--se-muted);">' + plan.unit + "</span>";
      }
      if (billingEl) billingEl.textContent = plan.billing;

      for (var i = 0; i < buttons.length; i++) {
        var isOn = buttons[i].getAttribute("data-period") === chosen;
        buttons[i].classList.toggle("btn-se-primary", isOn);
        buttons[i].classList.toggle("btn-se-outline", !isOn);
        buttons[i].setAttribute("aria-pressed", isOn ? "true" : "false");
      }
      if (onChange) onChange(chosen);
    }

    for (var j = 0; j < buttons.length; j++) {
      buttons[j].addEventListener("click", function () {
        paint(this.getAttribute("data-period"));
      });
    }

    paint("monthly");
    return function () { return chosen; };
  }

  function initUpgrade() {
    var btn = document.getElementById("seUpgradeBtn");
    var status = document.getElementById("seUpgradeStatus");
    if (!btn) return;

    var currentPeriod = initPeriodToggle();
    function period() {
      return typeof currentPeriod === "function" ? currentPeriod() : "monthly";
    }

    function render() {
      var user = window.SEStore.getUser();
      var r = root();

      if (!user) {
        // The plan is picked first and the account made second, so the
        // choice has to survive the trip to the registration page.
        btn.textContent = "Continue";
        btn.disabled = false;
        btn.onclick = function () {
          window.location.href = r + "register.html?plan=" + period();
        };
        status.innerHTML =
          '<span class="d-block" style="font-size:.88rem;color:var(--se-muted);">' +
          'You will create your account in the next step. No payment is taken.</span>' +
          '<span class="d-block mt-2" style="font-size:.88rem;">Already have an account? ' +
          '<a href="' + r + 'login.html">Log in</a></span>';
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
      /* Signed in but not on Premium - someone who abandoned the checkout, or
         reverted to Free. They go through the same checkout as a new signup
         rather than having the plan applied from here. Granting it on this
         button made payment.html skippable: close the checkout, come back to
         this page, press the button, and Premium arrived anyway. */
      btn.innerHTML = '<i class="bi bi-stars" aria-hidden="true"></i> Continue to checkout';
      btn.disabled = false;
      btn.onclick = function () {
        window.location.href = r + "payment.html?plan=" + period();
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

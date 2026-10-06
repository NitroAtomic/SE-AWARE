/* ==========================================================================
   payment.js: the simulated checkout
   --------------------------------------------------------------------------
   No payment is taken. Billing and transaction processing are outside this
   study's scope, so this page exists to show the shape of the flow, not to
   move money.

   Why a real card number is actively rejected
   --------------------------------------------------------------------------
   A banner saying "this is only a demo" is necessary but not sufficient.
   People do not read banners, and someone testing this - in a UAT session,
   or a classmate clicking through - may reach for their wallet out of pure
   habit. So the form accepts the one documented demo number and refuses
   anything else that looks like a real card, saying plainly that it was
   rejected and nothing was sent.

   That matters more here than on an ordinary site. This platform spends six
   modules teaching people to be suspicious of convincing payment screens.
   It would be a poor lesson if its own screen quietly swallowed a real card.
   ========================================================================== */
(function () {
  "use strict";

  // The widely used test number. It satisfies Luhn and belongs to no real
  // account, which is exactly why it is the one number allowed through.
  var DEMO_CARD = "4242424242424242";

  var PLANS = {
    monthly: { price: "₱149", unit: "/ month", billing: "Billed monthly, cancel anytime" },
    yearly: {
      price: "₱1,199", unit: "/ year",
      billing: "Billed yearly, cancel anytime. ₱1,199 instead of ₱1,788 — you save ₱589."
    }
  };

  function el(id) { return document.getElementById(id); }
  function root() { return document.body.getAttribute("data-root") || ""; }

  function planFromUrl() {
    var m = /[?&]plan=([a-z]+)/i.exec(window.location.search);
    if (!m) return null;
    var p = m[1].toLowerCase();
    return (p === "monthly" || p === "yearly") ? p : null;
  }

  function digits(s) { return String(s).replace(/\D/g, ""); }

  /* Luhn checksum. Real card numbers satisfy it; most numbers typed at
     random do not. Used here only to recognise a real card so it can be
     turned away - never to accept one. */
  function passesLuhn(number) {
    var sum = 0;
    var alt = false;
    for (var i = number.length - 1; i >= 0; i--) {
      var d = parseInt(number.charAt(i), 10);
      if (isNaN(d)) return false;
      if (alt) {
        d *= 2;
        if (d > 9) d -= 9;
      }
      sum += d;
      alt = !alt;
    }
    return sum % 10 === 0;
  }

  function showError(id, message) {
    var node = el(id);
    if (node) node.textContent = message || "";
  }

  function clearErrors() {
    ["errPayName", "errPayCard", "errPayExpiry", "errPayCvv"].forEach(function (id) {
      showError(id, "");
    });
    var alertBox = document.querySelector(".se-form-alert");
    if (alertBox) { alertBox.className = "se-form-alert"; alertBox.innerHTML = ""; }
  }

  function formAlert(kind, html) {
    var alertBox = document.querySelector(".se-form-alert");
    if (!alertBox) return;
    alertBox.className = "se-form-alert is-" + kind;
    alertBox.innerHTML = html;
  }

  /* MM/YY, and the month has to be a real month and the date still ahead.
     An expired card is the kind of thing a checkout is expected to notice,
     so the simulation notices it too. */
  function expiryProblem(raw) {
    var d = digits(raw);
    if (d.length !== 4) return "Enter the expiry as MM/YY.";
    var month = parseInt(d.slice(0, 2), 10);
    var year = 2000 + parseInt(d.slice(2), 10);
    if (month < 1 || month > 12) return "That is not a real month.";
    var now = new Date();
    var endOfMonth = new Date(year, month, 1) - 1;
    if (endOfMonth < now.getTime()) return "That date has already passed. Use any future date.";
    return null;
  }

  document.addEventListener("DOMContentLoaded", function () {
    var form = el("sePaymentForm");
    if (!form) return;

    window.SEStore.ready().then(function () {
      var plan = planFromUrl();

      /* The account is made before this page and the plan before that, so
         arriving without either means a step was skipped or a link was
         shared. Send them back rather than taking a payment for nothing. */
      if (!plan) {
        window.location.replace(root() + "go-premium.html");
        return;
      }
      if (!window.SEStore.isSignedIn()) {
        window.location.replace(root() + "register.html?plan=" + plan);
        return;
      }

      var info = PLANS[plan];
      el("sePayPrice").textContent = info.price + " " + info.unit;
      el("sePayBilling").textContent = info.billing;

      // Group the digits as they are typed, so the demo number is readable.
      var cardInput = el("payCard");
      cardInput.addEventListener("input", function () {
        var d = digits(cardInput.value).slice(0, 19);
        cardInput.value = d.replace(/(.{4})/g, "$1 ").trim();
      });

      var expiryInput = el("payExpiry");
      expiryInput.addEventListener("input", function () {
        var d = digits(expiryInput.value).slice(0, 4);
        expiryInput.value = d.length > 2 ? d.slice(0, 2) + "/" + d.slice(2) : d;
      });

      form.addEventListener("submit", async function (e) {
        e.preventDefault();
        clearErrors();

        var name = el("payName").value.trim();
        var card = digits(cardInput.value);
        var cvv = digits(el("payCvv").value);
        var ok = true;

        if (name.length < 2) { showError("errPayName", "Enter the name as it appears on the card."); ok = false; }

        if (card !== DEMO_CARD) {
          if (card.length >= 13 && passesLuhn(card)) {
            // The important branch. Say explicitly that nothing was sent,
            // because the person's first worry will be whether it was.
            showError("errPayCard",
              "That looks like a real card number, so it has been rejected and nothing was sent. " +
              "This is a simulation: please use the demo card 4242 4242 4242 4242.");
          } else {
            showError("errPayCard", "Use the demo card number 4242 4242 4242 4242 for this simulation.");
          }
          ok = false;
        }

        var expiryIssue = expiryProblem(el("payExpiry").value);
        if (expiryIssue) { showError("errPayExpiry", expiryIssue); ok = false; }

        if (cvv.length !== 3) { showError("errPayCvv", "Enter a 3-digit CVV. Any three digits are fine for the demo."); ok = false; }

        if (!ok) return;

        var btn = el("sePayBtn");
        btn.disabled = true;
        btn.textContent = "Recording your plan…";

        var result = await window.SEStore.upgrade(plan);
        if (!result.ok) {
          btn.disabled = false;
          btn.textContent = "Complete the simulated payment";
          formAlert("err", "Your plan could not be set just now. " +
            window.SEUtil.escapeHtml(result.error || "Please try again."));
          return;
        }

        formAlert("ok", "<strong>Premium is active.</strong> Taking you to your dashboard&hellip;");
        setTimeout(function () { window.location.href = root() + "dashboard.html"; }, 800);
      });
    });
  });
})();

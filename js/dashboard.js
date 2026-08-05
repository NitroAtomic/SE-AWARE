/* ==========================================================================
   dashboard.js: personalised learning dashboard
   Web-Based Social Engineering Awareness Platform for Remote Workers
   Group 4 · S3102 · MO-IT200D1 Capstone 1
   --------------------------------------------------------------------------
   Mirrors the View Dashboard use case exactly:
     · Learning Progress, always present   (include)
     · Quiz History, always present   (include)
     · Recommendations, only after the awareness assessment  (extend)

   Test cases: DB-01 progress updates, DB-02 quiz history, RC-01 and AIX-02
   recommendations and weak areas.
   ========================================================================== */

(function () {
  "use strict";

  function root() { return document.body.getAttribute("data-root") || ""; }
  function esc(s) { return window.SEUtil.escapeHtml(s); }

  /* Role-based modules, shown only to premium subscribers. */
  var PREMIUM_TRACKED = [
    { slug: "client-impersonation", title: "Client Impersonation" },
    { slug: "invoice-scams",        title: "Invoice and Payment Scams" },
    { slug: "fake-recruiters",      title: "Fake Job and Recruiter Offers" },
    { slug: "client-data",          title: "Secure Client Data Handling" }
  ];

  /* Modules that count toward the core progress figure. */
  var TRACKED = [
    { slug: "phishing",       title: "Phishing" },
    { slug: "spear-phishing", title: "Spear Phishing" },
    { slug: "smishing",       title: "Smishing" },
    { slug: "vishing",        title: "Vishing" },
    { slug: "pretexting",     title: "Pretexting" },
    { slug: "safe-practices", title: "Safe Practices" }
  ];

  function render() {
    var user = window.SEStore.getUser();
    var progress = window.SEStore.getProgress();
    var history = window.SEStore.getQuizHistory();
    var assessment = window.SEStore.getAssessment();
    var isPremium = window.SEStore.isPremium();

    var done = TRACKED.filter(function (m) { return !!progress[m.slug]; }).length;
    var pct = Math.round((done / TRACKED.length) * 100);

    var avg = history.length
      ? Math.round(history.reduce(function (s, h) { return s + (h.score / h.total) * 100; }, 0) / history.length)
      : null;

    /* ---------------- greeting ---------------- */
    var greet = document.getElementById("seDashGreeting");
    if (greet) {
      greet.innerHTML =
        "Welcome back, " + esc(user.firstName || user.email) + ". " +
        (done === 0
          ? "Nothing completed yet. Open a module and your progress will appear here."
          : done === TRACKED.length
            ? "All six modules complete. Retake a quiz any time; the questions change every attempt."
            : done + " of " + TRACKED.length + " modules complete.");
    }

    /* ---------------- summary tiles ---------------- */
    document.getElementById("seDashStats").innerHTML = [
      tile(done + " / " + TRACKED.length, "Modules completed"),
      tile(history.length, "Quiz attempts"),
      tile(avg === null ? "Not yet" : avg + "%", "Average quiz score"),
      tile(assessment ? assessment.level : "Not taken", "Awareness level")
    ].join("");

    /* ---------------- learning progress ---------------- */
    var rows = TRACKED.map(function (m) {
      var p = progress[m.slug];
      return '<div class="se-progress-row">' +
        '<div class="name">' + esc(m.title) + "</div>" +
        (p ? '<span class="text-body-secondary" style="font-size:.85rem;">' +
              window.SEStore.formatDate(p.completedAt) + "</span>" : "") +
        '<span class="se-status ' + (p ? "done" : "todo") + '">' + (p ? "Completed" : "Not started") + "</span>" +
        '<a class="btn btn-se-outline btn-sm" href="' + root() + "modules/" + m.slug + '.html">Open</a>' +
        "</div>";
    }).join("");

    var premiumDone = PREMIUM_TRACKED.filter(function (m) { return !!progress[m.slug]; }).length;
    var premiumRows = isPremium ? PREMIUM_TRACKED.map(function (m) {
      var p = progress[m.slug];
      return '<div class="se-progress-row">' +
        '<div class="name">' + esc(m.title) + "</div>" +
        (p ? '<span class="text-body-secondary" style="font-size:.85rem;">' +
              window.SEStore.formatDate(p.completedAt) + "</span>" : "") +
        '<span class="se-status ' + (p ? "done" : "todo") + '">' + (p ? "Completed" : "Not started") + "</span>" +
        '<a class="btn btn-se-outline btn-sm" href="' + root() + "modules/" + m.slug + '.html">Open</a>' +
        "</div>";
    }).join("") : "";

    document.getElementById("seDashProgress").innerHTML =
      '<div class="d-flex align-items-center gap-3 mb-3">' +
      '  <div class="se-score-ring" style="--pct:' + pct + '%;width:96px;height:96px;">' +
      '    <div class="se-score-inner"><div class="se-score-num" style="font-size:1.4rem;">' + pct + "%</div></div>" +
      "  </div>" +
      '  <div><strong style="color:var(--se-heading);">' + done + " of " + TRACKED.length + " modules</strong>" +
      '    <div class="text-body-secondary" style="font-size:.9rem;">Completing a module quiz marks it automatically. ' +
      "      You can also mark a module by hand from its page.</div></div>" +
      "</div>" + rows +
      (isPremium
        ? '<h3 class="h6 text-uppercase mt-4 mb-2" style="letter-spacing:.8px;color:var(--se-teal-dark);">' +
          "Role-based modules <span class=\"se-pill\" style=\"margin-left:.4rem;\">" +
          premiumDone + " / " + PREMIUM_TRACKED.length + "</span></h3>" + premiumRows
        : "");

    /* ---------------- quiz history ---------------- */
    var hist = document.getElementById("seDashHistory");
    if (!history.length) {
      hist.innerHTML = empty("bi-clipboard", "No quiz attempts yet",
        "Finish any module quiz and every attempt will be listed here with its score and date.");
    } else {
      hist.innerHTML =
        '<div class="se-table-wrap"><table class="se-table"><thead><tr>' +
        "<th>Module</th><th>Score</th><th>Percentage</th><th>Date</th></tr></thead><tbody>" +
        history.map(function (h) {
          var p = Math.round((h.score / h.total) * 100);
          var band = p >= 80 ? "done" : "todo";
          return "<tr><td>" + esc(h.title) + "</td>" +
            "<td>" + h.score + " / " + h.total + "</td>" +
            '<td><span class="se-status ' + band + '">' + p + "%</span></td>" +
            "<td>" + window.SEStore.formatDate(h.at) + "</td></tr>";
        }).join("") +
        "</tbody></table></div>";
    }

    /* ---------------- recommendations (conditional) ---------------- */
    var rec = document.getElementById("seDashRecommendations");
    if (!assessment) {
      rec.innerHTML = empty("bi-clipboard-check", "Take the awareness assessment",
        "Recommendations appear once you have completed the fifteen-question assessment. It identifies which topics " +
        "you are weakest on and points you at the right modules.",
        { href: root() + "assessment.html", label: "Start the assessment" });
      return;
    }

    var topics = window.ASSESSMENT_DATA ? window.ASSESSMENT_DATA.topics : {};
    var head =
      '<div class="d-flex flex-wrap align-items-center gap-3 mb-3">' +
      '  <span class="se-level ' + assessment.levelKey + '">' +
      '    <i class="bi bi-award-fill" aria-hidden="true"></i> ' + esc(assessment.level) + "</span>" +
      '  <span class="text-body-secondary" style="font-size:.9rem;">Scored ' + assessment.score + " / " +
      assessment.total + " on " + window.SEStore.formatDate(assessment.at) + "</span>" +
      '  <a class="ms-auto" href="' + root() + 'assessment.html">Retake</a>' +
      "</div>";

    if (!assessment.weakAreas.length) {
      rec.innerHTML = head +
        '<div class="se-callout" style="max-width:none;"><strong>No weak areas identified.</strong> You scored at ' +
        "least 60% in every topic. Keep the modules handy for reference and retake the assessment in a few months.</div>";
      return;
    }

    rec.innerHTML = head +
      '<p style="font-size:.94rem;">These topics scored below 60% in your assessment. They are ordered weakest first:</p>' +
      '<div class="row g-3">' +
      assessment.weakAreas.map(function (t) {
        var d = assessment.byTopic[t];
        return '<div class="col-md-6"><a class="se-card d-block text-decoration-none h-100" href="' +
          root() + "modules/" + t + '.html"><div class="card-body">' +
          '<div class="se-card-icon"><i class="bi bi-arrow-right-circle-fill" aria-hidden="true"></i></div>' +
          '<h4 class="h6 mb-1">' + esc(topics[t] || t) + "</h4>" +
          '<p class="text-body-secondary mb-0" style="font-size:.9rem;">Scored ' + d.correct + " of " + d.total +
          ". Open the module.</p></div></a></div>";
      }).join("") +
      "</div>" +
      (isPremium
        ? ""
        : '<div class="se-callout mt-4" style="max-width:none;"><strong>Role-based modules are Premium.</strong> ' +
          'Client impersonation, invoice fraud, fake recruiters, and client data handling. ' +
          '<a href="' + root() + 'go-premium.html">See what Premium includes</a>.</div>');
  }

  function tile(value, label) {
    return '<div class="col-6 col-lg-3"><div class="se-dash-stat">' +
      '<div class="val">' + esc(String(value)) + '</div><div class="lbl">' + esc(label) + "</div></div></div>";
  }

  function empty(icon, title, body, action) {
    return '<div class="se-empty"><i class="bi ' + icon + '" aria-hidden="true"></i>' +
      "<strong>" + title + "</strong>" +
      '<p class="mb-0 mt-2 mx-auto" style="max-width:46ch;font-size:.92rem;">' + body + "</p>" +
      (action ? '<a class="btn btn-se-primary mt-3" href="' + action.href + '">' + action.label + "</a>" : "") +
      "</div>";
  }

  document.addEventListener("se:ready", function (e) {
    if (!e.detail.allowed) return;
    if (!document.getElementById("seDashStats")) return;
    render();
  });
})();

/* ==========================================================================
   assessment.js: cybersecurity awareness assessment
   Web-Based Social Engineering Awareness Platform for Remote Workers
   Group 4 · S3102 · MO-IT200D1 Capstone 1
   --------------------------------------------------------------------------
   Test cases covered:
     AS-01  score calculated accurately from the number of correct responses
     AS-02  an awareness level (Beginner / Intermediate / Advanced) is derived
            consistently from that score
     RC-01  weak topics produce module recommendations
     AIX-02 weak areas are surfaced to the user
   ========================================================================== */

(function () {
  "use strict";

  var state = { index: 0, answers: [], locked: false };

  function root() {
    return document.body.getAttribute("data-root") || "";
  }

  function el(id) { return document.getElementById(id); }

  /* ======================================================================
     INTRO
     ====================================================================== */
  function renderIntro() {
    var prior = window.SEStore.getAssessment();
    var shell = el("seAssessShell");

    shell.innerHTML =
      '<div class="text-center">' +
      '  <div class="se-lock-icon"><i class="bi bi-clipboard-check" aria-hidden="true"></i></div>' +
      '  <h2 class="h4 mt-3">Cybersecurity Awareness Assessment</h2>' +
      '  <p class="mx-auto" style="max-width:52ch;">Fifteen questions across all six topics. It takes about five ' +
      "     minutes and there is no pass mark. The point is to find out which topics to work on first.</p>" +
      '  <div class="row g-3 my-4 text-start" style="max-width:520px;margin-inline:auto;">' +
      '    <div class="col-4"><div class="se-dash-stat text-center"><div class="val">15</div><div class="lbl">Questions</div></div></div>' +
      '    <div class="col-4"><div class="se-dash-stat text-center"><div class="val">6</div><div class="lbl">Topics</div></div></div>' +
      '    <div class="col-4"><div class="se-dash-stat text-center"><div class="val">~5</div><div class="lbl">Minutes</div></div></div>' +
      "  </div>" +
      (prior
        ? '  <p class="mb-3"><span class="se-pill amber"><i class="bi bi-clock-history" aria-hidden="true"></i> ' +
          "Last taken " + window.SEStore.formatDate(prior.at) + ", scored " + prior.score + "/" + prior.total +
          "</span></p>"
        : "") +
      '  <button class="btn btn-se-primary btn-lg" id="seAssessStart" type="button">' +
      (prior ? "Retake the assessment" : "Start the assessment") +
      '    <i class="bi bi-arrow-right" aria-hidden="true"></i></button>' +
      (prior
        ? ' <a class="btn btn-se-outline btn-lg" href="' + root() + 'dashboard.html">See my dashboard</a>'
        : "") +
      "</div>";

    el("seAssessStart").addEventListener("click", function () {
      state = { index: 0, answers: [], locked: false };
      renderQuestion();
    });
  }

  /* ======================================================================
     QUESTIONS
     ====================================================================== */
  function renderQuestion() {
    var data = window.ASSESSMENT_DATA;
    var item = data.questions[state.index];
    var total = data.questions.length;
    var esc = window.SEUtil.escapeHtml;
    var letters = ["A", "B", "C", "D"];
    state.locked = false;

    var pct = Math.round((state.index / total) * 100);
    var html = [];

    html.push('<div class="d-flex justify-content-between align-items-center mb-2">');
    html.push('  <span class="se-quiz-counter">Question ' + (state.index + 1) + " of " + total + "</span>");
    html.push('  <span class="se-pill muted">' + esc(data.topics[item.topic]) + "</span>");
    html.push("</div>");

    html.push('<div class="progress se-quiz-progress mb-4" role="progressbar" aria-label="Assessment progress"');
    html.push('     aria-valuenow="' + pct + '" aria-valuemin="0" aria-valuemax="100">');
    html.push('  <div class="progress-bar" style="width:' + pct + '%"></div>');
    html.push("</div>");

    html.push('<h2 class="h5 mb-1" id="seAssessQ">' + esc(item.q) + "</h2>");
    html.push('<div class="se-options" role="group" aria-labelledby="seAssessQ">');
    item.options.forEach(function (opt, i) {
      html.push(
        '<button type="button" class="se-option" data-choice="' + i + '">' +
        '<span class="se-option-key" aria-hidden="true">' + letters[i] + "</span><span>" + esc(opt) + "</span></button>"
      );
    });
    html.push("</div>");
    html.push('<div id="seAssessFeedback" aria-live="polite"></div>');

    el("seAssessShell").innerHTML = html.join("\n");

    var btns = document.querySelectorAll(".se-option");
    for (var i = 0; i < btns.length; i++) btns[i].addEventListener("click", onChoose);
  }

  function onChoose(e) {
    if (state.locked) return;
    state.locked = true;

    var data = window.ASSESSMENT_DATA;
    var item = data.questions[state.index];
    var chosen = parseInt(e.currentTarget.getAttribute("data-choice"), 10);
    var correct = chosen === item.answer;

    var btns = document.querySelectorAll(".se-option");
    for (var i = 0; i < btns.length; i++) {
      var idx = parseInt(btns[i].getAttribute("data-choice"), 10);
      btns[i].disabled = true;
      if (idx === item.answer) btns[i].classList.add("is-correct");
      if (idx === chosen && !correct) btns[i].classList.add("is-wrong");
    }

    state.answers.push({ topic: item.topic, correct: correct, q: item.q, why: item.why });

    var last = state.index === data.questions.length - 1;
    el("seAssessFeedback").innerHTML =
      '<div class="se-feedback ' + (correct ? "ok" : "no") + '">' +
      '  <h4><i class="bi ' + (correct ? "bi-check-circle-fill" : "bi-x-circle-fill") + '" aria-hidden="true"></i>' +
      (correct ? "Correct" : "Not quite") + "</h4><p>" + item.why + "</p></div>" +
      '<div class="text-end mt-3"><button type="button" class="btn btn-se-primary" id="seAssessNext">' +
      (last ? "See my result" : "Next question") + ' <i class="bi bi-arrow-right" aria-hidden="true"></i></button></div>';

    var next = el("seAssessNext");
    next.addEventListener("click", function () {
      if (state.index < data.questions.length - 1) {
        state.index++;
        renderQuestion();
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        finish();
      }
    });
    next.focus();
  }

  /* ======================================================================
     SCORING  (AS-01, AS-02, RC-01)
     ====================================================================== */
  function finish() {
    var data = window.ASSESSMENT_DATA;
    var total = data.questions.length;
    var score = state.answers.filter(function (a) { return a.correct; }).length;

    // Per-topic breakdown
    var byTopic = {};
    state.answers.forEach(function (a) {
      if (!byTopic[a.topic]) byTopic[a.topic] = { correct: 0, total: 0 };
      byTopic[a.topic].total++;
      if (a.correct) byTopic[a.topic].correct++;
    });

    // A topic counts as weak below 60% correct.
    var weakAreas = Object.keys(byTopic)
      .filter(function (t) { return byTopic[t].correct / byTopic[t].total < 0.6; })
      .sort(function (x, y) {
        return (byTopic[x].correct / byTopic[x].total) - (byTopic[y].correct / byTopic[y].total);
      });

    var level = data.levels.find(function (l) { return score >= l.min; });

    var result = {
      score: score,
      total: total,
      level: level.label,
      levelKey: level.key,
      blurb: level.blurb,
      byTopic: byTopic,
      weakAreas: weakAreas,
      at: new Date().toISOString()
    };

    window.SEStore.setAssessment(result);
    renderResult(result);
  }

  function renderResult(r) {
    var data = window.ASSESSMENT_DATA;
    var esc = window.SEUtil.escapeHtml;
    var pct = Math.round((r.score / r.total) * 100);
    var html = [];

    html.push('<div class="text-center">');
    html.push('  <p class="se-eyebrow mb-3">Your awareness level</p>');
    html.push('  <div class="se-score-ring" style="--pct:' + pct + '%"><div class="se-score-inner">');
    html.push('    <div class="se-score-num">' + r.score + '</div><div class="se-score-den">out of ' + r.total + "</div>");
    html.push("  </div></div>");
    html.push('  <p class="mt-4 mb-3"><span class="se-level ' + r.levelKey + '">' +
      '<i class="bi bi-award-fill" aria-hidden="true"></i> ' + esc(r.level) + "</span></p>");
    html.push('  <p class="mx-auto" style="max-width:54ch;">' + esc(r.blurb) + "</p>");
    html.push("</div>");

    // Topic breakdown
    html.push('<h3 class="h5 mt-5 mb-3">How you did by topic</h3>');
    Object.keys(data.topics).forEach(function (t) {
      var d = r.byTopic[t];
      if (!d) return;
      var p = Math.round((d.correct / d.total) * 100);
      var weak = r.weakAreas.indexOf(t) !== -1;
      html.push('<div class="se-topic">');
      html.push('  <div class="se-topic-head"><span class="t">' + esc(data.topics[t]) +
        (weak ? ' <span class="se-pill amber" style="margin-left:.4rem;">Needs work</span>' : "") +
        '</span><span>' + d.correct + "/" + d.total + "</span></div>");
      html.push('  <div class="se-topic-bar"><span class="' + (weak ? "weak" : "") + '" style="width:' + p + '%"></span></div>');
      html.push("</div>");
    });

    // Recommendations
    html.push('<h3 class="h5 mt-5 mb-3">Recommended next</h3>');
    if (!r.weakAreas.length) {
      html.push('<div class="se-callout" style="max-width:none;"><strong>No weak areas found.</strong> You answered ' +
        "at least 60% correctly in every topic. Revisit any module you want to keep sharp, and retake this " +
        "assessment in a few months. Tactics move.</div>");
    } else {
      html.push('<p>Based on where you lost marks, work through these in order:</p><div class="row g-3">');
      r.weakAreas.forEach(function (t) {
        html.push('<div class="col-md-6"><a class="se-card d-block text-decoration-none h-100" href="' +
          root() + "modules/" + t + '.html"><div class="card-body">' +
          '<div class="se-card-icon"><i class="bi bi-arrow-right-circle-fill" aria-hidden="true"></i></div>' +
          '<h4 class="h6 mb-1">' + esc(data.topics[t]) + "</h4>" +
          '<p class="text-body-secondary mb-0" style="font-size:.9rem;">Scored ' +
          r.byTopic[t].correct + " of " + r.byTopic[t].total + " here. Open the module.</p>" +
          "</div></a></div>");
      });
      html.push("</div>");
    }

    html.push('<div class="d-flex flex-wrap gap-2 justify-content-center mt-5">');
    html.push('  <a class="btn btn-se-primary" href="' + root() + 'dashboard.html">' +
      '<i class="bi bi-speedometer2" aria-hidden="true"></i> Go to my dashboard</a>');
    html.push('  <button type="button" class="btn btn-se-outline" id="seAssessAgain">' +
      '<i class="bi bi-arrow-clockwise" aria-hidden="true"></i> Retake</button>');
    html.push("</div>");

    el("seAssessShell").innerHTML = html.join("\n");
    el("seAssessAgain").addEventListener("click", function () {
      state = { index: 0, answers: [], locked: false };
      renderQuestion();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  /* ======================================================================
     INIT: only after account.js has confirmed the gate is open
     ====================================================================== */
  document.addEventListener("se:ready", function (e) {
    if (!e.detail.allowed) return;
    if (!el("seAssessShell")) return;
    renderIntro();
  });
})();

/* ==========================================================================
   quiz.js: quiz engine and results renderer
   Web-Based Social Engineering Awareness Platform for Remote Workers
   Group 4 · S3102 · MO-IT200D1 Capstone 1
   --------------------------------------------------------------------------
   One engine serves all five module quizzes, selected by the ?module=
   query parameter (FR-04).

   Randomisation (FT-05): 10 questions are drawn at random from a bank of 15,
   and the four answer options are shuffled independently for each question.
   Taking the same quiz twice therefore produces a different paper.

   Storage: the finished attempt is handed to results.html through
   sessionStorage, which belongs to this browser tab only and is discarded
   when the tab closes. Nothing is transmitted anywhere.
   ========================================================================== */

(function () {
  "use strict";

  var QUESTIONS_PER_QUIZ = 10;
  var STORAGE_KEY = "se-quiz-result";

  var state = {
    slug: null,
    title: "",
    items: [],      // the 10 drawn questions, options already shuffled
    index: 0,
    answers: [],    // { chosen, correct, question, options, correctIndex, why }
    locked: false
  };

  /* ======================================================================
     QUIZ PAGE
     ====================================================================== */
  async function initQuiz() {
    var shell = document.getElementById("seQuizShell");
    if (!shell) return;

    var slug = window.SEUtil.getParam("module");
    var localBank = window.QUIZ_DATA ? window.QUIZ_DATA[slug] : null;
    var bank = localBank;

    // Prefer the database bank when a backend is connected, so questions
    // edited in the admin panel actually reach learners. The bundled
    // quiz-data.js banks stay as the offline fallback, which is what keeps
    // the free tier working as a plain static site.
    //
    // Note on the answer key: the API withholds correct_option_index while
    // the quiz is in progress, so a database-backed attempt is scored on the
    // server at submission. The bundled banks carry their answers locally and
    // are still scored in the browser.
    if (window.SEStore && window.SEStore.fetchQuizBank) {
      var remote = await window.SEStore.fetchQuizBank(slug);
      if (remote && remote.questions.length) {
        bank = {
          title: remote.title || (localBank && localBank.title) || slug,
          premium: localBank ? localBank.premium : false,
          questions: remote.questions,
          quizId: remote.quizId,
          serverScored: true
        };
      }
    }

    if (!bank) {
      shell.innerHTML =
        '<div class="text-center py-4">' +
        '  <i class="bi bi-exclamation-triangle" style="font-size:2.5rem;color:var(--se-amber);" aria-hidden="true"></i>' +
        '  <h2 class="h4 mt-3">Quiz not found</h2>' +
        '  <p>We could not find a quiz for that module. Pick a module and try again.</p>' +
        '  <a class="btn btn-se-primary mt-2" href="modules.html">Browse modules</a>' +
        "</div>";
      return;
    }

    // A premium bank needs a premium plan, the same gate the module page uses.
    if (bank.premium && !(window.SEStore && window.SEStore.isPremium())) {
      var signedIn = window.SEStore && window.SEStore.isSignedIn();
      shell.innerHTML =
        '<div class="text-center py-4">' +
        '  <div class="se-lock-icon"><i class="bi bi-stars" aria-hidden="true"></i></div>' +
        '  <h2 class="h4 mt-3">This quiz is part of Premium</h2>' +
        '  <p class="mx-auto" style="max-width:46ch;">' +
        (signedIn
          ? "Role-based quizzes come with the role-based modules. Upgrade to unlock them."
          : "Sign in and upgrade to reach the role-based modules and their quizzes.") +
        "</p>" +
        '  <div class="d-flex flex-wrap gap-2 justify-content-center mt-3">' +
        '    <a class="btn btn-se-primary" href="go-premium.html">See what Premium includes</a>' +
        '    <a class="btn btn-se-outline" href="modules.html">Free modules</a>' +
        "  </div></div>";
      return;
    }

    state.slug = slug;
    state.title = bank.title;
    state.quizId = bank.quizId || null;
    state.serverScored = !!bank.serverScored;
    state.items = drawQuestions(bank.questions);
    state.index = 0;
    state.answers = [];

    var heading = document.getElementById("seQuizTitle");
    if (heading) heading.textContent = bank.title + " Quiz";

    var sub = document.getElementById("seQuizSubtitle");
    if (sub) {
      sub.textContent =
        QUESTIONS_PER_QUIZ + " questions drawn at random from a larger bank. " +
        "Answer options are shuffled, so every attempt is different.";
    }

    renderQuestion();
  }

  /**
   * Draw QUESTIONS_PER_QUIZ questions at random from the bank and shuffle
   * each question's answer options, remapping the correct-answer index.
   */
  function drawQuestions(bank) {
    var picked = window.SEUtil.shuffle(bank).slice(0, QUESTIONS_PER_QUIZ);

    return picked.map(function (q) {
      // Pair each option with its original index so the answer survives shuffling.
      var paired = q.options.map(function (text, i) {
        return { text: text, original: i };
      });
      var shuffled = window.SEUtil.shuffle(paired);

      // Database-backed questions arrive without an answer, so there is
      // nothing to remap; the server scores them against the original
      // indices, which is why `originalOrder` is carried through.
      var hasLocalAnswer = typeof q.answer === "number";
      var newCorrect = null;
      if (hasLocalAnswer) {
        newCorrect = 0;
        for (var i = 0; i < shuffled.length; i++) {
          if (shuffled[i].original === q.answer) newCorrect = i;
        }
      }

      return {
        id: q.id || null,
        type: q.type,
        scenario: q.scenario || null,
        q: q.q,
        options: shuffled.map(function (o) { return o.text; }),
        originalOrder: shuffled.map(function (o) { return o.original; }),
        answer: newCorrect,
        why: q.why
      };
    });
  }

  function renderQuestion() {
    var item = state.items[state.index];
    var esc = window.SEUtil.escapeHtml;
    state.locked = false;

    var pct = Math.round((state.index / QUESTIONS_PER_QUIZ) * 100);
    var letters = ["A", "B", "C", "D"];

    var html = [];

    html.push('<div class="d-flex justify-content-between align-items-center mb-2">');
    html.push('  <span class="se-quiz-counter">Question ' + (state.index + 1) + " of " + QUESTIONS_PER_QUIZ + "</span>");
    html.push('  <span class="se-quiz-counter">' + esc(state.title) + "</span>");
    html.push("</div>");

    html.push('<div class="progress se-quiz-progress mb-4" role="progressbar" aria-label="Quiz progress"');
    html.push('     aria-valuenow="' + pct + '" aria-valuemin="0" aria-valuemax="100">');
    html.push('  <div class="progress-bar" style="width:' + pct + '%"></div>');
    html.push("</div>");

    if (item.scenario) {
      html.push('<div class="se-scenario">');
      html.push('  <div class="se-scenario-tag">Scenario</div>');
      html.push("  " + item.scenario);
      html.push("</div>");
    }

    html.push('<h2 class="h5 mb-1" id="seQuestionText">' + esc(item.q) + "</h2>");

    html.push('<div class="se-options" role="group" aria-labelledby="seQuestionText">');
    item.options.forEach(function (opt, i) {
      html.push(
        '<button type="button" class="se-option" data-choice="' + i + '">' +
        '<span class="se-option-key" aria-hidden="true">' + letters[i] + "</span>" +
        "<span>" + esc(opt) + "</span>" +
        "</button>"
      );
    });
    html.push("</div>");

    html.push('<div id="seFeedback" aria-live="polite"></div>');

    document.getElementById("seQuizShell").innerHTML = html.join("\n");

    var buttons = document.querySelectorAll(".se-option");
    for (var b = 0; b < buttons.length; b++) {
      buttons[b].addEventListener("click", onChoose);
    }
  }

  function onChoose(e) {
    if (state.locked) return;
    state.locked = true;

    var chosen = parseInt(e.currentTarget.getAttribute("data-choice"), 10);
    var item = state.items[state.index];

    // With a database-backed bank the answer key stays on the server until
    // the attempt is submitted, so correctness is unknown at this point.
    var knowsAnswer = typeof item.answer === "number";
    var isCorrect = knowsAnswer ? chosen === item.answer : null;

    // Lock every option, and colour the outcome only when we can.
    var buttons = document.querySelectorAll(".se-option");
    for (var i = 0; i < buttons.length; i++) {
      var idx = parseInt(buttons[i].getAttribute("data-choice"), 10);
      buttons[i].disabled = true;
      if (knowsAnswer && idx === item.answer) buttons[i].classList.add("is-correct");
      if (knowsAnswer && idx === chosen && !isCorrect) buttons[i].classList.add("is-wrong");
      if (!knowsAnswer && idx === chosen) buttons[i].classList.add("is-chosen");
    }

    state.answers.push({
      questionId: item.id || null,
      question: item.q,
      scenario: item.scenario,
      options: item.options,
      chosen: chosen,
      // The index the server knows this option by, before shuffling.
      chosenOriginal: item.originalOrder ? item.originalOrder[chosen] : chosen,
      correctIndex: knowsAnswer ? item.answer : null,
      correct: isCorrect,
      why: item.why
    });

    var last = state.index === QUESTIONS_PER_QUIZ - 1;
    var fb = document.getElementById("seFeedback");
    fb.innerHTML =
      (knowsAnswer
        ? '<div class="se-feedback ' + (isCorrect ? "ok" : "no") + '">' +
          "  <h4>" +
          '    <i class="bi ' + (isCorrect ? "bi-check-circle-fill" : "bi-x-circle-fill") + '" aria-hidden="true"></i>' +
          (isCorrect ? "Correct" : "Not quite") +
          "  </h4>" +
          "  <p>" + (item.why || "") + "</p>" +
          "</div>"
        : '<div class="se-feedback">' +
          '  <h4><i class="bi bi-check2" aria-hidden="true"></i>Answer recorded</h4>' +
          "  <p>Your answers are marked when you finish, so the correct ones stay on the server until then.</p>" +
          "</div>") +
      '<div class="text-end mt-3">' +
      '  <button type="button" class="btn btn-se-primary" id="seNext">' +
      (last ? "See my results" : "Next question") +
      '    <i class="bi bi-arrow-right" aria-hidden="true"></i>' +
      "  </button>" +
      "</div>";

    var next = document.getElementById("seNext");
    next.addEventListener("click", onNext);
    next.focus();
  }

  function onNext() {
    if (state.index < QUESTIONS_PER_QUIZ - 1) {
      state.index++;
      renderQuestion();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      finish();
    }
  }

  async function finish() {
    var score = state.answers.filter(function (a) { return a.correct; }).length;
    var scoredOnServer = false;

    // Database-backed attempts are scored server-side, because the answer key
    // was never sent to the browser. The response carries the key back, which
    // is what lets results.html still show a per-question review.
    if (state.serverScored && state.quizId && window.SEStore && window.SEStore.submitQuizAttempt) {
      var questionIds = state.answers.map(function (a) { return a.questionId; });
      var chosenOriginals = state.answers.map(function (a) { return a.chosenOriginal; });
      var result = await window.SEStore.submitQuizAttempt(state.quizId, questionIds, chosenOriginals);

      if (result && typeof result.score === "number") {
        score = result.score;
        scoredOnServer = true;

        var keyById = {};
        (result.answerKey || []).forEach(function (k) {
          keyById[k.question_id] = k.correct_option_index;
        });

        // Translate the server's original-index answer back into the shuffled
        // position this attempt displayed, so the review highlights the right
        // option rather than whichever one happens to sit at that index.
        state.answers.forEach(function (a, i) {
          var original = keyById[a.questionId];
          if (typeof original !== "number") return;
          var item = state.items[i];
          var shownIndex = item && item.originalOrder ? item.originalOrder.indexOf(original) : original;
          a.correctIndex = shownIndex;
          a.correct = a.chosen === shownIndex;
        });
      }
    }

    var payload = {
      slug: state.slug,
      title: state.title,
      score: score,
      total: QUESTIONS_PER_QUIZ,
      answers: state.answers,
      at: new Date().toISOString()
    };

    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (err) {
      if (window.console && console.warn) console.warn("[quiz] could not hand off results: " + err.message);
    }

    // If someone is signed in, record the attempt so it appears in their
    // quiz history and marks the module complete on the dashboard (DB-01,
    // DB-02). Guests are unaffected, and nothing is recorded for them.
    // `submitQuizAttempt` already wrote the result and progress row, so only
    // record separately when scoring happened in the browser.
    if (!scoredOnServer && window.SEStore && window.SEStore.isSignedIn()) {
      await window.SEStore.addQuizAttempt({
        slug: payload.slug,
        title: payload.title,
        score: payload.score,
        total: payload.total,
        at: payload.at
      });
    }

    window.location.href = "results.html";
  }

  /* ======================================================================
     RESULTS PAGE
     ====================================================================== */
  function initResults() {
    var host = document.getElementById("seResults");
    if (!host) return;

    var raw = null;
    try {
      raw = sessionStorage.getItem(STORAGE_KEY);
    } catch (err) {
      raw = null;
    }

    if (!raw) {
      host.innerHTML =
        '<div class="se-quiz-shell text-center">' +
        '  <i class="bi bi-clipboard-x" style="font-size:2.5rem;color:var(--se-amber);" aria-hidden="true"></i>' +
        '  <h2 class="h4 mt-3">No results to show</h2>' +
        "  <p>Take a module quiz first and your score will appear here.</p>" +
        '  <a class="btn btn-se-primary mt-2" href="modules.html">Browse modules</a>' +
        "</div>";
      return;
    }

    var data = JSON.parse(raw);
    var esc = window.SEUtil.escapeHtml;
    var pct = Math.round((data.score / data.total) * 100);
    var letters = ["A", "B", "C", "D"];

    var band, bandClass, verdict;
    if (data.score >= 8) {
      band = "Strong"; bandClass = "strong";
      verdict = "You recognised the patterns reliably. Move on to another module to widen your coverage.";
    } else if (data.score >= 5) {
      band = "Review recommended"; bandClass = "review";
      verdict = "A solid start, but some patterns slipped past. Re-read the red flags section, then take the quiz again.";
    } else {
      band = "Retake recommended"; bandClass = "retake";
      verdict = "Worth another pass through the module. This material takes a second reading for most people, and the quiz changes every attempt.";
    }

    var html = [];

    html.push('<div class="se-quiz-shell text-center">');
    html.push('  <p class="se-eyebrow mb-3">' + esc(data.title) + " Quiz results</p>");
    html.push('  <div class="se-score-ring" style="--pct:' + pct + '%">');
    html.push('    <div class="se-score-inner">');
    html.push('      <div class="se-score-num">' + data.score + "</div>");
    html.push('      <div class="se-score-den">out of ' + data.total + "</div>");
    html.push("    </div>");
    html.push("  </div>");
    html.push('  <p class="mt-4 mb-2"><span class="se-band ' + bandClass + '">' + band + " &middot; " + pct + "%</span></p>");
    html.push('  <p class="mx-auto" style="max-width:52ch;">' + verdict + "</p>");
    html.push('  <div class="d-flex flex-wrap gap-2 justify-content-center mt-4">');
    html.push('    <a class="btn btn-se-primary" href="quiz.html?module=' + esc(data.slug) + '"><i class="bi bi-arrow-clockwise" aria-hidden="true"></i> Retake quiz</a>');
    html.push('    <a class="btn btn-se-outline" href="modules/' + esc(data.slug) + '.html"><i class="bi bi-journal-text" aria-hidden="true"></i> Back to module</a>');
    html.push('    <a class="btn btn-se-outline" href="modules.html"><i class="bi bi-grid" aria-hidden="true"></i> Browse other modules</a>');
    html.push("  </div>");
    html.push('  <p class="mt-4 mb-0" style="font-size:.83rem;color:var(--se-muted);">This score is held in your browser tab only. It is never sent anywhere, and closing the tab discards it.</p>');
    html.push("</div>");

    html.push('<div class="mt-5" style="max-width:780px;margin-inline:auto;">');
    html.push('  <h2 class="h4 mb-3">Review your answers</h2>');

    data.answers.forEach(function (a, i) {
      html.push('  <div class="se-review-item ' + (a.correct ? "ok" : "no") + '">');
      html.push('    <div class="d-flex justify-content-between align-items-start gap-3 mb-2">');
      html.push('      <div class="se-review-q">' + (i + 1) + ". " + esc(a.question) + "</div>");
      html.push('      <span class="se-pill ' + (a.correct ? "" : "amber") + '" style="flex-shrink:0;">' +
        '<i class="bi ' + (a.correct ? "bi-check-lg" : "bi-x-lg") + '" aria-hidden="true"></i> ' +
        (a.correct ? "Correct" : "Missed") + "</span>");
      html.push("    </div>");

      if (!a.correct) {
        html.push('    <p class="se-review-line"><span class="lbl">You chose:</span> ' +
          letters[a.chosen] + ". " + esc(a.options[a.chosen]) + "</p>");
      }
      html.push('    <p class="se-review-line"><span class="lbl">Correct answer:</span> ' +
        letters[a.correctIndex] + ". " + esc(a.options[a.correctIndex]) + "</p>");
      html.push('    <div class="se-feedback ' + (a.correct ? "ok" : "no") + '" style="margin-top:.8rem;"><p>' + a.why + "</p></div>");
      html.push("  </div>");
    });

    html.push("</div>");

    host.innerHTML = html.join("\n");
  }

  /* ======================================================================
     INIT
     ====================================================================== */
  document.addEventListener("DOMContentLoaded", function () {
    window.SEStore.ready().then(function () {
      initQuiz();
      initResults();
    });
  });
})();

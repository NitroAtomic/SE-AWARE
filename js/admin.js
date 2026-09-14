/* ==========================================================================
   admin.js: administrator panel
   Web-Based Social Engineering Awareness Platform for Remote Workers
   Group 4 · S3102 · MO-IT200D1 Capstone 1
   --------------------------------------------------------------------------
   Implements the Administrator actor's two use cases:
     · Manage Learning Content   (modules, quiz questions)
     · Manage Users & Subscriptions

   Test cases: AD-01 admin login, AD-02 content CRUD, AD-03 quiz CRUD,
               AD-04 module CRUD.

   With the backend running, authentication and all management writes are
   enforced by admin-only API routes. File-based offline mode retains sample
   data for demonstrations.
   ========================================================================== */

(function () {
  "use strict";

  function esc(s) { return window.SEUtil.escapeHtml(String(s)); }
  function el(id) { return document.getElementById(id); }

  var tab = "modules";
  var questions = null;   // working copy of the quiz banks
  var users = null;       // seeded demo accounts + the live session account
  var quizzes = [];

  function jsonValue(value, fallback) {
    if (typeof value !== "string") return value || fallback;
    try { return JSON.parse(value); } catch (err) { return fallback; }
  }

  async function loadAdminData() {
    if (!window.SEStore.isUsingBackend()) {
      questions = seedQuestions();
      users = seedUsers();
      return;
    }
    var result = await Promise.all([
      window.SEStore.adminGetQuestions(),
      window.SEStore.adminGetUsers(),
      window.SEStore.adminGetQuizzes()
    ]);
    quizzes = result[2];
    questions = result[0].map(function (q) {
      var options = jsonValue(q.options, []);
      return {
        id: String(q.question_id), question_id: q.question_id, quiz_id: q.quiz_id,
        module: q.module_title, slug: q.slug, type: "knowledge", text: q.question_text,
        options: options, correct_option_index: q.correct_option_index,
        order_index: q.order_index, answer: options[q.correct_option_index] || "Not set"
      };
    });
    users = result[1].map(function (u) {
      return {
        id: u.user_id,
        name: ((u.first_name || "") + " " + (u.last_name || "")).trim() || u.email,
        email: u.email, plan: u.subscription_type,
        status: u.subscription_status.charAt(0).toUpperCase() + u.subscription_status.slice(1),
        joined: String(u.created_at).slice(0, 10), role: u.role,
        isLive: u.email === (window.SEStore.getAdmin() || {}).username
      };
    });
  }

  /* ======================================================================
     Seed data
     ====================================================================== */
  function seedQuestions() {
    var out = [];
    var banks = window.QUIZ_DATA || {};
    Object.keys(banks).forEach(function (slug) {
      banks[slug].questions.forEach(function (q, i) {
        out.push({
          id: slug + "-" + (i + 1),
          module: banks[slug].title,
          slug: slug,
          type: q.type,
          text: q.q,
          answer: q.options[q.answer]
        });
      });
    });
    return out;
  }

  function seedUsers() {
    var list = [
      { id: 1, name: "Maria Santos",  email: "m.santos@example.com",   plan: "Premium", status: "Active",   joined: "2026-05-12" },
      { id: 2, name: "Dennis Cruz",   email: "d.cruz@example.com",     plan: "Free",    status: "Active",   joined: "2026-06-03" },
      { id: 3, name: "Aileen Reyes",  email: "a.reyes@example.com",    plan: "Premium", status: "Active",   joined: "2026-06-21" },
      { id: 4, name: "Rob Villanueva", email: "r.villanueva@example.com", plan: "Free", status: "Inactive", joined: "2026-07-02" }
    ];
    var live = window.SEStore.getUser();
    if (live) {
      list.unshift({
        id: 0,
        name: ((live.firstName || "") + " " + (live.lastName || "")).trim() || live.email,
        email: live.email,
        plan: live.subscription,
        status: "Active",
        joined: live.createdAt.slice(0, 10),
        isLive: true
      });
    }
    return list;
  }

  /* ======================================================================
     Login  (AD-01)
     ====================================================================== */
  function renderLogin() {
    el("seAdminShell").innerHTML =
      '<form class="se-auth-card" id="seAdminForm" novalidate>' +
      '  <div class="text-center mb-4">' +
      '    <div class="se-lock-icon"><i class="bi bi-shield-lock-fill" aria-hidden="true"></i></div>' +
      '    <h2 class="h5 mt-3 mb-1">Administrator sign-in</h2>' +
      '    <p class="text-body-secondary mb-0" style="font-size:.9rem;">Restricted portal for content and ' +
      "      subscription management.</p>" +
      "  </div>" +
      '  <div class="se-form-alert"></div>' +
      '  <div><label class="form-label" for="admUser">' + (window.SE_API_BASE ? "Admin email" : "Username") + '</label>' +
      '    <input class="form-control" type="text" id="admUser" autocomplete="username">' +
      '    <div class="se-field-error" id="errAdmUser"></div></div>' +
      '  <div class="mt-3"><label class="form-label" for="admPass">Password</label>' +
      '    <input class="form-control" type="password" id="admPass" autocomplete="current-password">' +
      '    <div class="se-field-error" id="errAdmPass"></div></div>' +
      '  <button class="btn btn-se-primary w-100 mt-4" type="submit">Sign in to admin panel</button>' +
      (window.SE_API_BASE
        ? '  <div class="se-callout mt-3 mb-0" style="max-width:none;">' +
          '    <span style="font-size:.86rem;color:var(--se-muted);">Connected to the live backend. Sign in with a real account whose role is set to admin in the database.</span></div>'
        : '  <div class="se-callout mt-3 mb-0" style="max-width:none;">' +
          '    <strong>Demo credentials:</strong> username <code>admin</code>, password <code>seaware2026</code>.<br>' +
          '    <span style="font-size:.86rem;color:var(--se-muted);">This is a mock sign-in and accepts any username of 3 or more ' +
          "    characters with any password of 8 or more. There is no server to authenticate against, which is why the " +
          "    credentials can be printed here.</span></div>") +
      "</form>";

    el("seAdminForm").addEventListener("submit", async function (e) {
      e.preventDefault();
      var u = el("admUser").value.trim();
      var p = el("admPass").value;
      var ok = true;

      el("errAdmUser").classList.remove("show");
      el("errAdmPass").classList.remove("show");

      if (u.length < 3) { el("errAdmUser").textContent = "Enter a username."; el("errAdmUser").classList.add("show"); ok = false; }
      if (p.length < 8) { el("errAdmPass").textContent = "Use at least 8 characters."; el("errAdmPass").classList.add("show"); ok = false; }
      if (!ok) return;

      var result = await window.SEStore.adminLogin(u, p);
      if (!result.ok) {
        el("errAdmPass").textContent = result.error || "Sign-in failed.";
        el("errAdmPass").classList.add("show");
        return;
      }
      await renderPanel();
    });
  }

  /* ======================================================================
     Panel
     ====================================================================== */
  async function renderPanel() {
    if (!questions || !users) await loadAdminData();

    var admin = window.SEStore.getAdmin();

    el("seAdminShell").innerHTML =
      '<div class="d-flex flex-wrap align-items-center gap-2 mb-3">' +
      '  <span class="se-pill"><i class="bi bi-shield-lock-fill" aria-hidden="true"></i> Signed in as ' +
      esc(admin.username) + "</span>" +
      '  <button type="button" class="btn btn-se-outline btn-sm ms-auto" id="seAdminOut">Sign out of admin</button>' +
      "</div>" +
      '<div class="se-admin-shell">' +
      '  <div class="se-admin-tabs" role="tablist">' +
      '    <button type="button" class="se-admin-tab" data-tab="modules" role="tab">' +
      '      <i class="bi bi-collection" aria-hidden="true"></i> Modules</button>' +
      '    <button type="button" class="se-admin-tab" data-tab="questions" role="tab">' +
      '      <i class="bi bi-patch-question" aria-hidden="true"></i> Quiz questions</button>' +
      '    <button type="button" class="se-admin-tab" data-tab="users" role="tab">' +
      '      <i class="bi bi-people" aria-hidden="true"></i> Users &amp; subscriptions</button>' +
      "  </div>" +
      '  <div class="se-admin-body" id="seAdminBody"></div>' +
      "</div>";

    el("seAdminOut").addEventListener("click", async function () {
      await window.SEStore.adminLogout();
      renderLogin();
    });

    var tabs = document.querySelectorAll(".se-admin-tab");
    for (var i = 0; i < tabs.length; i++) {
      tabs[i].addEventListener("click", async function () {
        tab = this.getAttribute("data-tab");
        await renderTabs();
      });
    }
    await renderTabs();
  }

  async function renderTabs() {
    var tabs = document.querySelectorAll(".se-admin-tab");
    for (var i = 0; i < tabs.length; i++) {
      tabs[i].classList.toggle("active", tabs[i].getAttribute("data-tab") === tab);
    }
    if (tab === "modules") await renderModules();
    else if (tab === "questions") await renderQuestions();
    else await renderUsers();
  }

  /* ---------------------- Modules CRUD (AD-02, AD-04) ---------------------- */
  async function renderModules() {
    var list = await window.SEStore.getCatalogue();

    el("seAdminBody").innerHTML =
      '<div class="d-flex flex-wrap align-items-center gap-2 mb-3">' +
      '  <div><h3 class="h6 mb-1">Learning modules</h3>' +
      '    <p class="text-body-secondary mb-0" style="font-size:.88rem;">' + list.length +
      " modules. Changes are saved immediately.</p></div>" +
      '  <button type="button" class="btn btn-se-primary btn-sm ms-auto" id="admAddModule">' +
      '    <i class="bi bi-plus-lg" aria-hidden="true"></i> Add module</button>' +
      (window.SEStore.isUsingBackend() ? "" : '  <button type="button" class="btn btn-se-outline btn-sm" id="admResetModules">Reset</button>') +
      "</div>" +
      '<div class="se-table-wrap"><table class="se-table"><thead><tr>' +
      "<th>Title</th><th>Category</th><th>Type</th><th>Quiz</th><th style=\"width:96px;\">Actions</th>" +
      "</tr></thead><tbody>" +
      list.map(function (m, i) {
        return "<tr>" +
          '<td><input class="form-control form-control-sm" data-edit="title" data-i="' + i + '" value="' + esc(m.title) + '"></td>' +
          "<td>" + esc(m.category) + "</td>" +
          '<td><select class="form-select form-select-sm" data-edit="type" data-i="' + i + '">' +
          '<option' + (m.type === "Free" ? " selected" : "") + ">Free</option>" +
          '<option' + (m.type === "Premium" ? " selected" : "") + ">Premium</option>" +
          "</select></td>" +
          '<td><span class="se-status ' + (m.quiz ? "done" : "todo") + '">' + (m.quiz ? "Yes" : "No") + "</span></td>" +
          '<td><button type="button" class="se-icon-btn danger" data-del="' + i + '" ' +
          'aria-label="Delete module"><i class="bi bi-trash" aria-hidden="true"></i></button></td>' +
          "</tr>";
      }).join("") +
      "</tbody></table></div>" +
      '<p class="mt-3 mb-0" style="font-size:.86rem;color:var(--se-muted);">Editing a title or plan updates the catalogue immediately.</p>';

    // Inline edits
    var inputs = el("seAdminBody").querySelectorAll("[data-edit]");
    for (var i = 0; i < inputs.length; i++) {
      inputs[i].addEventListener("change", async function () {
        var list2 = await window.SEStore.getCatalogue();
        list2[parseInt(this.getAttribute("data-i"), 10)][this.getAttribute("data-edit")] = this.value;
        await window.SEStore.saveCatalogue(list2);
        await renderModules();
      });
    }

    var dels = el("seAdminBody").querySelectorAll("[data-del]");
    for (var d = 0; d < dels.length; d++) {
      dels[d].addEventListener("click", async function () {
        var list2 = await window.SEStore.getCatalogue();
        var removed = list2[parseInt(this.getAttribute("data-del"), 10)];
        if (window.SEStore.isUsingBackend()) await window.SEStore.deleteModule(removed);
        else { list2.splice(parseInt(this.getAttribute("data-del"), 10), 1); await window.SEStore.saveCatalogue(list2); }
        await renderModules();
      });
    }

    el("admAddModule").addEventListener("click", async function () {
      var list2 = await window.SEStore.getCatalogue();
      var n = list2.length + 1;
      list2.push({
        slug: "new-module-" + n,
        title: "New module " + n,
        type: "Free",
        category: "Attack type",
        quiz: false
      });
      await window.SEStore.saveCatalogue(list2);
      await renderModules();
    });

    if (el("admResetModules")) el("admResetModules").addEventListener("click", async function () {
      await window.SEStore.resetCatalogue();
      await renderModules();
    });
  }

  /* ---------------------- Quiz question CRUD (AD-03) ---------------------- */
  async function renderQuestions() {
    var filter = (el("admQFilter") && el("admQFilter").value) || "all";
    var visible = questions.filter(function (q) { return filter === "all" || q.slug === filter; });
    var slugs = [];
    questions.forEach(function (q) { if (slugs.indexOf(q.slug) === -1) slugs.push(q.slug); });

    el("seAdminBody").innerHTML =
      '<div class="d-flex flex-wrap align-items-center gap-2 mb-3">' +
      '  <div><h3 class="h6 mb-1">Quiz questions</h3>' +
      '    <p class="text-body-secondary mb-0" style="font-size:.88rem;">' + questions.length +
      " questions across " + slugs.length + " banks.</p></div>" +
      '  <select class="form-select form-select-sm ms-auto" id="admQFilter" style="width:auto;">' +
      '    <option value="all">All modules</option>' +
      slugs.map(function (s) {
        return '<option value="' + s + '"' + (filter === s ? " selected" : "") + ">" +
          esc(window.QUIZ_DATA[s].title) + "</option>";
      }).join("") +
      "  </select>" +
      '  <button type="button" class="btn btn-se-primary btn-sm" id="admAddQ">' +
      '    <i class="bi bi-plus-lg" aria-hidden="true"></i> Add question</button>' +
      "</div>" +
      '<div class="se-table-wrap"><table class="se-table"><thead><tr>' +
      "<th style=\"width:110px;\">ID</th><th>Question</th><th style=\"width:110px;\">Type</th>" +
      "<th style=\"width:96px;\">Actions</th></tr></thead><tbody>" +
      (visible.length
        ? visible.map(function (q) {
            return "<tr>" +
              "<td><code>" + esc(q.id) + "</code></td>" +
              '<td><input class="form-control form-control-sm" data-qedit="' + esc(q.id) + '" value="' + esc(q.text) + '"></td>' +
              '<td><span class="se-pill ' + (q.type === "scenario" ? "" : "muted") + '">' + esc(q.type) + "</span></td>" +
              '<td><button type="button" class="se-icon-btn danger" data-qdel="' + esc(q.id) + '" ' +
              'aria-label="Delete question"><i class="bi bi-trash" aria-hidden="true"></i></button></td>' +
              "</tr>";
          }).join("")
        : '<tr><td colspan="4" class="text-center text-body-secondary py-4">No questions in this bank.</td></tr>') +
      "</tbody></table></div>";

    el("admQFilter").addEventListener("change", renderQuestions);

    var edits = el("seAdminBody").querySelectorAll("[data-qedit]");
    for (var i = 0; i < edits.length; i++) {
      edits[i].addEventListener("change", async function () {
        var id = this.getAttribute("data-qedit");
        var val = this.value;
        var selected = null;
        questions.forEach(function (q) { if (q.id === id) { q.text = val; selected = q; } });
        if (window.SEStore.isUsingBackend() && selected) {
          await window.SEStore.adminUpdateQuestion({
            question_id: selected.question_id, question_text: selected.text, options: selected.options,
            correct_option_index: selected.correct_option_index, order_index: selected.order_index
          });
        }
      });
    }

    var dels = el("seAdminBody").querySelectorAll("[data-qdel]");
    for (var d = 0; d < dels.length; d++) {
      dels[d].addEventListener("click", async function () {
        var id = this.getAttribute("data-qdel");
        if (window.SEStore.isUsingBackend()) await window.SEStore.adminDeleteQuestion(id);
        questions = questions.filter(function (q) { return q.id !== id; });
        await renderQuestions();
      });
    }

    el("admAddQ").addEventListener("click", async function () {
      var slug = filter === "all" ? "phishing" : filter;
      var n = questions.filter(function (q) { return q.slug === slug; }).length + 1;
      var quiz = quizzes.filter(function (q) { return q.slug === slug; })[0];
      if (window.SEStore.isUsingBackend() && !quiz) return;
      if (window.SEStore.isUsingBackend()) {
        await window.SEStore.adminAddQuestion({
          quiz_id: quiz.quiz_id, question_text: "New question. Edit this text",
          options: ["Option 1", "Option 2"], correct_option_index: 0, order_index: n
        });
        await loadAdminData();
        return renderQuestions();
      }
      questions.push({
        id: slug + "-" + n,
        module: window.QUIZ_DATA[slug].title,
        slug: slug,
        type: "knowledge",
        text: "New question. Edit this text",
        answer: "Not set"
      });
      renderQuestions();
    });
  }

  /* ---------------------- Users & subscriptions ---------------------- */
  async function renderUsers() {
    el("seAdminBody").innerHTML =
      '<div class="d-flex flex-wrap align-items-center gap-2 mb-3">' +
      '  <div><h3 class="h6 mb-1">Users and subscriptions</h3>' +
      '    <p class="text-body-secondary mb-0" style="font-size:.88rem;">' + users.length +
      " accounts.</p></div>" +
      "</div>" +
      '<div class="se-table-wrap"><table class="se-table"><thead><tr>' +
      "<th>Name</th><th>Email</th><th style=\"width:130px;\">Plan</th><th style=\"width:120px;\">Status</th>" +
      "<th>Joined</th><th style=\"width:96px;\">Actions</th></tr></thead><tbody>" +
      users.map(function (u, i) {
        return "<tr>" +
          "<td>" + esc(u.name) + (u.isLive ? ' <span class="se-pill" style="margin-left:.3rem;">You</span>' : "") + "</td>" +
          "<td>" + esc(u.email) + "</td>" +
          '<td><select class="form-select form-select-sm" data-uplan="' + i + '">' +
          "<option" + (u.plan === "Free" ? " selected" : "") + ">Free</option>" +
          "<option" + (u.plan === "Premium" ? " selected" : "") + ">Premium</option></select></td>" +
          '<td><span class="se-status ' + (u.status === "Active" ? "done" : "todo") + '">' + esc(u.status) + "</span></td>" +
          "<td>" + esc(u.joined) + "</td>" +
          '<td><button type="button" class="se-icon-btn danger" data-udel="' + i + '" ' +
          'aria-label="Remove user"><i class="bi bi-trash" aria-hidden="true"></i></button></td>' +
          "</tr>";
      }).join("") +
      "</tbody></table></div>" +
      '<p class="mt-3 mb-0" style="font-size:.86rem;color:var(--se-muted);">Subscription changes are restricted to administrators and saved immediately.</p>';

    var plans = el("seAdminBody").querySelectorAll("[data-uplan]");
    for (var i = 0; i < plans.length; i++) {
      plans[i].addEventListener("change", async function () {
        var idx = parseInt(this.getAttribute("data-uplan"), 10);
        users[idx].plan = this.value;
        if (window.SEStore.isUsingBackend()) await window.SEStore.adminUpdateUser(users[idx].id, users[idx].plan, users[idx].status.toLowerCase());
        await renderUsers();
      });
    }

    var dels = el("seAdminBody").querySelectorAll("[data-udel]");
    for (var d = 0; d < dels.length; d++) {
      dels[d].addEventListener("click", async function () {
        var idx = parseInt(this.getAttribute("data-udel"), 10);
        if (window.SEStore.isUsingBackend()) await window.SEStore.adminDeleteUser(users[idx].id);
        users.splice(idx, 1);
        await renderUsers();
      });
    }
  }

  /* ======================================================================
     INIT
     ====================================================================== */
  document.addEventListener("DOMContentLoaded", function () {
    if (!el("seAdminShell")) return;
    window.SEStore.ready().then(function () {
      if (window.SEStore.getAdmin()) renderPanel();
      else renderLogin();
    });
  });
})();

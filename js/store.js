/* ==========================================================================
   store.js: state layer for the premium tier
   Web-Based Social Engineering Awareness Platform for Remote Workers
   Group 4 · S3102 · MO-IT200D1 Capstone 1
   --------------------------------------------------------------------------
   Updated by: Juan Paolo Dente — wired to the real Node.js + MySQL backend
   (see /backend-node) while keeping every original method name and every
   original data shape identical, so no page or view script needed to change
   its read calls. Every function documented in the original header comment
   as a "swap point" has now actually been swapped:

     getUser()              ->  GET  /api/auth/me      (via /api/dashboard hydration)
     register()/login()     ->  POST /api/auth/register | /api/auth/login
     getProgress()          ->  GET  /api/dashboard
     markModuleComplete()   ->  POST /api/quizzes/:id/submit (via quiz) or manual toggle
     getQuizHistory()       ->  GET  /api/dashboard
     addQuizAttempt()       ->  POST /api/quizzes/:id/submit
     getAssessment()        ->  GET  /api/dashboard
     setAssessment()        ->  POST /api/assessment/submit

   If window.SE_API_BASE is blank, or the backend can't be reached, this
   falls back to the exact original sessionStorage-only prototype behavior
   (including the demo account) — nothing breaks without a live backend.

   IMPORTANT — read functions are now backed by a hydrated in-memory cache,
   not a live read every call. Any page reading SEStore.getUser() /
   getProgress() / etc. must wait for window.SEStore.ready() to resolve
   first. account.js's DOMContentLoaded handler does this once, for every
   page, before anything else runs — see account.js.
   ========================================================================== */

(function () {
  "use strict";

  var KEY = "se-prototype-state";
  var TOKEN_KEY = "se-auth-token";
  var DEMO_EMAIL = "demo@seaware.ph";

  var API = function () { return window.SE_API_BASE || ""; };
  function backendConfigured() { return !!API(); }

  var usingBackend = false;   // true for HTTP(S) server-backed mode
  var liveState = null;       // in-memory cache when usingBackend is true

  /* ----------------------------------------------------------------------
     Original sessionStorage layer — UNCHANGED, used whenever there is no
     backend configured/reachable, or no one is signed in through it.
     ---------------------------------------------------------------------- */
  var DEFAULT_STATE = {
    user: null,
    accounts: [],
    progress: {},
    quizHistory: [],
    assessment: null,
    admin: null
  };

  function read() {
    try {
      var raw = sessionStorage.getItem(KEY);
      if (!raw) return JSON.parse(JSON.stringify(DEFAULT_STATE));
      var parsed = JSON.parse(raw);
      var out = JSON.parse(JSON.stringify(DEFAULT_STATE));
      for (var k in parsed) {
        if (Object.prototype.hasOwnProperty.call(parsed, k)) out[k] = parsed[k];
      }
      return out;
    } catch (err) {
      return JSON.parse(JSON.stringify(DEFAULT_STATE));
    }
  }

  function write(state) {
    try { sessionStorage.setItem(KEY, JSON.stringify(state)); } catch (err) { /* no-op */ }
    return state;
  }

  var CATALOGUE = [
    { slug: "phishing",        title: "Phishing",                       type: "Free",    category: "Attack type", quiz: true },
    { slug: "spear-phishing",  title: "Spear Phishing",                 type: "Free",    category: "Attack type", quiz: true },
    { slug: "smishing",        title: "Smishing",                       type: "Free",    category: "Attack type", quiz: true },
    { slug: "vishing",         title: "Vishing",                        type: "Free",    category: "Attack type", quiz: true },
    { slug: "pretexting",      title: "Pretexting",                     type: "Free",    category: "Attack type", quiz: true },
    { slug: "safe-practices",  title: "Safe Practices for Remote Workers", type: "Free", category: "Practices",   quiz: false },
    { slug: "client-impersonation", title: "Client Impersonation",      type: "Premium", category: "Role-based",  quiz: false },
    { slug: "invoice-scams",   title: "Invoice and Payment Scams",      type: "Premium", category: "Role-based",  quiz: false },
    { slug: "fake-recruiters", title: "Fake Job and Recruiter Offers",  type: "Premium", category: "Role-based",  quiz: false },
    { slug: "client-data",     title: "Secure Client Data Handling",    type: "Premium", category: "Role-based",  quiz: false }
  ];

  function seedDemoData() {
    var s = read();
    if (s.quizHistory.length) return;
    var now = Date.now(), day = 86400000;
    var stamp = function (daysAgo) { return new Date(now - daysAgo * day).toISOString(); };

    s.progress = {
      "phishing":       { status: "Completed", completedAt: stamp(6) },
      "spear-phishing": { status: "Completed", completedAt: stamp(4) },
      "smishing":       { status: "Completed", completedAt: stamp(2) },
      "safe-practices": { status: "Completed", completedAt: stamp(1) }
    };
    s.quizHistory = [
      { slug: "phishing",       title: "Phishing",       score: 9, total: 10, at: stamp(6) },
      { slug: "spear-phishing", title: "Spear Phishing", score: 8, total: 10, at: stamp(4) },
      { slug: "smishing",       title: "Smishing",       score: 6, total: 10, at: stamp(2) }
    ];
    s.assessment = {
      score: 11, total: 15, level: "Intermediate", levelKey: "intermediate",
      blurb: "You have solid instincts and a real gap or two. The modules below target exactly where you lost marks.",
      byTopic: {
        "phishing": { correct: 3, total: 3 }, "spear-phishing": { correct: 2, total: 2 },
        "smishing": { correct: 2, total: 2 }, "vishing": { correct: 1, total: 3 },
        "pretexting": { correct: 1, total: 2 }, "safe-practices": { correct: 2, total: 3 }
      },
      weakAreas: ["vishing", "pretexting"], at: stamp(3)
    };
    write(s);
  }

  /* ----------------------------------------------------------------------
     Real backend layer
     ---------------------------------------------------------------------- */
  function getToken() {
    try { return sessionStorage.getItem(TOKEN_KEY); } catch (err) { return null; }
  }
  function setToken(t) {
    try {
      if (t) sessionStorage.setItem(TOKEN_KEY, t);
      else sessionStorage.removeItem(TOKEN_KEY);
    } catch (err) { /* no-op */ }
  }

  function api(path, options) {
    options = options || {};
    var headers = options.headers || {};
    headers["Content-Type"] = "application/json";
    var token = getToken();
    if (token) headers["Authorization"] = "Bearer " + token;

    return fetch(API() + path, {
      method: options.method || "GET",
      headers: headers,
      body: options.body ? JSON.stringify(options.body) : undefined
    }).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (data) {
        if (!res.ok) throw new Error(data.error || "Request failed.");
        return data;
      });
    });
  }

  // Translate the backend's /api/dashboard shape into the exact shape
  // every page script already expects (see header comment above).
  function mapDashboard(profile, dash) {
    var progress = {};
    (dash.progress || []).forEach(function (p) {
      progress[p.slug] = { status: p.completion_status === "completed" ? "Completed" : "In progress", completedAt: p.completion_date };
    });

    var quizHistory = (dash.quiz_history || []).map(function (h) {
      return { slug: h.slug, title: h.module_title, score: h.score, total: h.total, at: h.date_completed };
    });

    var assessment = null;
    if (dash.assessment) {
      var a = dash.assessment;
      assessment = {
        score: a.score, total: a.total, level: a.awareness_level, levelKey: a.level_key,
        byTopic: a.by_topic, weakAreas: a.weak_areas, at: a.assessment_date
      };
    }

    return {
      user: {
        firstName: profile.first_name, lastName: profile.last_name || "",
        email: profile.email, subscription: profile.subscription_type,
        createdAt: profile.created_at, role: profile.role
      },
      progress: progress,
      quizHistory: quizHistory,
      assessment: assessment,
      admin: profile.role === "admin" ? { username: profile.email, at: profile.created_at } : null
    };
  }

  function hydrate() {
    if (!backendConfigured()) {
      usingBackend = false;
      return Promise.resolve();
    }
    usingBackend = true;
    if (!getToken()) {
      liveState = JSON.parse(JSON.stringify(DEFAULT_STATE));
      return Promise.resolve();
    }
    return Promise.all([api("/api/auth/me"), api("/api/dashboard")])
      .then(function (results) {
        liveState = mapDashboard(results[0], results[1]);
        usingBackend = true;
      })
      .catch(function () {
        // Do not fall back to spoofable demo state on a real deployment.
        setToken(null);
        liveState = JSON.parse(JSON.stringify(DEFAULT_STATE));
      });
  }

  var readyPromise = null;

  window.SEStore = {

    DEMO_EMAIL: DEMO_EMAIL,

    /** Must resolve before any getXxx() call is trusted. Called once by
     *  account.js on every page load. Safe to call more than once. */
    ready: function () {
      if (!readyPromise) readyPromise = hydrate();
      return readyPromise;
    },

    isUsingBackend: function () { return usingBackend; },

    /* ==================== identity ==================== */

    getUser: function () {
      return usingBackend ? liveState.user : read().user;
    },

    isSignedIn: function () {
      return usingBackend ? !!liveState.user : !!read().user;
    },

    isPremium: function () {
      var u = this.getUser();
      return !!u && u.subscription === "Premium";
    },

    register: function (firstName, lastName, email, password) {
      if (backendConfigured()) {
        return api("/api/auth/register", {
          method: "POST",
          body: { first_name: firstName, last_name: lastName, email: email, password: password }
        }).then(function (data) {
          setToken(data.token);
          return hydrate().then(function () { return { ok: true, user: liveState.user }; });
        }).catch(function (err) {
          return { ok: false, error: err.message };
        });
      }

      // Demo-mode fallback (original behavior)
      var s = read();
      var mail = String(email).trim().toLowerCase();
      if (s.accounts.indexOf(mail) !== -1) {
        return Promise.resolve({ ok: false, error: "An account with that email already exists in this session." });
      }
      s.accounts.push(mail);
      s.user = { firstName: String(firstName).trim(), lastName: String(lastName || "").trim(), email: mail, subscription: "Free", createdAt: new Date().toISOString() };
      write(s);
      return Promise.resolve({ ok: true, user: s.user });
    },

    login: function (email, password) {
      if (backendConfigured()) {
        return api("/api/auth/login", { method: "POST", body: { email: email, password: password } })
          .then(function (data) {
            setToken(data.token);
            return hydrate().then(function () { return { ok: true, user: liveState.user }; });
          }).catch(function (err) {
            return { ok: false, error: err.message };
          });
      }

      // Demo-mode fallback (original behavior, including the demo account)
      var s = read();
      var mail = String(email).trim().toLowerCase();

      if (mail === DEMO_EMAIL) {
        s.user = { firstName: "Demo", lastName: "User", email: DEMO_EMAIL, subscription: "Premium", createdAt: new Date().toISOString() };
        if (s.accounts.indexOf(mail) === -1) s.accounts.push(mail);
        write(s);
        seedDemoData();
        return Promise.resolve({ ok: true, user: read().user, demo: true });
      }
      if (s.accounts.indexOf(mail) === -1) {
        return Promise.resolve({ ok: false, error: "No account with that email was registered in this session. Register first." });
      }
      if (!s.user || s.user.email !== mail) {
        s.user = { firstName: mail.split("@")[0], lastName: "", email: mail, subscription: "Free", createdAt: new Date().toISOString() };
      }
      write(s);
      return Promise.resolve({ ok: true, user: s.user });
    },

    logout: function () {
      if (usingBackend) {
        setToken(null);
        liveState = null;
        usingBackend = false;
        readyPromise = null;
        return Promise.resolve();
      }
      var s = read();
      s.user = null;
      s.admin = null;
      write(s);
      return Promise.resolve();
    },

    /** Starts a hosted Stripe Checkout session. Premium is granted only by
     *  the verified Stripe webhook, never by this browser call. */
    upgrade: function () {
      if (backendConfigured() && usingBackend) {
        return api("/api/payments/checkout-session", { method: "POST" })
          .then(function (data) {
            if (!data.url) throw new Error("Checkout URL was not returned.");
            window.location.assign(data.url);
            return { ok: true, redirecting: true };
          })
          .catch(function (err) { return { ok: false, error: err.message }; });
      }
      return Promise.resolve({ ok: false, error: "Payments require the live backend. Start the server and sign in first." });
    },

    downgrade: function () {
      if (backendConfigured() && usingBackend) {
        return api("/api/payments/portal-session", { method: "POST" })
          .then(function (data) {
            if (!data.url) throw new Error("Billing portal URL was not returned.");
            window.location.assign(data.url);
            return { ok: true, redirecting: true };
          })
          .catch(function (err) { return { ok: false, error: err.message }; });
      }
      return Promise.resolve({ ok: false, error: "Billing management requires the live backend." });
    },

    /* ==================== progress ==================== */

    getProgress: function () {
      return usingBackend ? liveState.progress : read().progress;
    },

    /** Manual toggle from a module page (not through a quiz). No dedicated
     *  backend route for this exists yet without a quiz attempt attached —
     *  falls back to session-only for now when using the real backend. */
    markModuleComplete: function (slug) {
      if (usingBackend) {
        return api("/api/progress/" + encodeURIComponent(slug), { method: "PUT" }).then(function (data) {
          liveState.progress[slug] = { status: "Completed", completedAt: data.completed_at };
          return liveState.progress;
        });
      }
      var s = read();
      s.progress[slug] = { status: "Completed", completedAt: new Date().toISOString() };
      return Promise.resolve(write(s).progress);
    },

    unmarkModule: function (slug) {
      if (usingBackend) {
        return api("/api/progress/" + encodeURIComponent(slug), { method: "DELETE" }).then(function () {
          delete liveState.progress[slug];
          return liveState.progress;
        });
      }
      var s = read();
      delete s.progress[slug];
      return Promise.resolve(write(s).progress);
    },

    /* ==================== quiz history ==================== */

    getQuizHistory: function () {
      var list = usingBackend ? liveState.quizHistory : read().quizHistory;
      return list.slice().sort(function (a, b) { return new Date(b.at) - new Date(a.at); });
    },

    /** Records a completed quiz attempt (already scored client-side by
     *  quiz.js, using quiz-data.js). */
    addQuizAttempt: function (attempt) {
      if (usingBackend) {
        return api("/api/quizzes/record-attempt", {
          method: "POST",
          body: { slug: attempt.slug, score: attempt.score, total: attempt.total }
        }).then(function () {
          liveState.quizHistory.push(attempt);
          liveState.progress[attempt.slug] = { status: "Completed", completedAt: attempt.at };
          return liveState.quizHistory;
        }).catch(function (err) {
          console.warn("[store] quiz attempt save failed, kept locally for this session: " + err.message);
          liveState.quizHistory.push(attempt);
          liveState.progress[attempt.slug] = { status: "Completed", completedAt: attempt.at };
          return liveState.quizHistory;
        });
      }
      var s = read();
      s.quizHistory.push(attempt);
      s.progress[attempt.slug] = { status: "Completed", completedAt: attempt.at };
      write(s);
      return Promise.resolve(s.quizHistory);
    },

    /* ==================== assessment ==================== */

    getAssessment: function () {
      return usingBackend ? liveState.assessment : read().assessment;
    },

    setAssessment: function (result) {
      if (usingBackend) {
        return api("/api/assessment/submit", {
          method: "POST",
          body: {
            score: result.score, total: result.total, level: result.level,
            level_key: result.levelKey, by_topic: result.byTopic, weak_areas: result.weakAreas
          }
        }).then(function () {
          liveState.assessment = result;
          return result;
        }).catch(function (err) {
          console.warn("[store] assessment save failed, kept locally for this session: " + err.message);
          liveState.assessment = result;
          return result;
        });
      }
      var s = read();
      s.assessment = result;
      write(s);
      return Promise.resolve(result);
    },

    /* ==================== admin ==================== */

    getAdmin: function () {
      return usingBackend ? liveState.admin : read().admin;
    },

    /** identifier is treated as an email when a real backend is configured
     *  (the backend has no separate "username" concept — an admin is a
     *  regular account with role='admin'). In demo mode, behaves exactly
     *  as before: any 3+ character username, any 8+ character password. */
    adminLogin: function (identifier, password) {
      if (backendConfigured()) {
        return api("/api/auth/login", { method: "POST", body: { email: identifier, password: password } })
          .then(function (data) {
            if (data.user.role !== "admin") {
              return { ok: false, error: "That account isn't an administrator." };
            }
            setToken(data.token);
            return hydrate().then(function () { return { ok: true }; });
          })
          .catch(function (err) { return { ok: false, error: err.message }; });
      }
      var s = read();
      s.admin = { username: String(identifier).trim(), at: new Date().toISOString() };
      write(s);
      return Promise.resolve({ ok: true });
    },

    adminLogout: function () {
      if (usingBackend) {
        setToken(null);
        liveState = null;
        usingBackend = false;
        readyPromise = null;
        return Promise.resolve();
      }
      var s = read();
      s.admin = null;
      write(s);
      return Promise.resolve();
    },

    /* ==================== catalogue ==================== */

    getCatalogue: function () {
      if (backendConfigured()) {
        return api("/api/modules").then(function (modules) {
          return modules.map(function (m) {
            return { slug: m.slug, title: m.module_title, type: m.module_type, category: m.category || "", quiz: true, _id: m.module_id };
          });
        }).catch(function () { return CATALOGUE.slice(); });
      }
      var s = read();
      return Promise.resolve(s.catalogue || CATALOGUE.slice());
    },

    /** Given the FULL edited list, diffs against the backend by creating/
     *  updating/deleting as needed. In demo mode, just overwrites the
     *  session copy exactly as before. */
    saveCatalogue: function (list) {
      if (backendConfigured() && usingBackend) {
        var calls = list.map(function (m) {
          var body = { module_title: m.title, module_type: m.type, category: m.category, slug: m.slug };
          if (m._id) return api("/api/modules/" + m._id, { method: "PUT", body: body });
          return api("/api/modules", { method: "POST", body: body });
        });
        return Promise.all(calls).then(function () { return list; }).catch(function (err) {
          console.warn("[store] saveCatalogue failed: " + err.message);
          return list;
        });
      }
      var s = read();
      s.catalogue = list;
      write(s);
      return Promise.resolve(list);
    },

    deleteModule: function (module) {
      if (backendConfigured() && usingBackend && module && module._id) {
        return api("/api/modules/" + module._id, { method: "DELETE" });
      }
      return Promise.resolve();
    },

    adminGetUsers: function () {
      return api("/api/admin/users");
    },

    adminUpdateUser: function (id, plan, status) {
      return api("/api/admin/users/" + id, { method: "PATCH", body: { subscription_type: plan, subscription_status: status } });
    },

    adminDeleteUser: function (id) {
      return api("/api/admin/users/" + id, { method: "DELETE" });
    },

    adminGetQuestions: function () {
      return api("/api/admin/questions");
    },

    adminGetQuizzes: function () {
      return api("/api/admin/quizzes");
    },

    adminAddQuestion: function (question) {
      return api("/api/quizzes/" + question.quiz_id + "/questions", { method: "POST", body: question });
    },

    adminUpdateQuestion: function (question) {
      return api("/api/quizzes/questions/" + question.question_id, { method: "PUT", body: question });
    },

    adminDeleteQuestion: function (id) {
      return api("/api/quizzes/questions/" + id, { method: "DELETE" });
    },

    resetCatalogue: function () {
      var s = read();
      delete s.catalogue;
      write(s);
      return Promise.resolve(CATALOGUE.slice());
    },

    /* ==================== utility ==================== */

    reset: function () {
      try { sessionStorage.removeItem(KEY); sessionStorage.removeItem(TOKEN_KEY); } catch (err) { /* no-op */ }
    },

    formatDate: function (iso) {
      var d = new Date(iso);
      if (isNaN(d)) return "Unknown";
      var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      var hh = d.getHours();
      var ampm = hh >= 12 ? "PM" : "AM";
      hh = hh % 12 || 12;
      var mm = ("0" + d.getMinutes()).slice(-2);
      return months[d.getMonth()] + " " + d.getDate() + ", " + d.getFullYear() + " · " + hh + ":" + mm + " " + ampm;
    }
  };
})();

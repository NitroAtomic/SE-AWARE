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
  var PENDING_KEY = "se-otp-pending";
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

  /* The pendingToken is NOT a login. It only proves "this person just typed
     the correct password, and a code was sent to them." It expires in a few
     minutes and is useless on its own. It is kept separate from the real
     token so it can never be mistaken for being signed in. */
  function getPendingToken() {
    try { return sessionStorage.getItem(PENDING_KEY); } catch (err) { return null; }
  }
  function setPendingToken(t) {
    try {
      if (t) sessionStorage.setItem(PENDING_KEY, t);
      else sessionStorage.removeItem(PENDING_KEY);
    } catch (err) { /* no-op */ }
  }

  /* ----------------------------------------------------------------------
     Slug translation
     ----------------------------------------------------------------------
     This site and the shared database do not spell two module slugs the
     same way:

       this site        the database
       ---------        ------------
       phishing     ->  quishing
       safe-practices-> essential-safe-practices-remote-environments

     The other eight match exactly. This matters in BOTH directions:

     Going out, /api/quizzes/record-attempt looks the module up by slug, so
     an untranslated "phishing" comes back 404 "Module not found." The save
     then fails quietly - the score is kept for the session and a warning
     goes to the console, but it never reaches the database. A score that
     looks saved and is not is worse than an obvious error.

     Coming back, the dashboard returns the database's spelling. Left
     untranslated, a finished Phishing module arrives as "quishing", does
     not match this site's catalogue key, and the completed tick never
     appears on the card the user actually clicked.

     Keep these two maps as exact mirrors of each other.
     ---------------------------------------------------------------------- */
  var SLUG_TO_DB = {
    "phishing": "quishing",
    "safe-practices": "essential-safe-practices-remote-environments"
  };
  var SLUG_FROM_DB = {
    "quishing": "phishing",
    "essential-safe-practices-remote-environments": "safe-practices"
  };

  /* The translation applies to ONE backend only - the shared capstone one.
     This repository's own backend already uses the same slugs this site
     does, so translating there would do real damage: it would rewrite
     "phishing" to "quishing", which that database has never heard of, and
     every Phishing quiz result would 404 instead of saving.

     So the rule is: translate only when backend-config.js has said we are
     talking to the group backend. Anything else, leave the slug alone.
     Defaults to no translation, because that is the safe direction - a
     missed translation is a wrong slug on two modules, an unwanted one is
     a wrong slug on all ten. */
  function isGroupBackend() {
    return window.SE_API_FLAVOR === "group";
  }

  function toDbSlug(slug) {
    if (!isGroupBackend()) return slug;
    return SLUG_TO_DB[slug] || slug;
  }
  function fromDbSlug(slug) {
    if (!isGroupBackend()) return slug;
    return SLUG_FROM_DB[slug] || slug;
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
      // fromDbSlug: the completed tick has to land on the card this site
      // actually shows, not on a slug only the database knows about.
      progress[fromDbSlug(p.slug)] = { status: p.completion_status === "completed" ? "Completed" : "In progress", completedAt: p.completion_date };
    });

    var quizHistory = (dash.quiz_history || []).map(function (h) {
      return { slug: fromDbSlug(h.slug), title: h.module_title, score: h.score, total: h.total, at: h.date_completed };
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

  /* hydrate() flips usingBackend to true the moment it starts, but liveState
     is only filled in once the server actually answers. Between those two
     moments every getter below was dereferencing null.

     In normal use account.js gates the page on ready(), so nothing read
     state that early. It still mattered on the live site: Render's free
     tier cold-starts, so that gap can be 30 seconds or more, and a single
     stray read during it took the page down with
     "Cannot read properties of null".

     live() closes the gap - an empty but valid state until the real data
     lands, which is what the pages already render for a signed-out user. */
  function live() {
    return liveState || (liveState = JSON.parse(JSON.stringify(DEFAULT_STATE)));
  }

  function hydrate() {    if (!backendConfigured()) {
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
      return usingBackend ? live().user : read().user;
    },

    isSignedIn: function () {
      return usingBackend ? !!live().user : !!read().user;
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
          return hydrate().then(function () { return { ok: true, user: live().user }; });
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
            // Premium accounts get a one-time code by email instead of a
            // token. The password was already accepted at this point; we are
            // not signed in yet, so there is nothing to hydrate. We hold the
            // short-lived pendingToken and let the page ask for the code.
            if (data.requiresOtp) {
              setPendingToken(data.pendingToken);
              return {
                ok: true,
                requiresOtp: true,
                email: data.email || email,
                expiresInMinutes: data.expiresInMinutes || null
              };
            }

            setToken(data.token);
            return hydrate().then(function () { return { ok: true, user: live().user }; });
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

    /* Second half of a Premium login: trade the 6-digit code for a real
       token. Only reachable after login() came back with requiresOtp. */
    verifyOtp: function (code) {
      if (!backendConfigured()) {
        // Demo mode never sends a code, so there is nothing to verify.
        return Promise.resolve({ ok: false, error: "Verification is only used when the live backend is connected." });
      }

      var pending = getPendingToken();
      if (!pending) {
        return Promise.resolve({ ok: false, error: "This verification session expired. Please log in again." });
      }

      return api("/api/auth/verify-otp", {
        method: "POST",
        body: { pendingToken: pending, code: String(code).trim() }
      }).then(function (data) {
        setPendingToken(null);          // single use — burn it immediately
        setToken(data.token);
        return hydrate().then(function () { return { ok: true, user: live().user }; });
      }).catch(function (err) {
        return { ok: false, error: err.message };
      });
    },

    /* Ask for a fresh code. The backend hands back a NEW pendingToken, so we
       have to replace the stored one or the next verify would use a dead id. */
    resendOtp: function () {
      if (!backendConfigured()) {
        return Promise.resolve({ ok: false, error: "Verification is only used when the live backend is connected." });
      }

      var pending = getPendingToken();
      if (!pending) {
        return Promise.resolve({ ok: false, error: "This verification session expired. Please log in again." });
      }

      return api("/api/auth/resend-otp", { method: "POST", body: { pendingToken: pending } })
        .then(function (data) {
          if (data.pendingToken) setPendingToken(data.pendingToken);
          return { ok: true, message: data.message || "A new code has been sent." };
        }).catch(function (err) {
          return { ok: false, error: err.message };
        });
    },

    // True while a Premium login is waiting on its code.
    isAwaitingOtp: function () {
      return !!getPendingToken();
    },

    /* Read-only access to the signed-in token, for the chatbot.
       /api/chat decides a user's plan from this token by looking the
       subscription up in the database - it never trusts the browser. Sent
       without it, every question is answered as if the user were on the
       Free plan, so a paying Premium user would silently get the Free
       answers to their own premium topics. Returns null when signed out,
       which is the correct guest behaviour. */
    getAuthToken: function () {
      return getToken() || null;
    },

    cancelOtp: function () {
      setPendingToken(null);
    },

    logout: function () {
      setPendingToken(null);   // never leave a half-finished login behind
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

    /** FR-10: moves the account between Free and Premium.
     *
     *  No payment is taken. The paper's Scope and Limitations section
     *  excludes payment gateway integration, billing, and transaction
     *  processing from this study, so the plan is simply recorded on the
     *  account. The Stripe routes in the backend remain available for a
     *  future build but are not part of this flow.
     *
     *  Offline, this updates the session copy so the free tier still
     *  demonstrates the gate without a server. */
    upgrade: function () {
      if (backendConfigured() && usingBackend) {
        return api("/api/auth/me/subscription", {
          method: "PATCH",
          body: { subscription_type: "Premium" }
        })
          .then(function () {
            // live().user can still be null if the plan change lands before
            // hydration finished; re-hydrate rather than throw.
            if (!live().user) return hydrate().then(function () { return { ok: true, user: live().user }; });
            live().user.subscription = "Premium";
            return { ok: true, user: live().user };
          })
          .catch(function (err) { return { ok: false, error: err.message }; });
      }
      var s = read();
      if (!s.user) return Promise.resolve({ ok: false, error: "Sign in first." });
      s.user.subscription = "Premium";
      write(s);
      return Promise.resolve({ ok: true, user: s.user });
    },

    downgrade: function () {
      if (backendConfigured() && usingBackend) {
        return api("/api/auth/me/subscription", {
          method: "PATCH",
          body: { subscription_type: "Free" }
        })
          .then(function () {
            // live().user can still be null if the plan change lands before
            // hydration finished; re-hydrate rather than throw.
            if (!live().user) return hydrate().then(function () { return { ok: true, user: live().user }; });
            live().user.subscription = "Free";
            return { ok: true, user: live().user };
          })
          .catch(function (err) { return { ok: false, error: err.message }; });
      }
      var s = read();
      if (!s.user) return Promise.resolve({ ok: false, error: "Sign in first." });
      s.user.subscription = "Free";
      write(s);
      return Promise.resolve({ ok: true, user: s.user });
    },

    /* ==================== progress ==================== */

    getProgress: function () {
      return usingBackend ? live().progress : read().progress;
    },

    /** Manual toggle from a module page (not through a quiz).
     *
     *  The Render backend has no /api/progress route — it only records
     *  progress as a side effect of finishing a quiz. So this call is
     *  expected to fail there, and that is fine: we still move the tick
     *  in the page so the user sees their click, we just can't persist it.
     *
     *  The important part is that a missing route must NOT throw. An
     *  unhandled rejection here used to leave the module page's button
     *  stuck mid-click with no explanation. */
    markModuleComplete: function (slug) {
      if (usingBackend) {
        var done = { status: "Completed", completedAt: new Date().toISOString() };
        return api("/api/progress/" + encodeURIComponent(toDbSlug(slug)), { method: "PUT" })
          .then(function (data) {
            live().progress[slug] = { status: "Completed", completedAt: data.completed_at };
            return live().progress;
          })
          .catch(function () {
            // Route absent on this backend. Show it locally for this session;
            // finishing the module's quiz is what records it for real.
            live().progress[slug] = done;
            return live().progress;
          });
      }
      var s = read();
      s.progress[slug] = { status: "Completed", completedAt: new Date().toISOString() };
      return Promise.resolve(write(s).progress);
    },

    unmarkModule: function (slug) {
      if (usingBackend) {
        return api("/api/progress/" + encodeURIComponent(toDbSlug(slug)), { method: "DELETE" })
          .then(function () {
            delete live().progress[slug];
            return live().progress;
          })
          .catch(function () {
            delete live().progress[slug];
            return live().progress;
          });
      }
      var s = read();
      delete s.progress[slug];
      return Promise.resolve(write(s).progress);
    },

    /* ==================== quiz history ==================== */

    getQuizHistory: function () {
      var list = usingBackend ? live().quizHistory : read().quizHistory;
      return list.slice().sort(function (a, b) { return new Date(b.at) - new Date(a.at); });
    },

    /** Fetches a module's quiz bank from the API so that questions edited
     *  in the admin panel actually reach learners. The API deliberately
     *  withholds correct_option_index here, so the answer key never travels
     *  during the attempt itself.
     *
     *  Returns null when no backend is connected, which tells quiz.js to
     *  fall back to the bundled quiz-data.js banks and keeps the free tier
     *  working as a static site. */
    fetchQuizBank: function (slug) {
      if (!usingBackend) return Promise.resolve(null);
      return api("/api/quizzes/by-module/" + encodeURIComponent(toDbSlug(slug)))
        .then(function (data) {
          if (!data || !Array.isArray(data.questions) || !data.questions.length) return null;
          return {
            quizId: data.quiz_id,
            title: data.title ? data.title.replace(/\s*Quiz$/i, "") : slug,
            questions: data.questions.map(function (q) {
              var options = q.options;
              if (typeof options === "string") {
                try { options = JSON.parse(options); } catch (err) { options = []; }
              }
              return { id: q.question_id, q: q.question_text, options: options || [] };
            })
          };
        })
        .catch(function () { return null; });
    },

    /** Submits an attempt for server-side scoring. The response carries the
     *  answer key, which is what lets the results page show a review without
     *  the answers having been in the browser during the quiz. */
    submitQuizAttempt: function (quizId, questionIds, answers) {
      if (!usingBackend) return Promise.resolve(null);
      return api("/api/quizzes/" + quizId + "/submit", {
        method: "POST",
        body: { answers: answers, questionIds: questionIds }
      }).catch(function () { return null; });
    },

    /** Records a completed quiz attempt (already scored client-side by
     *  quiz.js, using quiz-data.js). */
    addQuizAttempt: function (attempt) {
      if (usingBackend) {
        return api("/api/quizzes/record-attempt", {
          method: "POST",
          body: { slug: toDbSlug(attempt.slug), score: attempt.score, total: attempt.total }
        }).then(function () {
          live().quizHistory.push(attempt);
          live().progress[attempt.slug] = { status: "Completed", completedAt: attempt.at };
          return live().quizHistory;
        }).catch(function (err) {
          console.warn("[store] quiz attempt save failed, kept locally for this session: " + err.message);
          live().quizHistory.push(attempt);
          live().progress[attempt.slug] = { status: "Completed", completedAt: attempt.at };
          return live().quizHistory;
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
      return usingBackend ? live().assessment : read().assessment;
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
          live().assessment = result;
          return result;
        }).catch(function (err) {
          console.warn("[store] assessment save failed, kept locally for this session: " + err.message);
          live().assessment = result;
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
      return usingBackend ? live().admin : read().admin;
    },

    /** identifier is treated as an email when a real backend is configured
     *  (the backend has no separate "username" concept — an admin is a
     *  regular account with role='admin'). In demo mode, behaves exactly
     *  as before: any 3+ character username, any 8+ character password. */
    adminLogin: function (identifier, password) {
      if (backendConfigured()) {
        return api("/api/auth/login", { method: "POST", body: { email: identifier, password: password } })
          .then(function (data) {
            /* If the admin's account is on the Premium plan, the backend
               sends a code instead of a token and there is NO data.user at
               all. Reading data.user.role here used to throw a TypeError
               that surfaced as a meaningless "Sign-in failed", locking
               Premium admins out of the portal entirely. */
            if (data.requiresOtp) {
              setPendingToken(data.pendingToken);
              return {
                ok: false,
                requiresOtp: true,
                email: data.email || identifier,
                expiresInMinutes: data.expiresInMinutes || null
              };
            }

            if (!data.user || data.user.role !== "admin") {
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

    /* Finishes a Premium admin's sign-in. Deliberately re-checks the role
       AFTER the code is verified, and throws the token away if the account
       is not an admin — so a normal Premium learner who reaches this page
       still cannot get into the portal. */
    adminVerifyOtp: function (code) {
      if (!backendConfigured()) {
        return Promise.resolve({ ok: false, error: "Verification is only used when the live backend is connected." });
      }

      var pending = getPendingToken();
      if (!pending) {
        return Promise.resolve({ ok: false, error: "This verification session expired. Please sign in again." });
      }

      return api("/api/auth/verify-otp", {
        method: "POST",
        body: { pendingToken: pending, code: String(code).trim() }
      }).then(function (data) {
        setPendingToken(null);

        if (!data.user || data.user.role !== "admin") {
          setToken(null);
          return { ok: false, error: "That account isn't an administrator." };
        }

        setToken(data.token);
        return hydrate().then(function () { return { ok: true }; });
      }).catch(function (err) {
        return { ok: false, error: err.message };
      });
    },

    adminLogout: function () {
      setPendingToken(null);
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
            return { slug: fromDbSlug(m.slug), title: m.module_title, type: m.module_type, category: m.category || "", quiz: true, _id: m.module_id };
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

    /* ---- admin ----------------------------------------------------------
       The Render backend exposes module and quiz-question management, but
       it has no /api/admin/* routes: there is no user-management API there.
       Rather than let the Users tab fail with a raw "Request failed", these
       raise one clear, honest message the admin page can display. */
    ADMIN_USERS_UNAVAILABLE: "User management isn't available on this backend. Modules and quiz questions are.",

    adminGetUsers: function () {
      var self = this;
      return api("/api/admin/users").catch(function () {
        throw new Error(self.ADMIN_USERS_UNAVAILABLE);
      });
    },

    adminUpdateUser: function (id, plan, status) {
      var self = this;
      return api("/api/admin/users/" + id, { method: "PATCH", body: { subscription_type: plan, subscription_status: status } })
        .catch(function () { throw new Error(self.ADMIN_USERS_UNAVAILABLE); });
    },

    adminDeleteUser: function (id) {
      var self = this;
      return api("/api/admin/users/" + id, { method: "DELETE" })
        .catch(function () { throw new Error(self.ADMIN_USERS_UNAVAILABLE); });
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

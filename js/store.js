/* ==========================================================================
   store.js: prototype state layer for the premium tier
   Web-Based Social Engineering Awareness Platform for Remote Workers
   Group 4 · S3102 · MO-IT200D1 Capstone 1
   --------------------------------------------------------------------------
   IMPORTANT: READ BEFORE THE DEFENCE

   This is a PROTOTYPE persistence layer, not a database. Everything lives in
   sessionStorage, which belongs to a single browser tab and is discarded the
   moment that tab closes. Nothing is transmitted to any server and no
   password is ever stored.

   It exists so the premium user journey documented in the capstone paper
   (registration, awareness assessment, dashboard, progress tracking, quiz
   history, recommendations, role-based modules, admin management) can be
   demonstrated end to end without a Node.js and MySQL backend, which is
   Capstone 2 work.

   Every function below is a deliberate SWAP POINT. Replacing the body of
   each one with a fetch() call to a real API changes nothing in the UI. No page or view script touches sessionStorage directly.

     getUser()              ->  GET  /api/me
     register()/login()     ->  POST /api/auth/register | /api/auth/login
     getProgress()          ->  GET  /api/progress
     markModuleComplete()   ->  POST /api/progress
     getQuizHistory()       ->  GET  /api/quiz-results
     addQuizAttempt()       ->  POST /api/quiz-results
     getAssessment()        ->  GET  /api/assessment
     setAssessment()        ->  POST /api/assessment
   ========================================================================== */

(function () {
  "use strict";

  var KEY = "se-prototype-state";

  var DEFAULT_STATE = {
    user: null,          // { firstName, lastName, email, subscription, createdAt }
    accounts: [],        // registered emails, for the login lookup only
    progress: {},        // { moduleSlug: { status, completedAt } }
    quizHistory: [],     // [ { slug, title, score, total, at } ]
    assessment: null,    // { score, total, level, byTopic, weakAreas, at }
    admin: null          // { username, at }
  };

  function read() {
    try {
      var raw = sessionStorage.getItem(KEY);
      if (!raw) return JSON.parse(JSON.stringify(DEFAULT_STATE));
      var parsed = JSON.parse(raw);
      // Merge so a state saved by an older build never breaks a newer page.
      var out = JSON.parse(JSON.stringify(DEFAULT_STATE));
      for (var k in parsed) {
        if (Object.prototype.hasOwnProperty.call(parsed, k)) out[k] = parsed[k];
      }
      return out;
    } catch (err) {
      if (window.console && console.warn) console.warn("[store] read failed: " + err.message);
      return JSON.parse(JSON.stringify(DEFAULT_STATE));
    }
  }

  function write(state) {
    try {
      sessionStorage.setItem(KEY, JSON.stringify(state));
    } catch (err) {
      if (window.console && console.warn) console.warn("[store] write failed: " + err.message);
    }
    return state;
  }

  /* ----------------------------------------------------------------------
     Module catalogue: the single source of truth for module titles and
     which of them are premium. The admin panel edits this copy.
     ---------------------------------------------------------------------- */
  var CATALOGUE = [
    { slug: "phishing",        title: "Phishing",                       type: "Free",    category: "Attack type",    quiz: true },
    { slug: "spear-phishing",  title: "Spear Phishing",                 type: "Free",    category: "Attack type",    quiz: true },
    { slug: "smishing",        title: "Smishing",                       type: "Free",    category: "Attack type",    quiz: true },
    { slug: "vishing",         title: "Vishing",                        type: "Free",    category: "Attack type",    quiz: true },
    { slug: "pretexting",      title: "Pretexting",                     type: "Free",    category: "Attack type",    quiz: true },
    { slug: "safe-practices",  title: "Safe Practices for Remote Workers", type: "Free", category: "Practices",      quiz: false },
    { slug: "client-impersonation", title: "Client Impersonation",      type: "Premium", category: "Role-based",     quiz: false },
    { slug: "invoice-scams",   title: "Invoice and Payment Scams",      type: "Premium", category: "Role-based",     quiz: false },
    { slug: "fake-recruiters", title: "Fake Job and Recruiter Offers",  type: "Premium", category: "Role-based",     quiz: false },
    { slug: "client-data",     title: "Secure Client Data Handling",    type: "Premium", category: "Role-based",     quiz: false }
  ];

  window.SEStore = {

    /* ==================== identity ==================== */

    getUser: function () {
      return read().user;
    },

    isSignedIn: function () {
      return !!read().user;
    },

    isPremium: function () {
      var u = read().user;
      return !!u && u.subscription === "Premium";
    },

    /**
     * Prototype registration. No password is stored, hashed or otherwise, * a real build would POST to the server and never hold one client-side.
     */
    register: function (firstName, lastName, email) {
      var s = read();
      var mail = String(email).trim().toLowerCase();

      if (s.accounts.indexOf(mail) !== -1) {
        return { ok: false, error: "An account with that email already exists in this session." };
      }

      s.accounts.push(mail);
      s.user = {
        firstName: String(firstName).trim(),
        lastName: String(lastName || "").trim(),
        email: mail,
        // New accounts start on Premium so the whole documented journey
        // (assessment, dashboard, role-based modules) is reachable straight
        // away. A production build would set this from the billing system.
        subscription: "Premium",
        createdAt: new Date().toISOString()
      };
      write(s);
      return { ok: true, user: s.user };
    },

    /**
     * Prototype sign-in. Because no credential is ever stored, this checks
     * only that the email was registered in this session. Real authentication
     * belongs on the server.
     */
    login: function (email) {
      var s = read();
      var mail = String(email).trim().toLowerCase();

      if (s.accounts.indexOf(mail) === -1) {
        return { ok: false, error: "No account with that email was registered in this session. Register first." };
      }

      if (!s.user || s.user.email !== mail) {
        s.user = {
          firstName: mail.split("@")[0],
          lastName: "",
          email: mail,
          subscription: "Premium",
          createdAt: new Date().toISOString()
        };
      }
      write(s);
      return { ok: true, user: s.user };
    },

    logout: function () {
      var s = read();
      s.user = null;
      s.admin = null;
      write(s);
    },

    /** Simulated upgrade. Scope excludes payment gateways and billing. */
    upgrade: function () {
      var s = read();
      if (!s.user) return { ok: false, error: "Sign in first." };
      s.user.subscription = "Premium";
      write(s);
      return { ok: true, user: s.user };
    },

    downgrade: function () {
      var s = read();
      if (!s.user) return { ok: false, error: "Sign in first." };
      s.user.subscription = "Free";
      write(s);
      return { ok: true, user: s.user };
    },

    /* ==================== progress ==================== */

    getProgress: function () {
      return read().progress;
    },

    markModuleComplete: function (slug) {
      var s = read();
      s.progress[slug] = { status: "Completed", completedAt: new Date().toISOString() };
      return write(s).progress;
    },

    unmarkModule: function (slug) {
      var s = read();
      delete s.progress[slug];
      return write(s).progress;
    },

    /* ==================== quiz history ==================== */

    getQuizHistory: function () {
      // Most recent first.
      return read().quizHistory.slice().sort(function (a, b) {
        return new Date(b.at) - new Date(a.at);
      });
    },

    addQuizAttempt: function (attempt) {
      var s = read();
      s.quizHistory.push(attempt);
      // Completing a quiz counts as completing that module.
      s.progress[attempt.slug] = { status: "Completed", completedAt: attempt.at };
      write(s);
      return s.quizHistory;
    },

    /* ==================== assessment ==================== */

    getAssessment: function () {
      return read().assessment;
    },

    setAssessment: function (result) {
      var s = read();
      s.assessment = result;
      return write(s).assessment;
    },

    /* ==================== admin ==================== */

    getAdmin: function () {
      return read().admin;
    },

    adminLogin: function (username) {
      var s = read();
      s.admin = { username: String(username).trim(), at: new Date().toISOString() };
      write(s);
      return { ok: true };
    },

    adminLogout: function () {
      var s = read();
      s.admin = null;
      write(s);
    },

    /* ==================== catalogue ==================== */

    getCatalogue: function () {
      var s = read();
      return s.catalogue || CATALOGUE.slice();
    },

    saveCatalogue: function (list) {
      var s = read();
      s.catalogue = list;
      write(s);
      return list;
    },

    resetCatalogue: function () {
      var s = read();
      delete s.catalogue;
      write(s);
      return CATALOGUE.slice();
    },

    /* ==================== utility ==================== */

    /** Wipe the whole prototype session, handy when rehearsing a demo. */
    reset: function () {
      try { sessionStorage.removeItem(KEY); } catch (err) { /* no-op */ }
    },

    /** Human-readable date for tables. */
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

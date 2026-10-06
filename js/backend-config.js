/* ==========================================================================
   backend-config.js: which API this site talks to
   --------------------------------------------------------------------------
   This is the ONE place the backend is chosen. Every page loads this file
   before store.js, so changing it here changes the whole site.

   ==========================================================================
   STEP 1 - put your own Render URL in SE_AWARE_API below
   ==========================================================================

   After you create the Render web service for this site's own backend
   (the /backend-node folder in this same repository), Render gives you a
   URL that looks like:

       https://se-aware.onrender.com

   Paste it into SE_AWARE_API below. That is the only edit needed here.

   Until you do, the GitHub Pages site keeps running in offline demo mode,
   exactly as it always has. Nothing breaks while the value is empty.

   ==========================================================================
   Why there are two "flavors" of backend
   ==========================================================================

   This site can talk to either of two different backends, and they are NOT
   the same shape:

   "se-aware"  - this repository's own backend, in /backend-node.
                 It has every route this site calls, including
                 /api/progress and /api/admin, and its module slugs match
                 this site exactly. Login is a single step.

   "group"     - the shared capstone backend at se-aware-group.onrender.com.
                 It has no /api/progress or /api/admin routes, it spells two
                 module slugs differently, and Premium accounts need an
                 emailed code to finish signing in.

   store.js reads SE_API_FLAVOR to know which of those it is dealing with.
   Getting this wrong matters: the slug translation that is REQUIRED for the
   group backend would actively BREAK the se-aware backend, by rewriting
   "phishing" to "quishing" - a slug that does not exist in its database.

   So: whenever you change SE_API_BASE, check SE_API_FLAVOR matches it.
   ========================================================================== */
(function () {
  /* ---- STEP 1: your own backend's Render URL goes here ------------------
     Leave it as "" until the service exists. No trailing slash.            */
  var SE_AWARE_API = "";

  /* The shared capstone backend. Only used if you deliberately switch to it
     below - and note it also requires "https://nitroatomic.github.io" to be
     added to CORS_ORIGINS on that service, which is a change to the live
     capstone deployment. */
  var GROUP_API = "https://se-aware-group.onrender.com";

  // Anything set by hand earlier in the page, or from the console while
  // testing, always wins. We never overwrite a deliberate choice.
  if (typeof window.SE_API_BASE === "string" && window.SE_API_BASE !== "") {
    window.SE_API_FLAVOR = window.SE_API_FLAVOR || "se-aware";
    return;
  }

  var protocol = window.location.protocol;
  var host = window.location.hostname;

  // Opened as a plain file. There is no server, so there is no API, and the
  // site runs its offline demo exactly as before.
  if (protocol === "file:") {
    window.SE_API_BASE = "";
    window.SE_API_FLAVOR = "se-aware";
    return;
  }

  // Published on GitHub Pages. Pages serves static files only and has no
  // backend of its own, so it has to call one somewhere else.
  if (host === "nitroatomic.github.io" || /\.github\.io$/.test(host)) {
    if (SE_AWARE_API) {
      window.SE_API_BASE = SE_AWARE_API;
      window.SE_API_FLAVOR = "se-aware";
    } else {
      // Not set up yet - stay in demo mode rather than firing requests at a
      // URL that does not exist and filling the console with errors.
      window.SE_API_BASE = "";
      window.SE_API_FLAVOR = "se-aware";
    }
    return;
  }

  // The Node server is serving this page, so it serves the API too.
  window.SE_API_BASE = window.location.origin;
  window.SE_API_FLAVOR = "se-aware";

  /* ----------------------------------------------------------------------
     To point this site at the shared capstone backend instead, replace the
     two lines above with:

         window.SE_API_BASE = GROUP_API;
         window.SE_API_FLAVOR = "group";

     Both lines together, never just one.
     ---------------------------------------------------------------------- */
  void GROUP_API;
})();

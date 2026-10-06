/* ==========================================================================
   backend-config.js: Node.js + MySQL API connection
   --------------------------------------------------------------------------
   This is the ONE place the backend URL is decided. Every page loads this
   file before store.js, so changing it here changes the whole site.

   There are three situations, and the site handles all three on its own:

   1. Opening the .html files straight off your computer (file://)
      -> no backend. The site runs in offline demo mode, exactly as it did
         before any of this backend work existed. Nothing to configure.

   2. Running the Node server locally (http://localhost:3000)
      -> the Node server serves BOTH the pages and the API, so the API is
         simply the same origin the page came from.

   3. Published on GitHub Pages (https://nitroatomic.github.io/SE-AWARE/)
      -> GitHub Pages can only serve static files. It has no backend of its
         own and never will. So the pages have to call the API that is
         already running on Render.

   IMPORTANT for case 3: the Render backend keeps a strict CORS allowlist.
   "https://nitroatomic.github.io" must be in the CORS_ORIGINS environment
   variable on Render, or the browser blocks every request before it even
   leaves the page. Setting the URL here is only half the job.
   ========================================================================== */
(function () {
  // The live API on Render. Change this one string if the service is renamed.
  var RENDER_API = "https://se-aware-group.onrender.com";

  // Anything already set by hand (a <script> earlier in the page, or a
  // developer testing in the console) always wins. We never overwrite it.
  if (typeof window.SE_API_BASE === "string" && window.SE_API_BASE !== "") {
    return;
  }

  var protocol = window.location.protocol;
  var host = window.location.hostname;

  // Case 1: opened as a local file. No server exists, so no API.
  if (protocol === "file:") {
    window.SE_API_BASE = "";
    return;
  }

  // Case 3: published on GitHub Pages. Borrow the Render API.
  if (host === "nitroatomic.github.io" || /\.github\.io$/.test(host)) {
    window.SE_API_BASE = RENDER_API;
    return;
  }

  // Case 2: the Node server is serving this page, so it also serves the API.
  window.SE_API_BASE = window.location.origin;
})();

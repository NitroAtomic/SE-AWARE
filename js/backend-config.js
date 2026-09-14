/* ==========================================================================
   backend-config.js: Node.js + MySQL API connection
   --------------------------------------------------------------------------
   The Node server serves the frontend and API together, so HTTP deployments
   use the current origin automatically. Opening the files directly keeps the
   offline demonstration mode. Set window.SE_API_BASE before this script only
   when the API intentionally lives on another origin.
   ========================================================================== */
window.SE_API_BASE = window.SE_API_BASE || (window.location.protocol === "file:" ? "" : window.location.origin);

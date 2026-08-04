/* ==========================================================================
   chatbot.js: floating AI educational assistant (FR-06)
   Web-Based Social Engineering Awareness Platform for Remote Workers
   Group 4 · S3102 · MO-IT200D1 Capstone 1
   --------------------------------------------------------------------------
   ARCHITECTURE
     Browser  ->  n8n webhook  ->  Google Gemini API  ->  n8n  ->  Browser

     The browser NEVER talks to Google directly. The Gemini API key lives
     inside the n8n workflow on the server side. Putting an API key in
     client-side JavaScript would expose it to anyone who opens DevTools.

   REQUEST  (POST, JSON):  { "message": "user question" }
   RESPONSE (JSON):        { "reply":   "assistant answer" }

   FALLBACK
     While N8N_WEBHOOK_URL is still the placeholder below, the widget answers
     from a local curated knowledge base so the interface is fully
     demonstrable offline. Swap in the real webhook URL to go live.
   ========================================================================== */

(function () {
  "use strict";

  /* ======================================================================
     CONFIGURATION: the only line the team needs to change to go live
     ====================================================================== */
  var N8N_WEBHOOK_URL = "REPLACE_WITH_YOUR_N8N_PRODUCTION_WEBHOOK_URL";

  /** Milliseconds before an unanswered request is treated as a timeout. */
  var REQUEST_TIMEOUT_MS = 20000;

  /* ======================================================================
     LOCAL FALLBACK KNOWLEDGE BASE
     Mirrors the six learning modules so offline answers stay consistent
     with the site's written content.
     ====================================================================== */
  var KB = [
    {
      keys: ["phishing email", "phishing", "fake login", "quishing", "qr code", "qr",
        "is this email", "is this a scam", "email a scam", "scam email",
        "suspicious email", "is this legit", "is this real", "is this genuine"],
      reply:
        "<p><strong>Phishing</strong> is a fake message that pretends to come from a company you trust so you hand over a password, an OTP, or money.</p>" +
        "<p>Check these before you act:</p>" +
        "<ul><li>The real sender address behind the display name</li>" +
        "<li>Where a link actually points (hover on desktop, long-press on mobile)</li>" +
        "<li>Manufactured urgency: “your account closes in 24 hours”</li>" +
        "<li>A login page asking for your password after you clicked a link in a message</li></ul>" +
        "<p>QR phishing works the same way. The code just hides the address. Read the URL preview before you continue.</p>"
    },
    {
      keys: ["spear phishing", "spear-phishing", "targeted", "linkedin", "recruiter", "fake job", "job offer"],
      reply:
        "<p><strong>Spear phishing</strong> is phishing written specifically for you, using details scraped from LinkedIn, your portfolio, or your public posts.</p>" +
        "<p>Common versions aimed at remote workers: a fake recruiter with a great offer, a fake client sending a project brief, or a message that appears to come from your supervisor.</p>" +
        "<p>Because the details are accurate, accuracy is not proof. Verify the person through a channel you already had before the message arrived.</p>"
    },
    {
      keys: ["smishing", "sms", "text message", "text scam", "package", "delivery", "raffle", "prize"],
      reply:
        "<p><strong>Smishing</strong> is phishing over SMS. In the group's own survey of 54 remote workers, <strong>92.6%</strong> had received a prize or raffle scam text.</p>" +
        "<p>The three most common lures are a package that supposedly needs a small fee, a prize you never entered for, and a bank alert about a transaction you did not make.</p>" +
        "<p>Do not tap the link. Open the courier or bank app you already have installed and check there instead.</p>"
    },
    {
      keys: ["vishing", "phone call", "voice call", "caller", "called me", "it support", "deepfake voice"],
      reply:
        "<p><strong>Vishing</strong> is a scam phone call. The caller creates pressure so you act before you think, usually to read out an OTP or install remote-access software.</p>" +
        "<p>The rule that defeats almost all of it: <strong>no legitimate bank, courier, employer, or IT desk will ever ask you to read an OTP aloud.</strong></p>" +
        "<p>Hang up and call the number printed on your card or on the company's official site. Never use a number the caller gives you.</p>"
    },
    {
      keys: ["pretexting", "pretext", "invoice", "vendor", "supplier", "bank details", "impersonat", "boss", "supervisor"],
      reply:
        "<p><strong>Pretexting</strong> is a believable cover story built over several messages before any request is made.</p>" +
        "<p>For remote workers the costly version is invoice fraud: a supplier or contractor you already work with emails to say their bank details changed.</p>" +
        "<p>Treat any change of payment details as a stop signal. Call the contact on the number you already had, never the one in the new email, and confirm out loud.</p>"
    },
    {
      keys: ["otp", "one time", "one-time", "code", "verification code", "authentication code"],
      reply:
        "<p>An <strong>OTP is a password</strong>. It just expires faster.</p>" +
        "<p>No bank, courier, employer, platform, or IT department will ever ask you to read one out, type it into a chat, or forward it. Every single request to share an OTP is an attack.</p>" +
        "<p>If you already shared one, change that account's password now and check the account's active sessions and recent activity.</p>"
    },
    {
      keys: ["mfa", "2fa", "multi-factor", "two factor", "two-factor", "authenticator"],
      reply:
        "<p><strong>Multi-factor authentication</strong> means a stolen password alone is not enough to get in. Turn it on for your email first. Whoever controls your email can reset everything else.</p>" +
        "<p>Strength order, weakest to strongest: SMS codes, then an authenticator app such as Google Authenticator or Authy, then a hardware security key.</p>" +
        "<p>Save your backup codes somewhere offline before you finish setup.</p>"
    },
    {
      keys: ["password", "passphrase", "password manager", "reuse"],
      reply:
        "<p>Length beats complexity. A passphrase of four unrelated words is stronger and easier to remember than <em>P@ssw0rd1</em>.</p>" +
        "<p>The habit that matters most is <strong>never reusing a password</strong>, because one breached site otherwise unlocks all the others. A password manager such as Bitwarden or 1Password makes that practical.</p>" +
        "<p>Protect your email account first. It is the master key to every reset link you own.</p>"
    },
    {
      keys: ["report", "reporting", "who do i tell", "victim", "clicked", "i clicked",
        "fell for", "hacked", "compromised", "support", "can help", "get help",
        "need help", "who can", "hotline", "authorities", "complaint",
        "cybercrime", "pnp", "nbi", "privacy commission", "file a case", "scammed"],
      reply:
        "<p>If you think you have already been caught, act in this order:</p>" +
        "<ul><li>Disconnect the device from the internet if you installed anything</li>" +
        "<li>Change the password on the affected account from a <em>different</em> device, and revoke active sessions</li>" +
        "<li>Turn on multi-factor authentication if it was not already on</li>" +
        "<li>Tell your client or employer immediately, early beats tidy</li>" +
        "<li>If money moved, call your bank right away and ask about recall</li></ul>" +
        "<p>In the Philippines you can report to the <strong>PNP Anti-Cybercrime Group</strong> or the <strong>NBI Cybercrime Division</strong>. If personal data was exposed, the <strong>National Privacy Commission</strong> handles that. All three are linked at the bottom of every page on this site. Keep screenshots and the full message headers.</p>"
    },
    {
      keys: ["safe practice", "safe remote", "best practice", "good practice", "practices",
        "stay safe", "tips", "remote work", "work from home", "wifi", "wi-fi",
        "home network", "protect myself", "protect my", "security habit"],
      reply:
        "<p>The highest-value habits for remote workers:</p>" +
        "<ul><li>Multi-factor authentication on email first, then everything else</li>" +
        "<li>A password manager, with no password reused anywhere</li>" +
        "<li>Verify any money or credential request through a second channel</li>" +
        "<li>Change your router's default admin password and keep WPA2 or WPA3 on</li>" +
        "<li>Keep client data off personal devices and shared family computers</li>" +
        "<li>Install operating system and browser updates the week they ship</li></ul>" +
        "<p>The Safe Practices module walks through each of these in detail.</p>"
    },
    {
      keys: ["what is social engineering", "social engineering", "what can you do", "help", "start", "hello", "hi "],
      reply:
        "<p><strong>Social engineering</strong> is an attack on people rather than on software. Instead of breaking encryption, the attacker persuades you to open the door, using urgency, authority, fear, or curiosity.</p>" +
        "<p>This platform covers five kinds: phishing, spear phishing, smishing, vishing, and pretexting, plus a Safe Practices module.</p>" +
        "<p>Ask me about any of them, or describe a message you received and I will tell you what to look for.</p>"
    }
  ];

  var OUT_OF_SCOPE =
    "<p>I can only help with social engineering awareness for remote workers: phishing, spear phishing, smishing, vishing, pretexting, and safe remote-work practices.</p>" +
    "<p>Try asking something like <em>“How do I know if an email is phishing?”</em> or <em>“Someone called asking for my OTP, what do I do?”</em></p>";

  /* The opening message doubles as the scope statement. Showing the six
     topics up front sets the boundary before anyone hits the refusal, which
     is friendlier than letting them discover it by being turned away. */
  var TOPICS = [
    { icon: "bi-envelope-fill", name: "Phishing", note: "email, fake logins, QR" },
    { icon: "bi-telephone-fill", name: "Vishing", note: "" },
    { icon: "bi-bullseye", name: "Spear phishing", note: "" },
    { icon: "bi-incognito", name: "Pretexting", note: "" },
    { icon: "bi-chat-dots-fill", name: "Smishing", note: "" },
    { icon: "bi-laptop", name: "Safe practices", note: "for remote workers" }
  ];

  var GREETING =
    "<p class=\"se-greet-title\">Hi, I'm CyberWise.</p>" +
    "<p>I can help you understand and avoid social engineering attacks. Here are the topics I cover:</p>" +
    "<ul class=\"se-topic-grid\">" +
    TOPICS.map(function (t) {
      return "<li><span class=\"se-topic-icon\"><i class=\"bi " + t.icon + "\" aria-hidden=\"true\"></i></span>" +
        "<span><strong>" + t.name + "</strong>" +
        (t.note ? "<small>" + t.note + "</small>" : "") + "</span></li>";
    }).join("") +
    "</ul>" +
    "<p class=\"mb-0\">What would you like to learn today?</p>";

  var SUGGESTIONS = [
    { icon: "bi-envelope-fill", text: "How do I know if an email is phishing?" },
    { icon: "bi-telephone-fill", text: "Someone called asking for my OTP. What should I do?" },
    { icon: "bi-chat-dots-fill", text: "How can I identify SMS scams?" },
    { icon: "bi-bullseye", text: "What is spear phishing?" },
    { icon: "bi-incognito", text: "What is pretexting?" },
    { icon: "bi-laptop", text: "How do I stay safe while working remotely?" }
  ];



  /* ======================================================================
     TYPO TOLERANCE

     People misspell these words constantly, and "pishing" for "phishing" is
     the most common one of all. Matching on exact strings meant a clearly
     in-scope question was treated as off-topic.

     Each word is compared against a small vocabulary using edit distance.
     Only words of five characters or more are considered, which keeps short
     words like "poem" or "otp" from being corrected into something else.
     ====================================================================== */

  var VOCAB = [
    "phishing", "smishing", "vishing", "pretexting", "quishing", "spear",
    "password", "passwords", "credential", "credentials", "authenticator",
    "email", "emails", "message", "messages", "sender", "domain", "link",
    "attachment", "recruiter", "invoice", "payment", "account", "accounts",
    "verify", "verification", "report", "suspicious", "scammer", "attacker",
    "router", "backup", "device", "security", "awareness", "engineering"
  ];

  function editDistance(a, b) {
    var m = a.length, n = b.length;
    if (Math.abs(m - n) > 2) return 99;
    var prev = [], cur = [], i, j;
    for (j = 0; j <= n; j++) prev[j] = j;
    for (i = 1; i <= m; i++) {
      cur[0] = i;
      for (j = 1; j <= n; j++) {
        cur[j] = Math.min(
          prev[j] + 1,
          cur[j - 1] + 1,
          prev[j - 1] + (a.charAt(i - 1) === b.charAt(j - 1) ? 0 : 1)
        );
      }
      for (j = 0; j <= n; j++) prev[j] = cur[j];
    }
    return prev[n];
  }

  /** Map obvious misspellings onto the canonical term before matching. */
  function normalise(text) {
    return String(text).toLowerCase().split(/\s+/).map(function (raw) {
      var word = raw.replace(/[^a-z0-9-]/g, "");
      if (word.length < 4) return word;
      if (VOCAB.indexOf(word) !== -1) return word;
      for (var i = 0; i < VOCAB.length; i++) {
        var v = VOCAB[i];
        if (v.length < 5) continue;
        var tol = v.length >= 8 ? 2 : 1;
        if (editDistance(word, v) <= tol) return v;
      }
      return word;
    }).join(" ");
  }

  /* Return the forms of the question that term matching should be tried
     against. Two are needed because people hyphenate inconsistently:
     "remote-work" has to match the term "remote work", while "e-mail" and
     "two-factor" have to keep their hyphens. Checking both forms covers
     each case without a list of exceptions. */
  function haystacks(question) {
    var q = " " + normalise(question).trim() + " ";
    var flat = q.replace(/-/g, " ").replace(/\s+/g, " ");
    return flat === q ? [q] : [q, flat];
  }

  function containsTerm(forms, term) {
    for (var i = 0; i < forms.length; i++) {
      if (forms[i].indexOf(term) !== -1) return true;
    }
    return false;
  }

  /* Shown when the question is clearly on topic but no entry matched.
     This is NOT the refusal: those are different situations and must not
     look the same to the visitor. */
  var NO_MATCH =
    "<p>That is something I can help with, I am just not certain which part you mean. " +
    "Which of these is closest?</p>" +
    "<ul><li>Phishing, including fake login pages and QR codes</li>" +
    "<li>Spear phishing, meaning targeted messages written for you</li>" +
    "<li>Smishing, by text message</li>" +
    "<li>Vishing, by phone call</li>" +
    "<li>Pretexting, including invoice fraud</li>" +
    "<li>Safe practices for remote work</li></ul>" +
    "<p>Or just describe the message you received and I will tell you what it looks like.</p>";

  /* ======================================================================
     SCOPE GUARD

     The assistant answers on six topics only: phishing, spear phishing,
     smishing, vishing, pretexting, and safe practices for remote workers.

     This is enforced in two places, deliberately:

       1. Here in the browser, so an obviously off-topic question never
          reaches the API at all. That protects the Gemini quota and makes
          the refusal instant.
       2. Again in the n8n system prompt, so the model itself refuses even
          if a question slips past the keyword check. See N8N-CHATBOT-SETUP.md.

     Never rely on the client alone. Anyone can edit client-side JavaScript,
     which is exactly the lesson the Phishing module teaches.
     ====================================================================== */

  var IN_SCOPE_TERMS = [
    // attack types and their variants
    "phish", "spear", "smish", "vish", "pretext", "quish", "social engineer",
    "scam", "fraud", "fake", "spoof", "impersonat", "lookalike", "clone",
    // channels and artefacts
    "email", "e-mail", "inbox", "sms", "text message", "link", "url", "domain",
    "attachment", "qr", "caller", "phone call", "voice", "voicemail", "dm",
    "message", "sender", "subject line", "invoice", "payment", "bank details",
    "remittance", "recruiter", "job offer", "client", "vendor", "supplier",
    // credentials and account security
    "password", "passphrase", "otp", "one-time", "one time", "code", "pin",
    "mfa", "2fa", "two-factor", "two factor", "multi-factor", "authenticator",
    "credential", "login", "log in", "sign in", "account", "session",
    "password manager", "breach", "leaked", "compromis", "hacked", "takeover",
    // practices and response
    "safe practice", "verify", "verification", "report", "incident", "backup",
    "vpn", "wifi", "wi-fi", "router", "network", "device", "update", "patch",
    "remote work", "work from home", "freelanc", "virtual assistant",
    "antivirus", "encrypt", "privacy", "data", "security", "cyber", "awareness",
    "suspicious", "red flag", "warning sign", "what should i do", "is this safe",
    "is it safe", "was i", "am i", "clicked", "tapped", "scanned", "replied",
    "practice", "habit", "hygiene", "protect", "prevent", "avoid",
    // asking for help in plain language, which must never be refused
    "help", "support", "assist", "guidance", "advice", "advise",
    "who can", "who do i", "where do i", "what do i do", "contact", "hotline",
    "authorit", "police", "pnp", "nbi", "cybercrime", "complaint", "legal",
    "privacy commission", "victim", "scammed", "tricked", "fell for",
    // platform navigation
    "module", "quiz", "assessment", "dashboard", "course", "lesson", "platform"
  ];

  /* Questions that are clearly outside the course, refused without an API call. */
  var OFF_TOPIC = [
    /\b(write|compose|make)\b.*\b(poem|song|lyric|story|essay|joke|rap)\b/i,
    /\brecipe\b|\bcook\b|\bbake\b/i,
    /\b(translate|translation)\b/i,
    /\bweather\b|\bforecast\b/i,
    /\bhomework\b|\bassignment\b(?!.*(phish|security|cyber))/i,
    /\b(who|what) (is|was|are|were)\b.*\b(president|capital|actor|singer|movie|team)\b/i,
    /\bmath\b|\bsolve\b|\bequation\b|\bcalculate\b(?!.*risk)/i,
    /\d\s*[+\-*\/^=]\s*\d/,
    /\bwrite\b.*\b(code|program|script|function)\b(?!.*phish)/i,
    /\bmedical\b|\bdiagnos|\bsymptom|\bmedicine\b/i,
    /\bstock\b|\binvest\b|\bcrypto\b(?!.*(scam|fraud|payment))/i
  ];

  /* Set once the visitor has asked something in scope, so short follow-ups
     such as "what do I do next?" are not refused for lacking a keyword. */
  var hasInScopeContext = false;

  function isInScope(question) {
    var forms = haystacks(question);
    var q = forms[0];

    for (var i = 0; i < OFF_TOPIC.length; i++) {
      if (OFF_TOPIC[i].test(q)) return false;
    }
    for (var t = 0; t < IN_SCOPE_TERMS.length; t++) {
      if (containsTerm(forms, IN_SCOPE_TERMS[t])) return true;
    }
    // A short follow-up inside an existing on-topic conversation is allowed,
    // but it has to read like a follow-up. Being brief is not enough, or
    // anything short would slip through once one real question had been asked.
    var FOLLOW_UP = /^(and |but |so |then |ok|okay|thanks|what|why|how|who|which|should|can |could |is (that|it|this)|does (that|it|this)|are (they|these)|tell me more|go on|explain|more)/i;
    if (hasInScopeContext && q.trim().split(/\s+/).length <= 8 && FOLLOW_UP.test(q.trim())) return true;

    return false;
  }

  /* ======================================================================
     STATE: held in memory for this page view only.
     Nothing is written to localStorage, cookies, or any analytics service.
     ====================================================================== */
  var isOpen = false;
  var isBusy = false;
  var els = {};

  /* ======================================================================
     MARKUP
     ====================================================================== */

  /* The assistant wears the site's own shield rather than a stock chat icon.
     Every page carries data-root on <body> ("" at the root, "../" inside
     /modules/), so one expression gives a correct path from any depth. */
  function logoSrc() {
    var root = document.body ? document.body.getAttribute("data-root") : "";
    return (root || "") + "assets/img/logo-mark.png";
  }

  function buildWidget() {
    var LOGO_SRC = logoSrc();
    var wrap = document.createElement("div");
    wrap.className = "se-chat-widget";
    wrap.innerHTML = [
      '<button type="button" class="se-chat-fab" id="seChatFab"',
      '        aria-label="Open CyberWise, the social engineering awareness assistant"',
      '        aria-expanded="false" aria-controls="seChatPanel">',
      '  <img class="se-chat-fab-logo" src="' + LOGO_SRC + '" alt="" width="38" height="38">',
      '  <i class="bi bi-x-lg" aria-hidden="true"></i>',
      "</button>",
      '<section class="se-chat-panel" id="seChatPanel" role="dialog"',
      '         aria-label="CyberWise, social engineering awareness assistant" aria-modal="false">',
      '  <header class="se-chat-head">',
      '    <span class="se-chat-avatar"><img src="' + LOGO_SRC + '" alt="" width="28" height="28"></span>',
      "    <div>",
      '      <div class="se-chat-title">Cyber<span>Wise</span></div>',
      '      <div class="se-chat-sub">Your social engineering awareness assistant</div>',
      "    </div>",
      '    <button type="button" class="se-chat-close" id="seChatClose" aria-label="Close CyberWise">',
      '      <i class="bi bi-x-lg" aria-hidden="true"></i>',
      "    </button>",
      "  </header>",
      '  <div class="se-chat-log" id="seChatLog" role="log" aria-live="polite" aria-atomic="false"></div>',
      '  <form class="se-chat-form" id="seChatForm" autocomplete="off">',
      '    <label class="visually-hidden" for="seChatInput">Type your question</label>',
      '    <input type="text" class="se-chat-input" id="seChatInput"',
      '           placeholder="Ask about phishing, smishing, vishing, or remote work safety..." maxlength="500">',
      '    <button type="submit" class="se-chat-send" id="seChatSend" aria-label="Send message">',
      '      <i class="bi bi-send-fill" aria-hidden="true"></i>',
      "    </button>",
      "  </form>",
      '  <p class="se-chat-disclaimer"><i class="bi bi-shield-check" aria-hidden="true"></i> Educational guidance only. CyberWise provides awareness training and does not replace professional incident response.</p>',
      "</section>"
    ].join("\n");

    document.body.appendChild(wrap);

    els.fab = document.getElementById("seChatFab");
    els.panel = document.getElementById("seChatPanel");
    els.close = document.getElementById("seChatClose");
    els.log = document.getElementById("seChatLog");
    els.form = document.getElementById("seChatForm");
    els.input = document.getElementById("seChatInput");
    els.send = document.getElementById("seChatSend");
  }

  /* ======================================================================
     RENDERING
     ====================================================================== */
  /* A bot reply is wrapped in a row so the shield sits beside the bubble.
     Visitor and error messages keep the plain single-element shape. */
  function addMessage(html, who) {
    var div = document.createElement("div");
    div.className = "se-msg " + who;
    div.innerHTML = html;

    if (who === "bot") {
      els.log.appendChild(withAvatar(div));
    } else {
      els.log.appendChild(div);
    }
    scrollToBottom();
    return div;
  }

  function withAvatar(bubble) {
    var row = document.createElement("div");
    row.className = "se-msg-row";
    var img = document.createElement("img");
    img.className = "se-msg-avatar";
    img.src = logoSrc();
    img.alt = "";
    img.width = 26;
    img.height = 26;
    row.appendChild(img);
    row.appendChild(bubble);
    return row;
  }

  /* One timestamp under the opening message, matching the agreed design.
     Later replies are not stamped: in a session this short it would be the
     same minute repeated down the whole transcript. */
  function addTimestamp() {
    var p = document.createElement("p");
    p.className = "se-chat-time";
    p.textContent = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    els.log.appendChild(p);
  }

  function addSuggestions() {
    var box = document.createElement("div");
    box.className = "se-suggestions";
    SUGGESTIONS.forEach(function (item) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "se-suggestion";
      b.innerHTML =
        '<span class="se-topic-icon"><i class="bi ' + item.icon + '" aria-hidden="true"></i></span>' +
        "<span>" + window.SEUtil.escapeHtml(item.text) + "</span>";
      b.addEventListener("click", function () {
        box.remove();
        submitMessage(item.text);
      });
      box.appendChild(b);
    });
    els.log.appendChild(box);
    scrollToBottom();
  }

  function showTyping() {
    var div = document.createElement("div");
    div.className = "se-msg bot";
    div.setAttribute("aria-label", "CyberWise is typing");
    div.innerHTML = '<div class="se-typing"><span></span><span></span><span></span></div>';
    var row = withAvatar(div);
    row.id = "seTyping";
    els.log.appendChild(row);
    scrollToBottom();
  }

  function hideTyping() {
    var t = document.getElementById("seTyping");
    if (t) t.remove();
  }

  function scrollToBottom() {
    els.log.scrollTop = els.log.scrollHeight;
  }

  /* ======================================================================
     LOCAL FALLBACK MATCHING
     ====================================================================== */
  function localAnswer(question) {
    var forms = haystacks(question);
    var best = null;
    var bestScore = 0;

    for (var i = 0; i < KB.length; i++) {
      for (var k = 0; k < KB[i].keys.length; k++) {
        var key = KB[i].keys[k];
        if (containsTerm(forms, key) && key.length > bestScore) {
          bestScore = key.length;
          best = KB[i];
        }
      }
    }
    return best ? best.reply : NO_MATCH;
  }

  /* ======================================================================
     NETWORK
     ====================================================================== */
  function isConfigured() {
    return (
      N8N_WEBHOOK_URL &&
      N8N_WEBHOOK_URL.indexOf("REPLACE_WITH") === -1 &&
      /^https?:\/\//i.test(N8N_WEBHOOK_URL)
    );
  }

  function askWebhook(question) {
    var controller = new AbortController();
    var timer = setTimeout(function () {
      controller.abort();
    }, REQUEST_TIMEOUT_MS);

    return fetch(N8N_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: question }),
      signal: controller.signal
    })
      .then(function (res) {
        clearTimeout(timer);
        if (!res.ok) throw new Error("Webhook responded with status " + res.status);
        return res.json();
      })
      .then(function (data) {
        var reply = data && (data.reply || data.output || data.text);
        if (!reply) throw new Error("Webhook returned an empty reply");
        // n8n returns plain text; wrap it so paragraphs render correctly.
        return "<p>" + window.SEUtil.escapeHtml(reply).replace(/\n{2,}/g, "</p><p>").replace(/\n/g, "<br>") + "</p>";
      })
      .catch(function (err) {
        clearTimeout(timer);
        throw err;
      });
  }

  /* ======================================================================
     SUBMIT FLOW
     ====================================================================== */
  function submitMessage(text) {
    var question = String(text || "").trim();
    if (!question || isBusy) return;

    isBusy = true;
    els.send.disabled = true;
    addMessage("<p>" + window.SEUtil.escapeHtml(question) + "</p>", "user");
    els.input.value = "";

    // Scope check first: an off-topic question is refused here and never
    // reaches the API.
    if (!isInScope(question)) {
      addMessage(OUT_OF_SCOPE, "bot");
      finish();
      return;
    }
    hasInScopeContext = true;

    showTyping();

    if (!isConfigured()) {
      // Offline demonstration mode: short delay so the typing state is visible.
      setTimeout(function () {
        hideTyping();
        addMessage(localAnswer(question), "bot");
        finish();
      }, 650);
      return;
    }

    askWebhook(question)
      .then(function (html) {
        hideTyping();
        addMessage(html, "bot");
        finish();
      })
      .catch(function (err) {
        // Never fail silently (non-functional requirement: responsive AI chatbot).
        hideTyping();
        addMessage(
          "<p><strong>I could not reach the assistant just now.</strong></p>" +
            "<p>Please check your connection and try again. In the meantime, here is what I can tell you offline:</p>",
          "err"
        );
        addMessage(localAnswer(question), "bot");
        if (window.console && console.warn) console.warn("[chatbot] " + err.message);
        finish();
      });
  }

  function finish() {
    isBusy = false;
    els.send.disabled = false;
    els.input.focus();
  }

  /* ======================================================================
     OPEN / CLOSE
     ====================================================================== */
  function openPanel() {
    isOpen = true;
    els.panel.classList.add("is-open");
    els.fab.classList.add("is-open");
    els.fab.setAttribute("aria-expanded", "true");
    els.fab.setAttribute("aria-label", "Close CyberWise, the social engineering awareness assistant");

    if (!els.log.children.length) {
      addMessage(GREETING, "bot");
      addTimestamp();
      addSuggestions();
      /* The opening block is taller than the panel. Every later message wants
         the newest text in view, but on first open the visitor has read
         nothing yet, so start them at the top of the greeting. */
      els.log.scrollTop = 0;
    }
    setTimeout(function () { els.input.focus(); }, 120);
  }

  function closePanel() {
    isOpen = false;
    els.panel.classList.remove("is-open");
    els.fab.classList.remove("is-open");
    els.fab.setAttribute("aria-expanded", "false");
    els.fab.setAttribute("aria-label", "Open CyberWise, the social engineering awareness assistant");
    els.fab.focus();
  }

  function togglePanel() {
    if (isOpen) closePanel(); else openPanel();
  }

  /* ======================================================================
     INIT
     ====================================================================== */
  function init() {
    buildWidget();

    els.fab.addEventListener("click", togglePanel);
    els.close.addEventListener("click", closePanel);

    els.form.addEventListener("submit", function (e) {
      e.preventDefault();
      submitMessage(els.input.value);
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && isOpen) closePanel();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

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
      keys: ["phishing email", "phishing", "fake login", "quishing", "qr code", "qr"],
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
      keys: ["report", "reporting", "who do i tell", "victim", "clicked", "i clicked", "fell for", "hacked", "compromised"],
      reply:
        "<p>If you think you have already been caught, act in this order:</p>" +
        "<ul><li>Disconnect the device from the internet if you installed anything</li>" +
        "<li>Change the password on the affected account from a <em>different</em> device, and revoke active sessions</li>" +
        "<li>Turn on multi-factor authentication if it was not already on</li>" +
        "<li>Tell your client or employer immediately, early beats tidy</li>" +
        "<li>If money moved, call your bank right away and ask about recall</li></ul>" +
        "<p>In the Philippines you can report to the PNP Anti-Cybercrime Group or the NBI Cybercrime Division. Keep screenshots and the full message headers.</p>"
    },
    {
      keys: ["safe practice", "stay safe", "tips", "remote work", "work from home", "wifi", "wi-fi", "home network"],
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

  var GREETING =
    "<p>Hi. I'm the platform's learning assistant. I can explain how social engineering attacks work and what to do when you receive one.</p>" +
    "<p>What would you like to know?</p>";

  var SUGGESTIONS = [
    "How do I know if an email is phishing?",
    "Someone called asking for my OTP. What do I do?",
    "What should I do to stay safe while working remotely?"
  ];

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
  function buildWidget() {
    var wrap = document.createElement("div");
    wrap.className = "se-chat-widget";
    wrap.innerHTML = [
      '<button type="button" class="se-chat-fab" id="seChatFab"',
      '        aria-label="Open the cybersecurity learning assistant"',
      '        aria-expanded="false" aria-controls="seChatPanel">',
      '  <i class="bi bi-chat-dots-fill" aria-hidden="true"></i>',
      '  <i class="bi bi-x-lg" aria-hidden="true"></i>',
      "</button>",
      '<section class="se-chat-panel" id="seChatPanel" role="dialog"',
      '         aria-label="Cybersecurity learning assistant" aria-modal="false">',
      '  <header class="se-chat-head">',
      '    <i class="bi bi-shield-lock-fill" aria-hidden="true"></i>',
      "    <div>",
      '      <div class="se-chat-title">Learning Assistant</div>',
      '      <div class="se-chat-sub">Social engineering awareness</div>',
      "    </div>",
      '    <button type="button" class="se-chat-close" id="seChatClose" aria-label="Close the assistant">',
      '      <i class="bi bi-x-lg" aria-hidden="true"></i>',
      "    </button>",
      "  </header>",
      '  <div class="se-chat-log" id="seChatLog" role="log" aria-live="polite" aria-atomic="false"></div>',
      '  <form class="se-chat-form" id="seChatForm" autocomplete="off">',
      '    <label class="visually-hidden" for="seChatInput">Type your question</label>',
      '    <input type="text" class="se-chat-input" id="seChatInput"',
      '           placeholder="Ask about phishing, vishing, OTPs..." maxlength="500">',
      '    <button type="submit" class="se-chat-send" id="seChatSend" aria-label="Send message">',
      '      <i class="bi bi-send-fill" aria-hidden="true"></i>',
      "    </button>",
      "  </form>",
      '  <p class="se-chat-disclaimer">Educational guidance only. Not a substitute for professional incident response.</p>',
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
  function addMessage(html, who) {
    var div = document.createElement("div");
    div.className = "se-msg " + who;
    div.innerHTML = html;
    els.log.appendChild(div);
    scrollToBottom();
    return div;
  }

  function addSuggestions() {
    var box = document.createElement("div");
    box.className = "se-suggestions";
    SUGGESTIONS.forEach(function (text) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "se-suggestion";
      b.textContent = text;
      b.addEventListener("click", function () {
        box.remove();
        submitMessage(text);
      });
      box.appendChild(b);
    });
    els.log.appendChild(box);
    scrollToBottom();
  }

  function showTyping() {
    var div = document.createElement("div");
    div.className = "se-msg bot";
    div.id = "seTyping";
    div.setAttribute("aria-label", "Assistant is typing");
    div.innerHTML = '<div class="se-typing"><span></span><span></span><span></span></div>';
    els.log.appendChild(div);
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
    var q = " " + question.toLowerCase() + " ";
    var best = null;
    var bestScore = 0;

    for (var i = 0; i < KB.length; i++) {
      for (var k = 0; k < KB[i].keys.length; k++) {
        var key = KB[i].keys[k];
        if (q.indexOf(key) !== -1 && key.length > bestScore) {
          bestScore = key.length;
          best = KB[i];
        }
      }
    }
    return best ? best.reply : OUT_OF_SCOPE;
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
    els.fab.setAttribute("aria-label", "Close the cybersecurity learning assistant");

    if (!els.log.children.length) {
      addMessage(GREETING, "bot");
      addSuggestions();
    }
    setTimeout(function () { els.input.focus(); }, 120);
  }

  function closePanel() {
    isOpen = false;
    els.panel.classList.remove("is-open");
    els.fab.classList.remove("is-open");
    els.fab.setAttribute("aria-expanded", "false");
    els.fab.setAttribute("aria-label", "Open the cybersecurity learning assistant");
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

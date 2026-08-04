/* ==========================================================================
   assessment-data.js — cybersecurity awareness assessment question bank
   Web-Based Social Engineering Awareness Platform for Remote Workers
   Group 4 · S3102 · MO-IT200D1 Capstone 1
   --------------------------------------------------------------------------
   Fifteen questions spanning all six topics. Unlike the module quizzes, this
   is a placement instrument: every question is presented, the order is fixed
   so results stay comparable between attempts, and the per-topic breakdown
   drives the weak-area recommendations shown on the dashboard.

   Topic coverage: phishing 3 · spear-phishing 2 · smishing 2 · vishing 3 ·
                   pretexting 2 · safe-practices 3
   ========================================================================== */

window.ASSESSMENT_DATA = {
  levels: [
    { min: 12, key: "advanced",     label: "Advanced",
      blurb: "You recognise the patterns behind most social engineering, including the subtler ones. Focus on staying current — tactics shift faster than fundamentals do." },
    { min: 8,  key: "intermediate", label: "Intermediate",
      blurb: "You have solid instincts and a real gap or two. The modules below target exactly where you lost marks." },
    { min: 0,  key: "beginner",     label: "Beginner",
      blurb: "There is real ground to cover, and that is worth knowing rather than guessing at. Work through the recommended modules in order — most people move a full level after one pass." }
  ],

  topics: {
    "phishing":       "Phishing",
    "spear-phishing": "Spear Phishing",
    "smishing":       "Smishing",
    "vishing":        "Vishing",
    "pretexting":     "Pretexting",
    "safe-practices": "Safe Practices"
  },

  questions: [
    {
      topic: "phishing",
      q: "A link's status bar shows bpi.com.ph.account-verify.net/login. Which domain does it actually belong to?",
      options: [
        "account-verify.net",
        "bpi.com.ph",
        "login.bpi.com.ph",
        "It belongs equally to both domains"
      ],
      answer: 0,
      why: "The real domain sits immediately left of the first single slash — account-verify.net. Everything before it is a subdomain the attacker can name anything at all."
    },
    {
      topic: "phishing",
      q: "An email uses your bank's exact logo, fonts, and footer. What does that prove about its origin?",
      options: [
        "Nothing — those assets are downloadable from the bank's public site",
        "That it passed the bank's outgoing security checks",
        "That the sender has access to the bank's systems",
        "That it is at least partly genuine"
      ],
      answer: 0,
      why: "Branding accuracy measures the attacker's effort, not the message's origin. Judge the sender domain and the request instead."
    },
    {
      topic: "phishing",
      q: "You entered your password on a fake login page, then a six-digit code on the next screen. What should you assume?",
      options: [
        "The attacker used the code within seconds and is signed in as you",
        "Nothing happened, because one-time codes expire quickly",
        "Nothing happened, because the code only works on the real site",
        "The code was stored for later sale but is not yet usable"
      ],
      answer: 0,
      why: "Modern phishing kits relay codes in real time while they are still valid. Change the password, revoke sessions, and check for new forwarding rules or recovery addresses."
    },
    {
      topic: "spear-phishing",
      q: "A recruiter names your real client and your real project, then asks you to sign in with Google to take a skills assessment on their portal. What is the giveaway?",
      options: [
        "A skills assessment is requesting your email credentials",
        "The recruiter contacted you without an introduction",
        "The pay offered is above your usual rate",
        "The message arrived through a professional network"
      ],
      answer: 0,
      why: "All the accurate detail came from your public profile. No legitimate recruitment step ever needs your email password."
    },
    {
      topic: "spear-phishing",
      q: "A message contains genuinely accurate details about your work and your clients. What does that establish?",
      options: [
        "Nothing about identity — those details are usually public",
        "That the sender has worked with you before",
        "That the sender is inside your client's organisation",
        "That the message originated from a trusted network"
      ],
      answer: 0,
      why: "Detail is not identity. In spear phishing the accuracy is the weapon, which is why verification has to happen through a channel that predates the message."
    },
    {
      topic: "smishing",
      q: "A text says your parcel is held and asks for a ₱48 redelivery fee. Why is the amount so small?",
      options: [
        "It is low enough to avoid scrutiny, and the card details are the real prize",
        "Small transactions cannot be reversed",
        "It is the legal maximum for an SMS charge",
        "It covers the cost of sending the message"
      ],
      answer: 0,
      why: "The fee is a pretext. The card number, expiry, and CVV you enter to pay it are what the attacker actually wants."
    },
    {
      topic: "smishing",
      q: "A scam text appears in the same thread as genuine messages from your bank. What does that tell you?",
      options: [
        "Nothing — sender IDs are spoofable and phones thread by ID",
        "That it came from the bank's real messaging system",
        "That your phone verified the sender",
        "That the bank has been breached"
      ],
      answer: 0,
      why: "Because phones group by sender ID, a spoofed message drops neatly into the real conversation. It is one of the most convincing tricks in smishing and requires no access to the bank."
    },
    {
      topic: "vishing",
      q: "A caller from your 'bank's fraud team' asks you to read back the code they just sent you. What is happening?",
      options: [
        "They are signing in as you and need the code to finish",
        "Standard identity verification",
        "Confirmation that a transfer was cancelled",
        "A genuine agent following the wrong procedure"
      ],
      answer: 0,
      why: "The code exists because someone requested it. A bank never needs you to read back a code they generated — they already know it."
    },
    {
      topic: "vishing",
      q: "Your phone displays your bank's real hotline number as the caller ID. What does that prove?",
      options: [
        "Nothing — caller ID is display text and is easily spoofed",
        "That the call came from the bank's phone system",
        "That the carrier verified the origin",
        "That the number was checked against a fraud list"
      ],
      answer: 0,
      why: "Caller ID carries no proof of origin. Hang up and dial back on a number you already had, ideally from a different phone."
    },
    {
      topic: "vishing",
      q: "A voice note that sounds exactly like your client urgently asks you to transfer funds. What is the right response?",
      options: [
        "Verify by calling them on a number you already had",
        "Act on it, since you clearly recognise the voice",
        "Reply to the voice note asking them to confirm",
        "Send a small test amount first"
      ],
      answer: 0,
      why: "AI voice cloning needs only a short sample of public audio, so a familiar voice is no longer evidence of identity. A pre-agreed code word is the cheapest effective defence."
    },
    {
      topic: "pretexting",
      q: "A supplier you have worked with for two years emails to say their bank details have changed. What do you do before paying?",
      options: [
        "Call them on a number you already had and confirm the account aloud",
        "Pay, since the email address matches your existing thread",
        "Reply asking them to confirm the change in writing",
        "Send a small test payment and wait"
      ],
      answer: 0,
      why: "A matching address can mean their mailbox is compromised, in which case the attacker also answers your reply. Any change to where money goes gets confirmed by voice."
    },
    {
      topic: "pretexting",
      q: "Someone new at a client company chats harmlessly for three days, then asks for shared account access. What was the friendly build-up?",
      options: [
        "The pretext — early contact exists to make the later request unremarkable",
        "Evidence of a genuine working relationship",
        "A normal onboarding process",
        "An unrelated coincidence"
      ],
      answer: 0,
      why: "Escalation across messages is the signature of pretexting. The first exchanges have no purpose beyond making the real request feel routine."
    },
    {
      topic: "safe-practices",
      q: "Which account should you enable multi-factor authentication on first?",
      options: [
        "Your email account",
        "Your online banking",
        "Your social media",
        "Your client project tools"
      ],
      answer: 0,
      why: "Email is the master key — every password reset link for every other service lands there. Secure it first, then work outward."
    },
    {
      topic: "safe-practices",
      q: "What is the most damaging password habit?",
      options: [
        "Reusing the same password across multiple sites",
        "Using a password shorter than twelve characters",
        "Writing a password down on paper at home",
        "Not changing passwords every ninety days"
      ],
      answer: 0,
      why: "Reuse turns one breached site into access everywhere, through credential stuffing. Forced rotation, by contrast, is no longer recommended practice."
    },
    {
      topic: "safe-practices",
      q: "You have just realised you granted a scammer remote access to your laptop. What comes first?",
      options: [
        "Disconnect the device from the internet",
        "Run an antivirus scan while staying online",
        "Change all your passwords on that same device",
        "Restart and carry on working"
      ],
      answer: 0,
      why: "Disconnecting cuts their access immediately. Change passwords afterwards from a different device — assume anything typed on the compromised machine was seen."
    }
  ]
};

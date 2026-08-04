/* ==========================================================================
   quiz-data.js: question banks for every module quiz
   Web-Based Social Engineering Awareness Platform for Remote Workers
   Group 4 · S3102 · MO-IT200D1 Capstone 1
   --------------------------------------------------------------------------
   Each module holds a bank of 15 questions. The quiz engine draws 10 at
   random and shuffles the answer options, so no two attempts are identical
   (test cases FT-05 and FT-06).

   Question object:
     type      "scenario" | "knowledge"
     scenario  optional situation text shown above the question (HTML allowed)
     q         the question itself (plain text)
     options   array of 4 answer strings (plain text)
     answer    index of the correct option in the ORIGINAL array
     why       explanation shown after answering (HTML allowed)
   ========================================================================== */

window.QUIZ_DATA = {

  /* ======================================================================
     PHISHING
     ====================================================================== */
  "phishing": {
    title: "Phishing",
    questions: [
      {
        type: "scenario",
        scenario: "You receive an email from <strong>service@paypal-secure-verify.com</strong> saying your account will be limited in 24 hours unless you verify your identity.",
        q: "What is the strongest single reason to treat this as phishing?",
        options: [
          "The domain is paypal-secure-verify.com, not paypal.com",
          "The email arrived outside business hours",
          "It contains a company logo",
          "It was sent to your work address rather than your personal one"
        ],
        answer: 0,
        why: "Read domains from the right. Everything before the final dot is controlled by whoever registered <strong>paypal-secure-verify.com</strong>, a real brand name in the middle of a domain proves nothing at all."
      },
      {
        type: "scenario",
        scenario: "A message appears to come from your bank. You hover over the button and the status bar shows <strong>bpi.com.ph.account-verify.net/login</strong>.",
        q: "Which domain does that link actually belong to?",
        options: [
          "account-verify.net",
          "bpi.com.ph",
          "login.bpi.com.ph",
          "Both bpi.com.ph and account-verify.net equally"
        ],
        answer: 0,
        why: "The real domain is the last two parts before the first single slash: <strong>account-verify.net</strong>. Everything to the left of it is a subdomain the attacker can name anything they like, including a real bank's address."
      },
      {
        type: "scenario",
        scenario: "You clicked a link in a suspicious email, entered your password on the page, and then realised your mistake. You have not entered any code.",
        q: "What should you do first?",
        options: [
          "Change that password from a different device, then revoke all active sessions",
          "Run a full antivirus scan and wait for the results before doing anything else",
          "Reply to the email asking whether it was legitimate",
          "Delete the email so nobody else in your household clicks it"
        ],
        answer: 0,
        why: "Speed is everything. Change the password from a device you trust, then use the account's security settings to sign out all sessions. Otherwise an attacker who is already signed in simply stays signed in."
      },
      {
        type: "scenario",
        scenario: "A printed flyer in a coworking space shows a QR code offering free Wi-Fi. You scan it and your phone previews the address before opening it.",
        q: "What is the right move?",
        options: [
          "Read the previewed address carefully and do not continue if it is unfamiliar",
          "Continue, because a QR code printed on paper cannot be malicious",
          "Continue, but close the page quickly if it looks strange",
          "Turn off mobile data first, then continue"
        ],
        answer: 0,
        why: "A QR code is just a link you cannot read. The preview is your only chance to inspect it, and physical stickers placed over legitimate codes are a common tactic. Unfamiliar address means stop."
      },
      {
        type: "scenario",
        scenario: "An email from a courier says a parcel is held and asks you to sign in to reschedule. You are genuinely expecting a delivery.",
        q: "What is the safest way to check?",
        options: [
          "Open the courier app you already have installed, or type their website yourself",
          "Click the link, since you really are expecting a package",
          "Forward the message to a colleague and ask what they think",
          "Reply to the email and ask the courier to confirm it is genuine"
        ],
        answer: 0,
        why: "Expecting a delivery is exactly what makes the lure work. Attackers send these in volume knowing some recipients will be waiting for something. Any genuine notice will also be in the courier's own app."
      },
      {
        type: "scenario",
        scenario: "A phishing page asked for your password and then, on the next screen, for the six-digit code your bank had just texted you. You entered both.",
        q: "What does entering the code most likely mean?",
        options: [
          "The attacker was logging in as you in real time and now has access",
          "Nothing, because one-time codes expire after a few minutes",
          "Nothing, because the code only works on the bank's real website",
          "The code was harvested for sale but cannot be used immediately"
        ],
        answer: 0,
        why: "Modern phishing kits relay the code to the real site within seconds, while it is still valid. Treat the account as compromised: change the password, revoke sessions, and check for new recovery addresses or forwarding rules."
      },
      {
        type: "knowledge",
        q: "What is the defining characteristic of a phishing attack?",
        options: [
          "It impersonates a trusted organisation to make you surrender something valuable",
          "It exploits an unpatched vulnerability in your operating system",
          "It encrypts your files and demands payment",
          "It floods a website with traffic until it goes offline"
        ],
        answer: 0,
        why: "Phishing targets the person, not the software. No vulnerability is exploited. The message simply persuades you to act. That is what makes technical defences alone insufficient against it."
      },
      {
        type: "knowledge",
        q: "Why is poor grammar no longer a reliable way to spot phishing?",
        options: [
          "Translation tools and language models now produce fluent, professional text",
          "Email clients silently correct grammar in incoming messages",
          "Attackers are required to use templates approved by mail providers",
          "Grammar was never used by anyone as a phishing signal"
        ],
        answer: 0,
        why: "Clumsy English was a useful signal for years. It is not any more. Judge the message on the sender domain, the link destination, and the nature of the request instead."
      },
      {
        type: "knowledge",
        q: "What is QR phishing, sometimes called quishing?",
        options: [
          "Hiding a malicious link inside a QR code so it cannot be inspected before scanning",
          "Generating fake QR codes that install apps without any user action",
          "Using a QR code to bypass multi-factor authentication automatically",
          "Encrypting a phishing email so mail filters cannot read it"
        ],
        answer: 0,
        why: "The QR code adds nothing technically. It just removes your ability to read the destination first. It also gets past filters that scan for suspicious text links."
      },
      {
        type: "knowledge",
        q: "Which request should never come from a legitimate organisation by email?",
        options: [
          "Your password or a one-time PIN",
          "Confirmation that you received a statement",
          "A request to update your mailing address in your account settings",
          "Notification of a scheduled maintenance window"
        ],
        answer: 0,
        why: "No legitimate service asks for your password or a one-time code by email. They already have what they need on their side; only an attacker needs you to supply it."
      },
      {
        type: "knowledge",
        q: "Why do phishing messages so often impose a deadline of a few hours?",
        options: [
          "Time pressure reduces the chance you will stop and verify",
          "Mail servers delete unread promotional messages after a day",
          "Short deadlines make messages more likely to reach the inbox",
          "It is a legal requirement for account security notices"
        ],
        answer: 0,
        why: "Urgency is the mechanism, not a detail. Compressing the time between reading and clicking is the entire point, because verification only takes a minute if you are given one."
      },
      {
        type: "knowledge",
        q: "What is the safest general habit when a message says your account needs attention?",
        options: [
          "Never sign in from a link you did not go looking for",
          "Open the link but check for a padlock icon before signing in",
          "Sign in only if the message uses your full name",
          "Sign in from your phone rather than your computer"
        ],
        answer: 0,
        why: "A padlock only means the connection is encrypted, and attackers obtain certificates easily. Going to the site yourself, through an app or a bookmark, defeats the whole attack regardless of how convincing the message is."
      },
      {
        type: "knowledge",
        q: "Which attachment types most often carry a phishing payload?",
        options: [
          ".html .htm .zip .iso, and documents demanding that macros be enabled",
          ".jpg and .png images",
          ".txt plain-text notes",
          ".mp3 audio files"
        ],
        answer: 0,
        why: "HTML attachments open a local fake login page that never touches a suspicious URL. Archives and disk images smuggle executables past filters. A prompt to enable macros is a request to run code."
      },
      {
        type: "knowledge",
        q: "A phishing email uses your bank's exact logo, fonts, and footer layout. What does that prove?",
        options: [
          "Nothing: those assets are copied from the bank's own public website",
          "That the message passed the bank's security checks",
          "That the sender has access to the bank's internal systems",
          "That the message is at least partly genuine"
        ],
        answer: 0,
        why: "Every visual element is downloadable from the real site in seconds. Branding accuracy tells you about the attacker's effort, not about the message's origin."
      },
      {
        type: "knowledge",
        q: "After a phishing compromise of an email account, which follow-up check is most often overlooked?",
        options: [
          "Looking for hidden mail forwarding rules added by the attacker",
          "Clearing the browser cache",
          "Reinstalling the email application",
          "Changing the account's display name"
        ],
        answer: 0,
        why: "A silent forwarding rule lets an attacker keep reading your mail long after you have changed the password. Always check filters, rules, and recovery addresses after any email compromise."
      }
    ]
  },

  /* ======================================================================
     SPEAR PHISHING
     ====================================================================== */
  "spear-phishing": {
    title: "Spear Phishing",
    questions: [
      {
        type: "scenario",
        scenario: "A recruiter messages you, names a real client from your portfolio, praises that specific project, and offers an above-market contract. To proceed you must take a skills assessment and sign in with your Google account on <strong>northbridge-careers.talentportal-hr.com</strong>.",
        q: "What is the clearest sign this is an attack?",
        options: [
          "A skills assessment is asking for your Google credentials on a third-party domain",
          "The recruiter contacted you without an introduction",
          "The rate offered is higher than you usually charge",
          "The message was sent through a professional network rather than email"
        ],
        answer: 0,
        why: "Everything factual was harvested from your public profile. The single manipulated element is the credential request. No legitimate assessment ever needs your email password."
      },
      {
        type: "scenario",
        scenario: "An email from your longest-standing client's finance contact arrives on a Friday at 4:50 PM. The signature and tone are exactly right, but the address is one character different from the one in your existing thread.",
        q: "What should you do?",
        options: [
          "Call the contact on the number you already had before this email arrived",
          "Reply to the new address and ask them to confirm their identity",
          "Compare the writing style to previous emails and decide from that",
          "Wait until Monday and see whether they follow up"
        ],
        answer: 0,
        why: "Replying to the new address only reaches the attacker. Friday-afternoon timing is deliberate. It targets the window when verification is hardest. Use a channel that existed before the message."
      },
      {
        type: "scenario",
        scenario: "A message references your current project, your rate, and your recent client (all accurate) and asks you to review an attached brief that requires a login to open.",
        q: "What do those accurate details actually prove?",
        options: [
          "Nothing about identity. They are all available from public profiles",
          "That the sender has worked with you before",
          "That the sender has legitimate access to your client's systems",
          "That the message came from inside your client's network"
        ],
        answer: 0,
        why: "Detail is not identity. LinkedIn, portfolios, and public posts supply everything in that message. In spear phishing, the accuracy is the weapon, not the reassurance."
      },
      {
        type: "scenario",
        scenario: "You check the recruiter's profile. It was created three weeks ago, has 41 connections, no posts, and the company page it links to has no other employees.",
        q: "How should you read this?",
        options: [
          "A strong signal of a fabricated identity: verify the company independently",
          "Normal for a recruiter who has just switched employers",
          "Irrelevant, since profile age is not related to legitimacy",
          "Proof of fraud on its own, so no further checking is needed"
        ],
        answer: 0,
        why: "A thin, new profile with no history is a strong signal but not proof by itself. Confirm the company through its real website and contact the person through details you found yourself."
      },
      {
        type: "scenario",
        scenario: "A message claiming to be from your supervisor asks you to buy gift cards for a client giveaway and send the codes, adding: 'I am in back-to-back meetings, email only please, and keep this between us until the announcement.'",
        q: "Which element most reliably identifies this as an attack?",
        options: [
          "Untraceable payment combined with confidentiality and a blocked verification channel",
          "The fact that a supervisor emailed rather than called",
          "That the request came during working hours",
          "That gift cards were mentioned by brand name"
        ],
        answer: 0,
        why: "Three attacker needs appear together: an irreversible payment method, secrecy so nobody cross-checks, and a reason you cannot call. That combination is the signature of the attack."
      },
      {
        type: "scenario",
        scenario: "You are a virtual assistant. A person introduces themselves as a new project manager at a client company, chats pleasantly for three days about deliverables, then asks for the shared login to the client's social media accounts.",
        q: "What is the correct response?",
        options: [
          "Verify with your existing contact at the client before sharing anything",
          "Share the credentials, since the relationship is now established",
          "Share a limited-permission account instead, without verifying",
          "Ask them to prove identity by sending a photo of their company ID"
        ],
        answer: 0,
        why: "The friendly build-up is the attack, not evidence against it. An ID photo proves nothing. Those are trivially forged. Verify through your established contact using details you already had."
      },
      {
        type: "knowledge",
        q: "What distinguishes spear phishing from ordinary phishing?",
        options: [
          "It is written for one specific target using researched personal details",
          "It is sent by SMS instead of email",
          "It always contains a malicious attachment",
          "It targets only large corporations, never individuals"
        ],
        answer: 0,
        why: "Ordinary phishing is a net thrown wide. Spear phishing is a single message built after real research, which is why generic advice such as 'watch for impersonal greetings' stops working."
      },
      {
        type: "knowledge",
        q: "Which source do attackers most commonly use to research a freelance target?",
        options: [
          "Public professional profiles, portfolio sites, and social media posts",
          "Encrypted messaging apps",
          "The target's internet service provider records",
          "Government tax databases"
        ],
        answer: 0,
        why: "Everything needed is usually published voluntarily. Being findable is a requirement of freelancing, which is precisely what makes this group easy to research."
      },
      {
        type: "knowledge",
        q: "What is a homoglyph domain?",
        options: [
          "A domain using visually similar characters, such as a capital I in place of a lowercase l",
          "A domain registered in more than one country at once",
          "A domain that redirects to a different site after a delay",
          "A domain with an unusually long name"
        ],
        answer: 0,
        why: "In most fonts, capital I and lowercase l are indistinguishable, as are rn and m. Copy a suspicious address into a plain-text editor if you need to be sure."
      },
      {
        type: "knowledge",
        q: "Why is verifying through a channel that predates the message so important?",
        options: [
          "Any contact detail supplied in the message itself may belong to the attacker",
          "Older channels are technically more secure than newer ones",
          "It creates a legal record of the verification",
          "It is faster than replying directly"
        ],
        answer: 0,
        why: "Replying to the message, or calling the number in its signature, keeps you inside the attacker's control. A channel from before the message arrived is outside it."
      },
      {
        type: "knowledge",
        q: "Which request pattern is a reliable red flag in a job or client approach?",
        options: [
          "Signing in with your email account to access an assessment or portal",
          "A request for your portfolio or work samples",
          "A request for your availability and rate",
          "A request for a video call before contracting"
        ],
        answer: 0,
        why: "There is no legitimate reason for a recruitment process to want your email credentials. Portfolios, rates, and video calls are all normal parts of hiring."
      },
      {
        type: "knowledge",
        q: "Why do these messages so often arrive late on a Friday or just before a holiday?",
        options: [
          "The people who could verify the request are least reachable then",
          "Spam filters are switched off outside business hours",
          "Recipients read email more carefully at those times",
          "It is when most legitimate invoices are issued"
        ],
        answer: 0,
        why: "Timing is chosen deliberately. If nobody is available to confirm, the recipient is far more likely to act on their own judgement under time pressure."
      },
      {
        type: "knowledge",
        q: "Which term describes an attack impersonating a supplier or executive to redirect payments?",
        options: [
          "Business email compromise",
          "Denial of service",
          "SQL injection",
          "Credential stuffing"
        ],
        answer: 0,
        why: "Business email compromise is consistently among the costliest categories of cybercrime worldwide, and spear phishing combined with pretexting is the technique behind it."
      },
      {
        type: "knowledge",
        q: "You receive a spear phishing attempt impersonating a client. Beyond protecting yourself, what should you do?",
        options: [
          "Warn the impersonated client so their other contractors can be alerted",
          "Nothing further, since you did not fall for it",
          "Publicly post the message so others can see it",
          "Reply to the attacker to confirm you are not interested"
        ],
        answer: 0,
        why: "If someone is using your client's name to reach you, they are almost certainly reaching others in the same network. A short warning is genuinely effective."
      },
      {
        type: "knowledge",
        q: "Why is a display name an unreliable indicator of a sender's identity?",
        options: [
          "It is free text that anyone can set to any value",
          "It is generated automatically by the mail server",
          "It is only visible on mobile devices",
          "It changes every time a message is forwarded"
        ],
        answer: 0,
        why: "The display name is chosen entirely by the sender. Always expand it and read the full address, especially on mobile clients that hide the address by default."
      }
    ]
  },

  /* ======================================================================
     SMISHING
     ====================================================================== */
  "smishing": {
    title: "Smishing",
    questions: [
      {
        type: "scenario",
        scenario: "You receive: <em>'LBC EXPRESS: Your parcel LB4471982PH is on hold due to an incomplete address. Pay the ₱48 redelivery fee within 12 hours or the item will be returned.'</em> with a link to <strong>lbc-redelivery.info</strong>.",
        q: "Why is the fee kept so small?",
        options: [
          "A trivial amount discourages scrutiny, and the real target is your card details",
          "Small transactions cannot be reversed by banks",
          "It is the maximum a scam can charge without triggering alerts",
          "It covers the attacker's cost of sending the messages"
        ],
        answer: 0,
        why: "₱48 sits below the threshold where most people stop to think. The payment is the pretext; the card number, expiry, and CVV you enter to pay it are the actual prize."
      },
      {
        type: "scenario",
        scenario: "A text appears in the same conversation thread as genuine messages from your bank, using the same sender ID.",
        q: "What does that prove about its origin?",
        options: [
          "Nothing: alphanumeric sender IDs can be spoofed and phones thread by ID",
          "That it genuinely came from your bank's messaging system",
          "That your phone has verified the sender cryptographically",
          "That your bank's systems have been breached"
        ],
        answer: 0,
        why: "Because phones group messages by sender ID, a spoofed message drops neatly into the real thread. This is one of the most convincing tricks in smishing and it requires no access to the bank at all."
      },
      {
        type: "scenario",
        scenario: "A text says you have won ₱50,000 in a raffle run by a mall you have shopped at. To claim it you must send a processing fee via e-wallet.",
        q: "Which element identifies this as a scam most reliably?",
        options: [
          "Being asked to pay a fee to receive a prize",
          "That the mall is one you have actually visited",
          "That the amount is a round number",
          "That the message arrived by SMS rather than email"
        ],
        answer: 0,
        why: "Legitimate prizes are never contingent on you paying first. In this project's survey, 92.6% of 54 remote workers had already received a message of exactly this type."
      },
      {
        type: "scenario",
        scenario: "A text claims a ₱12,000 transfer from your account was blocked and gives a hotline number to call immediately.",
        q: "What is the safest response?",
        options: [
          "Call the number printed on your card or in the bank's official app instead",
          "Call the number in the message, since blocked transfers are time-sensitive",
          "Reply STOP to the message to halt the transaction",
          "Forward the message to your bank and wait for their reply"
        ],
        answer: 0,
        why: "The supplied number reaches the attacker, who will then ask you to 'verify' with a one-time code. Any genuine block will also be visible in your banking app."
      },
      {
        type: "scenario",
        scenario: "A friend texts: <em>'Hey, I accidentally sent my verification code to your number. Can you forward it to me?'</em>",
        q: "What is happening?",
        options: [
          "Someone is trying to take over an account and needs the code you received",
          "A genuine mis-typed phone number, so forwarding it is harmless",
          "A network fault that duplicated the message",
          "A test message from the mobile provider"
        ],
        answer: 0,
        why: "Codes are sent to the number on the account. They do not arrive at yours by accident. Whoever is asking triggered that code by attempting to sign in. Never forward a verification code to anyone, ever."
      },
      {
        type: "scenario",
        scenario: "You tapped a link in a scam text, the page loaded, and you closed it immediately without typing anything.",
        q: "What is the appropriate level of concern?",
        options: [
          "Low: you almost certainly are not compromised, but do not revisit the link",
          "Severe: simply loading the page installs malware on modern phones",
          "None at all: no follow-up is ever needed after visiting a page",
          "High. You must factory reset your phone immediately"
        ],
        answer: 0,
        why: "Smishing pages harvest what you type. Loading one and entering nothing usually leaves you fine. Delete the message, block the sender, and stay alert for follow-up calls referencing it."
      },
      {
        type: "knowledge",
        q: "What is smishing?",
        options: [
          "Phishing delivered through SMS text messages",
          "Phishing conducted over a voice call",
          "Malware that spreads through Bluetooth",
          "Intercepting messages on a public Wi-Fi network"
        ],
        answer: 0,
        why: "Smishing compresses SMS and phishing. The mechanics match email phishing, but with far less context available to help you judge the message."
      },
      {
        type: "knowledge",
        q: "Why is it harder to evaluate a text than an email?",
        options: [
          "There is no full sender address, no signature, and links are usually shortened",
          "Text messages cannot be screenshotted for review",
          "Phones display texts for a limited time only",
          "SMS cannot contain links at all"
        ],
        answer: 0,
        why: "You are asked to make the same decision with a fraction of the evidence, usually while distracted. That evidence gap is what the attack relies on."
      },
      {
        type: "knowledge",
        q: "Which three lures account for the majority of scam texts?",
        options: [
          "Package delivery fees, prize or raffle wins, and urgent bank alerts",
          "Weather warnings, election notices, and traffic updates",
          "Software updates, storage warnings, and app reviews",
          "Utility bills, school notices, and appointment reminders"
        ],
        answer: 0,
        why: "These three cover most campaigns because each maps to something plausible: you might be expecting a parcel, you would like to have won, and a bank alert is alarming enough to override caution."
      },
      {
        type: "knowledge",
        q: "Why should you avoid replying to a scam text, even to say no?",
        options: [
          "A reply confirms your number is active, making it more valuable to resell",
          "Replying automatically subscribes you to a paid service",
          "Your reply gives the sender access to your contacts",
          "Replying is a criminal offence in most jurisdictions"
        ],
        answer: 0,
        why: "Confirmed-active numbers are sold at a premium. Block and report instead, and never reply, even out of irritation."
      },
      {
        type: "knowledge",
        q: "You entered card details on a smishing page. What is the first action?",
        options: [
          "Call your bank's official hotline immediately and have the card blocked",
          "Wait to see whether any charge actually appears",
          "Change your online banking password and take no further action",
          "Report the message to your network provider first"
        ],
        answer: 0,
        why: "A fresh card number is sold and used within hours. Blocking the card is the only step that reliably stops the loss, and it comes before everything else."
      },
      {
        type: "knowledge",
        q: "Why do attackers use link shorteners in text messages?",
        options: [
          "They hide the destination completely until it is opened",
          "They make pages load noticeably faster",
          "They are required for links to work in SMS",
          "They prevent the message from being reported"
        ],
        answer: 0,
        why: "A shortener removes your only chance to inspect where the link goes, and on a small screen even a full address is easy to misread."
      },
      {
        type: "knowledge",
        q: "What is the single most reliable habit against smishing?",
        options: [
          "Never act inside the message: verify through the app or site you already use",
          "Only open links from senders in your contacts list",
          "Read texts on a computer rather than a phone",
          "Disable SMS previews on your lock screen"
        ],
        answer: 0,
        why: "Every legitimate notification is also waiting for you in the official app. Closing the text and checking there defeats the attack no matter how convincing the wording is."
      },
      {
        type: "knowledge",
        q: "A text offers a work-from-home job at high pay, no interview, and asks you to continue on Telegram.",
        options: [
          "A common job scam that typically leads to advance fees or money laundering",
          "A normal modern recruitment process for remote roles",
          "A legitimate approach if the company has a website",
          "Safe as long as you never share your bank details"
        ],
        q: "How should this be read?",
        answer: 0,
        why: "Moving off-platform to an unmonitored channel is the tell. These schemes end in an advance fee, or in using your bank account to move other people's stolen money."
      },
      {
        type: "knowledge",
        q: "Why is SMS the weakest form of multi-factor authentication?",
        options: [
          "It is vulnerable to SIM-swap fraud and to social engineering by phone",
          "Text messages are never delivered reliably",
          "Codes sent by SMS do not expire",
          "SMS codes are always shorter than app-generated ones"
        ],
        answer: 0,
        why: "SMS is still much better than no second factor. But an authenticator app generates codes on your device, so there is no message to intercept or redirect."
      }
    ]
  },

  /* ======================================================================
     VISHING
     ====================================================================== */
  "vishing": {
    title: "Vishing",
    questions: [
      {
        type: "scenario",
        scenario: "A caller says: <em>'This is the fraud team. We have held a ₱48,750 transfer, but the hold expires in fifteen minutes. I am sending a six-digit code to your phone. Please read it back so I can confirm your identity.'</em>",
        q: "What is actually happening?",
        options: [
          "The attacker is signing in as you and needs the code to complete it",
          "The bank is performing a standard identity verification",
          "The code confirms the transfer has been cancelled",
          "The call is genuine but the agent is following the wrong procedure"
        ],
        answer: 0,
        why: "The bank sent that code because someone requested it. That someone is the caller. A bank never needs you to read back a code they generated. This single request ends the call."
      },
      {
        type: "scenario",
        scenario: "Your phone shows your bank's real hotline number as the incoming caller ID.",
        q: "What does that tell you about the call's origin?",
        options: [
          "Nothing: caller ID is display text and is trivially spoofed",
          "That the call definitely came from the bank's system",
          "That the call was routed through a verified carrier",
          "That the number has been checked against a fraud database"
        ],
        answer: 0,
        why: "Caller ID carries no proof of origin. Seeing a familiar number is exactly what the attacker is counting on. Hang up and dial back on a number you already had."
      },
      {
        type: "scenario",
        scenario: "Someone claiming to be IT support says your account is compromised and asks you to install AnyDesk so they can secure your machine.",
        q: "What should you do?",
        options: [
          "Refuse, hang up, and contact IT through a channel you already had",
          "Install it but watch the screen and disconnect if anything looks wrong",
          "Install it only if they can name your manager",
          "Ask them to email the request first, then install it"
        ],
        answer: 0,
        why: "Remote-access software hands over full control of your device. Naming your manager proves nothing. That is public information. Never install remote-access tools at the request of an unsolicited caller."
      },
      {
        type: "scenario",
        scenario: "A caller states your full name and the last four digits of your card, then asks you to confirm your online banking password.",
        q: "How should you interpret the accurate details?",
        options: [
          "They are cheap to obtain from breaches and are offered to buy your trust",
          "They prove the caller has access to your bank account records",
          "They confirm the call is internal to the bank",
          "They indicate the bank's database has been breached"
        ],
        answer: 0,
        why: "Partial card digits and names circulate widely in breach data. They are recited early precisely so that you conclude the call is genuine. A bank never asks for your full password."
      },
      {
        type: "scenario",
        scenario: "You receive a voice note that sounds exactly like your client's voice, urgently asking you to transfer funds to a new account today.",
        q: "What is the appropriate response?",
        options: [
          "Verify by calling them on the number you already had, on a separate channel",
          "Act on it, since you clearly recognise the voice",
          "Reply to the voice note asking them to confirm",
          "Transfer a smaller test amount first to check"
        ],
        answer: 0,
        why: "AI voice cloning needs only a short sample of public audio. A recognisable voice is no longer evidence of identity. Verify on a channel you already had, ideally with an agreed code word."
      },
      {
        type: "scenario",
        scenario: "You realise mid-call that it is a scam. The caller becomes insistent that you must not hang up or the hold will fail.",
        q: "What should you do?",
        options: [
          "Hang up immediately: ending a call is always safe",
          "Stay on the line and try to gather information about the caller",
          "Put the phone down without hanging up so they think you are still there",
          "Tell them you know it is a scam and warn them off"
        ],
        answer: 0,
        why: "The instruction not to hang up exists solely to prevent you from verifying. Nothing bad happens because you ended a call. Hang up, wait a moment, then call back on a number you trust."
      },
      {
        type: "knowledge",
        q: "What is vishing?",
        options: [
          "Social engineering conducted by voice call or voice message",
          "Phishing sent through video conferencing links",
          "Malware that records audio from a device",
          "Intercepting calls on a shared network"
        ],
        answer: 0,
        why: "Vishing is voice phishing. The goal matches email phishing; the live medium removes your time to think and adds social pressure not to be rude."
      },
      {
        type: "knowledge",
        q: "Why is a phone call often more effective than an email for an attacker?",
        options: [
          "It demands an immediate answer and makes scepticism socially awkward",
          "Calls cannot be recorded as evidence",
          "Phone networks have no fraud detection at all",
          "People trust unknown numbers more than unknown addresses"
        ],
        answer: 0,
        why: "An email waits for you; a call does not. The social cost of appearing rude to a professional-sounding stranger is a surprisingly effective lever."
      },
      {
        type: "knowledge",
        q: "Which rule defeats nearly every vishing call?",
        options: [
          "Never read out, type, or forward a one-time code to anyone",
          "Only answer calls from numbers in your contacts",
          "Always ask the caller for an employee number",
          "Record every call you receive"
        ],
        answer: 0,
        why: "An OTP is a password that expires quickly. No bank, courier, employer, or IT desk will ever ask you to read one aloud, because they sent it and already know it."
      },
      {
        type: "knowledge",
        q: "Why should you use a different phone to call back after a suspicious call?",
        options: [
          "Some scams hold the line open so a callback reaches the same attacker",
          "Your original phone may have been infected during the call",
          "Callbacks from the same number are automatically blocked",
          "Different phones use different, more secure networks"
        ],
        answer: 0,
        why: "This is a genuine technique on landlines and some mobile setups. Waiting a minute or using another device removes the risk entirely."
      },
      {
        type: "knowledge",
        q: "A caller asks you to move funds to a 'safe holding account' during an investigation. What is this?",
        options: [
          "Always fraud: no such account exists in legitimate banking",
          "A standard fraud-prevention procedure at most banks",
          "Legitimate only if the account is in your own name",
          "Legitimate only when arranged by the fraud department"
        ],
        answer: 0,
        why: "Banks freeze accounts; they never ask customers to move money elsewhere for safety. The 'safe account' is the attacker's."
      },
      {
        type: "knowledge",
        q: "You installed remote-access software during a scam call. What is the first step?",
        options: [
          "Disconnect the device from the internet, then uninstall it",
          "Run antivirus while remaining connected",
          "Change all your passwords on the same device immediately",
          "Restart the device and continue using it normally"
        ],
        answer: 0,
        why: "Disconnecting cuts the attacker's access first. Change passwords only from a <em>different</em> device. Anything typed on the compromised machine should be assumed to have been seen."
      },
      {
        type: "knowledge",
        q: "Why do attackers ask for payment in gift cards, e-wallets, or cryptocurrency?",
        options: [
          "Those transfers are effectively irreversible",
          "They are the only methods that work internationally",
          "They avoid all transaction fees",
          "They are the fastest way to move small amounts"
        ],
        answer: 0,
        why: "Reversibility is the deciding factor. Any request for payment by these methods, from someone who called you, should be treated as fraud."
      },
      {
        type: "knowledge",
        q: "What simple measure helps most against AI voice cloning?",
        options: [
          "Agreeing a code word with family and key clients that has never been posted online",
          "Only accepting calls from saved contacts",
          "Speaking in a regional language during calls",
          "Recording all calls for later comparison"
        ],
        answer: 0,
        why: "A cloned voice can reproduce how someone sounds, but not a shared secret it has never heard. A simple agreed word is cheap and genuinely effective."
      },
      {
        type: "knowledge",
        q: "Money left your account through a vishing call an hour ago. What matters most now?",
        options: [
          "Calling the bank's official hotline immediately to attempt a recall",
          "Filing a police report before contacting the bank",
          "Emailing the bank so there is a written record",
          "Waiting for the transaction to clear before reporting"
        ],
        answer: 0,
        why: "Recall is sometimes possible in the first hour and rarely afterwards. Call first and get a fraud reference number; the police report comes next, not before."
      }
    ]
  },

  /* ======================================================================
     PRETEXTING
     ====================================================================== */
  "pretexting": {
    title: "Pretexting",
    questions: [
      {
        type: "scenario",
        scenario: "An email from your client's finance contact says they have moved to a new banking partner and asks you to update the account on your March invoice. The old account 'closes on the 28th'. The domain is <strong>cortez-Iogistics.com</strong>.",
        q: "What is the decisive red flag?",
        options: [
          "A capital I replaces the lowercase l in the domain. It is a lookalike",
          "The message mentions a specific date",
          "Finance contacted you rather than your project manager",
          "The email included an account number in plain text"
        ],
        answer: 0,
        why: "In most fonts, capital I and lowercase l are identical. Everything else in the message is genuine, harvested from real earlier exchanges. The domain and the bank change are the only manipulated parts."
      },
      {
        type: "scenario",
        scenario: "A supplier you have worked with for two years emails to say their bank details have changed. The address matches your existing thread exactly and the tone is normal.",
        q: "What should you do before paying?",
        options: [
          "Call them on the number you already had and confirm the account number aloud",
          "Pay, since the email address matches your existing thread",
          "Reply asking them to confirm the change in writing",
          "Send a small test payment first and wait for acknowledgement"
        ],
        answer: 0,
        why: "A matching address can mean their mailbox is compromised, in which case the attacker also sees and answers your reply. Any change to where money goes gets confirmed by voice, without exception."
      },
      {
        type: "scenario",
        scenario: "A new contact introduces themselves as a project manager at your client, asks a harmless question about a deliverable, chats for several days, and only then asks for access to a shared account.",
        q: "What does the friendly build-up represent?",
        options: [
          "The pretext itself: the harmless contact exists to make the later request unremarkable",
          "Evidence of a genuine working relationship",
          "A normal onboarding process for new staff",
          "An unrelated coincidence before the real attack"
        ],
        answer: 0,
        why: "Escalation across messages is the signature of pretexting. The early exchanges have no purpose other than making the real request feel like a continuation of something normal."
      },
      {
        type: "scenario",
        scenario: "The sender declines a phone call, explaining they are 'in workshops all day, email reaches me fine', and asks you to keep the payment change between the two of you.",
        q: "How should those two details be read together?",
        options: [
          "As deliberate blocking of verification, a core pretexting technique",
          "As a reasonable explanation from a busy colleague",
          "As evidence the request is confidential but genuine",
          "As irrelevant to the legitimacy of the request"
        ],
        answer: 0,
        why: "Each detail is individually plausible, which is why they work. Together they remove your two natural checks: talking to the person, and mentioning it to someone else."
      },
      {
        type: "scenario",
        scenario: "You already paid an invoice to the new account and then discovered the domain was a lookalike.",
        q: "What is the first action?",
        options: [
          "Call your bank immediately and request a recall, then tell the real client",
          "Email the attacker demanding the money back",
          "Wait to see whether the payment bounces",
          "File a police report before contacting anyone else"
        ],
        answer: 0,
        why: "Recall chances fall away fast. Call the bank first, then tell the client whose identity was used. Their other contractors are almost certainly being targeted in the same campaign."
      },
      {
        type: "scenario",
        scenario: "Someone claiming to be from a client's IT department asks you to confirm which project management tools you use and who approves your invoices. They ask for nothing sensitive.",
        q: "How should you treat this?",
        options: [
          "As reconnaissance for a later attack: verify before answering",
          "As harmless, since no credentials were requested",
          "As a routine audit that requires cooperation",
          "As a survey that can be safely ignored without any follow-up"
        ],
        answer: 0,
        why: "Knowing which tools you use and who signs off payments is exactly what is needed to build a convincing pretext later. Apparently harmless information-gathering is a normal first stage."
      },
      {
        type: "knowledge",
        q: "What is pretexting?",
        options: [
          "Building a believable cover story that makes a later request seem ordinary",
          "Sending bulk emails with a malicious attachment",
          "Guessing passwords using leaked credential lists",
          "Intercepting traffic on an unsecured network"
        ],
        answer: 0,
        why: "The pretext is the invented context. By the time the request arrives, it has been made to feel like a routine part of an established relationship."
      },
      {
        type: "knowledge",
        q: "How does pretexting differ from ordinary phishing?",
        options: [
          "It invests time building a relationship before making any request",
          "It is always delivered by SMS",
          "It relies on a software vulnerability",
          "It targets only personal, never professional, accounts"
        ],
        answer: 0,
        why: "Phishing fires once and hopes. Pretexting invests, which is why it succeeds against people who would spot a bulk phishing email immediately."
      },
      {
        type: "knowledge",
        q: "Which single rule prevents most invoice fraud?",
        options: [
          "Confirm every change of payment details by voice, on a number you already had",
          "Only accept invoices as PDF attachments",
          "Require all invoices to be signed",
          "Pay invoices only on fixed days of the month"
        ],
        answer: 0,
        why: "Pretexting is defeated by procedure rather than by suspicion, and procedure keeps working on a bad day, when judgement alone might not."
      },
      {
        type: "knowledge",
        q: "Why are remote workers particularly exposed to pretexting?",
        options: [
          "They routinely work with people they have never met, so a plausible stranger is normal",
          "They use less secure devices than office workers",
          "They are legally responsible for client payments",
          "Their email providers offer weaker filtering"
        ],
        answer: 0,
        why: "In a distributed working relationship, a new contact you have never seen or heard is unremarkable. The attacker does not need to overcome any expectation of face-to-face familiarity."
      },
      {
        type: "knowledge",
        q: "Why is replying inside the original email thread a useful check?",
        options: [
          "If the sender address was spoofed, your reply reaches the real person instead",
          "Threaded replies are encrypted by default",
          "It prevents the attacker from reading your message",
          "It automatically verifies the sender's domain"
        ],
        answer: 0,
        why: "It is a cheap check that surfaces spoofing immediately. It does not help when the real mailbox is compromised, which is why a voice call remains the stronger step."
      },
      {
        type: "knowledge",
        q: "Which timing pattern is typical of a pretexting request?",
        options: [
          "Just before a finance cut-off, a holiday, or while the real person is away",
          "Early on Monday morning",
          "During scheduled system maintenance",
          "Immediately after a public holiday ends"
        ],
        answer: 0,
        why: "The window is chosen so that verification is hardest and the pressure to close things out is highest."
      },
      {
        type: "knowledge",
        q: "A request is unusually small and harmless, and the next one is not. What does that pattern indicate?",
        options: [
          "Escalation, a hallmark of a pretext being established",
          "A genuine relationship developing naturally",
          "An automated system sending messages out of order",
          "A sign the sender is inexperienced"
        ],
        answer: 0,
        why: "The first request exists only to make the second one unremarkable. Recognising escalation is one of the most useful defences against this attack."
      },
      {
        type: "knowledge",
        q: "Why does a two-minute verification call cost an attacker so much?",
        options: [
          "It breaks the pretext by introducing a channel they do not control",
          "It creates a legal record that can be used in court",
          "It alerts the telephone network to the fraud",
          "It gives the bank time to freeze the transfer automatically"
        ],
        answer: 0,
        why: "The pretext only survives inside the attacker's channel. A genuine colleague will accept a short delay for verification; only an attacker cannot afford one."
      },
      {
        type: "knowledge",
        q: "What is the safest response to a request for an organisation chart, client list, or copy of an invoice?",
        options: [
          "Verify who is asking and why before sending anything",
          "Send it, since none of it is technically confidential",
          "Send a redacted version without verifying",
          "Ignore it entirely and take no further action"
        ],
        answer: 0,
        why: "This is reconnaissance dressed as admin. Each item makes the next pretext more convincing, and verifying costs almost nothing."
      }
    ]
  }
};

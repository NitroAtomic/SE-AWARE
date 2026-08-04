/* ==========================================================================
   quiz-data-premium.js: question banks for the four role-based modules
   Web-Based Social Engineering Awareness Platform for Remote Workers
   Group 4 · S3102 · MO-IT200D1 Capstone 1
   --------------------------------------------------------------------------
   Same structure and the same 15-question depth as the free banks, so a
   Premium subscriber gets a real assessment rather than a token one.
   Merged into window.QUIZ_DATA, so the quiz engine needs no changes.
   ========================================================================== */

(function () {
  "use strict";

  var PREMIUM = {

    /* ====================================================================
       CLIENT IMPERSONATION
       ==================================================================== */
    "client-impersonation": {
      title: "Client Impersonation",
      premium: true,
      questions: [
        {
          type: "scenario",
          scenario: "A person introduces themselves as your client's new project manager on Monday, asks a harmless question about a deliverable on Wednesday, then on Friday asks for the analytics portal login because 'IT are slow with provisioning'.",
          q: "What is the Wednesday message doing?",
          options: [
            "Making Friday's request feel like a continuation rather than a first approach",
            "Genuinely checking a figure before a board deck",
            "Testing whether your email address still works",
            "Nothing, it is unrelated to the attack"
          ],
          answer: 0,
          why: "Escalation is the signature of this attack. A small, harmless, grantable request converts a stranger into a contact, so that the real request lands inside an established relationship."
        },
        {
          type: "scenario",
          scenario: "The same message adds that they would 'rather not hold up your invoice approval while we wait'.",
          q: "What is that clause doing?",
          options: [
            "Attaching something you want to compliance, so hesitating feels costly",
            "Being helpful about your payment timeline",
            "Explaining an unrelated finance process",
            "Establishing that they have authority over payments"
          ],
          answer: 0,
          why: "It is leverage disguised as consideration. Linking your money to their request means pausing to verify now feels like it costs you something, which is exactly the hesitation the attacker needs to remove."
        },
        {
          type: "scenario",
          scenario: "You want to confirm whether this new project manager is genuine.",
          q: "Who should you ask?",
          options: [
            "Your existing contact at the client, through the channel you already had",
            "The new project manager, by replying and asking them to confirm",
            "The client's public support email address",
            "Nobody, since the details they gave were accurate"
          ],
          answer: 0,
          why: "Replying to the new address asks the attacker to vouch for themselves, and they will. Verification only works through a channel that existed before the message arrived."
        },
        {
          type: "scenario",
          scenario: "You check and the email address is genuinely your client's real address, with the real thread history beneath it.",
          q: "What does that most likely mean?",
          options: [
            "Their mailbox has been compromised, which is the hardest version to spot",
            "The request must be legitimate",
            "The attacker has spoofed the display name only",
            "Your own account has been compromised"
          ],
          answer: 0,
          why: "A genuine address with real history means the account itself has been taken over. This is why a voice call on a number you already had beats any amount of inspecting the email."
        },
        {
          type: "scenario",
          scenario: "A client contact you have never spoken to asks you to move a conversation to a personal WhatsApp number because 'company chat is being migrated'.",
          q: "How should you read this?",
          options: [
            "As an attempt to move you somewhere unmonitored and unverifiable",
            "As a normal consequence of an IT migration",
            "As a convenience, since chat apps are faster",
            "As harmless, provided you do not share credentials there"
          ],
          answer: 0,
          why: "Moving off a monitored channel removes the client's ability to audit the conversation and removes your evidence trail. Migrations are a common and plausible cover story."
        },
        {
          type: "scenario",
          scenario: "You already added the impersonator to a shared Drive folder yesterday.",
          q: "What is the first thing to do?",
          options: [
            "Revoke the access in the platform's sharing settings, then tell the real client",
            "Delete the folder entirely so nothing can be reached",
            "Email the impersonator and withdraw the invitation",
            "Wait to see whether anything is actually downloaded"
          ],
          answer: 0,
          why: "Revoking access stops the exposure immediately. Deleting the folder destroys evidence and may destroy the client's data too. Telling the client the same day matters, because their other contractors are being approached."
        },
        {
          type: "knowledge",
          q: "Why are freelancers more exposed to client impersonation than office employees?",
          options: [
            "An unfamiliar contact is normal in client work, so instincts do not fire",
            "Freelancers use weaker devices than employees",
            "Client data is inherently more valuable",
            "Freelancers are legally responsible for client security"
          ],
          answer: 0,
          why: "Inside a company, a stranger claiming to be new is unusual and there is a colleague to ask. In client work, unfamiliar people are part of the job, so the attacker is not fighting your instincts."
        },
        {
          type: "knowledge",
          q: "In this attack, what does the attacker usually want first?",
          options: [
            "Access, because it is quieter and rarely questioned",
            "A single large payment",
            "Your personal identity documents",
            "Control of your own website"
          ],
          answer: 0,
          why: "Access can be used repeatedly, attracts less scrutiny, and implicates you rather than them. The payment request comes later, once the relationship feels established."
        },
        {
          type: "knowledge",
          q: "Why do attackers impersonate a middle-ranking contact rather than the CEO?",
          options: [
            "Senior enough to give instructions, junior enough that you would not know them",
            "Executives are better protected technically",
            "Middle managers have more system access",
            "It is easier to find their photographs"
          ],
          answer: 0,
          why: "The identity has to fit a gap in your knowledge. You would recognise the founder you have met on calls, but a new account coordinator is entirely plausible and unverifiable at a glance."
        },
        {
          type: "knowledge",
          q: "How does a genuine staff handover normally reach you?",
          options: [
            "The person leaving introduces the person arriving",
            "The new person introduces themselves directly",
            "Through an automated notification from the client's HR system",
            "It is usually not announced at all"
          ],
          answer: 0,
          why: "Real handovers are almost always introduced by the outgoing contact. A self-introduction from someone you have never heard of is not proof of fraud, but it is the point at which you verify."
        },
        {
          type: "knowledge",
          q: "Why is delegated access safer than a shared login?",
          options: [
            "It can be revoked cleanly and leaves an audit trail that protects you too",
            "It is encrypted where shared passwords are not",
            "It gives you more permissions",
            "It removes the need for multi-factor authentication"
          ],
          answer: 0,
          why: "Your own account on the client's platform can be switched off when the contract ends, survives their staff changes, and records who did what, which matters as much for your protection as theirs."
        },
        {
          type: "knowledge",
          q: "A request explains that the normal process is the obstacle: IT are slow, procurement is backed up, the portal is down. What is that?",
          options: [
            "A standard technique for routing around the controls that would catch them",
            "An honest description of a common problem",
            "A sign the request came from inside the organisation",
            "Irrelevant to whether the request is genuine"
          ],
          answer: 0,
          why: "Legitimate processes are exactly what the attacker needs you to bypass. Framing the process as the problem makes skipping it feel practical rather than reckless."
        },
        {
          type: "knowledge",
          q: "What should you agree with a client at the start of a contract to prevent this?",
          options: [
            "Who is authorised to request access or payment changes, and that new people are introduced by them",
            "That all communication happens by email only",
            "That you will hold a copy of their customer database",
            "That you will not work with their competitors"
          ],
          answer: 0,
          why: "A standing arrangement made in writing before there is a problem beats vigilance on the day. Clients generally appreciate being asked, because it shows you have thought about their exposure."
        },
        {
          type: "knowledge",
          q: "You verified and the contact was fake. Nothing was shared. What should you still do?",
          options: [
            "Tell the real client the same day so their other contractors can be warned",
            "Nothing, since no harm was done",
            "Post the details publicly as a warning",
            "Reply to the attacker to tell them you know"
          ],
          answer: 0,
          why: "Someone is using that client's name. Their other contractors are being approached with the same script, and a short warning from you may reach them before money moves."
        },
        {
          type: "knowledge",
          q: "Why does a request to keep something confidential belong on a red-flag list?",
          options: [
            "Secrecy removes the cross-check that would expose the impersonation",
            "Confidentiality is never legitimate in client work",
            "It indicates the sender is junior",
            "It means the message was sent to many people at once"
          ],
          answer: 0,
          why: "Confidentiality is often genuine, which is what makes it useful cover. Its effect, intended or not, is that you do not mention it to the one person who would say that contact does not exist."
        }
      ]
    },

    /* ====================================================================
       INVOICE AND PAYMENT SCAMS
       ==================================================================== */
    "invoice-scams": {
      title: "Invoice and Payment Scams",
      premium: true,
      questions: [
        {
          type: "scenario",
          scenario: "A client says their accounts assistant overpaid you, ₱62,000 instead of ₱31,000. The money really has landed. They ask you to return the difference to a supplied account.",
          q: "What is happening?",
          options: [
            "The incoming payment will be reversed later, and the refund you send is your own money",
            "A genuine administrative error you should help correct",
            "A test transaction before a larger contract",
            "A tax arrangement that requires a returned portion"
          ],
          answer: 0,
          why: "The overpayment was made with a stolen card or a bad cheque and gets reversed days or weeks later. The refund leaves your account immediately and is unrecoverable."
        },
        {
          type: "scenario",
          scenario: "The same email claims their finance system will not let them reverse a completed transfer.",
          q: "How should you treat that claim?",
          options: [
            "As false, because a real bank can always reverse its own outbound payment",
            "As a plausible limitation of small business banking",
            "As a reason to act faster on their behalf",
            "As irrelevant to the decision"
          ],
          answer: 0,
          why: "This claim exists to make you the only possible route for the money to come back. Any genuine payer can ask their own bank to reverse a transfer, which is exactly what you should tell them to do."
        },
        {
          type: "scenario",
          scenario: "A supplier you have paid monthly for two years emails to say their bank details have changed. The email address matches your existing thread exactly.",
          q: "What should you do before paying?",
          options: [
            "Call them on a number you already had and confirm the account number aloud",
            "Pay, since the address matches your thread",
            "Reply asking for written confirmation on letterhead",
            "Send a small test payment and wait for acknowledgement"
          ],
          answer: 0,
          why: "A matching address can mean their mailbox is compromised, in which case the attacker also reads and answers your reply. Only a channel outside their email settles it."
        },
        {
          type: "scenario",
          scenario: "The bank-change email arrives on a Thursday and says the old account closes on the 28th, with anything sent there bouncing back and delaying you a cycle.",
          q: "What is the deadline for?",
          options: [
            "Compressing the time available to verify, and adding a penalty for pausing",
            "Reflecting a genuine banking migration timetable",
            "Meeting a regulatory requirement for account changes",
            "Nothing, deadlines are normal in finance"
          ],
          answer: 0,
          why: "Urgency plus a penalty is the standard pairing. A two-minute verification call is easy to justify unless delaying it appears to cost you something."
        },
        {
          type: "scenario",
          scenario: "You paid the new account on Monday. On Thursday the real supplier chases the invoice.",
          q: "What is the first call you make?",
          options: [
            "Your bank, asking for a recall and a fraud reference number",
            "The supplier, to apologise and arrange a repayment plan",
            "The police, to file a report before anything else",
            "The email provider, to report the spoofed address"
          ],
          answer: 0,
          why: "Recall chances fall away fast, so the bank comes first. Use the phrase authorised push payment fraud, get a reference number, and then work through the client and the authorities."
        },
        {
          type: "scenario",
          scenario: "A new client offers to pay a subcontractor through you: they will send you the funds and you forward them on, keeping your fee.",
          q: "How should you respond?",
          options: [
            "Refuse. Money passing through your account for someone else is a laundering pattern",
            "Accept, since the fee is genuine work",
            "Accept but only for amounts under a set threshold",
            "Accept if they provide the subcontractor's contract"
          ],
          answer: 0,
          why: "This is the money mule structure regardless of how it is framed. The transactions are in your name, and intent is difficult to prove after the fact."
        },
        {
          type: "knowledge",
          q: "Why are freelancers exposed to invoice fraud from two directions?",
          options: [
            "They both send invoices and pay suppliers or subcontractors",
            "They use personal bank accounts for business",
            "They work across multiple time zones",
            "They rarely use written contracts"
          ],
          answer: 0,
          why: "Outbound invoices can be intercepted and redirected, and inbound payment requests can be faked. The same technique attacks both directions."
        },
        {
          type: "knowledge",
          q: "Why is a payment instruction rarely questioned?",
          options: [
            "Bank changes really do happen, and querying one feels like an accusation",
            "Payment emails bypass spam filters",
            "Finance systems verify account details automatically",
            "Most people cannot read account numbers accurately"
          ],
          answer: 0,
          why: "The social discomfort of appearing to distrust a client does as much work as the technical spoof. Naming that discomfort is what makes the verification rule possible to follow."
        },
        {
          type: "knowledge",
          q: "The attacker usually waits for a real invoice before striking. Why?",
          options: [
            "A payment that was already expected raises no questions",
            "Invoices contain the account number they need",
            "It gives them time to register a domain",
            "Banks scrutinise unexpected payments more closely"
          ],
          answer: 0,
          why: "Timing to a genuine transaction is what makes the correction believable. This is also why the quiet reading stage can run for weeks and produce nothing visible."
        },
        {
          type: "knowledge",
          q: "Which single rule prevents most invoice fraud?",
          options: [
            "Confirm every change of payment details by voice, on a number you already had",
            "Only accept invoices as password-protected PDFs",
            "Pay all invoices on a fixed day of the month",
            "Require a signature on every invoice"
          ],
          answer: 0,
          why: "It is procedure rather than suspicion, which is why it keeps working on a bad day when judgement alone might not. No exceptions, including for long-standing clients."
        },
        {
          type: "knowledge",
          q: "Why does replying inside the original email thread help?",
          options: [
            "If the address was spoofed, the reply reaches the real person instead",
            "Threaded replies are encrypted end to end",
            "It prevents the attacker from reading the message",
            "It automatically verifies the sender domain"
          ],
          answer: 0,
          why: "It is a cheap check that surfaces spoofing immediately. It does not help when the real mailbox is compromised, which is why a voice call remains the stronger step."
        },
        {
          type: "knowledge",
          q: "What should you put on your own invoices to protect your clients and your payments?",
          options: [
            "A line stating your bank details never change and any email claiming otherwise should be verified by phone",
            "A watermark showing the invoice is original",
            "Your full bank statement for the period",
            "A clause waiving liability for misdirected payments"
          ],
          answer: 0,
          why: "It sets the expectation before an attacker tries, gives your client a reason to call you, and costs one line of text."
        },
        {
          type: "knowledge",
          q: "Why do attackers ask for gift cards, e-wallet transfers, or cryptocurrency?",
          options: [
            "Those transfers are effectively irreversible",
            "They avoid transaction fees",
            "They are the only methods that work internationally",
            "They are faster to process than bank transfers"
          ],
          answer: 0,
          why: "Reversibility is the deciding factor in every payment method an attacker suggests. A request for these from someone who contacted you should be treated as fraud."
        },
        {
          type: "knowledge",
          q: "Why should you periodically check your sent folder and mail rules?",
          options: [
            "A silent forwarding rule is how an attacker reads your invoices",
            "It frees up mailbox storage",
            "Mail providers require it for compliance",
            "It improves email deliverability"
          ],
          answer: 0,
          why: "Rules you did not create are one of the clearest signs of a compromised mailbox, and they are how the attacker knew when a real invoice went out."
        },
        {
          type: "knowledge",
          q: "How long can an overpayment take to be reversed by the sending bank?",
          options: [
            "Days or even weeks, long after you have sent the refund",
            "Within one hour, so the risk window is short",
            "It cannot be reversed once it has cleared",
            "Exactly 24 hours in all cases"
          ],
          answer: 0,
          why: "The delay is the entire mechanism. The money looks settled, you refund in good faith, and the original payment unwinds afterwards."
        }
      ]
    },

    /* ====================================================================
       FAKE JOB AND RECRUITER OFFERS
       ==================================================================== */
    "fake-recruiters": {
      title: "Fake Job and Recruiter Offers",
      premium: true,
      questions: [
        {
          type: "scenario",
          scenario: "A role offers ₱45,000 a month for 8 to 10 hours a week. Client funds are transferred into your personal account, you deduct a 7% commission, and forward the balance to supplier accounts they provide.",
          q: "What is this role?",
          options: [
            "Money laundering, regardless of how it is described",
            "A legitimate payment processing role",
            "An advance fee scam",
            "A credential harvesting attempt"
          ],
          answer: 0,
          why: "No legitimate company moves client funds through an employee's personal bank account. The transactions are in your name, and the outcome is a frozen account and a laundering investigation."
        },
        {
          type: "scenario",
          scenario: "The same advert says the company is 'setting up local corporate banking and this bridges the gap for the next quarter'.",
          q: "How should you read that explanation?",
          options: [
            "As a cover story, since no real business bridges banking through staff accounts",
            "As a plausible situation for a company entering a new market",
            "As a reason the role is temporary but genuine",
            "As a detail that needs verifying with their finance team"
          ],
          answer: 0,
          why: "It is engineered to explain away the one detail that should stop you. A company that cannot open a bank account cannot legally employ you to use yours instead."
        },
        {
          type: "scenario",
          scenario: "The offer comes from careers@northbridge-digital.recruit-hub.co.",
          q: "Who owns that address?",
          options: [
            "recruit-hub.co, since the real domain is the part before the first single slash",
            "northbridge-digital.com",
            "Both companies jointly",
            "It cannot be determined from the address"
          ],
          answer: 0,
          why: "Everything to the left of the real domain is a subdomain the attacker can name anything, including a real company's name. Read domains from the right."
        },
        {
          type: "scenario",
          scenario: "A recruiter names your actual portfolio project, praises it specifically, and offers to skip the first screening round because of your background.",
          q: "What is the skipped step doing?",
          options: [
            "Removing the conversation where the approach would fall apart",
            "Genuinely reflecting your seniority",
            "Speeding up a competitive hiring process",
            "Reducing the company's recruitment costs"
          ],
          answer: 0,
          why: "Flattery lowers scrutiny more reliably than money does, and skipping a step is framed as a compliment. The removed step is the one involving a second human being."
        },
        {
          type: "scenario",
          scenario: "To proceed, you must complete a skills assessment on their portal and sign in with your Google account so the results attach to your profile.",
          q: "What is the assessment for?",
          options: [
            "Nothing. The sign-in page is the entire attack",
            "Filtering candidates before interview",
            "Verifying your identity for payroll",
            "Testing whether you can follow instructions"
          ],
          answer: 0,
          why: "There is no legitimate reason for a recruitment process to want your email credentials, so this needs no further analysis. Whoever controls your email controls every password reset you own."
        },
        {
          type: "scenario",
          scenario: "Two payments have already passed through your account for a 'payment operations' role before you realised what it was.",
          q: "What should you do?",
          options: [
            "Stop immediately and contact your bank yourself to explain what happened",
            "Return the money to the sender and cut contact quietly",
            "Wait to see whether the bank notices",
            "Close the account and open a new one elsewhere"
          ],
          answer: 0,
          why: "Going to the bank first is a materially better position than waiting for them to come to you. Stopping late is still stopping, and it is always better than finishing."
        },
        {
          type: "knowledge",
          q: "Why do job scams land hardest on freelancers between contracts?",
          options: [
            "Wanting the outcome to be real lowers scrutiny, and that state is predictable",
            "Freelancers have weaker email security",
            "Recruiters rarely contact employed people",
            "Contract gaps are visible on public profiles"
          ],
          answer: 0,
          why: "Attackers target states rather than people. Being taken in reflects timing rather than judgement, which is worth remembering if it happens to you."
        },
        {
          type: "knowledge",
          q: "What does a legitimate hiring process never do?",
          options: [
            "Charge you for training, equipment, certification, or a background check",
            "Ask for a portfolio or work samples",
            "Request a video interview",
            "Ask about your availability and rate"
          ],
          answer: 0,
          why: "Employers pay you, not the reverse. Any fee to be hired is an advance fee scam regardless of what it is called."
        },
        {
          type: "knowledge",
          q: "When does a real employer collect government ID and bank details?",
          options: [
            "After a signed contract, through an HR system",
            "In the first message, to confirm you are a real person",
            "Before the interview, to speed up onboarding",
            "Never, under any circumstances"
          ],
          answer: 0,
          why: "Real employers do need these eventually, which is what makes the early request effective. The timing and the channel are what distinguish it."
        },
        {
          type: "knowledge",
          q: "Why do these approaches move to Telegram or WhatsApp early?",
          options: [
            "Those channels are unmonitored, unreportable, and leave no platform record",
            "They are more secure for sharing documents",
            "Recruiters prefer instant messaging",
            "It avoids email spam filters"
          ],
          answer: 0,
          why: "Moving off-platform removes the professional network's ability to investigate and removes your evidence. It is one of the most reliable signals in this module."
        },
        {
          type: "knowledge",
          q: "What is the fastest useful check before replying to an unsolicited offer?",
          options: [
            "Search the company name plus the word scam, and check their real careers page",
            "Ask the recruiter for a photo of their company ID",
            "Check whether the email has a professional signature",
            "Look at how many connections the recruiter has"
          ],
          answer: 0,
          why: "Thirty seconds resolves a surprising number of these. An ID photo proves nothing, since those are trivially forged."
        },
        {
          type: "knowledge",
          q: "Why is the money mule variant more damaging than losing a password?",
          options: [
            "The transactions are in your name and intent is hard to prove afterwards",
            "The amounts involved are always larger",
            "Bank accounts cannot be reopened once frozen",
            "It cannot be reported to the authorities"
          ],
          answer: 0,
          why: "A stolen password is recoverable. A laundering investigation attaches to you personally, regardless of whether you understood what you were doing."
        },
        {
          type: "knowledge",
          q: "Which recruiter profile pattern is a strong warning sign?",
          options: [
            "Created recently, few connections, no posting history, company page with no other staff",
            "A profile with more than 500 connections",
            "A recruiter who works for an agency rather than the employer",
            "A profile photograph taken professionally"
          ],
          answer: 0,
          why: "Real recruiters have history: activity, connections, and a company page with colleagues. A thin new profile is a signal, though not proof on its own."
        },
        {
          type: "knowledge",
          q: "What is the two-part rule that covers nearly every version of this attack?",
          options: [
            "A real job costs you nothing and never asks for your credentials",
            "Never accept work from overseas companies",
            "Only apply through job boards, never by referral",
            "Always insist on payment before starting work"
          ],
          answer: 0,
          why: "Any offer that inverts either half is not an offer. It is short enough to remember when an approach arrives at a moment you would rather it were real."
        },
        {
          type: "knowledge",
          q: "You sent ID documents before realising the role was fake. What is a sensible follow-up?",
          options: [
            "Record what was sent and when, and watch for accounts opened in your name",
            "Nothing, since ID documents are public information",
            "Report yourself to the credit bureau as compromised",
            "Change your name on official records"
          ],
          answer: 0,
          why: "You cannot un-send them, so the useful actions are documentation and monitoring. Your bank can often flag the account for additional verification."
        }
      ]
    },

    /* ====================================================================
       SECURE CLIENT DATA HANDLING
       ==================================================================== */
    "client-data": {
      title: "Secure Client Data Handling",
      premium: true,
      questions: [
        {
          type: "scenario",
          scenario: "Your real client, on her genuine account, asks you to pull the full customer export from the CRM into your own Drive because their IT have locked external sharing again.",
          q: "What is the best response?",
          options: [
            "Ask which fields she needs and offer to work inside their system instead",
            "Do it, since the request is genuine and she is authorised",
            "Refuse outright and explain it is against best practice",
            "Do it but delete the file at the end of the week"
          ],
          answer: 0,
          why: "This is not an attack, which is exactly why it belongs here. The right answer is a smaller yes: fewer fields, inside their controls, so the data stays somewhere they can audit and revoke."
        },
        {
          type: "scenario",
          scenario: "Six months later your Drive is breached, and it still contains that customer export.",
          q: "Whose storage is the disclosure conversation about?",
          options: [
            "Yours, because the data was outside the client's controls and retention policy",
            "The client's, since it is their customer data",
            "The CRM vendor's, since the data originated there",
            "Nobody's, because you had permission to hold it"
          ],
          answer: 0,
          why: "Permission to access is not the same as responsibility for storage. Once it sits in an account they cannot audit, the questions are about what you did to protect it."
        },
        {
          type: "scenario",
          scenario: "A client offers you the owner-level login for their advertising account so you can manage campaigns.",
          q: "What should you ask for instead?",
          options: [
            "Your own user account with the permissions the work needs",
            "The owner login, but stored in a password manager",
            "A shared login with the password changed monthly",
            "Read-only access, then request changes by email"
          ],
          answer: 0,
          why: "Delegated access can be revoked cleanly, survives their staff changes, and leaves an audit trail. That trail protects you as much as it protects them."
        },
        {
          type: "scenario",
          scenario: "You are asked to install remote-access software so a client's 'IT contractor' can configure your machine for their systems.",
          q: "How should you respond?",
          options: [
            "Refuse, and verify the request with your known contact at the client",
            "Allow it, since the client has authorised their own contractor",
            "Allow it but watch the screen throughout",
            "Install it on a spare device instead"
          ],
          answer: 0,
          why: "Remote-access software hands over full control of the device holding all your other clients' data. Verify through your established contact before anything is installed."
        },
        {
          type: "scenario",
          scenario: "A project closed four months ago. The client's files are still in your Downloads folder and your cloud backup.",
          q: "What does that represent?",
          options: [
            "Pure liability: no upside for you, permanent exposure",
            "Sensible record keeping in case of a dispute",
            "A neutral situation, since the project is finished",
            "An asset you could reuse for similar work"
          ],
          answer: 0,
          why: "Data you no longer need cannot help you and can still leak. Deleting at the end of an engagement, unless asked to retain, is the cheapest risk reduction available."
        },
        {
          type: "scenario",
          scenario: "You realise client data has been exposed through your machine. Your first instinct is to tidy up the folder before telling anyone.",
          q: "Why is that the wrong move?",
          options: [
            "Deleting destroys evidence and looks far worse in hindsight than the incident",
            "It wastes time that should be spent on the disclosure",
            "Cloud backups make deletion pointless anyway",
            "It is not wrong, provided you tell the client afterwards"
          ],
          answer: 0,
          why: "Preserving evidence matters more than looking organised. The timeline of what was accessed and when is exactly what the client and any investigator will ask for."
        },
        {
          type: "knowledge",
          q: "Why is a contractor often the softer route to a company's data?",
          options: [
            "The same data sits on a machine without a security team or monitored logins",
            "Contractors are less trustworthy than employees",
            "Contractors keep data for longer by law",
            "Company networks are rarely protected"
          ],
          answer: 0,
          why: "It is a comment on resources rather than competence. An attacker choosing between a monitored corporate environment and a freelancer's laptop will choose the laptop."
        },
        {
          type: "knowledge",
          q: "Which habit removes the most risk?",
          options: [
            "Collecting less: fewer fields, shorter access, only what the task needs",
            "Encrypting every file individually",
            "Backing up client data to a second cloud provider",
            "Renaming files so their contents are not obvious"
          ],
          answer: 0,
          why: "Data you never held cannot leak from you. This single habit removes more risk than every technical control combined."
        },
        {
          type: "knowledge",
          q: "Why should client work happen inside the client's own systems where possible?",
          options: [
            "It keeps the data inside their controls, retention policy, and audit trail",
            "Their systems are always more secure than yours",
            "It reduces your internet usage",
            "It transfers all legal liability to them"
          ],
          answer: 0,
          why: "Copying data into your personal accounts multiplies the places it can leak from and blurs who is responsible when it does."
        },
        {
          type: "knowledge",
          q: "What is the minimum acceptable separation between client work and personal use?",
          options: [
            "A separate browser profile, with a separate user account being better",
            "A separate folder on the same desktop",
            "A different web browser tab",
            "No separation is needed if you live alone"
          ],
          answer: 0,
          why: "The point is that a household member's download cannot reach client files. A separate user account is free and takes ten minutes; a browser profile is the floor."
        },
        {
          type: "knowledge",
          q: "Why does full-disk encryption matter for a freelancer?",
          options: [
            "Laptops are stolen for the hardware, and an unencrypted one hands over every client file",
            "It prevents malware from running",
            "It is required by the Data Privacy Act for all devices",
            "It speeds up file access"
          ],
          answer: 0,
          why: "BitLocker and FileVault are free and built in. The thief usually wants the hardware, but the data goes with it unless the disk is encrypted."
        },
        {
          type: "knowledge",
          q: "How should credentials be shared with you?",
          options: [
            "Through the platform's permission system, or a password manager's sharing feature",
            "By email, in two separate messages",
            "By chat, deleted immediately afterwards",
            "By phone, so nothing is written down"
          ],
          answer: 0,
          why: "A password in a chat log outlives the conversation by years, and deleted messages are frequently recoverable. Permission systems avoid sharing a secret at all."
        },
        {
          type: "knowledge",
          q: "Client data belonging to other people was exposed. Why must you tell the client immediately?",
          options: [
            "They may have notification obligations with clocks already running",
            "They can delete the data remotely",
            "It transfers responsibility to them",
            "Their insurance requires it within 24 hours"
          ],
          answer: 0,
          why: "In the Philippines the National Privacy Commission may need to be notified. Late discovery removes their ability to meet an obligation they did not know existed."
        },
        {
          type: "knowledge",
          q: "What belongs in your contract about client data?",
          options: [
            "How it is stored, how long you keep it, and what happens at the end",
            "A clause waiving all liability for breaches",
            "A right to reuse the data in your portfolio",
            "Nothing, since it is covered by law already"
          ],
          answer: 0,
          why: "Two or three sentences set expectations before there is a disagreement, and give you a reason to decline a full-export request without it feeling personal."
        },
        {
          type: "knowledge",
          q: "Which sentence summarises this module?",
          options: [
            "Hold as little as possible, for as short a time as possible, in a place the client can see",
            "Encrypt everything and keep a backup of every project",
            "Never accept access to a client's live systems",
            "Store client data only on removable drives"
          ],
          answer: 0,
          why: "Every other practice in the module is a consequence of that sentence, which is why it is worth remembering instead of the list."
        }
      ]
    }
  };

  // Merge into the existing bank so the quiz engine needs no changes.
  window.QUIZ_DATA = window.QUIZ_DATA || {};
  for (var slug in PREMIUM) {
    if (Object.prototype.hasOwnProperty.call(PREMIUM, slug)) {
      window.QUIZ_DATA[slug] = PREMIUM[slug];
    }
  }
})();

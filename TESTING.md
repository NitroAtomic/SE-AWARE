# Testing Matrix for SE Aware

Group 4 · Section S3102 · MO-IT200D1 Capstone 1

Fill in the **Result**, **Tester**, and **Date** columns as you work through each case. The **Auto** column marks cases already verified by the headless Chromium script during development; those still deserve a manual confirmation, but they are not where your time is best spent.

**Automated baseline: 81 of 81 checks passed on the final build.**

| Suite | Checks | Covers |
|---|---|---|
| Free tier | 32 | Page loads, dead links, content, quiz randomisation and scoring, chatbot, login-free access, responsive layout |
| Premium tier | 25 | Registration, login, logout, assessment, dashboard, gating, admin CRUD, guest experience unchanged |
| Deep QA | 24 | Accessibility, duplicate IDs, heading order, WCAG contrast, all five quizzes, video embeds, subpath deployment, content hygiene |

A separate scope test confirms the AI assistant answers 10 of 10 in-scope questions and refuses 10 of 10 out-of-scope ones.

---

## 1. Functional testing (FT)

| ID | Feature | Test description | Expected result | Auto | Result | Tester | Date |
|---|---|---|---|---|---|---|---|
| FT-01 | Module display | Open all six module pages and confirm content loads | All six load with complete content, correct headings, proper formatting | PASS | | | |
| FT-02 | Reading materials | Verify reading material is fully visible with no missing text | All content renders fully and legibly | PASS | | | |
| FT-03 | Embedded videos | Play the embedded video on each module page | Videos load and play without errors | PASS | | | |
| FT-04 | Quiz loading | Complete a module and confirm the quiz is presented | A ten-question quiz appears specific to that module | PASS | | | |
| FT-05 | Quiz randomisation | Take the same quiz twice and compare question order and selection | Questions and option order differ between attempts | PASS | | | |
| FT-06 | Scenario items | Review questions for scenario-based items | Every bank contains scenario items (6 of 15 per module) | PASS | | | |
| FT-07 | Answer validation | Submit correct and incorrect answers | Scoring is accurate; incorrect answers flagged | PASS | | | |
| FT-08 | Safe Practices page | Navigate to Safe Practices and verify content | All eight topics display; no quiz is offered | PASS | | | |
| FT-09 | Chatbot loading | Open the chatbot widget from multiple pages | Widget loads and is accessible from every page | PASS | | | |
| FT-10 | Chatbot response | Submit a cybersecurity question | A coherent, relevant response returns promptly | PASS | | | |
| FT-11 | Navigation | Use every navigation link and button on the site | All links route correctly; no dead ends or 404s | PASS | | | |
| FT-12 | Login-free access | Access all pages and features without an account | Everything remains fully accessible | PASS | | | |


---

## 2. Compatibility testing (CT), manual, on real devices

| ID | Environment | What is tested | Expected result | Result | Tester | Date |
|---|---|---|---|---|---|---|
| CT-01 | Chrome (desktop) | All pages, navigation, quiz, chatbot | All features work; layout renders as designed | | | |
| CT-02 | Edge (desktop) | Repeat CT-01 | All features work; layout renders as designed | | | |
| CT-03 | Firefox (desktop) | Repeat CT-01 | All features work; layout renders as designed | | | |
| CT-04 | Safari (macOS) | Repeat CT-01 | All features work; layout renders as designed | | | |
| CT-05 | Android Chrome | All pages on an Android phone | Mobile layout correct; touch targets usable | | | |
| CT-06 | iOS Safari | Repeat CT-05 on an iPhone | Mobile layout correct; touch targets usable | | | |
| CT-07 | Tablet | Medium screen between breakpoints | Layout adapts; content readable; features work | | | |

Automated viewport checks passed at **360, 768, 1024, and 1440px** with no horizontal overflow on any page. That establishes the layout is sound, but it does not substitute for a real Safari or a real touchscreen, assign CT-01 through CT-07 to team members with different devices.

---

## 2b. Additional feature testing, premium tier (Table 4b)

Run these against the premium prototype. Register first, then work down the list; everything lives in one browser tab.

| ID | Feature | Test description | Expected result | Auto | Result | Tester | Date |
|---|---|---|---|---|---|---|---|
| AU-01 | Registration | Register with a valid email and password | Account created; redirected to the dashboard | PASS | | | |
| AU-01a | Form validation | Submit an invalid form | Field-level errors shown for every invalid field | PASS | | | |
| AU-01b | Credential handling | Inspect session storage after registering | No password present in any form | PASS | | | |
| AU-02 | Login | Log in with a registered email | Authenticated; redirected to the dashboard | PASS | | | |
| AU-02b | Unknown user | Log in with an unregistered email | Clear rejection with a link to register | PASS | | | |
| AU-03 | Logout | Sign out from the account menu | Session cleared; dashboard requires sign-in again | PASS | | | |
| AS-01 | Assessment scoring | Complete the assessment and submit | Score matches the number of correct responses | PASS | | | |
| AS-02 | Level generation | View the assessment result | Beginner / Intermediate / Advanced consistent with the score | PASS | | | |
| DB-01 | Dashboard progress | Complete a module quiz, then open the dashboard | That module shows as Completed | PASS | | | |
| DB-02 | Quiz history | Take several quizzes and review history | Accurate scores and dates, most recent first | PASS | | | |
| PA-01 | Free-tier restriction | As a Free user, open premium modules | Access denied with an upgrade prompt | PASS | | | |
| PA-02 | Premium access | Upgrade, then open premium modules | All four role-based modules accessible | PASS | | | |
| RC-01 | Recommendation | Score deliberately low in one topic | That topic's module is recommended | PASS | | | |
| AIX-01 | AI module recommendation | Ask the chatbot for advice on a described scenario | The relevant module is suggested | | | | |
| AIX-02 | Weak-area display | Complete the assessment with mixed results | Weak areas identified and displayed | PASS | | | |
| AD-01 | Admin login | Sign in to the admin portal | Panel opens; short passwords rejected | PASS | | | |
| AD-02 | Admin content CRUD | Edit module content, then reload | Change persists and is reflected in the list | PASS | | | |
| AD-03 | Admin quiz CRUD | Create and delete a quiz question | Bank count updates correctly | PASS | | | |
| AD-04 | Admin module CRUD | Create, edit, and delete a module | All three operations succeed without errors | PASS | | | |
| FR-07 | Guest unaffected | Browse as a guest with no account | No sign-in prompts anywhere; every free feature works | PASS | | | |

**Note for the panel.** These test the prototype's behaviour, not a production authentication system. AU-01b is the one worth pointing at: the platform deliberately stores no password at all, because modelling client-side credential storage would contradict the content of the Safe Practices module.

---

## 3. AI response testing (AI)

Run these against the **live n8n + Gemini workflow** once `N8N_WEBHOOK_URL` is configured. The offline fallback answers all of them too, which is useful for rehearsal but is not what the panel will be told is running.

| ID | Query type | Sample input | Expected result | Auto | Result | Tester | Date |
|---|---|---|---|---|---|---|---|
| AI-01 | Phishing | "How do I know if an email is a phishing attempt?" | Accurate, on-topic phishing indicators | PASS (fallback) | | | |
| AI-02 | Vishing | "Someone called saying they are from IT and asked for my OTP. What should I do?" | Identifies vishing; gives correct guidance | PASS (fallback) | | | |
| AI-03 | Smishing | "I got a text about a package I need to pay for. Is it safe to click the link?" | Identifies smishing; advises not to click | PASS (fallback) | | | |
| AI-04 | Pretexting | "A new vendor emailed asking for my work login details. Is this normal?" | Recognises pretexting; advises verification | PASS (fallback) | | | |
| AI-05 | Safe practices | "What should I do to stay safe while working remotely?" | Practical, relevant tips for remote workers | PASS (fallback) | | | |
| AI-06 | Out of scope | "Can you write me a poem?" | Declines and redirects to cybersecurity topics | PASS | | | |
| AI-07 | Response time | Any in-scope query, timed | Response within a reasonable time | | | | |
| AI-08 | Workflow integrity | Monitor n8n while submitting queries | Requests route to Gemini and return without errors | | | | |
| AI-09 | Expert validation | Remote workers and cybersecurity professionals review responses | Both groups confirm responses are accurate and usable | | | | |

---

## 4. Accessibility and code quality

| Check | Expected result | Auto | Result | Tester | Date |
|---|---|---|---|---|---|
| JavaScript console | No errors on any page | PASS | | | |
| Same-origin requests | No failed local requests | PASS | | | |
| Image alt text | Every image has meaningful alt text | PASS | | | |
| Heading hierarchy | Levels properly nested, one h1 per page | PASS | | | |
| Keyboard navigation | All controls reachable by Tab, activated by Enter/Space | | | | |
| Focus visibility | Visible focus ring on every interactive element | PASS | | | |
| Touch targets | Minimum 44×44px on all controls | PASS | | | |
| HTML validation | No errors from the W3C validator | | | | |
| Colour contrast | Body text meets WCAG AA | | | | |
| Skip link | "Skip to main content" works on every page | PASS | | | |

---

## 5. Success criteria (from the paper)

| Area | Criterion | Measure | Status |
|---|---|---|---|
| Functional | FT-01 through FT-12 pass without critical failures | Zero unresolved critical bugs at deployment | Met on automated run |
| Compatibility | Renders and works on all tested browsers and devices | No broken layout across CT-01 to CT-07 | Pending manual testing |
| AI Chatbot | Relevant responses in scope; declines out of scope | AI-01 to AI-06 acceptable; AI-07 within limits | Pending live workflow |
| User Acceptance | Testers complete key tasks unaided | Majority report it easy to use and helpful | Pending UAT |
| Accessibility | All content reachable without an account, on any device, free | Confirmed in an unauthenticated session | Met |
| Content Validation | Content reviewed by cybersecurity professionals | Validation confirms accuracy and relevance | Pending review |

---

## 6. Bug log

| # | Page / feature | Description | Severity | Status | Fixed by | Date |
|---|---|---|---|---|---|---|
| 1 | | | | | | |
| 2 | | | | | | |
| 3 | | | | | | |
| 4 | | | | | | |
| 5 | | | | | | |

Severity guide, **Critical**: blocks a core function or loses data. **Major**: a feature works incorrectly. **Minor**: cosmetic or inconvenient. **Trivial**: typo or spacing.

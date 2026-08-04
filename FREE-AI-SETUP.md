# Running the AI Assistant for Free

SE Aware · Group 4, Section S3102 · MO-IT200D1 Capstone 1

You do not need to pay for anything to get the live Gemini assistant working. This guide gives you two free paths and tells you which to pick.

---

## First, the safety net

**The assistant already works.** With no n8n and no API key at all, it answers from a curated knowledge base built into `js/chatbot.js`, covering all six modules and correctly refusing out-of-scope questions.

That means **you cannot end up with a broken chatbot on defence day**. The worst case is that it answers offline rather than live. Set everything up early, but know that the floor is solid.

---

## The two free paths

| | Path A: n8n Cloud trial | Path B: local n8n plus a tunnel |
|---|---|---|
| Cost | Free for 14 days, no card | Free forever |
| Setup time | About 15 minutes | About 40 minutes |
| Public URL | Yes, automatic | Yes, through a free tunnel |
| Works when your laptop is off | Yes | No |
| Difficulty | Easy | Moderate |

**Pick Path A if your defence is within two weeks.** It is the simplest thing that works, and the trial needs no credit card.

**Pick Path B if your defence is further out**, or if you want the platform to keep working after you graduate. Your laptop has to be running during the demo, which it will be anyway since you are presenting from it.

You can also do Path A now to learn the workflow, then move to Path B later. The n8n workflow exports as a JSON file, so you build it once and import it wherever you like.

---

## Step 1: Get a free Gemini API key (both paths)

1. Go to **[Google AI Studio](https://aistudio.google.com/)** and sign in with a Google account.
2. Click **Get API key**, then **Create API key**.
3. Copy it and keep it somewhere safe for now.

Gemini has a free tier that does not require a credit card. Google no longer publishes fixed numbers in the docs, so check your own limits at **AI Studio → Rate limits** and use `gemini-1.5-flash`, which is the cheapest and fastest model and is more than good enough here.

> **Never put this key in `chatbot.js`.** Your repository is public. A key committed to GitHub gets found by automated scanners within hours and used at your expense. It belongs in n8n only. This is worth saying out loud to the panel, because it shows you understood why the architecture routes through n8n instead of calling Google from the browser.

---

# Path A: n8n Cloud free trial

### 1. Start the trial

Go to **[n8n.io](https://n8n.io/)** and sign up. The trial runs **14 days** and asks for no credit card.

**Time it deliberately.** Start it about three days before your defence. That leaves room to test properly without the trial expiring on the day. If you have already used the trial, jump to Path B.

### 2. Build the workflow

Follow **[`N8N-CHATBOT-SETUP.md`](N8N-CHATBOT-SETUP.md)**. It has the three nodes, the JSON contract, the CORS headers, and the full system prompt that locks the assistant to your six topics.

### 3. Copy the Production URL

Activate the workflow with the toggle at the top right, then open the Webhook node and copy the **Production URL**. It looks like:

```
https://your-name.app.n8n.cloud/webhook/se-aware-chat
```

Do not use the Test URL. It only works while the n8n editor is open in your browser, which will fail during the defence.

### 4. Connect the site

In `js/chatbot.js`, near the top:

```js
var N8N_WEBHOOK_URL = "https://your-name.app.n8n.cloud/webhook/se-aware-chat";
```

Bump the asset version so browsers pick up the change. Find `?v=4` across the HTML files and make it `?v=5`. Then commit and push.

### 5. Export a backup

In n8n, open the workflow menu and choose **Download**. Save the JSON into your project folder. When the trial ends you import that one file into a self-hosted instance and everything is exactly as you left it.

---

# Path B: local n8n plus a free tunnel

Free forever. Two pieces: n8n running on your machine, and a tunnel giving it a public HTTPS address so your live site can reach it.

### 1. Install and run n8n

You need **Node.js 18 or newer** from [nodejs.org](https://nodejs.org/). Then, in a terminal:

```bash
npx n8n
```

That is the whole installation. It downloads and starts n8n at **http://localhost:5678**. Leave this terminal window open; closing it stops n8n.

If you would rather use Docker:

```bash
docker run -it --rm -p 5678:5678 -v n8n_data:/home/node/.n8n docker.n8n.io/n8nio/n8n
```

The Docker version keeps your workflows in a named volume, so they survive restarts. Either is fine.

### 2. Understand the problem this creates

Your workflow now lives at `http://localhost:5678`, which means **on this computer**. When someone opens your GitHub Pages site, their browser tries to reach `localhost` and finds *their own* machine, not yours. The request fails.

That is what a tunnel fixes. It gives your local n8n a real public HTTPS address on the internet.

### 3. Install Cloudflare Tunnel

Free, no account needed for a quick tunnel, and no credit card.

**Windows** (in PowerShell):
```powershell
winget install --id Cloudflare.cloudflared
```

**macOS**:
```bash
brew install cloudflared
```

**Linux**: download the binary from [Cloudflare's downloads page](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/).

### 4. Open the tunnel

With n8n still running in its own terminal, open a **second** terminal and run:

```bash
cloudflared tunnel --url http://localhost:5678
```

After a few seconds it prints a public address:

```
https://random-words-here.trycloudflare.com
```

That URL now points at the n8n running on your laptop, over HTTPS, reachable from anywhere.

### 5. Tell n8n its public address

n8n needs to know its external URL so it generates the correct webhook links. Stop n8n, then restart it with the tunnel address:

**Windows PowerShell**
```powershell
$env:WEBHOOK_URL="https://random-words-here.trycloudflare.com"
npx n8n
```

**macOS or Linux**
```bash
WEBHOOK_URL="https://random-words-here.trycloudflare.com" npx n8n
```

### 6. Build the workflow and connect

Same as Path A: follow [`N8N-CHATBOT-SETUP.md`](N8N-CHATBOT-SETUP.md), copy the Production URL, paste it into `js/chatbot.js`, bump `?v=4` to `?v=5`, commit and push.

### The one catch, stated plainly

**A quick tunnel gets a new random URL every time you restart it.** If you close the terminal, the old address dies and the site can no longer reach your workflow.

Two ways to handle that:

- **Simplest:** start the tunnel on the morning of the defence, paste the new URL into `chatbot.js`, push, and hard-refresh. Takes about three minutes. Practise it once beforehand.
- **Permanent:** create a free Cloudflare account and set up a *named* tunnel, which keeps the same address forever. More setup, but you do it once. Cloudflare's docs walk through it.

---

## Defence-day checklist

Print this or keep it open.

- [ ] n8n is running and the workflow is **Active**
- [ ] Tunnel is running, if you are on Path B
- [ ] The URL in `chatbot.js` matches the current webhook URL
- [ ] The change is pushed and the live site hard-refreshed with **Ctrl+Shift+R**
- [ ] Asked the live site one real question and got a live answer
- [ ] Asked it something off-topic and watched it refuse
- [ ] Laptop is on mains power, sleep disabled

**If something breaks five minutes before you start:** do nothing. The assistant falls back to its offline knowledge base automatically and answers every question in your Table 6 test cases correctly. Nobody watching can tell unless you tell them. Fix it afterwards.

---

## What to say to the panel

> "The assistant runs on Google Gemini, orchestrated through an n8n workflow. The browser never talks to Google directly, because that would expose our API key in client-side JavaScript. The scope is enforced in two layers: a topic guard in the browser so off-topic questions never consume quota, and a system prompt in the workflow so the model itself refuses anything outside our six modules. We tested it against twenty questions, ten in scope and ten out, and it handled all twenty correctly."

That answer covers architecture, security reasoning, and testing in three sentences, and every part of it is true.

---

## Cost summary

| Item | Cost |
|---|---|
| Gemini API, free tier | Free |
| n8n Community Edition, self-hosted | Free forever |
| n8n Cloud trial | Free for 14 days, no card |
| Cloudflare Quick Tunnel | Free |
| GitHub Pages hosting | Free |
| **Total** | **Nothing** |

The only thing that ever costs money is n8n Cloud after the trial, at about €20 a month, and Path B avoids that entirely.

Sources: [n8n pricing](https://n8n.io/pricing/) · [n8n cloud free trial docs](https://docs.n8n.io/manage-cloud/cloud-free-trial/) · [Gemini API rate limits](https://ai.google.dev/gemini-api/docs/rate-limits) · [Cloudflare Tunnel downloads](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/)

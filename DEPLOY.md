# Going Live: Deployment Guide

SE Aware · Group 4, Section S3102 · MO-IT200D1 Capstone 1

This site is **static**: plain HTML, CSS, and JavaScript with no server-side code and no database. That makes hosting it free, fast, and permanent. You do not need to buy hosting, run a server, or configure PHP.

**Recommended host: GitHub Pages.** It is free, it never expires, it matches what Chapter III of your paper documents, and your repository doubles as the version-control evidence a panel expects to see.

Total time: about fifteen minutes.

---

## Before you start

One person on the team should own the deployment. Everyone else contributes through that repository. Decide this now, two people creating two repositories is the most common way this gets messy.

You need:

- A **GitHub account** (free, at [github.com](https://github.com))
- The project folder on your computer
- About fifteen minutes

---

# Path A: the web browser (no software to install)

Best if you are not comfortable with the command line yet. Everything happens on github.com.

### 1. Create the repository

1. Sign in to GitHub and click the **+** in the top right → **New repository**.
2. **Repository name:** `se-aware` (lowercase, no spaces. This becomes part of your URL).
3. **Description:** `Web-Based Social Engineering Awareness Platform for Remote Workers, Capstone 1, Group 4 S3102`
4. Set it to **Public**. GitHub Pages requires public repositories on free accounts, and your panel needs to reach it anyway.
5. Do **not** tick "Add a README file", the project already has one.
6. Click **Create repository**.

### 2. Upload the files

1. On the empty repository page, click **uploading an existing file**.
2. Open the unzipped project folder on your computer.
3. Select **everything inside** the folder, `index.html`, `about.html`, all the other `.html` files, and the `css`, `js`, `modules`, and `assets` folders, and drag them into the browser window.

   > **Critical:** upload the *contents* of the folder, not the folder itself. If your repository ends up with a single folder called `se-awareness-platform` inside it, the site will not load. `index.html` must sit at the top level of the repository.

4. Wait for every file to finish uploading. There are 42 of them, including 19 pages.
5. In the **Commit changes** box, write `Initial deployment of SE Aware platform` and click **Commit changes**.

### 3. Turn on GitHub Pages

1. In your repository, click **Settings** (top row).
2. In the left sidebar, click **Pages**.
3. Under **Build and deployment**:
   - **Source:** `Deploy from a branch`
   - **Branch:** `main`
   - **Folder:** `/ (root)`
4. Click **Save**.

### 4. Wait, then visit

Give it one to three minutes. Refresh the Settings → Pages screen and a green banner appears with your address:

```
https://YOUR-USERNAME.github.io/se-aware/
```

That is your live URL. Put it in **Appendix A** of the paper.

> If you see a plain README instead of the site, `index.html` is not at the repository root, go back to step 2.

---

# Path B: Git on the command line

Better if any of you already use Git. It gives you real commit history, which panels do look at, and it makes updating the site a three-command habit instead of a re-upload.

The project folder is already a Git repository with several commits in it, so you only need to connect it to GitHub and push.

```bash
# 1. Move into the project folder
cd path/to/se-awareness-platform

# 2. Connect it to the empty GitHub repository you created in step 1 above
git remote add origin https://github.com/YOUR-USERNAME/se-aware.git

# 3. Make sure the branch is called main
git branch -M main

# 4. Push
git push -u origin main
```

GitHub will ask you to sign in. Use a **personal access token** rather than your password, GitHub stopped accepting passwords for this in 2021. Generate one at **Settings → Developer settings → Personal access tokens → Tokens (classic)**, tick the `repo` scope, and paste the token when prompted for a password.

Then follow **step 3** above to switch Pages on.

### Updating the site afterwards

```bash
git add .
git commit -m "Add phishing module video"
git push
```

The live site updates in about a minute. No re-upload, no re-configuration.

---

## After it is live: five checks

Open your live URL on a phone, not just a laptop. Then confirm:

- [ ] The home page loads with correct styling. If everything looks like unstyled text, the Bootstrap CDN is blocked on your network, try mobile data.
- [ ] All six module pages open from the Modules index.
- [ ] A quiz runs from start to results.
- [ ] The chat bubble opens in the bottom-right corner.
- [ ] The address bar shows a padlock. GitHub Pages gives you HTTPS free.

If any page 404s, check that the file name in the repository matches exactly, GitHub Pages is **case-sensitive**, so `Phishing.html` and `phishing.html` are different files. This is the single most common deployment bug.

---

## Connecting the chatbot on the live site

Until you do this, the assistant answers from its built-in offline knowledge base, which is enough to demo, but it is not the Gemini integration your paper documents.

### 1. Publish your n8n workflow

Activate the workflow and copy the **Production** webhook URL (not the Test URL, the test one only works while the n8n editor is open, which will embarrass you mid-defence).

### 2. Allow your site's origin (CORS)

This is the step everyone forgets, and it fails silently. In the n8n **Webhook** node, open **Options** and add response headers:

```
Access-Control-Allow-Origin: https://YOUR-USERNAME.github.io
Access-Control-Allow-Methods: POST, OPTIONS
Access-Control-Allow-Headers: Content-Type
```

Your n8n workflow must also answer the browser's `OPTIONS` preflight request. In n8n, set the Webhook node's HTTP method to accept both `POST` and `OPTIONS`, or enable the built-in CORS option if your version has one.

Without this, the browser blocks the reply and the widget falls back to offline answers. You will see a CORS error in the browser console (F12 → Console), that is your confirmation of what went wrong.

### 3. Paste the URL

Edit `js/chatbot.js`, line 30-ish:

```js
var N8N_WEBHOOK_URL = "https://your-n8n-instance.app.n8n.cloud/webhook/se-aware-chat";
```

Commit and push (or re-upload that one file). Test on the live site, not just locally.

### 4. Keep the API key server-side

Your Gemini key belongs in the n8n workflow only. **Never** put it in `chatbot.js`, a public repository plus client-side JavaScript means anyone can read it, and Google will bill you for their usage. This is also a point worth making to the panel: it shows you understood *why* the architecture routes through n8n rather than calling Google directly.

---

## Adding the module videos

For each of the six module pages, find this near the bottom of the file:

```js
var MODULE_VIDEO_ID = "";
```

Paste the YouTube ID between the quotes. From `https://www.youtube.com/watch?v=dQw4w9WgXcQ`, the ID is `dQw4w9WgXcQ`, the part after `watch?v=`, nothing else.

Commit, push, done. Leave it empty and the page shows a tidy placeholder instead of breaking.

---

## Browser caching after an update

If you push a change and the live site still looks old, the browser is serving a cached stylesheet. Every CSS and JS link on this site carries a version marker for exactly that reason:

```html
<link rel="stylesheet" href="css/style.css?v=3">
```

**Whenever you change `style.css` or anything in `js/`, bump that number.** It appears in `ASSET_VERSION` if you regenerate the pages, or you can find-and-replace `?v=3` with `?v=4` across the HTML files. Changing it makes every browser treat the file as new.

To check what a visitor is actually seeing, open the site in a private window, or hard-refresh with **Ctrl+Shift+R** (**Cmd+Shift+R** on a Mac). GitHub Pages itself also caches assets for about ten minutes, so allow for that before assuming something is broken.

---

## Optional: a custom domain

Not required, and not worth spending money on for a capstone. If you want one anyway:

1. Buy a domain (`.com` runs roughly ₱600–900 per year; `.site` and `.online` are often under ₱200 for the first year).
2. In **Settings → Pages → Custom domain**, enter it and save.
3. At your registrar, add a `CNAME` record pointing `www` to `YOUR-USERNAME.github.io`, and four `A` records for the root domain pointing at `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`.
4. Wait for DNS to propagate, usually under an hour, then tick **Enforce HTTPS**.

Check GitHub's current documentation before you buy, since those IP addresses do change occasionally.

---

## Other hosts, if GitHub Pages is blocked

All three are free and take a static folder. GitHub Pages remains the recommendation because it matches your paper.

| Host | How | Note |
|---|---|---|
| **Netlify** | Drag the folder onto [app.netlify.com/drop](https://app.netlify.com/drop) | Live in about thirty seconds, no account needed to start |
| **Cloudflare Pages** | Connect the same GitHub repository | Very fast globally, generous free tier |
| **Vercel** | Import the GitHub repository | Built for apps; fine for static sites too |

Netlify Drop is genuinely useful the night before a defence: if GitHub Pages is misbehaving, you can have a working backup URL in under a minute.

---

## Things worth knowing before the panel asks

**"Where is the database?"** There isn't one, and that is the design. The free tier stores nothing because it collects nothing. The premium tier is a prototype using session-only browser storage, and `js/store.js` documents the exact API endpoint each function would call once the Node.js and MySQL backend exists. Say it plainly. It is a stronger answer than an empty database schema.

**"Is it secure?"** GitHub Pages serves everything over HTTPS with a free certificate. There is no server to attack, no database to inject into, and no user data to leak. The only credential in the system is the Gemini API key, and that lives server-side in n8n. For a static awareness site, this is genuinely the right architecture rather than a compromise.

**"What if it goes down?"** GitHub Pages has a soft limit of 100 GB of bandwidth per month and 10 builds per hour. A capstone project will not approach either. There is no billing attached to a free account, so it cannot be switched off for non-payment.

**"Can you update it after submission?"** Yes, push a commit and the site rebuilds in about a minute. That also means you can keep improving it right up to the defence, which is worth doing.

---

## Deployment checklist

- [ ] One team member owns the repository
- [ ] Repository is **public** and named clearly
- [ ] `index.html` sits at the **root**, not inside a subfolder
- [ ] Pages is enabled from `main` / `/ (root)`
- [ ] The live URL loads with styling, on a phone as well as a laptop
- [ ] All 18 pages reachable, no 404s
- [ ] A quiz completes and shows results
- [ ] n8n production webhook URL is in `chatbot.js`
- [ ] CORS headers set in n8n for your Pages origin
- [ ] Gemini API key is **not** anywhere in the repository
- [ ] Six video IDs pasted in
- [ ] Live URL added to **Appendix A** of the paper
- [ ] All five team members added as repository collaborators

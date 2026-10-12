# Artist portfolio website

A free website with its own editor. After a one-time setup, she edits everything at
**yoursite.com/admin**, from a phone or a computer. She can add photos, change prices,
mark pieces sold, and edit text. Each save goes live in about a minute.

**Cost: $0.** Everything below uses free plans. A custom domain such as `yournameart.com`
is optional and costs about $12 a year.

| Piece | What it does | Service (free) |
|---|---|---|
| GitHub | Stores the site files and keeps a history of every change | github.com |
| Cloudflare Pages | Hosts the site and republishes it after each save | cloudflare.com |
| Sveltia CMS | The editor at `/admin` | open source, already included |
| Sveltia login helper | Lets her sign in to the editor with GitHub | runs on her Cloudflare account |
| Web3Forms | Emails her the commission requests | web3forms.com |

---

## One-time setup (about 30–45 minutes, done once by you)

Create the accounts in **her** name so she owns them. You can be added as a helper later.

### 1. Put the site on GitHub
1. Create a free account at github.com.
2. Click **New repository** and name it `artist-website`. Make it **Public** or Private (either works).
3. On the new repository page, click **uploading an existing file**. Drag in everything in this folder
   (`index.html`, `styles.css`, `script.js`, and the `admin`, `content` and `images` folders), then click **Commit changes**.
   GitHub's web page can skip empty folders. That's fine, because `images/uploads` is created automatically on her first upload.
   *(GitHub Desktop is an alternative to dragging files in.)*

### 2. Host it on Cloudflare Pages
1. Create a free account at cloudflare.com.
2. Go to **Workers & Pages → Create → Pages → Connect to Git**, then pick the `artist-website` repository.
3. For **Framework preset**, choose *None*. Leave **Build command** empty and set **Build output directory** to `/`. Click **Deploy**.
4. The site is now live at something like `artist-website.pages.dev`. *(Optional: under **Custom domains**, connect a domain you've bought.)*

### 3. Set up the editor login
1. Open github.com/sveltia/sveltia-cms-auth and click **Deploy to Cloudflare**. Copy the worker address it gives you,
   e.g. `https://sveltia-cms-auth.yourname.workers.dev`.
2. On GitHub, go to **Settings → Developer settings → OAuth Apps → New OAuth App** and fill in:
   - Homepage URL: your site's address, e.g. `https://artist-website.pages.dev`
   - Authorization callback URL: the worker address followed by `/callback`
   - Click **Register application**, then **Generate a new client secret**.
3. In Cloudflare, open the `sveltia-cms-auth` worker, go to **Settings → Variables**, and add:
   - `GITHUB_CLIENT_ID`: the Client ID from GitHub
   - `GITHUB_CLIENT_SECRET`: the client secret (click **Encrypt**)
   - `ALLOWED_DOMAINS`: your site's hostname, e.g. `artist-website.pages.dev`

   Then click **Deploy**.
4. On GitHub, open `admin/config.yml`, click the pencil icon, and replace the three `YOUR-...` values:
   - `repo`: her GitHub username followed by `/artist-website`
   - `base_url`: the worker address
   - `site_url`: the site address

   Click **Commit changes**.

> **Shortcut if step 3 is a hassle:** skip it. On the editor's login screen, click **Sign In with Token** and paste a
> GitHub *fine-grained personal access token* that has **Contents: Read and write** access to the `artist-website`
> repository. It works fine, but the token expires and has to be replaced every so often, so the login helper is
> nicer for her long-term.

### 4. Connect the commission form
1. At web3forms.com, enter the email address that should receive requests. They'll email you an access key.
2. On GitHub, open `script.js`, click the pencil icon, and paste the key into `const FORM_ACCESS_KEY = "";` at the top.
   Click **Commit changes**.

### 5. Hand it over
Go to `yoursite/admin` on her phone and computer, sign in with GitHub once, and bookmark it
(on a phone, use **Add to Home Screen**).

---

## How she uses it

1. Go to **yoursite.com/admin** and pick **Website**.
2. Choose a section: **Gallery, Shop, Commissions, Classes, Books,** or **About & contact**.
3. **Add a piece:** click **Add Artwork** (or **Add Piece**), drop in a photo, type a title, and pick a category.
4. **Mark something sold:** go to **Shop**, open the piece, and turn on **Sold**.
5. Click **Save**. The site updates within about a minute.

Details she doesn't need to think about:
- Photos straight from her phone are fine. The editor resizes them, converts them to fast-loading WebP,
  and gives them tidy file names.
- Anything without a photo shows a painted placeholder.
- Items can be dragged to reorder them. New ones go at the top.
- Every save is kept in GitHub's history, so any mistake can be undone.

## Selling work
- In Stripe (free to set up, fees only per sale), create a **Payment Link** for a piece and paste it into
  that piece's **Payment link** box. Its button becomes **Buy now**.
- Pieces without a payment link show **Inquire**, which opens the request form with the piece's details already filled in.

## Files (for whoever maintains the site)
- `content/*.json`: all the text and picture choices. The editor writes these files.
- `admin/config.yml`: which fields the editor shows.
- `index.html`, `styles.css`, `script.js`: the page layout, look, and behavior.
- To preview locally, run `python3 -m http.server` in this folder and open http://localhost:8000.
  Opening `index.html` directly won't load the content.

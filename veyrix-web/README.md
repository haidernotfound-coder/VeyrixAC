# Veyrix website + license admin panel

Marketing site, license key server, and admin panel for the Veyrix
anticheat plugin. Built with Next.js (App Router), Tailwind, and Neon
Postgres. Deploys straight to Vercel.

## What this is

- **`/`** — public marketing page (checks, licensing explanation, roadmap).
- **`/admin`** — password-gated admin panel: generate/revoke/delete license
  keys, see total & active installs, see per-key last-seen.
- **`/api/activate`** and **`/api/heartbeat`** — called by the plugin
  itself (see the modified `LicenseManager.java` / new
  `LicenseApiClient.java` in the plugin project) so installs and
  revocations sync between the plugin and this site.

The plugin's own offline HMAC signature check is still the real gate —
this website is additive. If the website is down, the plugin fails open
(keeps running); it does not fail open on the *offline* check itself,
only on this website being unreachable.

## 1. Deploy to Vercel

```bash
npm i -g vercel   # if you don't have it
vercel             # from this folder, follow prompts
```

Or push this folder to a GitHub repo and import it in the Vercel
dashboard (New Project → import repo).

## 2. Attach a Postgres database

In the Vercel project → **Storage** tab → **Create Database** → choose
**Neon** (Postgres). This automatically sets the `DATABASE_URL`
environment variable for you. The app creates its own tables on first
request (see `lib/db.ts` — `ensureSchema()`), so there is no separate
migration step.

## 3. Set environment variables

Project Settings → Environment Variables:

| Variable | Value |
|---|---|
| `LICENSE_SECRET_HEX` | **Must exactly match** `LicenseSecret.VALUE` in the plugin's Java source (the 64-char hex string). If you haven't replaced the placeholder in `LicenseSecret.java` yet, generate one now with `openssl rand -hex 32`, put it in both places, and rebuild the plugin jar. |
| `ADMIN_PASSWORD` | Whatever password you want to log into `/admin` with. |
| `ADMIN_SESSION_SECRET` | Any long random string, e.g. `openssl rand -hex 32`. Used to sign the admin session cookie. |

`DATABASE_URL` is set automatically by step 2.

Redeploy after setting these (Vercel → Deployments → ⋯ → Redeploy), since
env vars only apply to new deployments.

## 4. Point the plugin at your deployed URL

In the plugin's `config.yml`:

```yaml
license-api:
  base-url: "https://your-project.vercel.app"
```

Leave it blank (default) to keep the plugin fully offline with no
website integration at all.

## 5. Generate your first key

Go to `https://your-project.vercel.app/admin`, log in with
`ADMIN_PASSWORD`, and use "Generate a license key". Copy the key
immediately — it's only shown once in the UI (it is stored as the literal
string in the database so the plugin's activation call can match it, so
treat the admin panel and your database credentials as sensitive).

Give that key string to whoever is running the server; they activate it
in-game with `/veyrix license <key>`.

## Local development

```bash
npm install
cp .env.local.example .env.local   # fill in the values
npm run dev
```

You'll still need a real `DATABASE_URL` (e.g. a free Neon project) to
exercise the key-storage/admin features locally — the plugin-facing
endpoints and the admin panel both need Postgres.

## Notes on the licensing model

- Keys are `VEYRIX-<payload>-<signature>`, HMAC-SHA256 signed, matching
  `LicenseKey.java` and `KeygenTool.java` byte-for-byte (see
  `lib/license.ts`). A key made by the CLI `KeygenTool` still works and
  will "self-register" here on first activation.
- Revoking a key in the admin panel takes effect the next time that
  server's plugin calls `/api/heartbeat` (every 15 minutes by default) or
  on its next restart — not instantly, since the plugin can't be pushed
  to.
- Deleting a key removes it and its install history permanently; revoking
  is usually what you want instead, since it keeps the history.

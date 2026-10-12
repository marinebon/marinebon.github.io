# Feedback endpoint (Google Sheet + mail + GitHub issue)

The **Send feedback** button in the footer (`static/js/feedback.js`, dialog and annotator;
`static/css/feedback.css`) POSTs to a Google Apps Script bound to a Google Sheet. The script is
`scripts/feedback.gs` in this repo: the site's own copy, so the site and its deployment can be changed by
anyone with access to this repo and the Sheet, without the Ocean Metrics repos it descends from.

**Status: deployed 2026-10-12.** Sheet "marinebon.org feedback" (Google account ben@ecoquants.com), web app
`marinebon_feedback`, deployment `AKfycbxp4Njdb3zYiUpu-H41DDRmJoi846McqWyPZGjz3gpsryyiIApZFfPPF6ex3YMW1nrc`:

```
https://script.google.com/macros/s/AKfycbxp4Njdb3zYiUpu-H41DDRmJoi846McqWyPZGjz3gpsryyiIApZFfPPF6ex3YMW1nrc/exec
```

The URL is the repo's Actions variable `VITE_FEEDBACK_URL`; `.github/workflows/deploy.yml` passes it to Hugo
as `HUGO_FEEDBACK_URL`, and `layouts/partials/footer.html` writes it into the button's `data-endpoint`
(`params.feedback_url` in `hugo.yaml` wins when set; it is left empty on purpose).

## What one submission does

The dialog POSTs one JSON body as `text/plain` (a CORS simple request; the script answers no OPTIONS):

```
{ app: "marinebon-org", kind: "feedback", text, email?, url, viewport, theme, user_agent, image?, website }
```

- `app` picks the repository and branch from the script's `APPS` map (`marinebon-org` →
  `marinebon/marinebon.github.io`, `main`). An unknown `app` is refused.
- `email` is optional. It goes to the Sheet row and the mail only; the public issue never carries it.
- `image` is the annotated screenshot as a `data:image/png;base64,…` URL (fitted to about 3 MB by the dialog;
  the script refuses more than 6 MB decoded).
- `website` is the script's honeypot key and must be empty. **The dialog has no honeypot input** and always
  sends `""`: Chrome autofill filled a hidden trap together with the email (named `website`, then
  `xq_note_check` with `autocomplete="off"`), and the script dropped a person's feedback as spam. Bots post
  to the script directly, never through the dialog, so the trap caught nobody. Autofilling the email is
  welcome.

The script then, each step on its own and reported into the row's `status` column:

1. saves the screenshot to the Drive folder `marinebon-org feedback` beside the Sheet (or under
   `DRIVE_FOLDER_ID`);
2. opens an issue in the repo, labelled with the kind, with the screenshot committed as
   `feedback/<id>.png` on `main` (needs the token; without it `status` says `issue skipped`);
3. appends a row to the `feedback` tab (the one place the email is stored, besides the mail);
4. mails everyone in the `recipients` tab (screenshot inline; `Reply-To` is the submitter's email when given)
   and sends the submitter their own copy when they gave an email.

Limits: 20 submissions per hour, text 4000 characters, screenshot 6 MB decoded.

## Setup (once)

1. **Create the Sheet** with two tabs:
   - `feedback`: row 1 exactly the header in `scripts/feedback.gs`'s `FEEDBACK_HEADER`:
     `ts, id, app, kind, title, text, email, url, release, version, sha, lens, viewport, theme, user_agent, website, image_url, issue_url, status`.
   - `recipients`: `A1 = email`, then one address per row from `A2`. Add or delete rows later to change who is
     mailed; no redeploy.
2. **Extensions > Apps Script**, delete the stub, paste all of `scripts/feedback.gs` as `Code.gs`.
3. **Project Settings > Script properties**:
   - `GITHUB_TOKEN_MARINEBON`: a fine-grained personal access token (Settings > Developer settings) with
     **Contents: Read and write** and **Issues: Read and write** on `marinebon/marinebon.github.io`. The
     script looks up `GITHUB_TOKEN_<OWNER>` for a repo's owner first and the plain `GITHUB_TOKEN` otherwise.
     Without a token the Sheet and mail still work and `status` says `issue skipped: no GITHUB_TOKEN`.
   - `DRIVE_FOLDER_ID` (optional): a Drive folder for the screenshot folder.
4. **Deploy > New deployment > Web app**, execute as **Me**, who has access **Anyone**. Authorise when asked
   (Sheets, Drive, Mail, external requests). Copy the `/exec` URL. Opening it in a browser must answer
   `{"ok":true,"endpoint":"marinebon-feedback","apps":["marinebon-org"],"rows":…,"recipients":…,"github":["marinebon-org"]}`;
   an HTML page there means the deployment is wrong (not public, not authorised, a stale version).
5. **Give the site the URL**: Settings > Secrets and variables > Actions > Variables, add `VITE_FEEDBACK_URL`
   (a variable, not a secret: it ships in the public page). Re-run *Deploy MBON site to GitHub Pages* or push.
   An unset variable is the empty string, which the dialog treats as "no endpoint": Send is disabled and
   **Open as GitHub issue myself** is the only path.
6. **Re-paste `scripts/feedback.gs` after any change** to it, then Deploy > Manage deployments > edit > New
   version (the `/exec` URL stays the same). There is no build step for Apps Script.

Screenshot commits (`feedback/<id>.png`) land on `main`; the deploy workflow rebuilds the site on every push,
so each one triggers a deploy. Keep `feedback/` out of Hugo's content (it is at the repo root, which Hugo
ignores).

## When "Sent" shows but nothing arrives

- **The dialog only trusts the script's JSON receipt** (`{"ok":true,…}`). A 200 with any other body (Google's
  HTML error or sign-in page) is shown as "Not sent: the endpoint answered with a page instead of a receipt".
  Google answers such pages when the deployment is not public, needs authorisation, points at a stale version,
  or hits its transient "unable to open the file at this time" error.
- **A honeypot receipt** (`{"ok":true,"skipped":"honeypot"}`) is shown as "Not sent: the endpoint dropped it
  as spam (a hidden field was filled, usually by browser autofill)". The dialog no longer has that input, so
  this can only come from a changed `feedback.js` that reintroduces one; do not.
- **Script side**: Apps Script editor → **Executions** lists every `doPost` with its status and log. A GET of
  the `/exec` URL must return the JSON status line. From a shell, follow Google's redirect the way a browser
  does: `curl -L --data '{"app":"marinebon-org","kind":"feedback","text":"test","website":""}' <url>`
  (no `-X POST`: that re-POSTs to the redirect target and gets a 405 although the script already ran).

## Testing without touching the deployment

In the browser console on any page of the site:

```js
localStorage['marinebon-org.feedback_url'] = 'https://script.google.com/macros/s/.../exec';
```

reload, send a report; `localStorage.removeItem('marinebon-org.feedback_url')` undoes it. The configured
endpoint wins over this key when both are set.

## Privacy statement (what the dialog tells the visitor)

> What is sent: your text, this page's URL, the viewport, the theme, your browser's user-agent string and
> the screenshot, nothing else. It goes to the MBON team by mail and is filed as a public issue in
> marinebon/marinebon.github.io labelled feedback. Your email, if you give one, is never part of the public
> issue.

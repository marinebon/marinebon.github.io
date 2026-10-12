// feedback.gs -- the "Send feedback" endpoint of marinebon.org (static/js/feedback.js). One Apps
// Script, bound to one Google Sheet ("marinebon.org feedback"), takes the dialog's POST, files a public
// GitHub issue in this repo, keeps a row in the Sheet and mails the recipients. Runbook: docs/feedback.md.
// This is the site's own copy of the Ocean Metrics script (oceanmetrics/erddap-places
// scripts/feedback/Code.gs, 2026-10-12), so the site and its deployment can be changed without them; it
// descends from MarineSensitivity/atlas and CalCOFI's generator (calcofi4r/R/feedback.R).
//
// What one submission does (each step is independent; a failure is written to the row's `status`):
//   1. the screenshot (optional) to a Drive folder ("marinebon-org feedback", beside the Sheet),
//   2. a GitHub issue in the repo APPS maps the payload's `app` to, labelled with the kind, the
//      screenshot committed as feedback/<id>.png on that branch (needs the token below),
//   3. a row in the `feedback` tab -- the ONE place the submitter's optional email is written down
//      (besides the mail below); the issue body never carries it,
//   4. mail to everyone in the `recipients` tab, the screenshot inline, and a copy to the submitter
//      when they gave an email.
//
// Deploy: Extensions > Apps Script in the Sheet, paste this file as Code.gs, Deploy > New deployment
// > Web app, execute as "Me", who has access "Anyone". Put the /exec URL in the repo variable
// VITE_FEEDBACK_URL (docs/feedback.md). Re-paste and "New version" after any change here.
//
// Tabs: `feedback` (header = FEEDBACK_HEADER below) and `recipients` (A1 = "email", one address per
// row -- edit a cell to add or remove someone, no redeploy).
//
// Script properties: GITHUB_TOKEN_MARINEBON (a fine-grained token with Contents + Issues, read and
// write, on marinebon/marinebon.github.io) enables the public issue; the lookup is
// GITHUB_TOKEN_<OWNER> (the repo owner, upper case) first, then the plain GITHUB_TOKEN, so another
// app under another owner can be added to APPS with its own token. DRIVE_FOLDER_ID (optional;
// default: a folder beside the Sheet).
//
// CORS: the dialog POSTs `text/plain` JSON so the request stays a simple request (this endpoint
// answers no OPTIONS, so a JSON preflight would be dropped). Spam: a honeypot (payload key `website`,
// must be empty; it catches scripts that post every field), a cap per hour (MAX_PER_HOUR), and an unknown
// `app` is refused. (The site's dialog sends website: "" and has no trap input: autofill filled it.)

// the apps this deployment serves: the payload's `app` -> repository and branch of the public issue.
// To add one, add a row, give its owner a token (GITHUB_TOKEN_<OWNER>), re-paste, New version.
var APPS = {
  "marinebon-org": { repo: "marinebon/marinebon.github.io", branch: "main" },
};
var FEEDBACK_HEADER = [
  "ts",
  "id",
  "app",
  "kind",
  "title",
  "text",
  "email",
  "url",
  "release",
  "version",
  "sha",
  "lens",
  "viewport",
  "theme",
  "user_agent",
  "website",
  "image_url",
  "issue_url",
  "status",
];
var KINDS = { bug: 1, idea: 1, question: 1, data: 1, feedback: 1, product: 1 };
var DEFAULT_KIND = "feedback";
var MAX_PER_HOUR = 20;
var MAX_TEXT = 4000;
var MAX_TITLE = 200;
var MAX_IMAGE_BYTES = 6 * 1024 * 1024;

// Health check: a GET answers {ok:true,...} so the deployment can be verified at a glance.
function doGet(e) {
  try {
    var sh = _tab("feedback");
    return _json({
      ok: true,
      endpoint: "marinebon-feedback",
      apps: Object.keys(APPS),
      rows: sh.getLastRow() - 1,
      recipients: _recipients().length,
      github: Object.keys(APPS).filter(function (a) {
        return !!_token(a);
      }),
    });
  } catch (err) {
    return _json({ ok: false, error: String(err) });
  }
}

function doPost(e) {
  try {
    var b = JSON.parse(e.postData.contents || "{}");
    if (b.website) return _json({ ok: true, skipped: "honeypot" }); // a bot filled the hidden field
    var app = String(b.app || "");
    if (!APPS.hasOwnProperty(app)) return _json({ ok: false, error: "unknown app" });
    if (!b.text || !String(b.text).trim()) return _json({ ok: false, error: "empty text" });
    if (_rateLimited(app)) return _json({ ok: false, error: "rate limited: try again in an hour" });

    var id = Utilities.getUuid().replace(/-/g, "").slice(0, 10);
    var ts = new Date();
    var kind = _kind(b.kind);
    var text = String(b.text).slice(0, MAX_TEXT);
    var title = String(b.title || "").slice(0, MAX_TITLE);
    var email = String(b.email || "").trim();
    if (!/^[^@\s]+@[^@\s]+$/.test(email)) email = "";
    var image_url = "";
    var issue_url = "";
    var status = [];
    var bytes = null;
    var mime = "image/png";
    var ext = "png";

    // 1. the screenshot to Drive (the team's copy; the issue embeds its own from the repo)
    if (b.image && /^data:image\/(png|jpeg);base64,/.test(b.image)) {
      bytes = Utilities.base64Decode(b.image.split(",")[1]);
      if (bytes.length <= MAX_IMAGE_BYTES) {
        if (/^data:image\/jpeg/.test(b.image)) {
          ext = "jpg";
          mime = "image/jpeg";
        }
        try {
          var f = _folder(app).createFile(
            Utilities.newBlob(bytes, mime, _stamp(ts) + "_" + id + "." + ext),
          );
          image_url = f.getUrl();
          status.push("image");
        } catch (err) {
          status.push("drive failed: " + String(err).slice(0, 80));
        }
      } else {
        bytes = null;
        status.push("image too large");
      }
    }

    // 2. the public issue (before the row, so the row can carry its URL)
    if (_token(app)) {
      try {
        issue_url = _openIssue(app, id, ts, b, kind, title, text, bytes, ext);
        status.push("issue");
      } catch (err) {
        status.push("issue failed: " + String(err).slice(0, 120));
      }
    } else {
      status.push("issue skipped: no GITHUB_TOKEN");
    }

    // 3. the row -- every FEEDBACK_HEADER column, `email` included
    var row = {
      ts: ts,
      id: id,
      app: app,
      kind: kind,
      title: title,
      text: text,
      email: email,
      url: String(b.url || "").slice(0, 8000),
      release: b.release || "",
      version: b.version || "",
      sha: b.sha || "",
      lens: b.lens || "",
      viewport: b.viewport || "",
      theme: b.theme || "",
      user_agent: b.user_agent || "",
      website: "",
      image_url: image_url,
      issue_url: issue_url,
      status: "",
    };
    var sh = _tab("feedback");

    // 4. the mail -- the screenshot inline (cid) so the annotated view is in the message itself
    var to = _recipients();
    var subject = "[" + app + "] " + kind + ": " + (title || text.split("\n")[0]).slice(0, 80);
    var inline = bytes ? { shot: Utilities.newBlob(bytes, mime, "view." + ext) } : null;
    var html =
      "<p><b>" +
      _esc(kind) +
      "</b>" +
      (title ? ": " + _esc(title) : "") +
      "</p>" +
      "<p>" +
      _esc(text).replace(/\n/g, "<br>") +
      "</p>" +
      (inline
        ? '<p><img src="cid:shot" alt="the view" style="max-width:100%;border:1px solid #ccc"></p>'
        : "") +
      (b.sentence ? "<p><b>Showing:</b> " + _esc(String(b.sentence).slice(0, 300)) + "</p>" : "") +
      (row.url
        ? '<p><b>View:</b> <a href="' + _esc(row.url) + '">' + _esc(row.url) + "</a></p>"
        : "") +
      "<p><b>App:</b> " +
      _esc(app) +
      " " +
      _esc(row.version) +
      " " +
      _esc(row.sha) +
      "<br><b>Data:</b> " +
      _esc(row.release) +
      "<br>" +
      _esc(row.lens) +
      " · " +
      _esc(row.viewport) +
      " · " +
      _esc(row.theme) +
      "<br>" +
      (row.email ? "<b>From:</b> " + _esc(row.email) + "<br>" : "") +
      (image_url ? '<b>Screenshot:</b> <a href="' + _esc(image_url) + '">Drive</a><br>' : "") +
      (issue_url
        ? '<b>Issue:</b> <a href="' + _esc(issue_url) + '">' + _esc(issue_url) + "</a><br>"
        : "") +
      "<b>Sheet row id:</b> " +
      id +
      "</p>";
    if (to.length) {
      try {
        var mail = {
          to: to.join(","),
          subject: subject,
          htmlBody: html,
          name: "MBON feedback",
        };
        if (row.email) mail.replyTo = row.email;
        if (inline) mail.inlineImages = inline;
        MailApp.sendEmail(mail);
        status.push("mailed " + to.length + (inline ? " (screenshot inline)" : ""));
      } catch (err) {
        status.push("mail failed: " + String(err).slice(0, 80));
      }
    }
    // 4b. the sender's own copy (a separate message: the recipients list stays private)
    if (row.email) {
      try {
        var copy = {
          to: row.email,
          subject: "Your " + app + " feedback: " + (title || text.split("\n")[0]).slice(0, 80),
          htmlBody:
            "<p>Thanks, we received this. It went to the team" +
            (issue_url
              ? ' and is public issue <a href="' +
                _esc(issue_url) +
                '">' +
                _esc(issue_url) +
                "</a> (your email is not in it)"
              : "") +
            ".</p>" +
            html.replace(/<b>From:<\/b>[^<]*<br>/, ""),
          name: "MBON feedback",
        };
        if (inline) copy.inlineImages = { shot: Utilities.newBlob(bytes, mime, "view." + ext) };
        MailApp.sendEmail(copy);
        status.push("copied to sender");
      } catch (err) {
        status.push("sender copy failed: " + String(err).slice(0, 80));
      }
    }

    row.status = status.join("; ");
    sh.getRange(sh.getLastRow() + 1, 1, 1, FEEDBACK_HEADER.length).setValues([
      FEEDBACK_HEADER.map(function (c) {
        return row[c] === undefined ? "" : row[c];
      }),
    ]);

    return _json({
      ok: true,
      id: id,
      image_url: image_url,
      issue_url: issue_url,
      status: row.status,
    });
  } catch (err) {
    return _json({ ok: false, error: String(err) });
  }
}

// an unrecognized kind from a hand-crafted request falls back rather than filing an issue under an
// arbitrary label.
function _kind(k) {
  return KINDS.hasOwnProperty(k) ? k : DEFAULT_KIND;
}

// the public issue: the view URL (if the reporter opted in), the text, the release/lens/viewport
// line, and the screenshot committed under feedback/<id>.<ext> on the app's branch. The submitter's
// email is NEVER passed in here -- it stays in the Sheet/mail only.
function _openIssue(app, id, ts, b, kind, title, text, bytes, ext) {
  var repo = APPS[app].repo;
  var branch = APPS[app].branch;
  var api = "https://api.github.com/repos/" + repo;
  var headers = {
    Authorization: "Bearer " + _token(app),
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  var img = "";
  if (bytes && bytes.length) {
    var path = "feedback/" + id + "." + ext;
    var put = UrlFetchApp.fetch(api + "/contents/" + path, {
      method: "put",
      headers: headers,
      contentType: "application/json",
      muteHttpExceptions: true,
      payload: JSON.stringify({
        message: "feedback " + id + ": screenshot",
        content: Utilities.base64Encode(bytes),
        branch: branch,
      }),
    });
    if (put.getResponseCode() < 300) {
      img = "\n\n![view](https://raw.githubusercontent.com/" + repo + "/" + branch + "/" + path + ")";
    }
  }
  var issueTitle = (title || text.split("\n")[0]).slice(0, 100);
  var body =
    (b.url ? "**View:** " + b.url + "\n" : "") +
    (b.sentence ? "**Showing:** " + String(b.sentence).slice(0, 300) + "\n" : "") +
    "**Data:** " +
    (b.release || "not loaded") +
    " · " +
    (b.lens || "") +
    " · " +
    (b.viewport || "") +
    " · " +
    (b.theme || "") +
    "\n**App:** " +
    app +
    " " +
    (b.version || "") +
    "\n\n" +
    text +
    img +
    "\n\n_Sent from the " +
    app +
    " feedback dialog · " +
    ts.toISOString() +
    " · id " +
    id +
    "_";
  var res = UrlFetchApp.fetch(api + "/issues", {
    method: "post",
    headers: headers,
    contentType: "application/json",
    muteHttpExceptions: true,
    payload: JSON.stringify({ title: issueTitle, body: body, labels: [kind] }),
  });
  if (res.getResponseCode() >= 300) {
    throw new Error("GitHub " + res.getResponseCode() + ": " + res.getContentText().slice(0, 200));
  }
  return JSON.parse(res.getContentText()).html_url;
}

// the token for an app's repo: GITHUB_TOKEN_<OWNER> if set, else GITHUB_TOKEN
function _token(app) {
  var owner = APPS[app].repo.split("/")[0].toUpperCase().replace(/[^A-Z0-9]/g, "_");
  return _prop("GITHUB_TOKEN_" + owner) || _prop("GITHUB_TOKEN");
}
function _recipients() {
  var sh = _tab("recipients");
  if (!sh || sh.getLastRow() < 2) return [];
  return sh
    .getRange(2, 1, sh.getLastRow() - 1, 1)
    .getValues()
    .map(function (r) {
      return String(r[0]).trim();
    })
    .filter(function (v) {
      return /^[^@\s]+@[^@\s]+$/.test(v);
    });
}
function _rateLimited(app) {
  var cache = CacheService.getScriptCache();
  var key = "fb:" + app + ":" + Math.floor(Date.now() / 3600000);
  var n = parseInt(cache.get(key) || "0", 10) + 1;
  cache.put(key, String(n), 3600);
  return n > MAX_PER_HOUR;
}
// one Drive folder per app ("<app> feedback"), under DRIVE_FOLDER_ID or beside the Sheet
function _folder(app) {
  var id = _prop("DRIVE_FOLDER_ID");
  var parent;
  if (id) {
    parent = DriveApp.getFolderById(id);
  } else {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var parents = DriveApp.getFileById(ss.getId()).getParents();
    parent = parents.hasNext() ? parents.next() : DriveApp.getRootFolder();
  }
  var it = parent.getFoldersByName(app + " feedback");
  return it.hasNext() ? it.next() : parent.createFolder(app + " feedback");
}
function _tab(name) {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
}
function _prop(k) {
  return PropertiesService.getScriptProperties().getProperty(k);
}
function _stamp(d) {
  return Utilities.formatDate(d, "UTC", "yyyyMMdd_HHmmss");
}
function _esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
function _json(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(
    ContentService.MimeType.JSON,
  );
}

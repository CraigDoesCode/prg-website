# Sending sign-ups to a Google Sheet

The holding page can POST straight into a Google Sheet using a Google Apps Script Web App.
No account, no third-party service, no limits worth worrying about for a holding page.

## 1. Make the sheet

Create a new Google Sheet. Name it something obvious, e.g. "Launch sign-ups".
You do not need to add headers - the script writes them on the first submission.

## 2. Add the script

In the sheet: **Extensions → Apps Script**. Delete whatever is in `Code.gs` and paste this:

```js
const SHEET_NAME = 'Signups';

function doPost(e) {
  const lock = LockService.getScriptLock();

  // Two people submitting at the same instant would otherwise race for the same row.
  try {
    lock.waitLock(20000);
  } catch (err) {
    return json({ ok: false, error: 'busy' });
  }

  try {
    const book = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = book.getSheetByName(SHEET_NAME) || book.insertSheet(SHEET_NAME);

    if (sheet.getLastRow() === 0) {
      sheet.appendRow(['Timestamp', 'Email', 'Source']);
      sheet.setFrozenRows(1);
    }

    const params = (e && e.parameter) || {};
    const email = String(params.email || '').trim().toLowerCase();

    // Honeypot: a real person never sees this field, so anything in it is a bot.
    // Answer as though it worked, and write nothing.
    if (String(params.company || '').trim()) {
      return json({ ok: true });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      return json({ ok: false, error: 'invalid email' });
    }

    // Skip an address that is already on the list rather than writing it twice.
    const existing = sheet.getLastRow() > 1
      ? sheet.getRange(2, 2, sheet.getLastRow() - 1, 1).getValues().map(row => String(row[0]).trim().toLowerCase())
      : [];

    if (existing.indexOf(email) === -1) {
      sheet.appendRow([new Date(), email, String(params.source || '').slice(0, 120)]);
    }

    return json({ ok: true });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function json(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

// Health check. Open the /exec URL in a browser: if you see this JSON, the
// live deployment is running the current code. Bump VERSION whenever you
// redeploy, so you can tell at a glance whether the deploy actually took.
const VERSION = '1';

function doGet() {
  return json({ ok: true, version: VERSION, handler: 'doGet' });
}
```

## 3. Deploy it

**Deploy → New deployment → ⚙ → Web app**, then:

| Setting | Value |
| --- | --- |
| Execute as | **Me** (your account) |
| Who has access | **Anyone** |

"Anyone" is required - the page posts without a Google login. Google will ask you to authorise
the script the first time; the "unverified app" warning is expected for your own script, and
you get past it with **Advanced → Go to (project name)**.

Copy the **Web app URL**. It ends in `/exec`.

## 4. Paste the URL into the page

In `index.html`, on the sign-up form:

```html
<form class="signup" id="signup" data-endpoint="https://script.google.com/macros/s/AKfy.../exec" novalidate>
```

That is the only change needed. While `data-endpoint` is empty the form does not pretend to
work - it tells people to email instead.

## 5. Redeploying after an edit

**This is the step that catches everyone.** Apps Script serves a frozen *snapshot*, not the
code in your editor. Saving the file changes nothing about what the live URL runs.

To publish an edit:

1. Save the script first - **⌘S**. A new version snapshots what is saved, not what is on screen.
2. **Deploy → Manage deployments**.
3. Click the **✏ pencil** on the existing deployment.
4. Open the **Version** dropdown - it will be showing the old version - and pick **New version**.
5. **Deploy**.

The URL stays the same, so nothing in `index.html` needs to change.

### Checking whether a deploy actually took

Open the `/exec` URL in a browser tab:

| What you see | What it means |
| --- | --- |
| `{"ok":true,"version":"1","handler":"doGet"}` | The live deployment is running your code |
| `Script function not found: doGet` | The deployment is still on an old, empty version - redo step 5 |
| A Google sign-in page | "Who has access" is not set to **Anyone** |

If you keep seeing `Script function not found` after making a new version, the URL probably
belongs to a different Apps Script project than the one you have been editing. Check that the
project was opened from **inside the sheet** via Extensions → Apps Script, and that
`SpreadsheetApp.getActiveSpreadsheet()` therefore has a sheet to bind to. As a last resort,
**Deploy → New deployment** always publishes current code - but it issues a new URL, which you
will need to paste into `data-endpoint` again.

## Things to know

- **The URL is public.** It is in the page source, so anyone can find it and post to it. The
  honeypot stops ordinary bots; determined spam would need a rethink. Watch the sheet for a
  week after launch.
- **No preflight.** The page sends the body as `application/x-www-form-urlencoded`, which is a
  CORS-safelisted content type. Apps Script does not answer `OPTIONS` requests, so sending JSON
  would trigger a preflight and fail. Do not "helpfully" change it to `application/json`.
- **This is storage, not a mailing list.** A sheet cannot send your launch announcement, handle
  unsubscribes, or prove consent. When you are ready to email people, export the column into a
  proper tool. Under UK GDPR and PECR you need consent and a working unsubscribe before you send.
- **Add a privacy line.** You are collecting personal data as a charitable company. A sentence
  under the field saying what you will use the address for, linking to a privacy notice, is the
  minimum.

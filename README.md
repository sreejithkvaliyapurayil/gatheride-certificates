> **MULTI-OPERATOR UPDATE:** This version supports 2–3 named operators identified by their Google-account email addresses. See [MULTI_USER_ACCESS.md](MULTI_USER_ACCESS.md) to update your EXISTING private Apps Script without resetting the certificate sequence.

# GATHERIDE — Certificate Portfolio Desk

A professional, printable capital contribution certificate system for **GATHERIDE CREATIONS LLP**. Portfolio sequence begins at **0006**. Contribution amount is fixed at **₹5,00,000**.

## What is included

- `index.html`, `styles.css`, `script.js`, `config.js`, `setup.html` — polished GitHub Pages entry website.
- `appsscript/Code.gs` — private Google Apps Script server: Google Sheets storage, identity approval, unique certificate numbers and sequential portfolio numbers.
- `appsscript/Certificate.html` — restricted four-field issuance console and A4 print certificate design.
- `appsscript/OperatorAccess.gs` — private server-side approved-operator allowlist; run `configureAuthorizedOperators()` as owner.
- `appsscript/appsscript.json` — optional Apps Script configuration (Asia/Kolkata).
- `tests/validation.test.js` — local smoke tests of server input validation.

**Important:** GitHub Pages serves static files. It cannot itself safeguard private DPIN/PAN data or perform trustworthy duplicate checks. The actual issuance form runs in authenticated Google Apps Script using `google.script.run` to communicate directly with the secure backend.

## Get started

1. Open `setup.html` locally or visit it in your GitHub Pages site. Follow the detailed instructions.
2. Copy `appsscript/Code.gs` and `appsscript/Certificate.html` into a new project at <https://script.google.com>.
3. Run `setup()` in the Apps Script editor. It creates a **private Google Sheet** with three tabs: `Certificates`, `Verified_Partners`, `Audit_Log`. Get its URL from the Apps Script Execution log.
4. Manually approve valid partners inside `Verified_Partners`: Registered Name, ID Type (`PAN`/`DPIN`), DPIN/PAN, Status=`APPROVED`, Verified By, Verified On, Evidence Ref. Keep leading zeroes in DPIN; the column is formatted as text.
5. **For multiple authorized operators:** follow `MULTI_USER_ACCESS.md`. Deploy as **User accessing the web app**, access **Anyone with a Google account**, with the server-side allowlist configured and the private Sheet shared only with trusted operator accounts. Do NOT simply change the deployment setting without enabling the allowlist.
6. Put the `/exec` URL in **`config.js`** on the GitHub Pages website and commit. The `Launch secure console` button activates.
7. Open the private console. The four fields are: **Name, DPIN/PAN, Date, Certificate No**. Portfolio number is assigned automatically from `0006`.
8. A correct-format **but unapproved** DPIN/PAN is **rejected**. The submit call repeats uniqueness checks while holding `LockService` before writing to Google Sheets. Printing is enabled only after the save succeeds.

## Business rules

| Rule | Implementation |
|---|---|
| Starting portfolio | 0006 on an empty register; after that increases and is never intentionally reused |
| Certificate number | `GCL/CC/YYYY/0006`, editable; must be unique and match issue year |
| Identity format | PAN: 10-character pattern with valid holder category; DPIN: exactly 8 digits |
| Identity authenticity | Requires preapproval **and** evidence in the private `Verified_Partners` sheet. Actual registry verification is done by a human; no official PAN/MCA verification API is connected. |
| Name | Must match the registered legal name, ignoring extra spaces / case |
| Partner duplicates | A second issued certificate for the same DPIN/PAN is blocked; use reprint. |
| Issue date | Cannot be future-dated |
| Contribution | Fixed at ₹5,00,000; not editable |
| Issue / duplicate writes | Serialized by `LockService`; an existing number or identity is rejected before append |
| Reprints | Reuse the existing issued row; recorded in `Audit_Log`, not treated as a new issue |
| Certificate status | All successful issuance rows recorded as `ISSUED` |

## Privacy and access

- **Never deploy** the backend as anonymous or public with **Execute as me**; that would grant strangers the ability to invoke backend functions with the owner's Google Drive permissions.
- In this multi-user release, require Google sign-in AND the private `OperatorAccess.gs` allowlist on every server call. Do not use anonymous access. Each operator must have appropriate Sheet permissions when running as the accessing user.
- Do not publish the private Google Sheet. Share it only with authorized operators; note that Editors can manually change the Sheet, bypassing the web form. A stronger separate-service backend is required for tamper-resistant issuance.
- DPIN/PAN values are not placed in the GitHub Pages website or in a URL/query string.
- The web app's HTTPS `/exec` address is not a password. Access is enforced by Google's deployment permissions.
- A visual certificate **is not an electronic signature or government-issued certificate**. No signature image or official company seal is fabricated.
- Legal drafting should be reviewed by LLP counsel prior to production. It records the agreed contribution and does not prove payment or guarantee returns.

## Edit / update later

- Visual website changes: edit root `index.html`/`styles.css`, commit GitHub; Pages redeploys.
- Issuance certificate design or backend rules: edit the Apps Script project and use **Deploy → Manage deployments → Edit → New version → Deploy**. Editing the GitHub repository alone does **not** update the existing Apps Script web app.
- Verified partner records: update the restricted Google Sheet; no code deployment required.
- The Apps Script project stores the Google Sheet ID in Script Properties; no secrets or live credentials are stored in this ZIP.

## Checks and limitations

This package has been statically validated locally. Live Google identity verification, Apps Script authorization, and GitHub publishing **cannot** be completed solely by uploading these files; the administrator must complete deployment and grant access in their own Google account. Always issue a real certificate only after the investor has been admitted as a partner under the appropriate LLP documentation.

# GATHERIDE — 2–3 Authorized Certificate Operators

This update is for your **existing** GitHub Pages + Google Apps Script certificate portal. It does not create a new certificate register or reset portfolio number 0006.

## Before you start

- Record the **Google-account email addresses** of the two or three operators. Display names are NOT authentication.
- Choose only trusted operators: the practical Apps Script setup below needs to run as **User accessing the web app**, so each operator will need Editor access to the private Google Sheet.
- The operator list is stored in Apps Script **Script Properties** (private to the script), not in GitHub or the public website.
- Keep the Google Apps Script project itself private: never add operators as script editors.

## Update existing Apps Script project

1. In Apps Script, open the existing **GATHERIDE Certificate Issuance** project.
2. Replace the contents of `Code.gs` with the updated `appsscript/Code.gs` from this ZIP. The existing `Certificate.html` can remain unchanged.
3. In the Apps Script Files pane, select **+** -> **Script** and create `OperatorAccess.gs`.
4. Copy the contents of `appsscript/OperatorAccess.gs` into the new file.
5. **Recommended for reliable email identification:** In Apps Script **Project Settings**, enable **Show `appsscript.json` manifest file**. Set the manifest to the bundled `appsscript/appsscript.json` (which explicitly requests Sheets and the signed-in email scopes). Save.
6. In `OperatorAccess.gs`, replace the commented placeholders in `OPERATOR_EMAILS` with real email addresses. **Include the owner account as well as the 2–3 operators**. Example:
   ```js
   const OPERATOR_EMAILS = [
     'your-own-google-account@example.com',
     'operator-one@example.com',
     'operator-two@example.com'
   ];
   ```
   These addresses are **examples only**, not real users. Do not paste real identities in public GitHub files. Edit the private Apps Script project instead.
7. Save. Select `configureAuthorizedOperators` in the function dropdown and click **Run** while signed into the Apps Script **owner's** account. Approve authorization if prompted. Confirm `Authorized operator access list saved` in Execution log.
8. From the spreadsheet URL already shown by your successful original `setup()` run, open the **GATHERIDE — Capital Contribution Certificate Register**.
9. Click **Share** and grant each of the approved operators **Editor** permission, without making the Sheet public. This is needed because their Google Apps Script functions execute as their own identity. Do not share the Apps Script source project with operators.
10. In Apps Script choose **Deploy → Manage deployments → Edit (pencil icon)** for the existing web app; change **Execute as: User accessing the web app** and **Who has access: Anyone with a Google account**. Choose **New version → Deploy**. If Google does not allow editing these settings on the existing deployment, make a new web-app deployment and update `config.js` with its new `/exec` URL.
11. Ask each operator to open the exact `/exec` URL in Safari/Chrome while logged in to their authorized Google account. They may need to approve Google OAuth permissions the first time.

**IMPORTANT:** In this configuration, the setting “Anyone with a Google account” is only the Google sign-in gate. The `assertAuthorized_()` function also enforces a server-side allowlist on **every** call before reading or writing certificates. Do not switch the deployment to **Anyone, even anonymous**.

## Add / revoke an operator later

- Edit `OPERATOR_EMAILS` inside the PRIVATE Apps Script project.
- Save and rerun `configureAuthorizedOperators()` as the owner. Changes to Script Properties apply without a new deployment.
- Share the private Sheet to newly authorized people. Remove Google Sheet sharing for revoked operators.
- For changes to the `Code.gs` or `OperatorAccess.gs` *logic*, deploy a **new version**; changing only the operator list stored in Script Properties does not require redeployment.

## Test checklist

- Owner opens certificate console and sees the next portfolio (0006 for a new register).
- Approved operator 1 signs in and can load dashboard / issue only approved partner identities.
- Approved operator 2 signs in and can load dashboard / issue only approved partner identities.
- A different Google account is rejected with **Access denied**.
- Browser with no Google identity is blocked; blank emails fail closed.
- Try duplicate certificate number: **rejected**; no new row added.
- Try DPIN/PAN not in Verified_Partners: **rejected**; no new row added.
- A successful approved issuance is saved before printing, and audit includes the actual operator email.
- The next portfolio after an issuance increments without reusing any number.

## Important security limitations

- Anyone given Editor access to the register can also modify its contents manually outside the web app. Thus, server-side web-form checks **cannot guarantee the Sheet is tamper-proof** from a trusted editor. For formal production-grade issuance, use an independent backend that writes using a service identity while operators have no direct editor access to the ledger, and implement backups and independent audits.
- Neither a PAN/DPIN pattern check nor an APPROVED row is a government authenticity check. Verify KYC/admission documents before approval.
- Google accounts signed in simultaneously on mobile may cause Google identity confusion; a browser profile signed into only the approved account is usually more reliable.
- Do not treat a generated certificate as a payment receipt, guarantee, or independently verified partner admission.

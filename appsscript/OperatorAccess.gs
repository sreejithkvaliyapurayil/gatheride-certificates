/**
 * GATHERIDE — Restricted operator roster
 *
 * This file belongs in the PRIVATE Google Apps Script project, NOT in client HTML.
 * All sign-in identities are matched on their complete Google-account EMAIL ADDRESS;
 * display names alone are not sufficient authentication.
 *
 * SETUP
 * 1) Edit OPERATOR_EMAILS below, including the deploying owner's email.
 * 2) Save, select configureAuthorizedOperators, and Run AS THE OWNER in the editor.
 * 3) Do not share edit access to this Apps Script project with operators.
 * 4) Deploy Web app as "User accessing the web app", access "Anyone with Google account".
 * 5) Share the PRIVATE certificate register with only these trusted operators as Editors,
 *    otherwise user-executed scripts cannot write to it.
 *
 * To revoke access, remove the email, run configureAuthorizedOperators again,
 * and revoke their Google Sheet permission. The allowlist takes effect immediately.
 */
const OPERATOR_EMAILS = [
  // Add the deploying Google-account address and two or three trusted operators.
  // 'owner@gmail.com',
  // 'operator1@gmail.com',
  // 'operator2@gmail.com',
];

const OPERATOR_PROPERTY = 'GATHERIDE_AUTHORIZED_OPERATOR_EMAILS_V1';

/** Owner-only setup in the Apps Script editor. Not a public web-app action. */
function configureAuthorizedOperators() {
  const editor = String(Session.getEffectiveUser().getEmail() || '').trim().toLowerCase();
  const owner = String(PropertiesService.getScriptProperties().getProperty('GATHERIDE_APP_OWNER_EMAIL') || '').trim().toLowerCase();
  // On the first run the owner is frozen; never run this function as an operator.
  if (owner && owner !== editor) throw new Error('Only the registered owner may configure the operator roster.');
  if (!editor) throw new Error('Could not identify the Google account in the script editor.');
  const emails = [...new Set(OPERATOR_EMAILS.map(v => String(v || '').trim().toLowerCase()).filter(Boolean))];
  if (emails.length < 2) throw new Error('Add the owner and at least one operator email to OPERATOR_EMAILS.');
  if (!emails.includes(editor)) throw new Error('Add the owner account (' + editor + ') to the list before saving.');
  if (emails.some(v => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v))) {
    throw new Error('Every authorized operator must be a valid Google-account email address.');
  }
  const props = PropertiesService.getScriptProperties();
  if (!owner) props.setProperty('GATHERIDE_APP_OWNER_EMAIL', editor);
  props.setProperty(OPERATOR_PROPERTY, JSON.stringify(emails));
  Logger.log('Authorized operator access list saved: ' + emails.length + ' accounts.');
  Logger.log('IMPORTANT: Use Execute as USER ACCESSING, and share the certificate register with these operators as Editors.');
  return 'Authorized accounts: ' + emails.length;
}

/** Authorizes *each* call. Deliberately fails closed on blank Google identity. */
function assertAuthorized_() {
  const actor = String(Session.getActiveUser().getEmail() || '').trim().toLowerCase();
  if (!actor) {
    throw new Error('Google identity unavailable. Deploy as User accessing the web app and sign in with an approved Google account.');
  }
  const raw = PropertiesService.getScriptProperties().getProperty(OPERATOR_PROPERTY);
  if (!raw) throw new Error('Operator access is not configured. Run configureAuthorizedOperators() as the owner.');
  let emails;
  try { emails = JSON.parse(raw); } catch(e) { throw new Error('Operator access configuration invalid. Contact the administrator.'); }
  if (!Array.isArray(emails) || !emails.includes(actor)) {
    throw new Error('Access denied. Your Google account is not authorized for GATHERIDE certificate issuance.');
  }
  return actor;
}

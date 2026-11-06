/**
 * GATHERIDE CREATIONS LLP — Secure Certificate Issuance
 * Deploy only to a trusted, authenticated audience.
 * Backend is Google Apps Script, not GitHub Pages.
 * Never publish the Google Sheet or store identities in the GitHub repo.
 */
const SETTINGS = Object.freeze({
  SPREADSHEET_PROPERTY: 'GATHERIDE_CERTIFICATE_SHEET_ID',
  START_PORTFOLIO: 6,
  CERT_PREFIX: 'GCL/CC',
  FIXED_AMOUNT_INR: 500000,
  AMOUNT_WORDS: 'Rupees Five Lakhs Only',
  CERT_SHEET: 'Certificates',
  PEOPLE_SHEET: 'Verified_Partners',
  AUDIT_SHEET: 'Audit_Log',
  TZ: 'Asia/Kolkata',
});

const CERT_HEADERS = [
  'Portfolio No', 'Certificate No', 'Issue Date', 'Partner Name',
  'Identity Type', 'DPIN / PAN', 'Contribution (INR)', 'Amount in Words',
  'Issued At (IST)', 'Record Status', 'Verification Evidence Ref',
  'Approved By', 'Issued By', 'Record Fingerprint'
];
const PEOPLE_HEADERS = [
  'Registered Name', 'ID Type', 'DPIN / PAN', 'Status',
  'Verified By', 'Verified On', 'Evidence Ref', 'Notes'
];
const AUDIT_HEADERS = ['Recorded At (IST)', 'Action', 'Certificate No', 'Portfolio No', 'Result', 'Actor', 'Notes'];

/** Run ONCE in the Apps Script editor. Creates a private Google Sheet in your Drive. */
function setup() {
  const props = PropertiesService.getScriptProperties();
  let id = props.getProperty(SETTINGS.SPREADSHEET_PROPERTY);
  const ss = id ? SpreadsheetApp.openById(id) : SpreadsheetApp.create('GATHERIDE — Capital Contribution Certificate Register');
  ensureSheet_(ss, SETTINGS.CERT_SHEET, CERT_HEADERS);
  ensureSheet_(ss, SETTINGS.PEOPLE_SHEET, PEOPLE_HEADERS);
  ensureSheet_(ss, SETTINGS.AUDIT_SHEET, AUDIT_HEADERS);
  // Keep identifiers as plain text: leading zeroes in DPIN must never be lost.
  ss.getSheetByName(SETTINGS.CERT_SHEET).getRange('A:B').setNumberFormat('@');
  ss.getSheetByName(SETTINGS.CERT_SHEET).getRange('F:F').setNumberFormat('@');
  ss.getSheetByName(SETTINGS.PEOPLE_SHEET).getRange('C:C').setNumberFormat('@');
  ss.getSheetByName(SETTINGS.CERT_SHEET).getRange('G:G').setNumberFormat('₹#,##0');
  props.setProperty(SETTINGS.SPREADSHEET_PROPERTY, ss.getId());
  Logger.log('REGISTER URL: ' + ss.getUrl());
  Logger.log('NEXT: Enter each approved partner into Verified_Partners with APPROVED status and evidence reference.');
  return ss.getUrl();
}

function ensureSheet_(ss, name, headers) {
  let sh = ss.getSheetByName(name);
  if (!sh) {
    const initial = ss.getSheets()[0];
    sh = (ss.getSheets().length === 1 && initial.getLastRow() === 0 && initial.getName() === 'Sheet1')
      ? initial.setName(name) : ss.insertSheet(name);
  }
  if (!sh.getLastRow()) {
    sh.getRange(1, 1, 1, headers.length).setValues([headers]);
    sh.getRange(1, 1, 1, headers.length)
      .setBackground('#112B43').setFontColor('#FFFFFF')
      .setFontWeight('bold').setVerticalAlignment('middle');
    sh.setFrozenRows(1);
    sh.setRowHeight(1, 36);
    sh.setColumnWidths(1, headers.length, 180);
    sh.setColumnWidth(4, 245);
    if (name === SETTINGS.PEOPLE_SHEET) {
      sh.getRange('D2:D1000').setDataValidation(SpreadsheetApp.newDataValidation()
        .requireValueInList(['PENDING', 'APPROVED', 'REJECTED'], true).build());
    }
  }
  return sh;
}

function doGet() {
  assertAuthorized_();
  return HtmlService.createHtmlOutputFromFile('Certificate')
    .setTitle('GATHERIDE | Secure Certificate Issuance')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function spreadsheet_() {
  const id = PropertiesService.getScriptProperties().getProperty(SETTINGS.SPREADSHEET_PROPERTY);
  if (!id) throw new Error('Administrator setup is incomplete. Run setup() in the Apps Script editor.');
  return SpreadsheetApp.openById(id);
}

function currentDate_() {
  return Utilities.formatDate(new Date(), SETTINGS.TZ, 'yyyy-MM-dd');
}
function currentTimestamp_() {
  return Utilities.formatDate(new Date(), SETTINGS.TZ, 'yyyy-MM-dd HH:mm:ss');
}
function currentActor_() {
  return assertAuthorized_();
}
function pad_(n) { return String(n).padStart(4, '0'); }
function cleanName_(raw) {
  const v = String(raw == null ? '' : raw).trim().replace(/\s+/g, ' ');
  if (v.length < 3 || v.length > 120 || /^[=+@-]/.test(v) || !/^[\p{L}\p{M} .,'’&()\-]+$/u.test(v)) {
    throw new Error('Enter a valid partner name (3–120 letters/characters; no formulas or symbols).');
  }
  return v;
}
function keyName_(raw) { return String(raw || '').trim().replace(/\s+/g, ' ').toUpperCase(); }
function classifyId_(raw) {
  const id = String(raw == null ? '' : raw).trim().toUpperCase().replace(/\s/g, '');
  if (/^\d{8}$/.test(id)) return {type:'DPIN', value:id};
  // The fourth character reflects the holder category per Income Tax PAN structure.
  if (/^[A-Z]{3}[PCHABGJLFT][A-Z][0-9]{4}[A-Z]$/.test(id)) return {type:'PAN', value:id};
  throw new Error('Invalid format. Enter an 8-digit DPIN or a 10-character PAN with a valid holder-category character.');
}
function cleanCertificateNo_(raw) {
  const v = String(raw == null ? '' : raw).trim().toUpperCase().replace(/\s/g, '');
  if (!/^GCL\/CC\/20\d{2}\/\d{4,6}$/.test(v)) {
    throw new Error('Certificate number must follow GCL/CC/YYYY/0006 (four to six serial digits).');
  }
  return v;
}
function cleanDate_(raw) {
  const s = String(raw || '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) throw new Error('Select a valid issue date.');
  const d = new Date(s + 'T00:00:00.000Z');
  if (Number.isNaN(d.getTime()) || d.toISOString().slice(0,10) !== s) throw new Error('Invalid calendar date.');
  if (s > currentDate_()) throw new Error('Issue date cannot be in the future.');
  return s;
}
function validateDraft_(payload) {
  if (!payload || typeof payload !== 'object') throw new Error('Missing certificate details.');
  const name = cleanName_(payload.name);
  const identity = classifyId_(payload.identity);
  const issueDate = cleanDate_(payload.date);
  const certNo = cleanCertificateNo_(payload.certificateNo);
  if (certNo.split('/')[2] !== issueDate.slice(0, 4)) {
    throw new Error('Certificate number year must match the issue-date year.');
  }
  return {name, identity, issueDate, certNo};
}
function certRows_(ss) {
  const sh = ss.getSheetByName(SETTINGS.CERT_SHEET);
  if (!sh) throw new Error('Certificate register is not initialized.');
  const end = sh.getLastRow();
  return end < 2 ? [] : sh.getRange(2, 1, end - 1, CERT_HEADERS.length).getDisplayValues();
}
function nextPortfolio_(rows) {
  const highest = rows.reduce(function(n, row) {
    const k = Number(String(row[0]).trim());
    return Number.isInteger(k) ? Math.max(n, k) : n;
  }, SETTINGS.START_PORTFOLIO - 1);
  // This counter survives accidental row deletion so previously used numbers are not reused.
  const stored = Number(PropertiesService.getScriptProperties().getProperty('LAST_PORTFOLIO') || 0);
  return Math.max(SETTINGS.START_PORTFOLIO - 1, highest, stored) + 1;
}
function identityApproved_(ss, name, id) {
  const sheet = ss.getSheetByName(SETTINGS.PEOPLE_SHEET);
  if (!sheet) throw new Error('Verification register is missing.');
  const n = sheet.getLastRow();
  if (n < 2) throw new Error('Identity is not yet verified. Add and approve the partner in the private Verified_Partners sheet.');
  const records = sheet.getRange(2, 1, n - 1, PEOPLE_HEADERS.length).getDisplayValues();
  const matches = records.filter(row => String(row[2] || '').trim().toUpperCase().replace(/\s/g,'') === id.value);
  if (!matches.length) throw new Error('DPIN/PAN has not been approved in the private verification register.');
  if (matches.length > 1) throw new Error('Duplicate identity records exist in Verified_Partners. An administrator must resolve them.');
  const r = matches[0];
  if (keyName_(r[0]) !== keyName_(name)) throw new Error('Name does not match the approved DPIN/PAN record.');
  if (String(r[1]).trim().toUpperCase() !== id.type) throw new Error('Identity type does not match the approved record.');
  if (String(r[3]).trim().toUpperCase() !== 'APPROVED' || !String(r[4]).trim() || !String(r[6]).trim()) {
    throw new Error('Partner approval or supporting verification evidence is incomplete.');
  }
  return {verifiedBy:r[4], evidenceRef:r[6]};
}
function makeFingerprint_(values) {
  const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, values.join('|'));
  return bytes.map(b => ('0' + (b & 255).toString(16)).slice(-2)).join('').slice(0,16).toUpperCase();
}
function formatRecord_(row) {
  return {
    portfolio: String(row[0]), certificateNo: String(row[1]), date: String(row[2]),
    name: String(row[3]), identityType: String(row[4]), identity: String(row[5]),
    amount: Number(String(row[6]).replace(/[^0-9.]/g, '')) || SETTINGS.FIXED_AMOUNT_INR,
    amountWords: String(row[7]), issuedAt: String(row[8]), status: String(row[9]),
    fingerprint: String(row[13] || '')
  };
}
function getDashboardState() {
  assertAuthorized_();
  const ss = spreadsheet_();
  const rows = certRows_(ss);
  const number = nextPortfolio_(rows);
  return {
    nextPortfolio: pad_(number),
    certificateSuggestion: SETTINGS.CERT_PREFIX + '/' + currentDate_().slice(0,4) + '/' + pad_(number),
    today: currentDate_(),
    issuedCount: rows.filter(r => String(r[9]).toUpperCase() === 'ISSUED').length,
    registerUrl: ss.getUrl()
  };
}

/** Advisory duplicate check; the real unique check is repeated under LockService at issuance. */
function checkCertificateAvailability(raw) {
  assertAuthorized_();
  const certificateNo = cleanCertificateNo_(raw);
  const exists = certRows_(spreadsheet_()).some(r => String(r[1]).trim().toUpperCase() === certificateNo);
  return {available:!exists, message:exists ? 'This certificate number is already issued. Choose another number or reprint.' : 'Certificate number is available (subject to final save check).'};
}

/** Atomically validates partner approval, uniqueness, sequence, and writes the register. */
function issueCertificate(payload) {
  assertAuthorized_();
  const input = validateDraft_(payload); // syntactic checks (not government verification)
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) throw new Error('The register is busy. Please try again in a moment.');
  try {
    const ss = spreadsheet_();
    const rows = certRows_(ss);
    if (rows.some(r => String(r[1]).trim().toUpperCase() === input.certNo)) {
      throw new Error('DUPLICATE CERTIFICATE NUMBER: This number has already been used.');
    }
    if (rows.some(r => String(r[5]).trim().toUpperCase() === input.identity.value && String(r[9]).toUpperCase() === 'ISSUED')) {
      throw new Error('DUPLICATE PARTNER: An issued certificate already exists for this DPIN/PAN. Use Reprint instead.');
    }
    const approval = identityApproved_(ss, input.name, input.identity);
    const portfolio = pad_(nextPortfolio_(rows));
    const issuedAt = currentTimestamp_();
    const fingerprint = makeFingerprint_([portfolio, input.certNo, input.issueDate, input.name, input.identity.value, issuedAt]);
    const row = [portfolio, input.certNo, input.issueDate, input.name, input.identity.type, input.identity.value,
      SETTINGS.FIXED_AMOUNT_INR, SETTINGS.AMOUNT_WORDS, issuedAt, 'ISSUED', approval.evidenceRef,
      approval.verifiedBy, currentActor_(), fingerprint];
    const sheet = ss.getSheetByName(SETTINGS.CERT_SHEET);
    sheet.appendRow(row);
    SpreadsheetApp.flush();
    PropertiesService.getScriptProperties().setProperty('LAST_PORTFOLIO', String(Number(portfolio)));
    const audit = ss.getSheetByName(SETTINGS.AUDIT_SHEET);
    audit.appendRow([issuedAt, 'ISSUE', input.certNo, portfolio, 'SUCCESS', currentActor_(), 'Saved before print; 500000 INR fixed']);
    return {ok:true, record:formatRecord_(row), nextPortfolio:pad_(Number(portfolio)+1)};
  } finally {
    lock.releaseLock();
  }
}

/** Authorized admin only; readback is useful for reprints after browser/printing failures. */
function findCertificate(raw) {
  assertAuthorized_();
  const certNo = cleanCertificateNo_(raw);
  const rows = certRows_(spreadsheet_());
  const found = rows.find(r => String(r[1]).trim().toUpperCase() === certNo && String(r[9]).trim().toUpperCase() === 'ISSUED');
  if (!found) throw new Error('No issued certificate was found with that number.');
  const record = formatRecord_(found);
  spreadsheet_().getSheetByName(SETTINGS.AUDIT_SHEET).appendRow([
    currentTimestamp_(), 'REPRINT_VIEW', record.certificateNo, record.portfolio,
    'SUCCESS', currentActor_(), 'Existing certificate retrieved for reprint'
  ]);
  return {ok:true, record};
}

/** Pure validation checks for administrators. Does not create any certificate. */
function runValidationSelfTest() {
  const checks = [];
  const assert = (expr, msg) => { if (!expr) throw new Error('Self-test failed: ' + msg); checks.push(msg); };
  assert(classifyId_('07722743').type === 'DPIN', '8-digit DPIN supported');
  assert(classifyId_('AAAPB1234C').type === 'PAN', 'valid-pattern PAN supported');
  try { classifyId_('ABCD'); throw new Error('Invalid identifier incorrectly accepted'); }
  catch(e){ assert(/Invalid format/.test(e.message), 'malformed ID rejected'); }
  assert(cleanCertificateNo_('gcl/cc/2026/0006') === 'GCL/CC/2026/0006', 'certificate number normalization');
  assert(pad_(6) === '0006', 'portfolio starts with four digits');
  Logger.log('PASS: ' + checks.join('; '));
  return checks;
}

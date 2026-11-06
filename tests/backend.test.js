/* In-memory Apps Script integration smoke test. Does not write to Google Drive.
   Tests: first 0006, duplicate number, duplicate identity, name mismatch,
   unapproved identity, and reprint; LockService gate is exercised.
*/
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const crypto = require('crypto');
const assert = require('assert');
const headers = { Certificates: Array(14).fill(''), Verified_Partners: Array(8).fill(''), Audit_Log: Array(7).fill('') };
const db = {
  Certificates: [headers.Certificates],
  Verified_Partners: [headers.Verified_Partners, ['Sample Investor','DPIN','12345678','APPROVED','Legal Reviewer','2026-11-06','KYC-CASE-1','Admission reviewed']],
  Audit_Log: [headers.Audit_Log]
};
let lockCount=0;
const props = {'GATHERIDE_CERTIFICATE_SHEET_ID':'test-sheet', 'GATHERIDE_AUTHORIZED_OPERATOR_EMAILS_V1':'["admin@example.invalid","second@example.invalid"]'};
const sheet=(name)=>({
  getLastRow:()=>db[name].length,
  getRange:(row,col,count,width)=>({
    getDisplayValues:()=>db[name].slice(row-1,row-1+count).map(r=>r.slice(col-1,col-1+width).map(v=>String(v??'')))
  }),
  appendRow:(values)=>db[name].push([...values])
});
const ss={getSheetByName:(n)=>sheet(n), getUrl:()=> 'https://docs.google.com/spreadsheets/d/test-sheet/edit'};
const context = {
  Date, String, Math, Array, Number, RegExp, Error, Object,
  SpreadsheetApp:{ openById:()=>ss, flush:()=>{} },
  LockService:{getScriptLock:()=>({tryLock:()=>{lockCount++;return true;},releaseLock:()=>{}})},
  PropertiesService:{getScriptProperties:()=>({getProperty:(k)=>props[k],setProperty:(k,v)=>{props[k]=v;}})},
  Session:{getActiveUser:()=>({getEmail:()=> 'admin@example.invalid'})},
  Utilities:{
    formatDate:(d,tz,fmt)=>fmt==='yyyy-MM-dd'?'2026-11-06':'2026-11-06 13:00:00',
    DigestAlgorithm:{SHA_256:'sha256'},
    computeDigest:(_,s)=>[...crypto.createHash('sha256').update(s).digest()].map(n=>n>=128?n-256:n)
  }
};
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(__dirname,'../appsscript/OperatorAccess.gs'),'utf8'),context);
vm.runInContext(fs.readFileSync(path.join(__dirname,'../appsscript/Code.gs'),'utf8'),context);
const evalIn = expression=>vm.runInContext(expression,context);
assert.equal(evalIn('getDashboardState().nextPortfolio'),'0006');
const good={name:'Sample Investor',identity:'12345678',date:'2026-11-06',certificateNo:'GCL/CC/2026/0006'};
context.testInput=good;
const issued=evalIn('issueCertificate(testInput)');
assert.equal(issued.ok,true);
assert.equal(issued.record.portfolio,'0006');
assert.equal(issued.record.certificateNo,'GCL/CC/2026/0006');
assert.equal(db.Certificates.length,2);
assert.equal(props.LAST_PORTFOLIO,'6');
assert.equal(evalIn('getDashboardState().nextPortfolio'),'0007');
assert.equal(evalIn("checkCertificateAvailability('GCL/CC/2026/0006').available"),false);
assert.throws(()=>evalIn('issueCertificate(testInput)'),/DUPLICATE CERTIFICATE NUMBER/);
context.secondInput={...good,certificateNo:'GCL/CC/2026/0007'};
assert.throws(()=>evalIn('issueCertificate(secondInput)'),/DUPLICATE PARTNER/);
assert.equal(db.Certificates.length,2);
context.badName={...good,name:'Another Name',certificateNo:'GCL/CC/2026/0008',identity:'87654321'};
assert.throws(()=>evalIn('issueCertificate(badName)'),/not been approved/);
context.wrongName={...good,name:'Wrong Name',certificateNo:'GCL/CC/2026/0008'};
assert.throws(()=>evalIn('issueCertificate(wrongName)'),/already exists|DUPLICATE PARTNER/);
const found=evalIn("findCertificate('GCL/CC/2026/0006')");
assert.equal(found.record.portfolio,'0006');
assert.equal(db.Audit_Log.length,3); // header + issue + reprint
assert(lockCount>=4);
// Every entry point must fail closed for an unapproved identity, including read-only endpoints.
context.Session.getActiveUser=()=>({getEmail:()=> 'intruder@gmail.com'});
assert.throws(()=>evalIn('getDashboardState()'), /Access denied/);
assert.throws(()=>evalIn('checkCertificateAvailability("GCL\/CC\/2026\/0006")'), /Access denied/);
assert.throws(()=>evalIn('findCertificate("GCL\/CC\/2026\/0006")'), /Access denied/);
assert.throws(()=>evalIn('issueCertificate(testInput)'), /Access denied/);
context.Session.getActiveUser=()=>({getEmail:()=> ''});
assert.throws(()=>evalIn('getDashboardState()'), /identity unavailable/);
console.log('PASS: issue 0006, unique portfolio increment, duplicate number, duplicate identity, unapproved ID, reprint, and lock acquisition.');

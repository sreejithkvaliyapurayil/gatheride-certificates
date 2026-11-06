/** Node.js offline syntax-level tests for Apps Script validation functions.
 * No Google account or live Sheet required; no certificate is issued.
 */
const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const code=fs.readFileSync(path.join(__dirname,'../appsscript/Code.gs'),'utf8');
const context={console,Date,Number,String,Error,Object,Array,Math,RegExp};
vm.createContext(context);vm.runInContext(code,context);
const c=(expression)=>vm.runInContext(expression,context);
assert.equal(c("pad_(6)"),'0006');
assert.equal(c("classifyId_('07722743').type"),'DPIN');
assert.equal(c("classifyId_('aaapb1234c').type"),'PAN');
assert.equal(c("cleanCertificateNo_('gcl/cc/2026/0006')"),'GCL/CC/2026/0006');
assert.equal(c("cleanName_('  Asha   Kumar  ')"),'Asha Kumar');
assert.throws(()=>c("classifyId_('1234567')"),/Invalid format/);
assert.throws(()=>c("classifyId_('AAAXX1234C')"),/Invalid format/);
assert.throws(()=>c("cleanCertificateNo_('INV/1')"),/Certificate number/);
assert.throws(()=>c("cleanName_('=SUM(A1)')"),/valid partner name/);
console.log('PASS: 9 offline validation assertions. Live Sheets, access-control, concurrency and printing require deployment tests.');

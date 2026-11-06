(function () {
  'use strict';
  document.getElementById('year').textContent=String(new Date().getFullYear());
  const launch=document.getElementById('launch');
  const status=document.getElementById('configStatus');
  const config=window.GATHERIDE_CERTIFICATE_CONFIG || {};
  const url=(config.appScriptWebAppUrl || '').trim();
  const valid=/^https:\/\/script\.google\.com\/macros\/s\/[a-zA-Z0-9_-]+\/exec$/.test(url);
  if (valid) {
    launch.disabled=false;
    status.textContent='The private Google Apps Script console is configured. Sign in with the authorised Google account to continue.';
    launch.onclick=function(){window.open(url,'_blank','noopener,noreferrer');};
  } else {
    launch.disabled=true;
    status.innerHTML='Not connected yet. Complete the <a href="setup.html">one-time setup</a> and paste your web-app URL into <code>config.js</code>.';
  }
}());

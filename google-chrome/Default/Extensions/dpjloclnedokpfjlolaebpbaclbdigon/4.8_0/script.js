'use strict';
var script = document.createElement('script');
script.type = 'text/javascript';
script.src = chrome.extension.getURL('ffzenhancing.js');
document.head.appendChild(script);
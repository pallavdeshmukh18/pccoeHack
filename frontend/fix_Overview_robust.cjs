const fs = require('fs');

let content = fs.readFileSync('src/pages/dashboard/Overview.jsx', 'utf8');

content = content.replace(
  /\{70 \+ \(ev\._id\.charCodeAt\(ev\._id\.length - 1\) % 20\)\}%/g,
  `{70 + ((ev._id || '').toString().charCodeAt((ev._id || 'a').length - 1) % 20)}%`
);

fs.writeFileSync('src/pages/dashboard/Overview.jsx', content);

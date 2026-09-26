const fs = require('fs');
let code = fs.readFileSync('src/services/authService.js', 'utf8');

code = code.replace(
  /employeeId: newEmployee\._id\n\s+\}\);/,
  "employeeId: newEmployee._id,\n        passwordHash: 'GOOGLE_OAUTH_NO_PASSWORD_HASH_REQUIRED'\n      });"
);

fs.writeFileSync('src/services/authService.js', code);

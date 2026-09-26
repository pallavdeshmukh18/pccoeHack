const fs = require('fs');
let content = fs.readFileSync('src/services/authService.js', 'utf8');
content = content.replace(/await User.findOne\({ email: normalizedEmail }\).select\('\+passwordHash'\);/, "await User.findOne({ email: normalizedEmail }).select('+passwordHash').populate('employeeId');");
fs.writeFileSync('src/services/authService.js', content);

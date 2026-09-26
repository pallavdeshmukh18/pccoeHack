const fs = require('fs');
const path = require('path');

const appJsPath = path.join(__dirname, '../src/app.js');
let code = fs.readFileSync(appJsPath, 'utf8');

if (!code.includes('errorMiddleware')) {
    code = code.replace(
      "module.exports = app;",
      "const { errorHandler } = require('./middleware/errorMiddleware');\napp.use(errorHandler);\n\nmodule.exports = app;"
    );
    fs.writeFileSync(appJsPath, code);
}

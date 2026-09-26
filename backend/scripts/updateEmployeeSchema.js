const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/models/Employee.js');
let code = fs.readFileSync(filePath, 'utf8');

if (!code.includes("team: {")) {
  code = code.replace(
    "role: {",
    "team: {\n    type: mongoose.Schema.Types.ObjectId,\n    ref: 'Team',\n    default: null\n  },\n  role: {"
  );
  fs.writeFileSync(filePath, code);
  console.log('Employee schema updated');
}

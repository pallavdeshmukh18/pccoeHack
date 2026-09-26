const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/models/EmployeeSkillCapabilitySnapshot.js');
let code = fs.readFileSync(filePath, 'utf8');

code = code.replace(
  "effectiveEvidenceCount: { type: Number, default: 0 },",
  "effectiveEvidenceCount: { type: Number, default: 0 },\n  excludedEvidenceCount: { type: Number, default: 0 },"
);

fs.writeFileSync(filePath, code);

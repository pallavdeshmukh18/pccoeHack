const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/services/interventionService.js');
let code = fs.readFileSync(filePath, 'utf8');

if (!code.includes("capabilitySnapshotService")) {
  code = "const capabilitySnapshotService = require('./capabilitySnapshotService');\n" + code;
}

code = code.replace(
  "intervention.impact = exports.calculateInterventionImpact(intervention.baselineSnapshot, intervention.postInterventionSnapshot);",
  "intervention.impact = exports.calculateInterventionImpact(intervention.baselineSnapshot, intervention.postInterventionSnapshot);\n\n  try {\n    await capabilitySnapshotService.createSnapshot(intervention.employee, intervention.skill, 'INTERVENTION_COMPLETION');\n  } catch (e) { console.error('Snapshot failed', e); }"
);

fs.writeFileSync(filePath, code);
console.log("Updated interventionService.js");

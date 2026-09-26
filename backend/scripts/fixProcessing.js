const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/services/evidenceProcessingService.js');
let code = fs.readFileSync(filePath, 'utf8');

code = code.replace("evidenceNormalizationService.normalize(", "evidenceNormalizationService.normalizeEvidence(");
// wait, the method signature returns an object: { normalizedValue, normalizationMethod } or something similar
// Let's check the enrich method instead.
code = code.replace(
  "evidenceData.normalizedValue = evidenceNormalizationService.normalize(evidenceData);",
  "const norm = evidenceNormalizationService.normalizeEvidence(evidenceData);\n  evidenceData.normalizedValue = norm.normalizedValue;\n  if (evidenceData.metadata) evidenceData.metadata.normalizationMethod = norm.normalizationMethod;"
);

fs.writeFileSync(filePath, code);

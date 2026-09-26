const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/services/evidenceProcessingService.js');
let code = fs.readFileSync(filePath, 'utf8');

code = code.replace(
  "evidenceData.quality = evidenceQualityService.calculateQuality(evidenceData);",
  "const qual = evidenceQualityService.enrichEvidenceQuality(evidenceData);\n  evidenceData.quality = qual.quality;\n  if (evidenceData.metadata) evidenceData.metadata.qualityMetrics = qual.qualityMetrics;"
);

fs.writeFileSync(filePath, code);

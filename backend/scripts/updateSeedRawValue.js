const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'synthetic-seed.js');
let code = fs.readFileSync(filePath, 'utf8');

const rawValueLogic = `
         if (rec.val !== undefined) {
           // We are converting a 0-1 rec.val into the correct rawValue shape for the chosen source
           if (src === 'MANAGER_FEEDBACK' || src === 'PEER_FEEDBACK') {
             payload.rawValue = { rating: (rec.val * 4) + 1 };
           } else if (src === 'TRAINING') {
             payload.rawValue = { completionPercent: rec.val * 100 };
           } else if (src === 'KPI') {
             payload.rawValue = { achievementPercent: rec.val * 100 };
           } else if (src === 'INTERNAL_ASSESSMENT' || src === 'ASSESSMENT') {
             payload.rawValue = { score: rec.val * 100 };
           } else if (src === 'PROJECT') {
             payload.rawValue = { projectScore: rec.val * 100 };
           } else {
             payload.rawValue = { score: rec.val * 100 }; // fallback
           }
         }
`;

code = code.replace("if (rec.val !== undefined) payload.rawValue = rec.val; // zero allowed", rawValueLogic);

// also fix the intervention evidence at the bottom
const intEvidence = `
         await evidenceProcessingService.processEvidence({
           employee: emp._id, skill: mainSkill._id, competency: mainSkill.competency, sourceType: 'TRAINING', evidenceKind: 'ASSESSMENT', title: \`Post Training\`,
           occurredAt: now, rawValue: { completionPercent: 90 }, direction: 'POSITIVE'
         });
`;
code = code.replace(
  "occurredAt: now, rawValue: 0.9, direction: 'POSITIVE'\n         });",
  "occurredAt: now, rawValue: { completionPercent: 90 }, direction: 'POSITIVE'\n         });"
);

fs.writeFileSync(filePath, code);
console.log('Seed updated');

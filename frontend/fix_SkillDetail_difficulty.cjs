const fs = require('fs');

let content = fs.readFileSync('src/pages/dashboard/SkillDetail.jsx', 'utf8');

const oldDiff = `Difficulty: {(assessment.currentDifficulty * 100).toFixed(0)}%`;
const newDiff = `Difficulty: {(((assessment.nextQuestion?.difficulty || assessment.question?.difficulty || 3) / 5) * 100).toFixed(0)}%`;

content = content.replace(oldDiff, newDiff);

fs.writeFileSync('src/pages/dashboard/SkillDetail.jsx', content);

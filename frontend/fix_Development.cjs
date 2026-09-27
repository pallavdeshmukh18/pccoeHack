const fs = require('fs');

let content = fs.readFileSync('src/pages/dashboard/Development.jsx', 'utf8');

// Fix objective mapping
content = content.replace(
  /\{copilotPlan\.summary\?\.developmentObjective \|\| '—'\}/g,
  `{copilotPlan.developmentPlan || '—'}`
);

content = content.replace(
  /\{copilotPlan\.summary\?\.whyThisMatters \|\| '—'\}/g,
  `{copilotPlan.overallSummary || '—'}`
);

// Fix recommendations mapping
content = content.replace(
  /copilotPlan\.recommendations\?\.map/g,
  `copilotPlan.priorities?.map`
);

fs.writeFileSync('src/pages/dashboard/Development.jsx', content);

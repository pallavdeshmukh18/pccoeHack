const fs = require('fs');
const path = require('path');

const readmePath = path.join(__dirname, '../README.md');
let content = fs.existsSync(readmePath) ? fs.readFileSync(readmePath, 'utf8') : '# TalentTwin Backend\n';

const newDocs = `
## Core Intelligence API Extensions

### Evidence Conflicts
- \`GET /api/evidence-conflicts/employee/:employeeId\` (Auth: EMPLOYEE owner or ADMIN)
- \`POST /api/evidence-conflicts/detect\` (Auth: EMPLOYEE owner or ADMIN)

### Explanations
- \`GET /api/explanations/employee/:employeeId/skill/:skillId\` (Auth: EMPLOYEE owner or ADMIN)

### Career & Development
- \`POST /api/career/simulate\` (Auth: EMPLOYEE owner or ADMIN)

### Evidence Policies
- \`GET /api/evidence-policies\` (Auth: ADMIN)
- \`PUT /api/evidence-policies/:id\` (Auth: ADMIN)

### Teams, Departments, Organizations, Risks (Auth: ADMIN)
- \`GET /api/teams\`
- \`GET /api/teams/:teamId/capabilities\`
- \`GET /api/departments/:department/overview\`
- \`GET /api/organization/overview\`
- \`POST /api/risks/evaluate\`

### Manager Actions (Auth: ADMIN)
- \`POST /api/manager-actions/generate\`
- \`GET /api/manager-actions\`
- \`PATCH /api/manager-actions/:id/status\`
`;

if (!content.includes('Core Intelligence API Extensions')) {
    fs.writeFileSync(readmePath, content + '\n' + newDocs);
}

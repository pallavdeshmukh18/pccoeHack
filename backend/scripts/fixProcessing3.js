const fs = require('fs');

let content = fs.readFileSync('src/services/groqService.js', 'utf8');

const replacement = `
    const parsed = JSON.parse(content);
    
    // Ensure string arrays are actually arrays of strings
    ['strengths', 'weaknesses', 'missingAreas'].forEach(key => {
        if (Array.isArray(parsed[key])) {
            parsed[key] = parsed[key].map(item => typeof item === 'string' ? item : (item.text || item.name || JSON.stringify(item)));
        }
    });

    // Validate output structure simply
`;

content = content.replace(/const parsed = JSON\.parse\(content\);\s*\n\s*\/\/ Validate output structure simply/, replacement);

fs.writeFileSync('src/services/groqService.js', content);

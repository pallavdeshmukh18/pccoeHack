const fs = require('fs');

let content = fs.readFileSync('src/services/groqService.js', 'utf8');

const replacement = `
    const parsed = JSON.parse(content);
    
    // Ensure string arrays are actually arrays of strings
    if (parsed.recommendations && Array.isArray(parsed.recommendations)) {
        parsed.recommendations.forEach(rec => {
            ['recommendedActions', 'practiceActivities', 'suggestedProjects', 'successIndicators', 'cautions'].forEach(key => {
                if (Array.isArray(rec[key])) {
                    rec[key] = rec[key].map(item => typeof item === 'string' ? item : (item.text || item.name || JSON.stringify(item)));
                } else if (typeof rec[key] === 'string') {
                    rec[key] = [rec[key]];
                } else {
                    rec[key] = [];
                }
            });
        });
    }

    return parsed;
`;

content = content.replace(/return JSON\.parse\(content\);/g, replacement);

fs.writeFileSync('src/services/groqService.js', content);

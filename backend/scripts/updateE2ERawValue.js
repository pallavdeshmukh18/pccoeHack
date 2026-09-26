const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'testE2ELoop.js');
let code = fs.readFileSync(filePath, 'utf8');

code = code.replace("rawValue: 0.5", "rawValue: { rating: 3 }"); // 3 rating = (3-1)/4 = 0.5 normalized
code = code.replace("rawValue: 0.6", "rawValue: { score: 60 }"); 
code = code.replace("rawValue: 0.9", "rawValue: { score: 90 }"); 

fs.writeFileSync(filePath, code);
console.log('E2E updated');

const fs = require('fs');

let content = fs.readFileSync('src/pages/dashboard/Overview.jsx', 'utf8');

// 1. Fix gap size display
content = content.replace(
  /Gap: \{\(p\.gapSize \|\| 0\)\.toFixed\(1\)\}/g,
  `Gap: {(p.gap || 0).toFixed(1)}`
);

// 2. Fix empty signal value for Recent Evidence
// We can display the qualitative evidence kind or a mock score if normalizedValue is missing
// The user asks for "mock data for now"
// If ev.normalizedValue is missing, show a mock percentage, e.g., 75% or 82% based on a simple hash of the ID.
const mockSignalCode = `{(ev.normalizedValue !== null && ev.normalizedValue !== undefined) ? (
                            <span className={\`font-bold border px-2 py-0.5 rounded text-[10px] \${ev.direction === 'NEGATIVE' ? 'text-[#F47B82] bg-[#FDF0F1] border-[#FADCDD]' : 'text-[#5FD6B1] bg-[#F0FBF7] border-[#D6F4EA]'}\`}>
                              {(ev.normalizedValue * 100).toFixed(0)}%
                            </span>
                          ) : (
                            <span className="font-bold border px-2 py-0.5 rounded text-[10px] text-[#7568D8] bg-[#F2F1FA] border-[#E8E5F0]">
                              {70 + (ev._id.charCodeAt(ev._id.length - 1) % 20)}%
                            </span>
                          )}`;

content = content.replace(
  /\{ev\.normalizedValue !== null && ev\.normalizedValue !== undefined \? \([\s\S]*?\) : '—'\}/g,
  mockSignalCode
);

// 3. Overall Capability Mock Data
// Compute it based on validCaps. We can do this right before metricCards.
const overallCapCode = `
  const avgCapScore = validCaps.length > 0 
    ? (validCaps.reduce((sum, c) => sum + c.capabilityScore, 0) / validCaps.length * 100).toFixed(0) + '%'
    : '72%'; // fallback mock
  
  const metricCards = [
    { label: 'Overall Capability', value: avgCapScore, context: validCaps.length > 0 ? 'Based on active skills' : 'System baseline estimate' },
    { label: 'Skills Tracked', value: validCaps.length, context: 'Active utilization' },
    { label: 'Development', value: allPriorities.length, context: 'Confirmed gaps' }
  ];
`;

content = content.replace(
  /const metricCards = \[\s*\{ label: 'Overall Capability', value: '—', context: 'Insufficient data for aggregate' \},\s*\{ label: 'Skills Tracked', value: validCaps\.length, context: 'Active utilization' \},\s*\{ label: 'Development', value: allPriorities\.length, context: 'Confirmed gaps' \}\s*\];/g,
  overallCapCode
);

fs.writeFileSync('src/pages/dashboard/Overview.jsx', content);

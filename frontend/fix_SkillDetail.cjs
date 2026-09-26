const fs = require('fs');
let code = fs.readFileSync('src/pages/dashboard/SkillDetail.jsx', 'utf8');

// 1. Fix velocity
code = code.replace(/\(capability\.trajectoryVelocity \* 30\)\.toFixed\(3\)/g, 'capability.trajectoryVelocity.toFixed(3)');

// 2. Fix Chart Header text
code = code.replace(/<h3 className="text-lg font-medium text-white">Historical Trajectory<\/h3>/g, '<h3 className="text-lg font-medium text-white">Historical Trajectory <span className="text-sm text-gray-500 font-normal ml-2">(Observed evidence signals)</span></h3>');

// 3. Fix Chart body
const oldChartStart = `{capability.trajectoryDirection === 'INSUFFICIENT_DATA' || positiveEvidence.length < 3 ? (`;
const newChartLogic = `{(() => {
                  const chartEv = [...positiveEvidence]
                    .filter(ev => ev.normalizedValue !== null && ev.normalizedValue !== undefined)
                    .sort((a, b) => new Date(a.occurredAt) - new Date(b.occurredAt));
                  
                  if (capability.trajectoryDirection === 'INSUFFICIENT_DATA' || chartEv.length < 3) {
                    return (
                      <div className="flex-1 flex flex-col items-center justify-center text-center">
                        <TrendingUp className="w-10 h-10 text-gray-800 mb-3" />
                        <div className="text-white font-medium mb-1">Not enough observations</div>
                        <div className="text-sm text-gray-500">More observations are needed to establish a reliable trajectory.</div>
                      </div>
                    );
                  }
                  
                  return (
                    <div className="flex-1 relative flex items-end">
                      <div className="absolute inset-0 border-b border-gray-800"></div>
                      
                      {(() => {
                        const minX = new Date(chartEv[0].occurredAt).getTime();
                        const maxX = new Date(chartEv[chartEv.length - 1].occurredAt).getTime();
                        const rangeX = maxX - minX || 1; 
                        
                        const points = chartEv.map((ev, i) => {
                          const x = rangeX === 1 ? (i / Math.max(chartEv.length - 1, 1)) * 1000 : ((new Date(ev.occurredAt).getTime() - minX) / rangeX) * 1000;
                          const y = 100 - (ev.normalizedValue * 100);
                          return \`\${x},\${y}\`;
                        });
                        
                        const pathD = "M " + points.join(" L ");

                        return (
                          <div className="w-full h-full relative">
                            <svg className="w-full h-full absolute inset-0 preserve-3d overflow-visible" preserveAspectRatio="none" viewBox="0 0 1000 100">
                              <motion.path 
                                initial={{ pathLength: 0, opacity: 0 }}
                                animate={{ pathLength: 1, opacity: 1 }}
                                transition={{ duration: 1.5, ease: "easeInOut" }}
                                d={pathD}
                                fill="none" 
                                stroke="currentColor" 
                                className="text-emerald-500" 
                                strokeWidth="2" 
                                vectorEffect="non-scaling-stroke"
                              />
                            </svg>
                            
                            <div className="absolute inset-0">
                              {chartEv.map((ev, i) => {
                                const x = rangeX === 1 ? (i / Math.max(chartEv.length - 1, 1)) * 100 : ((new Date(ev.occurredAt).getTime() - minX) / rangeX) * 100;
                                const y = ev.normalizedValue * 100;
                                return (
                                  <div 
                                    key={ev._id} 
                                    className="absolute w-2.5 h-2.5 -ml-[5px] bg-gray-900 border-2 border-emerald-500 rounded-full group cursor-pointer hover:scale-125 transition-transform z-10"
                                    style={{ left: \`\${x}%\`, bottom: \`calc(\${y}% - 5px)\` }}
                                  >
                                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-gray-800 border border-gray-700 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-20 shadow-lg">
                                      {(ev.normalizedValue * 100).toFixed(0)}% signal
                                      <div className="text-gray-400 mt-0.5">{new Date(ev.occurredAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  );
                })()}`;

// Replace logic carefully
const lines = code.split('\n');
const startIndex = lines.findIndex(l => l.includes("capability.trajectoryDirection === 'INSUFFICIENT_DATA' || positiveEvidence.length < 3"));
const endIndex = lines.findIndex((l, idx) => idx > startIndex && l.includes("</div>") && lines[idx+1].includes("</div>") && lines[idx+2].includes("</div>") && lines[idx+3].includes("</>"));

if (startIndex !== -1 && endIndex !== -1) {
  // Find the exact line index closing the chart area div
  let openDivs = 0;
  let actualEndIndex = -1;
  for(let i=startIndex; i<lines.length; i++) {
     if(lines[i].includes("<div") || lines[i].includes("<svg")) openDivs += (lines[i].match(/<div|<svg/g)||[]).length;
     if(lines[i].includes("</div") || lines[i].includes("</svg")) openDivs -= (lines[i].match(/<\/div|<\/svg/g)||[]).length;
     if(openDivs < 0) {
        actualEndIndex = i - 1; // It closed the parent
        break;
     }
  }

  // Fallback
  if(actualEndIndex === -1) actualEndIndex = startIndex + 55; // rough estimate based on old lines 246 to 301
  
  // We'll just splice it
  const before = lines.slice(0, startIndex).join('\n');
  const after = lines.slice(startIndex + 56).join('\n'); // 302 - 246 = 56 lines
  code = before + '\n                ' + newChartLogic + '\n' + after;
}

fs.writeFileSync('src/pages/dashboard/SkillDetail.jsx', code);

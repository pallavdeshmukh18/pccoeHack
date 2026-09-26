const fs = require('fs');
let code = fs.readFileSync('src/pages/dashboard/SkillDetail.jsx', 'utf8');

// Fix velocity units
code = code.replace(/\(capability\.trajectoryVelocity \* 30\)\.toFixed\(3\)/g, 'capability.trajectoryVelocity.toFixed(3)');

// Chart generation logic
const chartLogic = `
                {capability.trajectoryDirection === 'INSUFFICIENT_DATA' || positiveEvidence.filter(e => e.normalizedValue != null).length < 3 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center">
                    <TrendingUp className="w-10 h-10 text-gray-800 mb-3" />
                    <div className="text-white font-medium mb-1">Not enough observations</div>
                    <div className="text-sm text-gray-500">More observations are needed to establish a reliable trajectory.</div>
                  </div>
                ) : (
                  <div className="flex-1 relative flex items-end">
                    {/* Minimalist Chart Visualization */}
                    <div className="absolute inset-0 border-b border-gray-800"></div>
                    
                    {(() => {
                      const chartEv = [...positiveEvidence].reverse().filter(ev => ev.normalizedValue != null);
                      if (chartEv.length === 0) return null;
                      
                      const minX = new Date(chartEv[0].occurredAt).getTime();
                      const maxX = new Date(chartEv[chartEv.length - 1].occurredAt).getTime();
                      const rangeX = maxX - minX || 1; // avoid div by 0
                      
                      // Calculate path string
                      const points = chartEv.map((ev, i) => {
                        // Spread evenly if all same day, otherwise use real time ratio
                        const x = rangeX === 1 ? (i / Math.max(chartEv.length - 1, 1)) * 100 : ((new Date(ev.occurredAt).getTime() - minX) / rangeX) * 100;
                        const y = 100 - (ev.normalizedValue * 100);
                        return \`\${x},\${y}\`;
                      });
                      
                      const pathD = "M " + points.join(" L ");

                      return (
                        <>
                          <svg className="w-full h-full absolute inset-0 preserve-3d overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 100">
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
                          
                          {/* Plot Evidence Points */}
                          <div className="absolute inset-0">
                            {chartEv.map((ev, i) => {
                              const x = rangeX === 1 ? (i / Math.max(chartEv.length - 1, 1)) * 100 : ((new Date(ev.occurredAt).getTime() - minX) / rangeX) * 100;
                              const y = ev.normalizedValue * 100;
                              return (
                                <div 
                                  key={ev._id} 
                                  className="absolute w-2 h-2 -ml-1 bg-gray-900 border-2 border-emerald-500 rounded-full group cursor-pointer"
                                  style={{ left: \`\${x}%\`, bottom: \`calc(\${y}% - 4px)\` }}
                                >
                                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-gray-900 border border-gray-700 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-20">
                                    {(ev.normalizedValue * 100).toFixed(0)}% signal
                                    <div className="text-gray-400 mt-0.5">{new Date(ev.occurredAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </>
                      );
                    })()}
                  </div>
                )}
`;

code = code.replace(/\{capability\.trajectoryDirection === 'INSUFFICIENT_DATA'[\s\S]*?(?=\s*<\/div>\s*<\/>\s*\)\}\s*<\/div>\s*\{!hasCapability)/m, chartLogic);

fs.writeFileSync('src/pages/dashboard/SkillDetail.jsx', code);

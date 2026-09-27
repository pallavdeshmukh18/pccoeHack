const fs = require('fs');

let content = fs.readFileSync('fix_SkillDetail_backup.jsx', 'utf8');

// Replace {assessment.currentQuestion?.text || "Generating next question..."}
content = content.replace(
  /\{assessment\.currentQuestion\?\.text \|\| "Generating next question\.\.\."\}/g,
  `{assessment.question?.question || assessment.nextQuestion?.question || "Generating next question..."}`
);

// Replace {assessment.questionsCount + 1}
content = content.replace(
  /\{assessment\.questionsCount \+ 1\}/g,
  `{assessment.questionsAnswered ? assessment.questionsAnswered + 1 : 1}`
);

const oldOptions = `{assessment.currentQuestion?.options?.map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedOption(opt)}
                      className={\`w-full text-left p-4 rounded-xl border text-sm font-medium transition-all \${selectedOption === opt ? 'bg-[#F2F1FA] border-[#7568D8] text-[#7568D8]' : 'bg-white border-[#E8E5F0] text-[#17152F] hover:border-[#A5A3B5]'}\`}
                    >
                      {opt}
                    </button>
                  ))}`;

const newOptions = `<textarea
                      value={selectedOption}
                      onChange={(e) => setSelectedOption(e.target.value)}
                      placeholder="Type your answer here..."
                      className="w-full min-h-[120px] p-4 rounded-xl border border-[#E8E5F0] text-sm text-[#17152F] focus:outline-none focus:border-[#7568D8] resize-none"
                    />`;

content = content.replace(oldOptions, newOptions);

content = content.replace(
  /const res = await api\.post\(\`\/assessments\/\$\{assessment\._id\}\/answer\`, \{ answer: selectedOption \}\);/,
  `const questionId = assessment.nextQuestion?.questionId || assessment.question?.questionId;
      const res = await api.post(\`/assessments/\${assessment.assessmentId}/answer\`, { questionId, answer: selectedOption });`
);

fs.writeFileSync('src/pages/dashboard/SkillDetail.jsx', content);

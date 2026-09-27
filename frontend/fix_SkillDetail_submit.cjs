const fs = require('fs');

let content = fs.readFileSync('src/pages/dashboard/SkillDetail.jsx', 'utf8');

const oldSubmit = `const handleSubmitAnswer = async () => {
    if (!selectedOption) return;
    setAssessmentLoading(true);
    try {
      const questionId = assessment.nextQuestion?.questionId || assessment.question?.questionId;
      const res = await api.post(\`/assessments/\${assessment.assessmentId}/answer\`, { questionId, answer: selectedOption });
      setAssessment(res.data.data);
      setSelectedOption('');
      if (res.data.data.status === 'COMPLETED') {
        setTimeout(() => {
          setIsAssessing(false);
          setAssessment(null);
          fetchData(); 
        }, 3000);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setAssessmentLoading(false);
    }
  };`;

const newSubmit = `const handleSubmitAnswer = async () => {
    if (!selectedOption) return;
    setAssessmentLoading(true);
    try {
      const questionId = assessment.nextQuestion?.questionId || assessment.question?.questionId;
      const res = await api.post(\`/assessments/\${assessment.assessmentId}/answer\`, { questionId, answer: selectedOption });
      
      if (res.data.data.message === 'Ready to complete assessment') {
          // Auto complete
          const completeRes = await api.post(\`/assessments/\${assessment.assessmentId}/complete\`);
          setAssessment({ ...completeRes.data.data, status: 'COMPLETED' });
          setSelectedOption('');
          setTimeout(() => {
            setIsAssessing(false);
            setAssessment(null);
            fetchData();
          }, 3000);
      } else {
          setAssessment(res.data.data);
          setSelectedOption('');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setAssessmentLoading(false);
    }
  };`;

content = content.replace(oldSubmit, newSubmit);

fs.writeFileSync('src/pages/dashboard/SkillDetail.jsx', content);

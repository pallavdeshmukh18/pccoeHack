const Groq = require('groq-sdk');

let groq;

const getGroqClient = () => {
  if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is not configured in the environment.');
  }
  if (!groq) {
    groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return groq;
};

exports.generateAssessmentQuestion = async (context) => {
  const client = getGroqClient();

  const { skillName, skillDescription, targetDifficulty, levelName, levelDescription, previousWeaknesses } = context;

  const prompt = `
You are an expert interviewer assessing a candidate's proficiency in "${skillName}".
Skill Description: ${skillDescription}

Target Difficulty Level: ${targetDifficulty} out of 5 (${levelName})
Level Definition: ${levelDescription}

${previousWeaknesses && previousWeaknesses.length > 0 ? `The candidate previously showed weaknesses in: ${previousWeaknesses.join(', ')}. Try to probe this area if applicable.` : ''}

Generate ONE scenario-based assessment question that strictly tests this difficulty level.
Do not ask for trivial recall. The question should require reasoning or practical application.

Return strictly a JSON object matching this schema, with no markdown formatting or extra text:
{
  "question": "The question text"
}
  `.trim();

  try {
    const chatCompletion = await client.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: process.env.GROQ_MODEL || 'allam-2-7b',
      response_format: { type: 'json_object' }
    });

    const content = chatCompletion.choices[0]?.message?.content;
    if (!content) throw new Error('Empty response from Groq');
    
    return JSON.parse(content);
  } catch (error) {
    console.error('Error generating Groq question:', error.message);
    throw new Error('Failed to generate assessment question from AI service.');
  }
};

exports.evaluateAssessmentAnswer = async (context) => {
  const client = getGroqClient();

  const { skillName, question, answer, levelName, levelDescription } = context;

  const prompt = `
You are an expert evaluator assessing a candidate's answer for the skill "${skillName}".
Question: "${question}"
Candidate Answer: "${answer}"

Target Level Definition (${levelName}): ${levelDescription}

CRITICAL INSTRUCTIONS:
- Do not award a high score merely because the answer mentions relevant keywords (e.g., "microservices", "Kubernetes", "AWS"). A technology name is not evidence of proficiency.
- Evaluate what the candidate actually explains. Distinguish between mentioning a concept, explaining it, applying it correctly, and reasoning about its trade-offs.
- Do not infer missing reasoning. Do not give credit for things the candidate did not explicitly state or logically demonstrate.
- Rather than a single coverage score, explicitly define 4-6 distinct evaluation DIMENSIONS relevant to this specific skill and rubric (e.g., for System Design: Scalability, Data Consistency, Failure Handling, etc.).
- Every dimension must have a score (0.0 to 1.0) and supporting text evidence justifying that score. If the answer does not address a dimension, score it low (0.0 or 0.1).

Evaluate the answer and return strictly a JSON object matching this schema, with no markdown or extra text:
{
  "score": <number between 0 and 100>,
  "estimatedLevel": <integer between 1 and 5>,
  "correctness": <number between 0.0 and 1.0>,
  "reasoningQuality": <number between 0.0 and 1.0>,
  "depth": <number between 0.0 and 1.0>,
  "dimensions": [
    {
      "name": "Dimension Name",
      "score": <number between 0.0 and 1.0>,
      "evidence": "Supporting evidence from the answer."
    }
  ],
  "strengths": ["array", "of", "strings"],
  "weaknesses": ["array", "of", "strings"],
  "missingAreas": ["array", "of", "strings"],
  "feedback": "constructive feedback string"
}
  `.trim();

  try {
    const chatCompletion = await client.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: process.env.GROQ_MODEL || 'allam-2-7b',
      response_format: { type: 'json_object' }
    });

    const content = chatCompletion.choices[0]?.message?.content;
    if (!content) throw new Error('Empty response from Groq');
    
    const parsed = JSON.parse(content);
    
    // Validate output structure simply
    if (typeof parsed.score !== 'number' || typeof parsed.estimatedLevel !== 'number' ||
        typeof parsed.correctness !== 'number' || typeof parsed.reasoningQuality !== 'number' ||
        typeof parsed.depth !== 'number') {
      throw new Error('Malformed evaluation from AI service');
    }
    
    if (!Array.isArray(parsed.dimensions) || !Array.isArray(parsed.strengths) || !Array.isArray(parsed.weaknesses) || !Array.isArray(parsed.missingAreas)) {
      throw new Error('Malformed evaluation arrays from AI service');
    }
    
    // Validate each dimension
    parsed.dimensions.forEach(dim => {
      if (!dim.name || typeof dim.score !== 'number' || !dim.evidence) {
        throw new Error('Malformed evaluation dimension from AI service');
      }
    });

    return parsed;
  } catch (error) {
    console.error('Error evaluating Groq answer:', error.message);
    throw new Error('Failed to evaluate assessment answer from AI service.');
  }
};

exports.generateDevelopmentRecommendations = async (context) => {
  const client = getGroqClient();

  const prompt = `
You are a development planning assistant.
You will receive structured, authoritative capability and priority data.
Do not alter numerical values. Do not invent employee facts. Do not rank or reorder priorities. 
Only provide personalized development plans for the provided gaps.

Context:
${JSON.stringify(context, null, 2)}

Return strictly a JSON object matching this schema, with no markdown formatting or extra text:
{
  "overallSummary": "A brief summary of the development plan.",
  "developmentPlan": "A high-level paragraph describing the overarching focus.",
  "recommendations": [
    {
      "skillName": "The exact name of the skill",
      "developmentObjective": "Concrete objective tied to the gap",
      "whyThisMatters": "Why this is important for the role",
      "recommendedActions": ["action 1", "action 2"],
      "practiceActivities": ["activity 1"],
      "suggestedProjects": ["project 1"],
      "successIndicators": ["indicator 1"],
      "estimatedTimeframe": "1-2 weeks",
      "cautions": ["caution 1"]
    }
  ]
}
  `.trim();

  try {
    const chatCompletion = await client.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: process.env.GROQ_MODEL || 'allam-2-7b',
      response_format: { type: 'json_object' }
    });

    const content = chatCompletion.choices[0]?.message?.content;
    if (!content) throw new Error('Empty response from Groq');
    
    return JSON.parse(content);
  } catch (error) {
    console.error('Error generating Groq recommendations:', error.message);
    throw new Error('Failed to generate development recommendations from AI service.');
  }
};

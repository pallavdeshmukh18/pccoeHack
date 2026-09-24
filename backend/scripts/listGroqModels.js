require('dotenv').config();
const Groq = require('groq-sdk');

async function listModels() {
  if (!process.env.GROQ_API_KEY) {
    console.error('No GROQ_API_KEY found in .env');
    return;
  }
  
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  try {
    const models = await groq.models.list();
    console.log('\n--- AVAILABLE GROQ MODELS ---');
    models.data.forEach(m => {
      console.log(`- ${m.id}`);
    });
    console.log('-----------------------------\n');
    console.log('Pick one of these IDs and put it in your .env as GROQ_MODEL=...');
  } catch (err) {
    console.error('Error fetching models:', err.message);
  }
}

listModels();

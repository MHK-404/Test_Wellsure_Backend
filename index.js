require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const { Configuration, OpenAIApi } = require('openai');
const pdfkit = require('pdfkit');
const fs = require('fs');

const app = express();
const port = 3000;

// Middleware to parse POST request bodies
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Set up OpenAI API
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY, // Replace with your OpenAI API key
});
const openai = new OpenAIApi(configuration);

// Route for the welcome page
app.get('/', (req, res) => {
  res.send('Welcome to Wellsure! This is the risk assessment tool.');
});

// Route for the questionnaire page
app.post('/questionnaire', async (req, res) => {
  const { physicalHealthAnswers, mentalHealthAnswers, textAnswers, height, weight } = req.body;

  // Calculate BMI
  const bmi = (weight / (height * height)).toFixed(2);

  // Calculate risk score (this is a simplified version, you can adjust it)
  let riskScore = 1000; // Default value

  // Example: Adjust risk score based on BMI and health answers
  if (bmi > 30) riskScore -= 100; // Obese BMI adjustment
  if (physicalHealthAnswers.some(answer => answer === 'poor')) riskScore -= 150;
  if (mentalHealthAnswers.some(answer => answer === 'poor')) riskScore -= 150;

  // Generate recommendations based on answers using ChatGPT
  const recommendations = await generateRecommendations(physicalHealthAnswers, mentalHealthAnswers, textAnswers);

  // Send response with risk score and recommendations
  res.json({
    riskScore,
    recommendations,
    bmi,
  });
});

// Function to generate AI recommendations using ChatGPT
async function generateRecommendations(physicalHealthAnswers, mentalHealthAnswers, textAnswers) {
  const prompt = `
    Based on the following responses, generate personalized health and lifestyle recommendations:
    Physical Health Answers: ${JSON.stringify(physicalHealthAnswers)}
    Mental Health Answers: ${JSON.stringify(mentalHealthAnswers)}
    Text Answers: ${JSON.stringify(textAnswers)}
  `;

  const completion = await openai.createCompletion({
    model: 'text-davinci-003',
    prompt: prompt,
    max_tokens: 500,
  });

  return completion.data.choices[0].text;
}

// Route to generate PDF summary
app.post('/generate-pdf', (req, res) => {
  const { riskScore, recommendations, bmi } = req.body;

  const doc = new pdfkit();
  const filename = `Risk_Summary_${Date.now()}.pdf`;
  const filePath = `./${filename}`;

  doc.pipe(fs.createWriteStream(filePath));

  doc.fontSize(18).text(`Wellsure Risk Assessment Summary`, { align: 'center' });
  doc.moveDown();
  doc.fontSize(14).text(`Risk Score: ${riskScore}`);
  doc.text(`BMI: ${bmi}`);
  doc.moveDown();
  doc.text(`Recommendations:`);
  doc.fontSize(12).text(recommendations);

  doc.end();

  res.json({ success: true, filePath });
});

// Start the server
app.listen(port, () => {
  console.log(`Backend running on http://localhost:${port}`);
});

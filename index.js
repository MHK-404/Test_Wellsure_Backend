require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fetch = require('node-fetch'); // For API calls to OpenAI (ChatGPT)
const { Configuration, OpenAIApi } = require('openai');

// Initialize Express app
const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// OpenAI Configuration
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// POST route to handle form submissions
app.post('/submit', async (req, res) => {
  try {
    const formData = req.body;
    const {
      weight,
      height,
      chronicDisorders,
      physicalHealthScore,
      mentalHealthScore,
      textQuestion1,
      textQuestion2,
    } = formData;

    // Calculate BMI
    const bmi = (weight / Math.pow(height, 2)).toFixed(2);

    // Calculate total risk score (out of 1000)
    const riskScore = calculateRiskScore(physicalHealthScore, mentalHealthScore, bmi);

    // Get AI-generated recommendations for the form responses
    const recommendationText = await generateRecommendations(formData);

    // AI-generated feedback for text questions
    const textFeedback = await getAITextFeedback(textQuestion1, textQuestion2);

    // Return response
    res.json({
      riskScore,
      recommendations: recommendationText,
      textFeedback,
      bmi,
    });
  } catch (error) {
    console.error('Error handling form submission:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Function to calculate risk score
function calculateRiskScore(physicalScore, mentalScore, bmi) {
  // This is just a simplified model of scoring. Modify as per your logic.
  let score = (parseInt(physicalScore) + parseInt(mentalScore)) / 2;
  score -= bmi * 10; // Adjust score based on BMI
  score = Math.max(0, Math.min(1000, score)); // Ensure score is between 0 and 1000
  return score;
}

// Function to generate recommendations using OpenAI
async function generateRecommendations(formData) {
  const prompt = `
    Based on the following data, generate health and lifestyle recommendations:
    - Chronic disorders: ${formData.chronicDisorders}
    - Physical Health Score: ${formData.physicalHealthScore}
    - Mental Health Score: ${formData.mentalHealthScore}
    - BMI: ${formData.bmi}
  `;
  const completion = await openai.createCompletion({
    model: "text-davinci-003",
    prompt: prompt,
    max_tokens: 150,
  });

  return completion.data.choices[0].text.trim();
}

// Function to generate AI feedback for text responses
async function getAITextFeedback(question1, question2) {
  const prompt = `
    Based on the answers to the following questions, generate feedback:
    - Question 1: ${question1}
    - Question 2: ${question2}
  `;
  const completion = await openai.createCompletion({
    model: "text-davinci-003",
    prompt: prompt,
    max_tokens: 150,
  });

  return completion.data.choices[0].text.trim();
}

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Configuration, OpenAIApi } = require('openai');

const app = express();

// Initialize OpenAI API
const configuration = new Configuration({
  apiKey: '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',  // Replace with your actual API key from OpenAI
});
const openai = new OpenAIApi(configuration);

// CORS settings (allow frontend requests)
app.use(cors({
  origin: '*', // In production, replace * with your frontend URL
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Root test route
app.get('/', (req, res) => {
  res.send('Backend server is up and running!');
});

// Main /submit route
app.post('/submit', async (req, res) => {
  try {
    const {
      weight,
      height,
      chronicDisorders,
      physicalHealthScore,
      mentalHealthScore,
      textQuestion1,
      textQuestion2
    } = req.body;

    // Calculate BMI
    const bmi = (weight / (height * height)).toFixed(2);

    // Risk Score Calculation
    let score = (parseInt(physicalHealthScore) + parseInt(mentalHealthScore)) / 2;
    score -= bmi * 10;
    score = Math.max(0, Math.min(1000, score)); // Clamp between 0 and 1000

    // Generate ChatGPT Recommendations
    const chatGptRecommendations = await getChatGptRecommendations(chronicDisorders, bmi);

    // Generate basic feedback based on text
    const textFeedback = generateTextFeedback(textQuestion1, textQuestion2);

    res.json({
      riskScore: score,
      bmi: bmi,
      recommendations: chatGptRecommendations,
      textFeedback: textFeedback
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Function to generate recommendations from ChatGPT
async function getChatGptRecommendations(chronicDisorders, bmi) {
  try {
    const prompt = `Generate health recommendations based on the following:
    - Chronic disorders: ${chronicDisorders}
    - BMI: ${bmi}
    Provide tailored advice for managing health and wellness.`;

    const response = await openai.createCompletion({
      model: 'text-davinci-003',  // You can adjust to any available GPT model
      prompt: prompt,
      max_tokens: 150,
      temperature: 0.7,
    });

    return response.data.choices[0].text.trim().split("\n");
  } catch (error) {
    console.error('Error fetching ChatGPT recommendations:', error);
    return ['Unable to generate AI recommendations at this time.'];
  }
}

// Helper: generate basic feedback
function generateTextFeedback(text1, text2) {
  if (text1.toLowerCase().includes('tired') || text2.toLowerCase().includes('noisy')) {
    return 'Consider getting enough rest and creating a calmer environment.';
  }
  return 'Your mental and environmental health seem stable. Keep monitoring!';
}

// Start server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

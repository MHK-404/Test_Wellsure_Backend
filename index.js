// Load environment variables from .env file
require('dotenv').config();  // This loads your .env file and makes the variables available

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const axios = require('axios');
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Serve the welcome page
app.get('/welcome', (req, res) => {
    res.sendFile(__dirname + '/welcome.html');
});

// Serve the questionnaire page
app.get('/questionnaire', (req, res) => {
    res.sendFile(__dirname + '/questionnaire.html');
});

// Serve the results page
app.get('/results', (req, res) => {
    res.sendFile(__dirname + '/results.html');
});

// Endpoint to handle the form submission
app.post('/submit', async (req, res) => {
    const data = req.body;

    // Physical Health Calculations
    const weight = parseFloat(data.weight);
    const height = parseFloat(data.height) / 100;  // Convert cm to meters
    const bmi = weight / (height * height);

    // Mental Health Score (scale 1 to 10, higher is worse)
    const stressLevel = parseInt(data.stress) || 0;
    const sleepHours = parseInt(data.sleep) || 0;

    // Calculate Risk Score out of 1000
    let riskScore = 1000;
    riskScore -= bmi > 25 ? 150 : 0;  // Deduct for high BMI
    riskScore -= stressLevel * 20;  // Deduct for stress
    riskScore -= sleepHours < 6 ? 100 : 0;  // Deduct for insufficient sleep

    // Mental and Physical Health Scores
    const physicalScore = Math.max(0, 1000 - bmi * 10); // Adjust physical score based on BMI
    const mentalScore = Math.max(0, 1000 - stressLevel * 30); // Adjust mental score based on stress

    // AI-generated recommendations and feedback (using OpenAI)
    const recommendations = await getRecommendations(data.feelings, data.environment);
    const textFeedback = await generateTextFeedback(data.feelings, data.environment);

    // Send back the results
    res.json({
        riskScore,
        physicalScore,
        mentalScore,
        recommendations,
        textFeedback
    });
});

// Function to get recommendations from OpenAI
async function getRecommendations(feelings, environment) {
    try {
        const response = await axios.post('https://api.openai.com/v1/completions', {
            model: 'text-davinci-003',
            prompt: `Generate health recommendations based on the following input: \nFeelings: ${feelings}\nEnvironment: ${environment}`,
            max_tokens: 150,
            temperature: 0.7
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        return response.data.choices[0].text.trim().split("\n").map(item => item.trim()).filter(item => item);
    } catch (error) {
        console.error('Error generating recommendations:', error);
        return ["Exercise regularly to improve physical health.", "Reduce stress through relaxation techniques.", "Get more sleep for better well-being."];
    }
}

// Function to generate feedback based on text answers using OpenAI
async function generateTextFeedback(feelings, environment) {
    try {
        const response = await axios.post('https://api.openai.com/v1/completions', {
            model: 'text-davinci-003',
            prompt: `Provide personalized feedback based on the following input:\nFeelings: ${feelings}\nEnvironment: ${environment}`,
            max_tokens: 200,
            temperature: 0.7
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        return response.data.choices[0].text.trim();
    } catch (error) {
        console.error('Error generating text feedback:', error);
        return `Your emotional state in the past week has been described as: ${feelings}. You live in an environment where: ${environment}. It would be beneficial to reflect on these and make adjustments to your lifestyle accordingly.`;
    }
}

// Start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

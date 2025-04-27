const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(bodyParser.json());

// Calculate BMI
function calculateBMI(weight, height) {
    const heightInMeters = height / 100;
    return weight / (heightInMeters * heightInMeters);
}

// Calculate physical health score (0-500)
function calculatePhysicalScore(answers) {
    let score = 0;
    
    // Exercise
    score += answers.exercise * 20;
    
    // Diet
    score += answers.diet === 'healthy' ? 100 : answers.diet === 'average' ? 50 : 0;
    
    // Sleep
    if (answers.sleep >= 7 && answers.sleep <= 9) score += 100;
    else if (answers.sleep >= 6 || answers.sleep === 10) score += 50;
    
    // BMI adjustment
    const bmi = calculateBMI(answers.weight, answers.height);
    if (bmi < 18.5 || bmi > 25) score -= 50;
    if (bmi < 16 || bmi > 30) score -= 100;
    
    // Other factors
    score += answers.checkups === 'regular' ? 50 : 0;
    score += answers.water >= 8 ? 50 : 0;
    score += answers.energy === 'high' ? 50 : answers.energy === 'medium' ? 25 : 0;
    score += answers.smoke ? -100 : 0;
    
    return Math.max(0, Math.min(500, score));
}

// Calculate mental health score (0-500)
function calculateMentalScore(answers) {
    let score = 500; // Start with max and subtract
    
    // Stress
    score -= answers.stress * 50;
    
    // Mood
    score -= answers.mood === 'low' ? 100 : answers.mood === 'medium' ? 50 : 0;
    
    // Other factors
    score -= answers.support === 'none' ? 100 : answers.support === 'some' ? 50 : 0;
    score -= answers.focus === 'poor' ? 50 : 0;
    score -= answers.loneliness * 30;
    
    return Math.max(0, score);
}

// Analyze sentiment
function analyzeSentiment(text) {
    const positiveWords = ['happy', 'good', 'great', 'joy', 'love', 'calm', 'peaceful'];
    const negativeWords = ['sad', 'bad', 'terrible', 'angry', 'hate', 'anxious', 'stress'];
    
    let positive = 0;
    let negative = 0;
    
    const words = text.toLowerCase().split(/\s+/);
    words.forEach(word => {
        if (positiveWords.includes(word)) positive++;
        if (negativeWords.includes(word)) negative++;
    });
    
    const score = (positive - negative) / words.length * 100;
    return {
        score: score,
        sentiment: score > 0 ? 'positive' : score < 0 ? 'negative' : 'neutral',
        positiveWords: positive,
        negativeWords: negative
    };
}

// API Endpoints
app.post('/api/calculate-score', (req, res) => {
    const { physical, mental } = req.body;
    
    const physicalScore = calculatePhysicalScore(physical);
    const mentalScore = calculateMentalScore(mental);
    const totalScore = Math.round(physicalScore + mentalScore);
    
    res.json({
        physicalScore: physicalScore,
        mentalScore: mentalScore,
        totalScore: totalScore,
        riskCategory: getRiskCategory(totalScore)
    });
});

app.post('/api/analyze-feelings', (req, res) => {
    const { text } = req.body;
    const analysis = analyzeSentiment(text);
    
    res.json({
        analysis: analysis,
        recommendations: generateFeelingsRecommendations(analysis)
    });
});

function getRiskCategory(score) {
    if (score <= 199) return 'Excellent';
    if (score <= 399) return 'Good';
    if (score <= 599) return 'Moderate';
    if (score <= 799) return 'High';
    return 'Very High';
}

function generateFeelingsRecommendations(analysis) {
    if (analysis.sentiment === 'positive') {
        return "Your positive outlook is great for your wellbeing. Consider journaling to maintain this mindset.";
    } else if (analysis.sentiment === 'negative') {
        return "Your responses suggest some negative feelings. Mindfulness exercises may help improve your outlook.";
    }
    return "Your feelings seem balanced. Reflect on what brings you joy and what causes stress.";
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

// Risk calculation function
function calculateRisk(data) {
    let riskScore = 0;
    let recommendations = [];
    
    // Age factor
    if (data.age < 25) riskScore += 1;
    else if (data.age >= 25 && data.age < 40) riskScore += 2;
    else if (data.age >= 40 && data.age < 60) riskScore += 3;
    else riskScore += 4;
    
    // Smoking
    if (data.smoke === 'Yes') {
        riskScore += 3;
        recommendations.push("Consider smoking cessation programs to reduce health risks.");
    }
    
    // Chronic conditions
    const conditions = Array.isArray(data.conditions) ? data.conditions : [data.conditions];
    if (conditions.includes('none')) {
        riskScore += 0;
    } else {
        riskScore += conditions.length * 2;
        recommendations.push("Regular health check-ups are recommended for managing your chronic conditions.");
    }
    
    // Stress level
    const stress = parseInt(data.stress) || 5;
    riskScore += Math.floor(stress / 3);
    if (stress > 5) {
        recommendations.push("Practice stress management techniques like meditation or yoga.");
    }
    
    // Mental health
    const wellbeing = parseInt(data.mentalWellbeing) || 5;
    if (wellbeing < 5) {
        riskScore += 2;
        recommendations.push("Consider speaking with a mental health professional for support.");
    }
    
    // Screen time
    if (data.screenTime.includes('More than 6 hours')) {
        riskScore += 1;
        recommendations.push("Reduce screen time and take regular breaks to protect your eye health.");
    }
    
    // Physical activity
    if (data.occupation === 'Sedentary') {
        riskScore += 1;
        recommendations.push("Incorporate regular physical activity into your routine.");
    }
    
    // Determine risk category
    let riskCategory;
    if (riskScore < 5) riskCategory = "Low Risk";
    else if (riskScore < 10) riskCategory = "Moderate Risk";
    else riskCategory = "High Risk";
    
    // Default recommendations if none triggered
    if (recommendations.length === 0) {
        recommendations.push("Your health profile looks good! Maintain your healthy habits.");
    }
    
    return { riskScore, riskCategory, recommendations };
}

// API endpoint
app.post('/assess', (req, res) => {
    try {
        const riskData = calculateRisk(req.body);
        res.json({
            status: 'success',
            riskCategory: riskData.riskCategory,
            riskScore: riskData.riskScore,
            recommendations: riskData.recommendations
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'An error occurred during risk assessment'
        });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
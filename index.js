const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const fs = require('fs');
const { jsPDF } = require('jspdf');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));

// Health risk score calculation
function calculateHealthRisk(data) {
    let score = 1000;

    // Physical Health
    if (data.exercise === 'D') score -= 150;
    if (data.chronic_conditions === 'A') score -= 200;
    if (data.physical_health === 'C') score -= 100;
    if (data.physical_health === 'D') score -= 150;
    if (data.healthy_diet === 'C') score -= 100;
    if (data.doctor_checkup === 'C' || data.doctor_checkup === 'D') score -= 100;

    // Mental Health
    if (data.stress === 'C' || data.stress === 'D') score -= 200;
    if (data.depression === 'C' || data.depression === 'D') score -= 300;
    if (data.stress_management === 'C' || data.stress_management === 'D') score -= 150;
    if (data.mental_health_support === 'C' || data.mental_health_support === 'D') score -= 200;
    if (data.sleep_disturbance === 'C' || data.sleep_disturbance === 'D') score -= 150;

    // Environment
    if (data.safety === 'C' || data.safety === 'D') score -= 100;
    if (data.air_quality === 'C' || data.air_quality === 'D') score -= 150;
    if (data.living_space === 'C' || data.living_space === 'D') score -= 100;
    if (data.green_spaces === 'C' || data.green_spaces === 'D') score -= 100;
    if (data.income_stability === 'C' || data.income_stability === 'D') score -= 100;

    // Age, weight, height for BMI calculation
    const heightInMeters = data.height / 100;
    const bmi = data.weight / (heightInMeters * heightInMeters);

    // Adjust score based on BMI
    if (bmi < 18.5) score -= 100;  // Underweight
    else if (bmi >= 25) score -= 150; // Overweight/Obese

    return score;
}

// Generate recommendations based on answers
function generateRecommendations(data) {
    let recommendations = [];

    if (data.exercise === 'D') recommendations.push("Exercise daily to maintain good physical health.");
    if (data.chronic_conditions === 'A') recommendations.push("Consult with a doctor regularly about your chronic conditions.");
    if (data.physical_health === 'C' || data.physical_health === 'D') recommendations.push("Consider improving your diet and exercise routine.");
    if (data.healthy_diet === 'C') recommendations.push("Try to eat balanced meals and avoid skipping meals.");
    if (data.doctor_checkup === 'C' || data.doctor_checkup === 'D') recommendations.push("Visit a doctor for regular check-ups to monitor your health.");
    if (data.stress === 'C' || data.stress === 'D') recommendations.push("Consider stress management techniques or therapy.");
    if (data.depression === 'C' || data.depression === 'D') recommendations.push("Seek mental health support if you're experiencing symptoms of depression.");
    if (data.sleep_disturbance === 'C' || data.sleep_disturbance === 'D') recommendations.push("Improve your sleep habits and seek help if needed.");
    if (data.safety === 'C' || data.safety === 'D') recommendations.push("Take steps to improve your sense of safety at home.");
    if (data.air_quality === 'C' || data.air_quality === 'D') recommendations.push("Consider air purifiers or moving to an area with better air quality.");
    if (data.living_space === 'C' || data.living_space === 'D') recommendations.push("Try to reduce noise levels in your living environment.");
    if (data.green_spaces === 'C' || data.green_spaces === 'D') recommendations.push("Try to spend time in green spaces to improve your well-being.");
    if (data.income_stability === 'C' || data.income_stability === 'D') recommendations.push("Consider finding ways to stabilize your income and reduce financial stress.");

    return recommendations;
}

// Calculate insurance cost based on risk score
function calculateInsuranceCost(riskScore, income) {
    let cost = 0;

    if (riskScore > 800) cost = 0.15 * income; // High risk
    else if (riskScore > 600) cost = 0.10 * income; // Medium risk
    else cost = 0.05 * income; // Low risk

    return cost;
}

// Generate PDF summary
function generatePDF(score, recommendations, income, insuranceCost) {
    const doc = new jsPDF();

    doc.text("Wellsure Health Risk Summary", 20, 20);
    doc.text(`Health Risk Score: ${score}`, 20, 40);
    doc.text("Recommendations:", 20, 60);
    let y = 70;
    recommendations.forEach((rec, index) => {
        doc.text(`${index + 1}. ${rec}`, 20, y);
        y += 10;
    });
    doc.text(`Yearly Income: AED ${income}`, 20, y + 20);
    doc.text(`Estimated Health Insurance Cost: AED ${insuranceCost.toFixed(2)}`, 20, y + 30);

    doc.save('summary.pdf');
}

// Backend route for health risk calculation
app.post('/calculate', (req, res) => {
    const userData = req.body;

    // Calculate health risk score
    const riskScore = calculateHealthRisk(userData);

    // Generate recommendations
    const recommendations = generateRecommendations(userData);

    // Send back the score and recommendations
    res.json({
        riskScore,
        recommendations
    });
});

// Backend route for calculating insurance
app.post('/calculate-insurance', (req, res) => {
    const { riskScore, income } = req.body;

    // Calculate insurance cost
    const insuranceCost = calculateInsuranceCost(riskScore, income);

    res.json({
        insuranceCost
    });
});

// Backend route to download PDF
app.get('/summary.pdf', (req, res) => {
    const { score, recommendations, income, insuranceCost } = req.query;

    generatePDF(score, recommendations.split(','), income, insuranceCost);
    res.download('summary.pdf'); // Assuming you have a method to generate the PDF
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

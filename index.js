import express from 'express';
import cors from 'cors';
import morgan from 'morgan';

const app = express();
const PORT = process.env.PORT || 3000;

// Allow CORS for frontend
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(morgan('dev'));

// Risk calculation logic
function calculateRisk(data) {
  let riskScore = 0;
  let recommendations = [];

  // Age
  if (data.age < 25) riskScore += 1;
  else if (data.age < 40) riskScore += 2;
  else if (data.age < 60) riskScore += 3;
  else riskScore += 4;

  // Smoking
  if (data.smoke === 'Yes') {
    riskScore += 3;
    recommendations.push("Consider smoking cessation programs to reduce health risks.");
  }

  // Chronic conditions
  const conditions = Array.isArray(data.conditions) ? data.conditions : [data.conditions];
  if (!conditions.includes('none')) {
    riskScore += conditions.length * 2;
    recommendations.push("Manage your chronic conditions through regular check-ups.");
  }

  // Mental well-being rating (1–10)
  const mentalWellbeing = parseInt(data.mentalWellbeing) || 5;
  if (mentalWellbeing < 4) {
    riskScore += 2;
    recommendations.push("Low mental well-being scores suggest seeking support.");
  }

  // Mental health support
  if (data.mentalSupport === 'Yes') {
    riskScore += 1;
    recommendations.push("Continue consulting professionals for mental health support.");
  }

  // Mental health issues (checkbox group)
  const mentalIssues = Array.isArray(data.mentalIssues) ? data.mentalIssues : [data.mentalIssues];
  if (!mentalIssues.includes('none')) {
    riskScore += mentalIssues.length;
    recommendations.push("Prioritize mental wellness with therapy, rest, and relaxation.");
  }

  // Stress level
  const stress = parseInt(data.stress) || 5;
  riskScore += Math.floor(stress / 3);
  if (stress > 5) {
    recommendations.push("Try stress-reducing activities like mindfulness or exercise.");
  }

  // Determine category
  let riskCategory = "Low Risk";
  if (riskScore >= 10) riskCategory = "High Risk";
  else if (riskScore >= 5) riskCategory = "Moderate Risk";

  if (recommendations.length === 0) {
    recommendations.push("Your health profile looks good. Keep maintaining it!");
  }

  return {
    riskScore,
    riskCategory,
    recommendations
  };
}

// POST endpoint
app.post('/api/assess', (req, res) => {
  try {
    const result = calculateRisk(req.body);
    res.json({
      status: 'success',
      ...result
    });
  } catch (error) {
    console.error("Error in assessment:", error);
    res.status(500).json({
      status: 'error',
      message: 'Risk assessment failed. Please try again later.'
    });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running at https://wellsure-backend-edfyfja5b4bmegct.uaenorth-01.azurewebsites.net`);
});

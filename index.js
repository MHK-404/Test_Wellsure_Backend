import express from 'express';
import cors from 'cors';
import morgan from 'morgan';

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ Allow only your frontend origin
app.use(cors({
  origin: 'https://mango-wave-02f3f921e.6.azurestaticapps.net',
  methods: ['POST'],
  credentials: false
}));

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
  if (data.smoke.includes('Yes')) {
    riskScore += 3;
    recommendations.push("Consider enrolling in a smoking cessation program or support group.");

    if (data.smokeAmount) {
      if (data.smokeAmount.includes('More than 20')) riskScore += 2;
      else if (data.smokeAmount.includes('10-20')) riskScore += 1.5;
      else if (data.smokeAmount.includes('5-10')) riskScore += 1;
    }
  }

  // Removed alcohol scoring

  // Chronic Conditions
  const conditions = Array.isArray(data.conditions) ? data.conditions : [data.conditions];
  if (!conditions.includes('none')) {
    riskScore += conditions.length * 2;
    recommendations.push("Maintain regular check-ups and follow treatment plans for any chronic condition(s).");
  }

  // BMI
  const heightM = (parseFloat(data.height) || 0) / 100;
  const weight = parseFloat(data.weight) || 0;
  if (heightM > 0 && weight > 0) {
    const bmi = weight / (heightM * heightM);
    if (bmi < 18.5) {
      riskScore += 1;
      recommendations.push("You may be underweight. Consider nutritional guidance.");
    } else if (bmi >= 25 && bmi < 30) {
      riskScore += 1;
      recommendations.push("You are overweight. A balanced diet and exercise plan could be beneficial.");
    } else if (bmi >= 30) {
      riskScore += 2;
      recommendations.push("Obesity increases risk for many conditions. Consider professional health advice.");
    }
  }

  // Stress & Mental Health
  const stress = parseInt(data.stress) || 5;
  riskScore += Math.floor(stress / 3);
  if (stress > 5) recommendations.push("Practice stress management techniques regularly.");

  const mentalIssues = Array.isArray(data.mentalIssues) ? data.mentalIssues : [data.mentalIssues];
  if (!mentalIssues.includes('none')) {
    riskScore += mentalIssues.length;
    recommendations.push("Consider speaking with a mental health professional about symptoms like anxiety, depression, or insomnia.");
  }

  // Lifestyle
  if (data.screenTime && data.screenTime.includes('More than 6')) riskScore += 1;
  if (data.vacations && data.vacations.includes('Never')) {
    riskScore += 1;
    recommendations.push("Taking breaks and vacations can improve well-being. Consider planning occasional time off.");
  }

  if (data.sleep && data.sleep.includes('Less than 5')) {
    riskScore += 2;
    recommendations.push("Aim for at least 7 hours of quality sleep each night.");
  }

  if (data.diet && data.diet.includes('Poor')) {
    riskScore += 2;
    recommendations.push("A healthier diet rich in whole foods can greatly improve overall health.");
  }

  if (data.exercise && data.exercise.includes('Never')) {
    riskScore += 2;
    recommendations.push("Regular physical activity can help reduce risk. Try starting small with daily walks.");
  }

  // Risk category
  let riskCategory;
  if (riskScore < 10) riskCategory = "Low Risk";
  else if (riskScore < 20) riskCategory = "Moderate Risk";
  else riskCategory = "High Risk";

  if (recommendations.length === 0) {
    recommendations.push("Your health profile looks good! Keep up the great habits.");
  }

  return { 
    riskScore, 
    riskCategory, 
    recommendations,
    physicalScore: Math.max(0, 100 - riskScore * 2.5), // Example calculation
    mentalScore: Math.max(0, 100 - (parseInt(data.stress) || 5) * 5, // Example calculation
    lifestyleScore: data.exercise && data.exercise.includes('Never') ? 50 : 80 // Example calculation
  };
}

// API endpoint
app.post('/assess', (req, res) => {
  try {
    const riskData = calculateRisk(req.body);
    res.json({
      status: 'success',
      riskCategory: riskData.riskCategory,
      riskScore: riskData.riskScore,
      recommendations: riskData.recommendations,
      physicalScore: riskData.physicalScore,
      mentalScore: riskData.mentalScore,
      lifestyleScore: riskData.lifestyleScore
    });
  } catch (error) {
    console.error('Assessment error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred during risk assessment'
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

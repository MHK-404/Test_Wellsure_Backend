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

  if (data.age < 25) riskScore += 1;
  else if (data.age < 40) riskScore += 2;
  else if (data.age < 60) riskScore += 3;
  else riskScore += 4;

  if (data.smoke === 'Yes') {
    riskScore += 3;
    recommendations.push("Consider smoking cessation programs.");
  }

  const conditions = Array.isArray(data.conditions) ? data.conditions : [data.conditions];
  if (!conditions.includes('none')) {
    riskScore += conditions.length * 2;
    recommendations.push("Regular health check-ups are recommended.");
  }

  const stress = parseInt(data.stress) || 5;
  riskScore += Math.floor(stress / 3);
  if (stress > 5) {
    recommendations.push("Try stress-reduction techniques like yoga or meditation.");
  }

  // Determine risk category
  let riskCategory;
  if (riskScore < 5) riskCategory = "Low Risk";
  else if (riskScore < 10) riskCategory = "Moderate Risk";
  else riskCategory = "High Risk";

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

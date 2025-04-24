import express from 'express';
import cors from 'cors';
import morgan from 'morgan';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: '*', methods: ['POST'] }));
app.use(express.json());
app.use(morgan('dev'));

function analyzeSentiment(text) {
  if (!text) return 5;
  const negativeWords = ['sad', 'tired', 'anxious', 'stressed', 'angry', 'overwhelmed'];
  const positiveWords = ['happy', 'calm', 'relaxed', 'peaceful', 'good', 'great'];
  const score = text.split(/\s+/).reduce((acc, word) => {
    const w = word.toLowerCase();
    if (positiveWords.includes(w)) return acc + 1;
    if (negativeWords.includes(w)) return acc - 1;
    return acc;
  }, 0);
  return Math.max(1, Math.min(10, 5 + score));
}

function calculateRisk(data) {
  let score = 0;
  const recommendations = [];
  let physical = 100, mental = 100;

  const age = parseInt(data.age);
  if (age < 30) score += 5;
  else if (age < 50) score += 10;
  else score += 15;

  if (data.smoke && data.smoke.includes('Yes')) {
    score += 15;
    physical -= 15;
    recommendations.push('Quit smoking — it reduces your risk significantly. Join support groups or nicotine therapy.');
  }

  const conds = Array.isArray(data.conditions) ? data.conditions : [data.conditions];
  if (!conds.includes('none')) {
    score += conds.length * 5;
    physical -= conds.length * 5;
    recommendations.push('Manage chronic conditions through diet, medication, and regular consultations.');
  }

  const h = parseFloat(data.height) / 100;
  const w = parseFloat(data.weight);
  if (h > 0 && w > 0) {
    const bmi = w / (h * h);
    if (bmi < 18.5 || bmi > 30) {
      score += 10;
      physical -= 10;
      recommendations.push('Maintain a healthy BMI with balanced nutrition and physical activity.');
    }
  }

  const stress = parseInt(data.stress);
  const wellbeing = parseInt(data.mentalWellbeing);
  score += stress * 1.5;
  mental -= stress * 2;

  if (stress > 6) recommendations.push('High stress impacts both physical and mental health. Try mindfulness, breathing exercises, or journaling.');
  if (wellbeing < 5) recommendations.push('Low well-being may signal emotional fatigue. Consider counseling or talking to someone you trust.');

  const sentiment = analyzeSentiment(data.mentalText);
  score += (10 - sentiment);
  mental -= (10 - sentiment) * 2;

  // Additional general suggestions
  if (physical < 70) recommendations.push('Increase physical activity and hydration to improve resilience and lower risk.');
  if (mental < 70) recommendations.push('Strengthen social connections and prioritize self-care to boost mental health.');

  score = Math.min(100, Math.max(0, score));
  physical = Math.max(0, physical);
  mental = Math.max(0, mental);

  let category = 'Low Risk';
  if (score > 66) category = 'High Risk';
  else if (score > 33) category = 'Moderate Risk';

  return {
    riskScore: Math.round(score),
    riskCategory: category,
    recommendations,
    physicalScore: Math.round(physical),
    mentalScore: Math.round(mental),
    lifestyleScore: 0
  };
}

app.post('/assess', (req, res) => {
  try {
    const results = calculateRisk(req.body);
    res.json(results);
  } catch (e) {
    console.error('Assessment error:', e);
    res.status(500).json({ status: 'error', message: 'Something went wrong.' });
  }
});

app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});

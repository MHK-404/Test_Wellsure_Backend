import express from 'express';
import cors from 'cors';
import morgan from 'morgan';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: 'https://mango-wave-02f3f921e.6.azurestaticapps.net',
  methods: ['POST'],
  credentials: false
}));

app.use(express.json());
app.use(morgan('dev'));

// Risk calculation logic
function calculateRisk(data) {
  let riskScore = 50; // Start at midpoint (500/1000)
  let recommendations = [];
  let physicalScore = 1000;
  let mentalScore = 1000;

  // Age calculation
  if (data.age < 25) {
    riskScore += 50;
    physicalScore -= 50;
  } else if (data.age < 40) {
    riskScore += 100;
    physicalScore -= 100;
  } else if (data.age < 60) {
    riskScore += 150;
    physicalScore -= 150;
  } else {
    riskScore += 200;
    physicalScore -= 200;
  }

  // Smoking calculation
  if (data.smoke.includes('Yes')) {
    riskScore += 150;
    physicalScore -= 200;
    recommendations.push("🚭 Smoking significantly impacts your health risk profile. Consider enrolling in a smoking cessation program. Studies show quitting before age 40 reduces smoking-related death risk by 90%. Stop Smoking and you risk score will decrease by at least 150 points, this link provide a help guide from an accredited hospital :https://www.mayoclinic.org/healthy-lifestyle/quit-smoking/in-depth/nicotine-craving/art-20045454#:~:text=Try%20setting%20an%20alarm%20for,you%20use%20tobacco%20or%20nicotine.");

    if (data.smokeAmount) {
      if (data.smokeAmount.includes('More than 20')) {
        riskScore += 100;
        physicalScore -= 150;
      }
      else if (data.smokeAmount.includes('10-20')) {
        riskScore += 75;
        physicalScore -= 100;
      }
      else if (data.smokeAmount.includes('5-10')) {
        riskScore += 50;
        physicalScore -= 75;
      }
    }
  }

  // Chronic Conditions
  const conditions = Array.isArray(data.conditions) ? data.conditions : [data.conditions];
  if (!conditions.includes('none')) {
    riskScore += conditions.length * 100;
    physicalScore -= conditions.length * 150;
    recommendations.push("🩺 Chronic conditions require careful management. Maintain regular check-ups with your healthcare provider and strictly follow treatment plans. Proper management can significantly reduce complications. Managing chronic diseases can decrease risk score");
  }

  // BMI calculation
  const heightM = (parseFloat(data.height) || 0) / 100;
  const weight = parseFloat(data.weight) || 0;
  if (heightM > 0 && weight > 0) {
    const bmi = weight / (heightM * heightM);
    if (bmi < 18.5) {
      riskScore += 75;
      physicalScore -= 100;
      recommendations.push("📊 Your BMI suggests you may be underweight. Consult a nutritionist for personalized dietary advice. Underweight individuals may have increased risk of osteoporosis and fertility issues. losing weigth will decrease your risk score by at least 75 points");
    } else if (bmi >= 25 && bmi < 30) {
      riskScore += 100;
      physicalScore -= 150;
      recommendations.push("⚖️ Your BMI indicates overweight status. A balanced diet with portion control and 150+ minutes of weekly exercise can help. Even 5-10% weight loss significantly reduces health risks. losing weigth will decrease your risk score by at least 100 points");
    } else if (bmi >= 30) {
      riskScore += 200;
      physicalScore -= 250;
      recommendations.push("⚠️ Obesity increases risk for diabetes, heart disease, and joint problems. Consider consulting a bariatric specialist. Structured weight loss programs often achieve 8-10% weight reduction in 6 months. losing weigth will decrease your risk score by at least 200 points, this calorie calculator help with weight management: https://mohap.gov.ae/en/awareness-centre/daily-calorie-requirements-calculator ");
    }
  }

  // Exercise
  if (data.exercise && data.exercise.includes('Never')) {
    riskScore += 80;
    physicalScore -= 200;
    recommendations.push("🏃‍♂️ Sedentary lifestyle increases all-cause mortality by 20-30%. Start with 10-minute walks daily, gradually increasing to 30 minutes. Even light activity reduces cardiovascular risks. Exersing might decrease your risk score by 80, this is a guide for helping people start exercising: https://www.healthline.com/nutrition/how-to-start-exercising");
  } else if (data.exercise && data.exercise.includes('1-2 times per week')) {
    riskScore += 50;
    physicalScore -= 75;
  }

  // Stress & Mental Health
  const stress = parseInt(data.stress) || 5;
  riskScore += stress * 20;
  mentalScore -= stress * 30;
  
  if (stress > 5) {
    recommendations.push("🧘 Chronic stress increases cortisol levels, impacting immunity and heart health. Try mindfulness meditation - just 10 minutes daily can reduce stress markers by 30% within 8 weeks. Managing stress could reduce risk score greatly, here is a guide in managing stress: https://www.mentalhealth.org.uk/explore-mental-health/publications/how-manage-and-reduce-stress");
  }

 

  // Sleep
  if (data.sleep && data.sleep.includes('Less than 5')) {
    riskScore += 120;
    mentalScore -= 200;
    physicalScore -= 150;
    recommendations.push("😴 Chronic sleep deprivation increases Alzheimer's risk and impairs glucose metabolism. Establish a consistent bedtime routine and limit screen time before bed. 7-9 hours is optimal for adults. Sleeping well will decrease your risk score by at least 120 points");
  }

  // Diet
  if (data.diet && data.diet.includes('Poor')) {
    riskScore += 80;
    physicalScore -= 175;
    recommendations.push("🥗 A diet high in processed foods increases inflammation. Transition to Mediterranean-style eating: emphasize vegetables, whole grains, healthy fats. Small changes like swapping soda for sparkling water make a difference. eating healthy will decrease your risk score by at least 80 points");
  }

  // Lifestyle factors
  if (data.screenTime && data.screenTime.includes('More than 6')) {
    riskScore += 75;
    mentalScore -= 100;
    recommendations.push("💻 Excessive screen time disrupts circadian rhythms. Follow the 20-20-20 rule: every 20 minutes, look at something 20 feet away for 20 seconds. Consider blue light filters in evenings.");
  }
  
  if (data.vacations && data.vacations.includes('Never')) {
    riskScore += 80;
    mentalScore -= 150;
    recommendations.push("✈️ Regular breaks reduce burnout risk by 40%. Even 'staycations' or long weekends provide mental health benefits. Schedule downtime just as you would important meetings.Taking good amount of rest will decrease your risk score by at least 80 points");
  }

  // Ensure scores are within bounds
  physicalScore = Math.max(0, Math.min(1000, physicalScore));
  mentalScore = Math.max(0, Math.min(1000, mentalScore));
  riskScore = Math.max(0, Math.min(1000, riskScore));

  // Enhanced risk categories (5 levels)
  let riskCategory;
  if (riskScore < 300) riskCategory = "Very Low Risk";
  else if (riskScore < 500) riskCategory = "Low Risk";
  else if (riskScore < 700) riskCategory = "Moderate Risk";
  else if (riskScore < 900) riskCategory = "High Risk";
  else riskCategory = "Very High Risk";

  // Default recommendation if none generated
  if (recommendations.length === 0) {
    recommendations.push("🌟 Your health profile is excellent! Maintain these habits with annual check-ups. Consider preventive screenings appropriate for your age group.");
  }

  return { 
    riskScore: Math.round(riskScore), 
    riskCategory, 
    recommendations,
    physicalScore: Math.round(physicalScore),
    mentalScore: Math.round(mentalScore)
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
      mentalScore: riskData.mentalScore
    });
  } catch (error) {
    console.error('Assessment error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred during risk assessment'
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

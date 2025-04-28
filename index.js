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
    riskScore += 75;
    physicalScore -= 75;
  } else if (data.age < 60) {
    riskScore += 100;
    physicalScore -= 100;
  } else {
    riskScore += 150;
    physicalScore -= 150;
  }

  // Smoking calculation
  if (data.smoke.includes('Yes')) {
    riskScore += 100;
    physicalScore -= 150;
    recommendations.push("🚭 Smoking significantly impacts your health risk profile. Consider enrolling in a smoking cessation program. Studies show quitting before age 40 reduces smoking-related death risk by 90%. Stop Smoking and you risk score will decrease by at least 150 points, this link provides a help guide from an accredited hospital: https://www.mayoclinic.org/healthy-lifestyle/quit-smoking/in-depth/nicotine-craving/art-20045454#:~:text=Try%20setting%20an%20alarm%20for,you%20use%20tobacco%20or%20nicotine.");

    if (data.smokeAmount) {
      if (data.smokeAmount.includes('More than 20')) {
        riskScore += 75;
        physicalScore -= 100;
      } else if (data.smokeAmount.includes('10-20')) {
        riskScore += 50;
        physicalScore -= 75;
      } else if (data.smokeAmount.includes('5-10')) {
        riskScore += 35;
        physicalScore -= 50;
      }
    }
  }

  // Chronic Conditions
  const conditions = Array.isArray(data.conditions) ? data.conditions : [data.conditions];
  if (!conditions.includes('none')) {
    riskScore += conditions.length * 75; // Gradual increase in risk score based on conditions
    physicalScore -= conditions.length * 100; // More balanced decrease in physical score
    recommendations.push("🩺 Chronic conditions require careful management. Maintain regular check-ups with your healthcare provider and strictly follow treatment plans. Proper management can significantly reduce complications.");
  }

  // BMI calculation
  const heightM = (parseFloat(data.height) || 0) / 100;
  const weight = parseFloat(data.weight) || 0;

  if (heightM > 0 && weight > 0) {
    const bmi = weight / (heightM * heightM);
    let bmiCategory = "";

    if (bmi < 18.5) {
      bmiCategory = "Underweight";
      riskScore += 50;
      physicalScore -= 75;
      recommendations.push(`📊 Your BMI is ${bmi.toFixed(1)} (${bmiCategory}). Being underweight may increase the risk of osteoporosis and fertility issues. Consult a nutritionist for a personalized plan. Gaining healthy weight could decrease your risk score by at least 75 points.`);
    } else if (bmi >= 18.5 && bmi < 25) {
      bmiCategory = "Normal weight";
      recommendations.push(`✅ Your BMI is ${bmi.toFixed(1)} (${bmiCategory}). Maintaining a healthy weight is great for long-term health. Keep up your balanced diet and regular exercise!`);
    } else if (bmi >= 25 && bmi < 30) {
      bmiCategory = "Overweight";
      riskScore += 80; // Reduced from 100
      physicalScore -= 120; // Reduced from 150
      recommendations.push(`⚖️ Your BMI is ${bmi.toFixed(1)} (${bmiCategory}). A balanced diet with portion control and 150+ minutes of weekly exercise can help. Losing even 5-10% of your body weight can significantly reduce health risks. Weight loss could lower your risk score by at least 80 points.`);
    } else if (bmi >= 30) {
      bmiCategory = "Obesity";
      riskScore += 150; // Reduced from 200
      physicalScore -= 200; // Reduced from 250
      recommendations.push(`⚠️ Your BMI is ${bmi.toFixed(1)} (${bmiCategory}). Obesity raises risks for diabetes, heart disease, and joint problems. Consider consulting a healthcare provider or bariatric specialist. Losing weight could decrease your risk score by at least 150 points. Here's a calorie calculator to help: https://mohap.gov.ae/en/awareness-centre/daily-calorie-requirements-calculator`);
    }
  }

  // Exercise
  if (data.exercise && (data.exercise.includes('Never') || data.exercise.includes('Rarely (less than once a week)'))) {
    riskScore += 60; // Lower risk increase
    physicalScore -= 120; // More balanced physical score reduction
    recommendations.push("🏃‍♂️ Sedentary lifestyle increases all-cause mortality by 20-30%. Start with 10-minute walks daily, gradually increasing to 30 minutes. Even light activity reduces cardiovascular risks. Exercising might decrease your risk score by 60. This is a guide for helping people start exercising: https://www.healthline.com/nutrition/how-to-start-exercising");
  } else if (data.exercise && data.exercise.includes('1-2 times per week')) {
    riskScore += 40; // More moderate increase
    physicalScore -= 60; // Lower physical score reduction
    recommendations.push("🏃‍♂️ Since you are exercising once or twice a week, increasing that might help reduce the risk score");
  }

  // Stress & Mental Health
  const stress = parseInt(data.stress) || 5;
  riskScore += Math.min(stress * 10, 100); // Limited increase in risk score from stress
  mentalScore -= Math.min(stress * 15, 150); // Cap the mental score reduction
  
  if (stress > 5) {
    recommendations.push("🧘 Chronic stress increases cortisol levels, impacting immunity and heart health. Try mindfulness meditation - just 10 minutes daily can reduce stress markers by 30% within 8 weeks. Managing stress could reduce risk score greatly, here is a guide in managing stress: https://www.mentalhealth.org.uk/explore-mental-health/publications/how-manage-and-reduce-stress");
  }

  // Sleep
  if (data.sleep && data.sleep.includes('Less than 5')) {
    riskScore += 50; // Reduced risk increase
    mentalScore -= 100; // More gradual reduction
    physicalScore -= 75; // Lower physical score impact
    recommendations.push("😴 Chronic sleep deprivation increases Alzheimer's risk and impairs glucose metabolism. Establish a consistent bedtime routine and limit screen time before bed. 7-9 hours is optimal for adults. Sleeping well will decrease your risk score by at least 100 points, a guide to help with sleeping problems is here: https://www.mayoclinic.org/healthy-lifestyle/adult-health/in-depth/sleep/art-20048379");
  }

  // Diet
  if (data.diet && data.diet.includes('Poor')) {
    riskScore += 50; // Reduced increase in risk score
    physicalScore -= 120; // More balanced physical score reduction
    recommendations.push("🥗 A diet high in processed foods increases inflammation. Transition to Mediterranean-style eating: emphasize vegetables, whole grains, healthy fats. Small changes like swapping soda for sparkling water make a difference. Eating healthy will decrease your risk score by at least 70 points, a guide to Mediterranean-diet is here: https://www.health.harvard.edu/blog/a-practical-guide-to-the-mediterranean-diet-2019032116194");
  }

  // Lifestyle factors
  if (data.screenTime && data.screenTime.includes('More than 6')) {
    riskScore += 40; // Lower risk increase
    mentalScore -= 70; // More balanced reduction in mental health
    recommendations.push("💻 Excessive screen time disrupts circadian rhythms. Follow the 20-20-20 rule: every 20 minutes, look at something 20 feet away for 20 seconds. Consider blue light filters in evenings.");
  }

  // Air Quality
  if (data.airQuality && (data.airQuality.includes('Poor') || data.airQuality.includes('Very Poor'))) {
    riskScore += 50; // Reduced risk increase
    recommendations.push("🌬️ Poor air quality can worsen respiratory and cardiovascular health. Consider investing in high-quality air purifiers, and sealing windows. If possible, relocating to an area with better air quality can significantly improve health. Here's a guide on improving indoor air: https://www.epa.gov/indoor-air-quality-iaq/improving-indoor-air-quality");
  }

  // Vacation
  if (data.vacations && data.vacations.includes('Never')) {
    riskScore += 60; // Gradual increase
    mentalScore -= 100; // Gradual mental score decrease
    recommendations.push("✈️ Regular breaks reduce burnout risk by 40%. Even 'staycations' or long weekends provide mental health benefits. Schedule downtime just as you would important meetings.");
  }

  // Commute Time
  if (data.commute && data.commute.includes('More than 1 hour')) {
    riskScore += 40; // Reduced risk increase
    recommendations.push("🚗 Long commutes increase stress and health risks. Try public transport, carpooling, or adjusting work hours. Reduce time spent in transit to improve well-being.");
  }

  // Return results
  return { 
    riskScore,
    physicalScore,
    mentalScore,
    recommendations
  };
}

app.post('/calculate', (req, res) => {
  const { data } = req.body;
  const results = calculateRisk(data);
  res.json(results);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

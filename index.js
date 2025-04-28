import express from 'express';
import cors from 'cors';
import morgan from 'morgan';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: 'https://mango-wave-02f3f921e.6.azurestaticapps.net',
  methods: ['GET', 'POST','OPTIONS'],
  allowedHeaders: ['Content-Type'],
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
    let bmiCategory = "";

    if (bmi < 18.5) {
        bmiCategory = "Underweight";
        riskScore += 75;
        physicalScore -= 100;
        recommendations.push(📊 Your BMI is ${bmi.toFixed(1)} (${bmiCategory}). Being underweight may increase the risk of osteoporosis and fertility issues. Consult a nutritionist for a personalized plan. Gaining healthy weight could decrease your risk score by at least 75 points.);
    } else if (bmi >= 18.5 && bmi < 25) {
        bmiCategory = "Normal weight";
        recommendations.push(✅ Your BMI is ${bmi.toFixed(1)} (${bmiCategory}). Maintaining a healthy weight is great for long-term health. Keep up your balanced diet and regular exercise!);
    } else if (bmi >= 25 && bmi < 30) {
        bmiCategory = "Overweight";
        riskScore += 100;
        physicalScore -= 150;
        recommendations.push(⚖️ Your BMI is ${bmi.toFixed(1)} (${bmiCategory}). A balanced diet with portion control and 150+ minutes of weekly exercise can help. Losing even 5-10% of your body weight can significantly reduce health risks. Weight loss could lower your risk score by at least 100 points.);
    } else if (bmi >= 30) {
        bmiCategory = "Obesity";
        riskScore += 200;
        physicalScore -= 250;
        recommendations.push(⚠️ Your BMI is ${bmi.toFixed(1)} (${bmiCategory}). Obesity raises risks for diabetes, heart disease, and joint problems. Consider consulting a healthcare provider or bariatric specialist. Losing weight could decrease your risk score by at least 200 points. Here's a calorie calculator to help: https://mohap.gov.ae/en/awareness-centre/daily-calorie-requirements-calculator);
    }
}


  // Exercise
 if (data.exercise && (data.exercise.includes('Never') || data.exercise.includes('Rarely (less than once a week)'))) {
    riskScore += 80;
    physicalScore -= 200;
    recommendations.push("🏃‍♂️ Sedentary lifestyle increases all-cause mortality by 20-30%. Start with 10-minute walks daily, gradually increasing to 30 minutes. Even light activity reduces cardiovascular risks. Exercising might decrease your risk score by 80. This is a guide for helping people start exercising: https://www.healthline.com/nutrition/how-to-start-exercising");
} else if (data.exercise && data.exercise.includes('1-2 times per week')) {
    riskScore += 50;
    physicalScore -= 75;
    recommendations.push("🏃‍♂️ Since you are excercising once or twice a week increasing that might help reduce the risk score");
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
    riskScore += 65;
    mentalScore -= 200;
    physicalScore -= 150;
    recommendations.push("😴 Chronic sleep deprivation increases Alzheimer's risk and impairs glucose metabolism. Establish a consistent bedtime routine and limit screen time before bed. 7-9 hours is optimal for adults. Sleeping well will decrease your risk score by at least 120 points, a guide to help with sleeping problems is here: https://www.mayoclinic.org/healthy-lifestyle/adult-health/in-depth/sleep/art-20048379");
  } 

  // Diet
  if (data.diet && data.diet.includes('Poor')) {
    riskScore += 65;
    physicalScore -= 175;
    recommendations.push("🥗 A diet high in processed foods increases inflammation. Transition to Mediterranean-style eating: emphasize vegetables, whole grains, healthy fats. Small changes like swapping soda for sparkling water make a difference. eating healthy will decrease your risk score by at least 80 points, a guide to Mediterranean-diet is here: https://www.health.harvard.edu/blog/a-practical-guide-to-the-mediterranean-diet-2019032116194 ");
  }

  // Lifestyle factors
  if (data.screenTime && data.screenTime.includes('More than 6')) {
    riskScore += 50;
    mentalScore -= 100;
    recommendations.push("💻 Excessive screen time disrupts circadian rhythms. Follow the 20-20-20 rule: every 20 minutes, look at something 20 feet away for 20 seconds. Consider blue light filters in evenings.");
  }


// Air Quality
if (data.airQuality && (data.airQuality.includes('Poor') || data.airQuality.includes('Very Poor'))) {
    riskScore += 75;
    recommendations.push("🌬️ Poor air quality can worsen respiratory and cardiovascular health. Consider investing in high-quality air purifiers, and sealing windows. If possible, relocating to an area with better air quality can significantly improve health. Here's a guide on improving indoor air: https://www.epa.gov/indoor-air-quality-iaq/improving-indoor-air-quality");
}

  // Vaction
  if (data.vacations && data.vacations.includes('Never')) {
    riskScore += 80;
    mentalScore -= 150;
    recommendations.push("✈️ Regular breaks reduce burnout risk by 40%. Even 'staycations' or long weekends provide mental health benefits. Schedule downtime just as you would important meetings.Taking good amount of rest will decrease your risk score by at least 80 points");
  }

  // Commute Time
if (data.commute && data.commute.includes('More than 60 minutes')) {
    riskScore += 40;
    mentalScore -= 70;
    physicalScore -= 30;
    recommendations.push("🚗 Long daily commutes are linked to higher stress, less physical activity, and poorer sleep. Consider negotiating remote work days, flexible hours, or eventually relocating closer to your workplace if possible.");
}

  //relaxation

  // Engagement in Stress-Relieving Activities
if (data.relaxation) {
    if (data.relaxation.includes('Never')) {
        riskScore += 50;
        mentalScore -= 100;
        recommendations.push("🧘‍♀️ Chronic stress without relief increases risk of heart disease, depression, and anxiety. Try adding simple relaxation habits like deep breathing, meditation, stretching, or short breaks into your day. Here's a beginner guide to relaxation techniques: https://www.verywellmind.com/tips-to-reduce-stress-3145195");
    } else if (data.relaxation.includes('Rarely')) {
        riskScore += 30;
        mentalScore -= 50;
        recommendations.push("🧘‍♀️ Incorporating regular stress-relieving activities even once or twice a week can greatly improve resilience. Start with short, simple practices like 5 minutes of deep breathing or walking outdoors.");
    } else if (data.relaxation.includes('Daily')) {
        riskScore -= 20;  // 🎯 REWARD good behavior
        mentalScore += 50;
        recommendations.push("🌟 Daily engagement in stress-relieving activities significantly boosts mental health and lowers disease risk. Keep it up! You are already building strong resilience.");
    }
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
  console.log(Server running on http://localhost:${PORT});
});

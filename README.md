# 🌱 Carbon Coach

### AI-Powered Food Recognition & Carbon Footprint Intelligence Platform

**Understand your food. Measure its footprint. Make smarter choices.**

Carbon Coach is an AI-powered food intelligence platform that analyzes food images, identifies meals and ingredients, estimates their carbon footprint, and provides personalized lower-carbon alternatives.

The platform combines a **custom-trained food recognition model**, **AI vision intelligence**, an **open-set food verification system**, a **food-to-ingredient carbon engine**, and a **personalized recommendation system** into one unified application.

---

## 🚀 Overview

Food production is a major contributor to global greenhouse-gas emissions, but consumers generally have very little information about the environmental impact of the food they eat.

Carbon Coach aims to make food's environmental impact understandable at the moment a person is making a food choice.

The user simply:

```text
📸 Take a photo of food
        ↓
🤖 Carbon Coach analyzes the image
        ↓
🍛 Food is identified
        ↓
🥕 Ingredients are analyzed
        ↓
⚖️ Portion is estimated
        ↓
🌍 Carbon footprint is calculated
        ↓
📊 Carbon breakdown is displayed
        ↓
🌱 Lower-carbon alternatives are suggested
        ↓
📈 Impact is tracked over time
```

The result is a personalized food sustainability assistant rather than a simple image classifier.

---

# ✨ Key Features

## 📸 AI Food Scanner

Users can capture or upload a food image and receive an AI-powered analysis.

The scanner performs:

* Image quality verification
* Food/non-food verification
* Food recognition
* Multi-food detection
* Portion estimation
* Ingredient decomposition
* Carbon footprint estimation
* Personalized recommendations

---

## 🧠 Custom Food Recognition Model

Carbon Coach includes a custom-trained food recognition model designed specifically for the application's supported food categories.

The model provides:

* Food classification
* Top-3 predictions
* Confidence information
* Food embeddings
* Known-food recognition
* Unknown-food detection
* Non-food rejection

The custom model is designed to prevent a common classification failure where an image is always forced into one of the known classes.

For example:

```text
Laptop → ❌ Chicken Biryani
Car → ❌ Chicken Biryani
Person → ❌ Chicken Biryani
Book → ❌ Chicken Biryani
```

Instead, the system can identify:

```text
NON_FOOD
UNKNOWN_FOOD
UNCERTAIN
KNOWN_FOOD
```

---

# 👁️ Internal Vision Intelligence

Carbon Coach also uses an internal AI vision component to improve food recognition reliability.

The vision layer can analyze:

* Food presence
* Dish identity
* Multiple foods
* Ingredients
* Cuisine
* Portion
* Food context
* Unknown foods

The frontend presents this as part of the unified:

> **Carbon Coach Food Intelligence Engine**

rather than exposing implementation details during normal scanning.

The architecture keeps the vision service independently replaceable and configurable.

---

# 🔀 Recognition Fusion Engine

One of the most important components of Carbon Coach is the **Fusion Engine**.

Instead of blindly trusting a single model, Carbon Coach compares multiple recognition signals.

```text
             Food Image
                 │
        ┌────────┴────────┐
        ▼                 ▼
 Custom Model      Vision Intelligence
        │                 │
        └────────┬────────┘
                 ▼
          Fusion Engine
                 │
        ┌────────┼────────┐
        ▼        ▼        ▼
      Agree   Disagree  Unknown
        │        │        │
        ▼        ▼        ▼
      Verify   Confirm   Resolve
```

### Example: Agreement

```text
Custom Model:
Chicken Biryani

Vision Intelligence:
Chicken Biryani

Result:
✓ Verified
```

### Example: Disagreement

```text
Custom Model:
Chicken Biryani

Vision Intelligence:
Vegetable Biryani

Result:
⚠️ Recognition disagreement

User confirmation required
```

### Example: Unknown Food

```text
Custom Model:
Unknown

Vision Intelligence:
Masala Dosa

Result:
Food recognized by vision intelligence
```

This makes the recognition pipeline more robust than a single closed-set classifier.

---

# 🚫 Food / Non-Food Verification

Carbon Coach does not assume every uploaded image is food.

The system first determines whether the image contains recognizable food.

Possible states:

```text
FOOD
NON_FOOD
UNCERTAIN
```

For example:

```text
📱 Phone
→ NON_FOOD

🚗 Car
→ NON_FOOD

🍛 Biryani
→ FOOD

🌑 Extremely unclear image
→ UNCERTAIN
```

If the image is not food, the carbon calculation pipeline is stopped.

---

# 🔍 Open-Set Recognition

Traditional classification systems normally assume that every input belongs to one of the classes they were trained on.

Carbon Coach addresses this problem using an open-set recognition layer.

The system can distinguish between:

```text
Known Food
Unknown Food
Non-Food
Uncertain Image
```

This prevents the system from forcing unfamiliar food into an unrelated trained class.

The open-set layer can use:

* Confidence thresholds
* Top-1/top-2 prediction margin
* Embedding similarity
* Class distance
* Calibration
* Validation-set-derived thresholds

Thresholds are configurable and should be calibrated against the actual evaluation dataset.

---

# 🍽️ Multi-Food Detection

Carbon Coach supports meals containing multiple food items.

For example:

```text
Rice
+
Chicken Curry
+
Dal
+
Salad
+
Papad
```

The system analyzes each item independently.

```text
Meal
 ├── Rice
 ├── Chicken Curry
 ├── Dal
 ├── Salad
 └── Papad
```

The carbon engine then calculates the combined footprint.

---

# ⚖️ Portion Estimation

Carbon emissions depend heavily on quantity.

Carbon Coach therefore estimates portion size and allows the user to correct it.

Example:

```text
Estimated portion

350 g

[ − ]     [ + ]
```

Users can also select:

* Small
* Medium
* Large
* Custom quantity

The final carbon calculation uses the corrected portion when the user changes it.

---

# 🥕 Ingredient Decomposition

After identifying the food, Carbon Coach converts the dish into an ingredient-level representation.

Example:

```text
Chicken Biryani
       ↓
Rice
Chicken
Oil
Onion
Spices
Vegetables
```

Each ingredient can then be associated with an emission factor.

---

# 🌍 Carbon Footprint Engine

Carbon Coach calculates an estimated food footprint using ingredient-level emission factors.

A simplified calculation is:

```text
Ingredient CO₂e

=
Ingredient quantity
×
Emission factor
```

For example:

```text
ingredient grams / 1000
×
kg CO₂e per kg ingredient
=
ingredient CO₂e
```

The total meal footprint is:

```text
Total Meal CO₂e
=
Σ Ingredient CO₂e
```

The application presents these values as **estimated CO₂e**, because ingredient emission factors represent assumptions and averages rather than an exact measurement of every prepared meal.

---

# 📊 Carbon Breakdown

Instead of showing only one number, Carbon Coach explains where the footprint comes from.

Example:

```text
Chicken Biryani

Estimated Footprint
2.84 kg CO₂e

Breakdown

Chicken       1.54 kg
Rice          0.82 kg
Oil           0.31 kg
Other         0.17 kg
```

Users can therefore understand the major contributors to their meal's footprint.

---

# 🌱 Lower-Carbon Food Alternatives

Carbon Coach can suggest alternative foods based on:

* Carbon footprint
* Food preferences
* Dietary requirements
* Cuisine
* Spice preference
* Budget
* Previous choices

Example:

```text
Current Meal
Chicken Biryani
2.84 kg CO₂e

Possible Alternative
Vegetable Biryani
1.21 kg CO₂e
```

The recommendation engine uses the Carbon Coach carbon database rather than simply generating arbitrary carbon values.

---

# 👤 Personalization

Carbon Coach can build a personalized food sustainability experience.

The profile can include:

* Dietary preferences
* Allergies
* Dislikes
* Cuisine preferences
* Spice preferences
* Budget
* Carbon goals
* Food history

Dietary restrictions and allergies are treated as hard constraints when generating recommendations.

---

# 🤖 AI Food Coach

The AI Food Coach provides contextual food and sustainability guidance.

It can use:

```text
User Profile
+
Food History
+
Carbon History
+
Goals
+
Preferences
+
Current Meal
```

to generate personalized guidance.

Example:

> "Your meal has a relatively high footprint mainly because of the animal-protein component. Here are some alternatives that fit your preferences."

---

# 📈 Personal Carbon Dashboard

The dashboard tracks the user's food footprint over time.

Possible metrics include:

* Daily CO₂e
* Weekly CO₂e
* Monthly CO₂e
* Meals analyzed
* Average meal footprint
* Highest-carbon foods
* Lower-carbon swaps
* Progress toward goals

---

# 🎯 Carbon Goals

Users can set sustainability goals.

Examples:

```text
Reduce weekly food footprint
Try more plant-based meals
Track meals consistently
Stay below a personal carbon budget
```

Progress can be visualized through charts and progress indicators.

---

# 🏆 Challenges & Gamification

Carbon Coach can encourage sustainable food choices using:

* Daily challenges
* Weekly challenges
* Streaks
* Milestones
* Achievement badges
* Progress tracking

Example:

```text
🌱 7-Day Low Carbon Challenge

██████████████░░ 85%

6 / 7 days completed
```

---

# 📚 Food Knowledge

Carbon Coach can provide additional information about foods.

Examples:

* Food category
* Ingredient information
* Carbon drivers
* Sustainability insights
* Food alternatives
* Portion information

The goal is to help users understand **why** a food has a particular footprint.

---

# 🗑️ Food Waste Intelligence

Future/extended functionality can analyze:

* Leftovers
* Food waste
* Storage suggestions
* Reuse opportunities
* Waste-related emissions

This extends Carbon Coach beyond food selection into broader food sustainability.

---

# 🧠 System Architecture

```text
                       CARBON COACH
                            │
                            ▼
                     FOOD SCANNER
                            │
                            ▼
                   IMAGE QUALITY CHECK
                            │
                            ▼
                  FOOD/NON-FOOD CHECK
                            │
             ┌──────────────┴──────────────┐
             ▼                             ▼
      CUSTOM ML MODEL              VISION INTELLIGENCE
             │                             │
             └──────────────┬──────────────┘
                            ▼
                     FUSION ENGINE
                            │
                            ▼
                    OPEN-SET CHECK
                            │
                            ▼
                  FOOD IDENTIFICATION
                            │
                            ▼
                  MULTI-FOOD ANALYSIS
                            │
                            ▼
                   PORTION ESTIMATION
                            │
                            ▼
                INGREDIENT DECOMPOSITION
                            │
                            ▼
                     CARBON ENGINE
                            │
                            ▼
                 PERSONALIZATION ENGINE
                            │
                            ▼
                   RECOMMENDATION ENGINE
                            │
                            ▼
                      USER DASHBOARD
```

---

# 🛠️ Technology Stack

## Frontend

* React / Next.js
* TypeScript
* HTML
* CSS
* Responsive UI
* Modern component architecture

## AI / ML

* Python
* TensorFlow / Keras
* Transfer Learning
* MobileNetV2
* Custom Food Classification
* Open-Set Recognition
* Vision Intelligence
* Structured AI outputs

## Backend

* FastAPI
* REST APIs
* Python
* Node.js where required by the application

## AI Services

* Custom-trained food recognition model
* Configurable vision intelligence model
* AI reasoning/recommendation layer

## Data

* Food knowledge base
* Ingredient database
* Carbon emission factors
* Dish mappings
* Portion mappings
* Alternative-food mappings

## Deployment

The architecture can be deployed using:

* Google Colab for model training
* FastAPI for ML inference
* Cloud/server deployment
* Vercel or equivalent frontend deployment
* GitHub for source control

---

# 🧪 Machine Learning Pipeline

The custom food model follows a transfer-learning approach.

```text
Food Dataset
     ↓
Data Cleaning
     ↓
Class Balancing
     ↓
Train / Validation / Test Split
     ↓
Image Augmentation
     ↓
MobileNetV2 Backbone
     ↓
Classification Head
     ↓
Training
     ↓
Fine-Tuning
     ↓
Evaluation
     ↓
Open-Set Testing
     ↓
Model Export
```

The model can produce:

```text
food_model.keras
class_labels.json
model_metadata.json
```

---

# 📊 Model Evaluation

Evaluation should include more than classification accuracy.

Metrics include:

* Accuracy
* Precision
* Recall
* F1-score
* Confusion matrix
* Known-food accuracy
* Unknown-food rejection
* Non-food rejection
* False-food detection rate
* Recognition disagreement rate

Special evaluation datasets should include:

```text
Known Food
Unknown Food
Non-Food
Poor Quality Food
Mixed Meals
Visually Similar Foods
```

---

# 🔌 API Architecture

The backend can expose endpoints such as:

```text
POST /api/scan
POST /api/scan/quality
POST /api/scan/verify
POST /api/scan/recognize
POST /api/scan/fusion
POST /api/carbon/calculate
POST /api/recommendations
POST /api/feedback
```

The custom ML service can expose:

```text
POST /predict
GET /health
GET /model-info
```

---

# 📦 Example Scan Response

```json
{
  "success": true,
  "scanId": "scan_001",

  "image": {
    "quality": "GOOD"
  },

  "foodVerification": {
    "status": "FOOD"
  },

  "recognition": {
    "status": "VERIFIED",
    "foodItems": [
      {
        "name": "Chicken Biryani",
        "normalizedName": "chicken_biryani"
      }
    ]
  },

  "portion": {
    "value": 350,
    "unit": "g"
  },

  "carbon": {
    "value": 2.84,
    "unit": "kg CO2e",
    "type": "estimated"
  },

  "requiresConfirmation": false
}
```

---

# 🎨 User Interface

Carbon Coach uses a modern sustainability-focused visual language.

Design characteristics include:

* Dark premium interface
* Glassmorphism
* Emerald / mint / cyan accents
* Soft gradients
* Rounded glass cards
* Modern typography
* Animated data visualization
* AI processing animations
* Responsive layouts
* Mobile-first scanning experience

The UI is designed to make complex environmental information understandable without overwhelming the user.

---

# ✨ Scan Experience

```text
┌─────────────────────────────┐
│                             │
│       CARBON COACH          │
│                             │
│      Scan Your Food         │
│                             │
│        ┌─────────┐          │
│        │ CAMERA  │          │
│        └─────────┘          │
│                             │
│    Upload or Take Photo     │
│                             │
└─────────────────────────────┘
```

During processing:

```text
Analyzing your meal...

✓ Checking image
✓ Verifying food
✓ Identifying meal
✓ Understanding ingredients
○ Calculating footprint
```

Result:

```text
Chicken Biryani

350 g

2.84 kg CO₂e

Estimated food footprint
```

---

# 🔐 Security

The application is designed with security considerations including:

* Server-side AI API calls
* Environment-based secrets
* Image validation
* Request validation
* Rate limiting
* Secure API communication
* Controlled logging
* No client-side exposure of private API keys

Never expose:

```text
GEMINI_API_KEY
```

in client-side code.

---

# 🔒 Privacy

Food images may contain personal surroundings.

The system should support temporary image processing and only retain images when required by the application's history functionality and permitted by the user.

Where images are stored, appropriate access controls and deletion mechanisms should be provided.

---

# ⚙️ Environment Variables

Create a `.env` file based on `.env.example`.

Example:

```env
GEMINI_API_KEY=YOUR_API_KEY

GEMINI_VISION_MODEL=YOUR_CURRENT_VISION_MODEL
GEMINI_FAST_MODEL=YOUR_CURRENT_FAST_MODEL
GEMINI_REASONING_MODEL=YOUR_CURRENT_REASONING_MODEL

CUSTOM_MODEL_URL=http://localhost:8000/predict

FOOD_CONFIDENCE_THRESHOLD=0.70

DEBUG_AI_PIPELINE=false
```

Never commit the real `.env` file to GitHub.

---

# 🚀 Local Development

Clone the repository:

```bash
git clone YOUR_REPOSITORY_URL
```

Enter the project:

```bash
cd carbon-coach
```

Install dependencies:

```bash
npm install
```

Create environment configuration:

```bash
copy .env.example .env
```

or on macOS/Linux:

```bash
cp .env.example .env
```

Configure the required environment variables.

Start the development server:

```bash
npm run dev
```

The application will normally be available at:

```text
http://localhost:3000
```

---

# 🤖 Running the Custom ML Model

Start the ML/FastAPI service separately.

Example:

```bash
uvicorn main:app --reload --port 8000
```

The prediction endpoint should be available at:

```text
http://localhost:8000/predict
```

Then configure:

```env
CUSTOM_MODEL_URL=http://localhost:8000/predict
```

---

# 📁 Project Structure

A typical project structure:

```text
carbon-coach/
│
├── app/
│   ├── scan/
│   ├── dashboard/
│   ├── history/
│   ├── goals/
│   └── profile/
│
├── components/
│   ├── scanner/
│   ├── dashboard/
│   ├── carbon/
│   ├── recommendations/
│   └── ui/
│
├── services/
│   ├── visionIntelligenceService
│   ├── customModelService
│   ├── foodVerificationService
│   ├── foodRecognitionFusionService
│   ├── carbonEngine
│   ├── recommendationEngine
│   └── personalizationEngine
│
├── data/
│   ├── carbonFactors.json
│   ├── ingredients.json
│   ├── dishes.json
│   ├── portions.json
│   └── alternatives.json
│
├── ml/
│   ├── training/
│   ├── inference/
│   ├── models/
│   └── class_labels.json
│
├── public/
│
├── package.json
├── .env.example
└── README.md
```

---

# 🧪 Reliability & Safety Logic

Carbon Coach follows several important recognition rules.

### Rule 1

Never assume every image is food.

### Rule 2

Never force an unknown image into a known food class.

### Rule 3

Never rely only on the highest classifier probability.

### Rule 4

Use multiple recognition signals where available.

### Rule 5

Surface major recognition disagreements.

### Rule 6

Always provide manual correction.

### Rule 7

Carbon values should be presented as estimates where the underlying data are estimates.

### Rule 8

User corrections should support future dataset improvement rather than immediately changing the production model.

---

# 🌍 Why Carbon Coach?

Carbon Coach is designed around a simple idea:

> **People cannot reduce what they cannot see.**

Most food applications focus on:

* Calories
* Price
* Nutrition
* Recipes

Carbon Coach adds another dimension:

> **Environmental impact.**

By making food carbon footprints understandable at the point of consumption, Carbon Coach aims to help people connect everyday food choices with environmental impact.

---

# 🔮 Future Roadmap

Potential future capabilities include:

### 🌐 Global Food Intelligence

Support foods and cuisines from more regions and countries.

### 📱 Mobile Application

Native Android and iOS experiences.

### 🛒 Shopping Carbon Advisor

Analyze shopping lists and recommend lower-carbon alternatives.

### 🍳 Recipe Carbon Calculator

Calculate the estimated carbon footprint of recipes.

### 🧑‍🍳 Recipe Optimizer

Suggest ingredient substitutions to reduce footprint.

### 🍱 Meal Planner

Generate meals according to:

* Carbon budget
* Nutrition
* Dietary requirements
* Budget
* Preferences

### 🏪 Restaurant/Menu Scanner

Analyze restaurant menus and identify lower-carbon choices.

### 🗑️ Food Waste Intelligence

Estimate waste-related environmental impact and suggest ways to use leftovers.

### 🌎 Personal Sustainability Profile

Create a long-term food sustainability profile based on the user's choices.

---

# 🎯 Project Vision

Carbon Coach aims to evolve from a food scanner into a complete:

## **Personal Food Sustainability Intelligence Platform**

The long-term vision is:

```text
Food Recognition
       +
Carbon Intelligence
       +
Personalization
       +
Nutrition Context
       +
Food Recommendations
       +
Food Waste Intelligence
       +
Sustainability Tracking
```

creating an intelligent assistant for making more informed food choices.

---

# 🏗️ Development Status

Carbon Coach is an actively developed project.

Current development areas include:

* [x] Food scanning architecture
* [x] Custom food recognition pipeline
* [x] Vision intelligence integration
* [x] Recognition fusion architecture
* [x] Food/non-food verification
* [x] Unknown-food handling architecture
* [x] Carbon calculation architecture
* [x] Personalized recommendation architecture
* [ ] Expanded food dataset
* [ ] Further model training
* [ ] Open-set calibration
* [ ] Expanded carbon knowledge base
* [ ] Production deployment
* [ ] Mobile application

---

# 🤝 Contributing

Contributions, ideas, improvements, and research are welcome.

Possible contribution areas:

* Food datasets
* Food recognition
* Carbon-factor research
* UI/UX
* AI/ML
* Backend development
* Sustainability research
* Recommendation systems
* Testing

---

# 📜 Disclaimer

Carbon Coach provides **estimated food carbon footprints**, not laboratory measurements of individual meals.

Actual emissions can vary depending on:

* Farming practices
* Geographic location
* Supply chain
* Processing
* Transportation
* Storage
* Cooking
* Portion size
* Ingredient sourcing

The application should therefore communicate uncertainty and assumptions wherever appropriate.

---

# 🌱 Carbon Coach

### Understand your food. Measure its footprint. Make smarter choices.

**Built with AI, machine learning, food intelligence, and sustainability in mind.**

---

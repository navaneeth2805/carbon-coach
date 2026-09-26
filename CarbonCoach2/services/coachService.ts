import { getGeminiApiKey } from './gemini';
import { LoggedMeal } from '@/context/ScanHistoryContext';
import { UserProfile } from '@/context/UserProfileContext';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  isFallback?: boolean;
}

const TIMEOUT_MS = 10000;

/**
 * Generate intelligent offline advice when Gemini API is unreachable or not configured
 */
function generateOfflineCoachResponse(userQuery: string, recentMeal: LoggedMeal | null): string {
  const queryLower = userQuery.toLowerCase();

  if (!recentMeal) {
    if (queryLower.includes('how') || queryLower.includes('tip') || queryLower.includes('start')) {
      return "Welcome to CarbonCoach! To get started on cutting your dietary carbon footprint, focus on reducing ruminant meats (mutton, lamb, beef) and dairy concentrates (butter, ghee, heavy cream). Replacing them with lentils, legumes, or vegetables produces 70-90% lower CO₂e emissions. Scan your first meal to get tailored coaching!";
    }
    return "I am your CarbonCoach. Scan or log a meal and I can dissect why its carbon footprint is high or low and suggest high-impact culinary swaps!";
  }

  const topIngredient = recentMeal.breakdown?.[0];
  const topName = topIngredient ? topIngredient.displayName : 'the protein/dairy base';
  const topShare = topIngredient ? `${topIngredient.share}%` : 'the majority';

  if (queryLower.includes('why') || queryLower.includes('high') || queryLower.includes('low') || queryLower.includes('footprint')) {
    if (recentMeal.totalCo2e > 2.0) {
      return `Your meal of ${recentMeal.dishName} has a relatively elevated footprint of ${recentMeal.totalCo2e} kg CO₂e. The biggest culprit is ${topName}, which drives ${topShare} of total emissions. Ruminant meats, butter, and heavy cream carry heavy upstream agricultural footprints. Swapping with a plant-protein like chickpeas, lentils, or tofu reduces this by over 60%!`;
    } else {
      return `Great choice with ${recentMeal.dishName}! At only ${recentMeal.totalCo2e} kg CO₂e, it is already a climate-friendly meal. Its emissions are kept lean because of plant-based ingredients like ${topName}. You're well on track with your climate goals.`;
    }
  }

  if (queryLower.includes('alternative') || queryLower.includes('swap') || queryLower.includes('replace') || queryLower.includes('better')) {
    return `For ${recentMeal.dishName}, consider swapping rich dairy gravies for tomato-based lentil curries (like Chana Masala or Yellow Tadka Dal), or substituting paneer/chicken with firm tofu or roasted cauliflower. You preserve the rich spices and texture while cutting 50-70% of emissions!`;
  }

  return `Regarding ${recentMeal.dishName} (${recentMeal.totalCo2e} kg CO₂e): ${topName} accounts for ${topShare} of its impact. Cooking with lighter oils, reducing ghee/butter portioning, and adding more fiber-rich vegetables is the most effective way to lower this footprint without sacrificing flavor.`;
}

/**
 * Send conversational query to Gemini text model with meal context
 * Guaranteed never to throw uncaught error; falls back gracefully.
 */
export async function askCarbonCoach(
  userQuery: string,
  recentMeal: LoggedMeal | null,
  userProfile: UserProfile,
  conversationHistory: ChatMessage[] = []
): Promise<ChatMessage> {
  const apiKey = getGeminiApiKey();

  // If no key configured, immediately provide the offline coach response
  if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY_HERE') {
    const fallbackText = generateOfflineCoachResponse(userQuery, recentMeal);
    return {
      id: `msg_${Date.now()}`,
      role: 'assistant',
      content: `${fallbackText}\n\n*(Note: Running in offline coach mode. Configure EXPO_PUBLIC_GEMINI_API_KEY for dynamic online chat.)*`,
      timestamp: new Date().toISOString(),
      isFallback: true,
    };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    let mealContext = 'The user has not logged any meal yet.';
    if (recentMeal) {
      const breakdownSummary = recentMeal.breakdown
        .map(b => `${b.displayName}: ${b.co2e} kg CO2e (${b.share}%)`)
        .join(', ');
      mealContext = `Latest logged meal: "${recentMeal.dishName}", Total CO2e: ${recentMeal.totalCo2e} kg, Portion: ${recentMeal.portionGrams}g, Ingredients breakdown: [${breakdownSummary}].`;
    }

    const systemPrompt = `You are CarbonCoach, an encouraging, scientifically grounded culinary sustainability coach.
User Profile:
- Diet: ${userProfile.diet}
- Allergies: ${userProfile.allergies.join(', ') || 'None'}
- Spice: ${userProfile.spicePreference}
- Budget: ${userProfile.budgetLevel}
- Primary Goal: ${userProfile.primaryGoal}
Context on user's food:
${mealContext}

Keep responses concise (2-4 sentences max), friendly, motivating, and specific to the ingredients and emissions. Explain why emissions are high or low, and offer actionable culinary alternatives.`;

    const requestBody = {
      contents: [
        {
          parts: [
            { text: `${systemPrompt}\n\nUser Question: ${userQuery}` },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 300,
      },
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn('Gemini Coach HTTP error:', response.status);
      return {
        id: `msg_${Date.now()}`,
        role: 'assistant',
        content: generateOfflineCoachResponse(userQuery, recentMeal),
        timestamp: new Date().toISOString(),
        isFallback: true,
      };
    }

    const json = await response.json();
    const answerText = json?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!answerText) {
      return {
        id: `msg_${Date.now()}`,
        role: 'assistant',
        content: generateOfflineCoachResponse(userQuery, recentMeal),
        timestamp: new Date().toISOString(),
        isFallback: true,
      };
    }

    return {
      id: `msg_${Date.now()}`,
      role: 'assistant',
      content: answerText.trim(),
      timestamp: new Date().toISOString(),
      isFallback: false,
    };
  } catch (err: any) {
    clearTimeout(timeoutId);
    console.warn('Error in askCarbonCoach:', err);
    return {
      id: `msg_${Date.now()}`,
      role: 'assistant',
      content: `${generateOfflineCoachResponse(userQuery, recentMeal)}\n\n*(Cloud coach unreachable — showing on-device analysis)*`,
      timestamp: new Date().toISOString(),
      isFallback: true,
    };
  }
}

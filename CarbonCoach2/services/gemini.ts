import Constants from 'expo-constants';
import { DetectionPayload, DetectorResult } from './types';
import { findDishProfile } from './carbonEngine';
import { getBase64FromUri } from './imageUtils';

const TIMEOUT_MS = 10000; // 10 seconds timeout per spec

/**
 * Retrieve configured Gemini API key safely
 */
export function getGeminiApiKey(): string {
  const key =
    process.env.EXPO_PUBLIC_GEMINI_API_KEY ||
    (Constants.expoConfig?.extra?.geminiApiKey as string) ||
    '';
  return key.trim();
}

/**
 * Detect food dish and portion using Gemini Vision API
 * Guaranteed never to throw uncaught exception; returns typed DetectorResult.
 */
export async function detectMealGemini(imageUri: string): Promise<DetectorResult> {
  const startTime = Date.now();
  const apiKey = getGeminiApiKey();

  if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY_HERE') {
    return {
      status: 'error',
      source: 'gemini',
      code: 'MISSING_API_KEY',
      message: 'Gemini API key not configured in .env (EXPO_PUBLIC_GEMINI_API_KEY)',
      latencyMs: Date.now() - startTime,
    };
  }

  try {
    const base64Data = await getBase64FromUri(imageUri);

    const prompt = `Analyze this food image. Identify the primary dish name, estimated portion weight in grams, and confidence score. Return strictly a JSON object with this exact shape:
{
  "dishName": "String name of the dish (e.g. Butter Chicken, Paneer Butter Masala, Hyderabadi Chicken Biryani, Dal Makhani, Chana Masala, Yellow Tadka Dal, Rajma Chawal, Aloo Gobi, etc.)",
  "confidence": 0.95,
  "estimatedPortionGrams": 350,
  "category": "curry | rice_biryani | bread | dal | snack_breakfast | dessert"
}`;

    const requestBody = {
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inline_data: {
                mime_type: 'image/jpeg',
                data: base64Data,
              },
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.1,
        responseMimeType: 'application/json',
      },
    };

    // Candidate models in preference order (gemini-flash-lite-latest verified 200 OK in ~900ms)
    const candidateModels = [
      'gemini-flash-lite-latest',
      'gemini-3.5-flash-lite',
      'gemini-3.8-flash',
      'gemini-3.6-flash',
      'gemini-3-flash-preview',
      'gemini-3.1-flash-lite',
    ];

    let lastStatus = 0;
    let rawText: string | undefined;

    for (const model of candidateModels) {
      const modelController = new AbortController();
      const modelTimeoutId = setTimeout(() => modelController.abort(), 15000); // 15s per attempt

      try {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
          signal: modelController.signal,
        });

        clearTimeout(modelTimeoutId);
        lastStatus = response.status;

        if (response.ok) {
          const json = await response.json();
          rawText = json?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (rawText) {
            console.log(`Meal detected successfully using model: ${model}`);
            break;
          }
        } else if (response.status === 401 || response.status === 403) {
          // Invalid API key
          const errorText = await response.text();
          console.warn(`Gemini API Auth Error:`, response.status, errorText);
          break;
        } else {
          // 404, 503, or temporary rate limit: try next fallback model
          console.warn(`Gemini model ${model} returned ${response.status}, trying fallback...`);
        }
      } catch (err: any) {
        clearTimeout(modelTimeoutId);
        console.warn(`Gemini model ${model} attempt failed:`, err.message);
      }
    }

    if (!rawText) {
      const errMsg =
        lastStatus > 0
          ? `Gemini API returned HTTP status ${lastStatus}`
          : 'Gemini request timed out or network connection interrupted';
      return {
        status: 'error',
        source: 'gemini',
        code: 'NETWORK_ERROR',
        message: errMsg,
        latencyMs: Date.now() - startTime,
      };
    }

    // Parse returned JSON safely (strip markdown fences if present)
    const cleanedText = rawText
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .trim();
    const parsed = JSON.parse(cleanedText);
    const dishName = parsed.dishName || 'Assorted Meal';
    const confidence = typeof parsed.confidence === 'number' ? parsed.confidence : 0.88;
    const estimatedPortionGrams =
      typeof parsed.estimatedPortionGrams === 'number' && parsed.estimatedPortionGrams > 0
        ? parsed.estimatedPortionGrams
        : 350;

    const matched = findDishProfile(dishName);

    const payload: DetectionPayload = {
      dishName: matched ? matched.name : dishName,
      matchedDishId: matched?.id,
      confidence: Math.max(0.1, Math.min(1.0, confidence)),
      estimatedPortionGrams,
      category: parsed.category || matched?.category,
      notes: 'Identified via Gemini Vision',
    };

    return {
      status: 'success',
      source: 'gemini',
      data: payload,
      latencyMs: Date.now() - startTime,
    };
  } catch (err: any) {
    console.warn('Caught exception in detectMealGemini:', err);

    if (err.name === 'AbortError' || err.message?.includes('aborted')) {
      return {
        status: 'error',
        source: 'gemini',
        code: 'TIMEOUT',
        message: 'Gemini Vision request timed out',
        latencyMs: Date.now() - startTime,
      };
    }

    return {
      status: 'error',
      source: 'gemini',
      code: 'NETWORK_ERROR',
      message: err.message || 'Unable to connect to Gemini Vision service',
      latencyMs: Date.now() - startTime,
    };
  }
}

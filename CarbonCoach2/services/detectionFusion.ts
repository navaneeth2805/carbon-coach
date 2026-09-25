import { detectMealGemini } from './gemini';
import { detectMealCustomModel } from './customModel';
import { DetectorResult, FusedDetectionResult, FusionStatus } from './types';
import { findDishProfile } from './carbonEngine';

/**
 * Compare two detected dishes to test if they represent the same meal
 */
function checkDishesAgree(
  nameA: string,
  idA: string | undefined,
  nameB: string,
  idB: string | undefined
): boolean {
  if (idA && idB && idA === idB) return true;

  const profileA = findDishProfile(nameA);
  const profileB = findDishProfile(nameB);
  if (profileA && profileB && profileA.id === profileB.id) {
    return true;
  }

  const cleanA = nameA.toLowerCase().replace(/[^a-z0-9]/g, '');
  const cleanB = nameB.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (cleanA === cleanB) return true;
  if (cleanA.includes(cleanB) || cleanB.includes(cleanA)) return true;

  return false;
}

/**
 * Run dual detectors in parallel via Promise.allSettled and fuse the predictions.
 * Never throws an uncaught error.
 */
export async function runDetectionFusion(imageUri: string): Promise<FusedDetectionResult> {
  const [geminiSettled, customSettled] = await Promise.allSettled([
    detectMealGemini(imageUri),
    detectMealCustomModel(imageUri),
  ]);

  const geminiResult: DetectorResult =
    geminiSettled.status === 'fulfilled'
      ? geminiSettled.value
      : {
          status: 'error',
          source: 'gemini',
          code: 'NETWORK_ERROR',
          message: geminiSettled.reason?.message || 'Gemini detection execution rejected',
        };

  const customResult: DetectorResult =
    customSettled.status === 'fulfilled'
      ? customSettled.value
      : {
          status: 'error',
          source: 'custom_model',
          code: 'NETWORK_ERROR',
          message: customSettled.reason?.message || 'Custom model execution rejected',
        };

  const isGeminiSuccess = geminiResult.status === 'success';
  const isCustomSuccess = customResult.status === 'success';

  // Case 1: Both Succeeded
  if (isGeminiSuccess && isCustomSuccess) {
    const agree = checkDishesAgree(
      geminiResult.data.dishName,
      geminiResult.data.matchedDishId,
      customResult.data.dishName,
      customResult.data.matchedDishId
    );

    if (agree) {
      return {
        status: 'agreement',
        primary: {
          ...geminiResult.data,
          // Boost confidence when both agree
          confidence: Math.min(0.99, (geminiResult.data.confidence + customResult.data.confidence) / 2 + 0.05),
          notes: 'Validated by both Gemini Vision and Hosted Custom Model',
        },
        secondary: null,
        geminiResult,
        customResult,
      };
    } else {
      // Disagree: Gemini as primary, Custom model as secondary
      return {
        status: 'disagreement',
        primary: geminiResult.data,
        secondary: customResult.data,
        geminiResult,
        customResult,
      };
    }
  }

  // Case 2: Only Gemini Succeeded
  if (isGeminiSuccess && !isCustomSuccess) {
    return {
      status: 'gemini_only',
      primary: geminiResult.data,
      secondary: null,
      geminiResult,
      customResult,
    };
  }

  // Case 3: Only Custom Model Succeeded
  if (!isGeminiSuccess && isCustomSuccess) {
    return {
      status: 'custom_only',
      primary: customResult.data,
      secondary: null,
      geminiResult,
      customResult,
    };
  }

  // Case 4: Both Failed
  const geminiMsg = geminiResult.status === 'error' ? geminiResult.message : '';
  const customMsg = customResult.status === 'error' ? customResult.message : '';

  let combinedError = "Couldn't identify your meal — check your connection and try again.";
  if (
    geminiResult.status === 'error' &&
    customResult.status === 'error' &&
    geminiResult.code === 'MISSING_API_KEY' &&
    customResult.code === 'ENDPOINT_NOT_CONFIGURED'
  ) {
    combinedError = 'Neither Gemini API key nor custom model endpoint is configured in .env.';
  }

  return {
    status: 'both_failed',
    primary: null,
    secondary: null,
    geminiResult,
    customResult,
    errorMessage: `${combinedError}\n(${geminiMsg}; ${customMsg})`,
  };
}

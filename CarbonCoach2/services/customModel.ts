import Constants from 'expo-constants';
import { DetectionPayload, DetectorResult } from './types';
import { findDishProfile } from './carbonEngine';
import { getBase64FromUri } from './imageUtils';

const TIMEOUT_MS = 4000;

export function getCustomModelUrl(): string {
  const url =
    process.env.EXPO_PUBLIC_CUSTOM_MODEL_URL ||
    (Constants.expoConfig?.extra?.customModelUrl as string) ||
    '';
  return url.trim();
}

/**
 * Detect food dish via secondary hosted FastAPI custom-model endpoint.
 * Guaranteed never to throw uncaught exception; returns typed DetectorResult.
 */
export async function detectMealCustomModel(imageUri: string): Promise<DetectorResult> {
  const startTime = Date.now();
  const endpointUrl = getCustomModelUrl();

  if (!endpointUrl || endpointUrl.includes('your-custom-model')) {
    return {
      status: 'error',
      source: 'custom_model',
      code: 'ENDPOINT_NOT_CONFIGURED',
      message: 'Custom model endpoint URL is not configured in .env (EXPO_PUBLIC_CUSTOM_MODEL_URL)',
      latencyMs: Date.now() - startTime,
    };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const base64Data = await getBase64FromUri(imageUri);
    let data: any = null;

    // Check if hosted on Hugging Face Spaces (Gradio)
    if (endpointUrl.includes('.hf.space') || endpointUrl.includes('gradio')) {
      try {
        const baseRoot = endpointUrl.replace(/\/+$/, '');
        const gradioCallUrl = `${baseRoot}/gradio_api/call/predict`;
        const callRes = await fetch(gradioCallUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            data: [{ url: `data:image/jpeg;base64,${base64Data}` }],
          }),
          signal: controller.signal,
        });

        if (callRes.ok) {
          const callData = await callRes.json();
          if (callData.event_id) {
            const streamUrl = `${baseRoot}/gradio_api/call/predict/${callData.event_id}`;
            const streamRes = await fetch(streamUrl, { signal: controller.signal });
            if (streamRes.ok) {
              const streamText = await streamRes.text();
              const match = streamText.match(/data:\s*(\[.+?\])/);
              if (match) {
                const parsed = JSON.parse(match[1]);
                data = parsed[0];
              }
            }
          }
        }
      } catch (gErr) {
        // Fall back to direct REST POST
      }
    }

    if (!data) {
      // Standard FastAPI REST endpoint (try /predict or base)
      const targetUrl = endpointUrl.endsWith('/') || endpointUrl.endsWith('/predict')
        ? endpointUrl
        : `${endpointUrl}/predict`;

      let response = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          image: base64Data,
          format: 'base64',
        }),
        signal: controller.signal,
      });

      if (!response.ok && response.status === 404 && targetUrl !== endpointUrl) {
        response = await fetch(endpointUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({
            image: base64Data,
            format: 'base64',
          }),
          signal: controller.signal,
        });
      }

      if (!response.ok) {
        return {
          status: 'error',
          source: 'custom_model',
          code: 'NETWORK_ERROR',
          message: `Custom model server returned HTTP ${response.status}`,
          latencyMs: Date.now() - startTime,
        };
      }

      data = await response.json();
    }

    clearTimeout(timeoutId);
    const dishName = data.dishName || data.label || data.predicted_class || 'Assorted Dish';
    const confidence = typeof data.confidence === 'number' ? data.confidence : 0.82;
    const estimatedPortionGrams =
      typeof data.estimatedPortionGrams === 'number' && data.estimatedPortionGrams > 0
        ? data.estimatedPortionGrams
        : (data.portion_grams || 350);

    const matched = findDishProfile(dishName);

    const payload: DetectionPayload = {
      dishName: matched ? matched.name : dishName,
      matchedDishId: matched?.id,
      confidence: Math.max(0.1, Math.min(1.0, confidence)),
      estimatedPortionGrams,
      category: data.category || matched?.category,
      notes: 'Identified via Hosted Custom Model (FastAPI)',
    };

    return {
      status: 'success',
      source: 'custom_model',
      data: payload,
      latencyMs: Date.now() - startTime,
    };
  } catch (err: any) {
    clearTimeout(timeoutId);
    console.warn('Caught exception in detectMealCustomModel:', err);

    if (err.name === 'AbortError' || err.message?.includes('aborted')) {
      return {
        status: 'error',
        source: 'custom_model',
        code: 'TIMEOUT',
        message: `Custom model request timed out (${Math.round(TIMEOUT_MS / 1000)}s threshold)`,
        latencyMs: Date.now() - startTime,
      };
    }

    return {
      status: 'error',
      source: 'custom_model',
      code: 'NETWORK_ERROR',
      message: err.message || 'Unable to reach custom model endpoint',
      latencyMs: Date.now() - startTime,
    };
  }
}

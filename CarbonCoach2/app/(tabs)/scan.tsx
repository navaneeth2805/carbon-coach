import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  Modal,
  FlatList,
  TextInput,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { GradientBackground } from '@/components/GradientBackground';
import { GlassCard } from '@/components/GlassCard';
import { ConfidenceBadge, ConfidenceType } from '@/components/ConfidenceBadge';
import { ErrorState } from '@/components/ErrorState';
import { runDetectionFusion } from '@/services/detectionFusion';
import { calculateFootprint } from '@/services/carbonEngine';
import { ALL_DISH_OPTIONS } from '@/data/dishIngredients';
import { colors, typography, spacing, radius } from '@/theme/tokens';
import { FusedDetectionResult, DetectionPayload } from '@/services/types';

type ScanStep = 'capture' | 'detecting' | 'portion_confirm' | 'error_both_failed';

export default function ScanScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<any>(null);

  const [step, setStep] = useState<ScanStep>('capture');
  const [capturedImageUri, setCapturedImageUri] = useState<string | null>(null);
  const [fusionResult, setFusionResult] = useState<FusedDetectionResult | null>(null);
  const [selectedPayload, setSelectedPayload] = useState<DetectionPayload | null>(null);
  const [portionGrams, setPortionGrams] = useState<number>(350);
  const [confidenceType, setConfidenceType] = useState<ConfidenceType>('agreement');

  // Manual dish selection modal
  const [manualModalVisible, setManualModalVisible] = useState<boolean>(false);
  const [manualSearchQuery, setManualSearchQuery] = useState<string>('');

  // Step 1: Capture from Camera
  const handleCapturePhoto = async () => {
    try {
      if (cameraRef.current) {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          skipProcessing: false,
        });
        if (photo?.uri) {
          processImage(photo.uri);
        }
      }
    } catch (err) {
      console.warn('Camera capture error, falling back to picker:', err);
    }
  };

  // Step 1 Fallback: Gallery import
  const handlePickFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        processImage(result.assets[0].uri);
      }
    } catch (err) {
      console.warn('Image picker error:', err);
    }
  };

  // Step 2: Process Image with Dual Detection Fusion
  const processImage = async (uri: string) => {
    setCapturedImageUri(uri);
    setStep('detecting');

    try {
      const fused = await runDetectionFusion(uri);
      setFusionResult(fused);

      if (fused.status === 'both_failed') {
        setStep('error_both_failed');
        return;
      }

      // Determine confidence type badge
      let cType: ConfidenceType = 'agreement';
      if (fused.status === 'disagreement') cType = 'disagreement';
      else if (fused.status === 'gemini_only') cType = 'gemini_only';
      else if (fused.status === 'custom_only') cType = 'custom_only';

      setConfidenceType(cType);
      setSelectedPayload(fused.primary);
      setPortionGrams(fused.primary?.estimatedPortionGrams || 350);
      setStep('portion_confirm');
    } catch (err) {
      console.error('Unexpected error in detection fusion:', err);
      setStep('error_both_failed');
    }
  };

  // Manual fallback selection
  const handleSelectManualDish = (dish: { id: string; name: string; defaultPortionGrams: number }) => {
    const payload: DetectionPayload = {
      dishName: dish.name,
      matchedDishId: dish.id,
      confidence: 1.0,
      estimatedPortionGrams: dish.defaultPortionGrams,
      notes: 'Manually selected by user',
    };
    setSelectedPayload(payload);
    setPortionGrams(dish.defaultPortionGrams);
    setConfidenceType('manual');
    setManualModalVisible(false);
    setStep('portion_confirm');
  };

  // Proceed to Step 4 (Result screen)
  const handleConfirmAndCalculate = () => {
    if (!selectedPayload) return;

    const footprint = calculateFootprint(
      selectedPayload.matchedDishId || selectedPayload.dishName,
      portionGrams,
      selectedPayload.category
    );

    router.push({
      pathname: '/result',
      params: {
        dishName: footprint.dishName,
        dishId: footprint.dishId,
        portionGrams: String(portionGrams),
        totalCo2e: String(footprint.totalCo2e),
        breakdownJson: JSON.stringify(footprint.breakdown),
        confidenceType,
        confidence: String(selectedPayload.confidence),
        imageUri: capturedImageUri || '',
        diet: footprint.diet,
        allergensJson: JSON.stringify(footprint.allergens),
        isFallback: String(footprint.isFallbackEstimate),
      },
    });
  };

  const handleReset = () => {
    setCapturedImageUri(null);
    setFusionResult(null);
    setSelectedPayload(null);
    setStep('capture');
  };

  const filteredDishes = ALL_DISH_OPTIONS.filter(d =>
    d.name.toLowerCase().includes(manualSearchQuery.toLowerCase())
  );

  return (
    <GradientBackground>
      <SafeAreaView style={styles.safeArea}>
        {/* STEP 1: CAPTURE SCREEN */}
        {step === 'capture' && (
          <View style={styles.cameraContainer}>
            {/* Header info */}
            <View style={styles.topBar}>
              <TouchableOpacity
                onPress={() => router.back()}
                style={styles.circleButton}
                activeOpacity={0.8}
              >
                <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
              </TouchableOpacity>
              <View style={styles.modelStatusBadge}>
                <View style={styles.dotTeal} />
                <Text style={styles.modelStatusText}>GEMINI + FASTAPI LIVE</Text>
              </View>
              <TouchableOpacity
                onPress={() => setManualModalVisible(true)}
                style={styles.manualEntryBtn}
                activeOpacity={0.8}
              >
                <Ionicons name="create-outline" size={16} color={colors.primaryTeal} />
                <Text style={styles.manualEntryText}>Manual</Text>
              </TouchableOpacity>
            </View>

            {/* Camera View or Permission Denied Fallback */}
            {!permission ? (
              <View style={styles.cameraPlaceholder}>
                <ActivityIndicator size="large" color={colors.primaryTeal} />
                <Text style={styles.cameraPlaceholderText}>Checking camera access...</Text>
              </View>
            ) : !permission.granted ? (
              <View style={styles.permissionDeniedBox}>
                <GlassCard style={styles.permissionCard}>
                  <View style={styles.permissionIconCircle}>
                    <Ionicons name="camera-reverse-outline" size={36} color={colors.primaryTeal} />
                  </View>
                  <Text style={styles.permissionTitle}>Camera Access Disabled</Text>
                  <Text style={styles.permissionDesc}>
                    CarbonIQ analyzes food visual features using Gemini Vision and our custom neural detector. Enable camera permissions in your device settings or select an existing photo.
                  </Text>
                  <TouchableOpacity
                    style={styles.reqPermBtn}
                    onPress={requestPermission}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.reqPermBtnText}>Enable Camera Permission</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.galleryPermBtn}
                    onPress={handlePickFromGallery}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="images-outline" size={18} color={colors.primaryTeal} style={{ marginRight: 6 }} />
                    <Text style={styles.galleryPermBtnText}>Choose from Photo Gallery</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.manualPermBtn}
                    onPress={() => setManualModalVisible(true)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.manualPermBtnText}>Or Enter Dish Name Manually</Text>
                  </TouchableOpacity>
                </GlassCard>
              </View>
            ) : (
              <View style={styles.liveCameraWrapper}>
                <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" />
                {/* Viewfinder Overlay */}
                <View style={styles.viewfinderFrame}>
                  <View style={[styles.corner, styles.cornerTL]} />
                  <View style={[styles.corner, styles.cornerTR]} />
                  <View style={[styles.corner, styles.cornerBL]} />
                  <View style={[styles.corner, styles.cornerBR]} />
                  <Text style={styles.viewfinderHint}>Align meal dish inside frame</Text>
                </View>
              </View>
            )}

            {/* Bottom Controls */}
            <View style={styles.bottomControls}>
              <TouchableOpacity
                onPress={handlePickFromGallery}
                style={styles.galleryButton}
                activeOpacity={0.8}
              >
                <Ionicons name="images-outline" size={24} color={colors.textPrimary} />
                <Text style={styles.controlLabel}>Gallery</Text>
              </TouchableOpacity>

              {permission?.granted ? (
                <TouchableOpacity
                  onPress={handleCapturePhoto}
                  style={styles.shutterButton}
                  activeOpacity={0.8}
                >
                  <View style={styles.shutterInner} />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  onPress={handlePickFromGallery}
                  style={styles.shutterButton}
                  activeOpacity={0.8}
                >
                  <Ionicons name="cloud-upload-outline" size={28} color={colors.textInverse} />
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={() => setManualModalVisible(true)}
                style={styles.galleryButton}
                activeOpacity={0.8}
              >
                <Ionicons name="list-outline" size={24} color={colors.textPrimary} />
                <Text style={styles.controlLabel}>Dish List</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* STEP 2: DETECTING SCREEN */}
        {step === 'detecting' && (
          <View style={styles.centeredStepContainer}>
            {capturedImageUri ? (
              <Image source={{ uri: capturedImageUri }} style={styles.previewImage} />
            ) : null}
            <View style={styles.detectingSpinnerBox}>
              <ActivityIndicator size="large" color={colors.primaryTeal} />
            </View>
            <Text style={styles.detectingTitle}>Analyzing Meal Visuals</Text>
            <Text style={styles.detectingDesc}>
              Querying Gemini 2.5 Flash & Hosted FastAPI neural detector in parallel...
            </Text>
            <View style={styles.pulsePill}>
              <View style={styles.pulseDot} />
              <Text style={styles.pulseText}>Promise.allSettled Active</Text>
            </View>
          </View>
        )}

        {/* STEP 3: PORTION CONFIRMATION SCREEN */}
        {step === 'portion_confirm' && selectedPayload && (
          <View style={styles.confirmContainer}>
            <View style={styles.confirmHeader}>
              <TouchableOpacity onPress={handleReset} style={styles.circleButton}>
                <Ionicons name="close" size={20} color={colors.textPrimary} />
              </TouchableOpacity>
              <Text style={styles.confirmHeaderTitle}>Confirm Meal & Portion</Text>
              <View style={{ width: 40 }} />
            </View>

            <View style={styles.confirmBody}>
              {/* Photo & Badge */}
              {capturedImageUri ? (
                <Image source={{ uri: capturedImageUri }} style={styles.confirmPhoto} />
              ) : (
                <View style={styles.confirmPlaceholderPhoto}>
                  <Ionicons name="restaurant-outline" size={32} color={colors.primaryTeal} />
                </View>
              )}

              {/* Confidence Badge */}
              <View style={styles.badgeWrapper}>
                <ConfidenceBadge
                  type={confidenceType}
                  confidence={selectedPayload.confidence}
                />
              </View>

              {/* Disagreement Comparison Note */}
              {fusionResult?.status === 'disagreement' && fusionResult.secondary && (
                <GlassCard variant="active" style={styles.disagreementBox}>
                  <View style={styles.disagreeHeaderRow}>
                    <Ionicons name="git-compare-outline" size={16} color={colors.warning} />
                    <Text style={styles.disagreeTitle}>Detectors Disagreed</Text>
                  </View>
                  <Text style={styles.disagreeSubtitle}>Select which detector prediction to use:</Text>
                  <View style={styles.disagreeOptionRow}>
                    <TouchableOpacity
                      onPress={() => setSelectedPayload(fusionResult.primary)}
                      style={[
                        styles.disagreeChoice,
                        selectedPayload.dishName === fusionResult.primary?.dishName &&
                          styles.disagreeChoiceActive,
                      ]}
                    >
                      <Text style={styles.disagreeModelTag}>Gemini (Primary)</Text>
                      <Text style={styles.disagreeChoiceName}>{fusionResult.primary?.dishName}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => setSelectedPayload(fusionResult.secondary)}
                      style={[
                        styles.disagreeChoice,
                        selectedPayload.dishName === fusionResult.secondary?.dishName &&
                          styles.disagreeChoiceActive,
                      ]}
                    >
                      <Text style={styles.disagreeModelTag}>Custom Model</Text>
                      <Text style={styles.disagreeChoiceName}>{fusionResult.secondary?.dishName}</Text>
                    </TouchableOpacity>
                  </View>
                </GlassCard>
              )}

              {/* Identified Dish Title Card */}
              <GlassCard style={styles.dishCard}>
                <View style={styles.dishCardRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.dishDetectedLabel}>Identified Dish</Text>
                    <Text style={styles.dishDetectedName}>{selectedPayload.dishName}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setManualModalVisible(true)}
                    style={styles.changeDishBtn}
                  >
                    <Text style={styles.changeDishText}>Change</Text>
                  </TouchableOpacity>
                </View>
              </GlassCard>

              {/* Portion Adjuster Stepper / Presets */}
              <GlassCard style={styles.portionCard}>
                <Text style={styles.portionTitle}>Estimated Portion Size</Text>
                <Text style={styles.portionSubtitle}>
                  Adjust grams to scale carbon footprint proportionally
                </Text>

                <View style={styles.stepperRow}>
                  <TouchableOpacity
                    onPress={() => setPortionGrams(Math.max(100, portionGrams - 50))}
                    style={styles.stepBtn}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="remove" size={20} color={colors.textPrimary} />
                  </TouchableOpacity>

                  <View style={styles.portionValueBox}>
                    <Text style={styles.portionValueNumber}>{portionGrams}</Text>
                    <Text style={styles.portionValueUnit}>grams</Text>
                  </View>

                  <TouchableOpacity
                    onPress={() => setPortionGrams(Math.min(1000, portionGrams + 50))}
                    style={styles.stepBtn}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="add" size={20} color={colors.textPrimary} />
                  </TouchableOpacity>
                </View>

                {/* Quick Presets */}
                <View style={styles.presetsRow}>
                  {[200, 300, 400, 500].map(grams => (
                    <TouchableOpacity
                      key={grams}
                      onPress={() => setPortionGrams(grams)}
                      style={[
                        styles.presetChip,
                        portionGrams === grams && styles.presetChipActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.presetChipText,
                          portionGrams === grams && styles.presetChipTextActive,
                        ]}
                      >
                        {grams}g
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </GlassCard>

              {/* Confirm & Calculate CTA */}
              <TouchableOpacity
                onPress={handleConfirmAndCalculate}
                style={styles.calculateBtn}
                activeOpacity={0.85}
              >
                <Text style={styles.calculateBtnText}>Compute Carbon Impact</Text>
                <Ionicons name="arrow-forward" size={18} color={colors.textInverse} style={{ marginLeft: 8 }} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* STEP: ERROR (BOTH DETECTORS FAILED) */}
        {step === 'error_both_failed' && (
          <View style={styles.errorStepWrapper}>
            <ErrorState
              title="Couldn't Identify Your Meal"
              message={
                fusionResult?.errorMessage ||
                "Both detector APIs were unreachable or unconfigured. You can retry with a clearer photo or pick your dish manually from our database."
              }
              onRetry={handleReset}
              retryLabel="Try Taking Photo Again"
              secondaryActionLabel="Pick Dish from List (Recommended)"
              onSecondaryAction={() => setManualModalVisible(true)}
            />
          </View>
        )}

        {/* MANUAL ENTRY MODAL */}
        <Modal
          visible={manualModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setManualModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Meal from Database</Text>
                <TouchableOpacity onPress={() => setManualModalVisible(false)}>
                  <Ionicons name="close" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
              </View>

              <View style={styles.searchBar}>
                <Ionicons name="search" size={18} color={colors.textSecondary} style={{ marginRight: 8 }} />
                <TextInput
                  placeholder="Search biryani, paneer, dal, chana..."
                  placeholderTextColor={colors.textMuted}
                  value={manualSearchQuery}
                  onChangeText={setManualSearchQuery}
                  style={styles.searchInput}
                  autoCorrect={false}
                />
              </View>

              <FlatList
                data={filteredDishes}
                keyExtractor={item => item.id}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => handleSelectManualDish(item)}
                    style={styles.modalDishItem}
                    activeOpacity={0.75}
                  >
                    <View style={styles.modalDishTextCol}>
                      <Text style={styles.modalDishName}>{item.name}</Text>
                      <Text style={styles.modalDishCat}>
                        {item.category.replace('_', ' ')} • {item.diet.replace('_', ' ')} • {item.defaultPortionGrams}g standard
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={colors.primaryTeal} />
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <View style={{ padding: spacing.xl, alignItems: 'center' }}>
                    <Text style={{ color: colors.textSecondary }}>No dishes match &quot;{manualSearchQuery}&quot;</Text>
                  </View>
                }
              />
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  cameraContainer: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    zIndex: 10,
  },
  circleButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modelStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: 'rgba(45, 212, 191, 0.3)',
  },
  dotTeal: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primaryTeal,
    marginRight: 6,
  },
  modelStatusText: {
    fontSize: typography.sizes.micro,
    color: colors.primaryTeal,
    fontWeight: typography.weights.bold,
    letterSpacing: 0.8,
  },
  manualEntryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs + 2,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.primaryTeal,
    gap: 4,
  },
  manualEntryText: {
    fontSize: typography.sizes.caption,
    color: colors.primaryTeal,
    fontWeight: typography.weights.bold,
  },
  cameraPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraPlaceholderText: {
    color: colors.textSecondary,
    marginTop: spacing.sm,
    fontSize: typography.sizes.body,
  },
  permissionDeniedBox: {
    flex: 1,
    padding: spacing.base,
    justifyContent: 'center',
  },
  permissionCard: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  permissionIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(45, 212, 191, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  permissionTitle: {
    fontSize: typography.sizes.h2,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  permissionDesc: {
    fontSize: typography.sizes.callout,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: typography.lineHeights.callout,
    marginBottom: spacing.lg,
  },
  reqPermBtn: {
    backgroundColor: colors.primaryTeal,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.full,
    width: '100%',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  reqPermBtnText: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.bold,
    color: colors.textInverse,
  },
  galleryPermBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: colors.glassBorder,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.full,
    width: '100%',
    marginBottom: spacing.sm,
  },
  galleryPermBtnText: {
    fontSize: typography.sizes.callout,
    color: colors.primaryTeal,
    fontWeight: typography.weights.semibold,
  },
  manualPermBtn: {
    paddingVertical: spacing.xs,
  },
  manualPermBtnText: {
    fontSize: typography.sizes.caption,
    color: colors.textMuted,
  },
  liveCameraWrapper: {
    flex: 1,
    overflow: 'hidden',
    position: 'relative',
    marginHorizontal: spacing.sm,
    borderRadius: radius.card,
  },
  viewfinderFrame: {
    position: 'absolute',
    top: '15%',
    left: '8%',
    right: '8%',
    bottom: '22%',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: spacing.md,
  },
  corner: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderColor: colors.primaryTeal,
  },
  cornerTL: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3 },
  cornerTR: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3 },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3 },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3 },
  viewfinderHint: {
    color: colors.textPrimary,
    fontSize: typography.sizes.caption,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  bottomControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.base,
    backgroundColor: colors.backgroundElevated,
  },
  galleryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 60,
  },
  controlLabel: {
    fontSize: typography.sizes.caption,
    color: colors.textSecondary,
    marginTop: 4,
  },
  shutterButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primaryTeal,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  shutterInner: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.textPrimary,
  },
  centeredStepContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  previewImage: {
    width: 140,
    height: 140,
    borderRadius: radius.card,
    marginBottom: spacing.lg,
    borderWidth: 2,
    borderColor: colors.primaryTeal,
  },
  detectingSpinnerBox: {
    marginBottom: spacing.md,
  },
  detectingTitle: {
    fontSize: typography.sizes.h2,
    fontWeight: typography.weights.heavy,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  detectingDesc: {
    fontSize: typography.sizes.body,
    color: colors.textSecondary,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: typography.lineHeights.body,
    marginBottom: spacing.lg,
  },
  pulsePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: 'rgba(45, 212, 191, 0.1)',
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: 'rgba(45, 212, 191, 0.3)',
    gap: 6,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primaryTeal,
  },
  pulseText: {
    fontSize: typography.sizes.caption,
    color: colors.primaryTeal,
    fontWeight: typography.weights.semibold,
  },
  confirmContainer: {
    flex: 1,
    padding: spacing.base,
  },
  confirmHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  confirmHeaderTitle: {
    fontSize: typography.sizes.h3,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  confirmBody: {
    flex: 1,
    gap: spacing.md,
  },
  confirmPhoto: {
    width: '100%',
    height: 160,
    borderRadius: radius.card,
  },
  confirmPlaceholderPhoto: {
    width: '100%',
    height: 100,
    borderRadius: radius.card,
    backgroundColor: 'rgba(45, 212, 191, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeWrapper: {
    alignItems: 'flex-start',
  },
  disagreementBox: {
    borderColor: colors.warning,
  },
  disagreeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  disagreeTitle: {
    fontSize: typography.sizes.callout,
    fontWeight: typography.weights.bold,
    color: colors.warning,
  },
  disagreeSubtitle: {
    fontSize: typography.sizes.caption,
    color: colors.textSecondary,
    marginVertical: 4,
  },
  disagreeOptionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  disagreeChoice: {
    flex: 1,
    padding: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  disagreeChoiceActive: {
    borderColor: colors.primaryTeal,
    backgroundColor: 'rgba(45, 212, 191, 0.12)',
  },
  disagreeModelTag: {
    fontSize: typography.sizes.micro,
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  disagreeChoiceName: {
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    marginTop: 2,
  },
  dishCard: {},
  dishCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dishDetectedLabel: {
    fontSize: typography.sizes.caption,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  dishDetectedName: {
    fontSize: typography.sizes.h2 - 2,
    fontWeight: typography.weights.heavy,
    color: colors.textPrimary,
    marginTop: 2,
  },
  changeDishBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.primaryTeal,
  },
  changeDishText: {
    fontSize: typography.sizes.caption,
    color: colors.primaryTeal,
    fontWeight: typography.weights.bold,
  },
  portionCard: {},
  portionTitle: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  portionSubtitle: {
    fontSize: typography.sizes.caption,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    marginVertical: spacing.xs,
  },
  stepBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  portionValueBox: {
    alignItems: 'center',
    minWidth: 100,
  },
  portionValueNumber: {
    fontSize: typography.sizes.display,
    fontWeight: typography.weights.heavy,
    color: colors.primaryTeal,
  },
  portionValueUnit: {
    fontSize: typography.sizes.caption,
    color: colors.textSecondary,
  },
  presetsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  presetChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  presetChipActive: {
    backgroundColor: colors.primaryTeal,
    borderColor: colors.primaryTeal,
  },
  presetChipText: {
    fontSize: typography.sizes.caption,
    color: colors.textSecondary,
    fontWeight: typography.weights.semibold,
  },
  presetChipTextActive: {
    color: colors.textInverse,
    fontWeight: typography.weights.bold,
  },
  calculateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryTeal,
    paddingVertical: spacing.base,
    borderRadius: radius.card,
    marginTop: 'auto',
    shadowColor: colors.primaryTeal,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  calculateBtnText: {
    fontSize: typography.sizes.h3,
    fontWeight: typography.weights.heavy,
    color: colors.textInverse,
  },
  errorStepWrapper: {
    flex: 1,
    padding: spacing.base,
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.backgroundElevated,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.base,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: typography.sizes.h3,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: Platform.OS === 'ios' ? spacing.sm : 2,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    marginBottom: spacing.md,
  },
  searchInput: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: typography.sizes.body,
  },
  modalDishItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  modalDishTextCol: {
    flex: 1,
    marginRight: spacing.sm,
  },
  modalDishName: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  modalDishCat: {
    fontSize: typography.sizes.caption,
    color: colors.textSecondary,
    marginTop: 2,
    textTransform: 'capitalize',
  },
});

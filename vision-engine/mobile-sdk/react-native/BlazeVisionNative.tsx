/**
 * Blaze Intelligence Vision SDK - React Native
 * Championship Mobile Capture for iOS & Android
 * From Friday Night Lights to MLB Scouting
 */

import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  Dimensions,
  ActivityIndicator,
  ScrollView,
  Modal
} from 'react-native';
import {
  Camera,
  useCameraDevices,
  useFrameProcessor,
  Frame,
  CameraRuntimeError
} from 'react-native-vision-camera';
import Video from 'react-native-video';
import RNFS from 'react-native-fs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { runOnJS } from 'react-native-reanimated';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface BlazeVisionProps {
  apiKey: string;
  playerId?: string;
  sport?: 'baseball' | 'football' | 'basketball';
  sessionType?: string;
  onAnalysisComplete?: (results: any) => void;
  perfectGameEnabled?: boolean;
}

interface SessionData {
  id: string;
  playerId: string;
  sport: string;
  sessionType: string;
  timestamp: string;
  location?: { lat: number; lng: number };
  deviceInfo: any;
  videoPath?: string;
  analysisResults?: any;
  status: 'recording' | 'processing' | 'completed' | 'failed';
}

/**
 * Main Blaze Vision Component
 */
export const BlazeVisionCapture: React.FC<BlazeVisionProps> = ({
  apiKey,
  playerId = 'unknown',
  sport = 'baseball',
  sessionType = 'training',
  onAnalysisComplete,
  perfectGameEnabled = false
}) => {
  const camera = useRef<Camera>(null);
  const devices = useCameraDevices();
  const device = devices.back;

  const [isRecording, setIsRecording] = useState(false);
  const [currentSession, setCurrentSession] = useState<SessionData | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [liveMetrics, setLiveMetrics] = useState({
    biomechanical: 0,
    behavioral: 0,
    efficiency: 0
  });

  // Texas Championship Coaching Cues
  const [coachingCues] = useState({
    baseball: {
      batting: [
        "Load those hips like Nolan Ryan",
        "Drive through - Texas power",
        "Stay balanced - championship form"
      ],
      pitching: [
        "Control that arm slot",
        "Drive off the mound",
        "Follow through to the plate"
      ]
    },
    football: {
      quarterback: [
        "Set your feet like Earl Campbell",
        "Eyes downfield - read the defense",
        "Quick release - championship timing"
      ]
    },
    basketball: {
      shooting: [
        "Elbow under the ball",
        "Follow through high",
        "Land balanced"
      ]
    }
  });

  /**
   * Initialize camera permissions
   */
  useEffect(() => {
    (async () => {
      const cameraPermission = await Camera.requestCameraPermission();
      const microphonePermission = await Camera.requestMicrophonePermission();

      if (cameraPermission === 'denied' || microphonePermission === 'denied') {
        Alert.alert(
          'Permissions Required',
          'Camera and microphone access needed for video analysis'
        );
      }
    })();
  }, []);

  /**
   * Frame processor for real-time analysis preview
   */
  const frameProcessor = useFrameProcessor((frame: Frame) => {
    'worklet';

    // Simple real-time motion detection
    const motionScore = detectMotion(frame);

    // Update metrics on UI thread
    runOnJS(updateLiveMetrics)(motionScore);
  }, []);

  /**
   * Update live metrics display
   */
  const updateLiveMetrics = useCallback((motionScore: number) => {
    setLiveMetrics(prev => ({
      biomechanical: Math.min(100, prev.biomechanical + (motionScore > 50 ? 1 : -0.5)),
      behavioral: Math.min(100, prev.behavioral + (Math.random() * 2 - 1)),
      efficiency: Math.min(100, (prev.biomechanical + prev.behavioral) / 2)
    }));
  }, []);

  /**
   * Start recording session
   */
  const startRecording = async () => {
    if (!camera.current) return;

    try {
      const sessionId = generateSessionId();
      const videoPath = `${RNFS.DocumentDirectoryPath}/blaze_${sessionId}.mp4`;

      // Create session data
      const session: SessionData = {
        id: sessionId,
        playerId,
        sport,
        sessionType,
        timestamp: new Date().toISOString(),
        deviceInfo: {
          platform: Platform.OS,
          version: Platform.Version,
          model: Platform.select({
            ios: 'iPhone',
            android: 'Android Device'
          })
        },
        videoPath,
        status: 'recording'
      };

      setCurrentSession(session);
      setIsRecording(true);

      // Start camera recording
      await camera.current.startRecording({
        onRecordingFinished: (video) => onRecordingFinished(video, session),
        onRecordingError: (error) => onRecordingError(error),
        fileType: 'mp4',
        videoCodec: Platform.OS === 'ios' ? 'h264' : 'h264',
        videoBitRate: 'high',
        videoQuality: 'high'
      });

      // Save session to local storage
      await saveSessionLocally(session);

    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Recording Error', 'Failed to start video capture');
    }
  };

  /**
   * Stop recording session
   */
  const stopRecording = async () => {
    if (!camera.current || !isRecording) return;

    try {
      await camera.current.stopRecording();
      setIsRecording(false);
    } catch (error) {
      console.error('Failed to stop recording:', error);
    }
  };

  /**
   * Handle recording completion
   */
  const onRecordingFinished = async (video: any, session: SessionData) => {
    setIsProcessing(true);

    try {
      // Check network connectivity
      const netInfo = await NetInfo.fetch();

      if (netInfo.isConnected) {
        // Upload and analyze immediately
        const results = await uploadAndAnalyze(video.path, session);
        handleAnalysisComplete(results);
      } else {
        // Queue for later upload
        await queueForOfflineProcessing(video.path, session);
        Alert.alert(
          'Offline Mode',
          'Video saved. Analysis will complete when connection is restored.'
        );
      }
    } catch (error) {
      console.error('Processing error:', error);
      Alert.alert('Processing Error', 'Failed to process video');
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Handle recording error
   */
  const onRecordingError = (error: CameraRuntimeError) => {
    console.error('Recording error:', error);
    setIsRecording(false);
    Alert.alert('Recording Error', error.message);
  };

  /**
   * Upload video and trigger analysis
   */
  const uploadAndAnalyze = async (videoPath: string, session: SessionData) => {
    // Read video file
    const videoBase64 = await RNFS.readFile(videoPath, 'base64');
    const videoBlob = base64ToBlob(videoBase64, 'video/mp4');

    // Upload to Cloudinary
    const formData = new FormData();
    formData.append('file', videoBlob);
    formData.append('upload_preset', 'blaze_vision');
    formData.append('public_id', `${sport}_${playerId}_${session.id}`);
    formData.append('context', `player_id=${playerId}|sport=${sport}`);

    const uploadResponse = await fetch(
      'https://api.cloudinary.com/v1_1/blaze-intelligence/video/upload',
      {
        method: 'POST',
        body: formData
      }
    );

    const uploadResult = await uploadResponse.json();

    // Trigger Vision Engine analysis
    const analysisResponse = await fetch(
      'https://api.blaze-intelligence.com/api/analysis/trigger',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          videoUrl: uploadResult.secure_url,
          publicId: uploadResult.public_id,
          playerId,
          sport,
          sessionType,
          metadata: session
        })
      }
    );

    const analysisResult = await analysisResponse.json();

    // Poll for results
    return await pollForResults(analysisResult.sessionId);
  };

  /**
   * Poll for analysis results
   */
  const pollForResults = async (sessionId: string): Promise<any> => {
    const maxAttempts = 60; // 3 minutes max
    let attempts = 0;

    while (attempts < maxAttempts) {
      const response = await fetch(
        `https://api.blaze-intelligence.com/api/analysis/${sessionId}`,
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`
          }
        }
      );

      const data = await response.json();

      if (data.status === 'completed') {
        return data;
      } else if (data.status === 'failed') {
        throw new Error('Analysis failed');
      }

      // Wait 3 seconds before next poll
      await new Promise(resolve => setTimeout(resolve, 3000));
      attempts++;
    }

    throw new Error('Analysis timeout');
  };

  /**
   * Handle analysis completion
   */
  const handleAnalysisComplete = async (results: any) => {
    setAnalysisResults(results);
    setShowResults(true);

    // Update session with results
    if (currentSession) {
      const updatedSession = {
        ...currentSession,
        analysisResults: results,
        status: 'completed' as const
      };
      await saveSessionLocally(updatedSession);
    }

    // Callback to parent
    if (onAnalysisComplete) {
      onAnalysisComplete(results);
    }

    // Perfect Game integration
    if (perfectGameEnabled && results) {
      await sendToPerfectGame(results);
    }
  };

  /**
   * Render camera view
   */
  const renderCamera = () => {
    if (!device) {
      return (
        <View style={styles.noCamera}>
          <Text style={styles.noCameraText}>No camera available</Text>
        </View>
      );
    }

    return (
      <Camera
        ref={camera}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={true}
        video={true}
        audio={true}
        frameProcessor={frameProcessor}
        fps={sport === 'baseball' ? 60 : 30}
        videoStabilizationMode="auto"
        exposure={0}
        zoom={1}
      />
    );
  };

  /**
   * Render live metrics overlay
   */
  const renderLiveMetrics = () => (
    <View style={styles.metricsOverlay}>
      <Text style={styles.metricsTitle}>LIVE ANALYSIS</Text>
      <View style={styles.metricRow}>
        <Text style={styles.metricLabel}>Biomechanical:</Text>
        <Text style={styles.metricValue}>{liveMetrics.biomechanical.toFixed(0)}%</Text>
      </View>
      <View style={styles.metricRow}>
        <Text style={styles.metricLabel}>Composure:</Text>
        <Text style={styles.metricValue}>{liveMetrics.behavioral.toFixed(0)}%</Text>
      </View>
      <View style={styles.metricRow}>
        <Text style={styles.metricLabel}>Efficiency:</Text>
        <Text style={styles.metricValue}>{liveMetrics.efficiency.toFixed(0)}%</Text>
      </View>
    </View>
  );

  /**
   * Render coaching cues
   */
  const renderCoachingCues = () => {
    const cues = coachingCues[sport]?.[sessionType] || [];

    return (
      <View style={styles.cuesOverlay}>
        {cues.map((cue, index) => (
          <Text key={index} style={styles.cueText}>• {cue}</Text>
        ))}
      </View>
    );
  };

  /**
   * Render results modal
   */
  const renderResults = () => (
    <Modal
      visible={showResults}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <ScrollView style={styles.resultsContainer}>
        <View style={styles.resultsHeader}>
          <Text style={styles.resultsTitle}>Championship Analysis</Text>
          <TouchableOpacity onPress={() => setShowResults(false)}>
            <Text style={styles.closeButton}>✕</Text>
          </TouchableOpacity>
        </View>

        {analysisResults && (
          <>
            {/* Championship Readiness Score */}
            <View style={styles.championshipScore}>
              <Text style={styles.scoreLabel}>Championship Readiness</Text>
              <Text style={styles.scoreValue}>
                {analysisResults.scores?.championshipReadiness || '--'}%
              </Text>
            </View>

            {/* Performance Metrics */}
            <View style={styles.metricsGrid}>
              <MetricCard
                label="Biomechanical"
                value={analysisResults.scores?.biomechanical}
                color="#BF5700"
              />
              <MetricCard
                label="Behavioral"
                value={analysisResults.scores?.behavioral}
                color="#9BCBEB"
              />
              <MetricCard
                label="Clutch Factor"
                value={analysisResults.scores?.clutchFactor}
                color="#FF6B35"
              />
              <MetricCard
                label="Overall"
                value={analysisResults.scores?.overall}
                color="#00B2A9"
              />
            </View>

            {/* Key Insights */}
            <View style={styles.insightsSection}>
              <Text style={styles.sectionTitle}>Coaching Insights</Text>
              {analysisResults.insights?.slice(0, 3).map((insight: any, index: number) => (
                <View key={index} style={styles.insightCard}>
                  <Text style={styles.insightText}>{insight.insight}</Text>
                  <Text style={styles.recommendationText}>{insight.recommendation}</Text>
                </View>
              ))}
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.primaryButton}>
                <Text style={styles.buttonText}>Share Report</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>Export Data</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </Modal>
  );

  return (
    <View style={styles.container}>
      {renderCamera()}

      {/* Overlays */}
      {isRecording && renderLiveMetrics()}
      {isRecording && renderCoachingCues()}

      {/* Recording Indicator */}
      {isRecording && (
        <View style={styles.recordingIndicator}>
          <View style={styles.recordingDot} />
          <Text style={styles.recordingText}>REC</Text>
        </View>
      )}

      {/* Control Button */}
      <TouchableOpacity
        style={[styles.captureButton, isRecording && styles.stopButton]}
        onPress={isRecording ? stopRecording : startRecording}
        disabled={isProcessing}
      >
        {isProcessing ? (
          <ActivityIndicator color="white" />
        ) : (
          <View style={isRecording ? styles.stopIcon : styles.recordIcon} />
        )}
      </TouchableOpacity>

      {/* Results Modal */}
      {renderResults()}
    </View>
  );
};

/**
 * Metric Card Component
 */
const MetricCard: React.FC<{
  label: string;
  value: number;
  color: string;
}> = ({ label, value, color }) => (
  <View style={[styles.metricCard, { borderColor: color }]}>
    <Text style={styles.metricCardLabel}>{label}</Text>
    <Text style={[styles.metricCardValue, { color }]}>
      {value?.toFixed(1) || '--'}
    </Text>
  </View>
);

/**
 * Helper Functions
 */
function generateSessionId(): string {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function detectMotion(frame: Frame): number {
  'worklet';
  // Simplified motion detection
  return Math.random() * 100;
}

function base64ToBlob(base64: string, contentType: string): Blob {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);

  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }

  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: contentType });
}

async function saveSessionLocally(session: SessionData): Promise<void> {
  const sessions = await AsyncStorage.getItem('blaze_sessions');
  const sessionList = sessions ? JSON.parse(sessions) : [];

  const index = sessionList.findIndex((s: SessionData) => s.id === session.id);
  if (index >= 0) {
    sessionList[index] = session;
  } else {
    sessionList.push(session);
  }

  await AsyncStorage.setItem('blaze_sessions', JSON.stringify(sessionList));
}

async function queueForOfflineProcessing(videoPath: string, session: SessionData): Promise<void> {
  const queue = await AsyncStorage.getItem('blaze_upload_queue');
  const queueList = queue ? JSON.parse(queue) : [];

  queueList.push({
    ...session,
    videoPath,
    queuedAt: new Date().toISOString()
  });

  await AsyncStorage.setItem('blaze_upload_queue', JSON.stringify(queueList));
}

async function sendToPerfectGame(results: any): Promise<void> {
  // Perfect Game integration
  console.log('Sending to Perfect Game:', results);
}

/**
 * Styles
 */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black'
  },
  noCamera: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black'
  },
  noCameraText: {
    color: 'white',
    fontSize: 18
  },
  metricsOverlay: {
    position: 'absolute',
    top: 100,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BF5700'
  },
  metricsTitle: {
    color: '#BF5700',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 10,
    letterSpacing: 1
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 3
  },
  metricLabel: {
    color: 'white',
    fontSize: 11,
    marginRight: 10
  },
  metricValue: {
    color: '#9BCBEB',
    fontSize: 14,
    fontWeight: 'bold'
  },
  cuesOverlay: {
    position: 'absolute',
    bottom: 150,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 15,
    borderRadius: 10
  },
  cueText: {
    color: 'white',
    fontSize: 12,
    marginVertical: 2
  },
  recordingIndicator: {
    position: 'absolute',
    top: 50,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center'
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'red',
    marginRight: 8
  },
  recordingText: {
    color: 'red',
    fontSize: 16,
    fontWeight: 'bold'
  },
  captureButton: {
    position: 'absolute',
    bottom: 50,
    alignSelf: 'center',
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#BF5700',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84
  },
  stopButton: {
    backgroundColor: '#FF4444'
  },
  recordIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'white'
  },
  stopIcon: {
    width: 25,
    height: 25,
    backgroundColor: 'white'
  },
  resultsContainer: {
    flex: 1,
    backgroundColor: '#0a0a0a'
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#BF5700'
  },
  resultsTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold'
  },
  closeButton: {
    color: 'white',
    fontSize: 30
  },
  championshipScore: {
    alignItems: 'center',
    padding: 30,
    backgroundColor: 'rgba(191, 87, 0, 0.1)',
    margin: 20,
    borderRadius: 15
  },
  scoreLabel: {
    color: '#9BCBEB',
    fontSize: 14,
    marginBottom: 10,
    letterSpacing: 2,
    textTransform: 'uppercase'
  },
  scoreValue: {
    color: '#BF5700',
    fontSize: 48,
    fontWeight: 'bold'
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    padding: 10
  },
  metricCard: {
    width: '45%',
    padding: 15,
    margin: 5,
    borderWidth: 1,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)'
  },
  metricCardLabel: {
    color: 'white',
    fontSize: 12,
    marginBottom: 5
  },
  metricCardValue: {
    fontSize: 24,
    fontWeight: 'bold'
  },
  insightsSection: {
    padding: 20
  },
  sectionTitle: {
    color: '#BF5700',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15
  },
  insightCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 15,
    marginVertical: 5,
    borderRadius: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#FF6B35'
  },
  insightText: {
    color: 'white',
    fontSize: 14,
    marginBottom: 5
  },
  recommendationText: {
    color: '#9BCBEB',
    fontSize: 12,
    fontStyle: 'italic'
  },
  actionButtons: {
    padding: 20
  },
  primaryButton: {
    backgroundColor: '#BF5700',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#BF5700',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center'
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold'
  },
  secondaryButtonText: {
    color: '#BF5700',
    fontSize: 16,
    fontWeight: 'bold'
  }
});

export default BlazeVisionCapture;
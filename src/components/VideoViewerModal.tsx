import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  useWindowDimensions,
  View,
  type LayoutChangeEvent,
  type GestureResponderEvent as PressEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Expand,
  Pause,
  Play,
  RotateCcw,
  RotateCw,
  X,
} from 'lucide-react-native';
import Video, {
  BufferingStrategyType,
  type VideoRef,
} from 'react-native-video';
import { Text } from 'react-native-paper';

import { LucideIcon } from './LucideIcon';

type VideoItem = {
  path: string;
  name: string;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  video: VideoItem | null;
};

const AUTO_HIDE_DELAY_MS = 2500;
const SEEK_STEP_SECONDS = 10;

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return '0:00';
  }

  const totalSeconds = Math.floor(seconds);
  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;

  if (minutes < 60) {
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return `${hours}:${remainingMinutes
    .toString()
    .padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

export function VideoViewerModal({ visible, onClose, video }: Props) {
  const [isLoading, setIsLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [progressBarWidth, setProgressBarWidth] = useState(0);
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const videoRef = useRef<VideoRef>(null);
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isLandscape = width > height;

  const clearControlsTimeout = () => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
      controlsTimeoutRef.current = null;
    }
  };

  const revealControls = () => {
    setShowControls(true);

    clearControlsTimeout();

    if (!isPaused) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, AUTO_HIDE_DELAY_MS);
    }
  };

  const togglePlayback = () => {
    setIsPaused(previousValue => !previousValue);
    setShowControls(true);
  };

  const seekTo = (timeInSeconds: number) => {
    const nextTime = Math.min(Math.max(timeInSeconds, 0), duration || 0);
    videoRef.current?.seek(nextTime);
    setCurrentTime(nextTime);
    revealControls();
  };

  const handleSeekStep = (offsetInSeconds: number) => {
    seekTo(currentTime + offsetInSeconds);
  };

  const handleProgressTrackLayout = (event: LayoutChangeEvent) => {
    setProgressBarWidth(event.nativeEvent.layout.width);
  };

  const handleProgressTrackPress = (event: PressEvent) => {
    if (!progressBarWidth || !duration) {
      return;
    }

    const pressedRatio = Math.min(
      Math.max(event.nativeEvent.locationX / progressBarWidth, 0),
      1,
    );

    seekTo(pressedRatio * duration);
  };

  useEffect(() => {
    if (visible) {
      setIsLoading(true);
      setIsPaused(false);
      setShowControls(true);
      setDuration(0);
      setCurrentTime(0);
      clearControlsTimeout();
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, AUTO_HIDE_DELAY_MS);
      return;
    }

    clearControlsTimeout();
  }, [visible, video?.path]);

  useEffect(() => {
    if (!visible) {
      return;
    }

    if (showControls) {
      clearControlsTimeout();

      if (!isPaused) {
        controlsTimeoutRef.current = setTimeout(() => {
          setShowControls(false);
        }, AUTO_HIDE_DELAY_MS);
      }

      return;
    }

    clearControlsTimeout();
  }, [isPaused, showControls, visible]);

  useEffect(() => {
    if (!visible) {
      return;
    }

    videoRef.current?.setFullScreen(false);
  }, [isLandscape, visible]);

  useEffect(() => {
    return () => {
      clearControlsTimeout();
    };
  }, []);

  if (!visible || !video) {
    return null;
  }

  const topInset =
    Platform.OS === 'android'
      ? Math.max(StatusBar.currentHeight ?? 0, insets.top) + 0
      : Math.max(18, insets.top) + 0;

  const bottomInset = Math.max(
    insets.bottom,
    Platform.OS === 'android' ? 0 : 0,
  );
  const playerBottomInset = isLandscape ? 0 : bottomInset;

  const progressRatio = duration > 0 ? currentTime / duration : 0;
  const remainingTime = Math.max(duration - currentTime, 0);

  return (
    <Modal
      visible={visible}
      animationType="fade"
      presentationStyle="fullScreen"
      statusBarTranslucent={true}
      onRequestClose={onClose}
    >
      <StatusBar
        barStyle="light-content"
        backgroundColor="#000"
        translucent={true}
        hidden={true}
      />
      <View style={styles.container}>
        <View style={styles.videoFrame}>
          <Video
            ref={videoRef}
            source={{
              uri: video.path,
              bufferConfig: {
                minBufferMs: 15000,
                maxBufferMs: 50000,
                bufferForPlaybackMs: 2500,
                bufferForPlaybackAfterRebufferMs: 5000,
              },
            }}
            bufferingStrategy={BufferingStrategyType.DEPENDING_ON_MEMORY}
            style={[
              styles.video,
              {
                width,
                height: height - playerBottomInset,
                marginBottom: playerBottomInset,
              },
            ]}
            controls={false}
            paused={isPaused}
            resizeMode="contain"
            onLoad={event => {
              setDuration(event.duration);
              setCurrentTime(event.currentTime);
              setIsLoading(false);
              revealControls();
            }}
            onLoadStart={() => {
              setIsLoading(true);
            }}
            onProgress={event => {
              setCurrentTime(event.currentTime);
            }}
            onEnd={() => {
              setIsPaused(true);
              setShowControls(true);
              setCurrentTime(duration);
            }}
            onError={() => {
              setIsLoading(false);
              setShowControls(true);
            }}
            onBuffer={({ isBuffering }) => {
              setIsLoading(isBuffering);
            }}
          />

          <Pressable
            style={styles.overlayTouchArea}
            onPress={() => {
              if (showControls) {
                setShowControls(false);
                clearControlsTimeout();
                return;
              }

              revealControls();
            }}
          >
            {showControls ? (
              <>
                <View
                  pointerEvents="box-none"
                  style={[styles.topControls, { top: topInset }]}
                >
                  <Pressable
                    onPress={onClose}
                    style={styles.iconButton}
                    hitSlop={10}
                  >
                    <LucideIcon icon={X} color="#fff" size={22} />
                  </Pressable>

                  <Pressable
                    onPress={() => videoRef.current?.presentFullscreenPlayer()}
                    style={styles.iconButton}
                    hitSlop={10}
                  >
                    <LucideIcon icon={Expand} color="#fff" size={20} />
                  </Pressable>
                </View>

                <View style={styles.centerControls} pointerEvents="box-none">
                  <Pressable
                    onPress={() => {
                      handleSeekStep(-SEEK_STEP_SECONDS);
                    }}
                    style={styles.secondaryControl}
                    hitSlop={12}
                  >
                    <LucideIcon icon={RotateCcw} color="#fff" size={20} />
                    {/* <Text style={styles.secondaryControlLabel}>10</Text> */}
                  </Pressable>

                  <Pressable
                    onPress={togglePlayback}
                    style={styles.primaryControl}
                    hitSlop={16}
                  >
                    <LucideIcon
                      icon={isPaused ? Play : Pause}
                      color="#0b0b0b"
                      size={28}
                    />
                  </Pressable>

                  <Pressable
                    onPress={() => {
                      handleSeekStep(SEEK_STEP_SECONDS);
                    }}
                    style={styles.secondaryControl}
                    hitSlop={12}
                  >
                    <LucideIcon icon={RotateCw} color="#fff" size={20} />
                    {/* <Text style={styles.secondaryControlLabel}>10</Text> */}
                  </Pressable>
                </View>

                <View
                  style={[
                    styles.bottomPanel,
                    { bottom: playerBottomInset + 10 },
                  ]}
                >
                  <View style={styles.timeRow}>
                    <Text style={styles.timeLabel}>
                      {formatTime(currentTime)}
                    </Text>
                    <Text style={styles.videoName} numberOfLines={1}>
                      {video.name}
                    </Text>
                    <Text style={styles.timeLabel}>
                      -{formatTime(remainingTime)}
                    </Text>
                  </View>

                  <Pressable
                    onLayout={handleProgressTrackLayout}
                    onPress={handleProgressTrackPress}
                    style={styles.progressTrack}
                  >
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${
                            Math.min(Math.max(progressRatio, 0), 1) * 100
                          }%`,
                        },
                      ]}
                    />
                    <View
                      style={[
                        styles.progressThumb,
                        {
                          left: `${
                            Math.min(Math.max(progressRatio, 0), 1) * 100
                          }%`,
                        },
                      ]}
                    />
                  </Pressable>
                </View>
              </>
            ) : null}
          </Pressable>
        </View>

        {isLoading ? (
          <View style={styles.loaderOverlay} pointerEvents="none">
            <View style={styles.loaderCard}>
              <ActivityIndicator size="large" color="#fff" />
            </View>
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
  },
  videoFrame: {
    flex: 1,
    backgroundColor: '#030303',
  },
  video: {
    backgroundColor: '#000',
  },
  overlayTouchArea: {
    ...StyleSheet.absoluteFillObject,
  },
  topControls: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  centerControls: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  bottomPanel: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 4,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 16,
    borderRadius: 24,
    backgroundColor: 'rgba(9,9,9,0.78)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(15,15,15,0.76)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    shadowColor: '#000',
    shadowOpacity: 0.28,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    elevation: 4,
  },
  primaryControl: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: '#f5f1e8',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.34,
    shadowRadius: 18,
    shadowOffset: {
      width: 0,
      height: 10,
    },
    elevation: 8,
  },
  secondaryControl: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(20,20,20,0.74)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  secondaryControlLabel: {
    position: 'absolute',
    bottom: 8,
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  timeLabel: {
    color: 'rgba(255,255,255,0.86)',
    fontSize: 12,
    fontWeight: '700',
    minWidth: 42,
  },
  videoName: {
    flex: 1,
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  progressTrack: {
    height: 26,
    justifyContent: 'center',
  },
  progressFill: {
    position: 'absolute',
    left: 0,
    height: 6,
    borderRadius: 999,
    backgroundColor: '#f2a65a',
  },
  progressThumb: {
    position: 'absolute',
    marginLeft: -7,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#fffaf2',
    borderWidth: 2,
    borderColor: '#f2a65a',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 3,
    },
  },
  loaderOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.28)',
  },
  loaderCard: {
    width: 72,
    height: 72,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

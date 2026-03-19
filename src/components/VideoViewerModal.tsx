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
  Volume2,
  X,
} from 'lucide-react-native';
import Video, {
  BufferingStrategyType,
  SelectedTrackType,
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

type PlayerAudioTrack = {
  selected?: boolean;
  type?: string;
  title?: string;
  language?: string;
  index: number;
};

const AUTO_HIDE_DELAY_MS = 2500;
const SEEK_STEP_SECONDS = 10;
const VIDEO_DEBUG_PREFIX = '[VideoViewerModal]';

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
  const [showAudioSelector, setShowAudioSelector] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [progressBarWidth, setProgressBarWidth] = useState(0);
  const [audioTracks, setAudioTracks] = useState<PlayerAudioTrack[]>([]);
  const [selectedAudioTrackIndex, setSelectedAudioTrackIndex] = useState<
    number | null
  >(null);
  const [appliedAudioTrackIndex, setAppliedAudioTrackIndex] = useState<
    number | null
  >(null);
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

  const syncAudioTracks = (tracks: PlayerAudioTrack[]) => {
    setAudioTracks(tracks);

    const selectedTrack = tracks.find(track => track.selected);

    if (selectedTrack) {
      setSelectedAudioTrackIndex(selectedTrack.index);
      setAppliedAudioTrackIndex(selectedTrack.index);
      return;
    }

    if (tracks.length > 0 && selectedAudioTrackIndex === null) {
      logVideoDebug('autoSelectedAudioTrack', {
        index: tracks[0].index,
        title: tracks[0].title,
        language: tracks[0].language,
        type: tracks[0].type,
      });
      setSelectedAudioTrackIndex(tracks[0].index);
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
      setShowAudioSelector(false);
      setDuration(0);
      setCurrentTime(0);
      setAudioTracks([]);
      setSelectedAudioTrackIndex(null);
      setAppliedAudioTrackIndex(null);
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
  const selectedAudioTrack =
    appliedAudioTrackIndex === null
      ? undefined
      : {
          type: SelectedTrackType.INDEX,
          value: appliedAudioTrackIndex,
        };

  const logVideoDebug = (eventName: string, payload?: unknown) => {
    if (!video) {
      return;
    }

    console.log(`${VIDEO_DEBUG_PREFIX} ${eventName}`, {
      fileName: video.name,
      path: video.path,
      ...(payload && typeof payload === 'object' ? (payload as object) : {}),
    });
  };

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
            selectedAudioTrack={selectedAudioTrack}
            onLoad={event => {
              setDuration(event.duration);
              setCurrentTime(event.currentTime);
              setIsLoading(false);
              syncAudioTracks(event.audioTracks);
              logVideoDebug('onLoad', {
                duration: event.duration,
                currentTime: event.currentTime,
                naturalSize: event.naturalSize,
                audioTracks: event.audioTracks,
                textTracks: event.textTracks,
                videoTracks: event.videoTracks,
              });
              revealControls();
            }}
            onLoadStart={() => {
              setIsLoading(true);
              logVideoDebug('onLoadStart');
            }}
            onProgress={event => {
              setCurrentTime(event.currentTime);
            }}
            onEnd={() => {
              setIsPaused(true);
              setShowControls(true);
              setCurrentTime(duration);
              logVideoDebug('onEnd');
            }}
            onError={error => {
              setIsLoading(false);
              setShowControls(true);
              logVideoDebug('onError', error);
            }}
            onBuffer={({ isBuffering }) => {
              setIsLoading(isBuffering);
              logVideoDebug('onBuffer', { isBuffering });
            }}
            onAudioTracks={event => {
              syncAudioTracks(event.audioTracks);
              logVideoDebug('onAudioTracks', { audioTracks: event.audioTracks });
            }}
          />

          <View style={styles.overlayTouchArea} pointerEvents="box-none">
            <Pressable
              style={styles.overlayBackgroundTap}
              onPress={() => {
                if (showControls) {
                  setShowControls(false);
                  clearControlsTimeout();
                  return;
                }

                revealControls();
              }}
            />
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

                  <View style={styles.topActions}>
                    {audioTracks.length > 0 ? (
                      <Pressable
                        onPress={() => {
                          setShowAudioSelector(previousValue => !previousValue);
                          revealControls();
                        }}
                        style={styles.audioButton}
                        hitSlop={10}
                      >
                        <LucideIcon icon={Volume2} color="#fff" size={18} />
                        <Text style={styles.audioButtonLabel}>Audio</Text>
                      </Pressable>
                    ) : null}

                    <Pressable
                      onPress={() => videoRef.current?.presentFullscreenPlayer()}
                      style={styles.iconButton}
                      hitSlop={10}
                    >
                      <LucideIcon icon={Expand} color="#fff" size={20} />
                    </Pressable>
                  </View>
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
                  {showAudioSelector && audioTracks.length > 0 ? (
                    <View style={styles.audioSelector}>
                      <Text style={styles.audioSelectorTitle}>Audio Tracks</Text>
                      <View style={styles.audioTrackList}>
                        {audioTracks.map(track => {
                          const isSelected =
                            selectedAudioTrackIndex === track.index;
                          const label =
                            track.title?.trim() ||
                            track.language?.toUpperCase() ||
                            `Track ${track.index + 1}`;

                          return (
                            <Pressable
                              key={`${track.index}-${track.language ?? 'unknown'}`}
                              onPress={() => {
                                setSelectedAudioTrackIndex(track.index);
                                setAppliedAudioTrackIndex(track.index);
                                setShowAudioSelector(false);
                                revealControls();
                                logVideoDebug('selectedAudioTrack', {
                                  index: track.index,
                                  title: track.title,
                                  language: track.language,
                                  type: track.type,
                                });
                              }}
                              style={[
                                styles.audioTrackChip,
                                isSelected && styles.audioTrackChipActive,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.audioTrackLabel,
                                  isSelected && styles.audioTrackLabelActive,
                                ]}
                                numberOfLines={1}
                              >
                                {label}
                              </Text>
                              {track.type ? (
                                <Text
                                  style={[
                                    styles.audioTrackMeta,
                                    isSelected && styles.audioTrackMetaActive,
                                  ]}
                                  numberOfLines={1}
                                >
                                  {track.type}
                                </Text>
                              ) : null}
                            </Pressable>
                          );
                        })}
                      </View>
                    </View>
                  ) : null}

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
          </View>
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
  overlayBackgroundTap: {
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
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
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
  audioButton: {
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: 22,
    backgroundColor: 'rgba(15,15,15,0.76)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  audioButtonLabel: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
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
  audioSelector: {
    marginBottom: 14,
    gap: 10,
  },
  audioSelectorTitle: {
    color: 'rgba(255,255,255,0.86)',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  audioTrackList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  audioTrackChip: {
    maxWidth: '100%',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  audioTrackChipActive: {
    backgroundColor: 'rgba(242,166,90,0.18)',
    borderColor: 'rgba(242,166,90,0.55)',
  },
  audioTrackLabel: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  audioTrackLabelActive: {
    color: '#fff4e9',
  },
  audioTrackMeta: {
    marginTop: 2,
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
  },
  audioTrackMetaActive: {
    color: 'rgba(255,244,233,0.82)',
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

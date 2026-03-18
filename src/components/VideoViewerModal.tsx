import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Modal,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import { Text } from 'react-native-paper';
import { Expand, X } from 'lucide-react-native';
import Video, { type VideoRef } from 'react-native-video';

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

function truncateFileName(name: string, maxLength = 15) {
  if (name.length <= maxLength) {
    return name;
  }

  return `${name.slice(0, maxLength)}...`;
}

const VIDEO_CONTROLS_STYLES = {
  hideNavigationBarOnFullScreenMode: true,
  hideNotificationBarOnFullScreenMode: true,
};
const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const VIDEO_BOTTOM_INSET = Platform.OS === 'android' ? 48 : 20;

export function VideoViewerModal({ visible, onClose, video }: Props) {
  const [isLoading, setIsLoading] = useState(true);
  const [showHeader, setShowHeader] = useState(true);
  const hideHeaderTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const videoRef = useRef<VideoRef>(null);

  const scheduleHeaderHide = () => {
    if (hideHeaderTimeoutRef.current) {
      clearTimeout(hideHeaderTimeoutRef.current);
    }

    hideHeaderTimeoutRef.current = setTimeout(() => {
      setShowHeader(false);
    }, 2000);
  };

  useEffect(() => {
    if (visible) {
      setIsLoading(true);
      setShowHeader(true);
      scheduleHeaderHide();
    }
  }, [visible, video?.path]);

  useEffect(() => {
    return () => {
      if (hideHeaderTimeoutRef.current) {
        clearTimeout(hideHeaderTimeoutRef.current);
      }
    };
  }, []);

  if (!visible || !video) {
    return null;
  }

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
        {isLoading ? (
          <View style={styles.loaderOverlay}>
            <ActivityIndicator size="large" color="#fff" />
          </View>
        ) : null}

        <Video
          ref={videoRef}
          source={{ uri: video.path }}
          style={styles.video}
          controls={true}
          controlsStyles={VIDEO_CONTROLS_STYLES}
          resizeMode="contain"
          onLoadStart={() => {
            setIsLoading(true);
          }}
          onLoad={() => {
            setIsLoading(false);
          }}
          onError={() => {
            setIsLoading(false);
          }}
          onBuffer={({ isBuffering }) => {
            setIsLoading(isBuffering);
          }}
        />

        {showHeader ? (
          <View style={styles.header}>
            <Pressable onPress={onClose} style={styles.backButton}>
              <LucideIcon icon={X} color="#fff" size={24} />
            </Pressable>
            <View style={styles.titleContainer}>
              <Text
                variant="titleMedium"
                style={styles.title}
                numberOfLines={1}
              >
                {truncateFileName(video.name)}
              </Text>
            </View>
            <Pressable
              onPress={() => videoRef.current?.presentFullscreenPlayer()}
              style={styles.fullscreenButton}
            >
              <LucideIcon icon={Expand} color="#fff" size={22} />
            </Pressable>
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
  },
  video: {
    width: '100%',
    height: SCREEN_HEIGHT - VIDEO_BOTTOM_INSET,
    marginBottom: VIDEO_BOTTOM_INSET,
    backgroundColor: '#000',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 5,
    elevation: 5,
    height: 100,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  backButton: {
    padding: 8,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 16,
  },
  title: {
    color: '#fff',
    textAlign: 'center',
  },
  loaderOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullscreenButton: {
    padding: 8,
  },
});

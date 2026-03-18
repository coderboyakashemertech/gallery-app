import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList,
  Image,
  Modal,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  useWindowDimensions,
  View,
  type ListRenderItemInfo,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Text } from 'react-native-paper';
import { X } from 'lucide-react-native';

import { LucideIcon } from './LucideIcon';

type MediaItem = {
  path: string;
  name: string;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  media: MediaItem[];
  initialIndex: number;
};

type ZoomableImageProps = {
  uri: string;
  width: number;
  height: number;
  isActive: boolean;
  onZoomChange: (isZoomed: boolean) => void;
};

function clamp(value: number, min: number, max: number) {
  'worklet';
  return Math.min(Math.max(value, min), max);
}

function ZoomableImage({
  uri,
  width,
  height,
  isActive,
  onZoomChange,
}: ZoomableImageProps) {
  const scale = useSharedValue(1);
  const scaleOffset = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const panStartX = useSharedValue(0);
  const panStartY = useSharedValue(0);

  const reset = useCallback(() => {
    scale.value = withTiming(1);
    scaleOffset.value = 1;
    translateX.value = withTiming(0);
    translateY.value = withTiming(0);
    onZoomChange(false);
  }, [onZoomChange, scale, scaleOffset, translateX, translateY]);

  useEffect(() => {
    if (!isActive) {
      reset();
    }
  }, [isActive, reset]);

  const pinchGesture = Gesture.Pinch()
    .onStart(() => {
      scaleOffset.value = scale.value;
    })
    .onUpdate(event => {
      const nextScale = clamp(scaleOffset.value * event.scale, 1, 4);
      scale.value = nextScale;
    })
    .onEnd(() => {
      if (scale.value <= 1.02) {
        scale.value = withTiming(1);
        scaleOffset.value = 1;
        translateX.value = withTiming(0);
        translateY.value = withTiming(0);
        onZoomChange(false);
        return;
      }

      scale.value = withTiming(clamp(scale.value, 1, 4));
      scaleOffset.value = scale.value;
      onZoomChange(true);
    });

  const panGesture = Gesture.Pan()
    .onStart(() => {
      panStartX.value = translateX.value;
      panStartY.value = translateY.value;
    })
    .onUpdate(event => {
      if (scale.value <= 1) {
        return;
      }

      const maxOffsetX = ((scale.value - 1) * width) / 2;
      const maxOffsetY = ((scale.value - 1) * height) / 2;

      translateX.value = clamp(
        panStartX.value + event.translationX,
        -maxOffsetX,
        maxOffsetX,
      );
      translateY.value = clamp(
        panStartY.value + event.translationY,
        -maxOffsetY,
        maxOffsetY,
      );
    });

  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      if (scale.value > 1) {
        scale.value = withTiming(1);
        scaleOffset.value = 1;
        translateX.value = withTiming(0);
        translateY.value = withTiming(0);
        onZoomChange(false);
        return;
      }

      scale.value = withTiming(2.5);
      scaleOffset.value = 2.5;
      onZoomChange(true);
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  const composedGesture = Gesture.Simultaneous(
    pinchGesture,
    panGesture,
    doubleTapGesture,
  );

  return (
    <View style={[styles.page, { width, height }]}>
      <GestureDetector gesture={composedGesture}>
        <Animated.View style={animatedStyle}>
          <Image source={{ uri }} style={[styles.image, { width, height }]} resizeMode="contain" />
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

type HeaderProps = {
  imageIndex: number;
  media: MediaItem[];
  onClose: () => void;
};

function ViewerHeader({ imageIndex, media, onClose }: HeaderProps) {
  return (
    <View style={styles.header}>
      <Pressable onPress={onClose} style={styles.backButton}>
        <LucideIcon icon={X} color="#fff" size={24} />
      </Pressable>
      <View style={styles.titleContainer}>
        <Text variant="titleMedium" style={styles.title} numberOfLines={1}>
          {media[imageIndex]?.name}
        </Text>
        <Text variant="labelSmall" style={styles.subtitle}>
          {imageIndex + 1} of {media.length}
        </Text>
      </View>
      <View style={styles.headerSpacer} />
    </View>
  );
}

export function MediaViewerModal({
  visible,
  onClose,
  media,
  initialIndex,
}: Props) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isZoomed, setIsZoomed] = useState(false);
  const { width, height } = useWindowDimensions();
  const listRef = useRef<FlatList<MediaItem>>(null);

  useEffect(() => {
    if (visible) {
      setCurrentIndex(initialIndex);
      setIsZoomed(false);
    }
  }, [visible, initialIndex]);

  useEffect(() => {
    if (!visible) {
      return;
    }

    requestAnimationFrame(() => {
      listRef.current?.scrollToIndex({
        index: initialIndex,
        animated: false,
      });
    });
  }, [initialIndex, visible]);

  if (!visible || !media.length) {
    return null;
  }

  const renderItem = ({ item, index }: ListRenderItemInfo<MediaItem>) => (
    <ZoomableImage
      uri={item.path}
      width={width}
      height={height}
      isActive={index === currentIndex}
      onZoomChange={setIsZoomed}
    />
  );

  const handleMomentumEnd = (offsetX: number) => {
    const nextIndex = Math.round(offsetX / width);

    if (nextIndex !== currentIndex && nextIndex >= 0 && nextIndex < media.length) {
      setCurrentIndex(nextIndex);
      setIsZoomed(false);
    }
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
      />
      <View style={styles.container}>
        <FlatList
          ref={listRef}
          data={media}
          renderItem={renderItem}
          keyExtractor={item => item.path}
          horizontal={true}
          pagingEnabled={true}
          initialScrollIndex={initialIndex}
          scrollEnabled={!isZoomed}
          showsHorizontalScrollIndicator={false}
          style={styles.gallery}
          getItemLayout={(_, index) => ({
            length: width,
            offset: width * index,
            index,
          })}
          onMomentumScrollEnd={event => {
            handleMomentumEnd(event.nativeEvent.contentOffset.x);
          }}
        />

        <ViewerHeader imageIndex={currentIndex} media={media} onClose={onClose} />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  gallery: {
    flex: 1,
    backgroundColor: '#000',
  },
  page: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
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
  subtitle: {
    color: '#ccc',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
});

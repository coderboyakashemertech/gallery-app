import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, Image, Dimensions, ActivityIndicator, Pressable, FlatList, ViewToken, StatusBar, Platform, Modal, Alert } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { LucideIcon } from './LucideIcon';
import { X, Share2, Download, Play, Pause } from 'lucide-react-native';
import Share from 'react-native-share';
import ReactNativeBlobUtil from 'react-native-blob-util';
import Video, { VideoRef } from 'react-native-video';

const { width, height } = Dimensions.get('window');

type Props = {
    visible: boolean;
    onClose: () => void;
    media: { path: string; name: string }[];
    initialIndex: number;
};

export function MediaViewerModal({ visible, onClose, media, initialIndex }: Props) {
    const theme = useTheme();
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [headerVisible, setHeaderVisible] = useState(true);
    const [sharing, setSharing] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const flatListRef = useRef<FlatList>(null);

    useEffect(() => {
        if (visible) {
            setCurrentIndex(initialIndex);
            setHeaderVisible(true);
        }
    }, [visible, initialIndex]);

    const toggleHeader = () => setHeaderVisible((prev: boolean) => !prev);

    const handleShare = async () => {
        const currentMedia = media[currentIndex];
        if (!currentMedia || sharing) return;

        setSharing(true);

        // Sanitize filename to prevent path issues
        const originalName = currentMedia.name || 'file';
        const sanitizedName = originalName.replace(/[/\\?%*:|"<>]/g, '-').replace(/\s+/g, '_');
        const fileExt = sanitizedName.split('.').pop()?.toLowerCase() || 'jpg';

        const isVideo = ['mp4', 'm4v', 'mov', 'mkv', 'webm'].includes(fileExt);
        const mimeType = isVideo ? `video/${fileExt === 'mkv' ? 'x-matroska' : fileExt}` : `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`;

        // Use a unique sub-directory or timestamp prefix to prevent collisions while keeping the name
        const tempPath = `${ReactNativeBlobUtil.fs.dirs.CacheDir}/${Date.now()}_${sanitizedName}`;

        try {
            // Download the file
            const res = await ReactNativeBlobUtil
                .config({ path: tempPath })
                .fetch('GET', currentMedia.path);

            const localFilePath = res.path();

            // Share the local file
            await Share.open({
                url: `file://${localFilePath}`,
                type: mimeType,
                title: originalName,
                message: originalName,
                filename: originalName,
            });

            // Cleanup
            setTimeout(() => {
                ReactNativeBlobUtil.fs.unlink(localFilePath).catch(e => console.log('Cleanup error:', e));
            }, 5000); // Give it more time for videos

        } catch (error: any) {
            if (error?.message !== 'User did not share') {
                console.error('Error sharing media:', error);
                Alert.alert('Share Error', 'Could not prepare media for sharing.');
            }
        } finally {
            setSharing(false);
        }
    };

    const handleDownload = async () => {
        const currentMedia = media[currentIndex];
        if (!currentMedia || downloading) return;

        setDownloading(true);
        const originalName = currentMedia.name || 'file';
        const sanitizedName = originalName.replace(/[/\\?%*:|"<>]/g, '-').replace(/\s+/g, '_');
        const fileExt = sanitizedName.split('.').pop()?.toLowerCase() || 'jpg';

        const isVideo = ['mp4', 'm4v', 'mov', 'mkv', 'webm'].includes(fileExt);
        const mimeType = isVideo ? `video/${fileExt === 'mkv' ? 'x-matroska' : fileExt}` : `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`;

        const downloadDest = Platform.OS === 'android'
            ? `${ReactNativeBlobUtil.fs.dirs.DownloadDir}/${sanitizedName}`
            : `${ReactNativeBlobUtil.fs.dirs.DocumentDir}/${sanitizedName}`;

        try {
            const configOptions = Platform.select({
                android: {
                    addAndroidDownloads: {
                        useDownloadManager: true,
                        notification: true,
                        path: downloadDest,
                        description: `Downloading ${isVideo ? 'video' : 'image'}...`,
                        mime: mimeType,
                    }
                },
                ios: {
                    path: downloadDest,
                }
            });

            await ReactNativeBlobUtil
                .config(configOptions || {})
                .fetch('GET', currentMedia.path);

            if (Platform.OS === 'ios') {
                Alert.alert('Download Success', `Saved to Documents as ${sanitizedName}`);
            } else {
                Alert.alert('Download Success', 'Saved to Downloads folder.');
            }
        } catch (error) {
            console.error('Download error:', error);
            Alert.alert('Download Error', 'Could not download the file.');
        } finally {
            setDownloading(false);
        }
    };

    const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
        if (viewableItems.length > 0) {
            const newIndex = viewableItems[0].index || 0;
            if (newIndex !== currentIndex) {
                setCurrentIndex(newIndex);
                setHeaderVisible(true);
            }
        }
    }).current;

    const viewabilityConfig = useRef({
        itemVisiblePercentThreshold: 50
    }).current;

    const renderItem = ({ item, index }: { item: { path: string; name: string }; index: number }) => (
        <MediaItem
            item={item}
            onPress={toggleHeader}
            isVisible={currentIndex === index}
            isNearby={Math.abs(currentIndex - index) <= 1}
        />
    );

    if (!media || media.length === 0) return null;

    return (
        <Modal
            visible={visible}
            onRequestClose={onClose}
            animationType="fade"
            transparent={false}
            statusBarTranslucent={true}
        >
            <View style={styles.container}>
                <StatusBar
                    barStyle="light-content"
                    backgroundColor="transparent"
                    translucent={true}
                    hidden={!headerVisible && visible}
                />

                {headerVisible && (
                    <View style={styles.header}>
                        <Pressable onPress={onClose} style={styles.backButton}>
                            <LucideIcon icon={X} color="#fff" size={24} />
                        </Pressable>
                        <View style={styles.titleContainer}>
                            <Text variant="titleMedium" style={styles.title} numberOfLines={1}>
                                {media[currentIndex]?.name}
                            </Text>
                            <Text variant="labelSmall" style={styles.subtitle}>
                                {currentIndex + 1} of {media.length}
                            </Text>
                        </View>
                        <View style={{ width: 40 }} />
                    </View>
                )}

                <FlatList
                    ref={flatListRef}
                    data={media}
                    renderItem={renderItem}
                    horizontal
                    pagingEnabled
                    keyExtractor={(item) => item.path}
                    getItemLayout={(_, index) => ({
                        length: width,
                        offset: width * index,
                        index,
                    })}
                    initialScrollIndex={initialIndex}
                    onViewableItemsChanged={onViewableItemsChanged}
                    viewabilityConfig={viewabilityConfig}
                    showsHorizontalScrollIndicator={false}
                    showsVerticalScrollIndicator={false}
                    overScrollMode="never"
                    bounces={false}
                    removeClippedSubviews={Platform.OS === 'android'}
                    scrollEventThrottle={16}
                    windowSize={3}
                    initialNumToRender={1}
                    maxToRenderPerBatch={1}
                />

                {headerVisible && (
                    <View style={styles.footer}>

                        <Pressable
                            onPress={handleShare}
                            style={[styles.footerButton, sharing && { opacity: 0.7 }]}
                            disabled={sharing}
                        >
                            {sharing ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <LucideIcon icon={Share2} color="#fff" size={20} />
                            )}
                            <Text style={styles.footerButtonText}>
                                {sharing ? 'Preparing...' : 'Share'}
                            </Text>
                        </Pressable>
                        <Pressable
                            onPress={handleDownload}
                            style={[styles.footerButton, downloading && { opacity: 0.7 }]}
                            disabled={downloading}
                        >
                            {downloading ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <LucideIcon icon={Download} color="#fff" size={20} />
                            )}
                            <Text style={styles.footerButtonText}>
                                {downloading ? 'Downloading...' : 'Download'}
                            </Text>
                        </Pressable>

                    </View>
                )}
            </View>
        </Modal>
    );
}

function MediaItem({ item, onPress, isVisible, isNearby }: { item: { path: string; name: string }; onPress: () => void; isVisible: boolean; isNearby: boolean }) {
    const theme = useTheme();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [playing, setPlaying] = useState(true);
    const videoRef = useRef<VideoRef>(null);

    const ext = item.name.split('.').pop()?.toLowerCase() || '';
    const isVideo = ['mp4', 'm4v', 'mov', 'mkv', 'webm'].includes(ext);

    useEffect(() => {
        if (!isVisible) {
            setPlaying(false);
        } else {
            setPlaying(true);
        }
    }, [isVisible]);

    const handlePress = () => {
        if (isVideo) {
            setPlaying(!playing);
        }
        onPress();
    };

    return (
        <Pressable style={styles.mediaContainer} onPress={handlePress}>
            {loading && (
                <ActivityIndicator size="large" color={theme.colors.primary} style={styles.loader} />
            )}
            {error ? (
                <View style={styles.errorContainer}>
                    <LucideIcon icon={X} color="#fff" size={48} />
                    <Text style={{ color: '#fff', marginTop: 16 }}>Failed to load media</Text>
                </View>
            ) : isVideo ? (
                <View style={styles.videoWrapper}>
                    {isNearby ? (
                        <Video
                            ref={videoRef}
                            source={{ uri: item.path }}
                            style={styles.video}
                            resizeMode="contain"
                            paused={!playing || !isVisible}
                            repeat={true}
                            controls={true}
                            onLoad={() => setLoading(false)}
                            onBuffer={({ isBuffering }) => setLoading(isBuffering)}
                            onError={() => {
                                setLoading(false);
                                setError(true);
                            }}
                        />
                    ) : (
                        <View style={styles.videoPlaceholder} />
                    )}
                </View>
            ) : (
                <Image
                    source={{ uri: item.path }}
                    style={styles.image}
                    resizeMode="contain"
                    onLoadStart={() => {
                        setLoading(true);
                        setError(false);
                    }}
                    onLoadEnd={() => setLoading(false)}
                    onError={(err) => {
                        setLoading(false);
                        setError(true);
                    }}
                />
            )}
        </Pressable>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    header: {
        height: 100,
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 44,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        zIndex: 10,
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
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
    mediaContainer: {
        width: width,
        height: height,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 110,
    },
    image: {
        width: '100%',
        height: '100%',
    },
    videoWrapper: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    video: {
        width: '100%',
        height: '100%',
    },
    playOverlay: {
        position: 'absolute',
        backgroundColor: 'rgba(0,0,0,0.3)',
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
    },
    videoPlaceholder: {
        width: width,
        height: height,
        backgroundColor: '#000',
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 100,
        backgroundColor: 'rgba(0,0,0,0.6)',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingBottom: Platform.OS === 'ios' ? 30 : 20,
        gap: 16,
        paddingHorizontal: 16,
        zIndex: 10,
    },
    footerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.15)',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 24,
        gap: 8,
        flex: 1,
        maxWidth: 180,
        justifyContent: 'center',
    },
    footerButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
    },
    loader: {
        position: 'absolute',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
});

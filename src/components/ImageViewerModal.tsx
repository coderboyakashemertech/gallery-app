import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, Image, Dimensions, ActivityIndicator, Pressable, FlatList, ViewToken, StatusBar, Platform, Modal, Alert } from 'react-native';
import { Portal, Text, useTheme } from 'react-native-paper';
import { LucideIcon } from './LucideIcon';
import { X, Share2 } from 'lucide-react-native';
import Share from 'react-native-share';
import ReactNativeBlobUtil from 'react-native-blob-util';
import { DirectoryFile } from '../types/folders';

const { width, height } = Dimensions.get('window');

type Props = {
    visible: boolean;
    onClose: () => void;
    images: { path: string; name: string }[];
    initialIndex: number;
};

export function ImageViewerModal({ visible, onClose, images, initialIndex }: Props) {
    const theme = useTheme();
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [headerVisible, setHeaderVisible] = useState(true);
    const [sharing, setSharing] = useState(false);
    const flatListRef = useRef<FlatList>(null);

    useEffect(() => {
        if (visible) {
            setCurrentIndex(initialIndex);
            setHeaderVisible(true);
        }
    }, [visible, initialIndex]);

    const toggleHeader = () => setHeaderVisible((prev: boolean) => !prev);

    const handleShare = async () => {
        const currentImage = images[currentIndex];
        if (!currentImage || sharing) return;

        setSharing(true);
        const fileName = currentImage.name || 'image.jpg';
        const fileExt = fileName.split('.').pop() || 'jpg';
        const tempPath = `${ReactNativeBlobUtil.fs.dirs.CacheDir}/share_${Date.now()}.${fileExt}`;

        try {
            // Download the file
            const res = await ReactNativeBlobUtil
                .config({ path: tempPath })
                .fetch('GET', currentImage.path);

            const localFilePath = res.path();

            // Share the local file
            await Share.open({
                url: `file://${localFilePath}`,
                type: `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`,
                title: currentImage.name,
                message: currentImage.name,
            });

            // Cleanup
            setTimeout(() => {
                ReactNativeBlobUtil.fs.unlink(localFilePath).catch(e => console.log('Cleanup error:', e));
            }, 1000);

        } catch (error: any) {
            if (error?.message !== 'User did not share') {
                console.error('Error sharing image:', error);
                Alert.alert('Share Error', 'Could not prepare image for sharing.');
            }
        } finally {
            setSharing(false);
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

    const renderItem = ({ item }: { item: { path: string; name: string } }) => (
        <ImageItem image={item} onPress={toggleHeader} />
    );

    if (!images || images.length === 0) return null;

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
                                {images[currentIndex]?.name}
                            </Text>
                            <Text variant="labelSmall" style={styles.subtitle}>
                                {currentIndex + 1} of {images.length}
                            </Text>
                        </View>
                        <View style={{ width: 40 }} />
                    </View>
                )}

                <FlatList
                    ref={flatListRef}
                    data={images}
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
                    removeClippedSubviews={true}
                    scrollEventThrottle={16}
                />

                {headerVisible && (
                    <View style={styles.footer}>
                        <Pressable
                            onPress={handleShare}
                            style={[styles.shareButton, sharing && { opacity: 0.7 }]}
                            disabled={sharing}
                        >
                            {sharing ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <LucideIcon icon={Share2} color="#fff" size={20} />
                            )}
                            <Text style={styles.shareText}>
                                {sharing ? 'Preparing...' : 'Share Image'}
                            </Text>
                        </Pressable>
                    </View>
                )}
            </View>
        </Modal>
    );
}

function ImageItem({ image, onPress }: { image: { path: string; name: string }; onPress: () => void }) {
    const theme = useTheme();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    return (
        <Pressable style={styles.imageContainer} onPress={onPress}>
            {loading && (
                <ActivityIndicator size="large" color={theme.colors.primary} style={styles.loader} />
            )}
            {error ? (
                <View style={styles.errorContainer}>
                    <Text style={{ color: '#fff' }}>Failed to load image</Text>
                </View>
            ) : (
                <Image
                    source={{ uri: image.path }}
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
    imageContainer: {
        width: width,
        height: height,
        justifyContent: 'center',
        alignItems: 'center',
    },
    image: {
        width: width,
        height: height,
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
        zIndex: 10,
    },
    shareButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.15)',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 24,
        gap: 8,
    },
    shareText: {
        color: '#fff',
        fontWeight: '600',
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

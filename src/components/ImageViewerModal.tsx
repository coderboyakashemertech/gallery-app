import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, Image, Dimensions, ActivityIndicator, Pressable, FlatList, ViewToken } from 'react-native';
import { Modal, Portal, Text, useTheme } from 'react-native-paper';
import { LucideIcon } from './LucideIcon';
import { X } from 'lucide-react-native';
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
    const flatListRef = useRef<FlatList>(null);

    useEffect(() => {
        if (visible) {
            setCurrentIndex(initialIndex);
            setHeaderVisible(true);
        }
    }, [visible, initialIndex]);

    const toggleHeader = () => setHeaderVisible(prev => !prev);

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
        <Portal>
            <Modal
                visible={visible}
                onDismiss={onClose}
                contentContainerStyle={styles.modal}
            >
                <View style={styles.container}>
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
                    />
                </View>
            </Modal>
        </Portal>
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
    modal: {
        flex: 1,
        margin: 0,
        backgroundColor: '#000',
    },
    container: {
        flex: 1,
    },
    header: {
        height: 60,
        paddingTop: 10,
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

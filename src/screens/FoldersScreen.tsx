import {
    ChevronRight,
    File as FileIcon,
    Folder as FolderIcon,
    HardDrive,
    RefreshCcw,
    Image as ImageIcon,
    Film,
    Music,
    FileText,
    FileArchive,
    FileCode,
    FileQuestion
} from 'lucide-react-native';
import React, { useEffect, useMemo, useRef } from 'react';
import {
    Pressable,
    ScrollView,
    StyleSheet,
    View,
    Linking,
    Alert,
    FlatList,
    ListRenderItem,
    Dimensions,
    Platform
} from 'react-native';
import { ActivityIndicator, Card, IconButton, Surface, Text, useTheme } from 'react-native-paper';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { DrawerNavigationProp } from '@react-navigation/drawer';

import { LucideIcon } from '../components/LucideIcon';
import { Screen } from '../components/Screen';
import { LoadingOverlay } from '../components/LoadingOverlay';
import { MediaViewerModal } from '../components/MediaViewerModal';
import ReactNativeBlobUtil from 'react-native-blob-util';
import { useListDirectoryQuery } from '../store/authApi';
import { API_BASE_URL } from '../config/api';
import { RootDrawerParamList, FoldersStackParamList } from '../navigation/DrawerNavigator';
import { DirectoryFile, DirectoryFolder } from '../types/folders';

const FolderItem = React.memo(({ folder, onPress }: { folder: DirectoryFolder; onPress: () => void }) => {
    const theme = useTheme();

    return (
        <Card
            mode="contained"
            style={[
                styles.card,
                { backgroundColor: theme.colors.surfaceVariant, opacity: 0.8 },
                {
                    backgroundColor: theme.dark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.08)',
                    borderLeftWidth: 4,
                    borderLeftColor: '#3b82f6'
                }
            ]}
            onPress={onPress}
        >
            <Card.Content style={styles.cardContent}>
                <View style={styles.itemInfoContainer}>
                    <LucideIcon icon={FolderIcon} color={theme.colors.primary} size={28} />
                    <Text variant="bodyLarge" style={[styles.itemName, { color: theme.dark ? '#93c5fd' : '#1e40af' }]} numberOfLines={1}>{folder.name}</Text>
                </View>
                <ChevronRight size={28} color={theme.colors.onSurfaceVariant} />
            </Card.Content>
        </Card>
    );
});

const getFileIcon = (extension: string | null) => {
    const ext = extension?.toLowerCase();

    if (!ext) return { icon: FileIcon, color: '#94a3b8' }; // Default gray

    // Images
    if (['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp'].includes(ext)) {
        return { icon: ImageIcon, color: '#f59e0b' }; // Amber
    }

    // Videos
    if (['.mp4', '.mkv', '.mov', '.avi', '.wmv', '.webm'].includes(ext)) {
        return { icon: Film, color: '#ef4444' }; // Red
    }

    // Audio
    if (['.mp3', '.wav', '.ogg', '.m4a', '.flac'].includes(ext)) {
        return { icon: Music, color: '#8b5cf6' }; // Violet
    }

    // Documents
    if (['.pdf', '.doc', '.docx', '.txt', '.rtf', '.odt'].includes(ext)) {
        return { icon: FileText, color: '#3b82f6' }; // Blue
    }

    // Archives
    if (['.zip', '.rar', '.7z', '.tar', '.gz'].includes(ext)) {
        return { icon: FileArchive, color: '#10b981' }; // Emerald
    }

    // Code
    if (['.js', '.ts', '.tsx', '.jsx', '.html', '.css', '.json', '.sh', '.py'].includes(ext)) {
        return { icon: FileCode, color: '#ec4899' }; // Pink
    }

    return { icon: FileQuestion, color: '#64748b' }; // Slate
};

const FileItem = React.memo(({ file, onPress }: { file: DirectoryFile; onPress: () => void }) => {
    const theme = useTheme();

    const formatSize = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const fileInfo = getFileIcon(file.extension);
    const ext = file.extension?.toLowerCase() || '';
    const isVideo = ['.mp4', '.mkv', '.mov', '.avi', '.wmv', '.webm', '.m4v'].includes(ext);
    const isImage = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp'].includes(ext);

    return (
        <Card
            mode="contained"
            style={[
                styles.card,
                { backgroundColor: theme.colors.surfaceVariant, opacity: 0.8 },
                isVideo && {
                    backgroundColor: theme.dark ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.08)',
                    borderLeftWidth: 4,
                    borderLeftColor: '#ef4444'
                },
                isImage && {
                    backgroundColor: theme.dark ? 'rgba(245, 158, 11, 0.15)' : 'rgba(245, 158, 11, 0.08)',
                    borderLeftWidth: 4,
                    borderLeftColor: '#f59e0b'
                }
            ]}
            onPress={onPress}
        >
            <Card.Content style={styles.cardContent}>
                <View style={styles.itemInfoContainer}>
                    <LucideIcon icon={fileInfo.icon} color={fileInfo.color} size={28} />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text
                            variant="bodyLarge"
                            style={[
                                styles.itemName,
                                { marginLeft: 0 },
                                isVideo && { color: theme.dark ? '#fca5a5' : '#b91c1c' },
                                isImage && { color: theme.dark ? '#fcd34d' : '#92400e' }
                            ]}
                            numberOfLines={1}
                        >
                            {file.name}
                        </Text>
                        <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, textTransform: 'uppercase' }}>
                            {formatSize(file.size)} {file.extension ? `  ${file.extension.replace('.', '')}` : ''}
                        </Text>
                    </View>
                </View>
            </Card.Content>
        </Card>
    );
});

export function FoldersScreen() {
    const theme = useTheme();
    const breadcrumbScrollViewRef = useRef<ScrollView>(null);
    const route = useRoute<RouteProp<FoldersStackParamList, 'Folders'>>();
    const navigation = useNavigation<NativeStackNavigationProp<FoldersStackParamList>>();

    const [viewerVisible, setViewerVisible] = React.useState(false);
    const [mediaList, setMediaList] = React.useState<{ path: string; name: string }[]>([]);
    const [selectedMediaIndex, setSelectedMediaIndex] = React.useState(0);
    const [preparingFile, setPreparingFile] = React.useState(false);

    const path = route.params?.path || '';
    const folderName = route.params?.name || 'Root';

    const { data, isLoading, refetch, isFetching } = useListDirectoryQuery({ path }, { skip: !path });

    const breadcrumbs = useMemo(() => {
        if (!path) return [];

        // This is a bit tricky with local paths, but we can try to split by /
        const parts = decodeURIComponent(path).split('/').filter(Boolean);
        let currentPath = '';

        // For linux paths starting with / we need to handle the first part
        const isAbsolute = path.startsWith('%2F') || path.startsWith('/');

        return parts.map((part, index) => {
            currentPath += (index === 0 && isAbsolute ? '/' : '/') + part;
            return {
                name: part,
                path: encodeURIComponent(currentPath)
            };
        });
    }, [path]);

    useEffect(() => {
        breadcrumbScrollViewRef.current?.scrollToEnd({ animated: true });
    }, [breadcrumbs]);

    const handleFolderPress = (folder: DirectoryFolder) => {
        navigation.push('Folders', { path: folder.path, name: folder.name });
    };

    const handleFilePress = async (file: DirectoryFile) => {
        const ext = file.extension?.toLowerCase() || '';
        const isImage = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp'].includes(ext);
        const isVideo = ['.mp4', '.m4v', '.mov', '.mkv', '.webm'].includes(ext);

        if (isImage || isVideo) {
            const media = (data?.files || [])
                .filter(f => {
                    const fExt = f.extension?.toLowerCase() || '';
                    return ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.mp4', '.m4v', '.mov', '.mkv', '.webm'].includes(fExt);
                })
                .map(f => ({ path: f.url, name: f.name }));

            const index = media.findIndex(m => m.path === file.url);

            setMediaList(media);
            setSelectedMediaIndex(index >= 0 ? index : 0);
            setViewerVisible(true);
            return;
        }

        // For non-media files, download to cache and open with system app
        setPreparingFile(true);
        const fileName = file.name;
        const tempPath = `${ReactNativeBlobUtil.fs.dirs.CacheDir}/${fileName}`;

        try {
            const res = await ReactNativeBlobUtil
                .config({
                    path: tempPath,
                    fileCache: true,
                })
                .fetch('GET', file.url);

            const localPath = res.path();

            if (Platform.OS === 'android') {
                // Get MIME type based on extension
                const mimeType = getMimeType(ext);
                await ReactNativeBlobUtil.android.actionViewIntent(localPath, mimeType);
            } else {
                await ReactNativeBlobUtil.ios.openDocument(localPath);
            }
        } catch (error) {
            console.error('Error opening file:', error);
            Alert.alert('Error', 'Could not open this file with any supported application.');
        } finally {
            setPreparingFile(false);
        }
    };

    const getMimeType = (ext: string) => {
        const mimeTypes: { [key: string]: string } = {
            '.pdf': 'application/pdf',
            '.doc': 'application/msword',
            '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            '.xls': 'application/vnd.ms-excel',
            '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            '.ppt': 'application/vnd.ms-powerpoint',
            '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            '.txt': 'text/plain',
            '.zip': 'application/zip',
            '.rar': 'application/x-rar-compressed',
            '.apk': 'application/vnd.android.package-archive',
        };
        return mimeTypes[ext] || '*/*';
    };

    const combinedData = useMemo(() => {
        if (!data) return [];
        return [
            ...data.folders.map(f => ({ ...f, id: `folder-${f.path}` })),
            ...data.files.map(f => ({ ...f, id: `file-${f.path}` }))
        ];
    }, [data]);

    const renderItem: ListRenderItem<any> = ({ item }) => {
        if (item.type === 'directory') {
            return <FolderItem folder={item} onPress={() => handleFolderPress(item)} />;
        }
        return <FileItem file={item} onPress={() => handleFilePress(item)} />;
    };

    const ITEM_HEIGHT = 64; // Approximate height of each item (card + gap)
    const getItemLayout = (_: any, index: number) => ({
        length: ITEM_HEIGHT,
        offset: ITEM_HEIGHT * index,
        index,
    });

    return (
        <Screen style={{ backgroundColor: theme.colors.background }} scrollable={false} noPadding>
            <View style={styles.header}>
                <ScrollView
                    ref={breadcrumbScrollViewRef}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.breadcrumbContainer}

                >
                    <Pressable onPress={() => navigation.getParent()?.navigate('Home')}>
                        <Text variant="labelLarge" style={{ color: theme.colors.primary }}>Drives</Text>
                    </Pressable>
                    {breadcrumbs.map((crumb, index) => (
                        <View key={crumb.path} style={styles.breadcrumbItem}>
                            <ChevronRight size={14} color={theme.colors.onSurfaceVariant} />
                            <Pressable onPress={() => navigation.push('Folders', { path: crumb.path, name: crumb.name })}>
                                <Text
                                    variant="labelLarge"
                                    style={{
                                        color: index === breadcrumbs.length - 1 ? theme.colors.onSurface : theme.colors.primary,
                                        fontWeight: index === breadcrumbs.length - 1 ? '700' : '400',
                                        textTransform: 'capitalize',
                                        fontSize: 16,
                                    }}
                                >
                                    {crumb.name}
                                </Text>
                            </Pressable>
                        </View>
                    ))}
                </ScrollView>
                <IconButton
                    icon={({ size }) => <LucideIcon icon={RefreshCcw} size={size} color={theme.colors.primary} />}
                    onPress={refetch}
                    disabled={isFetching || !path}
                />
            </View>

            <LoadingOverlay visible={isLoading || isFetching} message="Browsing..." />
            <LoadingOverlay visible={preparingFile} message="Preparing file..." />

            {!path ? (
                <View style={styles.centerContent}>
                    <LucideIcon icon={HardDrive} size={48} color={theme.colors.onSurfaceVariant} />
                    <Text variant="bodyLarge" style={styles.infoText}>Select a drive from the Home screen to start browsing.</Text>
                </View>
            ) : (
                <FlatList
                    data={combinedData}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.list}
                    getItemLayout={getItemLayout}
                    initialNumToRender={15}
                    maxToRenderPerBatch={10}
                    windowSize={5}
                    removeClippedSubviews={true}
                    ListEmptyComponent={!isLoading ? (
                        <View style={styles.centerContent}>
                            <Text variant="bodyMedium" style={{ opacity: 0.6 }}>This folder is empty.</Text>
                        </View>
                    ) : null}
                />
            )}

            <MediaViewerModal
                visible={viewerVisible}
                onClose={() => setViewerVisible(false)}
                media={mediaList}
                initialIndex={selectedMediaIndex}
            />
        </Screen>
    );
}

const styles = StyleSheet.create({
    header: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    breadcrumbContainer: {
        alignItems: 'center',
        paddingRight: 16,
    },
    breadcrumbItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginLeft: 4,
    },
    content: {
        flex: 1,
    },
    list: {
        padding: 12,
        gap: 8,
    },
    card: {
        borderRadius: 12,
    },
    cardContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 24,
        paddingHorizontal: 16,
    },
    itemInfoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    itemName: {
        marginLeft: 12,
        fontWeight: '500',
        fontSize: 18,
    },
    centerContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 100,
        paddingHorizontal: 40,
        gap: 16,
    },
    infoText: {
        textAlign: 'center',
        opacity: 0.6,
    },
});

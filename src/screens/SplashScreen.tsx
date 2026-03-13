import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { HardDrive } from 'lucide-react-native';

import { LucideIcon } from '../components/LucideIcon';

export function SplashScreen() {
    const theme = useTheme();

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <View style={styles.content}>
                <View style={[styles.iconContainer, { backgroundColor: theme.colors.primaryContainer }]}>
                    <LucideIcon icon={HardDrive} size={64} color={theme.colors.primary} />
                </View>
                <Text variant="headlineMedium" style={[styles.title, { color: theme.colors.primary }]}>
                    Gallery
                </Text>
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                    Your media, organized.
                </Text>
            </View>
            <ActivityIndicator size="large" color={theme.colors.primary} style={styles.loader} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    content: {
        alignItems: 'center',
        gap: 16,
    },
    iconContainer: {
        padding: 24,
        borderRadius: 32,
    },
    title: {
        fontWeight: '800',
        letterSpacing: 1,
    },
    loader: {
        position: 'absolute',
        bottom: 100,
    },
});

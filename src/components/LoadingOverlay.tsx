import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ActivityIndicator, Modal, Portal, Text, useTheme } from 'react-native-paper';

type Props = {
    visible: boolean;
    message?: string;
};

export const LoadingOverlay = React.memo(({ visible, message = 'Loading...' }: Props) => {
    const theme = useTheme();

    return (
        <Portal>
            <Modal
                visible={visible}
                dismissable={false}
                contentContainerStyle={styles.modal}
            >
                <View style={[styles.container, { backgroundColor: theme.colors.elevation.level3 }]}>
                    <ActivityIndicator animating={true} color={theme.colors.primary} size="large" />
                    {message && (
                        <Text variant="bodyLarge" style={[styles.message, { color: theme.colors.onSurface }]}>
                            {message}
                        </Text>
                    )}
                </View>
            </Modal>
        </Portal>
    );
});

const styles = StyleSheet.create({
    modal: {
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    container: {
        padding: 32,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 160,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    message: {
        marginTop: 20,
        textAlign: 'center',
        fontWeight: '600',
        letterSpacing: 0.5,
    },
});

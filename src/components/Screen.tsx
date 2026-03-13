import type { ReactNode } from 'react';
import React from 'react';
import { ScrollView, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { Edge, SafeAreaView } from 'react-native-safe-area-context';

type Props = {
  children: ReactNode;
  scrollable?: boolean;
  style?: StyleProp<ViewStyle>;
  noPadding?: boolean;
  edges?: Edge[];
};

export function Screen({
  children,
  scrollable = true,
  style,
  noPadding = false,
  edges = ['bottom', 'left', 'right']
}: Props) {
  const contentStyle = [styles.content, noPadding && styles.noPadding];

  const content = scrollable ? (
    <ScrollView
      contentContainerStyle={contentStyle}
      keyboardShouldPersistTaps="handled">
      {children}
    </ScrollView>
  ) : (
    <View style={contentStyle}>{children}</View>
  );

  return <SafeAreaView style={[styles.safeArea, style]} edges={edges}>{content}</SafeAreaView>;
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    gap: 16,
    padding: 20,
  },
  noPadding: {
    padding: 0,
    gap: 0,
  },
});

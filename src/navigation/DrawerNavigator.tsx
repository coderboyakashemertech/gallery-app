import {
  DrawerActions,
  NavigationContainer,
  DefaultTheme as NavigationTheme,
} from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { Compass, House, Image as ImageIcon, Menu } from 'lucide-react-native';
import React from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { LucideIcon } from '../components/LucideIcon';
import { HomeScreen } from '../screens/HomeScreen';
import { CollectionScreen } from '../screens/CollectionScreen';
import { ExploreScreen } from '../screens/ExploreScreen';
import { appTheme } from '../theme';

export type RootDrawerParamList = {
  Home: undefined;
  Collections: undefined;
  Explore: undefined;
};

const Drawer = createDrawerNavigator<RootDrawerParamList>();

function HomeDrawerIcon({ color, size }: { color: string; size: number }) {
  return <LucideIcon icon={House} color={color} size={size} />;
}

function CollectionsDrawerIcon({
  color,
  size,
}: {
  color: string;
  size: number;
}) {
  return <LucideIcon icon={ImageIcon} color={color} size={size} />;
}

function ExploreDrawerIcon({ color, size }: { color: string; size: number }) {
  return <LucideIcon icon={Compass} color={color} size={size} />;
}

function HeaderMenuButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      accessibilityLabel="Open navigation menu"
      accessibilityRole="button"
      hitSlop={12}
      onPress={onPress}
      style={styles.headerButton}>
      <LucideIcon icon={Menu} color={appTheme.colors.onSurface} size={22} />
    </Pressable>
  );
}

function renderHeaderLeft(onPress: () => void) {
  return function HeaderLeft() {
    return <HeaderMenuButton onPress={onPress} />;
  };
}

const navigationTheme = {
  ...NavigationTheme,
  colors: {
    ...NavigationTheme.colors,
    background: appTheme.colors.background,
    card: appTheme.colors.surface,
    primary: appTheme.colors.primary,
    text: appTheme.colors.onSurface,
    border: appTheme.colors.outline,
  },
};

export function DrawerNavigator() {
  return (
    <NavigationContainer theme={navigationTheme}>
      <Drawer.Navigator
        initialRouteName="Home"
        screenOptions={({ navigation }) => ({
          headerStyle: {
            backgroundColor: appTheme.colors.surface,
          },
          headerTintColor: appTheme.colors.onSurface,
          headerLeft: renderHeaderLeft(() =>
            navigation.dispatch(DrawerActions.toggleDrawer()),
          ),
          sceneStyle: {
            backgroundColor: appTheme.colors.background,
          },
          drawerActiveTintColor: appTheme.colors.primary,
          drawerInactiveTintColor: appTheme.colors.onSurfaceVariant,
          drawerActiveBackgroundColor: appTheme.colors.primaryContainer,
          drawerStyle: {
            backgroundColor: appTheme.colors.surface,
          },
        })}>
        <Drawer.Screen
          name="Home"
          component={HomeScreen}
          options={{
            title: 'Home',
            drawerIcon: HomeDrawerIcon,
          }}
        />
        <Drawer.Screen
          name="Collections"
          component={CollectionScreen}
          options={{
            title: 'Collections',
            drawerIcon: CollectionsDrawerIcon,
          }}
        />
        <Drawer.Screen
          name="Explore"
          component={ExploreScreen}
          options={{
            title: 'Explore',
            drawerIcon: ExploreDrawerIcon,
          }}
        />
      </Drawer.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  headerButton: {
    marginLeft: 16,
    padding: 4,
  },
});

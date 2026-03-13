import { DrawerActions } from '@react-navigation/native';
import {
  DrawerContentComponentProps,
  DrawerContentScrollView,
  DrawerItemList,
  createDrawerNavigator,
} from '@react-navigation/drawer';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { CircleUserRound, FolderOpen, House, LogOut, Menu, MoonStar, Settings } from 'lucide-react-native';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Avatar, Divider, Switch, Text, useTheme } from 'react-native-paper';

import { LucideIcon } from '../components/LucideIcon';
import { FoldersScreen } from '../screens/FoldersScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { authApi } from '../store/authApi';
import { logout } from '../store/authSlice';
import { useAppDispatch, useAppSelector } from '../store';
import { toggleDarkMode } from '../store/preferencesSlice';

export type RootDrawerParamList = {
  Home: undefined;
  FoldersStack: { screen?: string; params?: { path?: string; name?: string } };
  Settings: undefined;
};

export type FoldersStackParamList = {
  Folders: { path?: string; name?: string };
};

const Drawer = createDrawerNavigator<RootDrawerParamList>();

function HomeDrawerIcon({ color, size }: { color: string; size: number }) {
  return <LucideIcon icon={House} color={color} size={size} />;
}

function FoldersDrawerIcon({ color, size }: { color: string; size: number }) {
  return <LucideIcon icon={FolderOpen} color={color} size={size} />;
}

function SettingsDrawerIcon({ color, size }: { color: string; size: number }) {
  return <LucideIcon icon={Settings} color={color} size={size} />;
}

const Stack = createNativeStackNavigator<FoldersStackParamList>();

function FoldersStackNavigator() {
  const theme = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.colors.background }
      }}
    >
      <Stack.Screen name="Folders" component={FoldersScreen} />
    </Stack.Navigator>
  );
}

function HeaderMenuButton({ onPress }: { onPress: () => void }) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityLabel="Open navigation menu"
      accessibilityRole="button"
      hitSlop={12}
      onPress={onPress}
      style={styles.headerButton}>
      <LucideIcon icon={Menu} color={theme.colors.onSurface} size={24} />
    </Pressable>
  );
}

function HeaderRight() {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const user = useAppSelector(state => state.auth.user);

  const onLogout = () => {
    dispatch(logout());
    dispatch(authApi.util.resetApiState());
  };

  return (
    <View style={styles.headerRight}>
      <Pressable
        onPress={onLogout}
        style={({ pressed }) => [
          styles.logoutButton,
          { opacity: pressed ? 0.6 : 1 }
        ]}>
        <LucideIcon icon={LogOut} color={theme.colors.onSurfaceVariant} size={20} />
      </Pressable>
      <Avatar.Text
        size={36}
        label={user?.name?.substring(0, 2).toUpperCase() ?? 'U'}
        style={{ backgroundColor: theme.colors.primaryContainer }}
        labelStyle={{ color: theme.colors.primary, fontWeight: '700', fontSize: 12 }}
      />
    </View>
  );
}

function CustomDrawerContent(props: DrawerContentComponentProps) {
  const user = useAppSelector(state => state.auth.user);
  const theme = useTheme();

  return (
    <DrawerContentScrollView
      {...props}
      contentContainerStyle={styles.drawerContentContainer}>
      <View style={styles.drawerHeader}>
        <Avatar.Icon
          size={64}
          icon={({ size, color }) => <LucideIcon icon={CircleUserRound} size={size} color={color} />}
          style={{ backgroundColor: 'transparent' }}
          color={theme.colors.primary}
        />
        <Text variant="headlineSmall" style={{ fontWeight: '800' }}>{user?.name ?? 'Gallery Manager'}</Text>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          {user?.username ? `@${user.username}` : 'Signed in'}
        </Text>
      </View>
      <Divider style={styles.drawerDivider} />
      <View style={{ marginTop: 16 }}>
        <DrawerItemList {...props} />
      </View>
    </DrawerContentScrollView>
  );
}

export function DrawerNavigator() {
  const theme = useTheme();

  return (
    <Drawer.Navigator
      initialRouteName="Home"
      drawerContent={CustomDrawerContent}
      screenOptions={({ navigation }) => ({
        headerStyle: {
          backgroundColor: theme.colors.background,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 16,
          letterSpacing: 0.2,
          color: theme.colors.onSurface,
        },
        headerTintColor: theme.colors.onSurface,
        headerLeft: () => <HeaderMenuButton onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())} />,
        headerRight: () => <HeaderRight />,
        sceneStyle: {
          backgroundColor: theme.colors.background,
        },
        drawerActiveTintColor: theme.colors.primary,
        drawerInactiveTintColor: theme.colors.onSurfaceVariant,
        drawerActiveBackgroundColor: theme.colors.primaryContainer,
        drawerItemStyle: {
          borderRadius: 12,
          marginVertical: 4,
          marginHorizontal: 12,
        },
        drawerStyle: {
          backgroundColor: theme.colors.surface,
          width: 300,
        },
      })}>
      <Drawer.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'Home',
          drawerLabel: 'Home',
          drawerIcon: HomeDrawerIcon,
        }}
      />
      <Drawer.Screen
        name="FoldersStack"
        component={FoldersStackNavigator}
        options={{
          title: 'Folders',
          drawerLabel: 'Folders',
          drawerIcon: FoldersDrawerIcon,
        }}
      />
      <Drawer.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: 'SETTINGS',
          drawerIcon: SettingsDrawerIcon,
        }}
      />
    </Drawer.Navigator>
  );
}

const styles = StyleSheet.create({
  drawerContentContainer: {
    flexGrow: 1,
  },
  drawerHeader: {
    gap: 2,
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  drawerDivider: {
    marginHorizontal: 16,
    marginTop: 8,
  },
  headerButton: {
    marginLeft: 12,
    padding: 8,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    gap: 12,
  },
  logoutButton: {
    padding: 8,
    borderRadius: 20,
  },
  actionLabel: {
    flex: 1,
    marginLeft: 12,
  },
  actionRow: {
    alignItems: 'center',
    borderRadius: 18,
    flexDirection: 'row',
    margin: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
});

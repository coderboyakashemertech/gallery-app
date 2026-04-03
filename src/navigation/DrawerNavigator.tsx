import { DrawerActions } from '@react-navigation/native';
import {
  DrawerContentComponentProps,
  DrawerContentScrollView,
  createDrawerNavigator,
} from '@react-navigation/drawer';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  ChevronDown,
  ChevronUp,
  CircleHelp,
  Folder,
  HardDrive,
  House,
  Image as ImageIcon,
  LogOut,
  Menu,
  Pin,
  Settings,
  Sparkles,
  Star,
  Trash2,
} from 'lucide-react-native';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Avatar, Divider, Text, useTheme } from 'react-native-paper';

import { LucideIcon } from '../components/LucideIcon';
import { FoldersScreen } from '../screens/FoldersScreen';
import { AlbumsScreen } from '../screens/AlbumsScreen';
import { FavoritesScreen } from '../screens/FavoritesScreen';
import {
  GalleryFoldersScreen,
  GalleryImagesScreen,
} from '../screens/gallery';
import { HomeScreen } from '../screens/HomeScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import {
  authApi,
  useGetDrivesQuery,
  useGetRecycleBinQuery,
} from '../store/authApi';
import { logout } from '../store/authSlice';
import { useAppDispatch, useAppSelector } from '../store';
import type { Folder as GalleryFolder } from '../types/folders';

export type FoldersRouteParams = {
  path?: string;
  name?: string;
  view?: 'favorites';
};

export type RootDrawerParamList = {
  Home: undefined;
  Favorites: undefined;
  Albums: undefined;
  Gallery: undefined;
  FoldersStack: { screen?: string; params?: FoldersRouteParams };
  Settings: undefined;
};

export type FoldersStackParamList = {
  Folders: FoldersRouteParams;
};

export type GalleryStackParamList = {
  GalleryFolders: undefined;
  GalleryImages: { folder: GalleryFolder };
};

const Drawer = createDrawerNavigator<RootDrawerParamList>();
const GalleryStack = createNativeStackNavigator<GalleryStackParamList>();

function HomeDrawerIcon({ color, size }: { color: string; size: number }) {
  return <LucideIcon icon={House} color={color} size={size} />;
}

function FoldersDrawerIcon({ color, size }: { color: string; size: number }) {
  return <LucideIcon icon={Folder} color={color} size={size} />;
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
        contentStyle: { backgroundColor: theme.colors.background },
      }}
    >
      <Stack.Screen name="Folders" component={FoldersScreen} />
    </Stack.Navigator>
  );
}

function GalleryStackNavigator() {
  const theme = useTheme();

  return (
    <GalleryStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.colors.background },
      }}
    >
      <GalleryStack.Screen
        name="GalleryFolders"
        component={GalleryFoldersScreen}
      />
      <GalleryStack.Screen
        name="GalleryImages"
        component={GalleryImagesScreen}
      />
    </GalleryStack.Navigator>
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
      style={styles.headerButton}
    >
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
          { opacity: pressed ? 0.6 : 1 },
        ]}
      >
        <LucideIcon
          icon={LogOut}
          color={theme.colors.onSurfaceVariant}
          size={20}
        />
      </Pressable>
      <Avatar.Text
        size={36}
        label={user?.name?.substring(0, 2).toUpperCase() ?? 'U'}
        style={{ backgroundColor: theme.colors.primaryContainer }}
        labelStyle={styles.headerAvatarLabel}
      />
    </View>
  );
}

type DrawerListItemProps = {
  label: string;
  icon: React.ComponentProps<typeof LucideIcon>['icon'];
  onPress?: () => void;
  subtitle?: string;
  focused?: boolean;
  compact?: boolean;
  trailing?: React.ReactNode;
};

function DrawerListItem({
  label,
  icon,
  onPress,
  subtitle,
  focused = false,
  compact = false,
  trailing,
}: DrawerListItemProps) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.drawerRow,
        compact && styles.drawerRowCompact,
        focused && { backgroundColor: theme.colors.surfaceVariant },
        pressed && onPress ? { opacity: 0.72 } : null,
      ]}
    >
      <LucideIcon
        icon={icon}
        color={focused ? theme.colors.onSurface : theme.colors.onSurfaceVariant}
        size={compact ? 19 : 22}
      />
      <View style={styles.drawerRowCopy}>
        <Text
          variant={compact ? 'bodyMedium' : 'titleMedium'}
          style={[
            styles.drawerRowLabel,
            compact && styles.drawerRowLabelCompact,
            {
              color: focused ? theme.colors.onSurface : theme.colors.onSurface,
            },
          ]}
        >
          {label}
        </Text>
        {subtitle ? (
          <Text variant="bodySmall" style={styles.drawerRowSubtitle}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {trailing}
    </Pressable>
  );
}

function AppDrawerMark() {
  return (
    <View style={styles.brandMark}>
      <View style={[styles.brandPiece, styles.brandPieceBlue]} />
      <View style={[styles.brandPiece, styles.brandPieceGreen]} />
      <View style={[styles.brandPiece, styles.brandPieceYellow]} />
      <View style={[styles.brandPiece, styles.brandPieceRed]} />
    </View>
  );
}

function DrawerFooterLink({ label }: { label: string }) {
  return (
    <Pressable
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.footerLink,
        pressed ? styles.footerLinkPressed : null,
      ]}
    >
      <Text variant="titleMedium" style={styles.footerLinkText}>
        {label}
      </Text>
    </Pressable>
  );
}

function CustomDrawerContent(props: DrawerContentComponentProps) {
  const [isDrivesOpen, setIsDrivesOpen] = React.useState(false);
  const user = useAppSelector(state => state.auth.user);
  const pinnedFolders = useAppSelector(
    state => state.preferences.pinnedFolders || [],
  );
  const { data: drives } = useGetDrivesQuery();
  const { data: recycleBin } = useGetRecycleBinQuery();
  const theme = useTheme();
  const activeDrawerRoute = props.state.routes[props.state.index];
  const activeRoute = activeDrawerRoute?.name;
  const activeFoldersParams =
    activeDrawerRoute?.name === 'FoldersStack'
      ? (activeDrawerRoute.params as
          | RootDrawerParamList['FoldersStack']
          | undefined)
      : undefined;
  const activeFolderPath = activeFoldersParams?.params?.path;
  const isDriveActive = (drivePath: string) =>
    !!activeFolderPath &&
    (activeFolderPath === drivePath ||
      activeFolderPath.startsWith(
        drivePath.endsWith('/') ? drivePath : `${drivePath}/`,
      ));

  const cleanupSubtitle =
    pinnedFolders.length > 0
      ? `${pinnedFolders.length} pinned folders`
      : 'Quick access';
  const trashSubtitle = recycleBin ? 'Recently deleted items' : 'Bin is empty';

  return (
    <DrawerContentScrollView
      {...props}
      contentContainerStyle={styles.drawerContentContainer}
    >
      <View
        style={[styles.drawerShell, { backgroundColor: theme.colors.surface }]}
      >
        <View>
          <View style={styles.drawerHeader}>
            <View style={styles.brandRow}>
              <AppDrawerMark />
              <View>
                <Text
                  variant="headlineSmall"
                  style={[styles.brandTitle, { color: theme.colors.onSurface }]}
                >
                  Files
                </Text>
                <Text
                  variant="bodyMedium"
                  style={[
                    styles.brandSubtitle,
                    { color: theme.colors.onSurfaceVariant },
                  ]}
                >
                  {user?.name ?? 'Gallery Manager'}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.primarySection}>
            <DrawerListItem
              label="Files"
              icon={House}
              focused={activeRoute === 'Home'}
              onPress={() => props.navigation.navigate('Home')}
            />
            <DrawerListItem
              label="Favourites"
              icon={Sparkles}
              subtitle={cleanupSubtitle}
              focused={activeRoute === 'Favorites'}
              onPress={() => props.navigation.navigate('Favorites')}
            />
            <DrawerListItem
              label="Albums"
              icon={Folder}
              subtitle="Create your own collections"
              focused={activeRoute === 'Albums'}
              onPress={() => props.navigation.navigate('Albums')}
            />
            <DrawerListItem
              label="Gallery"
              icon={ImageIcon}
              subtitle="Browse folders from the gallery API"
              focused={activeRoute === 'Gallery'}
              onPress={() => props.navigation.navigate('Gallery')}
            />
            <DrawerListItem
              label="Trash"
              icon={Trash2}
              subtitle={trashSubtitle}
              focused={
                activeRoute === 'FoldersStack' &&
                !!recycleBin &&
                activeFolderPath === recycleBin.path
              }
              onPress={
                recycleBin
                  ? () => {
                      props.navigation.navigate('FoldersStack', {
                        screen: 'Folders',
                        params: {
                          path: recycleBin.path,
                          name: recycleBin.name,
                        },
                      });
                    }
                  : undefined
              }
            />
            <DrawerListItem
              label="Settings"
              icon={Settings}
              focused={activeRoute === 'Settings'}
              onPress={() => props.navigation.navigate('Settings')}
            />
          </View>

          {(drives && drives.length > 0) || pinnedFolders.length > 0 ? (
            <>
              <Divider style={styles.sectionDivider} />
              <View style={styles.locationsSection}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={
                    isDrivesOpen ? 'Collapse locations' : 'Expand locations'
                  }
                  onPress={() => setIsDrivesOpen(current => !current)}
                  style={({ pressed }) => [
                    styles.locationsToggle,
                    pressed ? styles.locationsTogglePressed : null,
                  ]}
                >
                  <View style={styles.locationsToggleLeft}>
                    <LucideIcon
                      icon={HardDrive}
                      color={theme.colors.onSurfaceVariant}
                      size={18}
                    />
                    <Text
                      variant="titleSmall"
                      style={styles.locationsToggleText}
                    >
                      Locations
                    </Text>
                  </View>
                  <LucideIcon
                    icon={isDrivesOpen ? ChevronUp : ChevronDown}
                    color={theme.colors.onSurfaceVariant}
                    size={16}
                  />
                </Pressable>

                {isDrivesOpen && (
                  <View style={styles.locationsList}>
                    {drives?.map(drive => (
                      <DrawerListItem
                        key={drive.path}
                        label={drive.name}
                        icon={HardDrive}
                        compact
                        focused={
                          activeRoute === 'FoldersStack' &&
                          isDriveActive(drive.path)
                        }
                        onPress={() => {
                          props.navigation.navigate('FoldersStack', {
                            screen: 'Folders',
                            params: { path: drive.path, name: drive.name },
                          });
                        }}
                      />
                    ))}
                    {pinnedFolders.map(folder => (
                      <DrawerListItem
                        key={folder.path}
                        label={folder.name}
                        icon={Pin}
                        compact
                        focused={
                          activeRoute === 'FoldersStack' &&
                          activeFolderPath === folder.path
                        }
                        onPress={() => {
                          props.navigation.navigate('FoldersStack', {
                            screen: 'Folders',
                            params: { path: folder.path, name: folder.name },
                          });
                        }}
                      />
                    ))}
                  </View>
                )}
              </View>
            </>
          ) : null}
        </View>

        {/* <View style={styles.footerSection}>
          <DrawerFooterLink label="Privacy Policy" />
          <DrawerFooterLink label="Terms & Conditions" />
        </View> */}
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
        headerShown: false,
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
        headerLeft: () => (
          <HeaderMenuButton
            onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())}
          />
        ),
        headerRight: () => <HeaderRight />,
        sceneStyle: {
          backgroundColor: theme.colors.background,
        },
        drawerStyle: {
          backgroundColor: theme.colors.surface,
          width: 296,
        },
      })}
    >
      <Drawer.Screen
        name="Home"
        component={HomeScreen}
        options={{
          headerShown: true,
          title: 'Home',
          drawerLabel: 'Home',
          drawerIcon: HomeDrawerIcon,
        }}
      />
      <Drawer.Screen
        name="Favorites"
        component={FavoritesScreen}
        options={{
          headerShown: false,
          title: 'Favourites',
          drawerLabel: 'Favourites',
          drawerIcon: ({ color, size }) => (
            <LucideIcon icon={Star} color={color} size={size} />
          ),
        }}
      />
      <Drawer.Screen
        name="Albums"
        component={AlbumsScreen}
        options={{
          headerShown: false,
          title: 'Albums',
          drawerLabel: 'Albums',
          drawerIcon: ({ color, size }) => (
            <LucideIcon icon={Folder} color={color} size={size} />
          ),
        }}
      />
      <Drawer.Screen
        name="Gallery"
        component={GalleryStackNavigator}
        options={{
          headerShown: false,
          title: 'Gallery',
          drawerLabel: 'Gallery',
          drawerIcon: ({ color, size }) => (
            <LucideIcon icon={ImageIcon} color={color} size={size} />
          ),
        }}
      />
      <Drawer.Screen
        name="FoldersStack"
        component={FoldersStackNavigator}
        options={{
          headerShown: false,
          title: 'File & Folders',
          drawerLabel: 'Folders',
          drawerIcon: FoldersDrawerIcon,
        }}
      />
      <Drawer.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          headerShown: false,
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
    paddingBottom: 12,
  },
  drawerShell: {
    flexGrow: 1,
    paddingHorizontal: 18,
    paddingTop: 26,
    paddingBottom: 28,
  },
  drawerHeader: {
    paddingHorizontal: 12,
    paddingBottom: 18,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  brandMark: {
    width: 28,
    height: 28,
    borderRadius: 6,
    overflow: 'hidden',
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#313744',
  },
  brandPiece: {
    width: '50%',
    height: '50%',
  },
  brandPieceBlue: {
    backgroundColor: '#4f83ff',
  },
  brandPieceGreen: {
    backgroundColor: '#34c759',
  },
  brandPieceYellow: {
    backgroundColor: '#f7c948',
  },
  brandPieceRed: {
    backgroundColor: '#ff6b57',
  },
  brandTitle: {
    color: '#f3f4f6',
    fontWeight: '500',
  },
  brandSubtitle: {
    color: '#aeb4bf',
    marginTop: 2,
  },
  primarySection: {
    marginTop: 10,
  },
  drawerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 18,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 14,
    marginBottom: 4,
  },
  drawerRowCompact: {
    paddingVertical: 10,
    paddingLeft: 18,
  },
  drawerRowCopy: {
    flex: 1,
  },
  drawerRowLabel: {
    color: '#f3f4f6',
    fontWeight: '500',
    lineHeight: 26,
  },
  drawerRowLabelCompact: {
    lineHeight: 22,
  },
  drawerRowSubtitle: {
    color: '#aeb4bf',
    marginTop: 1,
  },
  sectionDivider: {
    backgroundColor: '#343944',
    marginVertical: 16,
    marginHorizontal: 12,
  },
  locationsSection: {
    paddingHorizontal: 12,
  },
  locationsToggle: {
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  locationsTogglePressed: {
    opacity: 0.72,
  },
  locationsToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  locationsToggleText: {
    color: '#c7ced9',
    fontWeight: '600',
  },
  locationsList: {
    marginTop: 2,
  },
  footerSection: {
    marginTop: 'auto',
    paddingHorizontal: 12,
    paddingTop: 24,
    gap: 8,
  },
  footerLink: {
    paddingVertical: 10,
  },
  footerLinkPressed: {
    opacity: 0.72,
  },
  footerLinkText: {
    color: '#e3e8f1',
    fontWeight: '500',
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
  headerAvatarLabel: {
    color: '#8aa4ff',
    fontWeight: '700',
    fontSize: 12,
  },
});

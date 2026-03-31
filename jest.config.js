module.exports = {
  preset: 'react-native',
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|@react-navigation|react-native-drawer-layout|react-native-gesture-handler|react-native-safe-area-context|react-native-reanimated|react-native-paper|react-native-svg|react-native-worklets|react-redux|redux|@reduxjs/toolkit)/)',
  ],
};

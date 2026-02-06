import { Tabs, useRouter } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated from 'react-native-reanimated';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthStore } from '@/stores/auth-store';
import { AnimatedPressable } from '@/components/animated-pressable';

function CustomTabBar({ state, descriptors, navigation }: any) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  const primaryColor = '#7c3aed';
  const inactiveColor = isDark ? '#9ca3af' : '#6b7280';
  const bgColor = isDark ? '#1a1a1a' : '#ffffff';
  const borderColor = isDark ? '#374151' : '#e5e7eb';

  const handleCenterPress = () => {
    router.push('/capture-modal');
  };

  const tabs = [
    { key: 'index', icon: 'home', label: 'Home' },
    { key: 'practice', icon: 'school', label: 'Practice' },
    null, // Center placeholder
    { key: 'lists', icon: 'list', label: 'Lists' },
    { key: 'settings', icon: 'person', label: 'Profile' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: bgColor, borderTopColor: borderColor }]}>
      {tabs.map((tab, index) => {
        if (tab === null) {
          // Center Plus Button
          return (
            <View key="center" style={styles.centerContainer}>
              <AnimatedPressable
                onPress={handleCenterPress}
                style={[styles.centerButton, { backgroundColor: primaryColor }]}
                scale={0.9}
              >
                <Ionicons name="add" size={32} color="white" />
              </AnimatedPressable>
            </View>
          );
        }

        const routeKey = state.routes.find((r: any) => r.name === tab.key)?.key;
        const isFocused = state.routes[state.index]?.name === tab.key;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: routeKey,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(tab.key);
          }
        };

        return (
          <AnimatedPressable
            key={tab.key}
            onPress={onPress}
            style={styles.tabButton}
            scale={0.85}
          >
            <View style={[styles.iconContainer, isFocused && styles.activeIconContainer]}>
              <Ionicons
                name={isFocused ? tab.icon : `${tab.icon}-outline`}
                size={24}
                color={isFocused ? primaryColor : inactiveColor}
              />
            </View>
          </AnimatedPressable>
        );
      })}
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="practice" />
      <Tabs.Screen name="lists" />
      <Tabs.Screen name="settings" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: 80,
    borderTopWidth: 1,
    paddingBottom: 20,
    paddingHorizontal: 10,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    padding: 8,
    borderRadius: 12,
  },
  activeIconContainer: {
    backgroundColor: 'rgba(124, 58, 237, 0.1)',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -20,
  },
  centerButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});

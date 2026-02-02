import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  Switch,
  StyleSheet,
  TextInput,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { supabase } from '@/lib/supabase-client';
import { apiClient } from '@/lib/api-client';

interface DailyGoal {
  id: string;
  goal_type: string;
  target_value: number;
  is_active: boolean;
}

interface GoalConfig {
  type: 'words_learned' | 'practice_minutes' | 'reviews_completed';
  label: string;
  description: string;
  icon: string;
  color: string;
  defaultValue: number;
  min: number;
  max: number;
}

const GOAL_CONFIGS: GoalConfig[] = [
  {
    type: 'words_learned',
    label: 'New Words',
    description: 'Learn new vocabulary words each day',
    icon: 'book',
    color: '#3b82f6',
    defaultValue: 5,
    min: 1,
    max: 50,
  },
  {
    type: 'practice_minutes',
    label: 'Practice Time',
    description: 'Minutes spent practicing',
    icon: 'time',
    color: '#7c3aed',
    defaultValue: 10,
    min: 5,
    max: 60,
  },
  {
    type: 'reviews_completed',
    label: 'Reviews',
    description: 'Complete spaced repetition reviews',
    icon: 'checkmark-circle',
    color: '#10b981',
    defaultValue: 20,
    min: 5,
    max: 100,
  },
];

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [user, setUser] = useState<{ email: string } | null>(null);
  const [notifications, setNotifications] = useState(true);
  const [dailyReminder, setDailyReminder] = useState(true);

  // Daily Goals state
  const [goals, setGoals] = useState<DailyGoal[]>([]);
  const [loadingGoals, setLoadingGoals] = useState(true);
  const [savingGoal, setSavingGoal] = useState<string | null>(null);
  const [localValues, setLocalValues] = useState<Record<string, number>>({});
  const [activeStates, setActiveStates] = useState<Record<string, boolean>>({});

  const bgColor = isDark ? '#0f0f0f' : '#f9fafb';
  const cardColor = isDark ? '#1a1a1a' : '#ffffff';
  const textColor = isDark ? '#ffffff' : '#000000';
  const subtextColor = isDark ? '#9ca3af' : '#6b7280';
  const sectionHeaderColor = isDark ? '#6b7280' : '#6b7280';
  const borderColor = isDark ? '#374151' : '#e5e7eb';
  const disabledTextColor = isDark ? '#4b5563' : '#9ca3af';

  useEffect(() => {
    loadUser();
    fetchGoals();
  }, []);

  const loadUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user ? { email: user.email || '' } : null);
  };

  const fetchGoals = async () => {
    try {
      const data = await apiClient.get<{ goals: DailyGoal[] }>('/api/daily-goals');
      setGoals(data.goals || []);

      // Initialize local state from fetched goals
      const values: Record<string, number> = {};
      const active: Record<string, boolean> = {};

      GOAL_CONFIGS.forEach((config) => {
        const existingGoal = data.goals?.find((g: DailyGoal) => g.goal_type === config.type);
        values[config.type] = existingGoal?.target_value || config.defaultValue;
        active[config.type] = existingGoal?.is_active ?? false;
      });

      setLocalValues(values);
      setActiveStates(active);
    } catch (error) {
      console.error('Failed to fetch goals:', error);
    } finally {
      setLoadingGoals(false);
    }
  };

  const saveGoal = async (goalType: string) => {
    setSavingGoal(goalType);
    try {
      await apiClient.post('/api/daily-goals', {
        goalType,
        targetValue: localValues[goalType],
        isActive: activeStates[goalType],
      });
      await fetchGoals();
    } catch (error) {
      console.error('Failed to save goal:', error);
      Alert.alert('Error', 'Failed to save goal');
    } finally {
      setSavingGoal(null);
    }
  };

  const toggleGoal = async (goalType: string, isActive: boolean) => {
    setActiveStates((prev) => ({ ...prev, [goalType]: isActive }));

    setSavingGoal(goalType);
    try {
      await apiClient.post('/api/daily-goals', {
        goalType,
        targetValue: localValues[goalType],
        isActive,
      });
      await fetchGoals();
    } catch (error) {
      console.error('Failed to toggle goal:', error);
      setActiveStates((prev) => ({ ...prev, [goalType]: !isActive }));
      Alert.alert('Error', 'Failed to update goal');
    } finally {
      setSavingGoal(null);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await supabase.auth.signOut();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. All your data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await supabase.rpc('delete_user');
              await supabase.auth.signOut();
              router.replace('/(auth)/login');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete account');
            }
          },
        },
      ]
    );
  };

  type SettingsItem = {
    icon: string;
    label: string;
    value?: string;
    disabled?: boolean;
    onPress?: () => void;
    toggle?: boolean;
    toggleValue?: boolean;
    onToggle?: (value: boolean) => void;
  };

  const settingsSections: { title: string; items: SettingsItem[] }[] = [
    {
      title: 'Your Progress',
      items: [
        {
          icon: 'trending-up',
          label: 'View Statistics',
          onPress: () => {
            router.push('/progress');
          },
        },
      ],
    },
    {
      title: 'Account',
      items: [
        {
          icon: 'person',
          label: 'Email',
          value: user?.email,
          disabled: true,
        },
        {
          icon: 'key',
          label: 'Change Password',
          onPress: () => {
            Alert.alert('Coming Soon', 'Password change will be available soon');
          },
        },
      ],
    },
    {
      title: 'Preferences',
      items: [
        {
          icon: 'notifications',
          label: 'Push Notifications',
          toggle: true,
          toggleValue: notifications,
          onToggle: setNotifications,
        },
        {
          icon: 'time',
          label: 'Daily Reminder',
          toggle: true,
          toggleValue: dailyReminder,
          onToggle: setDailyReminder,
        },
      ],
    },
    {
      title: 'Your Content',
      items: [
        {
          icon: 'time',
          label: 'History',
          onPress: () => {
            router.push('/history');
          },
        },
        {
          icon: 'book',
          label: 'Stories',
          onPress: () => {
            router.push('/stories');
          },
        },
        {
          icon: 'school',
          label: 'Courses',
          onPress: () => {
            router.push('/courses');
          },
        },
        {
          icon: 'list',
          label: 'My Lists',
          onPress: () => {
            router.push('/lists');
          },
        },
        {
          icon: 'download',
          label: 'Import Vocabulary',
          onPress: () => {
            router.push('/import');
          },
        },
      ],
    },
    {
      title: 'About',
      items: [
        {
          icon: 'information-circle',
          label: 'App Version',
          value: '1.0.0',
          disabled: true,
        },
        {
          icon: 'document-text',
          label: 'Privacy Policy',
          onPress: () => {
            Alert.alert('Coming Soon', 'Privacy policy will be available soon');
          },
        },
        {
          icon: 'help-circle',
          label: 'Help & Support',
          onPress: () => {
            Alert.alert('Coming Soon', 'Support will be available soon');
          },
        },
      ],
    },
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: bgColor }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
        <Text style={styles.headerSubtitle}>
          Manage your account and preferences
        </Text>
      </View>

      {/* Daily Goals Section */}
      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: sectionHeaderColor }]}>
            Daily Goals
          </Text>
          <Text style={[styles.sectionDescription, { color: subtextColor }]}>
            Set daily learning targets to stay motivated
          </Text>

          {GOAL_CONFIGS.map((config) => {
            const isActive = activeStates[config.type] ?? false;
            const value = localValues[config.type] ?? config.defaultValue;
            const existingGoal = goals.find((g) => g.goal_type === config.type);
            const hasChanges = existingGoal
              ? existingGoal.target_value !== value
              : value !== config.defaultValue;

            return (
              <View
                key={config.type}
                style={[
                  styles.goalCard,
                  { backgroundColor: cardColor },
                  isActive && styles.goalCardActive,
                ]}
              >
                <View style={styles.goalHeader}>
                  <View style={[styles.goalIcon, { backgroundColor: `${config.color}20` }]}>
                    <Ionicons name={config.icon as any} size={20} color={config.color} />
                  </View>
                  <View style={styles.goalInfo}>
                    <View style={styles.goalTitleRow}>
                      <Text style={[styles.goalLabel, { color: textColor }]}>
                        {config.label}
                      </Text>
                      {isActive && (
                        <View style={[styles.activeBadge, { backgroundColor: `${config.color}20` }]}>
                          <Text style={[styles.activeBadgeText, { color: config.color }]}>
                            Active
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.goalDescription, { color: subtextColor }]}>
                      {config.description}
                    </Text>
                  </View>
                  <Switch
                    value={isActive}
                    onValueChange={(checked) => toggleGoal(config.type, checked)}
                    disabled={savingGoal === config.type}
                    trackColor={{ false: '#767577', true: config.color }}
                  />
                </View>

                {isActive && (
                  <View style={styles.goalControls}>
                    <Text style={[styles.targetLabel, { color: subtextColor }]}>
                      Daily target:
                    </Text>
                    <View style={styles.targetInputRow}>
                      <TouchableOpacity
                        onPress={() => {
                          const newValue = Math.max(config.min, value - 1);
                          setLocalValues((prev) => ({ ...prev, [config.type]: newValue }));
                        }}
                        style={styles.adjustButton}
                      >
                        <Ionicons name="remove" size={20} color={textColor} />
                      </TouchableOpacity>
                      <TextInput
                        style={[styles.targetInput, { color: textColor, borderColor }]}
                        value={String(value)}
                        onChangeText={(text) => {
                          const num = parseInt(text) || config.min;
                          setLocalValues((prev) => ({
                            ...prev,
                            [config.type]: Math.min(config.max, Math.max(config.min, num)),
                          }));
                        }}
                        keyboardType="number-pad"
                      />
                      <TouchableOpacity
                        onPress={() => {
                          const newValue = Math.min(config.max, value + 1);
                          setLocalValues((prev) => ({ ...prev, [config.type]: newValue }));
                        }}
                        style={styles.adjustButton}
                      >
                        <Ionicons name="add" size={20} color={textColor} />
                      </TouchableOpacity>
                      <Text style={[styles.targetUnit, { color: subtextColor }]}>
                        {config.type === 'practice_minutes' ? 'min' : 'items'}
                      </Text>
                      {hasChanges && (
                        <TouchableOpacity
                          onPress={() => saveGoal(config.type)}
                          disabled={savingGoal === config.type}
                          style={[styles.saveButton, { backgroundColor: config.color }]}
                        >
                          {savingGoal === config.type ? (
                            <Ionicons name="sync" size={16} color="#fff" />
                          ) : (
                            <Ionicons name="save" size={16} color="#fff" />
                          )}
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* Settings Sections */}
        {settingsSections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: sectionHeaderColor }]}>
              {section.title}
            </Text>
            <View style={[styles.sectionCard, { backgroundColor: cardColor }]}>
              {section.items.map((item, itemIndex) => (
                <TouchableOpacity
                  key={item.label}
                  onPress={item.onPress}
                  disabled={item.disabled || !item.onPress}
                  style={[
                    styles.itemRow,
                    itemIndex < section.items.length - 1 && {
                      borderBottomWidth: 1,
                      borderBottomColor: borderColor,
                    },
                  ]}
                >
                  <Ionicons
                    name={item.icon as any}
                    size={20}
                    color={subtextColor}
                  />
                  <Text
                    style={[
                      styles.itemLabel,
                      {
                        color: item.disabled
                          ? disabledTextColor
                          : textColor,
                      },
                    ]}
                  >
                    {item.label}
                  </Text>
                  {item.toggle ? (
                    <Switch
                      value={item.toggleValue}
                      onValueChange={item.onToggle}
                      trackColor={{ false: '#767577', true: '#7c3aed' }}
                    />
                  ) : (
                    <View style={styles.itemRight}>
                      {item.value && (
                        <Text style={[styles.itemValue, { color: disabledTextColor }]}>
                          {item.value}
                        </Text>
                      )}
                      {!item.disabled && (
                        <Ionicons
                          name="chevron-forward"
                          size={16}
                          color={disabledTextColor}
                        />
                      )}
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Logout */}
        <TouchableOpacity
          onPress={handleLogout}
          style={styles.logoutButton}
        >
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>

        {/* Delete Account */}
        <TouchableOpacity
          onPress={handleDeleteAccount}
          style={styles.deleteButton}
        >
          <Text style={styles.deleteButtonText}>Delete Account</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#7c3aed',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  sectionDescription: {
    fontSize: 14,
    marginBottom: 12,
    marginLeft: 4,
  },
  sectionCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  goalCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  goalCardActive: {
    borderColor: 'rgba(124, 58, 237, 0.3)',
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  goalIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  goalInfo: {
    flex: 1,
  },
  goalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  goalLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  activeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  activeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  goalDescription: {
    fontSize: 13,
    marginTop: 2,
  },
  goalControls: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  targetLabel: {
    fontSize: 13,
    marginBottom: 8,
  },
  targetInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  adjustButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  targetInput: {
    width: 60,
    height: 40,
    borderWidth: 1,
    borderRadius: 8,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
  targetUnit: {
    fontSize: 14,
    marginLeft: 4,
  },
  saveButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 'auto',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  itemLabel: {
    flex: 1,
    fontSize: 16,
    marginLeft: 12,
  },
  itemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemValue: {
    fontSize: 14,
    marginRight: 8,
  },
  logoutButton: {
    backgroundColor: '#ef4444',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  logoutButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '600',
  },
});

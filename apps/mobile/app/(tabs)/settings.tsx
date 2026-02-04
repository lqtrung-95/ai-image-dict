import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  Switch,
  StyleSheet,
  TextInput,
  Image,
  Modal,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { supabase } from '@/lib/supabase-client';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth-store';
import { useFocusEffect } from '@react-navigation/native';

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
  const { user: authUser, setProfile } = useAuthStore();
  const [user, setUser] = useState<{ email: string; displayName?: string; avatarUrl?: string } | null>(null);
  const [notifications, setNotifications] = useState(true);
  const [dailyReminder, setDailyReminder] = useState(true);

  // Profile editing state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editDisplayName, setEditDisplayName] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

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
    fetchGoals();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadUser();
    }, [])
  );

  // Sync local user state when authUser changes (for updates from other screens)
  useEffect(() => {
    if (authUser?.displayName || authUser?.avatarUrl) {
      setUser((prev) =>
        prev
          ? {
              ...prev,
              displayName: authUser.displayName ?? prev.displayName,
              avatarUrl: authUser.avatarUrl ?? prev.avatarUrl,
            }
          : prev
      );
    }
  }, [authUser?.displayName, authUser?.avatarUrl]);

  const loadUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      // Fetch profile data from API
      try {
        const profileData = await apiClient.get<{ profile: { display_name: string; avatar_url: string } }>('/api/user/profile');
        setUser({
          email: user.email || '',
          displayName: profileData.profile?.display_name || '',
          avatarUrl: profileData.profile?.avatar_url || '',
        });
      } catch (error) {
        console.error('Failed to fetch profile:', error);
        setUser({ email: user.email || '' });
      }
    } else {
      setUser(null);
    }
  };

  const handleUpdateDisplayName = async () => {
    if (!editDisplayName.trim()) {
      Alert.alert('Error', 'Display name cannot be empty');
      return;
    }

    setIsSavingProfile(true);
    try {
      await apiClient.patch('/api/user/profile', { displayName: editDisplayName.trim() });
      setUser((prev) => prev ? { ...prev, displayName: editDisplayName.trim() } : null);
      setProfile({ displayName: editDisplayName.trim() });
      setIsEditingProfile(false);
      Alert.alert('Success', 'Display name updated successfully');
    } catch (error: any) {
      console.error('Failed to update display name:', error);
      Alert.alert('Error', error.message || 'Failed to update display name');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePickAvatar = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadAvatar(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Failed to pick image:', error);
      Alert.alert('Error', 'Failed to select image');
    }
  };

  const uploadAvatar = async (imageUri: string) => {
    setIsUploadingAvatar(true);
    try {
      // Convert image to blob
      const response = await fetch(imageUri);
      const blob = await response.blob();

      // Create form data
      const formData = new FormData();
      formData.append('avatar', {
        uri: imageUri,
        name: 'avatar.jpg',
        type: 'image/jpeg',
      } as any);

      const data = await apiClient.upload<{ avatarUrl: string }>('/api/user/avatar', formData);

      setUser((prev) => prev ? { ...prev, avatarUrl: data.avatarUrl } : null);
      setProfile({ avatarUrl: data.avatarUrl });
      Alert.alert('Success', 'Profile picture updated successfully');
    } catch (error: any) {
      console.error('Failed to upload avatar:', error);
      Alert.alert('Error', error.message || 'Failed to upload profile picture');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const openEditProfile = () => {
    setEditDisplayName(user?.displayName || '');
    setIsEditingProfile(true);
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
    // Get config for this goal type to ensure we have valid defaults
    const config = GOAL_CONFIGS.find((c) => c.type === goalType);
    const currentValue = localValues[goalType];
    // Ensure we have a valid target value (fallback to config default if undefined/invalid)
    const targetValue = currentValue && currentValue >= 1 && currentValue <= 100
      ? currentValue
      : (config?.defaultValue ?? 5);

    setActiveStates((prev) => ({ ...prev, [goalType]: isActive }));
    // Also ensure localValues has the valid target value
    setLocalValues((prev) => ({ ...prev, [goalType]: targetValue }));

    setSavingGoal(goalType);
    try {
      await apiClient.post('/api/daily-goals', {
        goalType,
        targetValue,
        isActive,
      });
      await fetchGoals();
    } catch (error: any) {
      console.error('Failed to toggle goal:', error);
      setActiveStates((prev) => ({ ...prev, [goalType]: !isActive }));
      Alert.alert('Error', error?.message || 'Failed to update goal');
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

      {/* Profile Section */}
      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: sectionHeaderColor }]}>
            Profile
          </Text>
          <View style={[styles.sectionCard, { backgroundColor: cardColor }]}>
            {/* Profile Picture and Name */}
            <View style={styles.profileHeader}>
              <TouchableOpacity
                onPress={handlePickAvatar}
                disabled={isUploadingAvatar}
                style={styles.avatarContainer}
              >
                {isUploadingAvatar ? (
                  <View style={[styles.avatar, { backgroundColor: isDark ? '#2a2a2a' : '#e5e7eb' }]}>
                    <ActivityIndicator color="#7c3aed" />
                  </View>
                ) : user?.avatarUrl ? (
                  <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatar, { backgroundColor: '#7c3aed' }]}>
                    <Text style={styles.avatarInitial}>
                      {(user?.displayName || user?.email || '?').charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
                <View style={styles.avatarOverlay}>
                  <Ionicons name="camera" size={16} color="#fff" />
                </View>
              </TouchableOpacity>

              <View style={styles.profileInfo}>
                <Text style={[styles.displayName, { color: textColor }]}>
                  {user?.displayName || 'Set Display Name'}
                </Text>
                <Text style={[styles.emailText, { color: subtextColor }]}>
                  {user?.email}
                </Text>
              </View>

              <TouchableOpacity
                onPress={openEditProfile}
                style={styles.editButton}
              >
                <Ionicons name="pencil" size={20} color="#7c3aed" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Daily Goals Section */}
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

      {/* Edit Profile Modal */}
      <Modal
        visible={isEditingProfile}
        transparent
        animationType="slide"
        onRequestClose={() => setIsEditingProfile(false)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={styles.keyboardAvoidingContainer}
            >
              <View style={[styles.modalContent, { backgroundColor: cardColor }]}>
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: textColor }]}>
                    Edit Profile
                  </Text>
                  <TouchableOpacity
                    onPress={() => setIsEditingProfile(false)}
                    style={styles.modalCloseButton}
                  >
                    <Ionicons name="close" size={24} color={subtextColor} />
                  </TouchableOpacity>
                </View>

                <View style={styles.modalBody}>
                  <Text style={[styles.inputLabel, { color: subtextColor }]}>
                    Display Name
                  </Text>
                  <TextInput
                    style={[
                      styles.textInput,
                      { color: textColor, borderColor, backgroundColor: isDark ? '#0f0f0f' : '#f9fafb' }
                    ]}
                    value={editDisplayName}
                    onChangeText={setEditDisplayName}
                    placeholder="Enter your display name"
                    placeholderTextColor={subtextColor}
                    maxLength={50}
                    autoFocus
                  />
                  <Text style={[styles.charCount, { color: subtextColor }]}>
                    {editDisplayName.length}/50
                  </Text>
                </View>

                <View style={styles.modalFooter}>
                  <TouchableOpacity
                    onPress={() => setIsEditingProfile(false)}
                    style={[styles.modalButton, styles.modalButtonSecondary, { borderColor }]}
                  >
                    <Text style={[styles.modalButtonTextSecondary, { color: textColor }]}>
                      Cancel
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleUpdateDisplayName}
                    disabled={isSavingProfile}
                    style={[styles.modalButton, styles.modalButtonPrimary]}
                  >
                    {isSavingProfile ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Text style={styles.modalButtonTextPrimary}>Save</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
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
  // Profile styles
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  avatarOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: 'rgba(124, 58, 237, 0.8)',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  profileInfo: {
    flex: 1,
    marginLeft: 16,
  },
  displayName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  emailText: {
    fontSize: 14,
  },
  editButton: {
    padding: 8,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  keyboardAvoidingContainer: {
    width: '100%',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalBody: {
    padding: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  textInput: {
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  charCount: {
    fontSize: 12,
    marginTop: 8,
    textAlign: 'right',
  },
  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
  },
  modalButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonPrimary: {
    backgroundColor: '#7c3aed',
  },
  modalButtonSecondary: {
    borderWidth: 1,
  },
  modalButtonTextPrimary: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalButtonTextSecondary: {
    fontSize: 16,
    fontWeight: '600',
  },
});

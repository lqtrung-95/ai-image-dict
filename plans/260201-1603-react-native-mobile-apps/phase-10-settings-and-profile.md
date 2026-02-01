---
title: "Phase 10: Settings and Profile Management"
description: "Implement settings screen, profile editing, and data management"
---

# Phase 10: Settings and Profile Management

## Context Links
- Parent Plan: [plan.md](./plan.md)
- Previous Phase: [phase-09-courses-stories-and-games.md](./phase-09-courses-stories-and-games.md)
- Codebase: `src/app/(protected)/settings/page.tsx`

## Overview
- **Priority:** P2
- **Status:** Pending
- **Description:** Build settings screen with profile management, daily goals, notifications, and data export/delete.
- **Estimated Effort:** 3-4 days

## Key Insights
- Use Supabase for profile updates
- Implement avatar upload with image picker
- Daily goals stored in user settings
- Export data as JSON/CSV
- Account deletion requires confirmation

## Requirements

### Functional Requirements
- Profile editing (name, avatar)
- Daily goal setting
- Notification preferences
- Data export
- Account deletion
- Logout

### Technical Requirements
- Image upload for avatar
- Form validation
- Confirmation dialogs
- API integration

## Related Code Files
- `src/app/(protected)/settings/page.tsx`
- `src/app/(protected)/settings/components/profile-settings-section.tsx`
- `src/app/api/user/profile/route.ts`

## Implementation Steps

### Step 1: Create Settings Screen
Create `app/(tabs)/settings.tsx`:
```tsx
import { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, ScrollView, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api-client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { User, Bell, Download, Trash2, LogOut, ChevronRight } from 'lucide-react-native';

export default function SettingsScreen() {
  const { user, signOut } = useAuth();
  const [displayName, setDisplayName] = useState(user?.user_metadata?.display_name || '');
  const [avatar, setAvatar] = useState(user?.user_metadata?.avatar_url);

  const handleUpdateProfile = async () => {
    try {
      await apiClient.put('/api/user/profile', { display_name: displayName });
      Alert.alert('Success', 'Profile updated');
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile');
    }
  };

  const handlePickAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      // Upload avatar
      const formData = new FormData();
      formData.append('avatar', {
        uri: result.assets[0].uri,
        name: 'avatar.jpg',
        type: 'image/jpeg',
      } as any);

      try {
        const response = await apiClient.upload('/api/user/avatar', formData);
        setAvatar(response.avatar_url);
      } catch (error) {
        Alert.alert('Error', 'Failed to upload avatar');
      }
    }
  };

  const handleExport = async () => {
    try {
      const data = await apiClient.get('/api/user/export');
      // Share or save file
      Alert.alert('Success', 'Data exported');
    } catch (error) {
      Alert.alert('Error', 'Export failed');
    }
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
              await apiClient.delete('/api/user/delete');
              await signOut();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete account');
            }
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', onPress: signOut },
    ]);
  };

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="p-4">
        <Text className="text-2xl font-bold text-gray-900 mb-6">Settings</Text>

        {/* Profile Section */}
        <Card className="p-4 mb-4">
          <Text className="text-lg font-semibold text-gray-900 mb-4">Profile</Text>

          <TouchableOpacity onPress={handlePickAvatar} className="items-center mb-4">
            {avatar ? (
              <Image source={{ uri: avatar }} className="w-24 h-24 rounded-full" />
            ) : (
              <View className="w-24 h-24 rounded-full bg-purple-100 items-center justify-center">
                <User size={40} color="#7c3aed" />
              </View>
            )}
            <Text className="text-purple-600 mt-2">Change Avatar</Text>
          </TouchableOpacity>

          <Input
            label="Display Name"
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Enter your name"
          />

          <Button onPress={handleUpdateProfile} className="mt-4">
            Save Changes
          </Button>
        </Card>

        {/* Daily Goal */}
        <Card className="p-4 mb-4">
          <Text className="text-lg font-semibold text-gray-900 mb-4">Daily Goal</Text>
          <Text className="text-gray-500 mb-4">Target words to practice per day</Text>
          {/* Daily goal selector */}
        </Card>

        {/* Actions */}
        <Card className="mb-4">
          <TouchableOpacity onPress={handleExport} className="p-4 flex-row items-center border-b border-gray-100">
            <Download size={20} color="#6b7280" />
            <Text className="flex-1 ml-3 text-gray-900">Export Data</Text>
            <ChevronRight size={20} color="#9ca3af" />
          </TouchableOpacity>

          <TouchableOpacity onPress={handleLogout} className="p-4 flex-row items-center">
            <LogOut size={20} color="#6b7280" />
            <Text className="flex-1 ml-3 text-gray-900">Logout</Text>
            <ChevronRight size={20} color="#9ca3af" />
          </TouchableOpacity>
        </Card>

        {/* Danger Zone */}
        <Card className="p-4 border-red-200">
          <Text className="text-lg font-semibold text-red-600 mb-4">Danger Zone</Text>
          <Button variant="destructive" onPress={handleDeleteAccount}>
            Delete Account
          </Button>
        </Card>
      </View>
    </ScrollView>
  );
}
```

## Todo List
- [ ] Create settings screen
- [ ] Implement profile editing
- [ ] Add avatar upload
- [ ] Create daily goal selector
- [ ] Add notification preferences
- [ ] Implement data export
- [ ] Add account deletion
- [ ] Add logout functionality
- [ ] Test all settings

## Success Criteria
- [ ] Profile updates save correctly
- [ ] Avatar uploads and displays
- [ ] Daily goals persist
- [ ] Data export works
- [ ] Account deletion works
- [ ] Logout clears session

## Next Steps
Proceed to [Phase 11: Offline Sync](./phase-11-offline-sync.md).

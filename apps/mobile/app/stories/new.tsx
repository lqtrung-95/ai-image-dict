import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthStore } from '@/stores/auth-store';
import { apiClient } from '@/lib/api-client';
import { supabase } from '@/lib/supabase-client';

interface PhotoAnalysis {
  id: string;
  image_url: string;
  created_at: string;
}

export default function CreateStoryScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { isAuthenticated } = useAuthStore();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState<PhotoAnalysis[]>([]);
  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const bgColor = isDark ? '#0f0f0f' : '#ffffff';
  const cardColor = isDark ? '#1a1a1a' : '#f8fafc';
  const textColor = isDark ? '#ffffff' : '#000000';
  const subtextColor = isDark ? '#9ca3af' : '#6b7280';
  const inputBg = isDark ? '#262626' : '#f3f4f6';
  const borderColor = isDark ? '#374151' : '#e5e7eb';

  useEffect(() => {
    if (isAuthenticated) {
      fetchPhotos();
    }
  }, [isAuthenticated]);

  const fetchPhotos = async () => {
    try {
      const { data, error } = await supabase
        .from('photo_analyses')
        .select('id, image_url, created_at')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to fetch photos:', error);
      } else {
        setPhotos(data || []);
      }
    } catch (error) {
      console.error('Failed to fetch photos:', error);
    } finally {
      setLoading(false);
    }
  };

  const togglePhotoSelection = (id: string) => {
    setSelectedPhotos((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleCreate = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }

    if (selectedPhotos.size === 0) {
      Alert.alert('Error', 'Please select at least one photo');
      return;
    }

    setCreating(true);
    try {
      await apiClient.post('/api/stories', {
        title: title.trim(),
        description: description.trim() || undefined,
        photoIds: Array.from(selectedPhotos),
      });
      Alert.alert('Success', 'Story created successfully!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error('Failed to create story:', error);
      Alert.alert('Error', 'Failed to create story');
    } finally {
      setCreating(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <View style={[styles.container, { backgroundColor: bgColor, justifyContent: 'center', alignItems: 'center' }]}>
        <Ionicons name="book" size={64} color="#7c3aed" />
        <Text style={[styles.emptyTitle, { color: textColor }]}>Sign in to create stories</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Story</Text>
        <Text style={styles.headerSubtitle}>Organize your photos into a story</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Title Input */}
        <View style={[styles.inputCard, { backgroundColor: cardColor }]}>
          <Text style={[styles.label, { color: textColor }]}>Title</Text>
          <TextInput
            style={[styles.input, { backgroundColor: inputBg, color: textColor, borderColor }]}
            placeholder="e.g., My Trip to Beijing"
            placeholderTextColor={subtextColor}
            value={title}
            onChangeText={setTitle}
            maxLength={100}
          />
        </View>

        {/* Description Input */}
        <View style={[styles.inputCard, { backgroundColor: cardColor }]}>
          <Text style={[styles.label, { color: textColor }]}>Description (optional)</Text>
          <TextInput
            style={[styles.textArea, { backgroundColor: inputBg, color: textColor, borderColor }]}
            placeholder="What's this story about?"
            placeholderTextColor={subtextColor}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            maxLength={500}
          />
        </View>

        {/* Photo Selection */}
        <View style={[styles.photosSection, { backgroundColor: cardColor }]}>
          <Text style={[styles.label, { color: textColor }]}>
            Select Photos ({selectedPhotos.size} selected)
          </Text>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#7c3aed" />
            </View>
          ) : photos.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="images" size={48} color={subtextColor} />
              <Text style={[styles.emptyText, { color: subtextColor }]}>
                No photos yet. Take some photos first!
              </Text>
            </View>
          ) : (
            <View style={styles.photoGrid}>
              {photos.map((photo) => (
                <TouchableOpacity
                  key={photo.id}
                  style={[
                    styles.photoItem,
                    selectedPhotos.has(photo.id) && styles.photoItemSelected,
                  ]}
                  onPress={() => togglePhotoSelection(photo.id)}
                >
                  <Image source={{ uri: photo.image_url }} style={styles.photoImage} />
                  {selectedPhotos.has(photo.id) && (
                    <View style={styles.checkOverlay}>
                      <Ionicons name="checkmark-circle" size={24} color="#7c3aed" />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Create Button */}
      <View style={[styles.footer, { backgroundColor: cardColor, borderTopColor: borderColor }]}>
        <TouchableOpacity
          style={[
            styles.createButton,
            (!title.trim() || selectedPhotos.size === 0 || creating) && styles.createButtonDisabled,
          ]}
          onPress={handleCreate}
          disabled={!title.trim() || selectedPhotos.size === 0 || creating}
        >
          {creating ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark" size={20} color="#fff" />
              <Text style={styles.createButtonText}>Create Story</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
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
  backButton: {
    marginBottom: 8,
    marginLeft: -4,
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
    flex: 1,
    padding: 16,
  },
  inputCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    height: 80,
  },
  photosSection: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  loadingContainer: {
    paddingVertical: 48,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  photoItem: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  photoItemSelected: {
    borderColor: '#7c3aed',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  checkOverlay: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#7c3aed',
    paddingVertical: 16,
    borderRadius: 16,
  },
  createButtonDisabled: {
    opacity: 0.5,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
  },
});

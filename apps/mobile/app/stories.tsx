import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
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

interface Story {
  id: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  created_at: string;
  photoCount: number;
}

export default function StoriesScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { isAuthenticated } = useAuthStore();
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);

  const bgColor = isDark ? '#0f0f0f' : '#ffffff';
  const cardColor = isDark ? '#1a1a1a' : '#f8fafc';
  const textColor = isDark ? '#ffffff' : '#000000';
  const subtextColor = isDark ? '#9ca3af' : '#6b7280';

  const fetchStories = useCallback(async () => {
    try {
      const data = await apiClient.get<{ stories: Story[] }>('/api/stories');
      setStories(data.stories || []);
    } catch (error) {
      console.error('Failed to fetch stories:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchStories();
    }
  }, [isAuthenticated, fetchStories]);

  const handleDelete = async (id: string) => {
    Alert.alert(
      'Delete Story',
      'Are you sure you want to delete this story?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.del(`/api/stories/${id}`);
              setStories((prev) => prev.filter((s) => s.id !== id));
            } catch (error) {
              Alert.alert('Error', 'Failed to delete story');
            }
          },
        },
      ]
    );
  };

  if (!isAuthenticated) {
    return (
      <View style={[styles.container, { backgroundColor: bgColor, justifyContent: 'center', alignItems: 'center' }]}>
        <Ionicons name="book" size={64} color="#7c3aed" />
        <Text style={[styles.emptyTitle, { color: textColor }]}>Sign in to view stories</Text>
        <TouchableOpacity style={styles.loginButton} onPress={() => router.push('/(auth)/login')}>
          <Text style={styles.loginButtonText}>Sign In</Text>
        </TouchableOpacity>
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
        <Text style={styles.headerTitle}>Photo Stories</Text>
        <Text style={styles.headerSubtitle}>Organize vocabulary by context</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#7c3aed" />
          </View>
        ) : stories.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="book" size={64} color={subtextColor} />
            <Text style={[styles.emptyTitle, { color: textColor }]}>No stories yet</Text>
            <Text style={[styles.emptySubtitle, { color: subtextColor }]}>
              Create photo stories to organize your vocabulary by context
            </Text>
            <TouchableOpacity style={styles.createFirstButton} onPress={() => router.push('/stories/new')}>
              <Ionicons name="add" size={20} color="#fff" />
              <Text style={styles.createFirstText}>Create Your First Story</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.grid}>
            {stories.map((story) => (
              <TouchableOpacity
                key={story.id}
                style={[styles.card, { backgroundColor: cardColor }]}
                onPress={() => router.push(`/story/${story.id}`)}
              >
                <View style={styles.imageContainer}>
                  {story.cover_image_url ? (
                    <Image source={{ uri: story.cover_image_url }} style={styles.image} resizeMode="cover" />
                  ) : (
                    <View style={styles.placeholderImage}>
                      <Ionicons name="image" size={40} color={subtextColor} />
                    </View>
                  )}
                  <View style={styles.photoCount}>
                    <Text style={styles.photoCountText}>{story.photoCount} photos</Text>
                  </View>
                </View>
                <View style={styles.cardContent}>
                  <View style={styles.cardHeader}>
                    <View style={styles.titleContainer}>
                      <Text style={[styles.title, { color: textColor }]} numberOfLines={1}>
                        {story.title}
                      </Text>
                      {story.description && (
                        <Text style={[styles.description, { color: subtextColor }]} numberOfLines={2}>
                          {story.description}
                        </Text>
                      )}
                    </View>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleDelete(story.id);
                      }}
                    >
                      <Ionicons name="trash-outline" size={20} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
            <View style={{ height: 100 }} />
          </View>
        )}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => router.push('/stories/new')}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
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
  loadingContainer: {
    paddingVertical: 48,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    marginTop: 8,
    marginBottom: 24,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  createFirstButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#7c3aed',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 24,
  },
  createFirstText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  grid: {
    gap: 16,
  },
  card: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  imageContainer: {
    width: '100%',
    height: 180,
    backgroundColor: '#374151',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoCount: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  photoCountText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  cardContent: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  description: {
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
  deleteButton: {
    padding: 4,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 30,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#7c3aed',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  loginButton: {
    backgroundColor: '#7c3aed',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 24,
    marginTop: 16,
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

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
import { supabase } from '@/lib/supabase-client';

interface Analysis {
  id: string;
  image_url: string;
  scene_context: {
    description?: string;
  };
  created_at: string;
  detected_objects: Array<{ id: string }>;
}

export default function HistoryScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { isAuthenticated } = useAuthStore();
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);

  const bgColor = isDark ? '#0f0f0f' : '#ffffff';
  const cardColor = isDark ? '#1a1a1a' : '#f8fafc';
  const textColor = isDark ? '#ffffff' : '#000000';
  const subtextColor = isDark ? '#9ca3af' : '#6b7280';

  const fetchAnalyses = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('photo_analyses')
        .select('*, detected_objects(id)')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to fetch analyses:', error);
      } else {
        setAnalyses(data || []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchAnalyses();
    }
  }, [isAuthenticated, fetchAnalyses]);

  const handleDelete = async (id: string) => {
    Alert.alert(
      'Delete Analysis',
      'Are you sure you want to delete this analysis?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setAnalyses((prev) => prev.filter((a) => a.id !== id));
            const { error } = await supabase.from('photo_analyses').delete().eq('id', id);
            if (error) {
              Alert.alert('Error', 'Failed to delete');
              fetchAnalyses();
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (!isAuthenticated) {
    return (
      <View style={[styles.container, { backgroundColor: bgColor, justifyContent: 'center', alignItems: 'center' }]}>
        <Ionicons name="time" size={64} color="#7c3aed" />
        <Text style={[styles.emptyTitle, { color: textColor }]}>Sign in to view history</Text>
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
        <Text style={styles.headerTitle}>History</Text>
        <Text style={styles.headerSubtitle}>{analyses.length} analyses</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#7c3aed" />
          </View>
        ) : analyses.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="time" size={64} color={subtextColor} />
            <Text style={[styles.emptyTitle, { color: textColor }]}>No history yet</Text>
            <Text style={[styles.emptySubtitle, { color: subtextColor }]}>
              Your analyzed photos will appear here
            </Text>
            <TouchableOpacity style={styles.captureButton} onPress={() => router.push('/capture-modal')}>
              <Text style={styles.captureButtonText}>Capture Your First Photo</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.grid}>
            {analyses.map((analysis) => (
              <View key={analysis.id} style={[styles.card, { backgroundColor: cardColor }]}>
                <TouchableOpacity
                  style={styles.imageContainer}
                  onPress={() => router.push(`/analysis/${analysis.id}`)}
                >
                  <Image source={{ uri: analysis.image_url }} style={styles.image} resizeMode="cover" />
                </TouchableOpacity>
                <View style={styles.cardContent}>
                  <Text style={[styles.description, { color: textColor }]} numberOfLines={2}>
                    {analysis.scene_context?.description || 'Photo analysis'}
                  </Text>
                  <View style={styles.cardFooter}>
                    <Text style={[styles.date, { color: subtextColor }]}>{formatDate(analysis.created_at)}</Text>
                    <Text style={styles.wordCount}>{analysis.detected_objects?.length || 0} words</Text>
                  </View>
                  <View style={styles.actions}>
                    <TouchableOpacity
                      style={styles.viewButton}
                      onPress={() => router.push(`/analysis/${analysis.id}`)}
                    >
                      <Ionicons name="eye" size={16} color="#fff" />
                      <Text style={styles.viewButtonText}>View</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(analysis.id)}>
                      <Ionicons name="trash-outline" size={18} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
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
  },
  captureButton: {
    backgroundColor: '#7c3aed',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 24,
  },
  captureButtonText: {
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
    height: 200,
    backgroundColor: '#374151',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  cardContent: {
    padding: 16,
  },
  description: {
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 22,
    minHeight: 44,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  date: {
    fontSize: 13,
  },
  wordCount: {
    fontSize: 13,
    color: '#7c3aed',
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  viewButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#7c3aed',
    paddingVertical: 10,
    borderRadius: 10,
  },
  viewButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  deleteButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ef4444',
    borderRadius: 10,
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

import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthStore } from '@/stores/auth-store';
import { apiClient } from '@/lib/api-client';

interface VocabularyList {
  id: string;
  name: string;
  description?: string;
  color: string;
  is_public: boolean;
  wordCount: number;
  learnedCount: number;
  created_at: string;
}

const COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e',
  '#14b8a6', '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6',
  '#a855f7', '#d946ef', '#ec4899', '#f43f5e',
];

export default function ListsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { isAuthenticated } = useAuthStore();
  const [lists, setLists] = useState<VocabularyList[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newColor, setNewColor] = useState('#6366f1');
  const [isPublic, setIsPublic] = useState(false);
  const [creating, setCreating] = useState(false);

  const bgColor = isDark ? '#0f0f0f' : '#ffffff';
  const cardColor = isDark ? '#1a1a1a' : '#f8fafc';
  const textColor = isDark ? '#ffffff' : '#000000';
  const subtextColor = isDark ? '#9ca3af' : '#6b7280';
  const inputBg = isDark ? '#262626' : '#f3f4f6';
  const borderColor = isDark ? '#374151' : '#e5e7eb';

  const fetchLists = useCallback(async () => {
    try {
      const data = await apiClient.get<VocabularyList[]>('/api/lists');
      setLists(data || []);
    } catch (error) {
      console.error('Failed to fetch lists:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchLists();
    }
  }, [isAuthenticated, fetchLists]);

  const handleCreate = async () => {
    if (!newName.trim()) return;

    setCreating(true);
    try {
      await apiClient.post('/api/lists', {
        name: newName.trim(),
        description: newDescription.trim() || undefined,
        color: newColor,
        isPublic,
      });

      setIsCreateOpen(false);
      setNewName('');
      setNewDescription('');
      setNewColor('#6366f1');
      setIsPublic(false);
      fetchLists();
    } catch (error) {
      Alert.alert('Error', 'Failed to create list');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    Alert.alert(
      'Delete List',
      'Are you sure you want to delete this list?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.delete(`/api/lists/${id}`);
              fetchLists();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete list');
            }
          },
        },
      ]
    );
  };

  if (!isAuthenticated) {
    return (
      <View style={[styles.container, { backgroundColor: bgColor, justifyContent: 'center', alignItems: 'center' }]}>
        <Ionicons name="list" size={64} color="#7c3aed" />
        <Text style={[styles.emptyTitle, { color: textColor }]}>Sign in to view lists</Text>
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
        <Text style={styles.headerTitle}>My Lists</Text>
        <Text style={styles.headerSubtitle}>
          {lists.length} vocabulary {lists.length === 1 ? 'list' : 'lists'}
        </Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#7c3aed" />
          </View>
        ) : lists.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="list" size={64} color={subtextColor} />
            <Text style={[styles.emptyTitle, { color: textColor }]}>No lists yet</Text>
            <Text style={[styles.emptySubtitle, { color: subtextColor }]}>
              Create lists to organize your vocabulary
            </Text>
            <TouchableOpacity
              style={styles.createFirstButton}
              onPress={() => setIsCreateOpen(true)}
            >
              <Ionicons name="add" size={20} color="#fff" />
              <Text style={styles.createFirstText}>Create Your First List</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {lists.map((list) => (
              <TouchableOpacity
                key={list.id}
                style={[styles.listCard, { backgroundColor: cardColor }]}
                onPress={() => router.push(`/list/${list.id}`)}
              >
                <View style={[styles.listColor, { backgroundColor: list.color }]} />
                <View style={styles.listContent}>
                  <Text style={[styles.listName, { color: textColor }]} numberOfLines={1}>
                    {list.name}
                  </Text>
                  {list.description && (
                    <Text style={[styles.listDesc, { color: subtextColor }]} numberOfLines={1}>
                      {list.description}
                    </Text>
                  )}
                  <View style={styles.listStats}>
                    <Text style={[styles.listStatsText, { color: subtextColor }]}>
                      {list.wordCount} words • {list.learnedCount} learned
                    </Text>
                    {list.is_public && (
                      <View style={styles.publicBadge}>
                        <Ionicons name="earth" size={12} color="#7c3aed" />
                        <Text style={styles.publicText}>Public</Text>
                      </View>
                    )}
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDelete(list.id)}
                >
                  <Ionicons name="trash-outline" size={20} color="#ef4444" />
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
            <View style={{ height: 100 }} />
          </>
        )}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setIsCreateOpen(true)}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Create Modal */}
      <Modal
        visible={isCreateOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsCreateOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: cardColor }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: textColor }]}>Create List</Text>
              <TouchableOpacity onPress={() => setIsCreateOpen(false)}>
                <Ionicons name="close" size={24} color={subtextColor} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={[styles.inputLabel, { color: textColor }]}>Name</Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: inputBg, color: textColor, borderColor }]}
                placeholder="e.g., HSK 3 Words"
                placeholderTextColor={subtextColor}
                value={newName}
                onChangeText={setNewName}
                maxLength={100}
              />

              <Text style={[styles.inputLabel, { color: textColor, marginTop: 16 }]}>
                Description (optional)
              </Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: inputBg, color: textColor, borderColor, height: 80 }]}
                placeholder="What is this list for?"
                placeholderTextColor={subtextColor}
                value={newDescription}
                onChangeText={setNewDescription}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />

              <Text style={[styles.inputLabel, { color: textColor, marginTop: 16 }]}>Color</Text>
              <View style={styles.colorGrid}>
                {COLORS.map((color) => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorButton,
                      { backgroundColor: color },
                      newColor === color && styles.colorButtonSelected,
                    ]}
                    onPress={() => setNewColor(color)}
                  >
                    {newColor === color && (
                      <Ionicons name="checkmark" size={16} color="#fff" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.publicToggle}>
                <View>
                  <Text style={[styles.inputLabel, { color: textColor, marginTop: 0 }]}>
                    Make Public
                  </Text>
                  <Text style={[styles.publicHint, { color: subtextColor }]}>
                    Others can view this list
                  </Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.toggle,
                    isPublic && { backgroundColor: '#7c3aed' },
                  ]}
                  onPress={() => setIsPublic(!isPublic)}
                >
                  <View style={[styles.toggleKnob, isPublic && styles.toggleKnobActive]} />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[
                  styles.createButton,
                  { backgroundColor: '#7c3aed' },
                  (!newName.trim() || creating) && styles.createButtonDisabled,
                ]}
                onPress={handleCreate}
                disabled={!newName.trim() || creating}
              >
                {creating ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.createButtonText}>Create List</Text>
                )}
              </TouchableOpacity>

              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  listCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
  },
  listColor: {
    width: 6,
    height: '100%',
  },
  listContent: {
    flex: 1,
    padding: 16,
  },
  listName: {
    fontSize: 16,
    fontWeight: '600',
  },
  listDesc: {
    fontSize: 13,
    marginTop: 2,
  },
  listStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  listStatsText: {
    fontSize: 12,
  },
  publicBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(124, 58, 237, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  publicText: {
    fontSize: 11,
    color: '#7c3aed',
    fontWeight: '500',
  },
  deleteButton: {
    padding: 16,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  colorButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorButtonSelected: {
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  publicToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  publicHint: {
    fontSize: 12,
    marginTop: 2,
  },
  toggle: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#6b7280',
    padding: 2,
  },
  toggleKnob: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  toggleKnobActive: {
    transform: [{ translateX: 22 }],
  },
  createButton: {
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  createButtonDisabled: {
    opacity: 0.5,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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

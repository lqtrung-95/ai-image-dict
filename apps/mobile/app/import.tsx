import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthStore } from '@/stores/auth-store';
import { apiClient } from '@/lib/api-client';

type ImportStep = 'select' | 'preview';
type ImportType = 'url' | 'text';

interface ExtractedWord {
  zh: string;
  pinyin: string;
  en: string;
  example?: string;
  hskLevel?: number;
}

interface ImportResult {
  importId: string;
  sourceTitle: string;
  preview: ExtractedWord[];
}

export default function ImportScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { isAuthenticated } = useAuthStore();
  const [step, setStep] = useState<ImportStep>('select');
  const [importType, setImportType] = useState<ImportType>('url');
  const [source, setSource] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [selectedWords, setSelectedWords] = useState<Set<number>>(new Set());

  const bgColor = isDark ? '#0f0f0f' : '#ffffff';
  const cardColor = isDark ? '#1a1a1a' : '#f8fafc';
  const textColor = isDark ? '#ffffff' : '#000000';
  const subtextColor = isDark ? '#9ca3af' : '#6b7280';
  const inputBg = isDark ? '#262626' : '#f3f4f6';
  const borderColor = isDark ? '#374151' : '#e5e7eb';

  if (!isAuthenticated) {
    return (
      <View style={[styles.container, { backgroundColor: bgColor, justifyContent: 'center', alignItems: 'center' }]}>
        <Ionicons name="download" size={64} color="#7c3aed" />
        <Text style={[styles.emptyTitle, { color: textColor }]}>Sign in to import</Text>
        <TouchableOpacity style={styles.loginButton} onPress={() => router.push('/(auth)/login')}>
          <Text style={styles.loginButtonText}>Sign In</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleExtract = async () => {
    if (!source.trim()) {
      Alert.alert('Error', `Please enter ${importType === 'url' ? 'a URL' : 'text'}`);
      return;
    }

    setLoading(true);
    try {
      const data = await apiClient.post<ImportResult>('/api/import', {
        type: importType,
        source: source.trim(),
      });

      if (!data.preview || data.preview.length === 0) {
        Alert.alert('No Vocabulary', 'No vocabulary found in the content');
        return;
      }

      setImportResult(data);
      setSelectedWords(new Set(data.preview.map((_, i) => i)));
      setStep('preview');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to extract vocabulary');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!importResult) return;

    const wordsToSave = importResult.preview.filter((_, i) => selectedWords.has(i));
    if (wordsToSave.length === 0) {
      Alert.alert('Error', 'Please select at least one word');
      return;
    }

    setSaving(true);
    try {
      await apiClient.post('/api/import/save', {
        importId: importResult.importId,
        words: wordsToSave,
      });

      Alert.alert('Success', `Saved ${wordsToSave.length} words to your vocabulary`, [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save vocabulary');
    } finally {
      setSaving(false);
    }
  };

  const toggleWord = (index: number) => {
    const newSelected = new Set(selectedWords);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedWords(newSelected);
  };

  const selectAll = () => {
    if (importResult) {
      setSelectedWords(new Set(importResult.preview.map((_, i) => i)));
    }
  };

  const deselectAll = () => {
    setSelectedWords(new Set());
  };

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => step === 'preview' ? setStep('select') : router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Import Vocabulary</Text>
        <Text style={styles.headerSubtitle}>
          {step === 'select' ? 'Extract from URL or text' : `${selectedWords.size} words selected`}
        </Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {step === 'select' ? (
          <>
            {/* Type Selector */}
            <View style={[styles.typeSelector, { backgroundColor: inputBg }]}>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  importType === 'url' && styles.typeButtonActive,
                ]}
                onPress={() => setImportType('url')}
              >
                <Ionicons
                  name="link"
                  size={20}
                  color={importType === 'url' ? '#fff' : subtextColor}
                />
                <Text
                  style={[
                    styles.typeButtonText,
                    importType === 'url' && styles.typeButtonTextActive,
                  ]}
                >
                  URL
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  importType === 'text' && styles.typeButtonActive,
                ]}
                onPress={() => setImportType('text')}
              >
                <Ionicons
                  name="document-text"
                  size={20}
                  color={importType === 'text' ? '#fff' : subtextColor}
                />
                <Text
                  style={[
                    styles.typeButtonText,
                    importType === 'text' && styles.typeButtonTextActive,
                  ]}
                >
                  Text
                </Text>
              </TouchableOpacity>
            </View>

            {/* Input */}
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: textColor }]}>
                {importType === 'url' ? 'Webpage URL' : 'Chinese Text'}
              </Text>
              {importType === 'url' ? (
                <TextInput
                  style={[
                    styles.textInput,
                    { backgroundColor: inputBg, color: textColor, borderColor },
                  ]}
                  placeholder="https://example.com/article"
                  placeholderTextColor={subtextColor}
                  value={source}
                  onChangeText={setSource}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                />
              ) : (
                <TextInput
                  style={[
                    styles.textArea,
                    { backgroundColor: inputBg, color: textColor, borderColor },
                  ]}
                  placeholder="Paste Chinese text here (at least 50 characters)..."
                  placeholderTextColor={subtextColor}
                  value={source}
                  onChangeText={setSource}
                  multiline
                  numberOfLines={8}
                  textAlignVertical="top"
                />
              )}
            </View>

            {/* Tips */}
            <View style={[styles.tipsCard, { backgroundColor: cardColor }]}>
              <View style={styles.tipsHeader}>
                <Ionicons name="sparkles" size={20} color="#f59e0b" />
                <Text style={[styles.tipsTitle, { color: textColor }]}>Tips for best results</Text>
              </View>
              <Text style={[styles.tipItem, { color: subtextColor }]}>
                • YouTube videos with Chinese subtitles work best
              </Text>
              <Text style={[styles.tipItem, { color: subtextColor }]}>
                • For articles, choose content with natural Chinese text
              </Text>
              <Text style={[styles.tipItem, { color: subtextColor }]}>
                • Longer content yields more vocabulary words
              </Text>
              <Text style={[styles.tipItem, { color: subtextColor }]}>
                • You can import up to 10 sources per hour
              </Text>
            </View>
          </>
        ) : (
          <>
            {/* Preview Header */}
            <View style={styles.previewHeader}>
              <Text style={[styles.previewTitle, { color: textColor }]}>
                {importResult?.sourceTitle}
              </Text>
              <View style={styles.selectionButtons}>
                <TouchableOpacity onPress={selectAll} style={styles.selectionButton}>
                  <Text style={styles.selectionButtonText}>Select All</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={deselectAll} style={styles.selectionButton}>
                  <Text style={styles.selectionButtonText}>Deselect All</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Words List */}
            {importResult?.preview.map((word, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.wordCard,
                  { backgroundColor: cardColor, borderColor },
                  selectedWords.has(index) && styles.wordCardSelected,
                ]}
                onPress={() => toggleWord(index)}
              >
                <View style={styles.wordHeader}>
                  <Text style={styles.chineseText}>{word.zh}</Text>
                  <Ionicons
                    name={selectedWords.has(index) ? 'checkmark-circle' : 'ellipse-outline'}
                    size={24}
                    color={selectedWords.has(index) ? '#7c3aed' : subtextColor}
                  />
                </View>
                <Text style={[styles.pinyinText, { color: subtextColor }]}>{word.pinyin}</Text>
                <Text style={[styles.englishText, { color: textColor }]}>{word.en}</Text>
                {word.example && (
                  <Text style={[styles.exampleText, { color: subtextColor }]} numberOfLines={2}>
                    "{word.example}"
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Button */}
      <View style={[styles.bottomBar, { backgroundColor: cardColor, borderTopColor: borderColor }]}>
        {step === 'select' ? (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#7c3aed' }]}
            onPress={handleExtract}
            disabled={loading || !source.trim()}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="sparkles" size={20} color="#fff" />
                <Text style={styles.actionButtonText}>Extract Vocabulary</Text>
              </>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#10b981' }]}
            onPress={handleSave}
            disabled={saving || selectedWords.size === 0}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="save" size={20} color="#fff" />
                <Text style={styles.actionButtonText}>
                  Save {selectedWords.size} Words
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}
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
  // Type Selector
  typeSelector: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
  },
  typeButtonActive: {
    backgroundColor: '#7c3aed',
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  typeButtonTextActive: {
    color: '#fff',
  },
  // Input
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  textInput: {
    height: 50,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  textArea: {
    height: 200,
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    lineHeight: 22,
  },
  // Tips
  tipsCard: {
    borderRadius: 16,
    padding: 16,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  tipItem: {
    fontSize: 14,
    marginBottom: 6,
    lineHeight: 20,
  },
  // Preview
  previewHeader: {
    marginBottom: 16,
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  selectionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  selectionButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  selectionButtonText: {
    color: '#7c3aed',
    fontSize: 14,
    fontWeight: '600',
  },
  // Word Card
  wordCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
  },
  wordCardSelected: {
    borderColor: '#7c3aed',
    backgroundColor: 'rgba(124, 58, 237, 0.1)',
  },
  wordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  chineseText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#7c3aed',
  },
  pinyinText: {
    fontSize: 14,
    marginBottom: 4,
  },
  englishText: {
    fontSize: 16,
  },
  exampleText: {
    fontSize: 13,
    fontStyle: 'italic',
    marginTop: 8,
  },
  // Bottom Bar
  bottomBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 30,
    borderTopWidth: 1,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 50,
    borderRadius: 12,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Empty State
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
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

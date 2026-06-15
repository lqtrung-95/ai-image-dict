'use client';

import { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Download } from 'lucide-react';
import { debounce } from '@/lib/utils';
import { WordDetailModal } from '@/components/vocabulary/WordDetailModal';
import { AnkiExportButton } from '@/components/export/anki-export-button';
import { useSpeech } from '@/hooks/useSpeech';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface VocabularyItem {
  id: string;
  wordZh: string;
  wordPinyin: string;
  wordEn: string;
  exampleSentence?: string | null;
  isLearned: boolean;
  createdAt: string;
  photoUrl?: string | null;
  photoDate?: string | null;
  analysisId?: string | null;
  hskLevel?: number | null;
  nextReviewDate?: string | null;
  easinessFactor?: number;
  repetitions?: number;
  correctStreak?: number;
}

const HSK_LEVELS = [1, 2, 3, 4, 5, 6] as const;

function getMastery(item: VocabularyItem): number {
  if (item.isLearned) return Math.min(100, 60 + (item.correctStreak ?? 0) * 8);
  return Math.min(55, (item.correctStreak ?? 0) * 10);
}

function getMasteryLabel(pct: number) {
  if (pct >= 85) return { label: 'Excellent', color: 'text-[#76ffbb]' };
  if (pct >= 50) return { label: 'Improving', color: 'text-yellow-400' };
  return { label: 'Weak', color: 'text-red-400' };
}

export default function VocabularyPage() {
  const [items, setItems] = useState<VocabularyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [total, setTotal] = useState(0);
  const [selectedWord, setSelectedWord] = useState<VocabularyItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [hskFilter, setHskFilter] = useState<Set<number>>(new Set());
  const [masteryFilter, setMasteryFilter] = useState<'all' | 'excellent' | 'improving' | 'weak'>('all');
  const { speak } = useSpeech();

  const fetchVocabulary = useCallback(async (search = '') => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('q', search);
      const res = await fetch(`/api/vocabulary?${params}`);
      if (res.ok) {
        const data = await res.json();
        setItems(data.items ?? []);
        setTotal(data.total ?? 0);
      }
    } catch (err) {
      console.error('Failed to fetch vocabulary:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchVocabulary(); }, [fetchVocabulary]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSearch = useCallback(
    debounce((q: string) => fetchVocabulary(q), 300),
    [fetchVocabulary]
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    debouncedSearch(e.target.value);
  };

  const toggleHsk = (level: number) => {
    setHskFilter(prev => {
      const next = new Set(prev);
      next.has(level) ? next.delete(level) : next.add(level);
      return next;
    });
  };

  const handleDelete = async (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
    setTotal(prev => prev - 1);
    try { await fetch(`/api/vocabulary/${id}`, { method: 'DELETE' }); }
    catch { fetchVocabulary(searchQuery); }
  };

  const filtered = items.filter(item => {
    if (hskFilter.size > 0 && !hskFilter.has(item.hskLevel ?? 0)) return false;
    if (masteryFilter !== 'all') {
      const pct = getMastery(item);
      if (masteryFilter === 'excellent' && pct < 85) return false;
      if (masteryFilter === 'improving' && (pct < 50 || pct >= 85)) return false;
      if (masteryFilter === 'weak' && pct >= 50) return false;
    }
    return true;
  });

  return (
    <div className="p-6 max-w-[1440px] mx-auto">
      {/* Page header */}
      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-[#e0e2e8] tracking-tight">Vocabulary Library</h1>
          <p className="text-[#bacbbe] mt-1 text-sm">
            {total} words · {items.filter(i => i.isLearned).length} learned
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#bacbbe]" />
            <Input
              type="text"
              placeholder="Search characters, pinyin..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="pl-9 w-64 bg-[#1c2024] border-white/5 text-[#e0e2e8] placeholder:text-[#849589] focus:ring-1 focus:ring-[#76ffbb]/50"
            />
          </div>
          <AnkiExportButton />
          <Link href="/practice">
            <Button className="bg-[#76ffbb] text-[#003822] font-semibold hover:opacity-90 gap-2">
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>bolt</span>
              Start Review
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Filter sidebar */}
        <aside className="hidden lg:block col-span-3 space-y-4">
          {/* HSK filter */}
          <div className="bg-[#181c20] border border-white/5 rounded-xl p-5">
            <h3 className="font-semibold text-[#e0e2e8] mb-4">HSK Level</h3>
            <div className="grid grid-cols-3 gap-2">
              {HSK_LEVELS.map(level => (
                <button
                  key={level}
                  onClick={() => toggleHsk(level)}
                  className={cn(
                    'py-2 rounded-lg text-sm font-mono transition-all',
                    hskFilter.has(level)
                      ? 'bg-[#76ffbb]/10 border border-[#76ffbb] text-[#76ffbb]'
                      : 'bg-[#1c2024] border border-white/10 text-[#bacbbe] hover:border-[#76ffbb]/50'
                  )}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          {/* Mastery filter */}
          <div className="bg-[#181c20] border border-white/5 rounded-xl p-5">
            <h3 className="font-semibold text-[#e0e2e8] mb-4">Mastery</h3>
            <div className="space-y-2">
              {([
                ['all', 'All words', ''],
                ['excellent', 'Excellent', '85%+'],
                ['improving', 'Improving', '50–84%'],
                ['weak', 'Weak', '<50%'],
              ] as const).map(([val, label, hint]) => (
                <label key={val} className="flex items-center justify-between cursor-pointer group">
                  <div className="flex items-center gap-3">
                    <div
                      onClick={() => setMasteryFilter(val)}
                      className={cn(
                        'w-4 h-4 rounded-full border-2 transition-all',
                        masteryFilter === val
                          ? 'border-[#76ffbb] bg-[#76ffbb]'
                          : 'border-white/20 group-hover:border-[#76ffbb]/50'
                      )}
                    />
                    <span className="text-sm text-[#bacbbe]">{label}</span>
                  </div>
                  {hint && <span className="text-xs text-[#849589]">{hint}</span>}
                </label>
              ))}
            </div>
            {(hskFilter.size > 0 || masteryFilter !== 'all') && (
              <button
                onClick={() => { setHskFilter(new Set()); setMasteryFilter('all'); }}
                className="mt-4 w-full text-xs text-[#849589] hover:text-[#bacbbe] transition-colors"
              >
                Reset all filters
              </button>
            )}
          </div>

          {/* Quick stats */}
          <div className="bg-[#181c20] border border-white/5 rounded-xl p-5 relative overflow-hidden group">
            <h4 className="font-semibold text-[#76ffbb] text-sm">Showing</h4>
            <p className="text-4xl font-bold text-[#e0e2e8] mt-1">
              {filtered.length}
              <span className="text-lg font-normal text-[#bacbbe] ml-2">words</span>
            </p>
            <p className="text-xs text-[#849589] mt-1">of {total} total</p>
            <span className="material-symbols-outlined absolute -right-2 -bottom-2 text-[80px] text-[#76ffbb]/5 group-hover:text-[#76ffbb]/10 transition-all select-none">
              menu_book
            </span>
          </div>
        </aside>

        {/* Main table */}
        <div className="col-span-12 lg:col-span-9 bg-[#181c20] border border-white/5 rounded-xl overflow-hidden">
          {loading ? (
            <div className="p-8 space-y-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-12 bg-[#1c2024] rounded-lg animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <span className="material-symbols-outlined text-5xl text-[#849589] mb-4">menu_book</span>
              <h2 className="text-lg font-semibold text-[#e0e2e8] mb-2">
                {searchQuery ? 'No words found' : 'No vocabulary yet'}
              </h2>
              <p className="text-sm text-[#bacbbe] mb-6">
                {searchQuery ? 'Try a different search term or clear filters' : 'Start capturing photos to build your vocabulary'}
              </p>
              {!searchQuery && (
                <Link href="/capture">
                  <Button className="bg-[#76ffbb] text-[#003822] font-semibold hover:opacity-90">
                    Capture Photo
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/5 bg-[#101417]/50">
                    <th className="px-5 py-4 text-xs font-semibold text-[#76ffbb] uppercase tracking-widest">Character</th>
                    <th className="px-5 py-4 text-xs font-semibold text-[#76ffbb] uppercase tracking-widest">Pinyin</th>
                    <th className="px-5 py-4 text-xs font-semibold text-[#76ffbb] uppercase tracking-widest hidden md:table-cell">Definition</th>
                    <th className="px-5 py-4 text-xs font-semibold text-[#76ffbb] uppercase tracking-widest hidden lg:table-cell">HSK</th>
                    <th className="px-5 py-4 text-xs font-semibold text-[#76ffbb] uppercase tracking-widest hidden lg:table-cell">Mastery</th>
                    <th className="px-5 py-4" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filtered.map(item => {
                    const mastery = getMastery(item);
                    const { label: masteryLabel, color: masteryColor } = getMasteryLabel(mastery);
                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-[#76ffbb]/5 transition-colors cursor-pointer group"
                        onClick={() => { setSelectedWord(item); setModalOpen(true); }}
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl font-bold text-[#e0e2e8]">{item.wordZh}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-sm text-[#bacbbe] font-mono">{item.wordPinyin}</td>
                        <td className="px-5 py-4 text-sm text-[#e0e2e8] max-w-xs truncate hidden md:table-cell">
                          {item.wordEn}
                        </td>
                        <td className="px-5 py-4 hidden lg:table-cell">
                          {item.hskLevel && (
                            <span className="px-2 py-0.5 bg-[#272a2e] border border-white/5 rounded text-xs text-[#bacbbe] font-mono">
                              HSK {item.hskLevel}
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4 hidden lg:table-cell">
                          <div className="flex flex-col gap-1 w-28">
                            <div className="flex justify-between text-xs">
                              <span className={masteryColor}>{masteryLabel}</span>
                              <span className="text-[#849589]">{mastery}%</span>
                            </div>
                            <div className="h-1 bg-[#272a2e] rounded-full overflow-hidden">
                              <div
                                className="h-full bg-[#76ffbb] rounded-full transition-all"
                                style={{ width: `${mastery}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={e => { e.stopPropagation(); speak(item.wordZh); }}
                              className="p-1.5 rounded-lg hover:bg-[#272a2e] text-[#bacbbe] hover:text-[#76ffbb] transition-colors"
                              title="Pronounce"
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>volume_up</span>
                            </button>
                            <button
                              onClick={e => { e.stopPropagation(); handleDelete(item.id); }}
                              className="p-1.5 rounded-lg hover:bg-red-900/30 text-[#bacbbe] hover:text-red-400 transition-colors"
                              title="Delete"
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <WordDetailModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        word={selectedWord ? {
          id: selectedWord.id,
          wordZh: selectedWord.wordZh,
          wordPinyin: selectedWord.wordPinyin,
          wordEn: selectedWord.wordEn,
          exampleSentence: selectedWord.exampleSentence || undefined,
          hskLevel: selectedWord.hskLevel,
          nextReviewDate: selectedWord.nextReviewDate,
          easinessFactor: selectedWord.easinessFactor,
          repetitions: selectedWord.repetitions,
          correctStreak: selectedWord.correctStreak,
          isLearned: selectedWord.isLearned,
        } : null}
      />
    </div>
  );
}

'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { VocabularyCard } from '@/components/vocabulary/VocabularyCard';
import { VocabularyListSkeleton } from '@/components/vocabulary/VocabularyCardSkeleton';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Folder, BookOpen } from 'lucide-react';

interface Collection {
  id: string;
  name: string;
  color: string;
}

interface VocabularyItem {
  id: string;
  word_zh: string;
  word_pinyin: string;
  word_en: string;
  is_learned: boolean;
}

export default function CollectionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [collection, setCollection] = useState<Collection | null>(null);
  const [items, setItems] = useState<VocabularyItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch collection details
        const collectionRes = await fetch(`/api/collections/${id}`);
        if (!collectionRes.ok) {
          router.push('/collections');
          return;
        }
        const collectionData = await collectionRes.json();
        setCollection(collectionData);

        // Fetch vocabulary in this collection
        const vocabRes = await fetch(`/api/vocabulary?collection=${id}`);
        if (vocabRes.ok) {
          const vocabData = await vocabRes.json();
          setItems(vocabData.items || []);
        }
      } catch (error) {
        console.error('Failed to fetch collection:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, router]);

  const handleToggleLearned = async (itemId: string) => {
    const item = items.find((i) => i.id === itemId);
    if (!item) return;

    setItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, is_learned: !i.is_learned } : i))
    );

    try {
      await fetch(`/api/vocabulary/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isLearned: !item.is_learned }),
      });
    } catch {
      setItems((prev) =>
        prev.map((i) => (i.id === itemId ? { ...i, is_learned: item.is_learned } : i))
      );
    }
  };

  const handleDelete = async (itemId: string) => {
    setItems((prev) => prev.filter((i) => i.id !== itemId));

    try {
      await fetch(`/api/vocabulary/${itemId}`, { method: 'DELETE' });
    } catch {
      // Refetch on error
      const vocabRes = await fetch(`/api/vocabulary?collection=${id}`);
      if (vocabRes.ok) {
        const vocabData = await vocabRes.json();
        setItems(vocabData.items || []);
      }
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="h-8 w-48 bg-slate-700 rounded animate-pulse mb-6" />
        <VocabularyListSkeleton count={6} />
      </div>
    );
  }

  if (!collection) {
    return null;
  }

  const learnedCount = items.filter((i) => i.is_learned).length;

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <div className="mb-6">
        <Link href="/collections">
          <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white -ml-2 mb-2">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Collections
          </Button>
        </Link>

        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${collection.color}20` }}
          >
            <Folder className="w-6 h-6" style={{ color: collection.color }} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">{collection.name}</h1>
            <p className="text-slate-400">
              {items.length} words · {learnedCount} learned
            </p>
          </div>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800 flex items-center justify-center">
            <BookOpen className="w-8 h-8 text-slate-500" />
          </div>
          <h2 className="text-xl font-medium text-white mb-2">No words yet</h2>
          <p className="text-slate-400 mb-6">
            Add words to this collection from the vocabulary page
          </p>
          <Link href="/vocabulary">
            <Button className="bg-purple-600 hover:bg-purple-700">
              Go to Vocabulary
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <VocabularyCard
              key={item.id}
              id={item.id}
              wordZh={item.word_zh}
              wordPinyin={item.word_pinyin}
              wordEn={item.word_en}
              isLearned={item.is_learned}
              isSaved={true}
              onToggleLearned={handleToggleLearned}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

